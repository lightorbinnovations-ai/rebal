import { supabase } from "@/integrations/supabase/client";

interface InquiryPayload {
  company_id: string;
  name: string;
  email: string;
  message: string;
  property_id?: string;
  phone?: string;
}

interface AnalyticsPayload {
  company_id: string;
  event_type: "page_view" | "property_view" | "contact_click" | "share";
  property_id?: string;
}

interface ApiResponse {
  success?: boolean;
  id?: string;
  error?: string;
  retryAfter?: number;
}

/**
 * Submit an inquiry through the rate-limited public API
 */
export async function submitInquiry(payload: InquiryPayload): Promise<ApiResponse> {
  const { data, error } = await supabase.functions.invoke<ApiResponse>("public-api/inquiries", {
    body: payload,
  });

  if (error) {
    console.error("[Public API] Inquiry error:", error);
    throw new Error(error.message || "Failed to submit inquiry");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data || { success: true };
}

/**
 * Track an analytics event through the rate-limited public API
 */
export async function trackAnalytics(payload: AnalyticsPayload): Promise<ApiResponse> {
  try {
    // Direct Insert into DB (Bypassing Edge Function for reliability)
    const { error } = await supabase.from('analytics').insert({
      company_id: payload.company_id,
      property_id: payload.property_id,
      event_type: payload.event_type
      // created_at is default now()
    });

    if (error) {
      console.error("[Analytics] Tracking error:", error);
      // Fail silently
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    // Fail silently for analytics
    console.error("[Analytics] Tracking failed:", err);
    return { error: "Tracking failed" };
  }
}
