import { AlertTriangle, CreditCard } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface GracePeriodWarningProps {
  daysRemaining: number;
  gracePeriodEnd: Date | null;
}

export const GracePeriodWarning = ({ daysRemaining, gracePeriodEnd }: GracePeriodWarningProps) => {
  const navigate = useNavigate();

  if (!gracePeriodEnd) return null;

  const isUrgent = daysRemaining <= 1;
  const formattedDate = gracePeriodEnd.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Alert variant="destructive" className={isUrgent ? "animate-pulse border-2" : ""}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Payment Failed - Action Required
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">
          Your last payment failed. You have{" "}
          <strong>
            {daysRemaining === 0
              ? "less than a day"
              : `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`}
          </strong>{" "}
          (until {formattedDate}) to update your payment method before your account is
          downgraded to the free plan.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-background hover:bg-background/80"
          onClick={() => navigate("/dashboard/settings")}
        >
          <CreditCard className="h-4 w-4" />
          Update Payment Method
        </Button>
      </AlertDescription>
    </Alert>
  );
};
