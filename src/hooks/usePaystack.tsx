import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InitializePaymentParams {
  planId: string;
  billingInterval: "monthly" | "yearly";
  callbackUrl?: string;
}

interface PaymentResult {
  success: boolean;
  authorization_url?: string;
  access_code?: string;
  reference?: string;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  status?: string;
  amount?: number;
  plan?: string;
  error?: string;
}

export const usePaystack = () => {
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const { toast } = useToast();

  const initializePayment = async ({
    planId,
    billingInterval,
    callbackUrl,
  }: InitializePaymentParams): Promise<PaymentResult> => {
    setProcessingPlanId(planId);
    try {
      const callback_url =
        callbackUrl || `${window.location.origin}/dashboard/settings?tab=billing`;

      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          plan_id: planId,
          billing_interval: billingInterval,
          callback_url,
        },
      });

      if (error) {
        throw new Error(error.message || "Payment initialization failed");
      }

      return (data || { success: false }) as PaymentResult;
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setProcessingPlanId(null);
    }
  };

  const verifyPayment = async (reference: string): Promise<VerifyResult> => {
    setProcessingPlanId("verifying");
    try {
      const { data, error } = await supabase.functions.invoke("paystack-verify", {
        body: { reference },
      });

      if (error) {
        throw new Error(error.message || "Payment verification failed");
      }

      const result = (data || { success: false }) as VerifyResult;

      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: `Your ${result.plan} subscription is now active.`,
        });
      }

      return result;
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify payment",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setProcessingPlanId(null);
    }
  };

  const redirectToPayment = async (params: InitializePaymentParams): Promise<void> => {
    const result = await initializePayment(params);
    if (result.success && result.authorization_url) {
      window.location.href = result.authorization_url;
    }
  };

  const cancelSubscription = async (): Promise<{ success: boolean; error?: string }> => {
    setProcessingPlanId("cancelling");
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: {},
      });

      if (error) {
        throw new Error(error.message || "Failed to cancel subscription");
      }

      const result = (data || { success: false }) as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || "Failed to cancel subscription");
      }

      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You can resubscribe anytime.",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Cancellation Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setProcessingPlanId(null);
    }
  };

  return {
    processingPlanId,
    isLoading: processingPlanId !== null,
    initializePayment,
    verifyPayment,
    redirectToPayment,
    cancelSubscription,
  };
};
