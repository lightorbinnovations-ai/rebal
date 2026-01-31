import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DomainPaymentParams {
  domainRequestId: string;
  amount: number;
  domainName: string;
  callbackUrl?: string;
}

interface PaymentResult {
  success: boolean;
  authorization_url?: string;
  reference?: string;
  error?: string;
}

export const useDomainPayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initializeDomainPayment = async ({
    domainRequestId,
    amount,
    domainName,
    callbackUrl,
  }: DomainPaymentParams): Promise<PaymentResult> => {
    setIsLoading(true);
    try {
      const callback_url =
        callbackUrl || `${window.location.origin}/dashboard/domain?payment=success`;

      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          payment_type: "domain",
          domain_request_id: domainRequestId,
          amount,
          domain_name: domainName,
          callback_url,
        },
      });

      if (error) {
        throw new Error(error.message || "Payment initialization failed");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to initialize payment");
      }

      return data as PaymentResult;
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToDomainPayment = async (params: DomainPaymentParams): Promise<void> => {
    const result = await initializeDomainPayment(params);
    if (result.success && result.authorization_url) {
      window.location.href = result.authorization_url;
    }
  };

  return {
    isLoading,
    initializeDomainPayment,
    redirectToDomainPayment,
  };
};
