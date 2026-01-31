import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SelectedPlanBadgeProps {
  planId: string | null;
  interval: string | null;
}

interface Plan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
}

const formatPrice = (amount: number) => {
  if (amount === 0) return "Free";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const SelectedPlanBadge = ({ planId, interval }: SelectedPlanBadgeProps) => {
  const [plan, setPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!planId) return;

    const fetchPlan = async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("id, name, monthly_price, yearly_price")
        .eq("id", planId)
        .single();

      if (data) {
        setPlan(data);
      }
    };

    fetchPlan();
  }, [planId]);

  if (!planId || !plan) return null;

  const isYearly = interval === "yearly";
  const price = isYearly ? plan.yearly_price : plan.monthly_price;
  const periodLabel = isYearly ? "/year" : "/month";

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-2">
      <div className="flex items-center justify-center gap-2">
        <Crown className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Selected Plan</span>
      </div>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-2xl font-bold text-foreground">{plan.name}</span>
        <Badge variant="secondary" className="ml-2">
          {formatPrice(price)}
          {price > 0 && <span className="text-xs opacity-70">{periodLabel}</span>}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Check className="h-3 w-3 text-secondary" />
        {plan.id === "trial" 
          ? "14-day free trial included"
          : "Complete signup to activate your plan"
        }
      </p>
    </div>
  );
};
