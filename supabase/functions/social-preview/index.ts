import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit: 200 requests per minute per IP (higher for crawlers)
const RATE_LIMIT = { maxRequests: 200, windowSeconds: 60 };

// Default hero images for smart fallback (real estate themed)
// These are bundled assets that provide professional-looking previews
const DEFAULT_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=630&fit=crop&q=80", // Luxury home exterior
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=630&fit=crop&q=80", // Modern villa
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=630&fit=crop&q=80", // Contemporary house
  "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1200&h=630&fit=crop&q=80", // Apartment building
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=630&fit=crop&q=80", // Interior living room
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=630&fit=crop&q=80", // Pool house
];

// Get a consistent random hero based on company/property slug (deterministic)
function getRandomDefaultHero(slug: string): string {
  // Use slug to generate consistent index (same slug = same image)
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % DEFAULT_HERO_IMAGES.length;
  return DEFAULT_HERO_IMAGES[index];
}

// User agents for social media crawlers
const CRAWLER_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "TelegramBot",
  "Slackbot",
  "Discordbot",
  "Pinterest",
  "Googlebot",
  "bingbot",
  "Applebot",
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_USER_AGENTS.some((crawler) =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName: string;
  price?: string;
  currency?: string;
}

function generateHTML(ogData: OGData): string {
  const { title, description, image, url, type, siteName = "REBAL", price, currency } = ogData;

  // Product-specific meta tags for properties
  const productMeta = type === "product" && price ? `
  <meta property="product:price:amount" content="${escapeHtml(price)}">
  <meta property="product:price:currency" content="${escapeHtml(currency || 'NGN')}">` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${type}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:url" content="${escapeHtml(url)}">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  ${productMeta}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:site" content="@rebalng">
  
  <!-- WhatsApp specific -->
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  
  <!-- Redirect for browsers -->
  <meta http-equiv="refresh" content="0; url=${escapeHtml(url)}">
  <link rel="canonical" href="${escapeHtml(url)}">
  
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      color: white;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { opacity: 0.8; }
    a { color: #3B82F6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(title)}</h1>
    <p>Redirecting to <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>...</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get the best available image URL with proper fallback chain
 * Priority: og_image_url > specific image > hero_image > logo > random default hero
 */
function getBestImage(
  ogImageUrl: string | null,
  primaryImage: string | null,
  fallbackImage: string | null,
  logoUrl: string | null,
  baseUrl: string,
  slug: string = "default" // Used for consistent random selection
): string {
  // Check each image in priority order
  const candidates = [ogImageUrl, primaryImage, fallbackImage, logoUrl];

  for (const url of candidates) {
    if (url && url.trim() !== '') {
      // Ensure absolute URL
      if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
      }
      return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
    }
  }

  // Use a random (but consistent) default hero image instead of generic REBAL logo
  console.log("No custom image found, using default hero for slug:", slug);
  return getRandomDefaultHero(slug);
}

/**
 * Generate OG title with proper fallbacks
 */
function generateOGTitle(
  ogTitle: string | null,
  defaultTitle: string,
  siteName?: string
): string {
  if (ogTitle && ogTitle.trim() !== '') {
    return ogTitle;
  }
  return siteName ? `${defaultTitle} | ${siteName}` : defaultTitle;
}

/**
 * Generate OG description with proper fallbacks
 */
function generateOGDescription(
  ogDescription: string | null,
  defaultDescription: string | null,
  fallbackDescription: string
): string {
  if (ogDescription && ogDescription.trim() !== '') {
    return ogDescription.substring(0, 160);
  }
  if (defaultDescription && defaultDescription.trim() !== '') {
    return defaultDescription.substring(0, 160);
  }
  return fallbackDescription;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestUrl = new URL(req.url);
  const path = requestUrl.searchParams.get("path") || "";
  const userAgent = req.headers.get("user-agent") || "";

  const getEnv = (key: string, required = true): string => {
    const value = Deno.env.get(key);
    if (!value && required) {
      console.error(`[CRITICAL] Missing environment variable: ${key}`);
      throw new Error(`Missing configuration: ${key}`);
    }
    return value || "";
  };

  const supabaseUrl = getEnv("SUPABASE_URL");
  const supabaseKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get client IP for rate limiting
  const clientIP =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Base published URL
  const baseUrl = "https://rebal.site";
  const defaultOgImage = `${baseUrl}/og-image.png`;

  // Target URL for redirect
  const targetUrl = path.startsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/${path}`;

  // Check rate limit (skip for known crawlers to ensure SEO works)
  if (!isCrawler(userAgent)) {
    try {
      const { data: allowed, error: rateLimitError } = await supabase.rpc(
        "check_rate_limit",
        {
          p_identifier: clientIP,
          p_endpoint: "social-preview",
          p_max_requests: RATE_LIMIT.maxRequests,
          p_window_seconds: RATE_LIMIT.windowSeconds,
        }
      );

      if (rateLimitError) {
        console.error("[Rate Limit] Error:", rateLimitError);
      } else if (!allowed) {
        console.log(`[Rate Limit] Exceeded for social-preview, IP: ${clientIP}`);
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
    }

    // Non-crawler, redirect immediately
    console.log("Non-crawler request, redirecting to:", targetUrl);
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        Location: targetUrl,
      },
    });
  }

  console.log("=== SOCIAL PREVIEW REQUEST ===");
  console.log("Crawler detected:", userAgent);
  console.log("Generating preview for path:", path);

  // Default OG data for REBAL homepage
  let ogData: OGData = {
    title: "REBAL - One Smart Link for Your Property Business",
    description: "Create a professional property website and share listings instantly on WhatsApp and social media.",
    image: defaultOgImage,
    url: targetUrl,
    type: "website",
    siteName: "REBAL",
  };

  try {
    const pathParts = path.split("/").filter(Boolean);
    console.log("Path parts:", pathParts);

    // Handle /properties marketplace route
    if (pathParts.length >= 1 && pathParts[0] === "properties") {
      // Check if it's a direct property link /properties/{slug}
      if (pathParts.length === 2) {
        const propertySlug = pathParts[1];
        console.log("Fetching property by slug (marketplace route):", propertySlug);

        const { data: property, error: propertyError } = await supabase
          .from("properties")
          .select(`
            id, title, slug, property_type, purpose, price, description, 
            meta_description, main_image_url, location, state, city,
            og_title, og_description, og_image_url,
            company_id
          `)
          .eq("slug", propertySlug)
          .eq("is_active", true)
          .single();

        if (propertyError) {
          console.error("Error fetching property:", propertyError);
        }

        if (property) {
          // Fetch company for this property
          const { data: company } = await supabase
            .from("companies")
            .select("name, slug, logo_url, hero_image_url")
            .eq("id", property.company_id)
            .single();

          const siteName = company?.name || "REBAL";
          const priceFormatted = formatPrice(property.price);
          const location = [property.city, property.state].filter(Boolean).join(", ") || property.location;

          ogData = {
            title: generateOGTitle(
              property.og_title,
              `${property.title} - ${priceFormatted}`,
              siteName
            ),
            description: generateOGDescription(
              property.og_description,
              property.meta_description || property.description,
              `${property.property_type} for ${property.purpose} in ${location}. ${priceFormatted}`
            ),
            image: getBestImage(
              property.og_image_url,
              property.main_image_url,
              company?.hero_image_url || null,
              company?.logo_url || null,
              baseUrl,
              propertySlug
            ),
            url: targetUrl,
            type: "product",
            siteName,
            price: String(property.price),
            currency: "NGN",
          };

          console.log("Property OG data generated:", {
            title: ogData.title,
            image: ogData.image,
            propertySlug
          });
        }
      } else {
        // Marketplace listing page /properties
        ogData = {
          title: "Property Marketplace | REBAL",
          description: "Browse properties from verified real estate agencies. Find your dream property today on REBAL.",
          image: defaultOgImage,
          url: targetUrl,
          type: "website",
          siteName: "REBAL",
        };
      }
    }
    // Handle company routes /{company-slug}/...
    else if (pathParts.length >= 1) {
      const companySlug = pathParts[0];

      // Skip known non-company routes
      const nonCompanyRoutes = ["auth", "dashboard", "admin", "pricing", "about", "contact", "privacy", "terms", "s"];

      if (!nonCompanyRoutes.includes(companySlug)) {
        console.log("Fetching company:", companySlug);

        // Fetch company data with OG fields
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .select(`
            id, name, slug, tagline, description, 
            logo_url, hero_image_url, primary_color,
            og_title, og_description, og_image_url
          `)
          .eq("slug", companySlug)
          .single();

        if (companyError) {
          console.error("Error fetching company:", companyError);
        }

        if (company) {
          const siteName = company.name;
          console.log("Company found:", company.name);

          // Property detail page: /{company-slug}/property/{property-slug}
          if (pathParts.length >= 3 && pathParts[1] === "property") {
            const propertySlug = pathParts[2];
            console.log("Fetching property:", propertySlug);

            const { data: property, error: propertyError } = await supabase
              .from("properties")
              .select(`
                id, title, slug, property_type, purpose, price, description, 
                meta_description, main_image_url, location, state, city,
                og_title, og_description, og_image_url
              `)
              .eq("company_id", company.id)
              .eq("slug", propertySlug)
              .eq("is_active", true)
              .single();

            if (propertyError) {
              console.error("Error fetching property:", propertyError);
            }

            if (property) {
              const priceFormatted = formatPrice(property.price);
              const location = [property.city, property.state].filter(Boolean).join(", ") || property.location;

              ogData = {
                title: generateOGTitle(
                  property.og_title,
                  `${property.title} - ${priceFormatted}`,
                  siteName
                ),
                description: generateOGDescription(
                  property.og_description,
                  property.meta_description || property.description,
                  `${property.property_type} for ${property.purpose} in ${location}. ${priceFormatted}`
                ),
                image: getBestImage(
                  property.og_image_url,
                  property.main_image_url,
                  company.hero_image_url,
                  company.logo_url,
                  baseUrl,
                  propertySlug
                ),
                url: targetUrl,
                type: "product",
                siteName,
                price: String(property.price),
                currency: "NGN",
              };

              console.log("Property OG generated:", {
                title: ogData.title,
                image: ogData.image
              });
            }
          }
          // About page: /{company-slug}/about
          else if (pathParts.length >= 2 && pathParts[1] === "about") {
            ogData = {
              title: generateOGTitle(null, `About Us`, siteName),
              description: generateOGDescription(
                null,
                company.description,
                `Learn more about ${company.name} - Your trusted real estate partner`
              ),
              image: getBestImage(
                company.og_image_url,
                company.logo_url,
                company.hero_image_url,
                null,
                baseUrl,
                companySlug
              ),
              url: targetUrl,
              type: "website",
              siteName,
            };
          }
          // Contact page: /{company-slug}/contact
          else if (pathParts.length >= 2 && pathParts[1] === "contact") {
            ogData = {
              title: generateOGTitle(null, `Contact Us`, siteName),
              description: `Get in touch with ${company.name}. We're here to help you find your perfect property.`,
              image: getBestImage(
                company.og_image_url,
                company.logo_url,
                company.hero_image_url,
                null,
                baseUrl,
                companySlug
              ),
              url: targetUrl,
              type: "website",
              siteName,
            };
          }
          // Properties listing page: /{company-slug}/properties
          else if (pathParts.length >= 2 && pathParts[1] === "properties") {
            ogData = {
              title: generateOGTitle(null, `Properties`, siteName),
              description: `Browse property listings from ${company.name}. Find your dream property today.`,
              image: getBestImage(
                company.og_image_url,
                company.hero_image_url,
                company.logo_url,
                null,
                baseUrl,
                companySlug
              ),
              url: targetUrl,
              type: "website",
              siteName,
            };
          }
          // Main company page: /{company-slug}
          else if (pathParts.length === 1) {
            ogData = {
              title: generateOGTitle(
                company.og_title,
                company.tagline ? `${company.name} - ${company.tagline}` : company.name,
                undefined
              ),
              description: generateOGDescription(
                company.og_description,
                company.description,
                `${company.name} - Your trusted real estate partner. Browse our property listings.`
              ),
              image: getBestImage(
                company.og_image_url,
                company.hero_image_url,
                company.logo_url,
                null,
                baseUrl,
                companySlug
              ),
              url: targetUrl,
              type: "website",
              siteName,
            };

            console.log("Company page OG generated:", {
              title: ogData.title,
              image: ogData.image
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error generating OG data:", error);
  }

  console.log("=== FINAL OG DATA ===");
  console.log("Title:", ogData.title);
  console.log("Description:", ogData.description.substring(0, 50) + "...");
  console.log("Image:", ogData.image);
  console.log("Type:", ogData.type);

  // Return pre-rendered HTML with OG tags
  const html = generateHTML(ogData);

  return new Response(html, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
});
