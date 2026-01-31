import { useState } from "react";
import { BrandingSettings } from "@/components/dashboard/BrandingSettings";
import { AffiliateGuard } from "@/components/dashboard/AffiliateGuard";
import { useDashboard } from "@/contexts/DashboardContext";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Palette } from "lucide-react";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";

const DashboardBrandingPage = () => {
  const { company, refetchCompany } = useDashboard();
  const { features, planName, isTrialing } = useSubscriptionLimits(company);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Guard against affiliate accounts first
  return (
    <AffiliateGuard company={company} feature="Custom Branding">
      <BrandingPageContent 
        company={company} 
        refetchCompany={refetchCompany}
        features={features}
        planName={planName}
        isTrialing={isTrialing}
        showUpgradePrompt={showUpgradePrompt}
        setShowUpgradePrompt={setShowUpgradePrompt}
      />
    </AffiliateGuard>
  );
};

interface BrandingPageContentProps {
  company: any;
  refetchCompany: () => void;
  features: {
    customBranding: boolean;
    [key: string]: boolean;
  };
  planName: string;
  isTrialing: boolean;
  showUpgradePrompt: boolean;
  setShowUpgradePrompt: (show: boolean) => void;
}

const BrandingPageContent = ({
  company,
  refetchCompany,
  features,
  planName,
  isTrialing,
  showUpgradePrompt,
  setShowUpgradePrompt,
}: BrandingPageContentProps) => {
  // Gate custom branding for Pro+ users only
  if (!features.customBranding) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Custom Branding</h1>
          <p className="text-muted-foreground">
            Customize your company's visual identity
          </p>
        </div>

        <Card className="border-2 border-primary/50">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                Custom Branding is a Pro Feature
              </h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                {isTrialing 
                  ? "Upgrade to Pro or Business to customize your brand colors, fonts, and styling."
                  : `Your ${planName} plan doesn't include custom branding. Upgrade to Pro to unlock this feature.`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Palette className="h-4 w-4" />
                <span>Custom colors & fonts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Palette className="h-4 w-4" />
                <span>Logo & hero images</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Palette className="h-4 w-4" />
                <span>Button styles</span>
              </div>
            </div>
            <Button onClick={() => setShowUpgradePrompt(true)} className="mt-4">
              Unlock Custom Branding
            </Button>
          </CardContent>
        </Card>

        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          featureKey="customBranding"
          currentPlan={planName}
        />
      </div>
    );
  }

  return <BrandingSettings company={company} onUpdate={refetchCompany} />;
};

export default DashboardBrandingPage;
