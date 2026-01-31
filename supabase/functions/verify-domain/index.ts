import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

async function queryDns(domain: string, type: string): Promise<DnsRecord[]> {
  try {
    // Using Cloudflare's DNS-over-HTTPS API for reliable DNS lookups
    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
      {
        headers: {
          "Accept": "application/dns-json",
        },
      }
    );

    if (!response.ok) {
      console.error(`DNS query failed for ${domain} (${type}):`, response.status);
      return [];
    }

    const data = await response.json();
    
    if (!data.Answer) {
      return [];
    }

    return data.Answer.map((answer: any) => ({
      type: type,
      name: answer.name,
      value: answer.data,
    }));
  } catch (error) {
    console.error(`Error querying DNS for ${domain}:`, error);
    return [];
  }
}

async function verifyDomain(
  domain: string,
  verificationToken: string
): Promise<{ isValid: boolean; aRecordValid: boolean; txtRecordValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  let aRecordValid = false;
  let txtRecordValid = false;

  // Check A record
  const aRecords = await queryDns(domain, "A");
  console.log(`A records for ${domain}:`, aRecords);
  
  const expectedIp = "185.158.133.1";
  aRecordValid = aRecords.some(record => record.value === expectedIp);
  
  if (!aRecordValid) {
    errors.push(`A record not pointing to ${expectedIp}. Found: ${aRecords.map(r => r.value).join(", ") || "none"}`);
  }

  // Check TXT record for verification
  const txtDomain = `_rebal.${domain}`;
  const txtRecords = await queryDns(txtDomain, "TXT");
  console.log(`TXT records for ${txtDomain}:`, txtRecords);
  
  const expectedTxt = `rebal_verify=${verificationToken}`;
  txtRecordValid = txtRecords.some(record => {
    // TXT records often come with quotes, so we need to handle that
    const cleanValue = record.value.replace(/^"|"$/g, "");
    return cleanValue === expectedTxt;
  });
  
  if (!txtRecordValid) {
    errors.push(`TXT verification record not found. Expected: ${expectedTxt}`);
  }

  return {
    isValid: aRecordValid && txtRecordValid,
    aRecordValid,
    txtRecordValid,
    errors,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { domainId, verifyAll } = await req.json();

    // If verifyAll is true, check all pending/verifying domains
    if (verifyAll) {
      console.log("Running batch verification for all pending domains...");
      
      const { data: domains, error: fetchError } = await supabase
        .from("custom_domains")
        .select("*")
        .in("status", ["pending", "verifying"]);

      if (fetchError) {
        throw fetchError;
      }

      const results = [];
      for (const domain of domains || []) {
        const verification = await verifyDomain(domain.domain, domain.verification_token);
        
        if (verification.isValid) {
          // Update domain to active
          await supabase
            .from("custom_domains")
            .update({
              status: "active",
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", domain.id);

          // Notify company owner
          const { data: company } = await supabase
            .from("companies")
            .select("user_id, name")
            .eq("id", domain.company_id)
            .single();

          if (company) {
            await supabase.from("notifications").insert({
              user_id: company.user_id,
              company_id: domain.company_id,
              type: "domain",
              title: "Custom Domain Activated! 🎉",
              message: `Your domain ${domain.domain} is now active and serving your company page.`,
              metadata: { domain_id: domain.id, domain: domain.domain },
            });
          }

          results.push({ domain: domain.domain, status: "activated" });
        } else {
          // Update status to verifying if it was pending
          if (domain.status === "pending") {
            await supabase
              .from("custom_domains")
              .update({ status: "verifying", updated_at: new Date().toISOString() })
              .eq("id", domain.id);
          }
          
          results.push({ 
            domain: domain.domain, 
            status: "pending", 
            errors: verification.errors 
          });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single domain verification
    if (!domainId) {
      return new Response(
        JSON.stringify({ error: "domainId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: domain, error: domainError } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("id", domainId)
      .single();

    if (domainError || !domain) {
      return new Response(
        JSON.stringify({ error: "Domain not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying domain: ${domain.domain}`);
    const verification = await verifyDomain(domain.domain, domain.verification_token);

    if (verification.isValid) {
      // Update domain to active
      await supabase
        .from("custom_domains")
        .update({
          status: "active",
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", domain.id);

      // Notify company owner
      const { data: company } = await supabase
        .from("companies")
        .select("user_id, name")
        .eq("id", domain.company_id)
        .single();

      if (company) {
        await supabase.from("notifications").insert({
          user_id: company.user_id,
          company_id: domain.company_id,
          type: "domain",
          title: "Custom Domain Activated! 🎉",
          message: `Your domain ${domain.domain} is now active and serving your company page.`,
          metadata: { domain_id: domain.id, domain: domain.domain },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: "active",
          message: "Domain verified and activated successfully!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Update status to verifying
      await supabase
        .from("custom_domains")
        .update({ status: "verifying", updated_at: new Date().toISOString() })
        .eq("id", domain.id);

      return new Response(
        JSON.stringify({
          success: false,
          status: "verifying",
          aRecordValid: verification.aRecordValid,
          txtRecordValid: verification.txtRecordValid,
          errors: verification.errors,
          message: "DNS records not yet configured correctly. Please check your DNS settings.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Domain verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
