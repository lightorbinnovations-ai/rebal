import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminNotification {
  id: string;
  type: string;
  subject: string;
  recipient: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const useAdminNotifications = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      // Fetch from admin_notifications_log for admin-specific notifications
      const { data, error } = await supabase
        .from("admin_notifications_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error || !data || data.length === 0) {
        if (error) console.error("Error fetching admin notifications:", error);
        // Fallback to fetching recent system events
        await fetchSystemEvents();
        return;
      }

      const mappedData: AdminNotification[] = (data || []).map((item) => ({
        ...item,
        metadata: item.metadata as Record<string, unknown> | null,
      }));

      setNotifications(mappedData);
      // Count pending/unread items (both 'pending' and 'sent' are unread)
      setUnreadCount(data?.filter((n) => n.status === "pending" || n.status === "sent").length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSystemEvents = async () => {
    try {
      // Helper to swallow errors for individual requests so one failure doesn't break the page
      const safeFetch = async <T,>(promise: Promise<{ data: T | null; error: any }>) => {
        try {
          const { data, error } = await promise;
          if (error) throw error;
          return { data: data || [] };
        } catch (err) {
          console.warn("Individual fetch failed:", err);
          return { data: [] }; // Return empty array on failure
        }
      };

      // Fetch recent important events that admin should know about
      const [paymentsRes, ticketsRes, verificationsRes, withdrawalsRes, domainRequestsRes, boostsRes] = await Promise.all([
        safeFetch(supabase
          .from("payments")
          .select("id, amount, status, created_at, company_id")
          .eq("status", "success")
          .order("created_at", { ascending: false })
          .limit(5)),
        safeFetch(supabase
          .from("support_tickets")
          .select("id, subject, status, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(5)),
        safeFetch(supabase
          .from("verification_requests")
          .select("id, status, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5)),
        safeFetch(supabase
          .from("withdrawal_requests")
          .select("id, amount, status, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5)),
        safeFetch(supabase
          .from("domain_requests")
          .select("id, business_name, status, created_at, selected_domain, selected_extension")
          .in("status", ["pending", "pending_payment", "processing"])
          .order("created_at", { ascending: false })
          .limit(5)),
        safeFetch(supabase
          .from("property_boosts")
          .select("id, amount_paid, status, created_at, boost_type")
          .eq("status", "active")
          .eq("boost_type", "paid")
          .order("created_at", { ascending: false })
          .limit(5)),
      ]);

      const events: AdminNotification[] = [];

      // Add payment events
      (paymentsRes.data as any[]).forEach((p: any) => {
        events.push({
          id: `payment-${p.id}`,
          type: "payment",
          subject: `Payment received: ₦${p.amount.toLocaleString()}`,
          recipient: "system",
          status: "success",
          metadata: { payment_id: p.id },
          created_at: p.created_at,
        });
      });

      // Add open support tickets
      (ticketsRes.data as any[]).forEach((t: any) => {
        events.push({
          id: `ticket-${t.id}`,
          type: "support",
          subject: `Open ticket: ${t.subject}`,
          recipient: "admin",
          status: "pending",
          metadata: { ticket_id: t.id },
          created_at: t.created_at,
        });
      });

      // Add pending verifications
      (verificationsRes.data as any[]).forEach((v: any) => {
        events.push({
          id: `verification-${v.id}`,
          type: "verification",
          subject: "Pending verification request",
          recipient: "admin",
          status: "pending",
          metadata: { verification_id: v.id },
          created_at: v.created_at,
        });
      });

      // Add pending withdrawals
      (withdrawalsRes.data as any[]).forEach((w: any) => {
        events.push({
          id: `withdrawal-${w.id}`,
          type: "withdrawal",
          subject: `Withdrawal request: ₦${w.amount.toLocaleString()}`,
          recipient: "admin",
          status: "pending",
          metadata: { withdrawal_id: w.id },
          created_at: w.created_at,
        });
      });

      // Add domain requests
      (domainRequestsRes.data as any[]).forEach((d: any) => {
        const domainName = d.selected_domain && d.selected_extension
          ? `${d.selected_domain}${d.selected_extension}`
          : d.business_name;
        events.push({
          id: `domain-${d.id}`,
          type: "domain",
          subject: `Domain request: ${domainName}`,
          recipient: "admin",
          status: "pending",
          metadata: { domain_request_id: d.id },
          created_at: d.created_at,
        });
      });

      // Add boost payments
      (boostsRes.data as any[]).forEach((b: any) => {
        events.push({
          id: `boost-${b.id}`,
          type: "boost",
          subject: `Property boost: ₦${(b.amount_paid || 0).toLocaleString()}`,
          recipient: "admin",
          status: "success",
          metadata: { boost_id: b.id },
          created_at: b.created_at,
        });
      });

      // Sort by created_at descending
      events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(events.slice(0, 20));
      setUnreadCount(events.filter((e) => e.status === "pending").length);
    } catch (error) {
      console.error("Error fetching system events:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for new events
    const channel = supabase
      .channel("admin-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "payments" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "verification_requests" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "withdrawal_requests" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "domain_requests" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "domain_requests" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "referrals" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "property_boosts" },
        () => fetchNotifications()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "property_boosts" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_admin_notification_read', {
        notification_id: notificationId
      });

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, status: "read" } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch: fetchNotifications,
    markAsRead,
  };
};
