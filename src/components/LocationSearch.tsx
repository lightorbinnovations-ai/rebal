import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  MapPin, 
  Home, 
  Banknote, 
  SlidersHorizontal,
  X,
  Building2
} from "lucide-react";
import { 
  getStates, 
  getCities, 
  getAreas, 
  PRICE_RANGES, 
  PROPERTY_TYPES,
  PROPERTY_PURPOSES 
} from "@/lib/nigerianLocations";
import { useNavigate } from "react-router-dom";

interface SearchFilters {
  state: string;
  city: string;
  area: string;
  propertyType: string;
  purpose: string;
  priceRange: string;
  keyword: string;
}

export const LocationSearch = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    state: "",
    city: "",
    area: "",
    propertyType: "",
    purpose: "",
    priceRange: "",
    keyword: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const popularSearches = [
    "Lekki Phase 1",
    "Victoria Island",
    "Ikoyi",
    "Maitama",
    "Port Harcourt GRA",
  ];

  const states = getStates();
  const cities = filters.state ? getCities(filters.state) : [];
  const areas = filters.state && filters.city ? getAreas(filters.state, filters.city) : [];

  const handleSearch = () => {
    // Build query params from filters
    const params = new URLSearchParams();
    
    if (filters.keyword) {
      params.set("search", filters.keyword);
    }
    if (filters.state) {
      params.set("state", filters.state);
    }
    if (filters.city) {
      params.set("city", filters.city);
    }
    if (filters.propertyType) {
      params.set("type", filters.propertyType);
    }
    if (filters.purpose) {
      params.set("purpose", filters.purpose);
    }
    if (filters.priceRange) {
      const range = PRICE_RANGES.find(r => r.label === filters.priceRange);
      if (range) {
        params.set("minPrice", range.min.toString());
        if (range.max !== Infinity) {
          params.set("maxPrice", range.max.toString());
        }
      }
    }

    const queryString = params.toString();
    navigate(`/properties${queryString ? `?${queryString}` : ""}`);
  };

  const clearFilters = () => {
    setFilters({
      state: "",
      city: "",
      area: "",
      propertyType: "",
      purpose: "",
      priceRange: "",
      keyword: "",
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-extrabold font-heading text-foreground mb-4">
            Find Properties <span className="text-gradient">Anywhere in Nigeria</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Search by state, city, or area to find your perfect property
          </p>
        </div>

        {/* Main Search Card */}
        <Card className="max-w-4xl mx-auto p-6 shadow-lg">
          {/* Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select
              value={filters.state}
              onValueChange={(value) => setFilters({ ...filters, state: value, city: "", area: "" })}
            >
              <SelectTrigger>
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.city}
              onValueChange={(value) => setFilters({ ...filters, city: value, area: "" })}
              disabled={!filters.state}
            >
              <SelectTrigger>
                <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.area}
              onValueChange={(value) => setFilters({ ...filters, area: value })}
              disabled={!filters.city}
            >
              <SelectTrigger>
                <Home className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Select Area" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.priceRange}
              onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
            >
              <SelectTrigger>
                <Banknote className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((range) => (
                  <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-muted-foreground"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showAdvanced ? "Hide" : "More"} Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">{activeFiltersCount}</Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
              <Select
                value={filters.propertyType}
                onValueChange={(value) => setFilters({ ...filters, propertyType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.purpose}
                onValueChange={(value) => setFilters({ ...filters, purpose: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Purpose" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_PURPOSES.map((purpose) => (
                    <SelectItem key={purpose.value} value={purpose.value}>{purpose.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Keyword (e.g., pool, garden)"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              />
            </div>
          )}

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            className="w-full h-12 text-lg font-semibold"
          >
            <Search className="w-5 h-5 mr-2" />
            Search Properties
          </Button>

          {/* Popular Searches */}
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-2">Popular searches:</p>
            <div className="flex flex-wrap gap-2">
              {popularSearches.map((search, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setFilters({ ...filters, keyword: search })}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
