import { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useCustomDomainContext } from "@/contexts/CustomDomainContext";
import CompanyPage from "@/pages/CompanyPage";
import CompanyPropertiesPage from "@/pages/CompanyPropertiesPage";
import CompanyAboutPage from "@/pages/CompanyAboutPage";
import CompanyContactPage from "@/pages/CompanyContactPage";
import PropertyDetailsPage from "@/pages/PropertyDetailsPage";
import { Loader2 } from "lucide-react";

interface CustomDomainWrapperProps {
    children: ReactNode;
}

/**
 * CustomDomainWrapper handles routing when the app is accessed via a custom domain.
 * 
 * When a custom domain is detected (e.g., latest.com):
 * - / → Shows the company's main page (properties listing)
 * - /about → Shows the company's about page
 * - /contact → Shows the company's contact page
 * - /:propertySlug → Shows a specific property
 * 
 * When accessed via the main platform domain:
 * - Renders children (normal app routes)
 */
export const CustomDomainWrapper = ({ children }: CustomDomainWrapperProps) => {
    const { isCustomDomain, companySlug, isLoading } = useCustomDomainContext();

    // Show loading state while detecting domain
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // If not a custom domain, render normal app routes
    if (!isCustomDomain || !companySlug) {
        return <>{children}</>;
    }

    // Custom domain detected - render company-specific routes
    return (
        <Routes>
            {/* Company home page (property listings) */}
            <Route path="/" element={<CompanyPage />} />

            {/* Company about page */}
            <Route path="/about" element={<CompanyAboutPage />} />

            {/* Company contact page */}
            <Route path="/contact" element={<CompanyContactPage />} />

            {/* Company properties listing */}
            <Route path="/properties" element={<CompanyPropertiesPage />} />

            {/* Property details - catch any path that could be a property slug */}
            <Route path="/:propertySlug" element={<PropertyDetailsPage />} />

            {/* Fallback - redirect unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};
