import { Company } from "@/types/company";
import { CompanyLogo } from "./CompanyLogo";
import { Building2, MapPin, Mail, Phone } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

interface AboutSectionProps {
  company: Company;
}

export const AboutSection = ({ company }: AboutSectionProps) => {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <ScrollReveal direction="left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Building2 className="h-4 w-4" />
              About Us
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              About {company.name}
            </h2>

            {company.description ? (
              <div className="prose prose-lg text-muted-foreground max-w-none">
                {company.description.split("\n").map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-lg">
                {company.name} is a trusted real estate business dedicated to helping you
                find your perfect property. With a commitment to excellence and customer
                satisfaction, we provide premium property listings and professional service.
              </p>
            )}

            {/* Quick Info */}
            <div className="mt-8 space-y-4">
              {company.address && (
                <ScrollReveal delay={100}>
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <span>{company.address}</span>
                  </div>
                </ScrollReveal>
              )}
              {company.email && (
                <ScrollReveal delay={200}>
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <a href={`mailto:${company.email}`} className="hover:text-primary transition-colors">
                      {company.email}
                    </a>
                  </div>
                </ScrollReveal>
              )}
              {company.phone && (
                <ScrollReveal delay={300}>
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <a href={`tel:${company.phone}`} className="hover:text-primary transition-colors">
                      {company.phone}
                    </a>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </ScrollReveal>

          {/* Right Column - Visual */}
          <ScrollReveal direction="right" className="relative">
            <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center p-12">
              <div className="text-center">
                <CompanyLogo company={company} size="lg" className="mx-auto mb-6 h-24 w-24 text-4xl" />
                <h3 className="text-2xl font-bold text-foreground mb-2">{company.name}</h3>
                {company.tagline && (
                  <p className="text-muted-foreground">{company.tagline}</p>
                )}
                {company.is_verified && (
                  <div className="mt-4">
                    <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified Business
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
