import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/contexts/DashboardContext";

const realtorNavItems = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Properties", url: "/dashboard/properties", icon: Building2 },
  { title: "Inquiries", url: "/dashboard/inquiries", icon: MessageSquare },
  { title: "Referrals", url: "/dashboard/referrals", icon: Users },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const affiliateNavItems = [
  { title: "Home", url: "/dashboard", icon: LayoutDashboard },
  { title: "Referrals", url: "/dashboard/referrals", icon: Users },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export const BottomNavigation = () => {
  const location = useLocation();
  const { company } = useDashboard();
  
  const isAffiliate = company?.account_type === "affiliate";
  const navItems = isAffiliate ? affiliateNavItems : realtorNavItems;

  const isActive = (url: string) => {
    if (url === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 px-1 rounded-lg transition-all duration-200",
                "active:scale-90 active:opacity-70",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-8 rounded-full transition-all duration-200",
                  active && "bg-primary/15 animate-[tap-bounce_0.3s_ease-out]"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    active && "scale-110"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  active && "font-semibold"
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
