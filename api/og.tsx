import { ImageResponse } from '@vercel/og';
import React from 'react';

export const config = {
    runtime: 'edge',
};

// Vercel OG Font config can be added here if needed
// For now using system sans-serif which is robust

export default async function handler(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type') || 'property';
    const version = searchParams.get('v');

    // Supabase REST endpoint construction
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!id || !SUPABASE_URL || !SUPABASE_KEY) {
        return new Response('Missing parameters or config', { status: 400 });
    }

    // Fetch Logic using native fetch to keep Edge function minimal
    let title = 'Rebal';
    let subtitle = 'Real Estate Business & Listings';
    let imageUrl = ''; // Fallback gradient
    let price = '';

    try {
        if (type === 'property') {
            // Fetch Property
            const propRes = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${id}&select=title,main_image_url,price,location,city,state,company_id`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });

            const props = await propRes.json();
            if (!props || props.length === 0) throw new Error('Property not found');

            const prop = props[0];
            title = prop.title;
            imageUrl = prop.main_image_url;

            // Format Price
            const priceVal = prop.price;
            if (priceVal) {
                price = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(priceVal);
            }

            const loc = [prop.city, prop.state].filter(Boolean).join(', ') || prop.location;

            // Fetch Company Name
            let companyName = 'Rebal';
            if (prop.company_id) {
                const compRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${prop.company_id}&select=name`, {
                    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
                });
                const comps = await compRes.json();
                if (comps && comps.length > 0) companyName = comps[0].name;
            }

            subtitle = `${loc} • ${companyName}`;

        } else if (type === 'company') {
            const compRes = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${id}&select=name,tagline,hero_image_url,logo_url`, {
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
            });
            const comps = await compRes.json();
            if (!comps || comps.length === 0) throw new Error('Company not found');

            const comp = comps[0];
            title = comp.name;
            subtitle = comp.tagline || 'Real Estate Professional';
            imageUrl = comp.hero_image_url || comp.logo_url;
        }
    } catch (e) {
        console.error('Error fetching data for OG:', e);
        // Fallback to default generic card
        title = 'Rebal Marketplace';
        subtitle = 'Find your dream property';
    }

    // Render Image
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    // Dynamic Background with fallback
                    backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(to bottom right, #0F172A, #334155)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: '#0F172A',
                }}
            >
                {/* Dark Gradient Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
                    }}
                />

                {/* Content Container */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '60px',
                        width: '100%',
                        // zIndex does not work in Satori like CSS, but flex order determines stacking usually. 
                        // In Satori, elements are stacked in source order. Overlay is first, so this is on top.
                    }}
                >
                    {/* Price Tag */}
                    {price && (
                        <div
                            style={{
                                backgroundColor: '#E11D48',
                                color: 'white',
                                padding: '12px 24px',
                                borderRadius: '12px',
                                fontSize: 32,
                                fontWeight: 'bold',
                                alignSelf: 'flex-start',
                                marginBottom: '20px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                        >
                            {price}
                        </div>
                    )}

                    {/* Title */}
                    <div
                        style={{
                            fontSize: 64,
                            fontWeight: 900,
                            color: 'white',
                            lineHeight: 1.1,
                            marginBottom: '10px',
                            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                            // Removing -webkit-box as requested by previous issues
                        }}
                    >
                        {title}
                    </div>

                    {/* Subtitle */}
                    <div
                        style={{
                            fontSize: 32,
                            color: '#E2E8F0',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            textShadow: '0 2px 5px rgba(0,0,0,0.5)',
                        }}
                    >
                        {subtitle}
                    </div>

                    {/* Branding */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '60px',
                            right: '60px',
                            display: 'flex',
                            fontSize: 24,
                            color: '#94A3B8',
                            fontWeight: 600
                        }}
                    >
                        rebal.site
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            headers: {
                // EXACT cache headers from Prompt
                'Cache-Control': 'public, max-age=0, s-maxage=31536000, immutable',
            },
        },
    );
}
