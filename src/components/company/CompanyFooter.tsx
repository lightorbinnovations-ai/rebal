import { useNavigate } from "react-router-dom";
import { CompanyProfile } from "@/types/company";
import { CompanyLogo } from "./CompanyLogo";
import { SocialLinks } from "./SocialLinks";
import { Phone, Mail, MapPin } from "lucide-react";

interface CompanyFooterProps {
  company: CompanyProfile;
}

export const CompanyFooter = ({ company }: CompanyFooterProps) => {
  const navigate = useNavigate();
  const basePath = `/${company.slug}`;

  const quickLinks = [
    { name: "Home", href: basePath },
    { name: "Properties", href: `${basePath}/properties` },
    { name: "About Us", href: `${basePath}/about` },
    { name: "Contact", href: `${basePath}/contact` },
  ];

  const handleNavClick = (href: string) => {
    navigate(href);
    window.scrollTo(0, 0);
  };

  // Get footer colors from company branding or use defaults
  const footerBgColor = company.footer_bg_color || "#0F172A";
  const footerTextColor = company.footer_text_color || "#FFFFFF";
  const mutedTextColor = `${footerTextColor}cc`; // 80% opacity

  return (
    <footer 
      className="border-t"
      style={{ 
        backgroundColor: footerBgColor,
        color: footerTextColor,
        borderColor: `${footerTextColor}20`,
      }}
    >
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <CompanyLogo company={company} size="md" />
              <div>
                <h3 
                  className="font-bold text-lg"
                  style={{ 
                    color: footerTextColor,
                    fontFamily: "var(--company-font-heading, inherit)",
                  }}
                >
                  {company.name}
                </h3>
                {company.is_verified && (
                  <span 
                    className="text-xs"
                    style={{ color: company.secondary_color || "#3B82F6" }}
                  >
                    Verified Business
                  </span>
                )}
              </div>
            </div>
            {company.tagline && (
              <p style={{ color: mutedTextColor }} className="mb-4">
                {company.tagline}
              </p>
            )}
            {company.description && (
              <p 
                style={{ color: mutedTextColor }} 
                className="text-sm mb-6"
              >
                {company.description.slice(0, 150)}
                {company.description.length > 150 ? "..." : ""}
              </p>
            )}
            <SocialLinks company={company} size="md" />
          </div>

          {/* Quick Links */}
          <div>
            <h4 
              className="font-semibold mb-4"
              style={{ 
                color: footerTextColor,
                fontFamily: "var(--company-font-heading, inherit)",
              }}
            >
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => handleNavClick(link.href)}
                    className="transition-colors hover:opacity-80"
                    style={{ color: mutedTextColor }}
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 
              className="font-semibold mb-4"
              style={{ 
                color: footerTextColor,
                fontFamily: "var(--company-font-heading, inherit)",
              }}
            >
              Contact
            </h4>
            <ul className="space-y-3">
              {company.phone && (
                <li>
                  <a
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-2 transition-colors hover:opacity-80"
                    style={{ color: mutedTextColor }}
                  >
                    <Phone className="h-4 w-4" />
                    {company.phone}
                  </a>
                </li>
              )}
              {company.email && (
                <li>
                  <a
                    href={`mailto:${company.email}`}
                    className="flex items-start gap-2 transition-colors hover:opacity-80 break-all"
                    style={{ color: mutedTextColor }}
                  >
                    <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{company.email}</span>
                  </a>
                </li>
              )}
              {company.address && (
                <li 
                  className="flex items-start gap-2"
                  style={{ color: mutedTextColor }}
                >
                  <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                  <span>{company.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: `${footerTextColor}20` }}
        >
          <p className="text-sm" style={{ color: mutedTextColor }}>
            © {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: mutedTextColor }}>
            Powered by{" "}
            <a
              href="/"
              className="font-semibold hover:underline"
              style={{ color: company.secondary_color || "#3B82F6" }}
            >
              REBAL
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
