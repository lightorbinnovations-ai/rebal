import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import type { Company } from "@/types/company";

interface ProfileCompletionBannerProps {
  company: Company;
}

export const ProfileCompletionBanner = ({ company }: ProfileCompletionBannerProps) => {
  const navigate = useNavigate();
  const status = useProfileCompletion(company);

  // Don't show if profile is complete
  if (status.canAddProperties) {
    return null;
  }

  const allMissingFields = [...status.missingBasicFields, ...status.missingSiteFields];

  return (
    <Alert className="border-amber-500/50 bg-amber-500/5">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-700 dark:text-amber-500">
        Complete Your Profile ({status.completionPercentage}%)
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm text-muted-foreground">
          {!status.isBasicProfileComplete 
            ? "Complete your profile to start adding properties and share your site."
            : "Add your tagline and business description to make your site shareable."
          }
        </p>
        
        <div className="space-y-2">
          <Progress value={status.completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Missing: {allMissingFields.join(", ")}
          </p>
        </div>

        <Button 
          size="sm" 
          onClick={() => navigate("/dashboard/settings")}
          className="mt-2"
        >
          Complete Profile
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
