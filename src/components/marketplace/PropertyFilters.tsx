import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { MarketplaceFilters } from "@/hooks/useMarketplaceProperties";
import { NIGERIAN_STATES, getCities } from "@/lib/nigerianLocations";
import { SaveSearchButton } from "./SaveSearchButton";

interface PropertyFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: Partial<MarketplaceFilters>) => void;
  onClearFilters: () => void;
  totalCount: number;
}

const PROPERTY_TYPES = [
  "Land",
  "House",
  "Apartment",
  "Duplex",
  "Commercial",
  "Office",
  "Warehouse",
  "Shop",
];

const PURPOSES = ["Sale", "Rent", "Lease", "Shortlet"];

export const PropertyFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  totalCount,
}: PropertyFiltersProps) => {
  const [searchInput, setSearchInput] = useState(filters.search_query || "");
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && v !== ""
  ).length;

  const handleSearch = () => {
    onFiltersChange({ search_query: searchInput || undefined });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const cities = filters.state ? getCities(filters.state) : [];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Properties</SheetTitle>
              <SheetDescription>
                Narrow down your property search
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Property Type */}
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select
                  value={filters.property_type || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      property_type: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {PROPERTY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Select
                  value={filters.purpose || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      purpose: value === "all" ? undefined : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Purposes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Purposes</SelectItem>
                    {PURPOSES.map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>
                        For {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label>State</Label>
                <Select
                  value={filters.state || "all"}
                  onValueChange={(value) =>
                    onFiltersChange({
                      state: value === "all" ? undefined : value,
                      city: undefined, // Reset city when state changes
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {NIGERIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              {filters.state && cities.length > 0 && (
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={filters.city || "all"}
                    onValueChange={(value) =>
                      onFiltersChange({
                        city: value === "all" ? undefined : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={filters.min_price || ""}
                    onChange={(e) =>
                      onFiltersChange({
                        min_price: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={filters.max_price || ""}
                    onChange={(e) =>
                      onFiltersChange({
                        max_price: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onClearFilters();
                    setSearchInput("");
                  }}
                >
                  Clear All
                </Button>
                <Button className="flex-1" onClick={() => setIsOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.property_type && (
            <Badge variant="secondary" className="gap-1">
              {filters.property_type}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ property_type: undefined })}
              />
            </Badge>
          )}
          {filters.purpose && (
            <Badge variant="secondary" className="gap-1">
              For {filters.purpose}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ purpose: undefined })}
              />
            </Badge>
          )}
          {filters.state && (
            <Badge variant="secondary" className="gap-1">
              {filters.state}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ state: undefined, city: undefined })}
              />
            </Badge>
          )}
          {filters.city && (
            <Badge variant="secondary" className="gap-1">
              {filters.city}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ city: undefined })}
              />
            </Badge>
          )}
          {(filters.min_price || filters.max_price) && (
            <Badge variant="secondary" className="gap-1">
              ₦{filters.min_price?.toLocaleString() || "0"} - ₦
              {filters.max_price?.toLocaleString() || "∞"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  onFiltersChange({ min_price: undefined, max_price: undefined })
                }
              />
            </Badge>
          )}
          {filters.search_query && (
            <Badge variant="secondary" className="gap-1">
              "{filters.search_query}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => {
                  onFiltersChange({ search_query: undefined });
                  setSearchInput("");
                }}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count and Save Search */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {totalCount.toLocaleString()} {totalCount === 1 ? "property" : "properties"}
        </p>
        <SaveSearchButton 
          filters={{
            search: filters.search_query,
            propertyType: filters.property_type,
            purpose: filters.purpose,
            state: filters.state,
            city: filters.city,
            minPrice: filters.min_price,
            maxPrice: filters.max_price,
          }} 
        />
      </div>
    </div>
  );
};
