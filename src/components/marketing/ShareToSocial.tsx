import { useState } from "react";
import { Copy, Share2, Check, Twitter, Facebook, Linkedin, MessageCircle, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Property, Company } from "@/types/company";

interface ShareToSocialProps {
  property: Property;
  company: Company;
  propertyUrl: string;
}

export const ShareToSocial = ({
  property,
  company,
  propertyUrl,
}: ShareToSocialProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isGeneratingOG, setIsGeneratingOG] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const captions = {
    twitter: `🏠 ${property.title}

💰 ${formatPrice(property.price)}${property.purpose === "Rent" ? "/year" : ""}
📍 ${property.location || "Nigeria"}
🏷️ For ${property.purpose}

${property.features?.slice(0, 3).map(f => `✓ ${f}`).join("\n") || ""}

View listing 👇
${propertyUrl}

#RealEstate #PropertyForSale #${property.property_type.replace(/\s+/g, "")} #NigeriaProperty`,

    facebook: `🏠 NEW LISTING: ${property.title}

${property.description?.slice(0, 200) || `Beautiful ${property.property_type.toLowerCase()} now available for ${property.purpose.toLowerCase()}.`}...

💰 Price: ${formatPrice(property.price)}${property.purpose === "Rent" ? "/year" : ""}
📍 Location: ${property.location || "Nigeria"}
🏷️ Type: ${property.property_type} for ${property.purpose}

${property.features?.length ? `Features:\n${property.features.slice(0, 5).map(f => `✅ ${f}`).join("\n")}` : ""}

👉 View full listing: ${propertyUrl}

Interested? Send us a message or call ${company.phone || "us"} today!

---
${company.name}${company.tagline ? ` - ${company.tagline}` : ""}`,

    linkedin: `🏢 Property Listing Alert

I'm excited to share this amazing ${property.property_type.toLowerCase()} listing:

📌 ${property.title}
💵 ${formatPrice(property.price)}${property.purpose === "Rent" ? "/year" : ""}
📍 ${property.location || "Nigeria"}

${property.description?.slice(0, 150) || ""}...

Perfect for ${property.purpose === "Rent" ? "tenants looking for quality accommodation" : "investors and homebuyers seeking value"}.

🔗 View full details: ${propertyUrl}

#RealEstate #Property #Investment #Nigeria #${property.property_type.replace(/\s+/g, "")}`,

    whatsapp: `🏠 *${property.title}*

💰 *${formatPrice(property.price)}*${property.purpose === "Rent" ? "/year" : ""}
📍 ${property.location || "Nigeria"}
🏷️ ${property.property_type} for ${property.purpose}

${property.description?.slice(0, 150) || "Beautiful property now available."}...

${property.features?.length ? `*Features:*\n${property.features.slice(0, 4).map(f => `• ${f}`).join("\n")}` : ""}

👉 *View listing:* ${propertyUrl}

Contact ${company.name} for more info!
${company.phone ? `📞 ${company.phone}` : ""}`,
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: "Caption copied to clipboard. Paste it on your social media.",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const generateOGImage = async () => {
    setIsGeneratingOG(true);
    try {
      const response = await supabase.functions.invoke("generate-property-og", {
        body: { propertyId: property.id },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate image");
      }

      toast({
        title: "Social Preview Generated!",
        description: "Your property preview image has been created. It will appear when sharing this link on social media.",
      });
    } catch (error: any) {
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate social preview image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingOG(false);
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="shrink-0"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share to Social Media</DialogTitle>
          <DialogDescription>
            Copy ready-to-post captions for each platform
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="twitter" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="twitter" className="gap-1">
              <Twitter className="h-4 w-4" />
              <span className="hidden sm:inline">X</span>
            </TabsTrigger>
            <TabsTrigger value="facebook" className="gap-1">
              <Facebook className="h-4 w-4" />
              <span className="hidden sm:inline">Facebook</span>
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="gap-1">
              <Linkedin className="h-4 w-4" />
              <span className="hidden sm:inline">LinkedIn</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-1">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="twitter" className="space-y-3">
            <div className="flex items-start gap-2">
              <Textarea
                value={captions.twitter}
                readOnly
                rows={12}
                className="text-sm"
              />
              <CopyButton text={captions.twitter} field="twitter" />
            </div>
            <p className="text-xs text-muted-foreground">
              Optimized for X/Twitter with hashtags. Character limit: 280 (may need trimming)
            </p>
          </TabsContent>

          <TabsContent value="facebook" className="space-y-3">
            <div className="flex items-start gap-2">
              <Textarea
                value={captions.facebook}
                readOnly
                rows={14}
                className="text-sm"
              />
              <CopyButton text={captions.facebook} field="facebook" />
            </div>
            <p className="text-xs text-muted-foreground">
              Detailed post for Facebook with call-to-action
            </p>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-3">
            <div className="flex items-start gap-2">
              <Textarea
                value={captions.linkedin}
                readOnly
                rows={12}
                className="text-sm"
              />
              <CopyButton text={captions.linkedin} field="linkedin" />
            </div>
            <p className="text-xs text-muted-foreground">
              Professional tone for LinkedIn with relevant hashtags
            </p>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-3">
            <div className="flex items-start gap-2">
              <Textarea
                value={captions.whatsapp}
                readOnly
                rows={12}
                className="text-sm"
              />
              <CopyButton text={captions.whatsapp} field="whatsapp" />
            </div>
            <p className="text-xs text-muted-foreground">
              Formatted with WhatsApp markdown (*bold*) for status or broadcasts
            </p>
          </TabsContent>
        </Tabs>

        <div className="pt-2 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={generateOGImage}
            disabled={isGeneratingOG}
          >
            {isGeneratingOG ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Image className="h-4 w-4 mr-2" />
            )}
            {isGeneratingOG ? "Generating Preview..." : "Generate Social Preview Image"}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => copyToClipboard(propertyUrl, "url")}
          >
            {copiedField === "url" ? (
              <Check className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Copy Property Link Only
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
