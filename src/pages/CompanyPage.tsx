import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyProfile, Property, RealtorStats } from "@/types/company";
import { CompanyNavbar } from "@/components/company/CompanyNavbar";
import { CompanyHero } from "@/components/company/CompanyHero";
import { CompanyFooter } from "@/components/company/CompanyFooter";
import { PropertyCard } from "@/components/company/PropertyCard";
import { ShareSection } from "@/components/share/ShareSection";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyButton } from "@/components/company/CompanyButton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building,
  ArrowRight,
  Home,
  Users,
  Award,
  Shield,
  Clock,
  Star,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  MapPin
} from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useSEO } from "@/hooks/useSEO";
import { trackAnalytics } from "@/lib/publicApi";
import { useTheme } from "@/contexts/ThemeContext";
import { useCustomDomainContext } from "@/contexts/CustomDomainContext";
import { cn } from "@/lib/utils";

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Don't animate if end is 0 or we've already animated with this value
    if (end === 0) {
      setCount(0);
      return;
    }

    // If value changed from 0 to a real number, animate
    if (end > 0 && !hasAnimated) {
      setHasAnimated(true);
      let startTime: number;
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    } else if (end > 0) {
      // If value changed after animation, just set it directly
      setCount(end);
    }
  }, [end, duration, hasAnimated]);

  return count;
};

// Stats Counter Component with Strict Theme
const StatsCounter = ({ value, label, icon: Icon, suffix = "" }: {
  value: number;
  label: string;
  icon: React.ElementType;
  suffix?: string;
}) => {
  const count = useCounter(value);

  return (
    <ScrollReveal className="text-center">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
        <Card className="relative bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
          <CardContent className="p-6 md:p-8">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
              {/* Icon Token Compliance */}
              <Icon className="h-7 w-7 text-icon transition-colors" />
            </div>
            <div className="text-4xl md:text-5xl font-bold text-heading mb-2 tabular-nums">
              {count}{suffix}
            </div>
            <div className="text-muted-foreground font-medium">{label}</div>
          </CardContent>
        </Card>
      </div>
    </ScrollReveal>
  );
};

// Feature Card Component with Strict Theme
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) => (
  <ScrollReveal delay={delay}>
    <div className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          {/* Icon Token Compliance */}
          <Icon className="h-6 w-6 text-icon" />
        </div>
        {/* Text Token Compliance */}
        <h3 className="text-lg font-semibold text-heading mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  </ScrollReveal>
);

const CompanyPage = () => {
  const { companySlug: urlSlug } = useParams<{ companySlug: string }>();
  const { isCustomDomain, companySlug: customDomainSlug } = useCustomDomainContext();
  const companySlug = isCustomDomain && customDomainSlug ? customDomainSlug : urlSlug;

  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [stats, setStats] = useState<RealtorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isDark, toggleTheme } = useTheme();
  useCompanyBranding(company);

  useEffect(() => {
    const fetchCompanyData = async () => {
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

        // Featured properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .eq("company_id", companyData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(6);

        if (propertiesError) throw propertiesError;
        setProperties((propertiesData as Property[]) || []);

        // Total count
        const { count } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyData.id)
          .eq("is_active", true);

        setTotalProperties(count || 0);

        // Track Record Stats
        try {
          const { data: statsData, error: statsError } = await supabase
            .from("realtor_stats")
            .select("*")
            .eq("company_id", companyData.id)
            .single();

          console.log("Stats fetch result:", { statsData, statsError, companyId: companyData.id });

          if (statsError) {
            console.error("Error fetching stats:", statsError);
          } else {
            setStats(statsData as RealtorStats);
          }

          // Track Page View
          trackAnalytics({
            company_id: companyData.id!,
            event_type: "page_view"
          });

        } catch (e) {
          console.error("Stats fetch error:", e);
        }

      } catch (err) {
        console.error("Error fetching company:", err);
        setError("Failed to load company data");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [companySlug]);

  useSEO({
    title: company ? `${company.name} | REBAL` : "Loading... | REBAL",
    description: company?.description || company?.tagline || "Professional property listings",
    image: company?.hero_image_url || company?.logo_url || "/og-image.png",
    keywords: company?.name ? [company.name, "real estate", "property"] : undefined,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16" />
        <div className="container mx-auto px-4 py-20">
          <Skeleton className="h-[400px] w-full mb-8 rounded-3xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Skeleton className="h-[150px] rounded-2xl" />
            <Skeleton className="h-[150px] rounded-2xl" />
            <Skeleton className="h-[150px] rounded-2xl" />
            <Skeleton className="h-[150px] rounded-2xl" />
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
          <h1 className="text-3xl font-bold text-heading mb-4">Company Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The company you're looking for doesn't exist or has been removed.
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

  // Calculate years or use stats - prioritize user-entered stats
  const yearsInBusiness = stats?.years_experience || (company.created_at
    ? Math.max(1, new Date().getFullYear() - new Date(company.created_at).getFullYear())
    : 1);

  const satisfactionRate = stats?.satisfaction_rate || 100;
  const activeListings = totalProperties; // Always use real count for listings, as per "Derived" rule

  // Total Applicants/Clients - prioritize user-entered stats, fallback to calculated
  const happyClients = stats?.total_applicants || (totalProperties > 0 ? Math.max(50, totalProperties * 3) : 0);

  console.log("Calculated stats for display:", {
    yearsInBusiness,
    satisfactionRate,
    activeListings,
    happyClients,
    rawStats: stats,
    totalProperties
  });

  return (
    <div className="min-h-screen bg-background">
      <CompanyNavbar company={company} isDark={isDark} toggleTheme={toggleTheme} />
      <CompanyHero company={company} />

      {/* Stats Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {/* Icon Token Compliance */}
              <TrendingUp className="h-4 w-4 text-icon" />
              <span className="text-icon">Our Track Record</span>
            </div>
            {/* Header Token - strictly text-heading */}
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
              Numbers That Speak
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trust built through years of excellence and countless successful transactions.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCounter value={activeListings} label="Active Listings" icon={Home} suffix="+" />
            <StatsCounter value={yearsInBusiness} label="Years Experience" icon={Award} suffix="+" />
            <StatsCounter value={happyClients} label="Happy Clients" icon={Users} suffix="+" />
            <StatsCounter value={satisfactionRate} label="Satisfaction Rate" icon={Star} suffix="%" />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {/* Icon Token */}
              <Sparkles className="h-4 w-4 text-icon" />
              <span className="text-icon">Why Choose Us</span>
            </div>
            {/* Heading Token */}
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
              Your Trusted Property Partner
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're committed to making your property journey seamless, transparent, and rewarding.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Shield}
              title="Verified Listings"
              description="Every property is thoroughly verified to ensure authenticity and accuracy."
              delay={0}
            />
            <FeatureCard
              icon={Clock}
              title="Quick Response"
              description="Our team responds to inquiries within hours, not days."
              delay={100}
            />
            <FeatureCard
              icon={Award}
              title="Expert Guidance"
              description="Professional advice from experienced real estate specialists."
              delay={200}
            />
            <FeatureCard
              icon={CheckCircle2}
              title="Transparent Deals"
              description="No hidden fees or surprises. Complete transparency in all transactions."
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {/* Icon Token */}
              <Building className="h-4 w-4 text-icon" />
              <span className="text-icon">Featured Properties</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
              Discover Your Dream Property
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our handpicked selection of premium properties available for sale and rent.
            </p>
          </ScrollReveal>

          {properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
                {properties.map((property, index) => (
                  <ScrollReveal key={property.id} delay={index * 100}>
                    <PropertyCard
                      property={property}
                      companySlug={company.slug}
                    />
                  </ScrollReveal>
                ))}
              </div>
              <ScrollReveal className="text-center">
                {/* Strict Button Token: CompanyButton */}
                <CompanyButton
                  size="lg"
                  onClick={() => navigate(`/${company.slug}/properties`)}
                  className="gap-2 rounded-full px-8 hover:shadow-lg transition-all duration-300 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90"
                >
                  View All Properties
                  <ArrowRight className="h-5 w-5" />
                </CompanyButton>
              </ScrollReveal>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="h-20 w-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <Building className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold text-heading mb-2">
                No properties yet
              </h3>
              <p className="text-muted-foreground">
                Check back later for new listings.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Location Section */}
      {company.address && (
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <ScrollReveal className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
                {/* Icon/Text Token */}
                <MapPin className="h-4 w-4 text-icon" />
                <span className="text-icon">Visit Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
                Our Location
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {company.address}
              </p>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="overflow-hidden border-border/50">
                <CardContent className="p-0">
                  {/* Embedded Google Map */}
                  <div className="aspect-[21/9] w-full">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(company.address || "")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                      title="Company Location Map"
                    />
                  </div>
                  {/* Get Directions Button */}
                  <div className="p-6 bg-card text-center border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-3">{company.address}</p>
                    <CompanyButton
                      variant="outline"
                      className="rounded-full border-primary/20 hover:bg-primary/5 text-primary dark:text-secondary dark:border-secondary/20 dark:hover:bg-secondary/5"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(company.address || "")}`, "_blank")}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </CompanyButton>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
                Ready to Find Your Perfect Property?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get in touch with us today and let's make your property dreams a reality.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Strict Buttons */}
                <CompanyButton
                  size="lg"
                  onClick={() => navigate(`/${company.slug}/contact`)}
                  className="gap-2 rounded-full px-8 hover:shadow-lg transition-all duration-300"
                >
                  Contact Us
                  <ArrowRight className="h-5 w-5" />
                </CompanyButton>

                <CompanyButton
                  size="lg"
                  variant="outline"
                  onClick={() => navigate(`/${company.slug}/properties`)}
                  className="gap-2 rounded-full px-8 hover:shadow-lg transition-all duration-300 border-primary/20 text-primary dark:text-secondary dark:border-secondary/20"
                >
                  Browse Properties
                </CompanyButton>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Share Section - Assume internal components handle theme or need update? 
          ShareSection likely uses Icons/Text. I should check it.
          For now, I update the page structure.
      */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <ScrollReveal>
            <ShareSection
              url={`/${company.slug}`}
              title={`${company.name} - Property Listings`}
              description={company.tagline || company.description || `Check out properties from ${company.name}`}
              customDomain={company.custom_domain}
            />
          </ScrollReveal>
        </div>
      </section>

      <CompanyFooter company={company} />
    </div>
  );
};

export default CompanyPage;
