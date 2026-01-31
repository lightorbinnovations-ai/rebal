import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 5 OG image generations per hour per user (expensive AI operation)
const RATE_LIMIT = { maxRequests: 5, windowSeconds: 3600 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
    const supabaseServiceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = getEnv("SUPABASE_ANON_KEY");
    // Lovable key is optional for logic continuity but required for AI. 
    // We'll check it before calling AI.
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create authenticated client to verify user
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit by user ID (not IP, since this is authenticated)
    const { data: allowed, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      {
        p_identifier: user.id,
        p_endpoint: "generate-og-image",
        p_max_requests: RATE_LIMIT.maxRequests,
        p_window_seconds: RATE_LIMIT.windowSeconds,
      }
    );

    if (rateLimitError) {
      console.error("[Rate Limit] Error:", rateLimitError);
      // Fail open if rate limit check fails, or log only? Better to be safe and continue if just DB error?
      // Strict:
    } else if (!allowed) {
      console.log(`[Rate Limit] Exceeded for generate-og-image, user: ${user.id}`);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. You can generate up to 5 OG images per hour.",
          retryAfter: RATE_LIMIT.windowSeconds,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(RATE_LIMIT.windowSeconds),
          },
        }
      );
    }

    const { companyId } = await req.json();

    if (!companyId) {
      return new Response(
        JSON.stringify({ error: "Company ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns the company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, tagline, logo_url, primary_color, secondary_color, user_id")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      console.error("Company fetch error:", companyError);
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify ownership
    if (company.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You don't own this company" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating OG image for company:", company.name);

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing AI API Key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate OG image using AI - Desktop-style 1200x630 format
    const primaryColor = company.primary_color || "#0f766e";
    const secondaryColor = company.secondary_color || "#1e3a5f";

    // Create a professional desktop-style OG image with clear text overlay
    const prompt = `Create a professional 1200x630 pixel social media Open Graph preview image for a real estate company. 

Design requirements:
- Dark gradient background transitioning from ${primaryColor} to ${secondaryColor} with subtle geometric patterns
- Company name "${company.name}" displayed prominently in large, bold white sans-serif font (centered upper area)
${company.tagline ? `- Tagline "${company.tagline}" in elegant lighter font below the company name` : ""}
- Subtle silhouette of modern buildings/skyscrapers at the bottom edge
- Clean, minimal, premium luxury real estate branding style
- Perfect 16:9 aspect ratio (1200x630 pixels)
- Text must be sharp, readable, and well-spaced
- No stock photos, just elegant branding graphics
- Professional corporate look suitable for WhatsApp/Facebook/LinkedIn sharing

Ultra high resolution, crisp text, modern corporate design.`;

    console.log("Calling AI service...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error status:", aiResponse.status);
      console.error("AI API error body:", errorText);
      return new Response(
        JSON.stringify({ error: `Failed to generate image: ${aiResponse.statusText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageBase64) {
      console.error("No image in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "No image generated by AI service" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Data = generatedImageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage with timestamp to bust cache
    const timestamp = Date.now();
    const fileName = `og-images/companies/${companyId}-${timestamp}.png`;
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload generated image to storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(fileName);

    const ogImageUrl = publicUrlData.publicUrl;
    console.log("OG image uploaded:", ogImageUrl);

    // Update company with og_image_url
    const { error: updateError } = await supabase
      .from("companies")
      .update({ og_image_url: ogImageUrl })
      .eq("id", companyId);

    if (updateError) {
      console.error("Failed to update company with OG image URL:", updateError);
      // Don't fail the request, image was still generated
    }

    return new Response(
      JSON.stringify({
        success: true,
        ogImageUrl,
        message: "OG image generated and saved successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    console.error("Error generating OG image:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
