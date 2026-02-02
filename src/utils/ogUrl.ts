
// Utility to generate the Dynamic OG Image URL
// Points to the Supabase Edge Function 'og-renderer'

import { supabase } from "@/integrations/supabase/client";

// Get project reference from Supabase URL
const getProjectRef = () => {
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
    return match ? match[1] : "";
};

const PROJECT_REF = getProjectRef();
const FUNCTION_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/og-renderer`;

export const getDynamicOgUrl = (
    id: string,
    type: 'property' | 'company',
    version: number = 1
) => {
    if (!PROJECT_REF) {
        console.warn("Supabase Project Ref not found for OG URL generation");
        return "";
    }

    // Construct URL with strict parameters for caching
    const url = new URL(FUNCTION_URL);
    url.searchParams.set('id', id);
    url.searchParams.set('type', type);
    // v parameter ensures cache busting when content updates
    url.searchParams.set('v', version.toString());

    return url.toString();
};
