import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowRight, Clock } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

interface RecentlyViewedProps {
  companySlug: string;
  currentPropertyId?: string;
}

export const RecentlyViewed = ({ companySlug, currentPropertyId }: RecentlyViewedProps) => {
  const { recentlyViewed } = useRecentlyViewed(companySlug); // Passed companySlug for correct filtering
  // Filter out current property and limit to recent 3 unique ones
  // We don't need to filter by company again since the hook handles it
  const recentProperties = recentlyViewed
    .filter(p => p.id !== currentPropertyId)
    .slice(0, 3);

  if (recentProperties.length === 0) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className="py-8 border-t border-border/50">
      <ScrollReveal>
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-heading">Recently Viewed</h2>
            <p className="text-muted-foreground text-sm">Pick up where you left off</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProperties.map((property, index) => (
            <ScrollReveal key={property.id} delay={index * 100}>
              <Link to={`/${companySlug}/property/${property.slug}`}>
                <Card className="h-full group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden bg-card hover:-translate-y-1">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <OptimizedImage
                      src={property.main_image_url}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <Badge variant="secondary" className="backdrop-blur-md bg-white/90 text-black shadow-sm">
                        {property.property_type}
                      </Badge>
                      <Badge
                        variant="default"
                        className={`${property.purpose.toLowerCase().includes("sale")
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-blue-500 hover:bg-blue-600"
                          } text-white shadow-sm border-0`}
                      >
                        {property.purpose.toLowerCase().startsWith('for') ? property.purpose : `For ${property.purpose}`}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <div className="mb-4">
                      {/* Price updated to support dark mode secondary color */}
                      <p className="text-xl font-bold text-primary dark:text-secondary mb-2">
                        {formatPrice(property.price)}
                      </p>
                      <h3 className="font-semibold text-heading line-clamp-1 group-hover:text-primary dark:group-hover:text-secondary transition-colors">
                        {property.title}
                      </h3>
                      {property.location && (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-2">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="line-clamp-1">{property.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs">Viewed recently</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-primary dark:text-secondary font-medium opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        Details <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};