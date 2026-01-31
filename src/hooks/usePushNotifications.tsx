import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type NotificationPermission = "default" | "granted" | "denied";

interface PushNotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    permission: "default",
    isSupported: false,
    isSubscribed: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    
    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? (Notification.permission as NotificationPermission) : "denied",
    }));
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.log("[Push] Notifications not supported");
      return false;
    }

    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission: permission as NotificationPermission }));
      
      if (permission === "granted") {
        console.log("[Push] Permission granted");
        return true;
      } else {
        console.log("[Push] Permission denied:", permission);
        return false;
      }
    } catch (error) {
      console.error("[Push] Error requesting permission:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [state.isSupported]);

  // Show a local notification (for testing and immediate feedback)
  const showNotification = useCallback(
    async (title: string, options?: NotificationOptions): Promise<boolean> => {
      if (!state.isSupported || state.permission !== "granted") {
        console.log("[Push] Cannot show notification - not permitted");
        return false;
      }

      try {
        // Try to use service worker for notification
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: "/favicon.png",
          badge: "/favicon.png",
          requireInteraction: false,
          ...options,
        });
        return true;
      } catch (error) {
        // Fallback to standard Notification API
        try {
          new Notification(title, {
            icon: "/favicon.png",
            ...options,
          });
          return true;
        } catch (fallbackError) {
          console.error("[Push] Error showing notification:", fallbackError);
          return false;
        }
      }
    },
    [state.isSupported, state.permission]
  );

  // Subscribe to real-time notifications and show push notifications
  const subscribeToNotifications = useCallback(
    async (userId: string, companyId?: string) => {
      if (!state.isSupported || state.permission !== "granted") {
        return () => {};
      }

      // Subscribe to notifications table for this user
      const channel = supabase
        .channel(`push-notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            const notification = payload.new as {
              title: string;
              message: string;
              type: string;
            };

            // Show push notification for new in-app notifications
            await showNotification(notification.title, {
              body: notification.message,
              tag: notification.type,
              data: payload.new,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    [state.isSupported, state.permission, showNotification]
  );

  return {
    ...state,
    isLoading,
    requestPermission,
    showNotification,
    subscribeToNotifications,
  };
};

// Hook specifically for admin push notifications
export const useAdminPushNotifications = () => {
  const { permission, isSupported, isLoading, requestPermission, showNotification } =
    usePushNotifications();

  // Subscribe to admin-relevant events
  const subscribeToAdminEvents = useCallback(async () => {
    if (!isSupported || permission !== "granted") {
      return () => {};
    }

    const channel = supabase
      .channel("admin-push-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "payments" },
        async (payload) => {
          const payment = payload.new as { amount: number; status: string };
          if (payment.status === "success") {
            await showNotification("New Payment Received! 💰", {
              body: `₦${payment.amount.toLocaleString()} payment completed`,
              tag: "payment",
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets" },
        async (payload) => {
          const ticket = payload.new as { subject: string };
          await showNotification("New Support Ticket 🎫", {
            body: ticket.subject,
            tag: "support",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "domain_requests" },
        async (payload) => {
          const request = payload.new as { business_name: string };
          await showNotification("New Domain Request 🌐", {
            body: `${request.business_name} requested a custom domain`,
            tag: "domain",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "withdrawal_requests" },
        async (payload) => {
          const withdrawal = payload.new as { amount: number };
          await showNotification("Withdrawal Request 💸", {
            body: `₦${withdrawal.amount.toLocaleString()} withdrawal requested`,
            tag: "withdrawal",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "verification_requests" },
        async () => {
          await showNotification("Verification Request ✅", {
            body: "New business verification request",
            tag: "verification",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupported, permission, showNotification]);

  return {
    permission,
    isSupported,
    isLoading,
    requestPermission,
    showNotification,
    subscribeToAdminEvents,
  };
};
