import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type TableName = "companies" | "properties" | "payments" | "referrals" | "subscriptions" | "inquiries" | "notifications";

interface UseRealtimeSubscriptionOptions {
  table: TableName;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onChange?: () => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to realtime changes on a Supabase table
 * 
 * @param options Configuration options
 * @param options.table - The table name to subscribe to
 * @param options.onInsert - Callback when a row is inserted
 * @param options.onUpdate - Callback when a row is updated
 * @param options.onDelete - Callback when a row is deleted
 * @param options.onChange - Simple callback for any change (refetch pattern)
 * @param options.enabled - Whether the subscription is enabled (default: true)
 */
export const useRealtimeSubscription = ({
  table,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeSubscriptionOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${Math.random().toString(36).slice(2)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        (payload) => {
          // Call the general onChange handler for any event
          onChange?.();

          // Call specific handlers based on event type
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload);
              break;
            case "UPDATE":
              onUpdate?.(payload);
              break;
            case "DELETE":
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, enabled, onInsert, onUpdate, onDelete, onChange]);

  return channelRef.current;
};
