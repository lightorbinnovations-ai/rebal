import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomDomainData {
    isCustomDomain: boolean;
    companyId: string | null;
    companySlug: string | null;
    domain: string | null;
    isLoading: boolean;
}

// List of known platform domains that should NOT be treated as custom domains
const PLATFORM_DOMAINS = [
    "localhost",
    "127.0.0.1",
    "rebal.com.ng",
    "www.rebal.com.ng",
    "rebal.vercel.app",
    "rebal.netlify.app",
    // Add your staging/preview domains here
];

export const useCustomDomain = (): CustomDomainData => {
    const [data, setData] = useState<CustomDomainData>({
        isCustomDomain: false,
        companyId: null,
        companySlug: null,
        domain: null,
        isLoading: true,
    });

    useEffect(() => {
        const detectCustomDomain = async () => {
            const hostname = window.location.hostname;

            // Check if this is a known platform domain
            const isPlatformDomain = PLATFORM_DOMAINS.some(
                (d) => hostname === d || hostname.endsWith(`.${d}`)
            );

            if (isPlatformDomain) {
                setData({
                    isCustomDomain: false,
                    companyId: null,
                    companySlug: null,
                    domain: null,
                    isLoading: false,
                });
                return;
            }

            // Check if hostname matches a custom domain in the database
            try {
                const { data: customDomain, error } = await supabase
                    .from("custom_domains")
                    .select("company_id, domain, companies(slug)")
                    .eq("domain", hostname)
                    .eq("status", "active")
                    .single();

                if (error || !customDomain) {
                    // Not a recognized custom domain
                    setData({
                        isCustomDomain: false,
                        companyId: null,
                        companySlug: null,
                        domain: null,
                        isLoading: false,
                    });
                    return;
                }

                // Found a matching custom domain
                const companyData = customDomain.companies as { slug: string } | null;
                setData({
                    isCustomDomain: true,
                    companyId: customDomain.company_id,
                    companySlug: companyData?.slug || null,
                    domain: customDomain.domain,
                    isLoading: false,
                });
            } catch (err) {
                console.error("Error detecting custom domain:", err);
                setData({
                    isCustomDomain: false,
                    companyId: null,
                    companySlug: null,
                    domain: null,
                    isLoading: false,
                });
            }
        };

        detectCustomDomain();
    }, []);

    return data;
};
