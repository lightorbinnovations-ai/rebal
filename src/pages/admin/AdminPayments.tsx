import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/admin/TablePagination";
import { useServerPagination } from "@/hooks/useServerPagination";
import { CreditCard, Download, TrendingUp, AlertCircle, Users, Loader2, Rocket, Globe, Zap } from "lucide-react";
import { format } from "date-fns";
import { TableSkeleton, StatCardsGridSkeleton } from "@/components/ui/skeletons";

import { Payment, Subscription, PaymentStatus } from "@/types/finance";

// Extended interface for the View which includes joined column aliases
interface AdminPaymentViewItem {
  id: string;
  reference: string; // Alias for paystack_reference in view? Or just reference?
  amount: number;
  status: PaymentStatus;
  payment_method: string | null;
  created_at: string;
  metadata: Record<string, any>;
  company_name: string;
  type: "subscription" | "boost" | "domain";
}

// Ensure the state uses the correct type
// Note: The view returns a flattened structure distinct from the raw table


export default function AdminPayments() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const [payments, setPayments] = useState<AdminPaymentViewItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    thisMonthRevenue: 0,
    failedPayments: 0,
  });
  const [paymentTotalCount, setPaymentTotalCount] = useState(0);
  const [subTotalCount, setSubTotalCount] = useState(0);

  const paymentPagination = useServerPagination({ initialPageSize: 10 });
  const subPagination = useServerPagination({ initialPageSize: 10 });

  // Fetch stats separately (doesn't need pagination)
  const fetchStats = useCallback(async () => {
    try {
      // Get all successful payments for stats from the VIEW
      const { data: allPayments } = await supabase
        .from("admin_all_payments_view")
        .select("amount, status, created_at");

      if (allPayments) {
        const successfulPayments = allPayments.filter(p => p.status === "success");
        // Amounts are in kobo (from view normalization), divide by 100 for Naira
        const totalRevenue = successfulPayments.reduce((sum, p) => sum + p.amount, 0) / 100;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const thisMonthPayments = successfulPayments.filter(
          p => new Date(p.created_at) >= startOfMonth
        );
        const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0) / 100;
        const failedPayments = allPayments.filter(p => p.status === "failed").length;

        setStats(prev => ({
          ...prev,
          totalRevenue,
          thisMonthRevenue,
          failedPayments,
        }));
      }

      // Get active subscription count
      const { count: activeSubCount } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setStats(prev => ({
        ...prev,
        activeSubscriptions: activeSubCount || 0,
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch paginated payments
  const fetchPayments = useCallback(async () => {
    if (authLoading) return;

    paymentPagination.setLoading(true);
    try {
      const { from, to } = paymentPagination.getRange();

      // Get count from View
      const { count } = await supabase
        .from("admin_all_payments_view")
        .select("*", { count: "exact", head: true });

      setPaymentTotalCount(count || 0);
      paymentPagination.setTotalItems(count || 0);

      // Get paginated data from View
      const { data, error } = await supabase
        .from("admin_all_payments_view")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      if (error) throw error;
      setPayments(data as unknown as AdminPaymentViewItem[] || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      paymentPagination.setLoading(false);
    }
  }, [authLoading, paymentPagination.currentPage, paymentPagination.pageSize]);

  // Fetch paginated subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (authLoading) return;

    subPagination.setLoading(true);
    try {
      const { from, to } = subPagination.getRange();

      // Get count
      const { count } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      setSubTotalCount(count || 0);
      subPagination.setTotalItems(count || 0);

      // Get paginated data
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          company:companies(name)
        `)
        .eq("status", "active")
        .range(from, to);

      if (error) throw error;
      if (error) throw error;
      // We need to match the Shape with company join
      setSubscriptions(data as unknown as Subscription[] || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    } finally {
      subPagination.setLoading(false);
    }
  }, [authLoading, subPagination.currentPage, subPagination.pageSize]);

  useEffect(() => {
    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading, fetchStats]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Real-time subscriptions for payments table (base table) - 
  // View listening is tricky, so we stick to listening to base 'payments' and refreshing.
  // Ideally we should listen to boosts and domains too.
  useRealtimeSubscription({
    table: "payments",
    onChange: () => {
      fetchPayments();
      fetchStats();
    },
  });

  const formatPrice = (amount: number) => {
    // Payment amounts are in kobo, convert to Naira
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string, className: string }> = {
      success: { variant: "default", label: "Success", className: "bg-green-500" },
      pending: { variant: "secondary", label: "Pending", className: "" },
      failed: { variant: "destructive", label: "Failed", className: "" },
      abandoned: { variant: "outline", label: "Abandoned", className: "" },
      // Custom mappings
      active: { variant: "default", label: "Active", className: "bg-green-500" },
      paid: { variant: "default", label: "Paid", className: "bg-green-500" },
    };
    return config[status] || { variant: "secondary", label: status, className: "" };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "boost": return <Rocket className="h-4 w-4 text-orange-500" />;
      case "domain": return <Globe className="h-4 w-4 text-cyan-500" />;
      default: return <CreditCard className="h-4 w-4 text-primary" />;
    }
  };

  const handleExportCSV = async () => {
    // Fetch all payments for export
    const { data: allPayments } = await supabase
      .from("admin_all_payments_view")
      .select("*")
      .order("created_at", { ascending: false });

    if (!allPayments) return;

    const headers = ["Date", "Type", "Company", "Reference", "Amount", "Status", "Method", "Details"];
    const rows = allPayments.map((p: any) => [
      format(new Date(p.created_at), "yyyy-MM-dd"),
      p.type,
      p.company_name || "Unknown",
      p.reference,
      p.amount / 100, // Export in Naira
      p.status,
      p.payment_method || "-",
      // Extract useful metadata
      p.type === 'boost' ? p.metadata?.boost_type :
        p.type === 'domain' ? (p.metadata?.domain_name || p.metadata?.domain) :
          p.metadata?.plan_name || "-"
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  const isLoading = paymentPagination.isLoading || subPagination.isLoading || authLoading;

  return (
    <AdminLayout
      title="Payments & Subscriptions"
      description="View and manage all platform payments"
      isLoading={isLoading}
      onSignOut={signOut}
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue * 100)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.thisMonthRevenue * 100)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Payments</p>
                  <p className="text-2xl font-bold">{stats.failedPayments}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Consolidated view of subscriptions, boosts, and domains</CardDescription>
            </div>
            <Button variant="outline" onClick={handleExportCSV} disabled={paymentTotalCount === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            {paymentPagination.isLoading ? (
              <TableSkeleton rows={5} columns={7} />
            ) : payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No payments yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Payments will appear here once users start transacting.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Type</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => {
                          const badge = getStatusBadge(payment.status);
                          return (
                            <TableRow key={payment.id}>
                              <TableCell>
                                <div className="flex items-center gap-2" title={payment.type}>
                                  {getTypeIcon(payment.type)}
                                  <span className="capitalize text-xs font-medium">{payment.type}</span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {payment.reference.slice(0, 16)}...
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {payment.company_name || "Unknown"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {payment.type === "boost" ? `Boost: ${payment.metadata?.boost_type}` :
                                  payment.type === "domain" ? `Domain: ${payment.metadata?.domain_name || payment.metadata?.domain}` :
                                    payment.metadata?.plan_name || "Subscription"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap font-mono">
                                {formatPrice(payment.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={badge.variant} className={badge.className}>
                                  {badge.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {format(new Date(payment.created_at), "MMM d, yyyy")}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <TablePagination
                  currentPage={paymentPagination.currentPage}
                  totalPages={paymentPagination.totalPages}
                  totalItems={paymentPagination.totalItems}
                  pageSize={paymentPagination.pageSize}
                  onPageChange={paymentPagination.setCurrentPage}
                  onPageSizeChange={paymentPagination.setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Active Subscriptions</CardTitle>
            <CardDescription>
              Companies with active paid subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active subscriptions yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto -mx-6 px-6">
                  <div className="min-w-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Company</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Billing</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscriptions.map((sub) => (
                          <TableRow key={sub.id}>
                            <TableCell>{sub.company?.name || "Unknown"}</TableCell>
                            <TableCell className="capitalize">{sub.plan_id}</TableCell>
                            <TableCell className="capitalize">{sub.billing_interval}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <TablePagination
                  currentPage={subPagination.currentPage}
                  totalPages={subPagination.totalPages}
                  totalItems={subPagination.totalItems}
                  pageSize={subPagination.pageSize}
                  onPageChange={subPagination.setCurrentPage}
                  onPageSizeChange={subPagination.setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
