import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Building2, Palette, Share2, MessageSquare, CheckCircle2, BarChart3, Link, Gift, Settings, Bell, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const steps = [
  {
    title: "Welcome to REBAL! 🎉",
    description: "REBAL (Real Estate Business And Listings) gives you a professional property website. Let's show you how to make the most of it.",
    icon: Building2,
    tips: [
      "Your website is already live and shareable",
      "Add properties to showcase your listings",
      "Receive inquiries when clients contact you",
    ],
  },
  {
    title: "Add Your Properties",
    description: "Each property gets its own shareable page with beautiful images, details, and a contact form for leads.",
    icon: Building2,
  tips: [
      "Click 'Add Property' in the Properties section",
      "Upload high-quality photos for better engagement",
      "Write compelling descriptions that highlight key features",
    ],
    action: { label: "Go to Properties", url: "/dashboard/properties/new" },
  },
  {
    title: "Customize Your Brand",
    description: "Make your page stand out with your logo, colors, and style. First impressions matter!",
    icon: Palette,
    tips: [
      "Upload your company logo",
      "Choose colors that match your brand (Pro plan)",
      "Add your contact info and social media links",
    ],
    action: { label: "Go to Branding", url: "/dashboard/branding" },
  },
  {
    title: "Share & Get Leads",
    description: "Share your page on WhatsApp, social media, and anywhere. When clients inquire, you'll see them in your dashboard.",
    icon: Share2,
    tips: [
      "Copy your page link and share on WhatsApp status",
      "Links show beautiful previews automatically",
      "Check Inquiries section for new leads daily",
    ],
  },
  {
    title: "Track Your Performance",
    description: "See how many people view your page and properties. Use insights to improve your marketing.",
    icon: BarChart3,
    tips: [
      "Analytics shows page views and property clicks",
      "Lead scoring helps you prioritize hot prospects",
      "Website health score tracks your page completeness",
    ],
  },
  {
    title: "Create Short Links",
    description: "Make memorable, easy-to-share links for your properties. Perfect for SMS, WhatsApp, and print materials.",
    icon: Link,
    tips: [
      "Create custom short codes like 'lekki3bed'",
      "Download QR codes for flyers and signage",
      "Track how many times each link is clicked",
    ],
  },
  {
    title: "Earn with Referrals",
    description: "Invite other real estate agents and earn ₦500 for each person who signs up using your link.",
    icon: Gift,
    tips: [
      "Find your referral link in the Referrals section",
      "Share in real estate WhatsApp groups",
      "Withdraw earnings to your bank account",
    ],
  },
  {
    title: "Stay Notified",
    description: "Never miss an inquiry or important update. REBAL keeps you informed in real-time.",
    icon: Bell,
    tips: [
      "Bell icon shows new notifications",
      "Get alerts for inquiries, payments, and referrals",
      "Subscription reminders before expiration",
    ],
  },
  {
    title: "You're All Set! 🚀",
    description: "You now know all the essentials. Start adding properties and watch your business grow!",
    icon: CheckCircle2,
    tips: [
      "Access Help docs anytime from the sidebar",
      "Upgrade to Pro for custom branding",
      "Contact support if you need any help",
    ],
  },
];

export const OnboardingModal = ({ isOpen, onClose, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden max-w-[calc(100vw-1rem)] sm:max-w-lg rounded-xl">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground p-6 pb-12">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 z-10 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <step.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/70">Step {currentStep + 1} of {steps.length}</p>
              <DialogTitle className="text-xl font-bold text-white">{step.title}</DialogTitle>
            </div>
          </div>
          
          <p className="text-white/90 text-sm leading-relaxed">
            {step.description}
          </p>
          
          {/* Progress dots */}
          <div className="absolute bottom-4 left-6 flex gap-1">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "w-4 bg-white" 
                    : index < currentStep 
                      ? "w-1.5 bg-white/70" 
                      : "w-1.5 bg-white/30"
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Tips list */}
          <div className="space-y-3 mb-6">
            {step.tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-border/50"
              >
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                  {index + 1}
                </div>
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={isFirstStep}
              className="rounded-xl"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            
            <div className="flex gap-2">
              {!isLastStep && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="rounded-xl text-muted-foreground"
                >
                  Skip Tour
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="rounded-xl min-w-[120px]"
              >
                {isLastStep ? "Get Started" : "Next"}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
