import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const getEnv = (key: string) => {
      const val = Deno.env.get(key);
      if (!val) {
        console.error(`Missing environment variable: ${key}`);
        throw new Error(`Missing environment variable: ${key}`);
      }
      return val;
    };

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const paystackSecretKey = getEnv("PAYSTACK_SECRET_KEY");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get reference
    const url = new URL(req.url);
    let reference = url.searchParams.get("reference");

    if (!reference && req.method === "POST") {
      try {
        const body = await req.json();
        reference = body?.reference;
      } catch {
        // ignore
      }
    }

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      return new Response(
        JSON.stringify({ error: paystackData.message || "Verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transaction = paystackData.data;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    if (transaction.status === "success" && transaction.metadata?.type === "property_boost") {
      const { boost_id, property_id, days, company_id, property_title } = transaction.metadata;

      // Calculate expiry
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + Number(days));

      // Activate the boost
      const { error: updateError } = await adminSupabase
        .from("property_boosts")
        .update({
          status: "active",
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", boost_id);

      if (updateError) {
        console.error("Boost update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to activate boost" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Trigger property priority recalculation
      await adminSupabase
        .from("properties")
        .update({ updated_at: now.toISOString() })
        .eq("id", property_id);

      // Create user notification
      const { data: company } = await adminSupabase
        .from("companies")
        .select("user_id")
        .eq("id", company_id)
        .single();

      if (company?.user_id) {
        await adminSupabase.from("notifications").insert({
          user_id: company.user_id,
          company_id,
          type: "boost",
          title: "Property Boost Activated! 🚀",
          message: `Your property "${property_title}" is now boosted for ${days} days and will appear at the top of search results.`,
          metadata: { boost_id, property_id, days, expires_at: expiresAt.toISOString() },
        });
      }

      // Create admin notification (optional - may not exist)
      try {
        await adminSupabase.from("admin_notifications_log").insert({
          type: "boost",
          subject: `Property Boost: ₦${transaction.amount / 100} for ${days} days`,
          recipient: "admin",
          status: "success",
          metadata: {
            boost_id,
            property_id,
            property_title,
            company_id,
            days,
            amount: transaction.amount / 100,
            reference,
          },
        });
      } catch (adminLogError) {
        // Non-critical - log and continue
        console.log("Admin notification log skipped (table may not exist):", adminLogError);
      }

      console.log(`[Boost] Activated: ${boost_id} for ${days} days, expires ${expiresAt.toISOString()}`);

      return new Response(
        JSON.stringify({
          success: true,
          status: "active",
          days,
          expires_at: expiresAt.toISOString(),
          property_title,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment not successful
    if (transaction.metadata?.boost_id) {
      await adminSupabase
        .from("property_boosts")
        .update({ status: "rejected", admin_note: `Payment failed: ${transaction.gateway_response}` })
        .eq("id", transaction.metadata.boost_id);
    }

    return new Response(
      JSON.stringify({
        success: false,
        status: transaction.status,
        message: transaction.gateway_response,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Boost verify error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
