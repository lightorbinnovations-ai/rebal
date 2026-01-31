import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Property, Company } from "@/types/company";

interface PropertyFlyerProps {
  property: Property;
  company: Company;
}

export const PropertyFlyer = ({ property, company }: PropertyFlyerProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const generatePDF = async () => {
    if (!flyerRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      pdf.save(`${property.title.replace(/\s+/g, "-").toLowerCase()}-flyer.pdf`);

      toast({
        title: "Flyer Downloaded",
        description: "Your property flyer has been generated and saved.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate the flyer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          PDF Flyer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Property Flyer Preview</DialogTitle>
          <DialogDescription>
            Preview and download your property flyer
          </DialogDescription>
        </DialogHeader>

        {/* Flyer Preview */}
        <div
          ref={flyerRef}
          className="bg-white p-6 rounded-lg border shadow-sm"
          style={{ minHeight: "500px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{company.name}</h2>
              {company.tagline && (
                <p className="text-sm text-gray-600">{company.tagline}</p>
              )}
            </div>
            <Badge
              className={
                property.status === "Available"
                  ? "bg-green-100 text-green-800"
                  : property.status === "Sold"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {property.status}
            </Badge>
          </div>

          {/* Property Image */}
          {property.main_image_url && (
            <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={property.main_image_url}
                alt={property.title}
                className="w-full h-48 object-cover"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Property Details */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>

            <div className="flex items-center gap-4 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {property.property_type}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                For {property.purpose}
              </span>
            </div>

            <p className="text-3xl font-bold text-green-600">
              {formatPrice(property.price)}
              {property.purpose === "Rent" && (
                <span className="text-sm font-normal text-gray-500">/year</span>
              )}
            </p>

            {property.location && (
              <p className="text-gray-600">
                📍 {property.location}
                {property.address && ` - ${property.address}`}
              </p>
            )}

            {property.description && (
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                {property.description}
              </p>
            )}

            {property.features && property.features.length > 0 && (
              <div className="pt-2">
                <h3 className="font-semibold text-gray-900 mb-2">Features:</h3>
                <div className="flex flex-wrap gap-2">
                  {property.features.slice(0, 6).map((feature, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                    >
                      ✓ {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact Footer */}
          <div className="mt-6 pt-4 border-t bg-gray-50 -mx-6 -mb-6 p-4 rounded-b-lg">
            <p className="font-semibold text-gray-900 mb-2">Contact Us:</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {company.phone && <span>📞 {company.phone}</span>}
              {company.email && <span>✉️ {company.email}</span>}
              {company.whatsapp && <span>💬 {company.whatsapp}</span>}
            </div>
            {company.address && (
              <p className="text-sm text-gray-600 mt-2">📍 {company.address}</p>
            )}
          </div>
        </div>

        <Button onClick={generatePDF} disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? "Generating..." : "Download PDF Flyer"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
