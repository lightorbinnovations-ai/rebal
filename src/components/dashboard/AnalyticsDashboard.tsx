import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay } from "date-fns";
import {
  Eye,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Building2,
  Download,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Lock,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import type { Company, Property } from "@/types/company";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  company: Company;
}

interface AnalyticsData {
  date: string;
  page_views: number;
  property_views: number;
  inquiries: number;
}

interface PropertyStats {
  property: Property;
  views: number;
  inquiries: number;
  conversionRate: number;
}

type SortField = "title" | "views" | "inquiries" | "conversionRate";
type SortDirection = "asc" | "desc";

export const AnalyticsDashboard = ({ company }: AnalyticsDashboardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("7");
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<AnalyticsData[]>([]);
  const [propertyStats, setPropertyStats] = useState<PropertyStats[]>([]);
  const [sortField, setSortField] = useState<SortField>("views");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [totals, setTotals] = useState({
    pageViews: 0,
    propertyViews: 0,
    inquiries: 0,
    properties: 0,
  });
  const [previousTotals, setPreviousTotals] = useState({
    pageViews: 0,
    propertyViews: 0,
    inquiries: 0,
  });

  const { features, isTrialing, planName } = useSubscriptionLimits(company);
  const hasAnalyticsAccess = features.analytics;

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days);
      const previousStartDate = subDays(startDate, days);

      try {
        // Fetch current period analytics
        const { data: analytics } = await supabase
          .from("analytics")
          .select("*")
          .eq("company_id", company.id)
          .gte("created_at", startOfDay(startDate).toISOString());

        // Fetch previous period analytics for comparison
        const { data: previousAnalytics } = await supabase
          .from("analytics")
          .select("*")
          .eq("company_id", company.id)
          .gte("created_at", startOfDay(previousStartDate).toISOString())
          .lt("created_at", startOfDay(startDate).toISOString());

        // Fetch current period inquiries
        const { data: inquiries } = await supabase
          .from("inquiries")
          .select("*")
          .eq("company_id", company.id)
          .gte("created_at", startOfDay(startDate).toISOString());

        // Fetch previous period inquiries
        const { data: previousInquiries } = await supabase
          .from("inquiries")
          .select("*")
          .eq("company_id", company.id)
          .gte("created_at", startOfDay(previousStartDate).toISOString())
          .lt("created_at", startOfDay(startDate).toISOString());

        // Fetch properties
        const { data: properties } = await supabase
          .from("properties")
          .select("*")
          .eq("company_id", company.id);

        // Process data for charts
        const dataByDate: Record<string, AnalyticsData> = {};
        for (let i = 0; i <= days; i++) {
          const date = format(subDays(new Date(), days - i), "MMM dd");
          dataByDate[date] = {
            date,
            page_views: 0,
            property_views: 0,
            inquiries: 0,
          };
        }

        analytics?.forEach((event) => {
          const date = format(new Date(event.created_at), "MMM dd");
          if (dataByDate[date]) {
            if (event.event_type === "page_view") {
              dataByDate[date].page_views++;
            } else if (event.event_type === "property_view") {
              dataByDate[date].property_views++;
            }
          }
        });

        inquiries?.forEach((inquiry) => {
          const date = format(new Date(inquiry.created_at), "MMM dd");
          if (dataByDate[date]) {
            dataByDate[date].inquiries++;
          }
        });

        // Calculate property stats with conversion rate
        const propStats = (properties || []).map((prop) => {
          const views =
            analytics?.filter(
              (a) => a.property_id === prop.id && a.event_type === "property_view"
            ).length || 0;
          const inqs = inquiries?.filter((i) => i.property_id === prop.id).length || 0;
          const conversionRate = views > 0 ? (inqs / views) * 100 : 0;
          return {
            property: prop as Property,
            views,
            inquiries: inqs,
            conversionRate,
          };
        });

        // Calculate previous period totals for comparison
        const prevPageViews =
          previousAnalytics?.filter((a) => a.event_type === "page_view").length || 0;
        const prevPropertyViews =
          previousAnalytics?.filter((a) => a.event_type === "property_view").length ||
          0;
        const prevInquiries = previousInquiries?.length || 0;

        setChartData(Object.values(dataByDate));
        setPropertyStats(propStats);
        setTotals({
          pageViews: analytics?.filter((a) => a.event_type === "page_view").length || 0,
          propertyViews:
            analytics?.filter((a) => a.event_type === "property_view").length || 0,
          inquiries: inquiries?.length || 0,
          properties: properties?.length || 0,
        });
        setPreviousTotals({
          pageViews: prevPageViews,
          propertyViews: prevPropertyViews,
          inquiries: prevInquiries,
        });
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [company.id, dateRange]);

  const sortedPropertyStats = useMemo(() => {
    return [...propertyStats].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "title":
          aValue = a.property.title.toLowerCase();
          bValue = b.property.title.toLowerCase();
          break;
        case "views":
          aValue = a.views;
          bValue = b.views;
          break;
        case "inquiries":
          aValue = a.inquiries;
          bValue = b.inquiries;
          break;
        case "conversionRate":
          aValue = a.conversionRate;
          bValue = b.conversionRate;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [propertyStats, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatGrowth = (growth: number) => {
    const sign = growth >= 0 ? "+" : "";
    return `${sign}${growth.toFixed(0)}%`;
  };

  const exportToCSV = () => {
    // Prepare data
    const headers = ["Date", "Page Views", "Property Views", "Inquiries"];
    const rows = chartData.map((d) => [
      d.date,
      d.page_views,
      d.property_views,
      d.inquiries,
    ]);

    // Add property stats section
    const propertyHeaders = [
      "",
      "",
      "",
      "",
      "Property Performance",
      "",
      "",
      "",
    ];
    const propertySubHeaders = ["Property", "Type", "Views", "Inquiries", "Conversion Rate"];
    const propertyRows = sortedPropertyStats.map((ps) => [
      ps.property.title,
      ps.property.property_type,
      ps.views,
      ps.inquiries,
      `${ps.conversionRate.toFixed(1)}%`,
    ]);

    // Combine all data
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      "",
      propertySubHeaders.join(","),
      ...propertyRows.map((row) => row.join(",")),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast({
      title: "Export complete",
      description: "Analytics data has been downloaded as CSV.",
    });
  };

  const chartConfig = {
    page_views: { label: "Page Views", color: "hsl(var(--chart-1))" },
    property_views: { label: "Property Views", color: "hsl(var(--chart-2))" },
    inquiries: { label: "Inquiries", color: "hsl(var(--chart-3))" },
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const GrowthBadge = ({ current, previous }: { current: number; previous: number }) => {
    const growth = calculateGrowth(current, previous);
    const isPositive = growth >= 0;
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs",
          isPositive
            ? "text-green-600 border-green-500/20 bg-green-500/10"
            : "text-red-600 border-red-500/20 bg-red-500/10"
        )}
      >
        {isPositive ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {formatGrowth(growth)}
      </Badge>
    );
  };

  // Feature gate for free users
  if (!hasAnalyticsAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your page views, property engagement, and leads
          </p>
        </div>
        
        <Card className="border-2 border-dashed border-primary/30">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Unlock Analytics</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get detailed insights into your property views, inquiries, and visitor behavior. 
              Upgrade to Pro or Business to access full analytics.
            </p>
            <Button onClick={() => navigate("/dashboard/settings")} className="gap-2">
              <Crown className="h-4 w-4" />
              Upgrade to Pro
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Currently on: <span className="font-medium">{planName}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Track your page views, property engagement, and leads
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportToCSV}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{totals.properties}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Active listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold">{totals.pageViews}</span>
              <GrowthBadge current={totals.pageViews} previous={previousTotals.pageViews} />
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Property Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold">{totals.propertyViews}</span>
              <GrowthBadge
                current={totals.propertyViews}
                previous={previousTotals.propertyViews}
              />
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Last {dateRange} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold">{totals.inquiries}</span>
              <GrowthBadge current={totals.inquiries} previous={previousTotals.inquiries} />
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Last {dateRange} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Views Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>Page views and property views trend</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="page_views"
                  name="Page Views"
                  stroke="var(--color-page_views)"
                  fill="var(--color-page_views)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="property_views"
                  name="Property Views"
                  stroke="var(--color-property_views)"
                  fill="var(--color-property_views)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Inquiries Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Inquiries Over Time</CardTitle>
            <CardDescription>Lead generation trend</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-4">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tick={{ fill: "hsl(var(--muted-foreground))" }} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="inquiries"
                  name="Inquiries"
                  fill="var(--color-inquiries)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle>Property Performance</CardTitle>
              <CardDescription>
                Detailed metrics for each property listing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedPropertyStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>No property data available yet.</p>
              <p className="text-sm">Add properties to start tracking performance.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("title")}
                        className="hover:bg-transparent p-0 h-auto font-medium"
                      >
                        Property
                        <SortIcon field="title" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("views")}
                        className="hover:bg-transparent p-0 h-auto font-medium"
                      >
                        Views
                        <SortIcon field="views" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("inquiries")}
                        className="hover:bg-transparent p-0 h-auto font-medium"
                      >
                        Inquiries
                        <SortIcon field="inquiries" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right hidden sm:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("conversionRate")}
                        className="hover:bg-transparent p-0 h-auto font-medium"
                      >
                        Conv. Rate
                        <SortIcon field="conversionRate" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPropertyStats.map(
                    ({ property, views, inquiries, conversionRate }) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                              {property.main_image_url ? (
                                <img
                                  src={property.main_image_url}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <span className="font-medium truncate max-w-[200px]">
                              {property.title}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {property.property_type}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className={cn(
                              property.status === "Available" &&
                                "bg-green-500/10 text-green-600 border-green-500/20",
                              property.status === "Sold" &&
                                "bg-red-500/10 text-red-600 border-red-500/20",
                              property.status === "Reserved" &&
                                "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                            )}
                          >
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{views}</TableCell>
                        <TableCell className="text-right font-medium">
                          {inquiries}
                        </TableCell>
                        <TableCell className="text-right hidden sm:table-cell">
                          <Badge variant="secondary">
                            {conversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={`/${company.slug}/property/${property.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
