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
    // 1. Extract Short Code
    // Path comes in as /.netlify/functions/share-proxy/CODE
    const path = event.path.replace('/.netlify/functions/share-proxy/', '')
    const shortCode = path.split('/').pop()

    if (!shortCode) {
        return {
            statusCode: 302,
            headers: { Location: 'https://rebal.site' }
        }
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL!
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials')
            return {
                statusCode: 302,
                headers: { Location: 'https://rebal.site' }
            }
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 2. Fetch Link Data
        const { data: linkData, error: linkError } = await supabase
            .from('short_links')
            .select('property_id, company_id, full_path')
            .eq('short_code', shortCode)
            .maybeSingle()

        if (linkError || !linkData) {
            return {
                statusCode: 302,
                headers: { Location: 'https://rebal.site' }
            }
        }

        let og = { ...DEFAULT_OG }

        // CRITICAL FOR FACEBOOK: 
        // The Canonical URL (og:url) MUST be the Short Link itself.
        // If we set it to the destination (SPA), Facebook will follow it and see default tags.
        // We only redirect HUMANS to the targetUrl.
        const targetUrl = `https://rebal.site${linkData.full_path}`
        og.url = `https://rebal.site/r/${shortCode}`

        // 3. Enhance OG Tags from Property/Company
        if (linkData.property_id) {
            const { data: prop } = await supabase
                .from('properties')
                .select('title, description, price, main_image_url, gallery_urls, purpose, company_id, og_version')
                .eq('id', linkData.property_id)
                .maybeSingle()

            if (prop) {
                const { data: comp } = await supabase
                    .from('companies')
                    .select('name')
                    .eq('id', prop.company_id)
                    .maybeSingle()

                const companyName = comp?.name || 'Rebal'
                const priceFormatted = new Intl.NumberFormat('en-NG', {
                    style: 'currency',
                    currency: 'NGN',
                    maximumFractionDigits: 0
                }).format(prop.price)

                og.title = `${prop.title} | ${companyName}`
                og.description = `${prop.purpose} for ${priceFormatted}. ${prop.description?.substring(0, 150) || ''}...`

                // Use the actual property image directly (reliable and fast)
                og.image = prop.main_image_url || 'https://rebal.site/og-image.png'
            }
        }
        else if (linkData.company_id) {
            const { data: comp } = await supabase
                .from('companies')
                .select('name, description, logo_url, profile_picture_url, tagline, og_version')
                .eq('id', linkData.company_id)
                .maybeSingle()

            if (comp) {
                og.title = `${comp.name} - ${comp.tagline || 'Real Estate Profile'}`
                og.description = comp.description?.substring(0, 160) || DEFAULT_OG.description

                // DYNAMIC OG IMAGE (Satori)
                const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
                if (projectRef) {
                    og.image = `https://${projectRef}.supabase.co/functions/v1/og-renderer?id=${linkData.company_id}&type=company&v=${comp.og_version || 1}`
                } else if (comp.logo_url) {
                    og.image = comp.logo_url
                }
            }
        }

        // 4. Handle Debug Mode
        const urlObj = new URL(event.rawUrl);
        if (urlObj.searchParams.get('debug') === 'true') {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shortCode,
                    linkData,
                    og,
                    targetUrl,
                    isBot: isBot(event.headers['user-agent'])
                }, null, 2)
            }
        }

        // 5. Detect Bots vs Humans
        const userAgent = event.headers['user-agent'] || '';
        const isBotAgent = isBot(userAgent);

        // 6. Generate HTML
        const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${escapeHtml(og.url)}">
        <meta property="og:title" content="${escapeHtml(og.title)}">
        <meta property="og:description" content="${escapeHtml(og.description)}">
        <meta property="og:image" content="${escapeHtml(og.image)}">

        <!-- Twitter -->
        <meta property="twitter:card" content="summary_large_image">
        <meta property="twitter:url" content="${escapeHtml(og.url)}">
        <meta property="twitter:title" content="${escapeHtml(og.title)}">
        <meta property="twitter:description" content="${escapeHtml(og.description)}">
        <meta property="twitter:image" content="${escapeHtml(og.image)}">
        
        <title>${escapeHtml(og.title)}</title>
        
        ${!isBotAgent ? `
        <!-- Immediate Redirect for Users ONLY -->
        <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}">
        <script>window.location.href = "${targetUrl}"</script>
        ` : '<!-- Bot detected: No redirect, serving static tags -->'}
      </head>
      <body>
        ${isBotAgent ?
                `<h1>${escapeHtml(og.title)}</h1>
             <img src="${escapeHtml(og.image)}" alt="Preview" style="max-width:100%;" />
             <p>${escapeHtml(og.description)}</p>`
                :
                `<p>Redirecting to <a href="${escapeHtml(targetUrl)}">${escapeHtml(og.title)}</a>...</p>`
            }
      </body>
      </html>
    `

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=UTF-8',
                'Cache-Control': 'public, max-age=60, s-maxage=60',
                'Vary': 'User-Agent'
            },
            body: html
        }

    } catch (error) {
        console.error('Function Error:', error)
        return {
            statusCode: 302,
            headers: { Location: 'https://rebal.site' }
        }
    }
}
