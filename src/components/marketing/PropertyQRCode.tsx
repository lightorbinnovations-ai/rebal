import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface PropertyQRCodeProps {
  propertyUrl: string;
  propertyTitle: string;
  companyName?: string;
}

export const PropertyQRCode = ({
  propertyUrl,
  propertyTitle,
  companyName,
}: PropertyQRCodeProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const downloadQRCode = () => {
    const svg = document.getElementById("property-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.drawImage(img, 0, 0, 400, 400);

      const link = document.createElement("a");
      link.download = `${propertyTitle.replace(/\s+/g, "-").toLowerCase()}-qr-code.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "QR Code Downloaded",
        description: "The QR code has been saved to your device.",
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <QrCode className="h-4 w-4 mr-2" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Property QR Code</DialogTitle>
          <DialogDescription>
            Scan this QR code to view the property listing
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 bg-white rounded-xl shadow-sm">
            <QRCodeSVG
              id="property-qr-code"
              value={propertyUrl}
              size={200}
              level="H"
              includeMargin
              imageSettings={
                companyName
                  ? undefined
                  : undefined
              }
            />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {propertyTitle}
          </p>
          <Button onClick={downloadQRCode} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
