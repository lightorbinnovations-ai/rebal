import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface ShortLinkQRCodeProps {
  shortCode: string;
  fullPath: string;
  size?: number;
}

export const ShortLinkQRCode = ({
  shortCode,
  fullPath,
  size = 200,
}: ShortLinkQRCodeProps) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  
  const baseUrl = window.location.origin;
  const shortUrl = `${baseUrl}/r/${shortCode}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    // Create a canvas to convert SVG to PNG
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 20;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2;

    // White background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      
      // Download
      const link = document.createElement("a");
      link.download = `qr-code-${shortCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("QR code downloaded!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* QR Code */}
      <div
        ref={qrRef}
        className="bg-white p-4 rounded-xl shadow-sm border border-border"
      >
        <QRCodeSVG
          value={shortUrl}
          size={size}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Short URL Display */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Short URL</p>
        <p className="font-mono text-sm font-medium bg-muted px-3 py-1.5 rounded-lg">
          {shortUrl}
        </p>
      </div>

      {/* Destination */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-1">Redirects to</p>
        <p className="text-sm text-muted-foreground max-w-xs truncate">
          {fullPath}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Link
        </Button>
        <Button
          variant="default"
          className="flex-1"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-4 w-4" />
          Download PNG
        </Button>
      </div>

      {/* Tips */}
      <p className="text-xs text-muted-foreground text-center mt-2">
        Tip: Use this QR code on flyers, business cards, or property signs
      </p>
    </div>
  );
};
