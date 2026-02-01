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

export const handler: Handler = async (event) => {
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

        // Fetch short link
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
        og.url = `https://rebal.site${linkData.full_path}`

        // Property Link
        if (linkData.property_id) {
            const { data: prop } = await supabase
                .from('properties')
                .select('title, description, price, main_image_url, gallery_urls, purpose, currency, company_id')
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
                    currency: prop.currency || 'NGN',
                    maximumFractionDigits: 0
                }).format(prop.price)

                og.title = `${prop.title} | ${companyName}`
                og.description = `${prop.purpose} for ${priceFormatted}. ${prop.description?.substring(0, 150) || ''}...`

                if (prop.main_image_url) {
                    og.image = prop.main_image_url
                } else if (prop.gallery_urls && Array.isArray(prop.gallery_urls) && prop.gallery_urls.length > 0) {
                    og.image = prop.gallery_urls[0]
                }
            }
        }
        // Company Link
        else if (linkData.company_id) {
            const { data: comp } = await supabase
                .from('companies')
                .select('name, description, logo_url, profile_picture_url, tagline')
                .eq('id', linkData.company_id)
                .maybeSingle()

            if (comp) {
                og.title = `${comp.name} - ${comp.tagline || 'Real Estate Profile'}`
                og.description = comp.description?.substring(0, 160) || DEFAULT_OG.description
                if (comp.logo_url) {
                    og.image = comp.logo_url
                } else if (comp.profile_picture_url) {
                    og.image = comp.profile_picture_url
                }
            }
        }

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
        
        <!-- Immediate Redirect for Users -->
        <meta http-equiv="refresh" content="0;url=${escapeHtml(og.url)}">
        <script>window.location.href = "${og.url}"</script>
      </head>
      <body>
        <p>Redirecting to <a href="${escapeHtml(og.url)}">${escapeHtml(og.title)}</a>...</p>
      </body>
      </html>
    `

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=UTF-8',
                'Cache-Control': 'public, max-age=60, s-maxage=60'
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
