import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

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

    // Get current subscription
    const { data: subscription, error: subError } = await adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("company_id", company.id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cancel the subscription - set status to cancelled
    const { error: updateSubError } = await adminSupabase
      .from("subscriptions")
      .update({
        status: "cancelled",
        paystack_subscription_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateSubError) {
      console.error("Subscription update error:", updateSubError);
      return new Response(
        JSON.stringify({ error: "Failed to cancel subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Downgrade company to trial limits (1 property for cancelled users)
    const { error: updateCompanyError } = await adminSupabase
      .from("companies")
      .update({
        subscription_status: "cancelled",
        max_properties: 1, // Reduced from 3 to 1
        updated_at: new Date().toISOString(),
      })
      .eq("id", company.id);

    if (updateCompanyError) {
      console.error("Company update error:", updateCompanyError);
    }

    // Create notification for user
    await adminSupabase.from("notifications").insert({
      user_id: userId,
      company_id: company.id,
      type: "subscription",
      title: "Subscription Cancelled",
      message: "Your subscription has been cancelled. You can resubscribe anytime to regain full access.",
      metadata: { subscription_id: subscription.id },
    });

    console.log(`[Cancel] Subscription cancelled for company ${company.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscription cancelled successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cancel subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
