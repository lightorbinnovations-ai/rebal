import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Image,
  FileText,
  Share2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Zap,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company, Property } from "@/types/company";

interface WebsiteHealthScoreProps {
  company: Company;
}

interface HealthMetric {
  name: string;
  score: number;
  maxScore: number;
  status: "good" | "warning" | "critical";
  tip: string;
  icon: React.ElementType;
}

export const WebsiteHealthScore = ({ company }: WebsiteHealthScoreProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [analytics, setAnalytics] = useState({ pageViews: 0, propertyViews: 0, inquiries: 0 });
  const [stats, setStats] = useState<any>(null); // Realtor stats
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch properties
        const { data: propertiesData } = await supabase
          .from("properties")
          .select("*")
          .eq("company_id", company.id);

        // Fetch analytics (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: analyticsData } = await supabase
          .from("analytics")
          .select("event_type")
          .eq("company_id", company.id)
          .gte("created_at", thirtyDaysAgo.toISOString());

        // Fetch inquiries count
        const { count: inquiriesCount } = await supabase
          .from("inquiries")
          .select("*", { count: "exact", head: true })
          .eq("company_id", company.id)
          .gte("created_at", thirtyDaysAgo.toISOString());

        // Fetch realtor stats
        const { data: statsData } = await supabase
          .from("realtor_stats")
          .select("*")
          .eq("company_id", company.id)
          .single();

        setProperties((propertiesData || []) as Property[]);
        setAnalytics({
          pageViews: analyticsData?.filter(a => a.event_type === "page_view").length || 0,
          propertyViews: analyticsData?.filter(a => a.event_type === "property_view").length || 0,
          inquiries: inquiriesCount || 0,
        });
        setStats(statsData);
      } catch (error) {
        console.error("Error fetching health data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [company.id]);

  // Calculate metrics
  const calculateMetrics = (): HealthMetric[] => {
    const metrics: HealthMetric[] = [];

    // 1. Profile Completeness (max 25 points)
    let profileScore = 0;
    if (company.name) profileScore += 3;
    if (company.tagline) profileScore += 3;
    if (company.description) profileScore += 3;
    if (company.logo_url) profileScore += 3;
    if (company.hero_image_url) profileScore += 3;
    if (company.services && company.services.length > 0) profileScore += 5; // Services are important
    if (stats) profileScore += 5; // Stats set up

    metrics.push({
      name: "Profile Completeness",
      score: profileScore,
      maxScore: 25,
      status: profileScore >= 20 ? "good" : profileScore >= 10 ? "warning" : "critical",
      tip: profileScore < 25 ? "Add services and track record stats to complete your profile" : "Your profile is complete!",
      icon: FileText,
    });

    // 2. Property Quality (max 25 points)
    let propertyScore = 0;
    const activeProperties = properties.filter(p => p.is_active);
    if (activeProperties.length > 0) propertyScore += 10;
    if (activeProperties.length >= 3) propertyScore += 5;

    const propertiesWithImages = properties.filter(p => p.main_image_url);
    const propertiesWithDescriptions = properties.filter(p => p.description && p.description.length > 50);

    if (propertiesWithImages.length === properties.length && properties.length > 0) propertyScore += 5;
    if (propertiesWithDescriptions.length === properties.length && properties.length > 0) propertyScore += 5;

    metrics.push({
      name: "Property Quality",
      score: propertyScore,
      maxScore: 25,
      status: propertyScore >= 20 ? "good" : propertyScore >= 10 ? "warning" : "critical",
      tip: propertyScore < 25 ? "Add high-quality images and detailed descriptions to all listings" : "Great property content!",
      icon: Image,
    });

    // 3. Visibility & Traffic (max 25 points)
    let visibilityScore = 0;
    if (analytics.pageViews > 0) visibilityScore += 5;
    if (analytics.pageViews >= 10) visibilityScore += 5;
    if (analytics.pageViews >= 50) visibilityScore += 5;
    if (analytics.propertyViews > 0) visibilityScore += 5;
    if (analytics.propertyViews >= 20) visibilityScore += 5;

    metrics.push({
      name: "Traffic & Visibility",
      score: visibilityScore,
      maxScore: 25,
      status: visibilityScore >= 20 ? "good" : visibilityScore >= 10 ? "warning" : "critical",
      tip: visibilityScore < 25 ? "Share your REBAL link on WhatsApp, Facebook, and Twitter to drive traffic" : "Great visibility!",
      icon: Eye,
    });

    // 4. Lead Generation (max 25 points)
    let leadScore = 0;
    if (analytics.inquiries > 0) leadScore += 10;
    if (analytics.inquiries >= 5) leadScore += 10;
    if (analytics.inquiries >= 10) leadScore += 5;

    metrics.push({
      name: "Lead Generation",
      score: leadScore,
      maxScore: 25,
      status: leadScore >= 20 ? "good" : leadScore >= 10 ? "warning" : "critical",
      tip: leadScore < 25 ? "Promote your properties actively to generate more inquiries" : "Excellent lead flow!",
      icon: Target,
    });

    return metrics;
  };

  const metrics = calculateMetrics();
  const totalScore = metrics.reduce((sum, m) => sum + m.score, 0);
  const maxScore = metrics.reduce((sum, m) => sum + m.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getScoreColor = (pct: number) => {
    if (pct >= 75) return "text-green-500";
    if (pct >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (pct: number) => {
    if (pct >= 90) return "Excellent";
    if (pct >= 75) return "Good";
    if (pct >= 50) return "Needs Work";
    return "Critical";
  };

  const getStatusIcon = (status: "good" | "warning" | "critical") => {
    if (status === "good") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "warning") return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-primary/10 to-secondary/5 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Website Health Score
            </CardTitle>
            <CardDescription>
              Optimize your online presence for maximum visibility
            </CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(percentage)}`}>
              {percentage}%
            </div>
            <Badge variant={percentage >= 75 ? "default" : percentage >= 50 ? "secondary" : "destructive"}>
              {getScoreLabel(percentage)}
            </Badge>
          </div>
        </div>
        <Progress value={percentage} className="h-3 mt-4" />
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metric.status === "good" ? "bg-green-500/10" :
                  metric.status === "warning" ? "bg-yellow-500/10" : "bg-red-500/10"
                }`}>
                <metric.icon className={`w-5 h-5 ${metric.status === "good" ? "text-green-500" :
                    metric.status === "warning" ? "text-yellow-500" : "text-red-500"
                  }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {metric.score}/{metric.maxScore}
                    </span>
                    {getStatusIcon(metric.status)}
                  </div>
                </div>
                <Progress
                  value={(metric.score / metric.maxScore) * 100}
                  className="h-1.5"
                />
                {metric.status !== "good" && (
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {metric.tip}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-semibold mb-3">Quick Improvements</h4>
          <div className="grid grid-cols-2 gap-2">
            {!company.logo_url && (
              <Button variant="outline" size="sm" className="justify-start">
                <Image className="w-4 h-4 mr-2" />
                Add Logo
              </Button>
            )}
            {properties.length === 0 && (
              <Button variant="outline" size="sm" className="justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            )}
            <Button variant="outline" size="sm" className="justify-start">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
