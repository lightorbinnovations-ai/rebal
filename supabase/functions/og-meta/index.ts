import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 100 requests per minute per IP (reasonable for crawlers/users)
const RATE_LIMIT = { maxRequests: 100, windowSeconds: 60 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get client IP for rate limiting
  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Check rate limit
  try {
    const { data: allowed, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      {
        p_identifier: clientIP,
        p_endpoint: "og-meta",
        p_max_requests: RATE_LIMIT.maxRequests,
        p_window_seconds: RATE_LIMIT.windowSeconds,
      }
    );

    if (rateLimitError) {
      console.error("[Rate Limit] Error:", rateLimitError);
    } else if (!allowed) {
      console.log(`[Rate Limit] Exceeded for og-meta, IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
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
  } catch (error) {
    console.error("[Rate Limit] Check failed:", error);
    // Continue with request even if rate limit check fails
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") || "";

  // Use the published URL for production OG images
  const baseUrl = "https://rebal.site";
  const defaultOgImage = `${baseUrl}/og-image.png`;

  // Default OG data
  let ogData = {
    title: "REBAL - Real Estate Business Accelerator",
    description: "Create your professional real estate website in minutes. Showcase properties, capture leads, and grow your business.",
    image: defaultOgImage,
    url: baseUrl,
    type: "website",
  };

  try {
    // Parse the path to determine the page type
    const pathParts = path.split("/").filter(Boolean);

    if (pathParts.length >= 1) {
      const companySlug = pathParts[0];

      // Skip known non-company routes
      const nonCompanyRoutes = ["auth", "dashboard", "admin", "pricing", "about", "contact", "privacy", "terms"];
      if (!nonCompanyRoutes.includes(companySlug)) {
        // Fetch company data using service role for unrestricted access
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select("id, name, slug, tagline, description, logo_url, hero_image_url, primary_color")
          .eq("slug", companySlug)
          .single();

        if (companyError) {
          console.error("Error fetching company:", companyError);
        }

        if (company) {
          // Check if it's a property page
          if (pathParts.length >= 3 && pathParts[1] === "property") {
            const propertySlug = pathParts[2];

            const { data: property, error: propertyError } = await supabase
              .from("properties")
              .select("id, title, slug, property_type, purpose, price, description, meta_description, main_image_url, location")
              .eq("company_id", company.id)
              .eq("slug", propertySlug)
              .eq("is_active", true)
              .single();

            if (propertyError) {
              console.error("Error fetching property:", propertyError);
            }

            if (property) {
              const priceFormatted = new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency: "NGN",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(property.price);

              ogData = {
                title: `${property.title} | ${company.name}`,
                description: property.meta_description || property.description?.substring(0, 160) || `${property.property_type} for ${property.purpose} - ${priceFormatted}`,
                image: property.main_image_url || company.hero_image_url || company.logo_url || defaultOgImage,
                url: `${baseUrl}/${companySlug}/property/${propertySlug}`,
                type: "article",
              };
            }
          }
          // About page
          else if (pathParts.length >= 2 && pathParts[1] === "about") {
            ogData = {
              title: `About Us | ${company.name}`,
              description: company.description?.substring(0, 160) || `Learn more about ${company.name} - Your trusted real estate partner`,
              image: company.logo_url || company.hero_image_url || defaultOgImage,
              url: `${baseUrl}/${companySlug}/about`,
              type: "website",
            };
          }
          // Contact page
          else if (pathParts.length >= 2 && pathParts[1] === "contact") {
            ogData = {
              title: `Contact Us | ${company.name}`,
              description: `Get in touch with ${company.name}. We're here to help you find your perfect property.`,
              image: company.logo_url || company.hero_image_url || defaultOgImage,
              url: `${baseUrl}/${companySlug}/contact`,
              type: "website",
            };
          }
          // Properties page
          else if (pathParts.length >= 2 && pathParts[1] === "properties") {
            ogData = {
              title: `Properties | ${company.name}`,
              description: `Browse property listings from ${company.name}. Find your dream property today.`,
              image: company.hero_image_url || company.logo_url || defaultOgImage,
              url: `${baseUrl}/${companySlug}/properties`,
              type: "website",
            };
          }
          // Main company page
          else if (pathParts.length === 1) {
            ogData = {
              title: company.tagline ? `${company.name} - ${company.tagline}` : company.name,
              description: company.description?.substring(0, 160) || `${company.name} - Your trusted real estate partner. Browse our property listings.`,
              image: company.hero_image_url || company.logo_url || defaultOgImage,
              url: `${baseUrl}/${companySlug}`,
              type: "website",
            };
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching OG data:", error);
  }

  console.log("OG data returned:", JSON.stringify(ogData));

  // Return JSON with OG data
  return new Response(
    JSON.stringify(ogData),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    }
  );
});
