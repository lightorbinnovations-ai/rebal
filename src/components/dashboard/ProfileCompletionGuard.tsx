import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useProfileCompletion, getProfileCompletionMessage } from "@/hooks/useProfileCompletion";
import type { Company } from "@/types/company";

interface ProfileCompletionGuardProps {
  company: Company;
  children: React.ReactNode;
  requiredFor: "properties" | "site";
}

export const ProfileCompletionGuard = ({ 
  company, 
  children, 
  requiredFor 
}: ProfileCompletionGuardProps) => {
  const navigate = useNavigate();
  const status = useProfileCompletion(company);

  // Check if user can access the requested feature
  const canAccess = requiredFor === "site" ? status.isSiteShareable : status.canAddProperties;

  if (canAccess) {
    return <>{children}</>;
  }

  // Show completion prompt
  return (
    <div className="space-y-6">
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Complete Your Profile</CardTitle>
              <CardDescription>
                {requiredFor === "properties" 
                  ? "You need to complete your profile before adding properties"
                  : "Complete your profile to make your site shareable"
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile Completion</span>
              <span className="font-medium">{status.completionPercentage}%</span>
            </div>
            <Progress value={status.completionPercentage} className="h-2" />
          </div>

          {/* Missing Fields */}
          <div className="space-y-4">
            {/* Basic Profile Fields */}
            {status.missingBasicFields.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Required Information
                </h4>
                <div className="flex flex-wrap gap-2">
                  {status.missingBasicFields.map((field) => (
                    <Badge key={field} variant="outline" className="border-destructive/50 text-destructive">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Site Fields */}
            {status.isBasicProfileComplete && status.missingSiteFields.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Required for Public Site
                </h4>
                <div className="flex flex-wrap gap-2">
                  {status.missingSiteFields.map((field) => (
                    <Badge key={field} variant="outline" className="border-amber-500/50 text-amber-600">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Fields */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Completed
              </h4>
              <div className="flex flex-wrap gap-2">
                {status.hasBusinessName && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Business Name ✓
                  </Badge>
                )}
                {status.hasPhone && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Phone ✓
                  </Badge>
                )}
                {status.hasEmail && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Email ✓
                  </Badge>
                )}
                {status.hasAddress && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Address ✓
                  </Badge>
                )}
                {status.hasTagline && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    Tagline ✓
                  </Badge>
                )}
                {status.hasDescription && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    About ✓
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button 
            onClick={() => navigate("/dashboard/settings")} 
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Go to Settings
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Show disabled preview of what they're trying to access */}
      <div className="opacity-50 pointer-events-none">
        <div className="relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Complete your profile to access this section
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
