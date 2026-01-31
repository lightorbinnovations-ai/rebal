import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard,
  BarChart3,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";

// Only 4 items + More = 5 total (maximum allowed)
const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Companies", url: "/admin/companies", icon: Building2 },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function AdminBottomNav() {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();

  const isActive = (url: string) => {
    if (url === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 px-1 pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-0 flex-1",
              isActive(item.url) 
                ? "text-primary bg-primary/10" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="text-[10px] font-medium truncate max-w-full">{item.title}</span>
          </Link>
        ))}
        <button
          onClick={() => setOpenMobile(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-0 flex-1 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5 flex-shrink-0" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
