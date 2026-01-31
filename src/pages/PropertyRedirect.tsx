import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Redirects /properties/:propertySlug to the company-branded property page
 * e.g., /properties/luxury-land-lagos → /company-slug/property/luxury-land-lagos
 */
const PropertyRedirect = () => {
  const { propertySlug } = useParams<{ propertySlug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const findAndRedirect = async () => {
      if (!propertySlug) {
        navigate("/properties", { replace: true });
        return;
      }

      try {
        // Find property and its company
        const { data: property, error: propertyError } = await supabase
          .from("properties")
          .select("id, slug, company_id")
          .eq("slug", propertySlug)
          .eq("is_active", true)
          .single();

        if (propertyError || !property) {
          setError("Property not found");
          setTimeout(() => navigate("/properties", { replace: true }), 2000);
          return;
        }

        // Get company slug using secure function
        const { data: companyArray, error: companyError } = await supabase
          .rpc("get_public_company_by_id", { company_id: property.company_id });
        
        const company = companyArray?.[0];

        if (companyError || !company) {
          setError("Company not found");
          setTimeout(() => navigate("/properties", { replace: true }), 2000);
          return;
        }

        // Redirect to company-branded property page
        navigate(`/${company.slug}/property/${property.slug}`, { replace: true });
      } catch (err) {
        console.error("Error redirecting property:", err);
        setError("Failed to load property");
        setTimeout(() => navigate("/properties", { replace: true }), 2000);
      }
    };

    findAndRedirect();
  }, [propertySlug, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to properties...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading property...</p>
      </div>
    </div>
  );
};

export default PropertyRedirect;
