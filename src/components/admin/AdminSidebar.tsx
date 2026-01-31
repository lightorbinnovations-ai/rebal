import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  CreditCard,
  Share2,
  BarChart3,
  FileText,
  Bell,
  Settings,
  Shield,
  LogOut,
  Sparkles,
  MessageSquare,
  BadgeCheck,
  Banknote,
  Globe,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const mainNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Properties", url: "/admin/properties", icon: Home },
  { title: "Domains", url: "/admin/domains", icon: Globe },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Referrals", url: "/admin/referrals", icon: Share2 },
  { title: "Withdrawals", url: "/admin/withdrawals", icon: Banknote },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Support", url: "/admin/support", icon: MessageSquare },
  { title: "Verifications", url: "/admin/verifications", icon: BadgeCheck },
];

const managementNavItems = [
  { title: "Content", url: "/admin/content", icon: FileText },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "System Health", url: "/admin/debug", icon: Activity },
];

interface AdminSidebarProps {
  onSignOut: () => void;
}

export function AdminSidebar({ onSignOut }: AdminSidebarProps) {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const isActive = (url: string) => {
    if (url === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(url);
  };

  // Close sidebar on mobile when a nav item is clicked
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="border-b border-border/50 p-4">
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Shield className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-secondary border-2 border-card animate-pulse" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold text-foreground tracking-tight">REBAL</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Super Admin
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="group relative rounded-xl transition-all duration-200 hover:bg-muted/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                  >
                    <Link to={item.url} onClick={handleNavClick} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-muted group-data-[active=true]:bg-primary/20">
                        <item.icon className="h-4 w-4 transition-colors" />
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider px-2">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="group relative rounded-xl transition-all duration-200 hover:bg-muted/80 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-sm"
                  >
                    <Link to={item.url} onClick={handleNavClick} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 transition-colors group-hover:bg-muted group-data-[active=true]:bg-primary/20">
                        <item.icon className="h-4 w-4 transition-colors" />
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          onClick={onSignOut}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="group-data-[collapsible=icon]:hidden font-medium">Sign Out</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
