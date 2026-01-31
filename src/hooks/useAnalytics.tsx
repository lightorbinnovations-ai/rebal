import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AnalyticsEventType = 'page_view' | 'property_view';

interface UseAnalyticsProps {
    companyId?: string;
    propertyId?: string;
    eventType: AnalyticsEventType;
    enabled?: boolean;
}

export const useAnalytics = ({
    companyId,
    propertyId,
    eventType,
    enabled = true
}: UseAnalyticsProps) => {
    const hasTracked = useRef(false);

    useEffect(() => {
        const trackEvent = async () => {
            // Prevent double tracking in React Strict Mode or fast re-renders
            if (hasTracked.current || !enabled) return;

            // Basic validation
            if (!companyId && !propertyId) return;

            try {
                hasTracked.current = true;

                await supabase.from('analytics').insert({
                    event_type: eventType,
                    company_id: companyId,
                    property_id: propertyId,
                    // created_at is automatic
                });

                console.log(`[Analytics] Tracked ${eventType}`, { companyId, propertyId });
            } catch (error) {
                console.warn('[Analytics] Failed to track event:', error);
                // Don't crash the app for analytics failures, but maybe log to internal monitoring if available
                hasTracked.current = false; // Allow retry on next mount if it was a network error? Maybe not to avoid spam.
            }
        };

        trackEvent();
    }, [companyId, propertyId, eventType, enabled]);
};
