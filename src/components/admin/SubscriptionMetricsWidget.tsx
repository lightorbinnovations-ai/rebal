import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  RefreshCw,
  CreditCard,
  XCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface SubscriptionMetrics {
  mrr: number;
  mrrGrowth: number;
  totalSubscribers: number;
  activeSubscribers: number;
  trialUsers: number;
  pastDueCount: number;
  cancelledThisMonth: number;
  churnRate: number;
  failedPaymentsCount: number;
  failedPaymentsAmount: number;
  gracePeriodCount: number;
  conversionRate: number;
}

interface RecentEvent {
  id: string;
  type: "payment" | "subscription" | "cancellation" | "failed";
  description: string;
  amount?: number;
  created_at: string;
}

export const SubscriptionMetricsWidget = () => {
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    mrr: 0,
    mrrGrowth: 0,
    totalSubscribers: 0,
    activeSubscribers: 0,
    trialUsers: 0,
    pastDueCount: 0,
    cancelledThisMonth: 0,
    churnRate: 0,
    failedPaymentsCount: 0,
    failedPaymentsAmount: 0,
    gracePeriodCount: 0,
    conversionRate: 0,
  });
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async () => {
    try {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));

      // Fetch all subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*, plan:subscription_plans(monthly_price, yearly_price)");

      // Fetch payments this month
      const { data: paymentsThisMonth } = await supabase
        .from("payments")
        .select("*")
        .gte("created_at", thisMonthStart.toISOString())
        .lte("created_at", thisMonthEnd.toISOString());

      // Fetch payments last month for comparison
      const { data: paymentsLastMonth } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "success")
        .gte("created_at", lastMonthStart.toISOString())
        .lte("created_at", lastMonthEnd.toISOString());

      // Fetch companies for trial/subscription status
      const { data: companies } = await supabase
        .from("companies")
        .select("subscription_status, created_at");

      // Calculate metrics
      const subs = subscriptions || [];
      const activeSubscribers = subs.filter(s => s.status === "active").length;
      const trialUsers = subs.filter(s => s.status === "trialing").length;
      const pastDueCount = subs.filter(s => s.status === "past_due").length;
      const cancelledThisMonth = subs.filter(s =>
        s.status === "cancelled" &&
        new Date(s.updated_at) >= thisMonthStart
      ).length;

      // Calculate grace period count (subscriptions with grace_period_end in future)
      const gracePeriodCount = subs.filter(s => {
        const subAny = s as any;
        return s.status === "past_due" &&
          subAny.grace_period_end &&
          new Date(subAny.grace_period_end) > now;
      }).length;

      // Calculate MRR (Monthly Recurring Revenue) - prices are in kobo, divide by 100
      let mrr = 0;
      subs.forEach(sub => {
        if (sub.status === "active" && sub.plan) {
          const plan = sub.plan as { monthly_price: number; yearly_price: number };
          if (sub.billing_interval === "yearly") {
            mrr += (plan.yearly_price || 0) / 12 / 100; // kobo to Naira
          } else {
            mrr += (plan.monthly_price || 0) / 100; // kobo to Naira
          }
        }
      });

      // Calculate last month's MRR for growth comparison
      const successfulPaymentsThisMonth = (paymentsThisMonth || []).filter(p => p.status === "success");
      const successfulPaymentsLastMonth = paymentsLastMonth || [];

      const revenueThisMonth = successfulPaymentsThisMonth.reduce((sum, p) => sum + (p.amount || 0), 0);
      const revenueLastMonth = successfulPaymentsLastMonth.reduce((sum, p) => sum + (p.amount || 0), 0);

      const mrrGrowth = revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

      // Failed payments (only actual failures, not pending)
      const failedPayments = (paymentsThisMonth || []).filter(p => p.status === "failed");
      const failedPaymentsCount = failedPayments.length;
      const failedPaymentsAmount = failedPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100; // kobo to Naira

      // Churn rate (cancelled this month / active subscribers at start + cancelled)
      const totalActiveAtMonthStart = activeSubscribers + cancelledThisMonth;
      const churnRate = totalActiveAtMonthStart > 0 ? (cancelledThisMonth / totalActiveAtMonthStart) * 100 : 0;

      // Conversion rate (active / (active + trial))
      const totalPotential = activeSubscribers + trialUsers;
      const conversionRate = totalPotential > 0 ? (activeSubscribers / totalPotential) * 100 : 0;

      setMetrics({
        mrr,
        mrrGrowth,
        totalSubscribers: subs.length,
        activeSubscribers,
        trialUsers,
        pastDueCount,
        cancelledThisMonth,
        churnRate,
        failedPaymentsCount,
        failedPaymentsAmount,
        gracePeriodCount,
        conversionRate,
      });

      // Build recent events
      const events: RecentEvent[] = [];

      // Add recent successful payments
      successfulPaymentsThisMonth.slice(0, 3).forEach(p => {
        events.push({
          id: p.id,
          type: "payment",
          description: "Payment received",
          amount: p.amount,
          created_at: p.created_at,
        });
      });

      // Add failed payments
      failedPayments.slice(0, 2).forEach(p => {
        events.push({
          id: p.id,
          type: "failed",
          description: "Payment failed",
          amount: p.amount,
          created_at: p.created_at,
        });
      });

      // Sort by date
      events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentEvents(events.slice(0, 5));

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching subscription metrics:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Real-time subscriptions for live updates
  useRealtimeSubscription({
    table: "subscriptions",
    onChange: fetchMetrics,
  });

  useRealtimeSubscription({
    table: "payments",
    onChange: fetchMetrics,
  });

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getEventIcon = (type: RecentEvent["type"]) => {
    switch (type) {
      case "payment":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "subscription":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "cancellation":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <CardTitle>Subscription Metrics</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>Real-time revenue & subscription data</span>
                <Badge variant="outline" className="text-xs gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Live
                </Badge>
              </CardDescription>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            Updated {format(lastUpdated, "h:mm:ss a")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* MRR */}
          <div className="rounded-xl border border-border/50 p-4 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">MRR</span>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(metrics.mrr)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {metrics.mrrGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${metrics.mrrGrowth >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {metrics.mrrGrowth >= 0 ? "+" : ""}{metrics.mrrGrowth.toFixed(1)}% vs last month
              </span>
            </div>
          </div>

          {/* Active Subscribers */}
          <div className="rounded-xl border border-border/50 p-4 bg-gradient-to-br from-blue-500/5 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Active</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.activeSubscribers}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.trialUsers} in trial
            </div>
          </div>

          {/* Churn Rate */}
          <div className="rounded-xl border border-border/50 p-4 bg-gradient-to-br from-amber-500/5 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Churn Rate</span>
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.churnRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.cancelledThisMonth} cancelled this month
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="rounded-xl border border-border/50 p-4 bg-gradient-to-br from-purple-500/5 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Conversion</span>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {metrics.conversionRate.toFixed(0)}%
            </div>
            <Progress value={metrics.conversionRate} className="mt-2 h-1.5" />
          </div>
        </div>

        {/* Secondary Metrics & Alerts */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Failed Payments Alert */}
          <div className={`rounded-xl border p-4 ${metrics.failedPaymentsCount > 0 ? "border-red-500/50 bg-red-500/5" : "border-border/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${metrics.failedPaymentsCount > 0 ? "bg-red-500/10" : "bg-muted/50"}`}>
                <CreditCard className={`h-5 w-5 ${metrics.failedPaymentsCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Failed Payments</div>
                <div className="text-2xl font-bold">
                  {metrics.failedPaymentsCount}
                  {metrics.failedPaymentsCount > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({formatCurrency(metrics.failedPaymentsAmount)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grace Period */}
          <div className={`rounded-xl border p-4 ${metrics.gracePeriodCount > 0 ? "border-amber-500/50 bg-amber-500/5" : "border-border/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${metrics.gracePeriodCount > 0 ? "bg-amber-500/10" : "bg-muted/50"}`}>
                <Clock className={`h-5 w-5 ${metrics.gracePeriodCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">In Grace Period</div>
                <div className="text-2xl font-bold">{metrics.gracePeriodCount}</div>
              </div>
            </div>
          </div>

          {/* Past Due */}
          <div className={`rounded-xl border p-4 ${metrics.pastDueCount > 0 ? "border-orange-500/50 bg-orange-500/5" : "border-border/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${metrics.pastDueCount > 0 ? "bg-orange-500/10" : "bg-muted/50"}`}>
                <AlertTriangle className={`h-5 w-5 ${metrics.pastDueCount > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">Past Due</div>
                <div className="text-2xl font-bold">{metrics.pastDueCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        {recentEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.type)}
                    <span className="text-sm text-foreground">{event.description}</span>
                    {event.amount && (
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(event.amount)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
