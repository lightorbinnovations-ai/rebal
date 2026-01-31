import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useResolveShortLink } from "@/hooks/useShortLinks";
import { Loader2 } from "lucide-react";

/**
 * Handles /r/:shortCode redirects
 * Increments click count and redirects to full path
 */
const ShortLinkRedirect = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const { data: fullPath, isLoading, error } = useResolveShortLink(shortCode);

  useEffect(() => {
    if (fullPath) {
      // Redirect to the full path
      navigate(fullPath, { replace: true });
    }
  }, [fullPath, navigate]);

  useEffect(() => {
    if (error || (!isLoading && !fullPath)) {
      // Short link not found, redirect to home after delay
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading, fullPath, navigate]);

  if (error || (!isLoading && !fullPath)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-2">Link not found</p>
          <p className="text-sm text-muted-foreground">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default ShortLinkRedirect;
