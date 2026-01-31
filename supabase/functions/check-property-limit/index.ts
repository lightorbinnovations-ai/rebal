import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LimitCheckResponse {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get auth header to verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create client with user's auth token
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("[Property Limit] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { company_id } = body;

    if (!company_id) {
      return new Response(
        JSON.stringify({ error: "company_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[Property Limit] Checking limit for company: ${company_id}, user: ${user.id}`);

    // Verify user owns this company
    const { data: company, error: companyError } = await supabaseAdmin
      .from("companies")
      .select("id, user_id, subscription_status, subscription_end_date, max_properties")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      console.error("[Property Limit] Company not found:", companyError);
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (company.user_id !== user.id) {
      console.error("[Property Limit] User does not own company");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get subscription details
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("*, plan:subscription_plans(*)")
      .eq("company_id", company_id)
      .single();

    // Determine max properties allowed
    // Default trial limit is 1 (updated from 3)
    let maxProperties = company.max_properties || 1;
    
    if (subscription?.plan?.max_properties) {
      maxProperties = subscription.plan.max_properties;
    }

    // Check subscription status
    const status = company.subscription_status || subscription?.status || "trialing";
    const isActive = status === "active";
    const isTrialing = status === "trialing";
    
    // Check if trial/subscription has expired
    let isExpired = false;
    const endDate = company.subscription_end_date || subscription?.trial_end || subscription?.current_period_end;
    
    if (endDate) {
      const end = new Date(endDate);
      isExpired = end < new Date();
    } else if (isTrialing) {
      // Default trial: 14 days from company creation - check via created_at
      const { data: companyCreated } = await supabaseAdmin
        .from("companies")
        .select("created_at")
        .eq("id", company_id)
        .single();
      
      if (companyCreated) {
        const trialEnd = new Date(companyCreated.created_at);
        trialEnd.setDate(trialEnd.getDate() + 14);
        isExpired = trialEnd < new Date();
      }
    }

    // Get current property count
    const { count: currentCount, error: countError } = await supabaseAdmin
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("company_id", company_id);

    if (countError) {
      console.error("[Property Limit] Count error:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to check property count" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const propertyCount = currentCount || 0;

    // Determine if adding a new property is allowed
    let allowed = propertyCount < maxProperties;
    let message = "";

    if (isExpired) {
      allowed = false;
      message = "Your subscription has expired. Please upgrade to add more properties.";
    } else if (!allowed) {
      if (isTrialing) {
        message = `You've reached the trial limit of ${maxProperties} properties. Upgrade to add more.`;
      } else {
        message = `You've reached your plan limit of ${maxProperties} properties. Upgrade to add more.`;
      }
    }

    const response: LimitCheckResponse = {
      allowed,
      currentCount: propertyCount,
      maxAllowed: maxProperties,
      message: message || undefined,
    };

    console.log(`[Property Limit] Result: ${JSON.stringify(response)}`);

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Property Limit] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
