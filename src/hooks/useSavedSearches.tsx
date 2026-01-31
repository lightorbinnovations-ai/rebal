import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface SavedSearchFilters {
  search?: string;
  propertyType?: string;
  purpose?: string;
  state?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SavedSearchFilters;
  email_notifications: boolean;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useSavedSearches = () => {
  // This hook is used on the public marketplace (/properties) via SaveSearchButton.
  // It must NOT enforce auth redirects; instead, gracefully behave as "logged out".
  const { user } = useAuth(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedSearches = async () => {
    if (!user) {
      setSavedSearches([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse the filters from JSONB
      const parsedData = (data || []).map(item => ({
        ...item,
        filters: typeof item.filters === 'string' ? JSON.parse(item.filters) : item.filters
      }));
      
      setSavedSearches(parsedData);
    } catch (error: any) {
      console.error("Error fetching saved searches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSearch = async (name: string, filters: SavedSearchFilters, emailNotifications = true) => {
    if (!user) {
      toast.error("Please log in to save searches");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("saved_searches")
        .insert([{
          user_id: user.id,
          name,
          filters: filters as any,
          email_notifications: emailNotifications,
        }])
        .select()
        .single();

      if (error) throw error;

      const parsedData = {
        ...data,
        filters: typeof data.filters === 'string' ? JSON.parse(data.filters) : data.filters
      };

      setSavedSearches(prev => [parsedData, ...prev]);
      toast.success("Search saved successfully!");
      return parsedData;
    } catch (error: any) {
      console.error("Error saving search:", error);
      toast.error("Failed to save search");
      return null;
    }
  };

  const updateSearch = async (id: string, updates: Partial<Pick<SavedSearch, 'name' | 'email_notifications'>>) => {
    try {
      const { error } = await supabase
        .from("saved_searches")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      setSavedSearches(prev => 
        prev.map(search => search.id === id ? { ...search, ...updates } : search)
      );
      toast.success("Search updated!");
    } catch (error: any) {
      console.error("Error updating search:", error);
      toast.error("Failed to update search");
    }
  };

  const deleteSearch = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSavedSearches(prev => prev.filter(search => search.id !== id));
      toast.success("Search deleted");
    } catch (error: any) {
      console.error("Error deleting search:", error);
      toast.error("Failed to delete search");
    }
  };

  useEffect(() => {
    fetchSavedSearches();
  }, [user]);

  return {
    savedSearches,
    isLoading,
    saveSearch,
    updateSearch,
    deleteSearch,
    refetch: fetchSavedSearches,
  };
};
