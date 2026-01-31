import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://rebal.site";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all active companies
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false });

    if (companiesError) {
      console.error("Error fetching companies:", companiesError);
    }

    // Get all active properties
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(`
        slug,
        updated_at,
        company_id,
        companies!inner(slug)
      `)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (propertiesError) {
      console.error("Error fetching properties:", propertiesError);
    }

    const today = new Date().toISOString().split("T")[0];

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/properties</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>${BASE_URL}/pricing</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${BASE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/auth</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${BASE_URL}/privacy</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${BASE_URL}/terms</loc>
    <lastmod>${today}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
`;

    // Add company pages
    if (companies && companies.length > 0) {
      sitemap += `\n  <!-- Company Pages -->\n`;
      for (const company of companies) {
        const lastmod = company.updated_at
          ? new Date(company.updated_at).toISOString().split("T")[0]
          : today;

        sitemap += `  <url>
    <loc>${BASE_URL}/${company.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${BASE_URL}/${company.slug}/properties</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>${BASE_URL}/${company.slug}/about</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${BASE_URL}/${company.slug}/contact</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    // Add property pages
    if (properties && properties.length > 0) {
      sitemap += `\n  <!-- Property Pages -->\n`;
      for (const property of properties) {
        // Handle the companies relation - it comes as an object with slug
        const companiesData = property.companies as unknown;
        const companySlug = companiesData && typeof companiesData === 'object' && 'slug' in companiesData
          ? (companiesData as { slug: string }).slug
          : null;
        if (!companySlug) continue;

        const lastmod = property.updated_at
          ? new Date(property.updated_at).toISOString().split("T")[0]
          : today;

        sitemap += `  <url>
    <loc>${BASE_URL}/${companySlug}/property/${property.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate sitemap" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
