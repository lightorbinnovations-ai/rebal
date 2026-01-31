import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: {
    search?: string;
    propertyType?: string;
    purpose?: string;
    state?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  last_notified_at: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Checking saved searches for new matching properties...");

    // Get all saved searches with notifications enabled
    const { data: savedSearches, error: searchError } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("email_notifications", true);

    if (searchError) throw searchError;

    if (!savedSearches || savedSearches.length === 0) {
      console.log("No saved searches with notifications enabled");
      return new Response(
        JSON.stringify({ message: "No saved searches with notifications enabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${savedSearches.length} saved searches to check`);
    const notificationsSent: string[] = [];

    for (const search of savedSearches as SavedSearch[]) {
      // Build query for matching properties
      let query = supabase
        .from("properties")
        .select(`
          id, title, property_type, purpose, price, state, city, created_at,
          companies!inner(id, name, slug)
        `)
        .eq("status", "Available")
        .eq("is_active", true);

      // Only get properties created after last notification (or last 24 hours for new searches)
      const lastNotified = search.last_notified_at 
        ? new Date(search.last_notified_at)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      query = query.gt("created_at", lastNotified.toISOString());

      // Apply filters
      if (search.filters.propertyType) {
        query = query.eq("property_type", search.filters.propertyType);
      }
      if (search.filters.purpose) {
        query = query.eq("purpose", search.filters.purpose);
      }
      if (search.filters.state) {
        query = query.eq("state", search.filters.state);
      }
      if (search.filters.city) {
        query = query.eq("city", search.filters.city);
      }
      if (search.filters.minPrice) {
        query = query.gte("price", search.filters.minPrice);
      }
      if (search.filters.maxPrice) {
        query = query.lte("price", search.filters.maxPrice);
      }
      if (search.filters.search) {
        query = query.or(`title.ilike.%${search.filters.search}%,description.ilike.%${search.filters.search}%`);
      }

      const { data: matchingProperties, error: propError } = await query.limit(10);

      if (propError) {
        console.error(`Error fetching properties for search ${search.id}:`, propError);
        continue;
      }

      if (matchingProperties && matchingProperties.length > 0) {
        console.log(`Found ${matchingProperties.length} matching properties for search "${search.name}"`);

        // Create in-app notification
        const propertyTitles = matchingProperties.slice(0, 3).map((p: any) => p.title).join(", ");
        const message = matchingProperties.length === 1
          ? `New property matches "${search.name}": ${propertyTitles}`
          : `${matchingProperties.length} new properties match "${search.name}": ${propertyTitles}${matchingProperties.length > 3 ? "..." : ""}`;

        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: search.user_id,
            type: "saved_search",
            title: `New Properties Match "${search.name}"`,
            message: message,
            metadata: {
              saved_search_id: search.id,
              saved_search_name: search.name,
              property_count: matchingProperties.length,
              property_ids: matchingProperties.map((p: any) => p.id),
              properties_preview: matchingProperties.slice(0, 5).map((p: any) => ({
                id: p.id,
                title: p.title,
                price: p.price,
                location: `${p.city || ""}, ${p.state || ""}`.replace(/^, |, $/g, ""),
              })),
            },
          });

        if (notifError) {
          console.error(`Error creating notification for search ${search.id}:`, notifError);
          continue;
        }

        // Update last_notified_at
        await supabase
          .from("saved_searches")
          .update({ last_notified_at: new Date().toISOString() })
          .eq("id", search.id);

        notificationsSent.push(search.id);
        console.log(`Notification created for saved search: ${search.name}`);
      }
    }

    console.log(`Completed. Notifications sent for ${notificationsSent.length} searches.`);

    return new Response(
      JSON.stringify({ 
        message: "Saved searches checked successfully",
        notificationsSent: notificationsSent.length
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in check-saved-searches:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
