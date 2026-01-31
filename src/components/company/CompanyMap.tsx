import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompanyMapProps {
  address: string;
  className?: string;
}

export const CompanyMap = ({ address, className = "" }: CompanyMapProps) => {
  // Encode address for Google Maps embed URL
  const encodedAddress = encodeURIComponent(address);
  
  // Google Maps embed URL (free, no API key required for basic embed)
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
  
  // Google Maps directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div className="aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
        <iframe
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map showing ${address}`}
          className="w-full h-full"
        />
      </div>
      
      {/* Get Directions Button */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{address}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-2 flex-shrink-0"
        >
          <a 
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">Get Directions</span>
            <span className="sm:hidden">Directions</span>
          </a>
        </Button>
      </div>
    </div>
  );
};
