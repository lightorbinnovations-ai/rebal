import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I upgrade or downgrade my plan later?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. When you upgrade, you'll be charged the prorated difference. When you downgrade, the change takes effect at the end of your current billing period.",
  },
  {
    question: "Do my property links expire?",
    answer: "No, your property links never expire as long as your account is active. Even on the free plan, your links remain permanent and accessible.",
  },
  {
    question: "Will my pages appear on Google?",
    answer: "Yes! All REBAL pages are SEO-optimized and indexed by Google. Your company and property pages can appear in search results, helping potential clients find you organically.",
  },
  {
    question: "Can I use REBAL links on WhatsApp, Telegram, Facebook, and X?",
    answer: "Absolutely. REBAL links generate beautiful preview cards on all major platforms including WhatsApp, Telegram, Facebook, X (Twitter), LinkedIn, and more. Your properties will always look professional when shared.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes! We offer a 14-day free trial where you can list 1 property, create your company profile, and share links on social media. After the trial, choose from Starter (₦3,000/month), Pro (₦8,000/month), or Business (₦20,000/month) plans.",
  },
  {
    question: "How do inquiries get delivered to me?",
    answer: "Inquiries are delivered instantly via email and WhatsApp (on Pro and Business plans). You'll never miss a lead. All inquiries are also stored in your dashboard for easy tracking.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time with no penalties. Your account will remain active until the end of your current billing period.",
  },
];

export const PricingFAQ = () => {
  return (
    <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left font-semibold font-heading text-foreground hover:text-primary">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
