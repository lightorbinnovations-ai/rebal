import { useState } from "react";
import { Bell, BellOff, ExternalLink, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSavedSearches, SavedSearch } from "@/hooks/useSavedSearches";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface SavedSearchesListProps {
  onApplySearch?: (filters: SavedSearch["filters"]) => void;
  compact?: boolean;
}

export const SavedSearchesList = ({ onApplySearch, compact = false }: SavedSearchesListProps) => {
  const navigate = useNavigate();
  const { savedSearches, isLoading, updateSearch, deleteSearch } = useSavedSearches();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleApply = (search: SavedSearch) => {
    if (onApplySearch) {
      onApplySearch(search.filters);
    } else {
      // Navigate to properties page with filters as URL params
      const params = new URLSearchParams();
      if (search.filters.search) params.set("search", search.filters.search);
      if (search.filters.propertyType) params.set("type", search.filters.propertyType);
      if (search.filters.purpose) params.set("purpose", search.filters.purpose);
      if (search.filters.state) params.set("state", search.filters.state);
      if (search.filters.city) params.set("city", search.filters.city);
      if (search.filters.minPrice) params.set("minPrice", search.filters.minPrice.toString());
      if (search.filters.maxPrice) params.set("maxPrice", search.filters.maxPrice.toString());
      
      navigate(`/properties?${params.toString()}`);
    }
  };

  const getFilterSummary = (filters: SavedSearch["filters"]) => {
    const parts: string[] = [];
    if (filters.propertyType) parts.push(filters.propertyType);
    if (filters.purpose) parts.push(filters.purpose);
    if (filters.city || filters.state) {
      parts.push(filters.city || filters.state || "");
    }
    return parts.length > 0 ? parts.join(" • ") : "All properties";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (savedSearches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center">
          <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">No saved searches yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Save your search criteria to get notified about new properties
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {savedSearches.slice(0, 5).map((search) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
            onClick={() => handleApply(search)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Search className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{search.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {getFilterSummary(search.filters)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {search.email_notifications && (
                <Bell className="h-3 w-3 text-primary" />
              )}
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ))}
        {savedSearches.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{savedSearches.length - 5} more saved searches
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {savedSearches.map((search) => (
          <Card key={search.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{search.name}</h4>
                    {search.email_notifications && (
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        <Bell className="h-3 w-3 mr-1" />
                        Notifications on
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {getFilterSummary(search.filters)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {search.filters.minPrice && (
                      <Badge variant="outline" className="text-xs">
                        Min: ₦{search.filters.minPrice.toLocaleString()}
                      </Badge>
                    )}
                    {search.filters.maxPrice && (
                      <Badge variant="outline" className="text-xs">
                        Max: ₦{search.filters.maxPrice.toLocaleString()}
                      </Badge>
                    )}
                    {search.filters.search && (
                      <Badge variant="outline" className="text-xs">
                        "{search.filters.search}"
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={search.email_notifications}
                    onCheckedChange={(checked) => 
                      updateSearch(search.id, { email_notifications: checked })
                    }
                    title="Toggle email notifications"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApply(search)}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(search.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete saved search?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this saved search and stop any email notifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteSearch(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
