import { useState, useCallback, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceProperty {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  property_type: string;
  purpose: string;
  state: string | null;
  city: string | null;
  area: string | null;
  main_image_url: string | null;
  features: string[] | null;
  priority_score: number;
  created_at: string;
  company_id: string;
  company_name: string;
  company_slug: string;
  company_logo: string | null;
  company_verified: boolean;
  subscription_tier: string | null;
  total_count: number;
}

export interface MarketplaceFilters {
  property_type?: string;
  purpose?: string;
  state?: string;
  city?: string;
  min_price?: number;
  max_price?: number;
  search_query?: string;
}

const PAGE_SIZE = 20;

export const useMarketplaceProperties = (initialFilters: MarketplaceFilters = {}) => {
  const [filters, setFilters] = useState<MarketplaceFilters>(initialFilters);

  const fetchProperties = async ({ pageParam = 0 }): Promise<{
    properties: MarketplaceProperty[];
    nextPage: number | null;
    totalCount: number;
  }> => {
    const { data, error } = await supabase.rpc("search_public_properties", {
      p_limit: PAGE_SIZE,
      p_offset: pageParam * PAGE_SIZE,
      p_property_type: filters.property_type || null,
      p_purpose: filters.purpose || null,
      p_state: filters.state || null,
      p_city: filters.city || null,
      p_min_price: filters.min_price || null,
      p_max_price: filters.max_price || null,
      p_search_query: filters.search_query || null,
    });

    if (error) throw error;

    const properties = (data || []) as MarketplaceProperty[];
    const totalCount = properties[0]?.total_count || 0;
    const hasMore = (pageParam + 1) * PAGE_SIZE < totalCount;

    return {
      properties,
      nextPage: hasMore ? pageParam + 1 : null,
      totalCount,
    };
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["marketplace-properties", filters],
    queryFn: fetchProperties,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const properties = data?.pages.flatMap((page) => page.properties) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const updateFilters = useCallback((newFilters: Partial<MarketplaceFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Intersection Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  return {
    properties,
    totalCount,
    filters,
    updateFilters,
    clearFilters,
    loadMoreRef,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    hasNextPage,
    refetch,
  };
};
