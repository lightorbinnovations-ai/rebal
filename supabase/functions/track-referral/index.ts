import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrackReferralRequest {
  action: "visit" | "convert";
  referral_code: string;
  visitor_fingerprint?: string;
  landing_page?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  // For conversion
  company_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body: TrackReferralRequest = await req.json();
    const { action, referral_code, visitor_fingerprint, landing_page, utm_source, utm_medium, utm_campaign, company_id } = body;

    if (!referral_code) {
      return new Response(
        JSON.stringify({ error: "referral_code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client IP and user agent
    const ip_address = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("cf-connecting-ip") || 
                       "unknown";
    const user_agent = req.headers.get("user-agent") || "unknown";

    // Generate a simple fingerprint if not provided
    const fingerprint = visitor_fingerprint || 
      await generateFingerprint(ip_address, user_agent);

    // Find the referrer company by referral code
    const { data: referrerCompany, error: referrerError } = await supabase
      .from("companies")
      .select("id, name, referral_code")
      .eq("referral_code", referral_code)
      .maybeSingle();

    if (referrerError) {
      console.error("Error finding referrer:", referrerError);
    }

    if (action === "visit") {
      // Check for duplicate visit (same fingerprint + code within 24 hours)
      const { data: existingVisit } = await supabase
        .from("referral_visits")
        .select("id")
        .eq("referral_code", referral_code)
        .eq("visitor_fingerprint", fingerprint)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (existingVisit) {
        console.log(`Duplicate visit detected for ${referral_code}, fingerprint: ${fingerprint}`);
        return new Response(
          JSON.stringify({ success: true, message: "Visit already tracked", visit_id: existingVisit.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert new visit
      const { data: visit, error: visitError } = await supabase
        .from("referral_visits")
        .insert({
          referral_code,
          visitor_fingerprint: fingerprint,
          ip_address,
          user_agent,
          landing_page,
          utm_source,
          utm_medium,
          utm_campaign,
        })
        .select("id")
        .single();

      if (visitError) {
        console.error("Error inserting visit:", visitError);
        throw visitError;
      }

      // Log event
      await supabase.from("referral_events").insert({
        event_type: "visit",
        referral_code,
        referrer_company_id: referrerCompany?.id || null,
        visitor_fingerprint: fingerprint,
        metadata: {
          landing_page,
          utm_source,
          utm_medium,
          utm_campaign,
          ip_hash: await hashString(ip_address),
        },
      });

      console.log(`Referral visit tracked: ${referral_code}, visit_id: ${visit.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          visit_id: visit.id,
          referrer_name: referrerCompany?.name || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "convert") {
      if (!company_id) {
        return new Response(
          JSON.stringify({ error: "company_id is required for conversion" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Ensure we have a referrer
      if (!referrerCompany?.id) {
        console.log(`No referrer found for code: ${referral_code}`);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid referral code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if this company was already referred (prevent duplicates)
      const { data: existingReferral } = await supabase
        .from("referrals")
        .select("id")
        .eq("referred_id", company_id)
        .maybeSingle();

      if (existingReferral) {
        console.log(`Company ${company_id} already has a referral record`);
        return new Response(
          JSON.stringify({ success: true, message: "Referral already recorded" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find the most recent unconverted visit for this fingerprint + code
      const { data: visit } = await supabase
        .from("referral_visits")
        .select("id")
        .eq("referral_code", referral_code)
        .eq("visitor_fingerprint", fingerprint)
        .is("converted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (visit) {
        // Mark visit as converted
        await supabase
          .from("referral_visits")
          .update({
            converted_at: new Date().toISOString(),
            converted_company_id: company_id,
          })
          .eq("id", visit.id);
      }

      // UPDATE the referred company to link it to the referrer
      const { error: updateError } = await supabase
        .from("companies")
        .update({ referred_by: referrerCompany.id })
        .eq("id", company_id);

      if (updateError) {
        console.error("Error updating referred_by:", updateError);
      }

      // CREATE the referral record in the referrals table
      // NOTE: reward_amount starts at 0 - referrer earns 10% ONLY when referred user makes payment
      const { error: referralError } = await supabase
        .from("referrals")
        .insert({
          referrer_id: referrerCompany.id,
          referred_id: company_id,
          status: "pending", // Stays pending until referred user makes a qualifying payment
          reward_amount: 0, // No signup bonus - commission earned on payments only
        });

      if (referralError) {
        console.error("Error creating referral record:", referralError);
        // Don't throw - still log the event
      } else {
        console.log(`Referral record created: ${referrerCompany.id} -> ${company_id} (pending first payment)`);
      }

      // Log conversion event
      await supabase.from("referral_events").insert({
        event_type: "signup",
        referral_code,
        referrer_company_id: referrerCompany.id,
        referred_company_id: company_id,
        visitor_fingerprint: fingerprint,
        metadata: {
          visit_id: visit?.id || null,
          attribution: visit ? "tracked_visit" : "direct_code",
        },
      });

      console.log(`Referral conversion tracked: ${referral_code} -> company ${company_id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          converted: true,
          referrer_name: referrerCompany.name,
          visit_attributed: !!visit,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'visit' or 'convert'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in track-referral:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple fingerprint generation from IP + user agent
async function generateFingerprint(ip: string, userAgent: string): Promise<string> {
  const data = `${ip}|${userAgent}`;
  return await hashString(data);
}

// Hash a string using SHA-256
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 32);
}
