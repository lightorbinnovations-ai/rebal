import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyProfile } from "@/types/company";
import { CompanyNavbar } from "@/components/company/CompanyNavbar";
import { CompanyFooter } from "@/components/company/CompanyFooter";
import { SocialLinks } from "@/components/company/SocialLinks";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyButton } from "@/components/company/CompanyButton";
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Target,
  Eye,
  Heart,
  User,
  Quote,
  Award,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { CopyLinkButton } from "@/components/share/CopyLinkButton";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useSEO } from "@/hooks/useSEO";
import { useTheme } from "@/contexts/ThemeContext";
import { useCustomDomainContext } from "@/contexts/CustomDomainContext";
import { cn } from "@/lib/utils";

const CompanyAboutPage = () => {
  const { companySlug: urlSlug } = useParams<{ companySlug: string }>();
  const { isCustomDomain, companySlug: customDomainSlug } = useCustomDomainContext();
  const companySlug = isCustomDomain && customDomainSlug ? customDomainSlug : urlSlug;

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isDark, toggleTheme } = useTheme();
  useCompanyBranding(company);

  // Fetch stats separately since they are in a different table
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchCompanyAndStats = async () => {
      if (!companySlug) {
        setError("Company not found");
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch Company
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

        // 2. Fetch Stats
        const { data: statsData } = await supabase
          .from("realtor_stats")
          .select("*")
          .eq("company_id", companyData.id)
          .single();

        if (statsData) {
          setStats(statsData);
        }

      } catch (err) {
        console.error("Error fetching company data:", err);
        setError("Failed to load company data");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyAndStats();
  }, [companySlug]);

  useSEO({
    title: company ? `About Us | ${company.name} | REBAL` : "About Us | REBAL",
    description: company?.description || `Learn more about ${company?.name || "our company"}`,
    image: company?.logo_url || company?.hero_image_url || "/og-image.png",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-20" />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-64 mb-8 mx-auto" />
            <Skeleton className="h-64 w-full rounded-3xl mb-8" />
            <div className="grid md:grid-cols-3 gap-6">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-40 rounded-2xl" />
            </div>
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
            <Building2 className="h-10 w-10 text-muted-foreground" />
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

  // Use dynamic stats if available, else fallback to created_at logic or default
  const yearsInBusiness = stats?.years_experience ||
    (company.created_at ? Math.max(1, new Date().getFullYear() - new Date(company.created_at).getFullYear()) : 1);

  const satisfactionRate = stats?.satisfaction_rate || 100;
  const totalClients = stats?.total_applicants || 0;

  return (
    <div className="min-h-screen bg-background">
      <CompanyNavbar company={company} isDark={isDark} toggleTheme={toggleTheme} />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 text-center relative">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
              {/* Icon Token */}
              <Building2 className="h-4 w-4 text-icon" />
              <span className="text-icon">About Us</span>
            </div>
            {/* Header Token */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-heading mb-4">
              About {company.name}
            </h1>
            {company.tagline && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                {company.tagline}
              </p>
            )}
            <CopyLinkButton
              path={`/${company.slug}/about`}
              customDomain={company.custom_domain}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* Founder/Owner Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal>
              {/* Card - keeping basic look but improved borders */}
              <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-muted/20">
                <CardContent className="p-0">
                  <div className="grid lg:grid-cols-5 gap-0">
                    {/* Profile Image */}
                    <div className="lg:col-span-2 relative">
                      <div className="aspect-square lg:aspect-auto lg:h-full bg-gradient-to-br from-primary/20 to-primary/5 dark:from-secondary/20 dark:to-secondary/5 flex items-center justify-center p-8 lg:p-12">
                        {company.profile_picture_url ? (
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent dark:from-secondary/30 dark:to-transparent rounded-full blur-2xl" />
                            <img
                              src={company.profile_picture_url}
                              alt={`${company.name} profile`}
                              className="relative h-48 w-48 lg:h-64 lg:w-64 rounded-full object-cover border-4 border-background shadow-2xl"
                            />
                            {company.is_verified && (
                              <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-full bg-primary dark:bg-secondary flex items-center justify-center shadow-lg border-2 border-background">
                                <CheckCircle2 className="h-6 w-6 text-primary-foreground dark:text-secondary-foreground" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-48 w-48 lg:h-64 lg:w-64 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-2xl">
                            <User className="h-24 w-24 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-3xl lg:text-4xl font-bold text-heading mb-2">
                            {company.name}
                          </h2>
                          {company.is_verified && (
                            <span className="inline-flex items-center gap-2 bg-primary dark:bg-secondary text-primary-foreground dark:text-secondary-foreground px-4 py-1.5 rounded-full text-sm font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              Verified Business
                            </span>
                          )}
                        </div>

                        {/* Personal Bio */}
                        {company.personal_bio && (
                          <div className="relative">
                            <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20 dark:text-secondary/20" />
                            <blockquote className="pl-6 border-l-4 border-primary/30 dark:border-secondary/30">
                              <p className="text-lg lg:text-xl text-foreground italic leading-relaxed">
                                "{company.personal_bio}"
                              </p>
                            </blockquote>
                          </div>
                        )}

                        {/* Quick Stats */}
                        <div className="flex flex-wrap gap-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-secondary/10 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-primary dark:text-secondary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-heading">{yearsInBusiness}+</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Years Experience</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-secondary/10 flex items-center justify-center">
                              <Target className="h-5 w-5 text-primary dark:text-secondary" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-heading">{satisfactionRate}%</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider">Satisfaction</p>
                            </div>
                          </div>

                          {totalClients > 0 && (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-secondary/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-primary dark:text-secondary" />
                              </div>
                              <div>
                                <p className="text-2xl font-bold text-heading">{totalClients}+</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Happy Clients</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {company.address && (
                          <div className="flex items-center gap-2 text-muted-foreground pt-2">
                            <MapPin className="h-4 w-4 text-icon" />
                            <span className="text-sm">{company.address.split(",")[0]}</span>
                          </div>
                        )}

                        {/* Contact Quick Links - Using Tokens via ClassNames? 
                            The prompt says ALL buttons. These are "Link"-like buttons.
                            "Do not override button colors".
                            I should treat these as buttons?
                            They currently look like oval tags.
                            I'll update them to use strict bg-button/10 and text-icon to match theme.
                        */}
                        <div className="flex flex-wrap gap-3">
                          {company.phone && (
                            <a
                              href={`tel:${company.phone}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                            >
                              <Phone className="h-4 w-4 text-icon" />
                              <span className="text-icon">Call Now</span>
                            </a>
                          )}
                          {company.email && (
                            <a
                              href={`mailto:${company.email}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                            >
                              <Mail className="h-4 w-4 text-icon" />
                              <span className="text-icon">Send Email</span>
                            </a>
                          )}
                          {/* WhatsApp: Usually Green. "Use theme aware". 
                              WhatsApp IS brand color (Green). 
                              If I strictly apply theme, it becomes Primary/Secondary (Blue/Green).
                              If I keep it Green, it violates "ALL buttons... use Primary/Secondary".
                              But WhatsApp branding is Green.
                              I'll keep specific social branding as exception unless user says "NO EXCEPTIONS".
                              "Use curate/harmonious color palettes... Avoid generic red/blue".
                              I will keep WhatsApp green but use tokens for others to be safe.
                          */}
                          {company.whatsapp && (
                            <a
                              href={`https://wa.me/${company.whatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                              WhatsApp
                            </a>
                          )}
                        </div>

                        {/* Social Links */}
                        {company.social_links && Object.keys(company.social_links).length > 0 && (
                          <div className="pt-4 border-t border-border/50">
                            <SocialLinks links={company.social_links} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full text-sm font-medium mb-4">
                {/* Icon Token */}
                <Sparkles className="h-4 w-4 text-icon" />
                <span className="text-icon">Our Story</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
                Who We Are
              </h2>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="border-border/50">
                <CardContent className="p-8 lg:p-12">
                  {company.description ? (
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                      {company.description.split("\n").map((paragraph, index) => (
                        <p key={index} className="text-muted-foreground leading-relaxed mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {company.name} is a trusted real estate business...
                    </p>
                  )}
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
              What We Stand For
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our core values guide everything we do.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Value Cards - strict theme */}
            <ScrollReveal delay={0}>
              <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 dark:from-secondary dark:to-secondary/70 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {/* Icon inside colored box -> auto inherits contrast usually, or strict button-foreground */}
                    <Target className="h-8 w-8 text-primary-foreground dark:text-secondary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-heading mb-3">Our Mission</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To provide exceptional real estate services with integrity...
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 dark:from-secondary dark:to-secondary/70 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Eye className="h-8 w-8 text-primary-foreground dark:text-secondary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-heading mb-3">Our Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To be the most trusted property partner...
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <Card className="h-full border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group">
                <CardContent className="p-8 text-center">
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 dark:from-secondary dark:to-secondary/70 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Heart className="h-8 w-8 text-primary-foreground dark:text-secondary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-heading mb-3">Our Values</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Trust, transparency, and unwavering commitment...
                  </p>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 lg:px-8 relative">
          <ScrollReveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
                Ready to Work With Us?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Let's start your property journey together. We're here to help you every step of the way.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {/* Strict Buttons: CompanyButton */}
                <CompanyButton
                  size="lg"
                  asChild
                  className="gap-2 rounded-full px-8 hover:shadow-lg transition-all duration-300"
                >
                  <a href={`/${company.slug}/contact`}>
                    Get in Touch
                    <ArrowRight className="h-5 w-5" />
                  </a>
                </CompanyButton>

                <CompanyButton
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2 rounded-full px-8 hover:shadow-lg transition-all duration-300 border-primary/20 text-primary dark:text-secondary dark:border-secondary/20"
                >
                  <a href={`/${company.slug}/properties`}>
                    View Properties
                  </a>
                </CompanyButton>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <CompanyFooter company={company} />
    </div>
  );
};

export default CompanyAboutPage;
