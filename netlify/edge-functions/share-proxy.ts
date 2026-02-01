import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuration for Open Graph tags
const DEFAULT_OG = {
    title: 'REBAL - Real Estate Business & Listings',
    description: 'The all-in-one platform for real estate professionals.',
    image: 'https://rebal.site/og-image.png', // Fallback image
    url: 'https://rebal.site'
}

export default async (request: Request, context: any) => {
    const url = new URL(request.url)

    // Extract short code from path: /s/{code}
    // format: /s/abc12345
    const pathParts = url.pathname.split('/')
    const shortCode = pathParts[pathParts.length - 1]

    if (!shortCode) {
        return context.next() // Fallback to SPA if no code
    }

    try {
        // Initialize Supabase Client
        // We use Deno.env for Netlify Edge Functions
        const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('VITE_SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_ANON_KEY')

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials')
            return context.next()
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch the short link definition
        // We need to know if it maps to a property or a company
        console.log('[Edge Function] Looking up short code:', shortCode)

        const { data: linkData, error: linkError } = await supabase
            .from('short_links')
            .select('property_id, company_id, full_path')
            .eq('short_code', shortCode)
            .maybeSingle()

        if (linkError) {
            console.error('[Edge Function] Database error:', linkError)
            return context.next()
        }

        if (!linkData) {
            console.log('[Edge Function] Link not found:', shortCode)
            // If link not found in DB, just let the SPA handle 404
            return context.next()
        }

        console.log('[Edge Function] Link data:', linkData)

        // 2. Determine OG Data based on link type
        let og = { ...DEFAULT_OG }
        og.url = `https://rebal.site${linkData.full_path}`

        // Case A: Property Link
        if (linkData.property_id) {
            const { data: prop, error: propError } = await supabase
                .from('properties')
                .select('title, description, price, main_image_url, gallery_urls, purpose, currency, company_id')
                .eq('id', linkData.property_id)
                .maybeSingle()

            if (prop && !propError) {
                // Fetch company name for branding
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

                // Use main_image_url first, then fallback to first gallery image
                if (prop.main_image_url) {
                    og.image = prop.main_image_url
                } else if (prop.gallery_urls && Array.isArray(prop.gallery_urls) && prop.gallery_urls.length > 0) {
                    og.image = prop.gallery_urls[0]
                }
            }
        }
        // Case B: Company Link (if no property_id)
        else if (linkData.company_id) {
            const { data: comp, error: compError } = await supabase
                .from('companies')
                .select('name, description, logo_url, profile_picture_url, tagline')
                .eq('id', linkData.company_id)
                .single()

            if (comp && !compError) {
                og.title = `${comp.name} - ${comp.tagline || 'Real Estate Profile'}`
                og.description = comp.description?.substring(0, 160) || DEFAULT_OG.description
                if (comp.logo_url) {
                    og.image = comp.logo_url
                } else if (comp.profile_picture_url) {
                    og.image = comp.profile_picture_url
                }
            }
        }

        // 3. Generate HTML Response
        // We return a static HTML page purely for the crawler/preview
        // But importantly, we include a JS redirect and a Meta Refresh to send real users to the app

        // Sanitize function to prevent XSS in OG tags
        const escapeHtml = (str: string) => str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]!)

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

        return new Response(html, {
            headers: {
                'content-type': 'text/html; charset=UTF-8',
                'cache-control': 'public, max-age=60, s-maxage=60' // Short cache for previews
            },
        })

    } catch (error) {
        console.error('Edge Function Error:', error)
        return context.next()
    }
}
