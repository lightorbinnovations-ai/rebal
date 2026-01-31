import { ReactNode, useEffect, useState, useCallback } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { GracePeriodWarning } from "./GracePeriodWarning";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { CommandPalette } from "./CommandPalette";
import { BottomNavigation } from "./BottomNavigation";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Company } from "@/types/company";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";
import { NotificationPermissionModal } from "./NotificationPermissionModal";

interface DashboardLayoutProps {
  children: ReactNode;
  user: User | null;
  company: Company | null;
  isDark: boolean;
  toggleTheme: () => void;
  onSignOut: () => void;
  onShowHelp?: () => void;
}

export const DashboardLayout = ({
  children,
  user,
  company,
  isDark,
  toggleTheme,
  onSignOut,
  onShowHelp,
}: DashboardLayoutProps) => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const openCommandPalette = useCallback(() => {
    setShowCommandPalette(true);
  }, []);

  const { isInGracePeriod, gracePeriodEnd, gracePeriodDaysRemaining } = useSubscriptionLimits(company);
  const { shortcuts, showShortcutsDialog, setShowShortcutsDialog, formatShortcut } = useKeyboardShortcuts(true, openCommandPalette);

  const { permission, isSupported, requestPermission, subscribeToNotifications } = usePushNotifications();

  // Notification permission modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Check if we should ask for notification permission
  useEffect(() => {
    // Only ask if supported, default permission (not yet asked), and user hasn't dismissed it this session
    if (isSupported && permission === "default") {
      // Check session storage to avoid pestering the user on every reload if they clicked "Not Now"
      const hasDismissed = sessionStorage.getItem("notification_prompt_dismissed");

      if (!hasDismissed) {
        const timer = setTimeout(() => {
          setShowNotificationModal(true);
        }, 5000); // 5 second delay
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, permission]);

  const handleAllowNotifications = async () => {
    setShowNotificationModal(false);
    const granted = await requestPermission();
    if (granted) {
      toast.success("Notifications enabled", {
        description: "You will now receive alerts for new inquiries and updates.",
      });
    }
  };

  const handleDismissNotifications = () => {
    setShowNotificationModal(false);
    sessionStorage.setItem("notification_prompt_dismissed", "true");
  };

  // Subscribe to user notifications
  useEffect(() => {
    if (permission === "granted" && user?.id) {
      const unsubscribePromise = subscribeToNotifications(user.id, company?.id);
      return () => {
        unsubscribePromise.then((unsub) => unsub());
      };
    }
  }, [permission, user?.id, company?.id, subscribeToNotifications]);

  // Paystack redirects back with ?reference=...; verify on ANY dashboard page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) return;

    (async () => {
      try {
        await supabase.functions.invoke("paystack-verify", {
          body: { reference },
        });
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("reference");
        url.searchParams.delete("trxref");
        window.history.replaceState({}, "", url.toString());
      }
    })();
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30 overflow-x-hidden">
        <DashboardSidebar company={company} onShowHelp={onShowHelp} />
        <SidebarInset className="flex-1 min-w-0">
          <DashboardHeader
            user={user}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onSignOut={onSignOut}
          />
          <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6 overflow-hidden">
            {isInGracePeriod && (
              <div className="mb-6">
                <GracePeriodWarning
                  daysRemaining={gracePeriodDaysRemaining}
                  gracePeriodEnd={gracePeriodEnd}
                />
              </div>
            )}
            {children}
          </main>
        </SidebarInset>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        shortcuts={shortcuts}
        formatShortcut={formatShortcut}
      />

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        company={company}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onSignOut={onSignOut}
        onShowShortcuts={() => {
          setShowCommandPalette(false);
          setTimeout(() => setShowShortcutsDialog(true), 150);
        }}
      />

      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        isOpen={showNotificationModal}
        onClose={handleDismissNotifications}
        onAllow={handleAllowNotifications}
      />
    </SidebarProvider>
  );
};
