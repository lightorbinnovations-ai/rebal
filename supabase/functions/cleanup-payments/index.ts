import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const getEnv = (key: string, required = true): string => {
      const value = Deno.env.get(key);
      if (!value && required) {
        throw new Error(`Missing configuration: ${key}`);
      }
      return value || "";
    };

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete pending payments older than 1 hour (reduced from 24 hours for better UX)
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: deletedPayments, error } = await adminSupabase
      .from("payments")
      .delete()
      .eq("status", "pending")
      .lt("created_at", cutoffTime)
      .select("id");

    if (error) {
      console.error("[Cleanup] Error deleting payments:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ALSO: Fix any subscriptions that are marked as "trialing" but have a paid plan_id
    // This can happen if someone clicked upgrade but never completed payment
    const { data: badSubs, error: subError } = await adminSupabase
      .from("subscriptions")
      .update({ plan_id: "trial" })
      .eq("status", "trialing")
      .neq("plan_id", "trial")
      .is("current_period_end", null) // No payment was ever made
      .select("id");

    const fixedSubsCount = badSubs?.length || 0;
    if (fixedSubsCount > 0) {
      console.log(`[Cleanup] Fixed ${fixedSubsCount} subscriptions with incorrect plan_id`);
    }

    const deletedCount = deletedPayments?.length || 0;
    console.log(`[Cleanup] Deleted ${deletedCount} abandoned pending payments`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount,
        fixed_subscriptions: fixedSubsCount,
        cutoff_time: cutoffTime
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
