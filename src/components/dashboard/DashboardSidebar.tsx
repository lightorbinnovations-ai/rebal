import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  BarChart3,
  Palette,
  Settings,
  ChevronLeft,
  Users,
  Sparkles,
  HelpCircle,
  BookOpen,
  Link2,
  Heart,
  Globe,
  Download,
} from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { ViewSiteButton } from "./ViewSiteButton";
import type { Company } from "@/types/company";
import { toast } from "sonner";

interface DashboardSidebarProps {
  company: Company | null;
  onShowHelp?: () => void;
}

// Detect if user is on Mac for shortcut display
const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const modKey = isMac ? "⌘" : "Ctrl";
const shiftKey = isMac ? "⇧" : "Shift";

// Items that require full realtor account
const realtorOnlyItems = new Set(["Properties", "Links", "Inquiries", "Analytics", "Branding", "Domain", "Saved"]);

const mainNavItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard, shortcut: `${modKey}+${shiftKey}+D` },
  { title: "Properties", url: "/dashboard/properties", icon: Building2, shortcut: `${modKey}+${shiftKey}+P` },
  { title: "Links", url: "/dashboard/links", icon: Link2, shortcut: `${modKey}+${shiftKey}+L` },
  { title: "Inquiries", url: "/dashboard/inquiries", icon: MessageSquare, shortcut: `${modKey}+${shiftKey}+I` },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, shortcut: `${modKey}+${shiftKey}+A` },
  { title: "Referrals", url: "/dashboard/referrals", icon: Users },
  { title: "Saved", url: "/dashboard/saved-searches", icon: Heart },
];

const settingsNavItems = [
  { title: "Branding", url: "/dashboard/branding", icon: Palette, shortcut: `${modKey}+${shiftKey}+B` },
  { title: "Domain", url: "/dashboard/domain", icon: Globe },
  { title: "Settings", url: "/dashboard/settings", icon: Settings, shortcut: `${modKey}+,` },
];

export const DashboardSidebar = ({ company, onShowHelp }: DashboardSidebarProps) => {
  const location = useLocation();
  const { state, toggleSidebar, setOpenMobile } = useSidebar();
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const { isInstallable, promptInstall } = useInstallPrompt();
  // Force show in development for visual verification
  const showInstall = isInstallable || import.meta.env.MODE === 'development';

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(url);
  };

  // Close sidebar on mobile when a nav item is clicked
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Filter nav items based on account type
  const isAffiliate = company?.account_type === "affiliate";

  const filteredMainNav = isAffiliate
    ? mainNavItems.filter(item => !realtorOnlyItems.has(item.title))
    : mainNavItems;

  const filteredSettingsNav = isAffiliate
    ? settingsNavItems.filter(item => !realtorOnlyItems.has(item.title))
    : settingsNavItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                <span className="text-sm font-bold">R</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground tracking-tight">REBAL</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Dashboard
                </span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isCollapsed && "rotate-180"
              )}
            />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.shortcut ? `${item.title} (${item.shortcut})` : item.title}
                    className="group/item relative rounded-xl transition-all duration-200 hover:bg-muted/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                  >
                    <Link to={item.url} onClick={handleNavClick} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover/item:bg-muted group-data-[active=true]/item:bg-primary/20">
                        <item.icon className="h-4 w-4 transition-colors" />
                      </div>
                      <span className="font-medium flex-1">{item.title}</span>
                      {item.shortcut && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] font-mono px-1.5 py-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 bg-muted/80"
                        >
                          {item.shortcut}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredSettingsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.shortcut ? `${item.title} (${item.shortcut})` : item.title}
                    className="group/item relative rounded-xl transition-all duration-200 hover:bg-muted/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                  >
                    <Link to={item.url} onClick={handleNavClick} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover/item:bg-muted group-data-[active=true]/item:bg-primary/20">
                        <item.icon className="h-4 w-4 transition-colors" />
                      </div>
                      <span className="font-medium flex-1">{item.title}</span>
                      {item.shortcut && (
                        <Badge
                          variant="secondary"
                          className="ml-auto text-[10px] font-mono px-1.5 py-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200 bg-muted/80"
                        >
                          {item.shortcut}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-border/50">
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Documentation link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard/help")}
                  tooltip="Documentation"
                  className="group/item relative rounded-xl transition-all duration-200 hover:bg-muted/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm w-full justify-start"
                >
                  <Link to="/dashboard/help" onClick={handleNavClick} className="flex items-center gap-3 px-3 py-2.5 w-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover/item:bg-muted group-data-[active=true]/item:bg-primary/20">
                      <BookOpen className="h-4 w-4 transition-colors" />
                    </div>
                    <span className="font-medium flex-1 text-left">Docs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Help button - opens tour modal */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Replay Tour"
                  onClick={onShowHelp}
                  className="group/item relative rounded-xl transition-all duration-200 hover:bg-muted/80 cursor-pointer w-full justify-start"
                >
                  <button onClick={onShowHelp} className="flex items-center gap-3 px-3 py-2.5 w-full text-left">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover/item:bg-muted">
                      <HelpCircle className="h-4 w-4 transition-colors" />
                    </div>
                    <span className="font-medium flex-1 text-left">Tour</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* View Public Page - only when company exists and profile is complete */}
              {company && (
                <SidebarMenuItem>
                  <ViewSiteButton company={company} onNavClick={handleNavClick} />
                </SidebarMenuItem>
              )}

              {/* Install App Button - Only when installable */}
              {showInstall && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Install App"
                    className="group/item relative rounded-xl transition-all duration-200 hover:bg-muted/80 cursor-pointer w-full justify-start text-primary"
                  >
                    <button
                      onClick={isInstallable ? promptInstall : () => toast.info("Preview Mode", { description: "In production, this button only appears on installable devices (Chrome/Android)." })}
                      className="flex items-center gap-3 px-3 py-2.5 w-full text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover/item:bg-primary/20">
                        <Download className="h-4 w-4 transition-colors text-primary" />
                      </div>
                      <span className="font-medium flex-1 text-left">Install App</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
};
