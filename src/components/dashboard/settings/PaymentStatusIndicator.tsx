import { useState, useEffect } from "react";
import { Loader2, Clock, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface PendingPayment {
  id: string;
  paystack_reference: string;
  amount: number;
  status: string;
  created_at: string;
  metadata: {
    plan_name?: string;
    plan_id?: string;
    billing_interval?: string;
  };
}

interface PaymentStatusIndicatorProps {
  companyId: string;
  onPaymentComplete?: () => void;
}

export const PaymentStatusIndicator = ({
  companyId,
  onPaymentComplete
}: PaymentStatusIndicatorProps) => {
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ignoredPaymentIds, setIgnoredPaymentIds] = useState<Set<string>>(new Set());

  // Check for pending payments on mount and periodically
  useEffect(() => {
    const checkPendingPayments = async () => {
      // Don't fetch if we have a visible pending payment that hasn't been ignored
      if (pendingPayment && !ignoredPaymentIds.has(pendingPayment.id)) return;

      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        // Skip if this payment was explicitly ignored in this session
        if (ignoredPaymentIds.has(data.id)) {
          setPendingPayment(null);
          return;
        }

        // Only show if created within last 45 minutes (extended to allow more time)
        const createdAt = new Date(data.created_at);
        const validTimeWindow = new Date(Date.now() - 45 * 60 * 1000);

        if (createdAt > validTimeWindow) {
          setPendingPayment(data as PendingPayment);
        } else {
          setPendingPayment(null);
        }
      } else {
        setPendingPayment(null);
      }
    };

    checkPendingPayments();

    // Poll every 10 seconds for status updates
    const interval = setInterval(checkPendingPayments, 10000);

    return () => clearInterval(interval);
  }, [companyId, pendingPayment, ignoredPaymentIds]);

  // Animate progress bar for visual feedback
  useEffect(() => {
    if (!pendingPayment) {
      setProgress(0);
      return;
    }

    const createdAt = new Date(pendingPayment.created_at).getTime();
    const now = Date.now();
    const elapsed = now - createdAt;
    const maxTime = 30 * 60 * 1000; // 30 minutes target

    // Calculate progress but keep it moving slowly if it hits 95%
    const calculatedProgress = Math.min((elapsed / maxTime) * 100, 95);
    setProgress(Math.max(5, calculatedProgress));

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + 0.1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingPayment]);

  const handleVerifyPayment = async () => {
    if (!pendingPayment) return;

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-verify", {
        body: { reference: pendingPayment.paystack_reference },
      });

      if (error) throw error;

      if (data?.success) {
        setProgress(100);
        setPendingPayment(null);
        // Important: Add to ignored list so it doesn't reappear before page reload
        setIgnoredPaymentIds(prev => new Set(prev).add(pendingPayment.id));
        onPaymentComplete?.();
      } else {
        // Payment not successful yet
        console.log("Verification checks:", data); // Debug info
        // Don't show error toast for "processing" or "abandoned" unless explicit
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!pendingPayment) return;

    // Optimistically hide from UI immediately
    const paymentId = pendingPayment.id;
    setPendingPayment(null);
    setIgnoredPaymentIds(prev => new Set(prev).add(paymentId));

    try {
      // Attempt to mark as abandoned in DB
      const { error } = await supabase
        .from("payments")
        .update({ status: "abandoned" })
        .eq("id", paymentId);

      if (error) {
        console.error("Failed to cancel payment in DB:", error);
        // We don't restore the UI because the user explicitly cancelled it
      }
    } catch (err) {
      console.error("Error cancelling payment:", err);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!pendingPayment) return null;

  const planName = pendingPayment.metadata?.plan_name || "Selected Plan";
  const billingInterval = pendingPayment.metadata?.billing_interval || "monthly";

  return (
    <Alert className={cn(
      "border-2 border-primary/50 bg-primary/5",
      "animate-in fade-in-0 slide-in-from-top-2 duration-300"
    )}>
      <Clock className="h-5 w-5 text-primary animate-pulse" />
      <AlertTitle className="flex items-center gap-2">
        Payment In Progress
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="font-medium">
              Upgrading to <span className="text-primary">{planName}</span> ({billingInterval})
            </p>
            <p className="text-sm text-muted-foreground">
              {formatPrice(pendingPayment.amount)} • Ref: {pendingPayment.paystack_reference.slice(-8)}
            </p>
          </div>
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleVerifyPayment}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                I've Completed Payment
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleCancelPayment}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          If you completed payment in Paystack, click "I've Completed Payment" to verify.
          The system will also automatically detect successful payments.
        </p>
      </AlertDescription>
    </Alert>
  );
};

export default PaymentStatusIndicator;