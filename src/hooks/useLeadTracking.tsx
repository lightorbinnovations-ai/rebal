import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseLeadTrackingProps {
  companyId: string;
  propertyId?: string;
}

export const useLeadTracking = ({ companyId, propertyId }: UseLeadTrackingProps) => {
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem("rebal_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("rebal_session_id", sessionId);
    }
    sessionIdRef.current = sessionId;

    // Only track if we have a valid company ID (not empty string)
    if (!companyId) {
      return;
    }

    // Track page view
    const trackPageView = async () => {
      try {
        // Get existing tracking for this session using anon key - no auth required for lead tracking
        const { data: existing, error: selectError } = await supabase
          .from("lead_tracking")
          .select("*")
          .eq("session_id", sessionId)
          .eq("company_id", companyId)
          .maybeSingle();

        // If we get an auth error, silently skip tracking - RLS may require auth
        if (selectError && selectError.code === "42501") {
          console.debug("Lead tracking skipped - auth required");
          return;
        }

        if (existing) {
          // Update existing record
          const propertiesViewed = existing.properties_viewed || [];
          if (propertyId && !propertiesViewed.includes(propertyId)) {
            propertiesViewed.push(propertyId);
          }

          await supabase
            .from("lead_tracking")
            .update({
              page_views: (existing.page_views || 0) + 1,
              properties_viewed: propertiesViewed,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Create new tracking record - may fail if RLS requires auth
          const { error: insertError } = await supabase.from("lead_tracking").insert({
            session_id: sessionId,
            company_id: companyId,
            property_id: propertyId || null,
            page_views: 1,
            properties_viewed: propertyId ? [propertyId] : [],
            time_spent_seconds: 0,
          });
          
          // Silently ignore auth errors for anonymous visitors
          if (insertError && insertError.code !== "42501") {
            console.debug("Lead tracking insert skipped:", insertError.message);
          }
        }
      } catch (error) {
        // Silently fail - tracking is non-critical
        console.debug("Lead tracking error:", error);
      }
    };

    trackPageView();

    // Track time spent when leaving page
    const handleBeforeUnload = () => {
      // Skip if no valid company ID
      if (!companyId) return;

      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      // Use fetch with keepalive for page unload tracking
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/lead_tracking`);
      url.searchParams.set("session_id", `eq.${sessionIdRef.current}`);
      url.searchParams.set("company_id", `eq.${companyId}`);
      
      const headers = {
        "Content-Type": "application/json",
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        "Prefer": "return=minimal",
      };

      const body = JSON.stringify({
        time_spent_seconds: timeSpent,
        updated_at: new Date().toISOString(),
      });

      try {
        fetch(url.toString(), {
          method: "PATCH",
          headers,
          body,
          keepalive: true,
        }).catch(() => {
          // Silently fail - this is best effort tracking
        });
      } catch {
        // Silently fail
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also track time when component unmounts
      handleBeforeUnload();
    };
  }, [companyId, propertyId]);

  // Function to link tracking data to an inquiry
  const linkToInquiry = async (inquiryId: string) => {
    try {
      const { data: tracking } = await supabase
        .from("lead_tracking")
        .select("page_views, time_spent_seconds, properties_viewed")
        .eq("session_id", sessionIdRef.current)
        .eq("company_id", companyId)
        .maybeSingle();

      if (tracking) {
        // Calculate lead score
        const engagementScore =
          (tracking.page_views || 0) * 2 +
          Math.floor((tracking.time_spent_seconds || 0) / 60) +
          ((tracking.properties_viewed?.length || 0) * 3);

        let leadScore = "cold";
        if (engagementScore >= 15) leadScore = "hot";
        else if (engagementScore >= 5) leadScore = "warm";

        await supabase
          .from("inquiries")
          .update({
            page_views: tracking.page_views || 0,
            time_spent_seconds: tracking.time_spent_seconds || 0,
            properties_viewed: tracking.properties_viewed?.length || 0,
            lead_score: leadScore,
          })
          .eq("id", inquiryId);
      }
    } catch (error) {
      console.error("Error linking tracking to inquiry:", error);
    }
  };

  return { linkToInquiry, sessionId: sessionIdRef.current };
};
