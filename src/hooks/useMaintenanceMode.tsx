import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceState {
  isMaintenanceMode: boolean;
  isLoading: boolean;
}

export const useMaintenanceMode = () => {
  const [state, setState] = useState<MaintenanceState>({
    isMaintenanceMode: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        if (!error && data) {
          setState({
            isMaintenanceMode: Boolean(data.value),
            isLoading: false,
          });
        } else {
          setState({ isMaintenanceMode: false, isLoading: false });
        }
      } catch {
        setState({ isMaintenanceMode: false, isLoading: false });
      }
    };

    checkMaintenanceMode();

    // Subscribe to changes
    const channel = supabase
      .channel("maintenance-mode")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_settings",
          filter: "key=eq.maintenance_mode",
        },
        (payload) => {
          const newValue = payload.new as { value?: unknown } | null;
          if (newValue && "value" in newValue) {
            setState((prev) => ({
              ...prev,
              isMaintenanceMode: Boolean(newValue.value),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return state;
};
