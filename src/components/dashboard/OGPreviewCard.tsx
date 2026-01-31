import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Image as ImageIcon, RefreshCw, Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface OGPreviewCardProps {
  title: string;
  description: string;
  imageUrl: string | null;
  pageType: "company" | "property" | "about" | "contact" | "properties";
  pageUrl: string;
  hasCustomOG?: boolean;
}

export function OGPreviewCard({
  title,
  description,
  imageUrl,
  pageType,
  pageUrl,
  hasCustomOG = false,
}: OGPreviewCardProps) {
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = "https://rebal.site";
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hcgwammhqybkmdoklgau.supabase.co";

  // The actual share URL uses the edge function
  const shareUrl = `${supabaseUrl}/functions/v1/social-preview?path=${encodeURIComponent(pageUrl)}`;

  // Display URL is the branded one
  const displayUrl = pageUrl.startsWith("/") ? `${baseUrl}${pageUrl}` : `${baseUrl}/${pageUrl}`;

  const handleCopyShareUrl = async () => {
    try {
      // Copy the edge function URL for proper OG previews on social media
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied!", {
        description: "This link will show the correct preview on WhatsApp/Facebook"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleTestPreview = () => {
    // Open Facebook's sharing debugger to test OG tags
    window.open(
      `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const pageTypeLabels: Record<string, string> = {
    company: "Company Page",
    property: "Property Listing",
    about: "About Page",
    contact: "Contact Page",
    properties: "Properties Page",
  };

  const truncatedTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
  const truncatedDescription = description.length > 160 ? description.substring(0, 157) + "..." : description;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2">
          <div>
            <CardTitle className="text-lg">Social Preview</CardTitle>
            <CardDescription className="truncate">How this page appears when shared</CardDescription>
          </div>
          <Badge variant={hasCustomOG ? "default" : "secondary"} className="w-fit">
            {hasCustomOG ? "Custom OG" : "Preview"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Card Mock */}
        <div className="border rounded-lg overflow-hidden bg-muted/30">
          {/* Image Preview */}
          <div className="aspect-[1.91/1] bg-muted relative">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt="OG Preview"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-2" />
                <span className="text-sm">No preview image</span>
              </div>
            )}

            {/* Page Type Badge */}
            <Badge className="absolute top-2 left-2" variant="outline">
              {pageTypeLabels[pageType] || pageType}
            </Badge>
          </div>

          {/* Text Preview */}
          <div className="p-3 space-y-1 bg-background min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">
              {new URL(baseUrl).hostname}
            </p>
            <h4 className="font-semibold text-sm line-clamp-2 break-words">{truncatedTitle}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
              {truncatedDescription}
            </p>
          </div>
        </div>



        {title.length > 60 && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 text-warning rounded-lg">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Title may be truncated</p>
              <p className="text-xs opacity-80">
                Title is {title.length} characters. Keep under 60 for best results.
              </p>
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="p-2 bg-muted rounded overflow-hidden min-w-0">
            <span className="text-muted-foreground">Title:</span>
            <span className="ml-1 font-medium">{title.length}/60</span>
          </div>
          <div className="p-2 bg-muted rounded overflow-hidden min-w-0">
            <span className="text-muted-foreground truncate">Desc:</span>
            <span className="ml-1 font-medium">{description.length}/160</span>
          </div>
        </div>

        {/* Actions */}
        {/* Actions */}
        <div className="flex flex-col gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleCopyShareUrl}
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied Link" : "Copy Link"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={handleTestPreview}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Test on FB
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            asChild
          >
            <a href={displayUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Live Page
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
