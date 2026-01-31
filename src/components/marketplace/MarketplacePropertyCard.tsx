import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { MapPin, Building2, BadgeCheck, Crown, ImageIcon, Share2, MessageCircle, Facebook, X, Link2, Check } from "lucide-react";
import { MarketplaceProperty } from "@/hooks/useMarketplaceProperties";
import { getShareUrls } from "@/lib/socialPreview";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MarketplacePropertyCardProps {
  property: MarketplaceProperty;
}

export const MarketplacePropertyCard = ({ property }: MarketplacePropertyCardProps) => {
  const [copied, setCopied] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const propertyPath = `/${property.company_slug}/property/${property.slug}`;
  const shareText = `${property.title} - ${formatPrice(property.price)} | ${property.property_type} for ${property.purpose}`;
  const shareUrls = getShareUrls(propertyPath, shareText);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareUrls.shareable);
      setCopied(true);
      toast.success("Share link copied!", {
        description: "This link will show the correct preview on WhatsApp/Facebook"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = (platform: keyof typeof shareUrls, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = shareUrls[platform];
    if (url && typeof url === 'string') {
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    }
  };

  const getPriorityBadge = () => {
    if (property.priority_score >= 4) {
      return (
        <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white gap-1">
          <Crown className="h-3 w-3" />
          Business
        </Badge>
      );
    }
    if (property.priority_score >= 3) {
      return (
        <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
          Featured
        </Badge>
      );
    }
    return null;
  };

  const location = [property.city, property.state].filter(Boolean).join(", ");

  return (
    <Link to={propertyPath}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.main_image_url ? (
            <OptimizedImage
              src={property.main_image_url}
              alt={property.title}
              aspectRatio="4/3"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {getPriorityBadge()}

          {/* Share Button */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-blue-900 text-white hover:bg-blue-800 dark:bg-background/90 dark:text-foreground dark:hover:bg-background backdrop-blur-sm"
                  onClick={(e) => e.preventDefault()}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
                  {copied ? "Copied!" : "Copy Link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="absolute bottom-3 left-3 flex gap-2">
            <Badge variant="secondary">{property.property_type}</Badge>
            <Badge variant={property.purpose === "Sale" ? "default" : "outline"}>
              For {property.purpose}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Price */}
          <p className="text-2xl font-bold text-primary">
            {formatPrice(property.price)}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* Company Info */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {property.company_logo ? (
              <img
                src={property.company_logo}
                alt={property.company_name}
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <Building2 className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm text-muted-foreground truncate flex-1">
              {property.company_name}
            </span>
            {property.company_verified && (
              <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};