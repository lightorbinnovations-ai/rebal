import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit configurations
const RATE_LIMITS = {
  inquiries: { maxRequests: 5, windowSeconds: 300 }, // 5 inquiries per 5 minutes
  analytics: { maxRequests: 60, windowSeconds: 60 }, // 60 page views per minute
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create service role client for rate limiting
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const url = new URL(req.url);
    const endpoint = url.pathname.split("/").pop(); // 'inquiries' or 'analytics'

    if (!endpoint || !["inquiries", "analytics"].includes(endpoint)) {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rateLimit = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS];

    // Check rate limit
    console.log(`[Rate Limit] Checking ${endpoint} for IP: ${clientIP}`);
    
    const { data: allowed, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      {
        p_identifier: clientIP,
        p_endpoint: endpoint,
        p_max_requests: rateLimit.maxRequests,
        p_window_seconds: rateLimit.windowSeconds,
      }
    );

    if (rateLimitError) {
      console.error("[Rate Limit] Error:", rateLimitError);
      return new Response(
        JSON.stringify({ error: "Rate limit check failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!allowed) {
      console.log(`[Rate Limit] Exceeded for ${endpoint}, IP: ${clientIP}`);
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.windowSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.windowSeconds),
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    console.log(`[Public API] Processing ${endpoint} request`);

    // Validate and insert based on endpoint
    if (endpoint === "inquiries") {
      // Validate required fields
      const { company_id, name, email, message, property_id, phone } = body;

      if (!company_id || !name || !email || !message) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify company exists (using companies table with service role)
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("id", company_id)
        .single();

      if (companyError || !company) {
        return new Response(
          JSON.stringify({ error: "Invalid company" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify property exists if provided
      if (property_id) {
        const { data: property, error: propertyError } = await supabase
          .from("properties")
          .select("id")
          .eq("id", property_id)
          .eq("company_id", company_id)
          .single();

        if (propertyError || !property) {
          return new Response(
            JSON.stringify({ error: "Invalid property" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Insert inquiry
      const { data, error } = await supabase.from("inquiries").insert({
        company_id,
        property_id: property_id || null,
        name: name.trim().substring(0, 255),
        email: email.trim().toLowerCase().substring(0, 255),
        phone: phone?.trim().substring(0, 50) || null,
        message: message.trim().substring(0, 5000),
      }).select().single();

      if (error) {
        console.error("[Inquiries] Insert error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to submit inquiry" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`[Inquiries] Created inquiry ${data.id}`);
      return new Response(
        JSON.stringify({ success: true, id: data.id }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (endpoint === "analytics") {
      const { company_id, event_type, property_id } = body;

      if (!company_id || !event_type) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Validate event type
      const validEventTypes = ["page_view", "property_view", "contact_click", "share"];
      if (!validEventTypes.includes(event_type)) {
        return new Response(
          JSON.stringify({ error: "Invalid event type" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Insert analytics event
      const { error } = await supabase.from("analytics").insert({
        company_id,
        event_type,
        property_id: property_id || null,
      });

      if (error) {
        console.error("[Analytics] Insert error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to record analytics" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`[Analytics] Recorded ${event_type} for company ${company_id}`);
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Public API] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
