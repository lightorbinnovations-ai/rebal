import { useEffect } from "react";
import { BASE_URL } from "@/lib/constants";

interface OrganizationSchema {
  type: "Organization";
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

interface RealEstateListingSchema {
  type: "RealEstateListing";
  name: string;
  description?: string;
  image?: string;
  url: string;
  price: number;
  priceCurrency: string;
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    addressCountry: string;
  };
  propertyType?: string;
  offers?: {
    type: string;
    price: number;
    priceCurrency: string;
  };
}

interface WebSiteSchema {
  type: "WebSite";
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    type: string;
    target: string;
    queryInput: string;
  };
}

interface BreadcrumbSchema {
  type: "BreadcrumbList";
  items: Array<{
    name: string;
    url: string;
  }>;
}

type StructuredDataType =
  | OrganizationSchema
  | RealEstateListingSchema
  | WebSiteSchema
  | BreadcrumbSchema;

interface SEOStructuredDataProps {
  data: StructuredDataType;
}

/**
 * Component to inject JSON-LD structured data for SEO
 */
export const SEOStructuredData = ({ data }: SEOStructuredDataProps) => {
  useEffect(() => {
    const scriptId = `structured-data-${data.type}`;

    // Remove existing script if present
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    // Build the JSON-LD object
    let jsonLd: Record<string, unknown>;

    switch (data.type) {
      case "Organization":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: data.name,
          url: data.url,
          logo: data.logo,
          description: data.description,
          sameAs: data.sameAs,
          address: {
            "@type": "PostalAddress",
            addressCountry: "NG",
          },
          areaServed: {
            "@type": "Country",
            name: "Nigeria",
          },
        };
        break;

      case "RealEstateListing":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: data.name,
          description: data.description,
          image: data.image,
          url: data.url,
          offers: {
            "@type": "Offer",
            price: data.price,
            priceCurrency: data.priceCurrency,
            availability: "https://schema.org/InStock",
          },
          address: data.address
            ? {
              "@type": "PostalAddress",
              streetAddress: data.address.streetAddress,
              addressLocality: data.address.addressLocality,
              addressRegion: data.address.addressRegion,
              addressCountry: data.address.addressCountry,
            }
            : undefined,
        };
        break;

      case "WebSite":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: data.name,
          url: data.url,
          description: data.description,
          potentialAction: data.potentialAction
            ? {
              "@type": "SearchAction",
              target: data.potentialAction.target,
              "query-input": data.potentialAction.queryInput,
            }
            : undefined,
        };
        break;

      case "BreadcrumbList":
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: data.items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        };
        break;

      default:
        return;
    }

    // Create and inject the script
    const script = document.createElement("script");
    script.id = scriptId;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data]);

  return null;
};

// Helper to create organization schema for REBAL
export const getRebalOrganizationSchema = (): OrganizationSchema => ({
  type: "Organization",
  name: "REBAL - Real Estate Business Accelerator",
  url: BASE_URL,
  logo: `${BASE_URL}/og-image.png`,
  description:
    "Create a professional property website and share listings instantly on WhatsApp and social media. Built for real estate professionals in Nigeria.",
  sameAs: [],
});

// Helper to create website schema
export const getRebalWebsiteSchema = (): WebSiteSchema => ({
  type: "WebSite",
  name: "REBAL",
  url: BASE_URL,
  description:
    "Nigeria's premier property marketplace. Create professional real estate websites and share listings instantly.",
  potentialAction: {
    type: "SearchAction",
    target: `${BASE_URL}/properties?search={search_term_string}`,
    queryInput: "required name=search_term_string",
  },
});

// Helper to create property listing schema
export const getPropertyListingSchema = (property: {
  title: string;
  description?: string;
  image?: string;
  url: string;
  price: number;
  location?: string;
  state?: string;
  city?: string;
  address?: string;
}): RealEstateListingSchema => ({
  type: "RealEstateListing",
  name: property.title,
  description: property.description,
  image: property.image,
  url: property.url,
  price: property.price,
  priceCurrency: "NGN",
  address: {
    streetAddress: property.address,
    addressLocality: property.city || property.location,
    addressRegion: property.state,
    addressCountry: "NG",
  },
});

// Helper to create breadcrumb schema
export const getBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
): BreadcrumbSchema => ({
  type: "BreadcrumbList",
  items,
});
