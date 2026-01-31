import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  max_properties: number | null;
  is_active: boolean;
}

interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: "trialing" | "active" | "cancelled" | "expired" | "past_due";
  paystack_subscription_code: string | null;
  paystack_customer_code: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  billing_interval: "monthly" | "yearly";
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  company_id: string;
  subscription_id: string | null;
  paystack_reference: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "abandoned";
  payment_method: string | null;
  paid_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export const useSubscription = (company: Company | null) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!company) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch plans
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("is_active", true)
          .order("monthly_price", { ascending: true });

        if (plansData) {
          setPlans(
            plansData.map((p) => ({
              ...p,
              features: Array.isArray(p.features)
                ? (p.features as string[])
                : typeof p.features === "string"
                  ? JSON.parse(p.features)
                  : [],
            }))
          );
        }

        // Fetch subscription - only consider it valid if status is active or payment was made
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("company_id", company.id)
          .single();

        if (subData) {
          // Only set subscription if it's active, otherwise treat as trial
          // This prevents showing paid plans before payment is confirmed
          const isValidPaidSubscription =
            subData.status === "active" ||
            (subData.status === "past_due" && subData.current_period_end);

          if (isValidPaidSubscription) {
            setSubscription(subData as Subscription);
          } else {
            // For trialing users or users with pending payments, force trial plan
            setSubscription({
              ...subData,
              plan_id: "trial", // Override to trial if not actively paid
            } as Subscription);
          }
        }

        // Fetch payments (only show completed payments, not pending/abandoned)
        const { data: paymentsData } = await supabase
          .from("payments")
          .select("*")
          .eq("company_id", company.id)
          .neq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(10);

        if (paymentsData) {
          setPayments(paymentsData as Payment[]);
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [company]);

  // Find the current plan - default to a trial-like plan if no valid subscription
  // NEVER fall back to plans[0] as that could be a paid plan
  const trialPlan = plans.find((p) => p.id === "trial");
  const currentPlan = subscription?.plan_id
    ? plans.find((p) => p.id === subscription.plan_id) || trialPlan || {
      id: "trial",
      name: "Free Trial",
      description: "Try REBAL free",
      monthly_price: 0,
      yearly_price: 0,
      features: ["1 property listing", "Basic analytics"],
      max_properties: 1,
      is_active: true
    }
    : trialPlan || {
      id: "trial",
      name: "Free Trial",
      description: "Try REBAL free",
      monthly_price: 0,
      yearly_price: 0,
      features: ["1 property listing", "Basic company profile", "Inquiry form"],
      max_properties: 1,
      is_active: true
    };

  const isTrialing = subscription?.status === "trialing";
  const isActive = subscription?.status === "active";
  const isPastDue = subscription?.status === "past_due";

  const daysRemaining = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : subscription?.current_period_end
      ? Math.max(0, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 14;

  const formatPrice = (amount: number) => {
    if (amount === 0) return "Free";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return {
    subscription,
    plans,
    payments,
    currentPlan,
    isLoading,
    isTrialing,
    isActive,
    isPastDue,
    daysRemaining,
    formatPrice,
  };
};
