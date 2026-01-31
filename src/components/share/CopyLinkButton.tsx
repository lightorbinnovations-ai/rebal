import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { getDisplayUrl, getSocialPreviewUrl } from "@/lib/socialPreview";

interface CopyLinkButtonProps {
  path: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  customDomain?: string | null;
}

export const CopyLinkButton = ({
  path,
  className = "",
  variant = "outline",
  size = "sm",
  showLabel = true,
  customDomain,
}: CopyLinkButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // IMPORTANT:
      // For social sharing previews, we must copy the social-preview URL
      // because crawlers don't execute JS on the branded SPA page.
      const shareUrl = getSocialPreviewUrl(path, customDomain);
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied!", {
        description: `This link will show the correct preview on WhatsApp/Facebook.\nClean URL: ${getDisplayUrl(path, customDomain)}`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`gap-2 ${className}`}
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {showLabel && (copied ? "Copied!" : "Copy Share Link")}
    </Button>
  );
};
