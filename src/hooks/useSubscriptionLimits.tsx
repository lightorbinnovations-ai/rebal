import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";

interface SubscriptionLimits {
  maxProperties: number;
  currentProperties: number;
  canAddProperty: boolean;
  isTrialing: boolean;
  isActive: boolean;
  isExpired: boolean;
  isPastDue: boolean;
  isInGracePeriod: boolean;
  gracePeriodEnd: Date | null;
  gracePeriodDaysRemaining: number;
  daysRemaining: number;
  planName: string;
  planId: string;
  features: {
    analytics: boolean;
    advancedAnalytics: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    verificationBadge: boolean;
    customDomain: boolean;
    richSocialPreviews: boolean;
    customShortCodes: boolean;
  };
}

// Plan tier order for upgrade/downgrade comparison
export const PLAN_TIER_ORDER: Record<string, number> = {
  trial: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

export const useSubscriptionLimits = (company: Company | null) => {
  const [limits, setLimits] = useState<SubscriptionLimits>({
    maxProperties: 1,
    currentProperties: 0,
    canAddProperty: true,
    isTrialing: true,
    isActive: true,
    isExpired: false,
    isPastDue: false,
    isInGracePeriod: false,
    gracePeriodEnd: null,
    gracePeriodDaysRemaining: 0,
    daysRemaining: 14,
    planName: "Free Trial",
    planId: "trial",
    features: {
      analytics: false,
      advancedAnalytics: false,
      customBranding: false,
      prioritySupport: false,
      verificationBadge: false,
      customDomain: false,
      richSocialPreviews: false,
      customShortCodes: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkLimits = useCallback(async () => {
    if (!company) {
      setIsLoading(false);
      return;
    }

    try {
      // Get current property count
      const { count: propertyCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);

      // Get subscription info including grace period fields
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*, plan:subscription_plans(*)")
        .eq("company_id", company.id)
        .single();

      // Get company subscription status
      const { data: companyData } = await supabase
        .from("companies")
        .select("subscription_status, subscription_end_date, max_properties")
        .eq("id", company.id)
        .single();

      const currentCount = propertyCount || 0;
      let maxProps = 1; // Default for trial (reduced from 3)
      let planName = "Free Trial";
      let planId = "trial";
      let isTrialing = true;
      let isActive = true;
      let isPastDue = false;
      let isInGracePeriod = false;
      let gracePeriodEnd: Date | null = null;
      let gracePeriodDaysRemaining = 0;
      let daysRemaining = 14;

      // Default features for trial (minimal access)
      let features = {
        analytics: false,
        advancedAnalytics: false,
        customBranding: false,
        prioritySupport: false,
        verificationBadge: false,
        customDomain: false,
        richSocialPreviews: false,
        customShortCodes: false,
      };

      // CRITICAL: Only apply paid plan features if subscription is ACTIVE (payment confirmed)
      // This prevents users from getting features just by clicking "upgrade" without paying
      const isActivePaidSubscription =
        subscription?.status === "active" ||
        (subscription?.status === "past_due" && subscription?.current_period_end);

      if (subscription?.plan && isActivePaidSubscription) {
        const plan = subscription.plan;
        maxProps = plan.max_properties || 999;
        planName = plan.name;
        planId = subscription.plan_id || "trial";

        // Set features based on plan tier - ONLY if actively paid
        switch (subscription.plan_id) {
          case "starter":
            features = {
              analytics: true,
              advancedAnalytics: false,
              customBranding: false,
              prioritySupport: false,
              verificationBadge: false,
              customDomain: false,
              richSocialPreviews: true,
              customShortCodes: true,
            };
            break;
          case "pro":
            features = {
              analytics: true,
              advancedAnalytics: true,
              customBranding: true,
              prioritySupport: true,
              verificationBadge: false,
              customDomain: false,
              richSocialPreviews: true,
              customShortCodes: true,
            };
            break;
          case "business":
            features = {
              analytics: true,
              advancedAnalytics: true,
              customBranding: true,
              prioritySupport: true,
              verificationBadge: true,
              customDomain: true,
              richSocialPreviews: true,
              customShortCodes: true,
            };
            break;
          default:
            // trial or unknown - minimal features, already set above
            break;
        }
      } else {
        // User is on trial or has pending/unpaid subscription - use trial defaults
        planName = "Free Trial";
        planId = "trial";
        maxProps = 1;
        // features already set to minimal defaults above
      }

      // Check subscription status
      const status = companyData?.subscription_status || subscription?.status || "trialing";
      isTrialing = status === "trialing";
      isPastDue = status === "past_due";

      // Check grace period
      const subAny = subscription as any;
      if (isPastDue && subAny?.grace_period_end) {
        const gpEnd = new Date(subAny.grace_period_end);
        if (gpEnd > new Date()) {
          isInGracePeriod = true;
          gracePeriodEnd = gpEnd;
          gracePeriodDaysRemaining = Math.max(0, Math.ceil((gpEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        }
      }

      // Active means: active status, or trialing with time left, or in grace period
      isActive = status === "active" || (isTrialing && daysRemaining > 0) || isInGracePeriod;

      // Calculate days remaining
      const endDate = companyData?.subscription_end_date || subscription?.trial_end || subscription?.current_period_end;
      if (endDate) {
        const end = new Date(endDate);
        const now = new Date();
        daysRemaining = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      } else if (isTrialing) {
        // Default trial: 14 days from company creation
        const createdAt = new Date(company.created_at);
        const trialEnd = new Date(createdAt);
        trialEnd.setDate(trialEnd.getDate() + 14);
        daysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      const isExpired = (isTrialing && daysRemaining <= 0) || (isPastDue && !isInGracePeriod);

      setLimits({
        maxProperties: maxProps,
        currentProperties: currentCount,
        canAddProperty: currentCount < maxProps && !isExpired,
        isTrialing,
        isActive: isActive && !isExpired,
        isExpired,
        isPastDue,
        isInGracePeriod,
        gracePeriodEnd,
        gracePeriodDaysRemaining,
        daysRemaining,
        planName,
        planId,
        features,
      });
    } catch (error) {
      console.error("Error checking subscription limits:", error);
    } finally {
      setIsLoading(false);
    }
  }, [company]);

  useEffect(() => {
    checkLimits();
  }, [checkLimits]);

  return { ...limits, isLoading, refetch: checkLimits };
};
