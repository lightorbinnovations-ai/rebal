import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // 1. Handle CORS preflight (OPTIONS)
  // This requires "Enforce Verification" to be DISABLED in Supabase Dashboard
  // so the request can actually reach this code without an Auth header.
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Manual Authentication Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT and get the user
    // We use the anon client for this to verify the token signature if needed, 
    // but here we can just use getUser with the token passed in the header.
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Optional: Check for Admin Role
    // This adds an extra layer of security ensuring only admins can trigger this.
    // (Assuming you have an 'is_admin' function or check roles table)
    const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: user.id });
    // Note: If is_admin RPC uses auth.uid(), we might need to use a client with the user's token.
    // However, since we are using Service Role client, we can query the user_roles table directly.

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (!roles) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Grace Period Check] authorized for user ${user.email}`);

    // 4. Run the Business Logic
    console.log("[Grace Period Check] Starting check for expired grace periods...");

    // Call the database function to expire grace periods
    const { data, error } = await supabase.rpc("expire_grace_periods");

    if (error) {
      console.error("[Grace Period Check] Error calling expire_grace_periods:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process grace periods", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const expiredCount = data as number;
    console.log(`[Grace Period Check] Processed ${expiredCount} expired grace periods`);

    // Also get count of active grace periods for monitoring
    const { count: activeGracePeriods } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "past_due")
      .not("grace_period_end", "is", null)
      .gt("grace_period_end", new Date().toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredCount,
        active_grace_periods: activeGracePeriods || 0,
        checked_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Grace Period Check] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
