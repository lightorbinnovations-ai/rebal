import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { PricingGridSkeleton } from "@/components/ui/skeletons";
import { ScrollReveal } from "@/hooks/useScrollReveal";

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

export const HomePricingSection = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  const handleSelectPlan = (planId: string) => {
    if (planId === "trial") {
      navigate("/auth");
    } else {
      navigate(`/auth?plan=${planId}&interval=monthly`);
    }
  };

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <ScrollReveal className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Pricing
          </span>
          <h2 className="text-3xl lg:text-5xl font-extrabold font-heading text-foreground mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with a 14-day free trial and scale as you grow. No hidden fees, no surprises.
          </p>
        </ScrollReveal>

        {/* Pricing Cards */}
        {isLoading ? (
          <PricingGridSkeleton />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
            {plans.map((plan, index) => {
              const isPopular = plan.id === "pro";

              return (
                <ScrollReveal
                  key={plan.id}
                  delay={index * 150}
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
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold font-heading text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline justify-center gap-1 mb-3">
                      <span className="text-4xl font-extrabold font-heading text-foreground">
                        {formatPrice(plan.monthly_price)}
                      </span>
                      {plan.monthly_price > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
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
                    className="w-full mt-auto whitespace-nowrap"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSelectPlan(plan.id);
                    }}
                    type="button"
                  >
                    {plan.id === "trial" ? "Start Free Trial" : `Get ${plan.name}`}
                  </Button>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
