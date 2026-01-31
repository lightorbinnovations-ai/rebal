import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CompanyProfile } from "@/types/company";
import { PREDEFINED_SERVICES } from "@/constants/services";
import { CompanyNavbar } from "@/components/company/CompanyNavbar";
import { CompanyFooter } from "@/components/company/CompanyFooter";
import { CompanyButton } from "@/components/company/CompanyButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { useCompanyBranding } from "@/hooks/useCompanyBranding";
import { useSEO } from "@/hooks/useSEO";
import { CopyLinkButton } from "@/components/share/CopyLinkButton";
import { Briefcase, CheckCircle2, MessageCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useCustomDomainContext } from "@/contexts/CustomDomainContext";
import { cn } from "@/lib/utils";

const CompanyServicesPage = () => {
    const { companySlug: urlSlug } = useParams<{ companySlug: string }>();
    const { isCustomDomain, companySlug: customDomainSlug } = useCustomDomainContext();
    const companySlug = isCustomDomain && customDomainSlug ? customDomainSlug : urlSlug;

    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            } catch (err) {
                console.error("Error fetching company:", err);
                setError("Failed to load company data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [companySlug]);

    useSEO({
        title: company ? `Services | ${company.name} | REBAL` : "Services | REBAL",
        description: company ? `Explore professional real estate services offered by ${company.name}` : "Real Estate Services",
        image: company?.logo_url || company?.hero_image_url || "/og-image.png",
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="h-20" />
                <div className="container mx-auto px-4 py-20">
                    <Skeleton className="h-10 w-64 mb-8 mx-auto rounded-full" />
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-[250px] rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !company) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center px-4">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Not Found</h1>
                    <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
                    <CompanyButton onClick={() => window.location.href = "/"}>
                        Go to Homepage
                    </CompanyButton>
                </div>
            </div>
        );
    }

    // Filter services
    const selectedServiceIds = company.services || [];
    const displayServices = PREDEFINED_SERVICES.filter(service =>
        selectedServiceIds.includes(service.id)
    );

    return (
        <div className="min-h-screen bg-background">
            <CompanyNavbar company={company} isDark={isDark} toggleTheme={toggleTheme} />

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                <div className="container mx-auto px-4 lg:px-8 text-center relative">
                    <ScrollReveal>
                        <div className="inline-flex items-center gap-2 bg-primary/10 dark:bg-secondary/10 text-primary dark:text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Briefcase className="h-4 w-4" />
                            Our Expertise
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-heading mb-4">
                            Professional Services
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                            We offer comprehensive real estate solutions tailored to your needs.
                        </p>
                        <CopyLinkButton
                            path={`/${company.slug}/services`}
                            customDomain={company.custom_domain}
                        />
                    </ScrollReveal>
                </div>
            </section>

            {/* Services Grid */}
            <section className="py-12 md:py-20 bg-background">
                <div className="container mx-auto px-4 lg:px-8">
                    {displayServices.length > 0 ? (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {displayServices.map((service, index) => {
                                const Icon = service.icon;
                                return (
                                    <ScrollReveal key={service.id} delay={index * 50}>
                                        <Card className="h-full border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300 group">
                                            <CardContent className="p-8">
                                                <div className="h-14 w-14 rounded-2xl bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center mb-6 transition-colors">
                                                    <Icon className="h-7 w-7 text-icon transition-colors" />
                                                </div>
                                                <h3 className="text-xl font-bold text-heading mb-3">
                                                    {service.title}
                                                </h3>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {service.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </ScrollReveal>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
                            <div className="max-w-md mx-auto">
                                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold text-heading mb-2">No Services Listed</h3>
                                <p className="text-muted-foreground">
                                    This company hasn't listed specific services yet. Please contact them directly for more information.
                                </p>
                                <div className="mt-8">
                                    <CompanyButton asChild size="lg" className="gap-2 rounded-full">
                                        <a href={`/${company.slug}/contact`}>
                                            <MessageCircle className="h-5 w-5" />
                                            Contact Us
                                        </a>
                                    </CompanyButton>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            {displayServices.length > 0 && (
                <section className="py-20 bg-muted/30 relative">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                    <div className="container mx-auto px-4 lg:px-8 text-center relative">
                        <ScrollReveal>
                            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-6">
                                Ready to get started?
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                                Partner with us for all your real estate needs. We're here to help you achieve your goals.
                            </p>
                            <CompanyButton asChild size="lg" className="gap-2 rounded-full px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all">
                                <a href={`/${company.slug}/contact`}>
                                    Start a Conversation
                                </a>
                            </CompanyButton>
                        </ScrollReveal>
                    </div>
                </section>
            )}

            <CompanyFooter company={company} />
        </div>
    );
};

export default CompanyServicesPage;
