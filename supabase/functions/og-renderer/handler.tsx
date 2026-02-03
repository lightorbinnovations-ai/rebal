// Setup Satori and React for Edge usage
// Follows strict "Production Ready" requirement

import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import React from 'https://esm.sh/react@18.2.0?deno-std=0.140.0';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CACHE CONFIG: 
// Public: Shared cache
// max-age=0: Browser must revalidate (or check version)
// s-maxage=31536000: CDN can cache for 1 year (since we use v=VERSION)
// immutable: The content for this specific VERSION never changes
const CACHE_HEADERS = {
    'Cache-Control': 'public, max-age=0, s-maxage=31536000, immutable',
};

Deno.serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        const type = url.searchParams.get('type') || 'property'; // 'property' or 'company'
        const version = url.searchParams.get('v');

        // 2. Validate Inputs
        if (!id || !version) {
            return new Response("Missing 'id' or 'v' param", { status: 400 });
        }

        // 3. Setup Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!; // Public Read is sufficient
        const supabase = createClient(supabaseUrl, supabaseKey);

        let title, subtitle, imageUrl, price, location;

        // 4. Fetch Data Based on Type
        if (type === 'property') {
            const { data, error } = await supabase
                .from('properties')
                .select('title, main_image_url, price, location, city, state, company_id')
                .eq('id', id)
                .single();

            if (error || !data) return new Response("Property not found", { status: 404 });

            title = data.title;
            const priceFormatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(data.price);
            price = priceFormatted;
            location = [data.city, data.state].filter(Boolean).join(', ') || data.location;
            imageUrl = data.main_image_url;

            // Fetch company separately to avoid RLS/join issues
            let companyName = 'Rebal';
            if (data.company_id) {
                const { data: company } = await supabase
                    .from('companies')
                    .select('name')
                    .eq('id', data.company_id)
                    .single();
                if (company) companyName = company.name;
            }

            subtitle = `${location} • ${companyName}`;


        } else if (type === 'company') {
            const { data, error } = await supabase
                .from('companies')
                .select('name, tagline, hero_image_url, logo_url')
                .eq('id', id)
                .single();

            if (error || !data) return new Response("Company not found", { status: 404 });

            title = data.name;
            subtitle = data.tagline || 'Real Estate Professional';
            imageUrl = data.hero_image_url || data.logo_url;
        }

        // 5. Render Dynamic Image (Satori)
        // Using a robust, responsive layout that works for WhatsApp/FB/Twitter
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
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'linear-gradient(to bottom right, #0F172A, #334155)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: '#0F172A',
                    }}
                >
                    {/* Dark Gradient Overlay for Text Readability */}
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
                            zIndex: 10,
                            width: '100%',
                        }}
                    >
                        {/* Price Tag (if Property) */}
                        {price && (
                            <div
                                style={{
                                    backgroundColor: '#E11D48', // Brand Color
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
                                overflow: 'hidden',
                            }}
                        >
                            {title}
                        </div>

                        {/* Subtitle / Location */}
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

                        {/* Branding Footer */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '60px',
                                right: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                opacity: 0.9,
                            }}
                        >
                            <span style={{ fontSize: 24, color: '#94A3B8', fontWeight: 600 }}>rebal.site</span>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                // Strict cache headers are applied here
                headers: {
                    ...corsHeaders,
                    ...CACHE_HEADERS
                }
            },
        );

    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders,
        });
    }
});
