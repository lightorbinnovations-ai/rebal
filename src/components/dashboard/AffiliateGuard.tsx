import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/company";

interface AffiliateGuardProps {
  company: Company;
  children: React.ReactNode;
  feature: string;
}

/**
 * Guard that blocks affiliate accounts from accessing realtor-only features.
 * Displays a friendly message with option to upgrade to realtor account.
 */
export const AffiliateGuard = ({ 
  company, 
  children, 
  feature 
}: AffiliateGuardProps) => {
  const navigate = useNavigate();
  const isAffiliate = company.account_type === "affiliate";

  // Allow access for non-affiliate accounts
  if (!isAffiliate) {
    return <>{children}</>;
  }

  // Show upgrade prompt for affiliates
  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Affiliate Account</CardTitle>
              <CardDescription>
                {feature} is available for Realtor accounts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-sm text-muted-foreground">
              As an affiliate marketer, your account is optimized for earning referral commissions. 
              To access <strong>{feature}</strong> and other property management features, 
              you can upgrade to a Realtor account.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate("/dashboard/settings")} 
              className="flex-1"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Upgrade to Realtor
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate("/dashboard/referrals")}
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              Go to Referrals
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visual hint of what they're missing */}
      <Card className="border-dashed border-muted-foreground/30 bg-muted/20">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {feature}
          </h3>
          <p className="text-sm text-muted-foreground/70">
            Upgrade your account to unlock this feature
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
