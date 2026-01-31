import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Copy,
  Share2,
  MessageCircle,
  Facebook,
  Linkedin,
  X,
  Mail,
  Check,
  ExternalLink,
} from "lucide-react";
import { getDisplayUrl, getShareUrls, getSocialPreviewUrl } from "@/lib/socialPreview";

interface ShareSectionProps {
  url: string;
  title: string;
  description?: string;
  variant?: "card" | "inline" | "compact";
  className?: string;
  customDomain?: string | null;
}

export const ShareSection = ({
  url,
  title,
  description,
  variant = "card",
  className = "",
  customDomain,
}: ShareSectionProps) => {
  const [copied, setCopied] = useState(false);

  // Normalize URL path
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  // Use branded display URL for copying (user-friendly)
  // Use branded display URL for copying (user-friendly)
  const brandedUrl = getDisplayUrl(normalizedPath, customDomain);

  // Use social-preview URL for platforms that need OG crawling
  const socialPreviewUrl = getSocialPreviewUrl(normalizedPath, customDomain);

  // Get share URLs - these use the edge function for proper OG tags
  const shareUrlsMap = getShareUrls(normalizedPath, title, undefined, customDomain);

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: shareUrlsMap.whatsapp,
      color: "hover:bg-green-500 hover:text-white hover:border-green-500",
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: shareUrlsMap.facebook,
      color: "hover:bg-blue-600 hover:text-white hover:border-blue-600",
    },
    {
      name: "X",
      icon: X,
      url: shareUrlsMap.twitter,
      color: "hover:bg-black hover:text-white hover:border-black dark:hover:bg-white dark:hover:text-black dark:hover:border-white",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: shareUrlsMap.linkedin,
      color: "hover:bg-blue-700 hover:text-white hover:border-blue-700",
    },
    {
      name: "Email",
      icon: Mail,
      // Email uses the branded URL since it doesn't crawl
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description || title)}%0A%0A${encodeURIComponent(brandedUrl)}`,
      color: "hover:bg-gray-600 hover:text-white hover:border-gray-600",
    },
  ];

  const handleCopy = async () => {
    try {
      // Copy the social preview URL so WhatsApp/Facebook/Twitter show correct OG
      await navigator.clipboard.writeText(socialPreviewUrl);
      setCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = socialPreviewUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      toast.success("Share link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          // Use social preview URL so the recipient sees correct OG preview
          url: socialPreviewUrl,
        });
      } catch (err) {
        // User cancelled or share failed, no need to show error
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      handleCopy();
    }
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="gap-2"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNativeShare}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Input
            value={brandedUrl}
            readOnly
            className="flex-1 bg-muted/50 text-sm"
          />
          <Button
            variant="outline"
            onClick={handleCopy}
            className="shrink-0 gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {shareLinks.map((link) => (
            <Button
              key={link.name}
              variant="outline"
              size="sm"
              asChild
              className={`gap-2 transition-all duration-200 ${link.color}`}
            >
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <link.icon className="h-4 w-4" />
                {link.name}
              </a>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-border/50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 dark:bg-secondary/10 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-primary dark:text-secondary" />
          </div>
          <div>
            <CardTitle className="text-lg">Share This Page</CardTitle>
            <CardDescription>
              Copy the link or share directly to social media
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Copy URL Section */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={brandedUrl}
              readOnly
              className="pr-10 bg-muted/50 font-mono text-xs sm:text-sm"
            />
            <a
              href={brandedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <Button
            onClick={handleCopy}
            className="shrink-0 gap-2 min-w-[80px] sm:min-w-[100px] bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
          </Button>
        </div>

        {/* Native Share Button (mobile-friendly) */}
        {"share" in navigator && (
          <Button
            variant="outline"
            onClick={handleNativeShare}
            className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 dark:border-secondary/20 dark:text-secondary dark:hover:bg-secondary/5"
          >
            <Share2 className="h-4 w-4" />
            Share via...
          </Button>
        )}

        {/* Social Media Buttons */}
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-3">Share on social media:</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {shareLinks.map((link) => (
              <Button
                key={link.name}
                variant="outline"
                size="sm"
                asChild
                className={`gap-1 transition-all duration-200 ${link.color}`}
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <link.icon className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{link.name}</span>
                </a>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
