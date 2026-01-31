import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Thermometer, 
  Snowflake, 
  Phone, 
  Mail, 
  MessageSquare,
  Clock,
  Eye,
  Home,
  TrendingUp,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadScoringProps {
  company: Company;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  lead_score: string;
  page_views: number;
  time_spent_seconds: number;
  properties_viewed: number;
  created_at: string;
  last_activity_at: string;
  property?: {
    title: string;
  };
}

export const LeadScoring = ({ company }: LeadScoringProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "hot" | "warm" | "cold">("all");

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data, error } = await supabase
          .from("inquiries")
          .select(`
            id,
            name,
            email,
            phone,
            message,
            lead_score,
            page_views,
            time_spent_seconds,
            properties_viewed,
            created_at,
            last_activity_at,
            properties:property_id (title)
          `)
          .eq("company_id", company.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Calculate lead scores based on engagement
        const scoredLeads = (data || []).map((lead: any) => {
          let score = "cold";
          const pageViews = lead.page_views || 0;
          const timeSpent = lead.time_spent_seconds || 0;
          const propertiesViewed = lead.properties_viewed || 0;

          // Simple scoring logic
          const engagementScore = pageViews * 2 + (timeSpent / 60) + propertiesViewed * 3;
          
          if (engagementScore >= 15 || lead.phone) {
            score = "hot";
          } else if (engagementScore >= 5) {
            score = "warm";
          }

          return {
            ...lead,
            lead_score: score,
            property: lead.properties,
          };
        });

        setLeads(scoredLeads);
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, [company.id]);

  const getScoreBadge = (score: string) => {
    switch (score) {
      case "hot":
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
            <Flame className="w-3 h-3 mr-1" />
            Hot
          </Badge>
        );
      case "warm":
        return (
          <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20">
            <Thermometer className="w-3 h-3 mr-1" />
            Warm
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">
            <Snowflake className="w-3 h-3 mr-1" />
            Cold
          </Badge>
        );
    }
  };

  const filteredLeads = filter === "all" 
    ? leads 
    : leads.filter(lead => lead.lead_score === filter);

  const stats = {
    hot: leads.filter(l => l.lead_score === "hot").length,
    warm: leads.filter(l => l.lead_score === "warm").length,
    cold: leads.filter(l => l.lead_score === "cold").length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Lead Scoring
            </CardTitle>
            <CardDescription>
              Prioritize leads based on engagement level
            </CardDescription>
          </div>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[130px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="hot">🔥 Hot</SelectItem>
              <SelectItem value="warm">🌡️ Warm</SelectItem>
              <SelectItem value="cold">❄️ Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => setFilter("hot")}
            className={`p-3 rounded-lg text-center transition-colors ${
              filter === "hot" ? "bg-red-500/20 ring-2 ring-red-500/50" : "bg-red-500/10 hover:bg-red-500/15"
            }`}
          >
            <Flame className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-500">{stats.hot}</div>
            <div className="text-xs text-muted-foreground">Hot Leads</div>
          </button>
          <button 
            onClick={() => setFilter("warm")}
            className={`p-3 rounded-lg text-center transition-colors ${
              filter === "warm" ? "bg-orange-500/20 ring-2 ring-orange-500/50" : "bg-orange-500/10 hover:bg-orange-500/15"
            }`}
          >
            <Thermometer className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-orange-500">{stats.warm}</div>
            <div className="text-xs text-muted-foreground">Warm Leads</div>
          </button>
          <button 
            onClick={() => setFilter("cold")}
            className={`p-3 rounded-lg text-center transition-colors ${
              filter === "cold" ? "bg-blue-500/20 ring-2 ring-blue-500/50" : "bg-blue-500/10 hover:bg-blue-500/15"
            }`}
          >
            <Snowflake className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-500">{stats.cold}</div>
            <div className="text-xs text-muted-foreground">Cold Leads</div>
          </button>
        </div>

        {/* Leads List */}
        <div className="space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No {filter === "all" ? "" : filter} leads yet</p>
              <p className="text-sm">Leads will appear here as visitors inquire about your properties</p>
            </div>
          ) : (
            filteredLeads.slice(0, 10).map((lead) => (
              <div 
                key={lead.id} 
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{lead.name}</span>
                      {getScoreBadge(lead.lead_score)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground truncate mb-2">
                      {lead.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </span>
                      {lead.property?.title && (
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          {lead.property.title}
                        </span>
                      )}
                      {lead.page_views > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {lead.page_views} views
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {lead.phone && (
                      <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                        <a href={`tel:${lead.phone}`}>
                          <Phone className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="w-4 h-4" />
                      </a>
                    </Button>
                    {lead.phone && (
                      <Button size="icon" variant="outline" className="h-8 w-8 bg-green-500/10 border-green-500/20 hover:bg-green-500/20" asChild>
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                          <MessageSquare className="w-4 h-4 text-green-500" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredLeads.length > 10 && (
          <Button variant="ghost" className="w-full mt-4">
            View All {filteredLeads.length} Leads
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
