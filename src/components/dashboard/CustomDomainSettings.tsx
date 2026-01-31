import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Globe, Copy, Check, Loader2, Trash2, ExternalLink, AlertCircle, RefreshCw, CheckCircle2, XCircle, BookOpen, HelpCircle, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { SettingsCardSkeleton } from "@/components/ui/skeletons";
import { CustomEmailRequest } from "./CustomEmailRequest";

interface CustomDomain {
  id: string;
  domain: string;
  status: "pending" | "verifying" | "active" | "failed";
  verification_token: string;
  verified_at: string | null;
  created_at: string;
  help_requested?: boolean;
  help_notes?: string;
  help_requested_at?: string;
}

interface CustomDomainSettingsProps {
  companyId: string;
  companySlug: string;
  userEmail?: string;
}

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  verifying: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  active: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-destructive/20 text-destructive",
};

export const CustomDomainSettings = ({ companyId, companySlug, userEmail = "" }: CustomDomainSettingsProps) => {
  const [domain, setDomain] = useState<CustomDomain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    aRecordValid?: boolean;
    txtRecordValid?: boolean;
    errors?: string[];
  } | null>(null);
  const [newDomain, setNewDomain] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  // Admin help request state
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [helpNotes, setHelpNotes] = useState("");
  const [isRequestingHelp, setIsRequestingHelp] = useState(false);
  const [helpSuccess, setHelpSuccess] = useState(false);

  const fetchDomain = async () => {
    const { data, error } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("company_id", companyId)
      .single();

    if (!error && data) {
      setDomain(data as CustomDomain);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDomain();
  }, [companyId]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic domain validation
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain)) {
      toast.error("Please enter a valid domain (e.g., yourdomain.com)");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from("custom_domains").insert({
      company_id: companyId,
      domain: newDomain.toLowerCase(),
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("This domain is already registered");
      } else {
        toast.error("Failed to add domain");
      }
    } else {
      toast.success("Domain added! Follow the DNS setup instructions below.");
      setNewDomain("");
      fetchDomain();
    }
    setIsSubmitting(false);
  };

  const handleRemoveDomain = async () => {
    if (!domain) return;

    setIsSubmitting(true);
    const { error } = await supabase
      .from("custom_domains")
      .delete()
      .eq("id", domain.id);

    if (error) {
      toast.error("Failed to remove domain");
    } else {
      toast.success("Domain removed");
      setDomain(null);
    }
    setIsSubmitting(false);
  };

  const handleVerifyDomain = async () => {
    if (!domain) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-domain", {
        body: { domainId: domain.id },
      });

      if (error) throw error;

      if (data.status === "active") {
        toast.success("Domain verified and activated!");
        fetchDomain();
      } else {
        setVerificationResult({
          aRecordValid: data.aRecordValid,
          txtRecordValid: data.txtRecordValid,
          errors: data.errors,
        });
        toast.error("DNS records not yet configured correctly");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast.error("Failed to verify domain");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRequestAdminHelp = async () => {
    if (!domain) return;

    setIsRequestingHelp(true);

    try {
      const { error } = await supabase
        .from("custom_domains")
        .update({
          help_requested: true,
          help_notes: helpNotes,
          help_requested_at: new Date().toISOString(),
        })
        .eq("id", domain.id);

      if (error) throw error;

      // Create notification for admin
      await supabase.from("notifications").insert({
        user_id: companyId, // Will need to be admin user
        company_id: companyId,
        type: "domain_help",
        title: "Domain Setup Help Requested",
        message: `Help requested for domain: ${domain.domain}`,
        metadata: { domain_id: domain.id, domain: domain.domain, notes: helpNotes },
      });

      setHelpSuccess(true);
      fetchDomain();
    } catch (error) {
      console.error("Help request error:", error);
      toast.error("Failed to submit help request");
    } finally {
      setIsRequestingHelp(false);
    }
  };

  if (isLoading) {
    return <SettingsCardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Custom Domain
        </h3>
        <p className="text-sm text-muted-foreground">
          Use your own domain for your company page
        </p>
      </div>

      {/* Training/Guide Section */}
      <Card className="border-secondary/30 bg-secondary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-secondary" />
            How to Set Up Your Custom Domain
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1" className="border-b-0">
              <AccordionTrigger className="text-sm hover:no-underline">
                Step 1: Purchase a Domain
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>If you don't have a domain yet, you can purchase one from registrars like:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Namecheap</strong> - Affordable with free WHOIS privacy</li>
                  <li><strong>GoDaddy</strong> - Popular with frequent promotions</li>
                  <li><strong>Google Domains</strong> - Simple interface, easy to manage</li>
                  <li><strong>Cloudflare</strong> - At-cost pricing with free SSL</li>
                </ul>
                <p className="text-xs mt-2">Choose a domain that matches your business name (e.g., yourbusiness.com)</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2" className="border-b-0">
              <AccordionTrigger className="text-sm hover:no-underline">
                Step 2: Access Your DNS Settings
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>After purchasing, log in to your registrar and find the DNS settings:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Namecheap:</strong> Domain List → Manage → Advanced DNS</li>
                  <li><strong>GoDaddy:</strong> My Products → DNS → Manage Zones</li>
                  <li><strong>Google Domains:</strong> My domains → Manage → DNS</li>
                  <li><strong>Cloudflare:</strong> Select domain → DNS → Records</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3" className="border-b-0">
              <AccordionTrigger className="text-sm hover:no-underline">
                Step 3: Add Required DNS Records
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-3">
                <p>Add the following DNS records (shown below after you add your domain):</p>
                <div className="bg-muted/50 rounded p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded">A Record</span>
                    <span className="text-xs">Points your domain to our servers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-primary/10 px-2 py-0.5 rounded">TXT Record</span>
                    <span className="text-xs">Verifies you own the domain</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">CNAME (optional)</span>
                    <span className="text-xs">Makes www.yourdomain.com work too</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4" className="border-b-0">
              <AccordionTrigger className="text-sm hover:no-underline">
                Step 4: Wait for Propagation & Verify
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground space-y-2">
                <p>DNS changes can take 15 minutes to 48 hours to propagate worldwide.</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Click "Verify DNS" to check if your records are set up correctly</li>
                  <li>Once verified, your domain will automatically activate</li>
                  <li>SSL certificate will be provisioned automatically</li>
                </ul>
                <p className="text-xs mt-2">💡 Tip: You can check propagation at <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-secondary underline">dnschecker.org</a></p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {!domain ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Your Domain</CardTitle>
            <CardDescription>
              Connect your own domain to your company page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="yourdomain.com"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your domain without http:// or www
                </p>
              </div>
              <Button type="submit" disabled={isSubmitting || !newDomain}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Domain
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {domain.domain}
                    <Badge className={statusColors[domain.status]} variant="secondary">
                      {domain.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {domain.status === "active"
                      ? "Your domain is live and working"
                      : "Complete DNS setup to activate your domain"}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {domain.status !== "active" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleVerifyDomain}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Verify DNS
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveDomain}
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Verification Result */}
          {verificationResult && (
            <Card className="border-yellow-500/50">
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  Verification Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {verificationResult.aRecordValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="text-sm">
                      A Record: {verificationResult.aRecordValid ? "Configured correctly" : "Not configured"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {verificationResult.txtRecordValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <span className="text-sm">
                      TXT Record: {verificationResult.txtRecordValid ? "Verified" : "Not found"}
                    </span>
                  </div>
                  {verificationResult.errors && verificationResult.errors.length > 0 && (
                    <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                      <p className="text-sm font-medium text-destructive mb-2">Issues found:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {verificationResult.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {domain.status !== "active" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">DNS Setup Instructions</CardTitle>
                <CardDescription>
                  Add these DNS records at your domain registrar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    DNS changes can take up to 48 hours to propagate. Click "Verify DNS"
                    after adding records to check and activate your domain automatically.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium">Step 1: Add A Record</h4>
                      {verificationResult?.aRecordValid && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-700 text-xs">
                          ✓ Done
                        </Badge>
                      )}
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Type:</span> A
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Name:</span> @
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono">
                          <span className="text-muted-foreground">Value:</span> 185.158.133.1
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard("185.158.133.1", "ip")}
                        >
                          {copied === "ip" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium">Step 2: Add TXT Record (Verification)</h4>
                      {verificationResult?.txtRecordValid && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-700 text-xs">
                          ✓ Done
                        </Badge>
                      )}
                    </div>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Type:</span> TXT
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Name:</span> _rebal
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-mono break-all">
                          <span className="text-muted-foreground">Value:</span>{" "}
                          rebal_verify={domain.verification_token}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() =>
                            copyToClipboard(`rebal_verify=${domain.verification_token}`, "token")
                          }
                        >
                          {copied === "token" ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Step 3: Add CNAME for www (Optional)</h4>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Type:</span> CNAME
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="text-muted-foreground">Name:</span> www
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono">
                          <span className="text-muted-foreground">Value:</span> {domain.domain}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Need Help Section */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      After adding these records, your domain will point to:{" "}
                      <span className="font-medium text-foreground">
                        rebal.site/{companySlug}
                      </span>
                    </p>
                  </div>

                  {/* Admin Help Request */}
                  {domain.help_requested ? (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Help request submitted</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Our team will assist you with the setup within 1-3 business days.
                      </p>
                    </div>
                  ) : (
                    <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="link" size="sm" className="mt-2 p-0 h-auto gap-1">
                          <HelpCircle className="h-4 w-4" />
                          Need help? Request admin assistance
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        {helpSuccess ? (
                          <div className="text-center py-6 space-y-4">
                            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                              <PartyPopper className="h-8 w-8 text-primary" />
                            </div>
                            <DialogTitle>Help Request Submitted!</DialogTitle>
                            <DialogDescription>
                              Our team will review your domain setup and assist you within 1-3 business days.
                              You'll receive a notification when your domain is ready.
                            </DialogDescription>
                            <Button onClick={() => { setHelpDialogOpen(false); setHelpSuccess(false); }}>
                              Done
                            </Button>
                          </div>
                        ) : (
                          <>
                            <DialogHeader>
                              <DialogTitle>Request Domain Setup Help</DialogTitle>
                              <DialogDescription>
                                Our team will help you set up your custom domain
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Domain</Label>
                                <Input value={domain.domain} disabled />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="helpNotes">Additional Notes (Optional)</Label>
                                <Textarea
                                  id="helpNotes"
                                  value={helpNotes}
                                  onChange={(e) => setHelpNotes(e.target.value)}
                                  placeholder="Tell us about any issues or where you're stuck..."
                                  rows={3}
                                />
                              </div>

                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                  We'll guide you through DNS setup or complete it for you if you provide access.
                                  Response time is typically 1-3 business days.
                                </AlertDescription>
                              </Alert>
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => setHelpDialogOpen(false)} className="flex-1">
                                Cancel
                              </Button>
                              <Button onClick={handleRequestAdminHelp} disabled={isRequestingHelp} className="flex-1">
                                {isRequestingHelp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Request
                              </Button>
                            </div>
                          </>
                        )}
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {domain.status === "active" && (
            <>
              <Card className="border-primary/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Your page is live at:</p>
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-secondary hover:underline flex items-center gap-1 font-medium"
                        >
                          https://{domain.domain}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(`https://${domain.domain}`, "url")}
                    >
                      {copied === "url" ? (
                        <Check className="mr-2 h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      Copy URL
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Email Section - Only show when domain is active */}
              <CustomEmailRequest
                companyId={companyId}
                domain={domain.domain}
                domainId={domain.id}
                userEmail={userEmail}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};
