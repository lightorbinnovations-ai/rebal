import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PLAN_TIER_ORDER } from "@/hooks/useSubscriptionLimits";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  max_properties: number | null;
  features: string[];
}

interface SubscriptionPlanCardProps {
  plan: Plan;
  currentPlanId: string | undefined;
  isYearly: boolean;
  processingPlanId: string | null;
  formatPrice: (amount: number) => string;
  onUpgrade: (planId: string) => void;
}

export const SubscriptionPlanCard = ({
  plan,
  currentPlanId,
  isYearly,
  processingPlanId,
  formatPrice,
  onUpgrade,
}: SubscriptionPlanCardProps) => {
  const isCurrent = plan.id === currentPlanId;
  const price = isYearly ? plan.yearly_price : plan.monthly_price;
  const period = isYearly ? "/year" : "/month";
  const isPopular = plan.id === "pro";
  
  // Determine upgrade/downgrade based on plan tier
  const currentTier = PLAN_TIER_ORDER[currentPlanId || "trial"] || 0;
  const planTier = PLAN_TIER_ORDER[plan.id] || 0;
  const isUpgrade = planTier > currentTier;
  const isDowngrade = planTier < currentTier;

  // Get button text
  const getButtonText = () => {
    if (isCurrent) return "Current Plan";
    if (plan.id === "trial") return "Free Trial";
    if (isUpgrade) return "Upgrade";
    if (isDowngrade) return "Downgrade";
    return "Select";
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full",
        isCurrent && "border-primary border-2",
        isPopular && !isCurrent && "border-primary/50"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary">
            <Sparkles className="mr-1 h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        {isCurrent && (
          <Badge variant="secondary" className="absolute top-4 right-4">
            Current
          </Badge>
        )}
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="pt-4">
          <span className="text-4xl font-bold">{formatPrice(price)}</span>
          {price > 0 && (
            <span className="text-muted-foreground">{period}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto pt-4">
        <Button
          variant={isCurrent ? "outline" : isPopular ? "default" : isDowngrade ? "ghost" : "outline"}
          className={cn("w-full", isDowngrade && "text-muted-foreground")}
          disabled={isCurrent || processingPlanId !== null || plan.id === "trial"}
          onClick={() => onUpgrade(plan.id)}
        >
          {processingPlanId === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SubscriptionPlanCard;
