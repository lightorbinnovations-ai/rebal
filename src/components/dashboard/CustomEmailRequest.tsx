import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Loader2, CheckCircle2, Clock, Trash2, Plus, PartyPopper, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface CustomEmailRequestProps {
  companyId: string;
  domain?: string; // e.g., "yourdomain.com"
  domainId?: string;
  userEmail: string;
}

interface EmailRequest {
  id: string;
  requested_email: string;
  forward_to_email: string;
  status: "pending" | "active" | "rejected" | "removed";
  admin_note?: string;
  created_at: string;
}

export const CustomEmailRequest = ({ 
  companyId, 
  domain,
  domainId,
  userEmail 
}: CustomEmailRequestProps) => {
  const [emailRequests, setEmailRequests] = useState<EmailRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [emailPrefix, setEmailPrefix] = useState("contact");
  const [forwardTo, setForwardTo] = useState(userEmail);

  const fetchEmailRequests = async () => {
    const { data, error } = await supabase
      .from("custom_email_requests")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEmailRequests(data as EmailRequest[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmailRequests();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email prefix (alphanumeric and dots only)
    if (!/^[a-zA-Z0-9.]+$/.test(emailPrefix)) {
      toast.error("Email prefix can only contain letters, numbers, and dots");
      return;
    }

    // Validate forward email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forwardTo)) {
      toast.error("Please enter a valid forwarding email");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("custom_email_requests").insert({
        company_id: companyId,
        domain_id: domainId || null,
        requested_email: emailPrefix.toLowerCase(),
        forward_to_email: forwardTo.toLowerCase(),
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This email address has already been requested");
        } else {
          throw error;
        }
        return;
      }

      setShowSuccess(true);
      await fetchEmailRequests();
    } catch (error) {
      console.error("Email request error:", error);
      toast.error("Failed to submit email request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("custom_email_requests")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to cancel request");
    } else {
      toast.success("Request cancelled");
      fetchEmailRequests();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Active</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-destructive/20 text-destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!domain) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Set up your custom domain first to request custom email addresses
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Custom Email
          </h3>
          <p className="text-sm text-muted-foreground">
            Get professional email addresses at your domain
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Request Email
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            {showSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <PartyPopper className="h-8 w-8 text-green-500" />
                </div>
                <DialogTitle>Request Submitted!</DialogTitle>
                <DialogDescription>
                  Your custom email request for <strong>{emailPrefix}@{domain}</strong> has been submitted. 
                  We'll set it up and notify you within 1-3 business days.
                </DialogDescription>
                <Button onClick={() => { setIsOpen(false); setShowSuccess(false); }}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Request Custom Email</DialogTitle>
                  <DialogDescription>
                    We'll create a professional email address at your domain
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailPrefix">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="emailPrefix"
                        value={emailPrefix}
                        onChange={(e) => setEmailPrefix(e.target.value)}
                        placeholder="contact"
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">@{domain}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Common options: contact, info, hello, support, sales
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="forwardTo">Forward emails to</Label>
                    <Input
                      id="forwardTo"
                      type="email"
                      value={forwardTo}
                      onChange={(e) => setForwardTo(e.target.value)}
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      All emails to {emailPrefix}@{domain} will be forwarded here
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Email forwarding is included with your custom domain. 
                      Setup typically takes 1-3 business days.
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !emailPrefix || !forwardTo} className="flex-1">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Request
                    </Button>
                  </div>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : emailRequests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No custom emails yet. Click "Request Email" to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {emailRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      request.status === "active" 
                        ? "bg-green-500/20" 
                        : request.status === "pending"
                        ? "bg-yellow-500/20"
                        : "bg-muted"
                    }`}>
                      {request.status === "active" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : request.status === "pending" ? (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {request.requested_email}@{domain}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Forwards to: {request.forward_to_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    {request.status === "pending" && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(request.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                {request.admin_note && request.status === "rejected" && (
                  <p className="mt-2 text-sm text-destructive">
                    Reason: {request.admin_note}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
