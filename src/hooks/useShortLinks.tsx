import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShortLink {
  id: string;
  short_code: string;
  full_path: string;
  company_id: string;
  property_id: string | null;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export const useShortLinks = (companyId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch all short links for a company
  const {
    data: shortLinks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["short-links", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from("short_links")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ShortLink[];
    },
    enabled: !!companyId,
  });

  // Check if a custom code is available
  const checkCodeAvailability = async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("short_links")
      .select("id")
      .eq("short_code", code)
      .maybeSingle();
    
    if (error) throw error;
    return !data; // Available if no data found
  };

  // Create a new short link
  const createShortLink = useMutation({
    mutationFn: async ({
      fullPath,
      propertyId,
      customCode,
    }: {
      fullPath: string;
      propertyId?: string;
      customCode?: string;
    }) => {
      if (!companyId) throw new Error("Company ID is required");

      let shortCode: string;

      if (customCode) {
        // Use custom code - validate it first
        const isAvailable = await checkCodeAvailability(customCode);
        if (!isAvailable) {
          throw new Error("This short code is already taken");
        }
        shortCode = customCode;
      } else {
        // Generate short code using database function
        const { data: generatedCode, error: codeError } = await supabase.rpc(
          "generate_short_code"
        );
        if (codeError) throw codeError;
        shortCode = generatedCode;
      }

      const { data, error } = await supabase
        .from("short_links")
        .insert({
          short_code: shortCode,
          full_path: fullPath,
          company_id: companyId,
          property_id: propertyId || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("This short code is already taken");
        }
        throw error;
      }
      return data as ShortLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["short-links", companyId] });
      toast.success("Short link created!");
    },
    onError: (error: Error) => {
      toast.error("Failed to create short link", { description: error.message });
    },
  });

  // Delete a short link
  const deleteShortLink = useMutation({
    mutationFn: async (shortLinkId: string) => {
      const { error } = await supabase
        .from("short_links")
        .delete()
        .eq("id", shortLinkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["short-links", companyId] });
      toast.success("Short link deleted!");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete short link", { description: error.message });
    },
  });

  // Get or create short link for a property
  const getOrCreatePropertyLink = async (
    propertyId: string,
    fullPath: string
  ): Promise<ShortLink> => {
    // Check if link already exists
    const existing = shortLinks.find((link) => link.property_id === propertyId);
    if (existing) return existing;

    // Create new link
    const result = await createShortLink.mutateAsync({
      fullPath,
      propertyId,
    });

    return result;
  };

  return {
    shortLinks,
    isLoading,
    error,
    createShortLink,
    deleteShortLink,
    getOrCreatePropertyLink,
    checkCodeAvailability,
    isCreating: createShortLink.isPending,
  };
};

// Hook for resolving a short link (public)
export const useResolveShortLink = (shortCode: string | undefined) => {
  return useQuery({
    queryKey: ["resolve-short-link", shortCode],
    queryFn: async () => {
      if (!shortCode) return null;

      // Use RPC to increment click count and get full path
      const { data, error } = await supabase.rpc("increment_short_link_click", {
        p_short_code: shortCode,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      return data[0].full_path as string;
    },
    enabled: !!shortCode,
    retry: false,
  });
};
