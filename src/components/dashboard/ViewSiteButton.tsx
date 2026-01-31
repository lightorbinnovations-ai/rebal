import { ExternalLink, AlertCircle } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import type { Company } from "@/types/company";

interface ViewSiteButtonProps {
  company: Company;
  onNavClick: () => void;
}

export const ViewSiteButton = ({ company, onNavClick }: ViewSiteButtonProps) => {
  const status = useProfileCompletion(company);

  // Site is only viewable when all required fields including tagline and description are complete
  if (!status.isSiteShareable) {
    const missingFields = [...status.missingBasicFields, ...status.missingSiteFields];

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              tooltip="Complete your profile first"
              className="group/item relative rounded-xl transition-all duration-200 hover:bg-muted/80 opacity-60 cursor-not-allowed"
            >
              <div className="flex items-center gap-3 px-3 py-2.5 w-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-medium flex-1 text-muted-foreground">View Site</span>
              </div>
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p className="text-sm">
              Complete your profile to view your site. Missing: {missingFields.join(", ")}.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <SidebarMenuButton
      asChild
      tooltip="View Public Page"
      className="group/item relative rounded-xl transition-all duration-200 hover:bg-secondary/10 hover:text-secondary w-full justify-start"
    >
      <a
        href={`/${company.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavClick}
        className="flex items-center gap-3 px-3 py-2.5 w-full"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 transition-colors group-hover/item:bg-secondary/20">
          <ExternalLink className="h-4 w-4 text-secondary" />
        </div>
        <span className="font-medium flex-1 text-left">View Site</span>
      </a>
    </SidebarMenuButton>
  );
};