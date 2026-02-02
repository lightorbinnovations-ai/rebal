import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Default hero images for fallback
const DEFAULT_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=630&fit=crop&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=630&fit=crop&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=630&fit=crop&q=80",
  "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?w=1200&h=630&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=630&fit=crop&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=630&fit=crop&q=80",
];

function isCrawler(userAgent: string): boolean {
  return CRAWLER_USER_AGENTS.some((crawler) =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

function getRandomDefaultHero(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % DEFAULT_HERO_IMAGES.length;
  return DEFAULT_HERO_IMAGES[index];
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const shortCode = url.searchParams.get("code");
  const userAgent = req.headers.get("user-agent") || "";

  const baseUrl = "https://rebal.site";
  const defaultOgImage = `${baseUrl}/og-image.png`;

  if (!shortCode) {
    return new Response("Missing short code", { status: 400, headers: corsHeaders });
  }

  console.log("=== SHORT LINK REDIRECT ===");
  console.log("Short code:", shortCode);
  console.log("User agent:", userAgent);
  console.log("Is crawler:", isCrawler(userAgent));

  try {
    // Get the short link with property_id directly for accurate OG data
    const { data: shortLink, error: shortLinkError } = await supabase
      .from("short_links")
      .select("full_path, property_id, company_id")
      .eq("short_code", shortCode)
      .single();

    if (shortLinkError || !shortLink) {
      console.error("Short link not found:", shortLinkError);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: baseUrl },
      });
    }

    // Increment click count (fire and forget)
    supabase.rpc("increment_short_link_click", { p_short_code: shortCode }).then(() => {
      console.log("Click count incremented");
    });

    const fullPath = shortLink.full_path;
    const targetUrl = `${baseUrl}${fullPath.startsWith("/") ? fullPath : `/${fullPath}`}`;

    console.log("Full path:", fullPath);
    console.log("Target URL:", targetUrl);
    console.log("Property ID:", shortLink.property_id);
    console.log("Company ID:", shortLink.company_id);

    // For non-crawlers, just redirect immediately
    if (!isCrawler(userAgent)) {
      console.log("Non-crawler, redirecting to:", targetUrl);
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: targetUrl },
      });
    }

    // For crawlers, generate OG metadata
    console.log("Crawler detected, generating OG metadata...");

    // Default OG data
    let ogData: OGData = {
      title: "REBAL - One Smart Link for Your Property Business",
      description: "Create a professional property website and share listings instantly.",
      image: defaultOgImage,
      url: targetUrl,
      type: "website",
      siteName: "REBAL",
    };

    // If short link has a property_id, fetch property data directly (most reliable)
    if (shortLink.property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("id, title, slug, property_type, purpose, price, description, meta_description, main_image_url, location, state, city, og_title, og_description, og_image_url, company_id")
        .eq("id", shortLink.property_id)
        .single();

      if (property) {
        const { data: company } = await supabase
          .from("companies")
          .select("name, logo_url, hero_image_url")
          .eq("id", property.company_id)
          .single();

        const siteName = company?.name || "REBAL";
        const priceFormatted = formatPrice(property.price);
        const location = [property.city, property.state].filter(Boolean).join(", ") || property.location;
        // Priority: Dynamic Satori Image > og_image_url > main_image_url > company images > default
        let image = property.og_image_url || property.main_image_url || company?.hero_image_url || company?.logo_url || getRandomDefaultHero(property.slug);

        // DYNAMIC OG IMAGE (Satori) - The "Anti-Gravity" Upgrade
        // We use the og-renderer to generate the image on the fly with the EXACT price/title
        const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
        if (projectRef) {
          // v=og_version ensures instant updates when you change price/title
          image = `https://${projectRef}.supabase.co/functions/v1/og-renderer?id=${shortLink.property_id}&type=property&v=${property.og_version || 1}`;
        }

        ogData = {
          title: property.og_title || `${property.title} - ${priceFormatted} | ${siteName}`,
          description: (property.og_description || property.meta_description || property.description || `${property.property_type} for ${property.purpose} in ${location}`).substring(0, 160),
          image,
          url: `https://rebal.site/r/${shortCode}`, // Canonical URL is the short link to prevent FB re-scrape
          type: "product",
          siteName,
          price: String(property.price),
          currency: "NGN",
        };
        console.log("Property OG generated from property_id:", { title: ogData.title, image: ogData.image });
      }
    }
    // Otherwise, parse path for company/marketplace routes
    else {
      const pathParts = fullPath.split("/").filter(Boolean);

      // Handle /properties marketplace routes
      if (pathParts.length >= 1 && pathParts[0] === "properties") {
        ogData = {
          title: "Property Marketplace | REBAL",
          description: "Browse properties from verified real estate agencies. Find your dream property today.",
          image: defaultOgImage,
          url: targetUrl,
          type: "website",
          siteName: "REBAL",
        };
        console.log("Marketplace OG generated");
      } else if (pathParts.length >= 1) {
        const companySlug = pathParts[0];
        const nonCompanyRoutes = ["auth", "dashboard", "admin", "pricing", "about", "contact", "privacy", "terms", "s", "r"];

        if (!nonCompanyRoutes.includes(companySlug)) {
          // Fetch company data
          const { data: company } = await supabase
            .from("companies")
            .select("id, name, slug, tagline, description, logo_url, hero_image_url, og_title, og_description, og_image_url")
            .eq("slug", companySlug)
            .single();

          if (company) {
            const siteName = company.name;
            const image = company.og_image_url || company.hero_image_url || company.logo_url || getRandomDefaultHero(companySlug);

            ogData = {
              title: company.og_title || (company.tagline ? `${company.name} - ${company.tagline}` : company.name),
              description: (company.og_description || company.description || `${company.name} - Your trusted real estate partner`).substring(0, 160),
              image,
              url: targetUrl,
              type: "website",
              siteName,
            };

            console.log("Company OG generated:", { title: ogData.title, image: ogData.image });
          }
        }
      }
    }

    // Return HTML with OG tags for crawler
    const html = generateHTML(ogData);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    });

  } catch (error) {
    console.error("Error processing short link:", error);
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: baseUrl },
    });
  }
});
