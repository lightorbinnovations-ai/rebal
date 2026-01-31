import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MonthlyData {
  month: string;
  monthLabel: string;
  mrr: number;
  newRevenue: number;
  churnedRevenue: number;
  netGrowth: number;
  subscriptionCount: number;
}

export const MRRTrendChart = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMRR, setCurrentMRR] = useState(0);
  const [mrrGrowth, setMrrGrowth] = useState(0);

  const fetchMRRData = useCallback(async () => {
    try {
      const months = 12;
      const monthlyStats: MonthlyData[] = [];

      // Generate last 12 months
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);

        // Fetch successful payments for the month
        const { data: payments } = await supabase
          .from("payments")
          .select("amount, created_at, metadata")
          .eq("status", "success")
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        // Calculate total revenue for the month
        const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

        // Fetch active subscriptions at month end
        const { count: activeSubCount } = await supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("status", "active")
          .lte("created_at", monthEnd.toISOString());

        // Calculate MRR based on active subscriptions
        // Get subscription amounts from payments metadata
        const { data: activeSubscriptions } = await supabase
          .from("subscriptions")
          .select("plan_id, billing_interval")
          .eq("status", "active")
          .lte("created_at", monthEnd.toISOString());

        // Fetch plan prices
        const { data: plans } = await supabase
          .from("subscription_plans")
          .select("id, monthly_price, yearly_price");

        const planPrices: Record<string, { monthly: number; yearly: number }> = {};
        (plans || []).forEach((plan) => {
          planPrices[plan.id] = {
            monthly: plan.monthly_price / 100,
            yearly: plan.yearly_price / 100,
          };
        });

        // Calculate MRR
        let mrr = 0;
        (activeSubscriptions || []).forEach((sub) => {
          const prices = planPrices[sub.plan_id];
          if (prices) {
            if (sub.billing_interval === "yearly") {
              mrr += prices.yearly / 12;
            } else {
              mrr += prices.monthly;
            }
          }
        });

        monthlyStats.push({
          month: format(monthDate, "yyyy-MM"),
          monthLabel: format(monthDate, "MMM yy"),
          mrr: Math.round(mrr),
          newRevenue: totalRevenue,
          churnedRevenue: 0, // Would need cancellation tracking
          netGrowth: 0,
          subscriptionCount: activeSubCount || 0,
        });
      }

      // Calculate net growth
      for (let i = 1; i < monthlyStats.length; i++) {
        monthlyStats[i].netGrowth = monthlyStats[i].mrr - monthlyStats[i - 1].mrr;
      }

      setMonthlyData(monthlyStats);

      // Set current MRR and growth
      if (monthlyStats.length >= 2) {
        const current = monthlyStats[monthlyStats.length - 1].mrr;
        const previous = monthlyStats[monthlyStats.length - 2].mrr;
        setCurrentMRR(current);
        setMrrGrowth(previous > 0 ? ((current - previous) / previous) * 100 : 0);
      }
    } catch (error) {
      console.error("Error fetching MRR data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMRRData();
  }, [fetchMRRData]);

  useRealtimeSubscription({ table: "subscriptions", onChange: fetchMRRData });
  useRealtimeSubscription({ table: "payments", onChange: fetchMRRData });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `₦${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `₦${(value / 1000).toFixed(0)}K`;
    }
    return `₦${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center gap-4 text-sm">
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly Recurring Revenue over time</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(currentMRR)}</p>
            <div className={`flex items-center gap-1 text-sm ${mrrGrowth >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {mrrGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{mrrGrowth >= 0 ? "+" : ""}{mrrGrowth.toFixed(1)}% vs last month</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mrr" className="w-full">
          <TabsList className="grid w-full max-w-[300px] grid-cols-2 mb-4">
            <TabsTrigger value="mrr">MRR Trend</TabsTrigger>
            <TabsTrigger value="breakdown">Monthly Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="mrr">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2.5}
                    fill="url(#mrrGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="breakdown">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="newRevenue"
                    name="Revenue"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Monthly Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Avg MRR</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(
                monthlyData.length > 0
                  ? monthlyData.reduce((sum, m) => sum + m.mrr, 0) / monthlyData.length
                  : 0
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Peak MRR</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrency(Math.max(...monthlyData.map((m) => m.mrr), 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Active Subs</p>
            <p className="text-lg font-semibold text-foreground">
              {monthlyData.length > 0
                ? monthlyData[monthlyData.length - 1].subscriptionCount
                : 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
