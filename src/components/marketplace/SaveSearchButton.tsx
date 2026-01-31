import { useState } from "react";
import { Bell, BellOff, Heart, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useSavedSearches, SavedSearchFilters } from "@/hooks/useSavedSearches";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SaveSearchButtonProps {
  filters: SavedSearchFilters;
  className?: string;
}

export const SaveSearchButton = ({ filters, className }: SaveSearchButtonProps) => {
  const { user } = useAuth(false);
  const { saveSearch } = useSavedSearches();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const hasFilters = Object.values(filters).some(v => v !== undefined && v !== "" && v !== null);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for this search");
      return;
    }

    setIsSaving(true);
    const result = await saveSearch(name.trim(), filters, emailNotifications);
    setIsSaving(false);

    if (result) {
      setIsOpen(false);
      setName("");
      setEmailNotifications(true);
    }
  };

  const generateDefaultName = () => {
    const parts: string[] = [];
    if (filters.propertyType) parts.push(filters.propertyType);
    if (filters.purpose) parts.push(`for ${filters.purpose}`);
    if (filters.city || filters.state) {
      parts.push(`in ${filters.city || filters.state}`);
    }
    return parts.length > 0 ? parts.join(" ") : "My Search";
  };

  const handleOpen = () => {
    if (!user) {
      toast.error("Please log in to save searches");
      return;
    }
    if (!hasFilters) {
      toast.error("Please add some filters first");
      return;
    }
    setName(generateDefaultName());
    setIsOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className={className}
        disabled={!hasFilters}
      >
        <Heart className="h-4 w-4 mr-2" />
        Save Search
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-primary" />
              Save This Search
            </DialogTitle>
            <DialogDescription>
              Save your search criteria and get notified in-app when new matching properties are listed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 3 Bedroom in Lekki"
                className="h-11"
              />
            </div>

            {/* Display current filters */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
              <p className="font-medium text-foreground mb-2">Current Filters:</p>
              {filters.search && (
                <p className="text-muted-foreground">Search: "{filters.search}"</p>
              )}
              {filters.propertyType && (
                <p className="text-muted-foreground">Type: {filters.propertyType}</p>
              )}
              {filters.purpose && (
                <p className="text-muted-foreground">Purpose: {filters.purpose}</p>
              )}
              {(filters.state || filters.city) && (
                <p className="text-muted-foreground">
                  Location: {[filters.city, filters.state].filter(Boolean).join(", ")}
                </p>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <p className="text-muted-foreground">
                  Price: ₦{filters.minPrice?.toLocaleString() || "0"} - ₦{filters.maxPrice?.toLocaleString() || "∞"}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                {emailNotifications ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium text-sm">In-App Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when new properties match
                  </p>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Search"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
