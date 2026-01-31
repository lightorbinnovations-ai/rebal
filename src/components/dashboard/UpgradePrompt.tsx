import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Sparkles, Crown, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type PlanTier = "starter" | "pro" | "business";

interface FeatureInfo {
  name: string;
  description: string;
  icon?: ReactNode;
  requiredPlan: PlanTier;
}

// Feature definitions with required plans
export const LOCKED_FEATURES: Record<string, FeatureInfo> = {
  customBranding: {
    name: "Custom Branding",
    description: "Customize your company's visual identity with custom colors, fonts, and logo placement.",
    requiredPlan: "pro",
  },
  advancedAnalytics: {
    name: "Advanced Analytics",
    description: "Get detailed insights with conversion tracking, visitor demographics, and performance trends.",
    requiredPlan: "pro",
  },
  customShortCodes: {
    name: "Custom Short Codes",
    description: "Create memorable, branded short links for your properties.",
    requiredPlan: "starter",
  },
  prioritySupport: {
    name: "Priority Support",
    description: "Get faster response times and dedicated support for your business.",
    requiredPlan: "pro",
  },
  verificationBadge: {
    name: "Verification Badge",
    description: "Display a verified badge on your profile to build trust with potential clients.",
    requiredPlan: "business",
  },
  customDomain: {
    name: "Custom Domain",
    description: "Use your own domain name for a fully branded experience.",
    requiredPlan: "business",
  },
  unlimitedProperties: {
    name: "Unlimited Properties",
    description: "List as many properties as you need without any restrictions.",
    requiredPlan: "business",
  },
};

const PLAN_INFO: Record<PlanTier, { name: string; price: string; icon: ReactNode; color: string }> = {
  starter: {
    name: "Starter",
    price: "₦3,000/month",
    icon: <Zap className="h-5 w-5" />,
    color: "text-blue-600",
  },
  pro: {
    name: "Pro",
    price: "₦8,000/month",
    icon: <Sparkles className="h-5 w-5" />,
    color: "text-primary",
  },
  business: {
    name: "Business",
    price: "₦20,000/month",
    icon: <Crown className="h-5 w-5" />,
    color: "text-amber-600",
  },
};

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureKey: keyof typeof LOCKED_FEATURES;
  currentPlan?: string;
}

export const UpgradePrompt = ({
  open,
  onOpenChange,
  featureKey,
  currentPlan = "trial",
}: UpgradePromptProps) => {
  const navigate = useNavigate();
  const feature = LOCKED_FEATURES[featureKey];
  const requiredPlanInfo = PLAN_INFO[feature.requiredPlan];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/dashboard/settings?tab=subscription");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <DialogTitle className="text-xl">Unlock {feature.name}</DialogTitle>
          <DialogDescription className="text-base">
            {feature.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <div className={cn(
            "flex items-center justify-between rounded-lg border-2 p-4",
            "border-primary/50 bg-primary/5"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-background", requiredPlanInfo.color)}>
                {requiredPlanInfo.icon}
              </div>
              <div>
                <p className="font-semibold">{requiredPlanInfo.name} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {requiredPlanInfo.price}
                </p>
              </div>
            </div>
            <Badge variant="secondary">Required</Badge>
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Your current plan:</span>{" "}
            {currentPlan === "trial" ? "Free Trial" : currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleUpgrade} className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Upgrade to {requiredPlanInfo.name}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Hook for easy usage
import { useState, useCallback } from "react";

export const useUpgradePrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [featureKey, setFeatureKey] = useState<keyof typeof LOCKED_FEATURES>("customBranding");
  const [currentPlan, setCurrentPlan] = useState<string>("trial");

  const showUpgradePrompt = useCallback((
    feature: keyof typeof LOCKED_FEATURES,
    plan?: string
  ) => {
    setFeatureKey(feature);
    if (plan) setCurrentPlan(plan);
    setIsOpen(true);
  }, []);

  const UpgradePromptComponent = useCallback(() => (
    <UpgradePrompt
      open={isOpen}
      onOpenChange={setIsOpen}
      featureKey={featureKey}
      currentPlan={currentPlan}
    />
  ), [isOpen, featureKey, currentPlan]);

  return {
    showUpgradePrompt,
    UpgradePrompt: UpgradePromptComponent,
    isOpen,
    setIsOpen,
  };
};

export default UpgradePrompt;
