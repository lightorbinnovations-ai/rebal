import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PropertyFilters } from "@/components/marketplace/PropertyFilters";
import { MarketplacePropertyCard } from "@/components/marketplace/MarketplacePropertyCard";
import { useMarketplaceProperties } from "@/hooks/useMarketplaceProperties";
import { useSEO } from "@/hooks/useSEO";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Loader2 } from "lucide-react";
import { SEOStructuredData, getBreadcrumbSchema } from "@/components/SEOStructuredData";
import { BASE_URL } from "@/lib/constants";

const PropertiesPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read all filter params from URL
  const urlFilters = {
    search_query: searchParams.get("search") || undefined,
    state: searchParams.get("state") || undefined,
    city: searchParams.get("city") || undefined,
    property_type: searchParams.get("type") || undefined,
    purpose: searchParams.get("purpose") || undefined,
    min_price: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    max_price: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
  };

  // Clean undefined values
  const initialFilters = Object.fromEntries(
    Object.entries(urlFilters).filter(([_, v]) => v !== undefined)
  );

  useSEO({
    title: "Browse Properties | REBAL - Nigeria's Premier Property Marketplace",
    description:
      "Discover thousands of properties for sale and rent across Nigeria. Find your perfect home, land, or commercial space with verified listings from trusted agents.",
    keywords: [
      "properties for sale Nigeria",
      "houses for rent Lagos",
      "land for sale Abuja",
      "real estate Nigeria",
      "property marketplace",
      "homes for sale Nigeria",
      "apartments Lagos",
      "commercial property Nigeria",
    ],
    url: "/properties",
  });

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: BASE_URL },
    { name: "Properties", url: `${BASE_URL}/properties` },
  ]);

  const {
    properties,
    totalCount,
    filters,
    updateFilters,
    clearFilters: clearAllFilters,
    loadMoreRef,
    isLoading,
    isFetchingNextPage,
    isError,
    hasNextPage,
  } = useMarketplaceProperties(initialFilters);

  // Sync URL params to filters on mount and when URL changes
  useEffect(() => {
    const hasUrlFilters = Object.keys(initialFilters).length > 0;
    if (hasUrlFilters) {
      updateFilters(initialFilters);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear URL param when filters are cleared
  const handleClearFilters = () => {
    clearAllFilters();
    // Clear all URL params
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Structured Data for SEO */}
      <SEOStructuredData data={breadcrumbData} />

      <Navbar isDark={isDark} toggleTheme={toggleTheme} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-24 md:pt-28 pb-12 md:pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Find Your Perfect Property
              </h1>
              <p className="text-lg text-muted-foreground">
                Browse thousands of verified listings from trusted agents across Nigeria
              </p>
            </div>

            {/* Filters */}
            <div className="max-w-4xl mx-auto">
              <PropertyFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onClearFilters={handleClearFilters}
                totalCount={totalCount}
              />
            </div>
          </div>
        </section>

        {/* Properties Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[4/3] rounded-lg" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">
                  Failed to load properties. Please try again.
                </p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-16">
                <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No properties found
                </h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={handleClearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {properties.map((property) => (
                    <MarketplacePropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Infinite Scroll Trigger */}
                {hasNextPage && (
                  <div
                    ref={loadMoreRef}
                    className="flex justify-center py-8"
                  >
                    {isFetchingNextPage && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading more properties...
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PropertiesPage;
