import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyProfile, Property } from "@/types/company";
import { CompanyNavbar } from "@/components/company/CompanyNavbar";
import { CompanyFooter } from "@/components/company/CompanyFooter";
import { PropertiesSection } from "@/components/company/PropertiesSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyButton } from "@/components/company/CompanyButton";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useSEO } from "@/hooks/useSEO";
import { CopyLinkButton } from "@/components/share/CopyLinkButton";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import {
  Building,
  Home,
  Key,
  MapPin,
  Phone,
  MessageCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useCustomDomainContext } from "@/contexts/CustomDomainContext";
import { cn } from "@/lib/utils";

// Property Type Stats Component - Strict Theme
const PropertyTypeStat = ({
  icon: Icon,
  count,
  label,
  isActive,
  onClick
}: {
  icon: React.ElementType;
  count: number;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <Card
    className={cn(
      "cursor-pointer border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group bg-card",
      isActive && "border-button bg-button/5"
    )}
    onClick={onClick}
  >
    <CardContent className="p-4 flex items-center gap-3">
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
        isActive
          ? "bg-button text-button-foreground"
          : "bg-button/10 text-button group-hover:bg-button group-hover:text-button-foreground"
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-heading">{count}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const CompanyPropertiesPage = () => {
  const { companySlug: urlSlug } = useParams<{ companySlug: string }>();
  const { isCustomDomain, companySlug: customDomainSlug } = useCustomDomainContext();
  const companySlug = isCustomDomain && customDomainSlug ? customDomainSlug : urlSlug;

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    forSale: 0,
    forRent: 0,
    locations: 0,
  });

  const { isDark, toggleTheme } = useTheme();
  useCompanyBranding(company);

  useEffect(() => {
    const fetchData = async () => {
      if (!companySlug) {
        setError("Company not found");
        setLoading(false);
        return;
      }

      try {
        const { data: companyArray, error: companyError } = await supabase
          .rpc("get_public_company_profile_safe", { company_slug: companySlug });

        if (companyError) throw companyError;
        const companyData = companyArray?.[0];
        if (!companyData) {
          setError("Company not found");
          setLoading(false);
          return;
        }

        setCompany(companyData as CompanyProfile);

        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .eq("company_id", companyData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (propertiesError) throw propertiesError;
        const props = (propertiesData as Property[]) || [];
        setProperties(props);

        // Calculate stats
        const forSale = props.filter(p => p.purpose?.toLowerCase() === "sale" || p.purpose?.toLowerCase() === "for sale").length;
        const forRent = props.filter(p => p.purpose?.toLowerCase() === "rent" || p.purpose?.toLowerCase() === "for rent").length;
        const uniqueLocations = new Set(props.map(p => p.location || p.address).filter(Boolean)).size;

        setStats({
          total: props.length,
          forSale,
          forRent,
          locations: uniqueLocations,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companySlug]);

  useSEO({
    title: company ? `Properties | ${company.name} | REBAL` : "Properties | REBAL",
    description: company ? `Browse ${stats.total} property listings from ${company.name}` : "Browse property listings",
    image: company?.hero_image_url || company?.logo_url || "/og-image.png",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-20" />
        <div className="container mx-auto px-4 py-20">
          <Skeleton className="h-12 w-80 mb-4 mx-auto rounded-full" />
          <Skeleton className="h-6 w-96 mb-8 mx-auto" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[350px] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
            <Building className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-heading mb-4">Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist.
          </p>
          <CompanyButton
            onClick={() => window.location.href = "/"}
            className="rounded-full px-8"
          >
            Go to Homepage
          </CompanyButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CompanyNavbar company={company} isDark={isDark} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 text-center relative">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Building className="h-4 w-4" />
              Property Listings
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-heading mb-4">
              Find Your Perfect Property
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Explore our curated collection of {stats.total}+ premium properties available for sale and rent.
            </p>
            <CopyLinkButton
              path={`/${company.slug}/properties`}
              customDomain={company.custom_domain}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <ScrollReveal delay={0}>
              <PropertyTypeStat
                icon={Building}
                count={stats.total}
                label="Total Listings"
              />
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <PropertyTypeStat
                icon={Home}
                count={stats.forSale}
                label="For Sale"
              />
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <PropertyTypeStat
                icon={Key}
                count={stats.forRent}
                label="For Rent"
              />
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <PropertyTypeStat
                icon={MapPin}
                count={stats.locations}
                label="Locations"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <PropertiesSection properties={properties} companySlug={company.slug} />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
                Can't Find What You're Looking For?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get in touch with us and let us help you find the perfect property that meets your needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CompanyButton
                  size="lg"
                  asChild
                  className="gap-2 rounded-full px-8 hover:shadow-lg transition-all duration-300"
                >
                  <a href={`/${company.slug}/contact`}>
                    <MessageCircle className="h-5 w-5" />
                    Contact Us
                  </a>
                </CompanyButton>
                {company.phone && (
                  <CompanyButton
                    size="lg"
                    variant="outline"
                    asChild
                    className="gap-2 rounded-full px-8 hover:shadow-lg transition-all duration-300 border-primary/20 text-primary dark:text-secondary dark:border-secondary/20"
                  >
                    <a href={`tel:${company.phone}`}>
                      <Phone className="h-5 w-5" />
                      Call Now
                    </a>
                  </CompanyButton>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <CompanyFooter company={company} />
    </div>
  );
};

export default CompanyPropertiesPage;
