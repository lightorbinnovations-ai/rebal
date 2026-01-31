import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Check, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useShortLinks } from "@/hooks/useShortLinks";

interface CopyShortLinkButtonProps {
  companyId: string;
  propertyId: string;
  fullPath: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "dropdown";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export const CopyShortLinkButton = ({
  companyId,
  propertyId,
  fullPath,
  className = "",
  variant = "outline",
  size = "sm",
  showLabel = true,
}: CopyShortLinkButtonProps) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { getOrCreatePropertyLink, shortLinks } = useShortLinks(companyId);

  // Check if a short link already exists for this property
  const existingLink = shortLinks.find((link) => link.property_id === propertyId);

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    try {
      setIsGenerating(true);
      
      let shortLink = existingLink;
      if (!shortLink) {
        shortLink = await getOrCreatePropertyLink(propertyId, fullPath);
      }

      // Build the short URL using the edge function endpoint for proper OG image support
      // This ensures social media crawlers see the correct metadata
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const shortUrl = `${supabaseUrl}/functions/v1/short-link-redirect?code=${shortLink.short_code}`;

      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      toast.success("Short link copied!", { description: "Link with preview image ready to share" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy short link:", error);
      toast.error("Failed to create short link");
    } finally {
      setIsGenerating(false);
    }
  };

  // Render as dropdown menu item
  if (variant === "dropdown") {
    return (
      <DropdownMenuItem
        onClick={handleCopy}
        disabled={isGenerating}
        className={className}
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : copied ? (
          <Check className="mr-2 h-4 w-4" />
        ) : (
          <Link2 className="mr-2 h-4 w-4" />
        )}
        {isGenerating ? "Generating..." : copied ? "Copied!" : "Copy Short Link"}
      </DropdownMenuItem>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={isGenerating}
      className={`gap-2 ${className}`}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Link2 className="h-4 w-4" />
      )}
      {showLabel && (isGenerating ? "Generating..." : copied ? "Copied!" : "Short Link")}
    </Button>
  );
};
