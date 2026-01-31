import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
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
    const getEnv = (key: string, required = true): string => {
      const value = Deno.env.get(key);
      if (!value && required) {
        console.error(`[CRITICAL] Missing environment variable: ${key}`);
        throw new Error(`Missing configuration: ${key}`);
      }
      return value || "";
    };

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const paystackSecretKey = getEnv("PAYSTACK_SECRET_KEY");

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    // Get request body
    const body = await req.json();
    const { payment_type } = body;

    // Get admin client for database operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's company
    const { data: company, error: companyError } = await adminSupabase
      .from("companies")
      .select("id, name")
      .eq("user_id", userId)
      .single();

    if (companyError || !company) {
      console.error("Company error:", companyError);
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different payment types
    if (payment_type === "domain") {
      // Domain payment flow
      const { domain_request_id, amount, domain_name, callback_url } = body;

      if (!domain_request_id || !amount) {
        return new Response(
          JSON.stringify({ error: "Missing domain payment fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify domain request exists and belongs to company
      const { data: domainRequest, error: domainError } = await adminSupabase
        .from("domain_requests")
        .select("*")
        .eq("id", domain_request_id)
        .eq("company_id", company.id)
        .single();

      if (domainError || !domainRequest) {
        console.error("Domain request error:", domainError);
        return new Response(
          JSON.stringify({ error: "Domain request not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (domainRequest.status !== "price_sent") {
        return new Response(
          JSON.stringify({ error: "Domain request is not awaiting payment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate unique reference for domain payment
      const reference = `DOMAIN-${company.id.slice(0, 8)}-${Date.now()}`;

      // Create payment record for domain
      const { error: paymentError } = await adminSupabase
        .from("payments")
        .insert({
          company_id: company.id,
          paystack_reference: reference,
          amount: amount * 100, // Store in Kobo
          status: "pending",
          metadata: {
            payment_type: "domain",
            domain_request_id: domain_request_id,
            domain_name: domain_name,
          },
          subscription_id: null,
        });

      if (paymentError) {
        console.error("Payment record error:", paymentError);
        return new Response(
          JSON.stringify({ error: "Failed to create payment record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Initialize Paystack transaction for domain
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
          reference: reference,
          callback_url: callback_url || `${origin}/dashboard/domain?payment=success`,
          metadata: {
            company_id: company.id,
            company_name: company.name,
            payment_type: "domain",
            domain_request_id: domain_request_id,
            domain_name: domain_name,
          },
          channels: ["card", "bank", "ussd", "bank_transfer"],
        }),
      });

      const paystackData = await paystackResponse.json();

      if (!paystackData.status) {
        console.error("Paystack error:", paystackData);
        return new Response(
          JSON.stringify({ error: paystackData.message || "Payment initialization failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[Paystack] Domain payment initialized:", reference);

      return new Response(
        JSON.stringify({
          success: true,
          authorization_url: paystackData.data.authorization_url,
          access_code: paystackData.data.access_code,
          reference: paystackData.data.reference,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: Subscription payment flow
    const { plan_id, billing_interval, callback_url } = body;

    if (!plan_id || !billing_interval) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await adminSupabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError || !plan) {
      console.error("Plan error:", planError);
      return new Response(
        JSON.stringify({ error: "Plan not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const amount = billing_interval === "yearly" ? plan.yearly_price : plan.monthly_price;

    if (amount === 0) {
      return new Response(
        JSON.stringify({ error: "Cannot pay for free plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing subscription or create minimal one (DON'T update plan_id until payment confirmed)
    let { data: subscription } = await adminSupabase
      .from("subscriptions")
      .select("id, plan_id, status")
      .eq("company_id", company.id)
      .single();

    // If no subscription exists, create one with TRIAL plan (will be updated after payment)
    // CRITICAL: Never set the plan_id to the requested plan until payment is confirmed
    if (!subscription) {
      const { data: newSub, error: subError } = await adminSupabase
        .from("subscriptions")
        .insert({
          company_id: company.id,
          plan_id: "trial", // ALWAYS trial until payment is confirmed
          billing_interval: billing_interval,
          status: "trialing",
        })
        .select("id, plan_id, status")
        .single();

      if (subError) {
        console.error("Subscription error:", subError);
        return new Response(
          JSON.stringify({ error: "Failed to create subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      subscription = newSub;
    }

    console.log("[Paystack] Current subscription state:", {
      subscriptionId: subscription.id,
      currentPlanId: subscription.plan_id,
      requestedPlanId: plan_id,
      status: subscription.status
    });

    // Generate unique reference
    const reference = `REBAL-${company.id.slice(0, 8)}-${Date.now()}`;

    // Create payment record
    const { error: paymentError } = await adminSupabase
      .from("payments")
      .insert({
        company_id: company.id,
        subscription_id: subscription.id,
        paystack_reference: reference,
        amount: amount * 100, // Store in Kobo
        status: "pending",
        metadata: {
          plan_id,
          billing_interval,
          plan_name: plan.name,
        },
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment record" }),
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
        reference: reference,
        callback_url: callback_url || `${origin}/dashboard?tab=account`,
        metadata: {
          company_id: company.id,
          company_name: company.name,
          plan_id: plan_id,
          plan_name: plan.name,
          billing_interval: billing_interval,
          subscription_id: subscription.id,
        },
        channels: ["card", "bank", "ussd", "bank_transfer"],
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error("Paystack error:", paystackData);
      return new Response(
        JSON.stringify({ error: paystackData.message || "Payment initialization failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Paystack] Transaction initialized:", reference);

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Initialize error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
