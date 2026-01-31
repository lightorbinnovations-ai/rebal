import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 10 property OG images per hour per user (expensive AI operation)
const RATE_LIMIT = { maxRequests: 10, windowSeconds: 3600 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

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
        p_endpoint: "generate-property-og",
        p_max_requests: RATE_LIMIT.maxRequests,
        p_window_seconds: RATE_LIMIT.windowSeconds,
      }
    );

    if (rateLimitError) {
      console.error("[Rate Limit] Error:", rateLimitError);
    } else if (!allowed) {
      console.log(`[Rate Limit] Exceeded for generate-property-og, user: ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. You can generate up to 10 property OG images per hour.",
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

    const { propertyId } = await req.json();
    
    if (!propertyId) {
      return new Response(
        JSON.stringify({ error: "Property ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch property and company data
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select(`
        id,
        title,
        price,
        property_type,
        purpose,
        main_image_url,
        location,
        state,
        city,
        company_id
      `)
      .eq("id", propertyId)
      .single();

    if (propertyError || !property) {
      console.error("Property fetch error:", propertyError);
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch company data and verify ownership
    const { data: company } = await supabase
      .from("companies")
      .select("name, primary_color, logo_url, user_id")
      .eq("id", property.company_id)
      .single();

    // Verify ownership
    if (!company || company.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Forbidden - You don't own this property" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const companyName = company.name || "Property Listing";
    const primaryColor = company.primary_color || "#0f766e";

    console.log("Generating OG image for property:", property.title);

    // Format price
    const formattedPrice = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(property.price);

    // Build location string
    const locationParts = [property.city, property.state].filter(Boolean);
    const locationStr = locationParts.length > 0 ? locationParts.join(", ") : property.location || "";

    // Build the prompt for 1200x630 OG image
    let prompt: string;
    const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [];
    
    if (property.main_image_url) {
      // Use the property image as base and add professional text overlay
      prompt = `Create a professional 1200x630 pixel social media Open Graph preview image for a property listing.

Take this property photo and enhance it for social sharing:
- Apply a subtle dark gradient overlay at the bottom (40% of image height)
- Add text overlay in the gradient area with:
  • Property title: "${property.title}" (large, bold white text)
  • Price: "${formattedPrice}" (prominent, slightly smaller)
  • Location: "${locationStr}" with a location pin icon
  • Company: "${companyName}" (smaller, at bottom corner)
- Use ${primaryColor} as accent color for any decorative elements
- Ensure text is crisp, readable, and properly contrasted
- Professional real estate listing card style
- Perfect 16:9 aspect ratio (1200x630 pixels)
- Make the property photo the hero, with text as overlay

High quality, professional real estate marketing image.`;
      
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
          {
            type: "image_url",
            image_url: {
              url: property.main_image_url,
            },
          },
        ],
      });
    } else {
      // Generate without property image - create a stylish placeholder
      prompt = `Create a professional 1200x630 pixel social media Open Graph preview image for a property listing.

Design a premium property listing card without a photo:
- Elegant gradient background from ${primaryColor} to dark blue/navy
- Subtle geometric property/building silhouettes
- Text layout:
  • "${property.title}" as the main heading (large, bold, white, centered)
  • "${formattedPrice}" displayed prominently below
  • "${property.property_type} for ${property.purpose}" as a badge/tag
  • Location: "${locationStr}" with location icon
  • "${companyName}" as company branding (corner or footer)
- Clean, minimal, luxury real estate style
- Perfect 16:9 aspect ratio (1200x630 pixels)
- Professional corporate look suitable for WhatsApp/Facebook/LinkedIn

Ultra high resolution, crisp text, modern design.`;
      
      messages.push({
        role: "user",
        content: prompt,
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const generatedImageBase64 = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImageBase64) {
      console.error("No image in AI response");
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data
    const base64Data = generatedImageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload to storage with timestamp for cache busting
    const timestamp = Date.now();
    const fileName = `og-images/properties/${propertyId}-${timestamp}.png`;
    const { error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload image" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("property-images")
      .getPublicUrl(fileName);

    const ogImageUrl = publicUrlData.publicUrl;
    console.log("Property OG image uploaded:", ogImageUrl);

    // Update property with og_image_url
    const { error: updateError } = await supabase
      .from("properties")
      .update({ og_image_url: ogImageUrl })
      .eq("id", propertyId);

    if (updateError) {
      console.error("Failed to update property with OG image URL:", updateError);
      // Don't fail the request, image was still generated
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        ogImageUrl,
        propertyId,
        message: "Property OG image generated and saved successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    console.error("Error generating property OG image:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
