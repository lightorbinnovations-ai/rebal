import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Company } from "@/types/company";

interface CompanyState {
  company: Company | null;
  isLoading: boolean;
  error: string | null;
}

export const useCompany = (userId: string | undefined) => {
  const [state, setState] = useState<CompanyState>({
    company: null,
    isLoading: true,
    error: null,
  });
  
  // Track if we've fetched for the current userId
  const fetchedForUserRef = useRef<string | null>(null);

  const fetchCompany = useCallback(async (id: string, force: boolean = false) => {
    // Prevent duplicate fetches for the same user (unless forced)
    if (fetchedForUserRef.current === id && !force) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", id)
        .maybeSingle();

      if (error) throw error;

      fetchedForUserRef.current = id;
      setState({
        company: data as Company | null,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error("Error fetching company:", err.message);
      setState({
        company: null,
        isLoading: false,
        error: err.message,
      });
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCompany(userId);
    } else {
      // Reset state when userId is undefined (logged out)
      fetchedForUserRef.current = null;
      setState({ company: null, isLoading: false, error: null });
    }
  }, [userId, fetchCompany]);

  // Refetch function that can be called externally
  const refetch = useCallback(() => {
    if (userId) {
      fetchCompany(userId, true); // Force refetch
    }
  }, [userId, fetchCompany]);

  return {
    ...state,
    refetch,
  };
}