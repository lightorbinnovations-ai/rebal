import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Share2,
  Users,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { WebsiteHealthScore } from "@/components/dashboard/WebsiteHealthScore";
import { LeadScoring } from "@/components/dashboard/LeadScoring";
import { ShareSection } from "@/components/share/ShareSection";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { ProfileCompletionBanner } from "@/components/dashboard/ProfileCompletionBanner";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Property } from "@/types/company";

interface DashboardOverviewProps {
  company: Company;
  showChecklist?: boolean;
  onDismissChecklist?: () => void;
}

interface DashboardStats {
  totalProperties: number;
  pageViews: number;
  propertyViews: number;
  totalInquiries: number;
}

interface AffiliateStats {
  totalReferrals: number;
  pendingReferrals: number;
  walletBalance: number;
  totalEarnings: number;
}

export const DashboardOverview = ({ company, showChecklist = true, onDismissChecklist }: DashboardOverviewProps) => {
  const profileStatus = useProfileCompletion(company);
  const isAffiliate = company.account_type === "affiliate";
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    pageViews: 0,
    propertyViews: 0,
    totalInquiries: 0,
  });
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({
    totalReferrals: 0,
    pendingReferrals: 0,
    walletBalance: company.wallet_balance || 0,
    totalEarnings: 0,
  });
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isAffiliate) {
          // Fetch affiliate-specific data
          const { data: referrals } = await supabase
            .from("referrals")
            .select("status, reward_amount")
            .eq("referrer_id", company.id);
          
          const totalReferrals = referrals?.length || 0;
          const pendingReferrals = referrals?.filter(r => r.status === "pending").length || 0;
          const totalEarnings = referrals?.filter(r => r.status === "paid")
            .reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;
          
          setAffiliateStats({
            totalReferrals,
            pendingReferrals,
            walletBalance: company.wallet_balance || 0,
            totalEarnings,
          });
        } else {
          // Fetch realtor data
          const { count: propertiesCount } = await supabase
            .from("properties")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id);

          const { data: properties } = await supabase
            .from("properties")
            .select("*")
            .eq("company_id", company.id)
            .order("created_at", { ascending: false })
            .limit(3);

          const { count: inquiriesCount } = await supabase
            .from("inquiries")
            .select("*", { count: "exact", head: true })
            .eq("company_id", company.id);

          const { data: analytics } = await supabase
            .from("analytics")
            .select("event_type")
            .eq("company_id", company.id);

          const pageViews =
            analytics?.filter((a) => a.event_type === "page_view").length || 0;
          const propertyViews =
            analytics?.filter((a) => a.event_type === "property_view").length ||
            0;

          setStats({
            totalProperties: propertiesCount || 0,
            pageViews,
            propertyViews,
            totalInquiries: inquiriesCount || 0,
          });

          setRecentProperties((properties as Property[]) || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [company.id, company.wallet_balance, isAffiliate]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Affiliate Dashboard
  if (isAffiliate) {
    const referralLink = `${window.location.origin}/auth?ref=${company.referral_code}`;
    
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent border border-border/50 p-4 sm:p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/30 text-accent-foreground text-sm font-medium">
                  <Users className="h-3.5 w-3.5" />
                  Affiliate Dashboard
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Welcome, Affiliate!
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Share your referral link and earn 10% on every subscription.
              </p>
            </div>
            <Button asChild className="rounded-xl shadow-lg w-full sm:w-auto">
              <Link to="/dashboard/referrals">
                <Users className="mr-2 h-4 w-4" />
                View Referral Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Affiliate Stats Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Referrals"
            value={affiliateStats.totalReferrals}
            icon={Users}
            description="Users referred"
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Pending"
            value={affiliateStats.pendingReferrals}
            icon={TrendingUp}
            description="Awaiting payment"
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Wallet Balance"
            value={formatPrice(affiliateStats.walletBalance)}
            icon={Wallet}
            description="Available to withdraw"
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
          <StatCard
            title="Total Earned"
            value={formatPrice(affiliateStats.totalEarnings)}
            icon={ArrowUpRight}
            description="All time earnings"
            className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
          />
        </div>

        {/* Referral Link Card */}
        <Card className="border-border/50 shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Share2 className="h-4 w-4 text-primary" />
              </div>
              Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Share this link with friends and colleagues. When they sign up and subscribe (₦3,000+), you earn 10% commission!
            </p>
            <ShareSection
              url={referralLink}
              title="Join REBAL - Property Management Platform"
              description="Create your branded property website and start listing properties today!"
              variant="inline"
            />
          </CardContent>
        </Card>

        {/* Upgrade to Realtor CTA */}
        <Card className="border-border/50 shadow-sm bg-gradient-to-br from-muted/50 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Want to list properties?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade to a Realtor account to create property listings and get your own branded website.
                </p>
              </div>
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/dashboard/settings">
                  Upgrade Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular Realtor Dashboard

  return (
    <div className="space-y-6">
      {/* Profile Completion Banner - show if profile is incomplete */}
      <ProfileCompletionBanner company={company} />

      {/* Onboarding Checklist - show for new users */}
      {showChecklist && (
        <OnboardingChecklist company={company} onDismiss={onDismissChecklist} />
      )}

      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-4 sm:p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                Dashboard
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              Welcome back, {company.name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Here's what's happening with your properties today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {profileStatus.isSiteShareable ? (
              <Button asChild variant="outline" className="rounded-xl border-border/50 hover:bg-muted/80 w-full sm:w-auto">
                <a
                  href={`/${company.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  <span className="truncate">View Public Page</span>
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled className="rounded-xl border-border/50 w-full sm:w-auto opacity-60">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span className="truncate">Complete profile to view site</span>
              </Button>
            )}
            {profileStatus.canAddProperties ? (
              <Button asChild className="rounded-xl shadow-lg shadow-primary/20 shine-effect w-full sm:w-auto">
                <Link to="/dashboard/properties/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Link>
              </Button>
            ) : (
              <Button asChild variant="default" className="rounded-xl w-full sm:w-auto">
                <Link to="/dashboard/settings">
                  <Plus className="mr-2 h-4 w-4" />
                  Complete Profile First
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Properties"
          value={stats.totalProperties}
          icon={Building2}
          description="Active listings"
          className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
        />
        <StatCard
          title="Page Views"
          value={stats.pageViews}
          icon={Eye}
          description="All time"
          className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
        />
        <StatCard
          title="Property Views"
          value={stats.propertyViews}
          icon={TrendingUp}
          description="All time"
          className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
        />
        <StatCard
          title="Inquiries"
          value={stats.totalInquiries}
          icon={MessageSquare}
          description="Total leads"
          className="border-border/50 shadow-sm hover:shadow-md transition-shadow"
        />
      </div>

      {/* Quick Actions & Recent Properties */}
      <div className="grid gap-6 lg:grid-cols-2">
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
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-border/50 hover:bg-muted/80 hover:border-primary/30 transition-all h-12">
              <Link to="/dashboard/properties/new">
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center mr-3">
                  <Plus className="h-4 w-4" />
                </div>
                Add New Property
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-border/50 hover:bg-muted/80 hover:border-primary/30 transition-all h-12">
              <Link to="/dashboard/inquiries">
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center mr-3">
                  <MessageSquare className="h-4 w-4" />
                </div>
                View Inquiries
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-border/50 hover:bg-muted/80 hover:border-primary/30 transition-all h-12">
              <Link to="/dashboard/branding">
                <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center mr-3">
                  <Building2 className="h-4 w-4" />
                </div>
                Update Branding
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Properties */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              Recent Properties
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="rounded-lg hover:bg-muted/80">
              <Link to="/dashboard/properties">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentProperties.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-muted/30 border border-dashed border-border/50">
                <Building2 className="mx-auto h-10 w-10 mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">No properties yet</p>
                <Button asChild variant="link" size="sm">
                  <Link to="/dashboard/properties/new">Add your first property</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/20 hover:bg-muted/50 transition-all gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {property.main_image_url ? (
                          <img
                            src={property.main_image_url}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{property.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {property.property_type} • {property.purpose}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-primary sm:text-right flex-shrink-0">
                      {formatPrice(Number(property.price))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Your Page Section */}
      <Card className="border-border/50 shadow-sm border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            Share Your Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Share your property page with clients on WhatsApp, Facebook, or any social media. 
            Just copy the link or click a platform to share instantly!
          </p>
          <ShareSection
            url={`/${company.slug}`}
            title={`${company.name} - Property Listings`}
            description={company.tagline || company.description || `Check out my latest property listings`}
            variant="inline"
          />
        </CardContent>
      </Card>

      {/* Website Health Score */}
      <WebsiteHealthScore company={company} />

      {/* Lead Scoring */}
      <LeadScoring company={company} />
    </div>
  );
};
