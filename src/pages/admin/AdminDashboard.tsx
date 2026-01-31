import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { SubscriptionMetricsWidget } from "@/components/admin/SubscriptionMetricsWidget";
import { GracePeriodManager } from "@/components/admin/GracePeriodManager";
import { MRRTrendChart } from "@/components/admin/MRRTrendChart";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Home,
  MessageSquare,
  Share2,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface RecentActivity {
  id: string;
  type: "signup" | "company" | "property" | "inquiry";
  description: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, signOut, isLoading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalProperties: 0,
    totalInquiries: 0,
    totalReferrals: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch counts from each table
        const [companiesRes, propertiesRes, inquiriesRes, referralsRes, paymentsRes] = await Promise.all([
          supabase.from("companies").select("id", { count: "exact", head: true }),
          supabase.from("properties").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }),
          supabase.from("referrals").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("amount").eq("status", "success"),
        ]);

        // Calculate total revenue from successful payments (amounts are in kobo, divide by 100)
        const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

        setStats({
          totalUsers: companiesRes.count || 0,
          totalCompanies: companiesRes.count || 0,
          totalProperties: propertiesRes.count || 0,
          totalInquiries: inquiriesRes.count || 0,
          totalReferrals: referralsRes.count || 0,
          totalRevenue,
        });

        // Fetch recent activity (mix of companies, properties, inquiries)
        const [recentCompaniesData, recentPropertiesData, recentInquiriesData] = await Promise.all([
          supabase.from("companies").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
          supabase.from("properties").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
          supabase.from("inquiries").select("id, name, created_at").order("created_at", { ascending: false }).limit(3),
        ]);

        const activities: RecentActivity[] = [
          ...(recentCompaniesData.data || []).map((c) => ({
            id: c.id,
            type: "company" as const,
            description: `New company registered: ${c.name}`,
            created_at: c.created_at,
          })),
          ...(recentPropertiesData.data || []).map((p) => ({
            id: p.id,
            type: "property" as const,
            description: `New property listed: ${p.title}`,
            created_at: p.created_at,
          })),
          ...(recentInquiriesData.data || []).map((i) => ({
            id: i.id,
            type: "inquiry" as const,
            description: `New inquiry from: ${i.name}`,
            created_at: i.created_at,
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

        setRecentActivity(activities);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchStats();
    }
  }, [authLoading]);

  // Real-time updates for stats
  const refetchStats = () => {
    if (!authLoading) {
      // Refetch stats when tables change
      const fetchStats = async () => {
        const [companiesRes, propertiesRes, inquiriesRes, referralsRes, paymentsRes] = await Promise.all([
          supabase.from("companies").select("id", { count: "exact", head: true }),
          supabase.from("properties").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }),
          supabase.from("referrals").select("id", { count: "exact", head: true }),
          supabase.from("payments").select("amount").eq("status", "success"),
        ]);

        const totalRevenue = (paymentsRes.data || []).reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

        setStats(prev => ({
          ...prev,
          totalUsers: companiesRes.count || 0,
          totalCompanies: companiesRes.count || 0,
          totalProperties: propertiesRes.count || 0,
          totalInquiries: inquiriesRes.count || 0,
          totalReferrals: referralsRes.count || 0,
          totalRevenue,
        }));
      };
      fetchStats();
    }
  };

  useRealtimeSubscription({ table: "companies", onChange: refetchStats });
  useRealtimeSubscription({ table: "properties", onChange: refetchStats });
  useRealtimeSubscription({ table: "inquiries", onChange: refetchStats });

  const getActivityBadge = (type: RecentActivity["type"]) => {
    const config = {
      signup: { label: "Signup", variant: "default" as const },
      company: { label: "Company", variant: "secondary" as const },
      property: { label: "Property", variant: "outline" as const },
      inquiry: { label: "Inquiry", variant: "default" as const },
    };
    return config[type];
  };

  const quickActions = [
    { title: "Manage Users", icon: Users, url: "/admin/users", color: "text-blue-500" },
    { title: "Manage Companies", icon: Building2, url: "/admin/companies", color: "text-emerald-500" },
    { title: "View Properties", icon: Home, url: "/admin/properties", color: "text-amber-500" },
    { title: "Platform Settings", icon: Activity, url: "/admin/settings", color: "text-purple-500" },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      description="Platform overview and key metrics"
      isLoading={isLoading || authLoading}
      onSignOut={signOut}
    >
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Panel
              </div>
            </div>
            <h2 className="text-xl font-semibold text-foreground">Welcome to REBAL Admin</h2>
            <p className="text-muted-foreground mt-1">Monitor platform performance and manage all aspects of the system.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
          <AdminStatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <AdminStatCard
            title="Companies"
            value={stats.totalCompanies}
            icon={Building2}
            trend={{ value: 8, isPositive: true }}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <AdminStatCard
            title="Properties"
            value={stats.totalProperties}
            icon={Home}
            trend={{ value: 15, isPositive: true }}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <AdminStatCard
            title="Inquiries"
            value={stats.totalInquiries}
            icon={MessageSquare}
            trend={{ value: 23, isPositive: true }}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <AdminStatCard
            title="Referrals"
            value={stats.totalReferrals}
            icon={Share2}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <AdminStatCard
            title="Revenue"
            value={`₦${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
        </div>

        {/* Subscription Metrics Widget */}
        <SubscriptionMetricsWidget />

        {/* Grace Period Manager */}
        <GracePeriodManager />

        {/* MRR Trend Chart */}
        <MRRTrendChart />

        {/* Charts and Activity */}
        <div className="grid gap-6 lg:grid-cols-1">
          {/* Recent Activity */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest signups, listings, and inquiries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 rounded-xl bg-muted/30 border border-dashed border-border/50">
                    <Activity className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => {
                    const badge = getActivityBadge(activity.type);
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={badge.variant} className="rounded-lg">
                            {badge.label}
                          </Badge>
                          <span className="text-sm text-foreground">
                            {activity.description}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(activity.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.url}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 p-6 hover:bg-muted/50 hover:border-primary/30 transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <action.icon className={`h-6 w-6 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-foreground">{action.title}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
