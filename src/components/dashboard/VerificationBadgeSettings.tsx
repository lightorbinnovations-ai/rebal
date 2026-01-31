import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BadgeCheck, Loader2, Send, Clock, CheckCircle, XCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SettingsCardSkeleton } from "@/components/ui/skeletons";

interface VerificationRequest {
  id: string;
  status: "pending" | "approved" | "rejected";
  business_registration: string | null;
  additional_info: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface VerificationBadgeSettingsProps {
  companyId: string;
  isVerified: boolean;
}

const statusInfo = {
  pending: {
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-500/20",
    label: "Pending Review",
  },
  approved: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-500/20",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/20",
    label: "Rejected",
  },
};

export const VerificationBadgeSettings = ({
  companyId,
  isVerified,
}: VerificationBadgeSettingsProps) => {
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessRegistration: "",
    additionalInfo: "",
  });

  const fetchRequest = async () => {
    const { data, error } = await supabase
      .from("verification_requests")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (!error && data) {
      setRequest(data as VerificationRequest);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequest();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessRegistration || !formData.additionalInfo) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    const { data: requestData, error } = await supabase.from("verification_requests").upsert({
      company_id: companyId,
      business_registration: formData.businessRegistration,
      additional_info: formData.additionalInfo,
      status: "pending",
    })
      .select()
      .single();

    if (error) {
      toast.error("Failed to submit verification request");
    } else {
      toast.success("Verification request submitted! We'll review it soon.");
      fetchRequest();
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <SettingsCardSkeleton />;
  }

  // Already verified
  if (isVerified) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-secondary" />
            Verification Badge
          </h3>
          <p className="text-sm text-muted-foreground">
            Your business verification status
          </p>
        </div>

        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <BadgeCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400">
                  Verified Business
                </h4>
                <p className="text-sm text-muted-foreground">
                  Your business is verified and displays a verification badge
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has existing request
  if (request) {
    const StatusIcon = statusInfo[request.status].icon;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" />
            Verification Badge
          </h3>
          <p className="text-sm text-muted-foreground">
            Your business verification status
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Verification Request</CardTitle>
              <Badge className={statusInfo[request.status].bg} variant="secondary">
                <StatusIcon className={`h-3 w-3 mr-1 ${statusInfo[request.status].color}`} />
                {statusInfo[request.status].label}
              </Badge>
            </div>
            <CardDescription>
              Submitted on {format(new Date(request.created_at), "MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.status === "pending" && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Your verification request is being reviewed. This usually takes 1-3 business days.
                </AlertDescription>
              </Alert>
            )}

            {request.status === "rejected" && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {request.rejection_reason ||
                    "Your verification request was not approved. You can submit a new request with updated information."}
                </AlertDescription>
              </Alert>
            )}

            {request.status === "rejected" && (
              <Button onClick={() => setRequest(null)}>Submit New Request</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // No request - show form
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BadgeCheck className="h-5 w-5" />
          Verification Badge
        </h3>
        <p className="text-sm text-muted-foreground">
          Get verified to build trust with your customers
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          A verification badge shows visitors that your business is legitimate and trustworthy.
          It appears next to your company name on all pages.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request Verification</CardTitle>
          <CardDescription>
            Provide your business details for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registration">
                Business Registration Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="registration"
                value={formData.businessRegistration}
                onChange={(e) =>
                  setFormData({ ...formData, businessRegistration: e.target.value })
                }
                placeholder="e.g., CAC/BN/123456"
                required
              />
              <p className="text-xs text-muted-foreground">
                Your CAC registration number or business permit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="info">
                Additional Information <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="info"
                value={formData.additionalInfo}
                onChange={(e) =>
                  setFormData({ ...formData, additionalInfo: e.target.value })
                }
                placeholder="Tell us about your business, years of operation, office address..."
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">
                Any additional information that helps verify your business
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Submit Verification Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
