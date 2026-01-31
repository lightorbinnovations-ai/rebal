import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Property } from "@/types/company";
import { PropertyCard } from "./PropertyCard";
import { PropertyListItem } from "./PropertyListItem";
import { Building, Filter, ChevronLeft, ChevronRight, ArrowUpDown, LayoutGrid, List } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

interface PropertiesSectionProps {
  properties: Property[];
  companySlug: string;
}

const propertyTypes = ["All", "Land", "Apartment", "Duplex", "House", "Commercial"];
const purposes = ["All", "Sale", "Rent"];
const ITEMS_PER_PAGE = 9;
const VIEW_MODE_KEY = "rebal-properties-view-mode";

type SortOption = "newest" | "oldest" | "price-low" | "price-high";
type ViewMode = "grid" | "list";

const getStoredViewMode = (): ViewMode => {
  if (typeof window === "undefined") return "grid";
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  return stored === "list" ? "list" : "grid";
};

export const PropertiesSection = ({ properties, companySlug }: PropertiesSectionProps) => {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedPurpose, setSelectedPurpose] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>(getStoredViewMode);
  const [currentPage, setCurrentPage] = useState(1);

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  // Calculate counts for each filter option based ONLY on the properties prop (company-specific)
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    // Initialize all property types with 0
    propertyTypes.forEach(type => {
      counts[type] = 0;
    });
    // Set "All" to total count
    counts["All"] = properties.length;
    // Count properties by type
    properties.forEach((p) => {
      if (counts[p.property_type] !== undefined) {
        counts[p.property_type] += 1;
      } else {
        counts[p.property_type] = 1;
      }
    });
    return counts;
  }, [properties]);

  const purposeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    // Initialize all purposes with 0
    purposes.forEach(purpose => {
      counts[purpose === "All" ? "All" : purpose] = 0;
    });
    // Set "All" to total count  
    counts["All"] = properties.length;
    // Count properties by purpose
    properties.forEach((p) => {
      if (counts[p.purpose] !== undefined) {
        counts[p.purpose] += 1;
      } else {
        counts[p.purpose] = 1;
      }
    });
    return counts;
  }, [properties]);

  // Filter and sort properties
  const filteredAndSortedProperties = useMemo(() => {
    let result = properties.filter((property) => {
      const typeMatch = selectedType === "All" || property.property_type === selectedType;
      const purposeMatch = selectedPurpose === "All" || property.purpose === selectedPurpose;
      return typeMatch && purposeMatch;
    });

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result = [...result].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        result = [...result].sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [properties, selectedType, selectedPurpose, sortBy]);

  // Reset to page 1 when filters change
  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  const handlePurposeChange = (purpose: string) => {
    setSelectedPurpose(purpose);
    setCurrentPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedProperties.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProperties = filteredAndSortedProperties.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <section id="properties" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Building className="h-4 w-4" />
            Our Properties
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Available Properties
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Browse our collection of premium properties available for sale and rent.
            {filteredAndSortedProperties.length > 0 && (
              <span className="block mt-2 text-sm">
                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredAndSortedProperties.length)} of {filteredAndSortedProperties.length} properties
              </span>
            )}
          </p>
        </ScrollReveal>

        {/* Filters & Sorting */}
        <ScrollReveal delay={100} className="space-y-4 mb-12">
          {/* Type Filter */}
          <div className="flex flex-wrap justify-center items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {propertyTypes.map((type) => {
              const count = typeCounts[type] || 0;
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTypeChange(type)}
                  className={`gap-1.5 ${selectedType === type
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90"
                      : ""
                    }`}
                >
                  {type}
                  <Badge
                    variant={selectedType === type ? "secondary" : "outline"}
                    className={`ml-1 h-5 min-w-[20px] px-1.5 text-xs ${selectedType === type
                        ? "bg-primary-foreground text-primary dark:bg-secondary-foreground dark:text-secondary"
                        : ""
                      }`}
                  >
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Purpose Filter, Sort & View Toggle */}
          <div className="flex flex-wrap justify-center items-center gap-4">
            <div className="flex gap-2">
              {purposes.map((purpose) => {
                const count = purposeCounts[purpose] || 0;
                return (
                  <Button
                    key={purpose}
                    variant={selectedPurpose === purpose ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handlePurposeChange(purpose)}
                    className={`gap-1.5 ${selectedPurpose === purpose
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90"
                        : ""
                      }`}
                  >
                    {purpose === "All" ? "All Purposes" : `For ${purpose}`}
                    <Badge
                      variant="outline"
                      className={`ml-1 h-5 min-w-[20px] px-1.5 text-xs ${selectedPurpose === purpose
                          ? "bg-primary-foreground/20 text-primary-foreground dark:bg-secondary-foreground/20 dark:text-secondary-foreground border-transparent"
                          : ""
                        }`}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(v) => handleSortChange(v as SortOption)}>
                <SelectTrigger className="w-[160px] h-9 bg-background">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Toggle */}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as ViewMode)}
              className="border rounded-md"
            >
              <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </ScrollReveal>

        {/* Properties Grid/List */}
        {paginatedProperties.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedProperties.map((property, index) => (
                  <ScrollReveal key={property.id} delay={index * 100}>
                    <PropertyCard
                      property={property}
                      companySlug={companySlug}
                    />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {paginatedProperties.map((property, index) => (
                  <ScrollReveal key={property.id} delay={index * 50}>
                    <PropertyListItem
                      property={property}
                      companySlug={companySlug}
                    />
                  </ScrollReveal>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    typeof page === "number" ? (
                      <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageClick(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={index} className="px-2 text-muted-foreground">
                        {page}
                      </span>
                    )
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <ScrollReveal className="text-center py-16">
            <Building className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No properties found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later for new listings.
            </p>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
};