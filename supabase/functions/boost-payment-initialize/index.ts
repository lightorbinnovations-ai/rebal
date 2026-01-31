import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BOOST_PRICE_PER_DAY = 1000; // ₦1,000 per day

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
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

    const userId = user.id;
    const userEmail = user.email;

    const { property_id, days, callback_url } = await req.json();

    if (!property_id || !days || days < 1 || days > 365) {
      return new Response(
        JSON.stringify({ error: "Invalid property_id or days (1-365)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's company
    const { data: company, error: companyError } = await adminSupabase
      .from("companies")
      .select("id, name")
      .eq("user_id", userId)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify property belongs to this company
    const { data: property, error: propertyError } = await adminSupabase
      .from("properties")
      .select("id, title, company_id")
      .eq("id", property_id)
      .single();

    if (propertyError || !property || property.company_id !== company.id) {
      return new Response(
        JSON.stringify({ error: "Property not found or unauthorized" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing active/pending boost
    const { data: existingBoost } = await adminSupabase
      .from("property_boosts")
      .select("id, status")
      .eq("property_id", property_id)
      .in("status", ["active", "pending"])
      .single();

    if (existingBoost) {
      return new Response(
        JSON.stringify({ error: "Property already has an active or pending boost" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = BOOST_PRICE_PER_DAY * days;
    const reference = `BOOST-${property_id.slice(0, 8)}-${Date.now()}`;

    // Create pending boost record
    const { data: boost, error: boostError } = await adminSupabase
      .from("property_boosts")
      .insert({
        property_id,
        company_id: company.id,
        boost_type: "paid",
        status: "pending",
        boost_score: 10,
        amount_paid: amount,
      })
      .select("id")
      .single();

    if (boostError) {
      console.error("Boost creation error:", boostError);
      return new Response(
        JSON.stringify({ error: "Failed to create boost record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Paystack transaction
    const origin = req.headers.get("origin") || "https://rebal.site";
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: userEmail,
        amount: amount * 100, // Paystack uses kobo
        reference,
        callback_url: callback_url || `${origin}/dashboard/properties`,
        metadata: {
          type: "property_boost",
          boost_id: boost.id,
          property_id,
          property_title: property.title,
          company_id: company.id,
          company_name: company.name,
          days,
          amount,
        },
        channels: ["card", "bank", "ussd", "bank_transfer"],
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      // Cleanup failed boost
      await adminSupabase.from("property_boosts").delete().eq("id", boost.id);

      console.error("Paystack error:", paystackData);
      return new Response(
        JSON.stringify({ error: paystackData.message || "Payment initialization failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store reference in boost record
    await adminSupabase
      .from("property_boosts")
      .update({ admin_note: `Payment ref: ${reference}` })
      .eq("id", boost.id);

    console.log(`[Boost] Payment initialized: ${reference} for property ${property_id}, ${days} days, ₦${amount}`);

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
        amount,
        days,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Boost initialize error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
