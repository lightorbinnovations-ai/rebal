import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Eye, MessageSquare, Building2, TrendingUp } from "lucide-react";
import { format, subDays } from "date-fns";

export default function AdminAnalytics() {
  const { signOut, isLoading: authLoading } = useAdminAuth();
  const [dateRange, setDateRange] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [totals, setTotals] = useState({
    pageViews: 0,
    propertyViews: 0,
    inquiries: 0,
    companies: 0,
  });
  const [chartData, setChartData] = useState<
    { date: string; views: number; inquiries: number }[]
  >([]);
  const [topCompanies, setTopCompanies] = useState<
    { name: string; views: number; properties: number }[]
  >([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const days = parseInt(dateRange);
        const startDate = subDays(new Date(), days);

        // Fetch analytics
        const { data: analyticsData, error: analyticsError } = await supabase
          .from("analytics")
          .select("*")
          .gte("created_at", startDate.toISOString());

        if (analyticsError) throw analyticsError;

        // Fetch inquiries
        const { data: inquiriesData, error: inquiriesError } = await supabase
          .from("inquiries")
          .select("*")
          .gte("created_at", startDate.toISOString());

        if (inquiriesError) throw inquiriesError;

        // Fetch companies with property counts
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("id, name, slug");

        if (companiesError) throw companiesError;

        // Calculate totals
        const pageViews = (analyticsData || []).filter(
          (a) => a.event_type === "page_view"
        ).length;
        const propertyViews = (analyticsData || []).filter(
          (a) => a.event_type === "property_view"
        ).length;

        setTotals({
          pageViews,
          propertyViews,
          inquiries: (inquiriesData || []).length,
          companies: (companiesData || []).length,
        });

        // Generate chart data
        const dailyData: Record<string, { views: number; inquiries: number }> = {};

        for (let i = 0; i < days; i++) {
          const date = format(subDays(new Date(), days - 1 - i), "MMM d");
          dailyData[date] = { views: 0, inquiries: 0 };
        }

        (analyticsData || []).forEach((item) => {
          const date = format(new Date(item.created_at), "MMM d");
          if (dailyData[date]) {
            dailyData[date].views += 1;
          }
        });

        (inquiriesData || []).forEach((item) => {
          const date = format(new Date(item.created_at), "MMM d");
          if (dailyData[date]) {
            dailyData[date].inquiries += 1;
          }
        });

        setChartData(
          Object.entries(dailyData).map(([date, data]) => ({
            date,
            ...data,
          }))
        );

        // Calculate top companies by analytics
        const companyViews: Record<string, number> = {};
        (analyticsData || []).forEach((item) => {
          if (item.company_id) {
            companyViews[item.company_id] = (companyViews[item.company_id] || 0) + 1;
          }
        });

        const topCompaniesData = await Promise.all(
          Object.entries(companyViews)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(async ([companyId, views]) => {
              const company = (companiesData || []).find((c) => c.id === companyId);
              const { count } = await supabase
                .from("properties")
                .select("id", { count: "exact", head: true })
                .eq("company_id", companyId);

              return {
                name: company?.name || "Unknown",
                views,
                properties: count || 0,
              };
            })
        );

        setTopCompanies(topCompaniesData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchAnalytics();
    }
  }, [authLoading, dateRange]);

  const chartConfig = {
    views: {
      label: "Views",
      color: "hsl(var(--primary))",
    },
    inquiries: {
      label: "Inquiries",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <AdminLayout
      title="Platform Analytics"
      description="Traffic overview and performance metrics"
      isLoading={isLoading || authLoading}
      onSignOut={signOut}
    >
      <div className="space-y-6">
        {/* Date Range Selector */}
        <div className="flex justify-end">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <AdminStatCard
            title="Total Page Views"
            value={totals.pageViews}
            icon={Eye}
          />
          <AdminStatCard
            title="Property Views"
            value={totals.propertyViews}
            icon={TrendingUp}
          />
          <AdminStatCard
            title="Inquiries"
            value={totals.inquiries}
            icon={MessageSquare}
          />
          <AdminStatCard
            title="Active Companies"
            value={totals.companies}
            icon={Building2}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
              <CardDescription>
                Page views and property views
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <AreaChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inquiries Over Time</CardTitle>
              <CardDescription>
                Lead generation performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-64">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="inquiries"
                    fill="hsl(var(--secondary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Companies */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Companies</CardTitle>
            <CardDescription>
              Companies with the most engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCompanies.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No data available yet
              </p>
            ) : (
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <div
                    key={company.name}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {company.properties} properties
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{company.views}</p>
                      <p className="text-sm text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
