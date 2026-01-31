import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const plans = [
  {
    name: "Free Trial",
    price: "Free",
    period: "for 14 days",
    description: "14-day free trial to explore REBAL",
    features: [
      "1 property listing",
      "Basic company profile",
      "Inquiry form",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Starter",
    price: "₦3,000",
    period: "/month",
    description: "Perfect for getting started",
    features: [
      "10 property listings",
      "Basic analytics",
      "Custom short links",
      "Rich social previews",
      "Email support",
    ],
    cta: "Get Starter",
    popular: false,
  },
  {
    name: "Pro",
    price: "₦8,000",
    period: "/month",
    description: "For growing agencies",
    features: [
      "50 property listings",
      "Advanced analytics",
      "Custom branding",
      "Lead scoring",
      "Priority support",
      "Custom short codes",
    ],
    cta: "Get Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "₦20,000",
    period: "/month",
    description: "For established agencies",
    features: [
      "Unlimited listings",
      "Everything in Pro",
      "Custom domain (add-on)",
      "Custom email (add-on)",
      "API access",
      "Verification badge",
      "Dedicated account manager",
    ],
    cta: "Get Business",
    popular: false,
  },
];

export const PricingSection = () => {
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, index) => (
            <ScrollReveal
              key={plan.name}
              delay={index * 150}
              className={cn(
                "relative bg-card rounded-2xl p-8 border card-hover flex flex-col",
                plan.popular
                  ? "border-secondary shadow-xl shadow-secondary/10 scale-105"
                  : "border-border"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
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
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features - flex-grow to push button to bottom */}
              <ul className="space-y-4 mb-8 flex-grow">
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
                variant={plan.popular ? "secondary" : "outline"}
                size="lg"
                className="w-full mt-auto whitespace-nowrap"
              >
                {plan.cta}
              </Button>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
