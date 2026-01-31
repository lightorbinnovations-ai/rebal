import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { usePaystack } from "@/hooks/usePaystack";
import { useToast } from "@/hooks/use-toast";
import { PricingGridSkeleton } from "@/components/ui/skeletons";

interface PricingCardsProps {
  isYearly: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  max_properties: number | null;
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

export const PricingCards = ({ isYearly }: PricingCardsProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { redirectToPayment, processingPlanId } = usePaystack();
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("monthly_price", { ascending: true });

      if (data) {
        setPlans(
          data.map((p) => ({
            ...p,
            features: Array.isArray(p.features)
              ? (p.features as string[])
              : typeof p.features === "string"
                ? JSON.parse(p.features)
                : [],
          }))
        );
      }
      setIsLoading(false);
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = async (planId: string) => {
    // Check if user is authenticated
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
      // Not authenticated, redirect to auth page with plan info
      toast({
        title: "Sign up to continue",
        description: "Create an account to start your subscription.",
      });
      navigate(`/auth?plan=${planId}&interval=${isYearly ? "yearly" : "monthly"}`);
      return;
    }

    // Check if user has a company
    const { data: company } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", session.session.user.id)
      .single();

    if (!company) {
      // No company, redirect to dashboard to complete onboarding
      toast({
        title: "Complete your profile",
        description: "Set up your company profile first.",
      });
      navigate("/dashboard");
      return;
    }

    // User has a company, proceed with payment
    if (planId === "trial") {
      toast({
        title: "Already on Free Trial",
        description: "Explore all features during your 14-day trial!",
      });
      return;
    }

    await redirectToPayment({
      planId,
      billingInterval: isYearly ? "yearly" : "monthly",
    });
  };

  if (isLoading) {
    return <PricingGridSkeleton />;
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
      {plans.map((plan) => {
        const isPopular = plan.id === "pro";
        const price = isYearly ? plan.yearly_price : plan.monthly_price;
        const isProcessing = processingPlanId === plan.id;

        return (
          <div
            key={plan.id}
            className={cn(
              "relative bg-card rounded-2xl p-6 border card-hover flex flex-col min-h-[600px]",
              isPopular
                ? "border-secondary shadow-xl shadow-secondary/10 ring-2 ring-secondary/20"
                : "border-border"
            )}
          >
            {/* Popular Badge */}
            {isPopular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-block px-4 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium whitespace-nowrap">
                  Recommended
                </span>
              </div>
            )}

            {/* Plan Header */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold font-heading text-foreground mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline justify-center gap-1 mb-2 flex-wrap">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading text-foreground">
                  {formatPrice(price)}
                </span>
                {price > 0 && (
                  <span className="text-muted-foreground">
                    /{isYearly ? "year" : "month"}
                  </span>
                )}
              </div>
              {isYearly && plan.yearly_price > 0 && (
                <span className="inline-block px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                  Save {formatPrice(plan.monthly_price * 12 - plan.yearly_price)}
                </span>
              )}
              <p className="text-sm text-muted-foreground mt-3">
                {plan.description}
              </p>
            </div>

            {/* Features - flex-grow to push button to bottom */}
            <ul className="space-y-4 mb-8 flex-grow justify-start">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-secondary" />
                  </div>
                  <span className="text-sm text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA - always at bottom */}
            <Button
              variant={isPopular ? "secondary" : "outline"}
              size="lg"
              className="w-full mt-auto text-xs sm:text-sm"
              disabled={isProcessing || processingPlanId !== null}
              onClick={() => handleSelectPlan(plan.id)}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan.id === "trial" ? "Start Free Trial" : `Get ${plan.name}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
};

// Feature Comparison Table
const comparisonFeatures = [
  { name: "Property listings", trial: "1", starter: "10", pro: "50", business: "Unlimited" },
  { name: "Company profile page", trial: true, starter: true, pro: true, business: true },
  { name: "Social media previews", trial: "Basic", starter: "Rich", pro: "Rich", business: "Rich" },
  { name: "Inquiry form", trial: true, starter: true, pro: true, business: true },
  { name: "Analytics", trial: false, starter: "Basic", pro: "Advanced", business: "Advanced" },
  { name: "Verification badge", trial: false, starter: false, pro: false, business: true },
  { name: "Priority support", trial: false, starter: false, pro: true, business: true },
  { name: "Custom branding", trial: false, starter: false, pro: true, business: true },
  { name: "Custom domain", trial: false, starter: false, pro: false, business: true },
];

export const ComparisonTable = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 font-semibold font-heading text-foreground">Features</th>
            <th className="text-center py-4 px-4 font-semibold font-heading text-foreground">Starter</th>
            <th className="text-center py-4 px-4 font-semibold font-heading text-foreground bg-secondary/5">Pro</th>
            <th className="text-center py-4 px-4 font-semibold font-heading text-foreground">Business</th>
          </tr>
        </thead>
        <tbody>
          {comparisonFeatures.map((feature, index) => (
            <tr key={feature.name} className={cn("border-b border-border", index % 2 === 0 && "bg-muted/30")}>
              <td className="py-4 px-4 text-foreground">{feature.name}</td>
              <td className="text-center py-4 px-4">
                {typeof feature.starter === "boolean" ? (
                  feature.starter ? (
                    <Check className="w-5 h-5 text-secondary mx-auto" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-foreground">{feature.starter}</span>
                )}
              </td>
              <td className="text-center py-4 px-4 bg-secondary/5">
                {typeof feature.pro === "boolean" ? (
                  feature.pro ? (
                    <Check className="w-5 h-5 text-secondary mx-auto" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-foreground">{feature.pro}</span>
                )}
              </td>
              <td className="text-center py-4 px-4">
                {typeof feature.business === "boolean" ? (
                  feature.business ? (
                    <Check className="w-5 h-5 text-secondary mx-auto" />
                  ) : (
                    <Minus className="w-5 h-5 text-muted-foreground mx-auto" />
                  )
                ) : (
                  <span className="text-sm text-foreground">{feature.business}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
