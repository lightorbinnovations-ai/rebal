import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Circle, 
  Building2, 
  Palette, 
  Image, 
  Share2, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";

interface OnboardingChecklistProps {
  company: Company;
  onDismiss?: () => void;
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export const OnboardingChecklist = ({ company, onDismiss }: OnboardingChecklistProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        // Check if user has properties
        const { count: propertiesCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("company_id", company.id);

        // Build checklist based on actual data
        const hasContactInfo = !!company.phone || !!company.whatsapp || !!company.email;
        const hasDescription = !!company.description && company.description.length > 20;
        const hasSocialLinks = !!company.facebook || !!company.instagram || !!company.twitter || !!company.linkedin;
        
        const items: ChecklistItem[] = [
          {
            id: "contact",
            title: "Add contact information",
            description: "Add phone, WhatsApp or email so clients can reach you",
            icon: Building2,
            completed: hasContactInfo,
            action: { label: "Go to Settings", url: "/dashboard/settings" },
          },
          {
            id: "description",
            title: "Write a business description",
            description: "Tell clients about your services and expertise",
            icon: Building2,
            completed: hasDescription,
            action: { label: "Go to Settings", url: "/dashboard/settings" },
          },
          {
            id: "logo",
            title: "Add your logo",
            description: "Upload your company logo for brand recognition",
            icon: Image,
            completed: !!company.logo_url,
            action: { label: "Go to Branding", url: "/dashboard/branding" },
          },
          {
            id: "colors",
            title: "Customize your colors",
            description: "Set your brand colors to match your business",
            icon: Palette,
            completed: !!company.primary_color,
            action: { label: "Go to Branding", url: "/dashboard/branding" },
          },
          {
            id: "social",
            title: "Add social media links",
            description: "Connect your Facebook, Instagram or other profiles",
            icon: Share2,
            completed: hasSocialLinks,
            action: { label: "Go to Settings", url: "/dashboard/settings" },
          },
          {
            id: "property",
            title: "Add your first property",
            description: "Create your first property listing",
            icon: Building2,
            completed: (propertiesCount || 0) > 0,
            action: { label: "Add Property", url: "/dashboard/properties/new" },
          },
        ];

        setChecklist(items);
      } catch (error) {
        console.error("Failed to check onboarding progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProgress();
  }, [company]);

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isAllComplete = completedCount === totalCount;

  if (isLoading) {
    return null;
  }

  // Don't show if all items are complete
  if (isAllComplete) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Getting Started
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} complete
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Progress value={progressPercent} className="h-2 mt-2" />
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-2">
          <div className="space-y-2">
            {checklist.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  item.completed
                    ? "bg-primary/5 border-primary/20"
                    : "bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "flex-shrink-0",
                  item.completed ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium",
                    item.completed && "line-through text-muted-foreground"
                  )}>
                    {item.title}
                  </p>
                  {!item.completed && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                </div>
                
                {!item.completed && item.action && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 rounded-lg text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Link to={item.action.url}>
                      {item.action.label}
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
