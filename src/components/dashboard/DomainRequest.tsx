import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDomainPayment } from "@/hooks/useDomainPayment";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Globe,
  Loader2,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  AlertCircle,
  PartyPopper,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { SettingsCardSkeleton } from "@/components/ui/skeletons";

interface DomainPricing {
  id: string;
  extension: string;
  yearly_price: number;
  is_available: boolean;
}

interface DomainRequest {
  id: string;
  business_name: string;
  selected_domain: string | null;
  selected_extension: string | null;
  domain_price: number;
  email_price: number;
  total_price: number;
  status: string;
  admin_note: string | null;
  email_prefix: string | null;
  forward_to_email: string | null;
  email_status: string;
  created_at: string;
}

interface DomainRequestProps {
  companyId: string;
  companySlug: string;
  companyName: string;
  userEmail?: string;
}

const statusConfig: Record<string, { label: string; description: string; icon: any; color: string }> = {
  pending: {
    label: "Request Submitted",
    description: "We're reviewing your request and will send you a price quote shortly.",
    icon: Clock,
    color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
  },
  price_sent: {
    label: "Price Ready",
    description: "We've set the price for your domain. Please review and make payment to proceed.",
    icon: CreditCard,
    color: "bg-blue-500/20 text-blue-700 dark:text-blue-400"
  },
  paid: {
    label: "Payment Received",
    description: "Thank you for your payment! We're now registering your domain.",
    icon: CheckCircle2,
    color: "bg-purple-500/20 text-purple-700 dark:text-purple-400"
  },
  processing: {
    label: "Setting Up",
    description: "We're configuring your domain. This usually takes 24-48 hours.",
    icon: Loader2,
    color: "bg-purple-500/20 text-purple-700 dark:text-purple-400"
  },
  active: {
    label: "Domain Active! 🎉",
    description: "Your custom domain is now live and serving your website.",
    icon: PartyPopper,
    color: "bg-green-500/20 text-green-700 dark:text-green-400"
  },
  rejected: {
    label: "Request Declined",
    description: "Unfortunately, we couldn't fulfill this request.",
    icon: AlertCircle,
    color: "bg-destructive/20 text-destructive"
  },
  cancelled: {
    label: "Cancelled",
    description: "This request has been cancelled.",
    icon: AlertCircle,
    color: "bg-muted text-muted-foreground"
  },
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const DomainRequest = ({ companyId, companySlug, companyName, userEmail = "" }: DomainRequestProps) => {
  const [existingRequest, setExistingRequest] = useState<DomainRequest | null>(null);
  const [pricing, setPricing] = useState<DomainPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoading: isPaymentLoading, redirectToDomainPayment } = useDomainPayment();

  // Form state
  const [businessName, setBusinessName] = useState(companyName);
  const [domainName, setDomainName] = useState(companySlug.replace(/-/g, ""));
  const [selectedExtension, setSelectedExtension] = useState(".com");
  const [wantsEmail, setWantsEmail] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState("info");
  const [forwardToEmail, setForwardToEmail] = useState(userEmail);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  // Real-time subscription to update status when payment is processed
  useRealtimeSubscription({
    table: "domain_requests",
    filter: `company_id=eq.${companyId}`,
    onChange: () => {
      fetchData();
    },
  });

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch existing request
    const { data: requestData } = await supabase
      .from("domain_requests")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (requestData) {
      setExistingRequest(requestData as DomainRequest);
    }

    // Fetch pricing
    const { data: pricingData } = await supabase
      .from("domain_pricing")
      .select("*")
      .eq("is_available", true)
      .order("yearly_price", { ascending: true });

    if (pricingData) {
      setPricing(pricingData as DomainPricing[]);
      if (pricingData.length > 0 && !selectedExtension) {
        setSelectedExtension(pricingData[0].extension);
      }
    }

    setIsLoading(false);
  };

  const handleSubmitRequest = async () => {
    if (!domainName.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    if (wantsEmail && !forwardToEmail.trim()) {
      toast.error("Please enter an email to forward to");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullDomain = `${domainName.toLowerCase().replace(/[^a-z0-9]/g, "")}${selectedExtension}`;

      const { error } = await supabase.from("domain_requests").insert({
        company_id: companyId,
        business_name: businessName || companyName,
        selected_domain: fullDomain,
        selected_extension: selectedExtension,
        email_prefix: wantsEmail ? emailPrefix : null,
        forward_to_email: wantsEmail ? forwardToEmail : null,
        email_status: wantsEmail ? "pending" : "none",
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("You already have a pending domain request");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Domain request submitted! We'll send you a price quote soon.");
      fetchData();
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <SettingsCardSkeleton />;
  }

  // Show existing request status
  if (existingRequest) {
    const status = statusConfig[existingRequest.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Custom Domain
          </h3>
          <p className="text-sm text-muted-foreground">
            Your domain request status
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {existingRequest.selected_domain}
                  <Badge className={status.color}>{status.label}</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {status.description}
                </CardDescription>
              </div>
              <StatusIcon className={`h-8 w-8 ${existingRequest.status === "processing" ? "animate-spin" : ""} text-muted-foreground`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pricing info when price is set */}
            {existingRequest.status === "price_sent" && existingRequest.total_price > 0 && (
              <Alert className="border-primary/50 bg-primary/5">
                <CreditCard className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Your Domain Quote</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Domain ({existingRequest.selected_extension})</span>
                      <span>{formatPrice(existingRequest.domain_price)}/year</span>
                    </div>
                    {existingRequest.email_prefix && (
                      <div className="flex justify-between">
                        <span>Business Email</span>
                        <span>{formatPrice(existingRequest.email_price)}/year</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(existingRequest.total_price)}/year</span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4"
                    disabled={isPaymentLoading}
                    onClick={() => redirectToDomainPayment({
                      domainRequestId: existingRequest.id,
                      amount: existingRequest.total_price,
                      domainName: existingRequest.selected_domain || "",
                    })}
                  >
                    {isPaymentLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay {formatPrice(existingRequest.total_price)}
                      </>
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Admin note */}
            {existingRequest.admin_note && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Message from Admin:</p>
                  <p className="text-sm mt-1">{existingRequest.admin_note}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Email info */}
            {existingRequest.email_prefix && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Business Email:</span>
                  <span>{existingRequest.email_prefix}@{existingRequest.selected_domain}</span>
                  <Badge variant="outline" className="ml-auto">
                    {existingRequest.email_status === "active" ? "Active" : "Pending"}
                  </Badge>
                </div>
                {existingRequest.forward_to_email && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Forwards to: {existingRequest.forward_to_email}
                  </p>
                )}
              </div>
            )}

            {/* Active domain info */}
            {existingRequest.status === "active" && (
              <Alert className="border-secondary/50 bg-secondary/5">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                <AlertDescription>
                  <p className="font-medium text-secondary">Your domain is live!</p>
                  <p className="text-sm">
                    Visitors can now access your website at{" "}
                    <a
                      href={`https://${existingRequest.selected_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      {existingRequest.selected_domain}
                    </a>
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show request form
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Get Your Custom Domain
        </h3>
        <p className="text-sm text-muted-foreground">
          Get a professional domain for your property website. We'll handle all the technical setup for you.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request Custom Domain</CardTitle>
          <CardDescription>
            Choose your domain name and we'll send you a quote. Once paid, we'll set everything up for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business name */}
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your business name"
            />
          </div>

          {/* Domain name */}
          <div className="space-y-2">
            <Label htmlFor="domainName">Domain Name</Label>
            <div className="flex items-center gap-2">
              <Input
                id="domainName"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="yourbusiness"
                className="flex-1"
              />
              <select
                value={selectedExtension}
                onChange={(e) => setSelectedExtension(e.target.value)}
                className="h-10 px-3 rounded-md border bg-background text-sm"
              >
                {pricing.map((p) => (
                  <option key={p.id} value={p.extension}>
                    {p.extension} (from {formatPrice(p.yearly_price)}/yr)
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">
              Your full domain will be: <span className="font-mono font-medium">{domainName || "yourbusiness"}{selectedExtension}</span>
            </p>
          </div>

          {/* Email option */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wantsEmail"
                checked={wantsEmail}
                onCheckedChange={(checked) => setWantsEmail(checked as boolean)}
              />
              <Label htmlFor="wantsEmail" className="font-medium cursor-pointer">
                Add Business Email
              </Label>
              <Badge variant="secondary" className="ml-auto">Optional</Badge>
            </div>

            {wantsEmail && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="emailPrefix">Email Address</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="emailPrefix"
                      value={emailPrefix}
                      onChange={(e) => setEmailPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ""))}
                      placeholder="info"
                      className="w-32"
                    />
                    <span className="text-muted-foreground">@{domainName || "yourbusiness"}{selectedExtension}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="forwardTo">Forward emails to</Label>
                  <Input
                    id="forwardTo"
                    type="email"
                    value={forwardToEmail}
                    onChange={(e) => setForwardToEmail(e.target.value)}
                    placeholder="your@personal-email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    All emails sent to your business email will be forwarded here
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Info alert */}
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">How it works:</p>
              <ol className="text-sm list-decimal list-inside mt-2 space-y-1">
                <li>Submit your request</li>
                <li>We'll check availability and send you a price quote</li>
                <li>Make payment when you receive the quote</li>
                <li>We set up your domain (usually 24-48 hours)</li>
                <li>Your custom domain goes live!</li>
              </ol>
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSubmitRequest}
            disabled={isSubmitting || !domainName.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Domain Request
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};