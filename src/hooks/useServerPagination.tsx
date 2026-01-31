import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ServerPaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
}

export interface UseServerPaginationOptions {
  initialPageSize?: number;
}

export function useServerPagination(options: UseServerPaginationOptions = {}) {
  const { initialPageSize = 10 } = options;
  
  const [state, setState] = useState<ServerPaginationState>({
    currentPage: 1,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 0,
    isLoading: false,
  });

  const setCurrentPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, pageSize: size, currentPage: 1 }));
  }, []);

  const setTotalItems = useCallback((total: number) => {
    setState(prev => ({
      ...prev,
      totalItems: total,
      totalPages: Math.ceil(total / prev.pageSize),
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const resetToFirstPage = useCallback(() => {
    setState(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Calculate range for Supabase query
  const getRange = useCallback(() => {
    const from = (state.currentPage - 1) * state.pageSize;
    const to = from + state.pageSize - 1;
    return { from, to };
  }, [state.currentPage, state.pageSize]);

  return {
    ...state,
    setCurrentPage,
    setPageSize,
    setTotalItems,
    setLoading,
    resetToFirstPage,
    getRange,
  };
}
