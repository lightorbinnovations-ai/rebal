import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { AdminBottomNav } from "./AdminBottomNav";
import { AdminNotificationsDropdown } from "./AdminNotificationsDropdown";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sparkles, Moon, Sun, Bell } from "lucide-react";
import { AdminContentSkeleton } from "@/components/ui/skeletons";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdminPushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { useAdminSession } from "@/hooks/useAdminSession";
import { AdminLockScreen } from "./AdminLockScreen";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  isLoading?: boolean;
  onSignOut: () => void;
}

export function AdminLayout({
  children,
  title,
  description,
  isLoading,
  onSignOut,
}: AdminLayoutProps) {
  const { isDark, toggleTheme } = useTheme();
  const { permission, isSupported, requestPermission, subscribeToAdminEvents } = useAdminPushNotifications();
  const { isLocked, unlockSession } = useAdminSession();

  const [showTimeout, setShowTimeout] = useState(false);

  // Loading timeout failsafe
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setShowTimeout(false);
      timer = setTimeout(() => {
        setShowTimeout(true);
      }, 5000); // Show "Refresh" button after 5 seconds of sticking in loading state
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Request notification permission and subscribe on mount
  useEffect(() => {
    if (isSupported && permission === "default") {
      // Auto-request permission after a short delay
      const timer = setTimeout(() => {
        requestPermission().then((granted) => {
          if (granted) {
            toast.success("Push notifications enabled", {
              description: "You'll receive alerts for important events",
            });
          }
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, requestPermission]);

  // Subscribe to admin events for push notifications
  useEffect(() => {
    if (permission === "granted") {
      const unsubscribe = subscribeToAdminEvents();
      return () => {
        unsubscribe.then((unsub) => unsub?.());
      };
    }
  }, [permission, subscribeToAdminEvents]);

  return (
    <SidebarProvider>
      <div className={`flex min-h-screen w-full bg-muted/30 overflow-x-hidden ${isLocked ? 'blur-sm pointer-events-none select-none overflow-hidden h-screen' : ''}`}>
        <AdminSidebar onSignOut={onSignOut} />
        <SidebarInset className="flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-border/50 bg-background/95 backdrop-blur-xl px-3 sm:px-4 md:px-6">
            <SidebarTrigger className="-ml-1 sm:-ml-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0" />
            <Separator orientation="vertical" className="h-6 flex-shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
                <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Sparkles className="h-3 w-3" />
                  <span className="text-xs font-medium">Admin</span>
                </div>
              </div>
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
              )}
            </div>
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl hover:bg-muted/80 transition-colors h-9 w-9 flex-shrink-0"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {/* Notifications dropdown */}
            <div className="flex-shrink-0">
              <AdminNotificationsDropdown />
            </div>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 pb-20 md:pb-6 overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <AdminContentSkeleton />
                <p className="text-muted-foreground animate-pulse">Loading Admin Dashboard...</p>
                {showTimeout && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onSignOut();
                      window.location.href = '/admin/login';
                    }}
                    className="mt-4"
                  >
                    Taking too long? Refresh Session
                  </Button>
                )}
              </div>
            ) : (
              children
            )}
          </main>
        </SidebarInset>
      </div>
      {/* Bottom Navigation for Mobile */}
      <div className={isLocked ? 'hidden' : 'block'}>
        <AdminBottomNav />
      </div>

      {/* Lock Screen Overlay */}
      {isLocked && <AdminLockScreen onUnlock={unlockSession} />}
    </SidebarProvider>
  );
}
