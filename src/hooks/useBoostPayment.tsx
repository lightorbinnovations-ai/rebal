import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InitializeBoostParams {
  propertyId: string;
  days: number;
  callbackUrl?: string;
}

interface BoostResult {
  success: boolean;
  authorization_url?: string;
  reference?: string;
  amount?: number;
  days?: number;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  status?: string;
  days?: number;
  expires_at?: string;
  property_title?: string;
  error?: string;
}

export const useBoostPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const initializeBoostPayment = async ({
    propertyId,
    days,
    callbackUrl,
  }: InitializeBoostParams): Promise<BoostResult> => {
    setIsProcessing(true);
    try {
      const callback_url =
        callbackUrl || `${window.location.origin}/dashboard/properties?boost_verify=1`;

      const { data, error } = await supabase.functions.invoke("boost-payment-initialize", {
        body: {
          property_id: propertyId,
          days,
          callback_url,
        },
      });

      if (error) {
        throw new Error(error.message || "Boost payment initialization failed");
      }

      return (data || { success: false }) as BoostResult;
    } catch (error: any) {
      toast({
        title: "Boost Error",
        description: error.message || "Failed to initialize boost payment",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyBoostPayment = async (reference: string): Promise<VerifyResult> => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("boost-payment-verify", {
        body: { reference },
      });

      if (error) {
        throw new Error(error.message || "Boost verification failed");
      }

      const result = (data || { success: false }) as VerifyResult;

      if (result.success) {
        toast({
          title: "Boost Activated! 🚀",
          description: `Your property is now boosted for ${result.days} days.`,
        });
      }

      return result;
    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify boost payment",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  const redirectToBoostPayment = async (params: InitializeBoostParams): Promise<void> => {
    const result = await initializeBoostPayment(params);
    if (result.success && result.authorization_url) {
      window.location.href = result.authorization_url;
    }
  };

  return {
    isProcessing,
    initializeBoostPayment,
    verifyBoostPayment,
    redirectToBoostPayment,
  };
};
