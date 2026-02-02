import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_OG = {
    title: 'REBAL - Real Estate Business & Listings',
    description: 'The all-in-one platform for real estate professionals.',
    image: 'https://rebal.site/og-image.png',
    url: 'https://rebal.site'
}

const escapeHtml = (str: string) =>
    str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!)

function isBot(userAgent?: string): boolean {
    if (!userAgent) return false;
    const botPattern = /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|pinterest/i;
    return botPattern.test(userAgent);
}

export const handler: Handler = async (event) => {
    // WRAP EVERYTHING in try/catch to prevent 503s
    try {
        console.log('[ShareProxy] Event:', JSON.stringify({ path: event.path, headers: event.headers }));

        // 1. Safe Path Extraction
        const rawPath = event.path || '';
        const shortCode = rawPath.split('/').pop();

        if (!shortCode) {
            return {
                statusCode: 302,
                headers: { Location: 'https://rebal.site' }
            }
        }

        // 2. Safe Env Var Access
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('[ShareProxy] Missing Credentials. Returning default.');
            // Fallback to default generic OG tags if creds fail
            return serveHtml(DEFAULT_OG, 'https://rebal.site', false);
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Fetch Link Data
        const { data: linkData, error: linkError } = await supabase
            .from('short_links')
            .select('property_id, company_id, full_path')
            .eq('short_code', shortCode)
            .maybeSingle();

        if (linkError || !linkData) {
            console.log('[ShareProxy] Link not found or error:', linkError);
            return {
                statusCode: 302,
                headers: { Location: 'https://rebal.site' }
            }
        }

        let og = { ...DEFAULT_OG };
        const targetUrl = `https://rebal.site${linkData.full_path}`;
        og.url = `https://rebal.site/r/${shortCode}`;

        // 4. Enhance OG Tags (Safe Data Fetching)
        try {
            if (linkData.property_id) {
                const { data: prop } = await supabase
                    .from('properties')
                    .select('title, description, price, main_image_url, purpose, company_id')
                    .eq('id', linkData.property_id)
                    .maybeSingle();

                if (prop) {
                    const { data: comp } = await supabase
                        .from('companies')
                        .select('name')
                        .eq('id', prop.company_id)
                        .maybeSingle();

                    const companyName = comp?.name || 'Rebal';
                    const priceFormatted = new Intl.NumberFormat('en-NG', {
                        style: 'currency',
                        currency: 'NGN',
                        maximumFractionDigits: 0
                    }).format(prop.price || 0);

                    og.title = `${prop.title || 'Property'} | ${companyName}`;
                    og.description = `${prop.purpose || 'For Sale'} for ${priceFormatted}. ${(prop.description || '').substring(0, 150)}...`;
                    og.image = prop.main_image_url || DEFAULT_OG.image;
                }
            } else if (linkData.company_id) {
                const { data: comp } = await supabase
                    .from('companies')
                    .select('name, description, logo_url, profile_picture_url, tagline')
                    .eq('id', linkData.company_id)
                    .maybeSingle();

                if (comp) {
                    og.title = `${comp.name} - ${comp.tagline || 'Real Estate Profile'}`;
                    og.description = (comp.description || '').substring(0, 160) || DEFAULT_OG.description;
                    og.image = comp.profile_picture_url || comp.logo_url || DEFAULT_OG.image;
                }
            }
        } catch (innerError) {
            console.error('[ShareProxy] Error fetching details:', innerError);
            // Ignore inner errors and serve default/basic tags
        }

        // 5. Bot Detection & Response
        const userAgent = (event.headers['user-agent'] || event.headers['User-Agent'] || '').toLowerCase();
        const isBotAgent = isBot(userAgent);
        
        // Handle Debug Mode safely
        const rawUrl = event.rawUrl || `https://rebal.site${rawPath}`;
        if (rawUrl.includes('debug=true')) {
             return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortCode, linkData, og, isBot: isBotAgent }, null, 2)
            }
        }

        return serveHtml(og, targetUrl, isBotAgent);

    } catch (criticalError) {
        console.error('[ShareProxy] CRITICAL ERROR:', criticalError);
        // Absolute fail-safe
        return {
            statusCode: 302,
            headers: { Location: 'https://rebal.site' }
        }
    }
}

// Helper to generate HTML
function serveHtml(og: typeof DEFAULT_OG, targetUrl: string, isBotAgent: boolean) {
    const safeHtml = (str: string) => str ? escapeHtml(str) : '';
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${safeHtml(og.url)}">
        <meta property="og:title" content="${safeHtml(og.title)}">
        <meta property="og:description" content="${safeHtml(og.description)}">
        <meta property="og:image" content="${safeHtml(og.image)}">
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${safeHtml(og.url)}">
        <meta property="twitter:title" content="${safeHtml(og.title)}">
        <meta property="twitter:description" content="${safeHtml(og.description)}">
        <meta property="twitter:image" content="${safeHtml(og.image)}">
        <title>${safeHtml(og.title)}</title>
        ${!isBotAgent ? `<meta http-equiv="refresh" content="0;url=${safeHtml(targetUrl)}"><script>window.location.href = "${safeHtml(targetUrl)}"</script>` : ''}
      </head>
      <body>
        ${isBotAgent ? 
            `<h1>${safeHtml(og.title)}</h1><img src="${safeHtml(og.image)}" style="max-width:100%;" /><p>${safeHtml(og.description)}</p>` 
            : `<p>Redirecting...</p>`}
      </body>
      </html>`;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Cache-Control': 'public, max-age=60',
            'Vary': 'User-Agent'
        },
        body: html
    }
}
