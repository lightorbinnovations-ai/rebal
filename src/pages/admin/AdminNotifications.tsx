import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  Mail,
  Send,
  Check,
  Clock,
  AlertCircle,
  CreditCard,
  MessageSquare,
  BadgeCheck,
  Banknote,
  RefreshCw,
  Loader2
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SystemEvent {
  id: string;
  type: "payment" | "support" | "verification" | "withdrawal" | "referral";
  title: string;
  description: string;
  status: "pending" | "processed" | "completed";
  created_at: string;
  metadata?: Record<string, unknown>;
}

const getEventIcon = (type: string) => {
  switch (type) {
    case "payment":
      return <CreditCard className="h-4 w-4 text-emerald-500" />;
    case "support":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "verification":
      return <BadgeCheck className="h-4 w-4 text-purple-500" />;
    case "withdrawal":
      return <Banknote className="h-4 w-4 text-amber-500" />;
    case "referral":
      return <Send className="h-4 w-4 text-primary" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    case "processed":
      return <Badge variant="outline" className="gap-1"><Check className="h-3 w-3" />Processed</Badge>;
    case "completed":
      return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />Completed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function AdminNotifications() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSystemEvents = async () => {
    try {
      // Helper to swallow errors for individual requests so one failure doesn't break the page
      const safeFetch = async <T,>(promise: Promise<{ data: T | null; error: any }>) => {
        try {
          const { data, error } = await promise;
          if (error) throw error;
          return { data: data || [] };
        } catch (err) {
          console.warn("Individual fetch failed:", err);
          return { data: [] }; // Return empty array on failure
        }
      };

      // Fetch recent important events
      const [paymentsRes, ticketsRes, verificationsRes, withdrawalsRes, referralsRes, domainRequestsRes, boostsRes] = await Promise.all([
        safeFetch(supabase
          .from("payments")
          .select("id, amount, status, created_at, company_id, companies(name)")
          .order("created_at", { ascending: false })
          .limit(10)),
        safeFetch(supabase
          .from("support_tickets")
          .select("id, subject, status, priority, created_at, companies(name)")
          .order("created_at", { ascending: false })
          .limit(10)),
        safeFetch(supabase
          .from("verification_requests")
          .select("id, status, created_at, companies(name)")
          .order("created_at", { ascending: false })
          .limit(10)),
        safeFetch(supabase
          .from("withdrawal_requests")
          .select("id, amount, status, created_at, companies(name)")
          .order("created_at", { ascending: false })
          .limit(10)),
        safeFetch(supabase
          .from("referrals")
          .select("id, status, reward_amount, created_at, referrer:companies!referrals_referrer_id_fkey(name)")
          .order("created_at", { ascending: false })
          .limit(10)),
        safeFetch(supabase
          .from("domain_requests")
          .select("id, business_name, status, created_at, selected_domain, selected_extension")
          .in("status", ["pending", "pending_payment", "processing"])
          .order("created_at", { ascending: false })
          .limit(10)),
        safeFetch(supabase
          .from("property_boosts")
          .select("id, amount_paid, status, created_at, boost_type")
          .eq("status", "active")
          .eq("boost_type", "paid")
          .order("created_at", { ascending: false })
          .limit(10)),
      ]);

      const allEvents: SystemEvent[] = [];

      // Process payments
      (paymentsRes.data as any[]).forEach((p: any) => {
        allEvents.push({
          id: `payment-${p.id}`,
          type: "payment",
          title: `Payment: ₦${p.amount?.toLocaleString() || 0}`,
          description: `From ${p.companies?.name || "Unknown company"}`,
          status: p.status === "success" ? "completed" : "pending",
          created_at: p.created_at,
        });
      });

      // Process support tickets
      (ticketsRes.data || []).forEach((t: any) => {
        allEvents.push({
          id: `ticket-${t.id}`,
          type: "support",
          title: `Support: ${t.subject}`,
          description: `From ${t.companies?.name || "Unknown"} • Priority: ${t.priority}`,
          status: t.status === "resolved" || t.status === "closed" ? "completed" : "pending",
          created_at: t.created_at,
        });
      });

      // Process verifications
      (verificationsRes.data || []).forEach((v: any) => {
        allEvents.push({
          id: `verification-${v.id}`,
          type: "verification",
          title: "Verification Request",
          description: `From ${v.companies?.name || "Unknown company"}`,
          status: v.status === "approved" ? "completed" : v.status === "rejected" ? "processed" : "pending",
          created_at: v.created_at,
        });
      });

      // Process withdrawals
      (withdrawalsRes.data || []).forEach((w: any) => {
        allEvents.push({
          id: `withdrawal-${w.id}`,
          type: "withdrawal",
          title: `Withdrawal: ₦${w.amount?.toLocaleString() || 0}`,
          description: `From ${w.companies?.name || "Unknown company"}`,
          status: w.status === "completed" ? "completed" : w.status === "processing" ? "processed" : "pending",
          created_at: w.created_at,
        });
      });

      // Process domain requests
      (domainRequestsRes.data || []).forEach((d: any) => {
        const domainName = d.selected_domain && d.selected_extension
          ? `${d.selected_domain}${d.selected_extension}`
          : d.business_name;
        allEvents.push({
          id: `domain-${d.id}`,
          type: "domain",
          title: `Domain Request: ${domainName}`,
          description: "New domain registration request",
          status: "pending",
          created_at: d.created_at,
        });
      });

      // Process boosts
      (boostsRes.data || []).forEach((b: any) => {
        allEvents.push({
          id: `boost-${b.id}`,
          type: "boost",
          title: `Property Boost: ₦${(b.amount_paid || 0).toLocaleString()}`,
          description: "Paid promotion active",
          status: "completed",
          created_at: b.created_at,
        });
      });

      // Process withdrawals
      (withdrawalsRes.data || []).forEach((w: any) => {
        allEvents.push({
          id: `withdrawal-${w.id}`,
          type: "withdrawal",
          title: `Withdrawal: ₦${w.amount?.toLocaleString() || 0}`,
          description: `From ${w.companies?.name || "Unknown company"}`,
          status: w.status === "completed" ? "completed" : w.status === "processing" ? "processed" : "pending",
          created_at: w.created_at,
        });
      });

      // Process referrals
      (referralsRes.data || []).forEach((r: any) => {
        allEvents.push({
          id: `referral-${r.id}`,
          type: "referral",
          title: `Referral: ₦${r.reward_amount?.toLocaleString() || 0}`,
          description: `By ${r.referrer?.name || "Unknown agent"}`,
          status: r.status === "paid" ? "completed" : "pending",
          created_at: r.created_at,
        });
      });

      // Sort by date
      allEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchSystemEvents();
    }
  }, [authLoading]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSystemEvents();
  };

  const pendingCount = events.filter((e) => e.status === "pending").length;

  return (
    <AdminLayout
      title="Notifications & Events"
      description="View system events and notifications"
      isLoading={isLoading || authLoading}
      onSignOut={signOut}
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length - pendingCount}</p>
                <p className="text-sm text-muted-foreground">Processed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Events</CardTitle>
              <CardDescription>
                Recent platform activity and notifications
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4">
                <TabsList className="inline-flex w-auto min-w-max">
                  <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">Pending ({pendingCount})</TabsTrigger>
                  <TabsTrigger value="payment" className="text-xs sm:text-sm">Payments</TabsTrigger>
                  <TabsTrigger value="support" className="text-xs sm:text-sm">Support</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="m-0">
                <EventsList events={events} />
              </TabsContent>

              <TabsContent value="pending" className="m-0">
                <EventsList events={events.filter((e) => e.status === "pending")} />
              </TabsContent>

              <TabsContent value="payment" className="m-0">
                <EventsList events={events.filter((e) => ["payment", "boost", "domain"].includes(e.type))} />
              </TabsContent>

              <TabsContent value="support" className="m-0">
                <EventsList events={events.filter((e) => e.type === "support")} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function EventsList({ events }: { events: SystemEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No events found</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          System events will appear here as they occur.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
          >
            <div className="flex-shrink-0 mt-0.5">
              {getEventIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                </div>
                {getStatusBadge(event.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
