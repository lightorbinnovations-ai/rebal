import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export default async (request: Request, context: any) => {
    const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";

    // 1. Bot Detection
    const botPattern = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|pinterest|slackbot|discordbot/i;
    const isBot = botPattern.test(userAgent);

    // If not a bot, let the SPA handle it (User Experience)
    if (!isBot) {
        return context.next();
    }

    // 2. Setup Supabase
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL") || Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("VITE_SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
        console.error("Missing Supabase Credentials");
        return context.next(); // Fail open to SPA
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 3. Parse URL and Resolve ID
        const url = new URL(request.url);
        const pathParts = url.pathname.split("/").filter(Boolean); // ["r", "CODE"] or ["s", "SLUG"]
        const prefix = pathParts[0];
        const identifier = pathParts[1];

        if (!identifier) return context.next();

        let propertyId = null;
        let companyId = null;
        let fullPath = url.pathname;

        // Resolve based on prefix
        if (prefix === "r") {
            // Short Link Lookup
            const { data: link, error } = await supabase
                .from("short_links")
                .select("property_id, company_id, full_path")
                .eq("short_code", identifier)
                .maybeSingle();

            if (error || !link) return context.next();

            propertyId = link.property_id;
            companyId = link.company_id;
            fullPath = link.full_path || url.pathname;
        } else if (prefix === "s") {
            // Slug Lookup (Assuming we look up property directly or similar)
            // For now, let's assume /s/ is also for short links or property slugs.
            // If /s/ is mapped to properties:
            // const { data: prop } = await supabase.from('properties').select('id').eq('slug', identifier).single();
            // For safety, let's stick to the Short Link logic if /s/ works same as /r/ or alias
            // If the user meant "slug", we'd need a slug column. 
            // Falling back to standard SPA if not found.
            return context.next();
        }

        // 4. Fetch Details & Construct Meta Tags
        let ogTitle = "Rebal";
        let ogDesc = "Real Estate Business & Listings";
        let ogImage = "https://rebal.site/og-image.png";
        const ogUrl = `https://rebal.site/${prefix}/${identifier}`;

        if (propertyId) {
            const { data: prop } = await supabase
                .from("properties")
                .select("title, description, price, purpose, company_id, og_version")
                .eq("id", propertyId)
                .single();

            if (prop) {
                // Fetch Company Name
                let companyName = "Rebal";
                if (prop.company_id) {
                    const { data: comp } = await supabase
                        .from("companies")
                        .select("name")
                        .eq("id", prop.company_id)
                        .maybeSingle();
                    if (comp) companyName = comp.name;
                }

                const priceFormatted = new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    maximumFractionDigits: 0
                }).format(prop.price);

                ogTitle = `${prop.title} | ${companyName}`;
                ogDesc = `${prop.purpose} for ${priceFormatted}. ${(prop.description || "").substring(0, 150)}...`;

                // USE SUPABASE OG IMAGE FUNCTION AS REQUESTED
                // Extract project ref
                const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
                if (projectRef) {
                    ogImage = `https://${projectRef}.supabase.co/functions/v1/og-renderer?id=${propertyId}&type=property&v=${prop.og_version || 1}`;
                }
            }
        } else if (companyId) {
            const { data: comp } = await supabase
                .from("companies")
                .select("name, description, og_version")
                .eq("id", companyId)
                .single();

            if (comp) {
                ogTitle = `${comp.name}`;
                ogDesc = (comp.description || "").substring(0, 160);

                const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
                if (projectRef) {
                    ogImage = `https://${projectRef}.supabase.co/functions/v1/og-renderer?id=${companyId}&type=company&v=${comp.og_version || 1}`;
                }
            }
        }

        // 5. Return HTML Answer
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(ogTitle)}</title>
    
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDesc)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:url" content="${escapeHtml(ogUrl)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
</head>
<body>
    <h1>${escapeHtml(ogTitle)}</h1>
    <p>${escapeHtml(ogDesc)}</p>
    <img src="${escapeHtml(ogImage)}" alt="Preview" />
</body>
</html>`;

        return new Response(html, {
            headers: {
                "content-type": "text/html; charset=UTF-8",
                // Cache Control for Bots - Force checking
                "cache-control": "public, max-age=0, must-revalidate",
            },
        });

    } catch (err) {
        console.error("Edge Function Error:", err);
        return context.next();
    }
};

function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!)
}
