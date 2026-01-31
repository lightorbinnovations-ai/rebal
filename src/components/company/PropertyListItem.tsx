import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Property } from "@/types/company";
import { MapPin, Eye, ImageIcon, Share2, MessageCircle, Facebook, X, Link2, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { getShareUrls } from "@/lib/socialPreview";

interface PropertyListItemProps {
  property: Property;
  companySlug: string;
}

export const PropertyListItem = ({ property, companySlug }: PropertyListItemProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleViewDetails = () => {
    navigate(`/${companySlug}/property/${property.slug}`);
  };

  const propertyPath = `/${companySlug}/property/${property.slug}`;
  const shareText = `${property.title} - ${formatPrice(property.price)} | ${property.property_type} for ${property.purpose}`;
  const shareUrls = getShareUrls(propertyPath, shareText);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Copy the shareable URL (edge function for proper OG)
      const shareableUrl = shareUrls.shareable;
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast({ title: "Share link copied!", description: "This link will show the correct preview on social media" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleShare = (platform: keyof typeof shareUrls, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = shareUrls[platform];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    }
  };

  return (
    <Card className="group overflow-hidden card-hover flex flex-col sm:flex-row">
      {/* Property Image */}
      <div className="relative overflow-hidden sm:w-64 sm:min-w-64 flex-shrink-0">
        {property.main_image_url ? (
          <OptimizedImage
            src={property.main_image_url}
            alt={property.title}
            aspectRatio="4/3"
            className="transition-transform duration-500 group-hover:scale-105 sm:h-full sm:aspect-auto"
            fallback={
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            }
          />
        ) : (
          <div className="aspect-[4/3] sm:aspect-auto sm:h-full w-full bg-muted flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          </div>
        )}

        {/* Badges - Mobile */}
        <div className="absolute top-3 left-3 flex gap-2 sm:hidden">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {property.property_type}
          </Badge>
          <Badge
            variant={property.purpose === "Sale" ? "default" : "outline"}
            className="bg-background/90 backdrop-blur-sm"
          >
            For {property.purpose}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          {/* Badges - Desktop */}
          <div className="hidden sm:flex gap-2 mb-2">
            <Badge variant="secondary">
              {property.property_type}
            </Badge>
            <Badge variant={property.purpose === "Sale" ? "default" : "outline"}>
              For {property.purpose}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-1">
            {property.title}
          </h3>

          {/* Location */}
          {property.location && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{property.location}</span>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3 hidden sm:block">
              {property.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 mt-auto">
          {/* Price */}
          <p className="text-xl font-bold text-primary dark:text-secondary">
            {formatPrice(property.price)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Share Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-9 w-9"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover">
                <DropdownMenuItem onClick={(e) => handleShare("whatsapp", e)}>
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleShare("facebook", e)}>
                  <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                  Facebook
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleShare("twitter", e)}>
                  <X className="h-4 w-4 mr-2" />
                  X
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink}>
                  {copied ? (
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Button */}
            <Button
              variant="default"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-secondary/90"
              onClick={handleViewDetails}
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View Details</span>
              <span className="sm:hidden">View</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};