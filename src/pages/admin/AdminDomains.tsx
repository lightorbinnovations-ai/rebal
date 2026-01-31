import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertCircle,
  Mail,
  DollarSign,
  Settings,
  RefreshCw,
  BookOpen,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DashboardSkeleton } from "@/components/ui/skeletons";

interface DomainRequest {
  id: string;
  company_id: string;
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
  company?: {
    name: string;
    slug: string;
    email: string | null;
  };
}

interface DomainPricing {
  id: string;
  extension: string;
  yearly_price: number;
  is_available: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-700" },
  price_sent: { label: "Price Sent", color: "bg-blue-500/20 text-blue-700" },
  paid: { label: "Paid", color: "bg-green-500/20 text-green-700" },
  processing: { label: "Processing", color: "bg-purple-500/20 text-purple-700" },
  active: { label: "Active", color: "bg-green-600/20 text-green-700" },
  rejected: { label: "Rejected", color: "bg-destructive/20 text-destructive" },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground" },
};

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const AdminDomains = () => {
  const { user, isLoading: authLoading, isAdmin } = useAdminAuth();
  const [requests, setRequests] = useState<DomainRequest[]>([]);
  const [pricing, setPricing] = useState<DomainPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [selectedRequest, setSelectedRequest] = useState<DomainRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for modal
  const [domainPrice, setDomainPrice] = useState("");
  const [emailPrice, setEmailPrice] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);

    // Fetch domain requests with company info
    const { data: requestsData, error: requestsError } = await supabase
      .from("domain_requests")
      .select(`
        *,
        company:companies(name, slug, email)
      `)
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Error fetching requests:", requestsError);
      toast.error("Failed to load domain requests");
    } else {
      setRequests(requestsData as DomainRequest[]);
    }

    // Fetch pricing
    const { data: pricingData } = await supabase
      .from("domain_pricing")
      .select("*")
      .order("yearly_price", { ascending: true });

    if (pricingData) {
      setPricing(pricingData as DomainPricing[]);
    }

    setIsLoading(false);
  };

  const openModal = (request: DomainRequest) => {
    setSelectedRequest(request);
    setDomainPrice(request.domain_price.toString());
    setEmailPrice(request.email_price.toString());
    setAdminNote(request.admin_note || "");
    setNewStatus(request.status);
    setIsModalOpen(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);

    const domainPriceNum = parseFloat(domainPrice) || 0;
    const emailPriceNum = parseFloat(emailPrice) || 0;
    const totalPrice = domainPriceNum + emailPriceNum;

    const updates: Record<string, any> = {
      domain_price: domainPriceNum,
      email_price: emailPriceNum,
      total_price: totalPrice,
      admin_note: adminNote || null,
      status: newStatus,
    };

    // Set timestamps based on status changes
    if (newStatus === "price_sent" && selectedRequest.status !== "price_sent") {
      updates.price_set_at = new Date().toISOString();
    }
    if (newStatus === "active" && selectedRequest.status !== "active") {
      updates.activated_at = new Date().toISOString();
      if (selectedRequest.email_prefix) {
        updates.email_status = "active";
      }

      // Also insert into custom_domains table so it works dynamically
      const { error: cdError } = await supabase.from("custom_domains").insert({
        company_id: selectedRequest.company_id,
        domain: selectedRequest.selected_domain,
        status: "active",
        verified_at: new Date().toISOString(),
      });

      if (cdError) {
        console.error("Failed to insert custom domain:", cdError);
        // Don't block the request update, but warn
        toast.error("Domain activated but failed to link system record. Check logs.");
      }
    }

    const { error } = await supabase
      .from("domain_requests")
      .update(updates)
      .eq("id", selectedRequest.id);

    if (error) {
      console.error("Update error:", error);
      toast.error("Failed to update request");
    } else {
      toast.success("Request updated successfully");

      // Send notification to user
      if (selectedRequest.company_id) {
        const { data: company } = await supabase
          .from("companies")
          .select("user_id")
          .eq("id", selectedRequest.company_id)
          .single();

        if (company) {
          let notificationTitle = "";
          let notificationMessage = "";

          if (newStatus === "price_sent") {
            notificationTitle = "Domain Price Ready";
            notificationMessage = `Your domain request for ${selectedRequest.selected_domain} is ready. Total: ${formatPrice(totalPrice)}. Please complete payment to proceed.`;
          } else if (newStatus === "active") {
            notificationTitle = "Domain Activated! 🎉";
            notificationMessage = `Your domain ${selectedRequest.selected_domain} is now live and serving your company page!`;
          } else if (newStatus === "rejected") {
            notificationTitle = "Domain Request Update";
            notificationMessage = adminNote || "Your domain request could not be processed. Please contact support.";
          }

          if (notificationTitle) {
            const { error: notifyError } = await supabase.rpc("admin_send_notification", {
              p_user_id: company.user_id,
              p_company_id: selectedRequest.company_id,
              p_type: "domain",
              p_title: notificationTitle,
              p_message: notificationMessage,
              p_metadata: { domain_request_id: selectedRequest.id },
            });

            if (notifyError) {
              console.error("Failed to send notification:", notifyError);
            }
          }
        }
      }

      setIsModalOpen(false);
      fetchData();
    }

    setIsSubmitting(false);
  };

  const handleUpdatePricing = async (id: string, newPrice: number) => {
    const { error } = await supabase
      .from("domain_pricing")
      .update({ yearly_price: newPrice })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update pricing");
    } else {
      toast.success("Pricing updated");
      fetchData();
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.selected_domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    price_sent: requests.filter((r) => r.status === "price_sent").length,
    paid: requests.filter((r) => r.status === "paid").length,
    processing: requests.filter((r) => r.status === "processing").length,
    active: requests.filter((r) => r.status === "active").length,
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <AdminLayout
      title="Domain Management"
      description="Manage custom domain requests and pricing"
      onSignOut={handleSignOut}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">Domain Requests</TabsTrigger>
            <TabsTrigger value="pricing">Default Pricing</TabsTrigger>
            <TabsTrigger value="dns-guide">DNS Setup Guide</TabsTrigger>
          </TabsList>

          {/* Domain Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by domain, business, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                      <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
                      <SelectItem value="price_sent">Price Sent ({statusCounts.price_sent})</SelectItem>
                      <SelectItem value="paid">Paid ({statusCounts.paid})</SelectItem>
                      <SelectItem value="processing">Processing ({statusCounts.processing})</SelectItem>
                      <SelectItem value="active">Active ({statusCounts.active})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Requests Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No domain requests found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => {
                        const status = statusConfig[request.status] || statusConfig.pending;
                        return (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{request.selected_domain || "-"}</p>
                                <p className="text-xs text-muted-foreground">{request.business_name}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{request.company?.name || "-"}</p>
                              <p className="text-xs text-muted-foreground">{request.company?.email}</p>
                            </TableCell>
                            <TableCell>
                              {request.email_prefix ? (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="text-sm">{request.email_prefix}@...</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {request.total_price > 0 ? (
                                formatPrice(request.total_price)
                              ) : (
                                <span className="text-muted-foreground">Not set</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>{status.label}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(request.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" onClick={() => openModal(request)}>
                                Manage
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Default Domain Pricing
                </CardTitle>
                <CardDescription>
                  Set default yearly prices for each domain extension. You can override these per request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {pricing.map((p) => (
                    <div key={p.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{p.extension}</p>
                        <p className="text-sm text-muted-foreground">Yearly price</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">₦</span>
                        <Input
                          type="number"
                          defaultValue={p.yearly_price}
                          className="w-28"
                          onBlur={(e) => {
                            const newPrice = parseFloat(e.target.value);
                            if (newPrice !== p.yearly_price) {
                              handleUpdatePricing(p.id, newPrice);
                            }
                          }}
                        />
                        <span className="text-sm text-muted-foreground">/yr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DNS Setup Guide Tab */}
          <TabsContent value="dns-guide" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  DNS Configuration Guide
                </CardTitle>
                <CardDescription>
                  Step-by-step instructions to configure custom domains for your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Step 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">1</div>
                    <h3 className="text-lg font-semibold">Purchase the Domain</h3>
                  </div>
                  <div className="ml-11 space-y-3 text-muted-foreground">
                    <p>After the customer pays for their domain, purchase it from your domain registrar:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Go to your domain registrar (e.g., Namecheap, GoDaddy, Qservers)</li>
                      <li>Search for the exact domain the customer requested (e.g., <code className="bg-muted px-1 rounded">latest.com</code>)</li>
                      <li>Complete the purchase using company funds</li>
                      <li>Keep the domain in your registrar account for easy management</li>
                    </ul>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">2</div>
                    <h3 className="text-lg font-semibold">Configure DNS Records</h3>
                  </div>
                  <div className="ml-11 space-y-4 text-muted-foreground">
                    <p>In your registrar's DNS management panel, add these records:</p>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                      <div>
                        <p className="font-medium text-foreground mb-2">Option A: CNAME Record (Recommended)</p>
                        <div className="bg-background p-3 rounded border font-mono text-sm space-y-1">
                          <p><span className="text-muted-foreground">Type:</span> CNAME</p>
                          <p><span className="text-muted-foreground">Name/Host:</span> @ or www</p>
                          <p><span className="text-muted-foreground">Value/Points to:</span> rebal.com.ng</p>
                          <p><span className="text-muted-foreground">TTL:</span> 3600 (or Auto)</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="font-medium text-foreground mb-2">Option B: A Record (If CNAME doesn't work for root domain)</p>
                        <div className="bg-background p-3 rounded border font-mono text-sm space-y-1">
                          <p><span className="text-muted-foreground">Type:</span> A</p>
                          <p><span className="text-muted-foreground">Name/Host:</span> @</p>
                          <p><span className="text-muted-foreground">Value/Points to:</span> [Your server IP address]</p>
                          <p><span className="text-muted-foreground">TTL:</span> 3600 (or Auto)</p>
                        </div>
                        <p className="text-xs mt-2 text-amber-600">Note: Some registrars don't allow CNAME on root domain (@). Use A record in that case.</p>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                      <p className="font-medium text-blue-700 mb-2">💡 For both root and www:</p>
                      <p className="text-sm">Add a CNAME for <code className="bg-blue-500/20 px-1 rounded">www</code> pointing to <code className="bg-blue-500/20 px-1 rounded">rebal.com.ng</code> so both www.latest.com and latest.com work.</p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">3</div>
                    <h3 className="text-lg font-semibold">Set Up Email Forwarding (If Requested)</h3>
                  </div>
                  <div className="ml-11 space-y-4 text-muted-foreground">
                    <p>If the customer requested a business email (e.g., info@latest.com), set up email forwarding:</p>

                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <p className="font-medium text-foreground">Add MX Records:</p>
                      <div className="bg-background p-3 rounded border font-mono text-sm space-y-2">
                        <div>
                          <p><span className="text-muted-foreground">Type:</span> MX</p>
                          <p><span className="text-muted-foreground">Name/Host:</span> @</p>
                          <p><span className="text-muted-foreground">Priority:</span> 10</p>
                          <p><span className="text-muted-foreground">Value:</span> [Email provider MX record]</p>
                        </div>
                      </div>
                      <p className="text-xs mt-2">MX records depend on your email forwarding service (e.g., ImprovMX, Zoho, Google Workspace).</p>
                    </div>

                    <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                      <p className="font-medium text-amber-700 mb-2">⚠️ Free Email Forwarding Options:</p>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>ImprovMX</strong> - Free for up to 25 aliases</li>
                        <li>• <strong>Zoho Mail</strong> - Free tier available</li>
                        <li>• <strong>Cloudflare Email Routing</strong> - Free with Cloudflare DNS</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">4</div>
                    <h3 className="text-lg font-semibold">Wait for DNS Propagation</h3>
                  </div>
                  <div className="ml-11 space-y-3 text-muted-foreground">
                    <p>DNS changes take time to propagate across the internet:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Usually takes <strong>15 minutes to 4 hours</strong></li>
                      <li>Can take up to <strong>48 hours</strong> in some cases</li>
                      <li>Use <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-primary underline">dnschecker.org</a> to verify propagation</li>
                    </ul>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">5</div>
                    <h3 className="text-lg font-semibold">Verify and Activate</h3>
                  </div>
                  <div className="ml-11 space-y-3 text-muted-foreground">
                    <p>Once DNS has propagated:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Open the custom domain in your browser (e.g., <code className="bg-muted px-1 rounded">https://latest.com</code>)</li>
                      <li>Verify the customer's property page loads correctly</li>
                      <li>Test the about, contact, and property detail pages</li>
                      <li>If email was set up, send a test email to the custom address</li>
                      <li>Come back here and change the status to <Badge className="bg-green-600/20 text-green-700">Active</Badge></li>
                    </ol>
                  </div>
                </div>

                {/* Quick Reference */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Reference</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium mb-2">Platform Domain</p>
                      <code className="text-sm bg-background px-2 py-1 rounded border">rebal.com.ng</code>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="font-medium mb-2">DNS Check Tool</p>
                      <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline flex items-center gap-1">
                        dnschecker.org <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Manage Domain Request</DialogTitle>
              <DialogDescription>
                {selectedRequest?.selected_domain || selectedRequest?.business_name}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Company</Label>
                    <p className="text-sm font-medium">{selectedRequest.company?.name}</p>
                  </div>
                  <div>
                    <Label>Requested</Label>
                    <p className="text-sm">{format(new Date(selectedRequest.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="domainPrice">Domain Price (₦/year)</Label>
                    <Input
                      id="domainPrice"
                      type="number"
                      value={domainPrice}
                      onChange={(e) => setDomainPrice(e.target.value)}
                      placeholder="15000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailPrice">Email Price (₦/year)</Label>
                    <Input
                      id="emailPrice"
                      type="number"
                      value={emailPrice}
                      onChange={(e) => setEmailPrice(e.target.value)}
                      placeholder="5000"
                      disabled={!selectedRequest.email_prefix}
                    />
                    {!selectedRequest.email_prefix && (
                      <p className="text-xs text-muted-foreground">No email requested</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Total: {formatPrice((parseFloat(domainPrice) || 0) + (parseFloat(emailPrice) || 0))}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="price_sent">Price Sent (notify user)</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="active">Active (domain live)</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNote">Admin Note (visible to user)</Label>
                  <Textarea
                    id="adminNote"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add a note for the customer..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateRequest} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminDomains;
