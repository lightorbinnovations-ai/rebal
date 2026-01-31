import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  Building2,
  MessageSquare,
  BarChart3,
  Users,
  Palette,
  Settings,
  Gift,
  Globe,
  Shield,
  CreditCard,
  HelpCircle,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  Zap,
  Target,
  TrendingUp,
  Image,
  Share2,
  Bell,
  FileText,
  Lock,
  Crown,
  Banknote,
  Link,
  QrCode,
  Heart,
  Download,
  Eye,
  Clock,
  Star,
  Megaphone,
  Smartphone,
  Wallet,
  BadgeCheck,
  Keyboard
} from "lucide-react";
import { useDashboard } from "@/contexts/DashboardContext";

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  articles: {
    title: string;
    content: string;
    steps?: string[];
    tips?: string[];
  }[];
}

const guideSections: GuideSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    badge: "Start Here",
    description: "Essential first steps to set up your REBAL account",
    articles: [
      {
        title: "What is REBAL?",
        content: "REBAL stands for Real Estate Business And Listings. It's an all-in-one platform that gives real estate agents, property developers, and companies a professional online presence to showcase properties and connect with clients. Think of it as your own property website that you can share with anyone.",
        steps: [
          "Your own professional website at rebal.site/your-business-name",
          "Showcase unlimited properties with beautiful images and details",
          "Receive inquiries directly when clients fill contact forms",
          "Track how many people view your properties",
          "Share easily on WhatsApp, Facebook, Instagram, and more"
        ],
        tips: [
          "No technical skills needed - everything is point and click",
          "Changes appear instantly on your public page",
          "Works perfectly on phones, tablets, and computers"
        ]
      },
      {
        title: "Your First Steps After Signing Up",
        content: "Follow these simple steps to get your property page live and ready to share with clients.",
        steps: [
          "Complete your business profile with your company name and contact details",
          "Upload your company logo (makes your page look professional)",
          "Add your first property with good photos and accurate details",
          "Share your page link on WhatsApp and social media",
          "Check your dashboard regularly for new inquiries"
        ],
        tips: [
          "The setup checklist on your dashboard shows your progress",
          "You can edit anything anytime - don't worry about getting it perfect first time"
        ]
      },
      {
        title: "Understanding Your Dashboard",
        content: "Your dashboard is the control center for everything. Here's what each section does in simple terms:",
        steps: [
          "Overview: Your home base showing stats, recent activity, and quick actions",
          "Properties: Add, edit, and manage all your property listings",
          "Inquiries: Read and respond to messages from potential clients",
          "Analytics: See how many people visit your page and which properties are popular",
          "Links: Create short, easy-to-share links for your properties",
          "Referrals: Invite other agents and earn rewards",
          "Branding: Customize colors and fonts to match your brand (Pro plan)",
          "Settings: Update your account, subscription, and business details"
        ]
      },
      {
        title: "Your Public Page Explained",
        content: "Every REBAL account gets a free professional website that shows your properties to the world. This is what your clients see when you share your link.",
        steps: [
          "Your page URL looks like: rebal.site/your-business-name",
          "It displays your logo, business name, and contact information",
          "All your active properties appear with images and details",
          "Visitors can filter properties by type, location, and price",
          "Each property has its own page with gallery and contact form",
          "When clients fill the form, you get notified immediately"
        ],
        tips: [
          "Click 'View Public Page' in the sidebar to see how clients see you",
          "Share this link on your WhatsApp status, business cards, or social media bios"
        ]
      }
    ]
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    icon: Keyboard,
    badge: "Pro Tip",
    description: "Navigate faster with keyboard shortcuts",
    articles: [
      {
        title: "Command Palette (Ctrl + K)",
        content: "The command palette is the fastest way to navigate your dashboard. Press Ctrl + K (or ⌘ + K on Mac) to open a search dialog where you can quickly jump to any page or perform actions.",
        steps: [
          "Press Ctrl + K to open the command palette",
          "Start typing to search for pages, settings, or actions",
          "Use arrow keys to navigate results",
          "Press Enter to execute the selected command",
          "Press Escape to close the palette"
        ],
        tips: [
          "The palette searches page names, actions, and keywords",
          "You can also toggle dark/light mode from the palette",
          "Quick actions like 'Add New Property' are at the top"
        ]
      },
      {
        title: "Available Keyboard Shortcuts",
        content: "Speed up your workflow by using keyboard shortcuts. Press Ctrl + / (or ⌘ + / on Mac) anytime to see all available shortcuts.",
        steps: [
          "Ctrl + K: Open command palette (search anything)",
          "Ctrl + N: Add a new property quickly",
          "Ctrl + ,: Open settings",
          "Ctrl + /: Show keyboard shortcuts dialog",
          "Ctrl + Shift + D: Go to dashboard overview",
          "Ctrl + Shift + P: Go to properties list",
          "Ctrl + Shift + A: View analytics",
          "Ctrl + Shift + I: View inquiries",
          "Ctrl + Shift + B: Go to branding settings",
          "Ctrl + Shift + L: Manage short links",
          "Ctrl + Shift + H: Open documentation"
        ],
        tips: [
          "On Mac, use ⌘ (Command) instead of Ctrl",
          "Shortcuts don't work when typing in text fields",
          "A reminder popup will appear occasionally to help you remember"
        ]
      },
      {
        title: "Why Use Shortcuts?",
        content: "Keyboard shortcuts help power users navigate the dashboard much faster than clicking through menus.",
        steps: [
          "Save time by jumping directly to any section",
          "Keep your hands on the keyboard while working",
          "Quickly add new properties without reaching for the mouse",
          "Navigate between sections seamlessly"
        ],
        tips: [
          "Start with Ctrl + K - it's the most powerful shortcut",
          "The command palette lets you do everything without memorizing individual shortcuts"
        ]
      }
    ]
  },
  {
    id: "properties",
    title: "Managing Properties",
    icon: Building2,
    description: "Everything about adding, editing, and organizing your property listings",
    articles: [
      {
        title: "Adding a New Property",
        content: "Properties are the heart of your REBAL page. Each property you add gets its own dedicated page with images, description, and contact form.",
        steps: [
          "Click 'Properties' in the sidebar menu",
          "Click the 'Add Property' button (big + icon)",
          "Enter the property title (e.g., '3 Bedroom Flat in Lekki')",
          "Select property type (House, Land, Apartment, etc.)",
          "Choose the purpose (For Sale, For Rent, Short Let, Lease)",
          "Enter the price in Naira",
          "Select the state and city/area where the property is located",
          "Upload a main image - this shows in listings",
          "Add more gallery images to show different rooms and angles",
          "Paste a Video URL (optional) - perfect for virtual tours",
          "Add features like bedrooms, bathrooms, toilets, parking spaces",
          "Write a detailed description highlighting key selling points",
          "Click 'Save Property' to publish"
        ],
        tips: [
          "Use high-quality, well-lit photos - they make a huge difference",
          "For video tours: Upload your video to Google Drive, copy the link (make sure it's public), and paste it in the Video URL field.",
          "Write descriptions that answer common questions buyers have",
          "Be accurate with details to build trust with clients"
        ]
      },
      {
        title: "Property Types and Purposes",
        content: "REBAL supports all common Nigerian property types. Choose the right ones so clients can find your listings easily.",
        steps: [
          "Property Types: Land, House, Apartment/Flat, Duplex, Commercial, Office Space, Warehouse, Shop",
          "Purposes: For Sale (buying outright), For Rent (monthly/yearly), Short Let (daily/weekly), Lease (long-term rental)",
          "Status Options: Available (actively marketing), Sold (deal closed), Reserved (offer in progress), Under Offer (negotiations ongoing)"
        ],
        tips: [
          "Update status immediately when a property sells - keeps your page credible",
          "Clients can filter by type and purpose, so accurate labeling helps them find you"
        ]
      },
      {
        title: "Property Images - Best Practices",
        content: "Great photos are the #1 factor in attracting clients. Here's how to make your listings stand out.",
        steps: [
          "Main image: The first image clients see - make it your best shot",
          "Gallery images: Add up to 10 photos showing living room, bedrooms, kitchen, bathrooms, exterior",
          "Take photos in daylight for best lighting",
          "Show the property clean and tidy",
          "Include photos of special features (pool, garden, view)",
          "Supported formats: JPG, PNG, WebP - images are automatically optimized"
        ],
        tips: [
          "Landscape orientation looks better than portrait",
          "Blurry or dark photos turn clients away - retake if needed",
          "Show exterior and compound - clients want to see everything"
        ]
      },
      {
        title: "Editing and Managing Properties",
        content: "You can change any property details at any time. Changes appear on your public page immediately.",
        steps: [
          "Go to Properties in the sidebar",
          "Find the property you want to modify",
          "Click the three-dot menu (⋯) on the property card",
          "Select 'Edit' to change details or images",
          "Select 'Delete' to remove the property permanently",
          "Use status dropdown to mark as Sold, Reserved, etc.",
          "Changes save automatically when you click Update"
        ],
        tips: [
          "Don't delete sold properties immediately - mark as Sold first, shows your track record",
          "Update prices as market changes to stay competitive"
        ]
      },
    ]
  },
  {
    id: "inquiries",
    title: "Handling Inquiries",
    icon: MessageSquare,
    description: "How to receive and respond to messages from potential clients",
    articles: [
      {
        title: "How Inquiries Work",
        content: "When someone visits your property page and fills the contact form, their message appears in your Inquiries section. This is how you capture leads.",
        steps: [
          "Client visits your page and sees a property they like",
          "They fill the contact form with their name, phone, email, and message",
          "You receive a notification (in-app and optionally by email)",
          "The inquiry appears in your Inquiries list with full details",
          "You can see which property they're asking about",
          "Respond to them directly via phone, WhatsApp, or email"
        ],
        tips: [
          "Respond quickly - fast responses lead to more sales",
          "The notification bell in your dashboard shows unread inquiry count"
        ]
      },
      {
        title: "Viewing and Managing Inquiries",
        content: "All your leads are organized in one place. Here's how to manage them effectively.",
        steps: [
          "Click 'Inquiries' in the sidebar to see all messages",
          "Messages are sorted by date (newest first)",
          "Click on any inquiry to see full details",
          "You'll see: client's name, phone, email, their message, which property they asked about, when they sent it",
          "Use the quick action buttons to call, email, or WhatsApp",
          "Mark as 'Responded' to track your follow-ups"
        ]
      },
      {
        title: "Lead Scoring - Prioritize Hot Leads",
        content: "Not all leads are equal. REBAL automatically scores leads based on engagement to help you focus on the most promising ones.",
        steps: [
          "🔥 Hot Leads: Provided phone number, viewed multiple properties, spent time on your page",
          "🌡️ Warm Leads: Viewed a few properties, provided email, moderate engagement",
          "❄️ Cold Leads: Quick form submission, minimal engagement, might be casual browsers"
        ],
        tips: [
          "Focus on hot leads first - they're most likely to buy or rent",
          "Don't ignore warm leads - they might need more nurturing",
          "Lead scoring updates automatically based on visitor behavior"
        ]
      },
      {
        title: "Best Practices for Responding",
        content: "How you respond to inquiries can make or break a deal. Here are proven tips.",
        steps: [
          "Respond within 30 minutes if possible - speed matters",
          "Call if they provided a phone number - personal touch wins",
          "Reference the specific property they asked about",
          "Answer their questions directly",
          "Offer to schedule a viewing",
          "Follow up if you don't hear back within 2-3 days"
        ],
        tips: [
          "Save common responses as templates on your phone for quick replies",
          "If calling, introduce yourself with your business name for professionalism"
        ]
      }
    ]
  },
  {
    id: "short-links",
    title: "Short Links",
    icon: Link,
    description: "Create memorable, easy-to-share links for your properties",
    articles: [
      {
        title: "What Are Short Links?",
        content: "Short links are custom, easy-to-remember URLs for your properties. Instead of a long, complicated link, you get something like 'rebal.site/l/lekki3bed'.",
        steps: [
          "Go to Links in the sidebar",
          "Click 'Create Short Link'",
          "Select the property you want to link to",
          "Enter a custom short code (e.g., 'lekki3bed' or 'ikoyi-mansion')",
          "Copy the generated link to share anywhere"
        ],
        tips: [
          "Use descriptive codes that hint at the property",
          "Short links are perfect for SMS, WhatsApp status, and verbal sharing",
          "Track how many times each link is clicked"
        ]
      },
      {
        title: "QR Codes for Properties",
        content: "Every short link automatically gets a QR code. Perfect for printed materials like flyers, banners, and business cards.",
        steps: [
          "Create or view a short link",
          "Click 'Download QR Code'",
          "Add the QR code to your marketing materials",
          "Clients can scan with their phone camera to view the property instantly"
        ],
        tips: [
          "Print QR codes on property signage for 'For Sale' boards",
          "Include on flyers and brochures for open houses",
          "Great for exhibitions and property fairs"
        ]
      }
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    icon: BarChart3,
    description: "Understand your traffic and measure your success",
    articles: [
      {
        title: "Dashboard Stats Explained",
        content: "Your dashboard shows key numbers that tell you how your page is performing.",
        steps: [
          "Total Properties: Number of listings on your page",
          "Page Views: How many times people visited your page",
          "Property Views: How many times people clicked on individual properties",
          "Inquiries: Number of contact form submissions received",
          "Conversion Rate: Percentage of visitors who inquire (views ÷ inquiries)"
        ],
        tips: [
          "Higher property views than page views means people are exploring your listings",
          "Low inquiries but high views? Check if your contact form is visible"
        ]
      },
      {
        title: "Detailed Analytics Page",
        content: "The Analytics section shows deeper insights with charts and trends over time.",
        steps: [
          "View daily, weekly, or monthly trends",
          "See which properties get the most views",
          "Track inquiry sources and patterns",
          "Identify your busiest days and times",
          "Compare performance across different periods"
        ],
        tips: [
          "Check analytics weekly to spot trends",
          "Properties with low views may need better photos or descriptions",
          "More views usually come from consistent social media sharing"
        ]
      },
      {
        title: "Using Insights to Improve",
        content: "Data is only useful if you act on it. Here's how to use analytics to grow your business.",
        steps: [
          "Low page views? Share your link more often on social media and WhatsApp",
          "High views but low inquiries? Improve your property descriptions or add more photos",
          "Certain properties getting more attention? Feature them more prominently",
          "Track which sharing methods bring the most traffic"
        ]
      }
    ]
  },
  {
    id: "referrals",
    title: "Referral Program",
    icon: Gift,
    description: "Earn 10% commission on every payment from agents you refer",
    articles: [
      {
        title: "How the Referral Program Works",
        content: "Invite other real estate agents to REBAL and earn 10% of every payment they make — forever! Here's the complete flow:",
        steps: [
          "1. Share Your Link: Go to Referrals and copy your unique referral link",
          "2. They Sign Up: When someone creates an account using your link, they're permanently linked to you",
          "3. They Subscribe: When your referral purchases a paid plan (Starter, Pro, or Business)",
          "4. You Earn 10%: You automatically receive 10% of their payment in your wallet",
          "5. Repeat Forever: Every time they renew or upgrade, you earn 10% again"
        ],
        tips: [
          "No signup bonus — you earn when your referrals PAY for subscriptions",
          "Commission is calculated on every payment, not just the first one",
          "Your earnings are credited instantly when payment is confirmed",
          "You get notified whenever you earn a commission"
        ]
      },
      {
        title: "Understanding Your Referral Dashboard",
        content: "Your referral dashboard shows all the stats you need to track your earnings.",
        steps: [
          "Link Clicks: How many people clicked your referral link",
          "Signups: How many people created accounts using your link",
          "Conversion Rate: The percentage of clicks that became signups",
          "Total Referrals: All agents who signed up with your link",
          "Active: Referrals who have made at least one payment",
          "Total Earned: Your lifetime commission earnings",
          "Wallet Balance: Available to withdraw to your bank"
        ],
        tips: [
          "Status 'Awaiting Payment' = They signed up but haven't paid yet",
          "Status 'Active' = They're a paying subscriber, you're earning commissions",
          "Check 'Commission History' tab to see each payment and your 10% cut"
        ]
      },
      {
        title: "Your Referral Code",
        content: "Your referral code is unique to your account. Here's how to use it effectively.",
        steps: [
          "Find your code on the Referrals page (format: REF-XXXXX)",
          "Share the full link: rebal.site/auth?ref=YOUR-CODE",
          "When people sign up, they appear in your referrals list",
          "The link never expires and tracks all conversions automatically"
        ],
        tips: [
          "Share in real estate WhatsApp groups for maximum reach",
          "Add your referral link to your email signature",
          "Post it on your social media bio"
        ]
      },
      {
        title: "Withdrawing Your Earnings",
        content: "When you've accumulated referral earnings, you can withdraw them to your bank account.",
        steps: [
          "Go to Referrals page",
          "Scroll to 'Wallet Withdrawals' section",
          "See your current wallet balance",
          "Click 'Request Withdrawal' (must have ₦3,000+)",
          "Enter the amount you want to withdraw",
          "Provide your bank details: Bank name, Account number (10 digits), Account name",
          "Submit your request",
          "Admin reviews and processes (usually within 1-3 business days)",
          "You'll get notified when the transfer is complete"
        ],
        tips: [
          "Minimum withdrawal is ₦3,000",
          "Double-check your bank details to avoid delays",
          "Pending withdrawals are deducted from available balance",
          "Track all withdrawal requests and their status on the Referrals page"
        ]
      },
      {
        title: "Commission Examples",
        content: "Here's how much you can earn based on your referrals' subscription payments:",
        steps: [
          "Starter Plan (₦3,000/month): You earn ₦300 per payment",
          "Pro Plan (₦8,000/month): You earn ₦800 per payment",
          "Business Plan (₦20,000/month): You earn ₦2,000 per payment",
          "Yearly Plans: You earn 10% of the annual payment upfront",
          "Example: 10 referrals on Pro plan = ₦8,000/month passive income"
        ],
        tips: [
          "Focus on quality referrals who will actually use the platform",
          "Help your referrals succeed — when they upgrade, you earn more",
          "There's no limit to how many people you can refer"
        ]
      }
    ]
  },
  {
    id: "branding",
    title: "Custom Branding",
    icon: Palette,
    badge: "Pro",
    description: "Make your page look uniquely yours with custom colors and styling",
    articles: [
      {
        title: "Setting Your Brand Colors",
        content: "Pro plan users can customize their page colors to match their company branding.",
        steps: [
          "Go to Branding in the sidebar",
          "Set Primary Color: Used for buttons, links, and accents",
          "Set Secondary Color: Used for backgrounds and highlights",
          "Preview changes in real-time before saving",
          "Click Save to apply to your public page"
        ],
        tips: [
          "Use your official brand colors for consistency",
          "Ensure good contrast so text is easy to read",
          "Darker primary colors often look more professional"
        ]
      },
      {
        title: "Logo and Images",
        content: "Your logo appears in your page header and footer. Make sure it represents your brand well.",
        steps: [
          "Upload your company logo (PNG with transparent background works best)",
          "Set a hero/banner image for your page header",
          "Add a profile/about image if you want a personal touch",
          "Images are automatically resized and optimized"
        ],
        tips: [
          "Use a square or horizontal logo for best display",
          "Hero images should be at least 1200px wide for quality"
        ]
      },
      {
        title: "Typography and Button Styles",
        content: "Choose fonts and button shapes that match your brand personality.",
        steps: [
          "Heading Font: Used for titles and section headers",
          "Body Font: Used for descriptions and regular text",
          "Button Style: Choose Rounded (modern), Pill (playful), or Square (formal)"
        ]
      }
    ]
  },
  {
    id: "sharing",
    title: "Sharing Your Page",
    icon: Share2,
    description: "Get your properties in front of potential clients",
    articles: [
      {
        title: "Social Media Previews (OG Images)",
        content: "When you share your page or property links on WhatsApp, Facebook, Twitter, or other platforms, a preview image and description appears automatically. This is called an Open Graph (OG) preview. Making sure these look great helps attract more clicks.",
        steps: [
          "Go to Branding in the sidebar",
          "Upload a Hero Image or Company Logo - this becomes your default social preview",
          "For properties, the main property image is automatically used as the preview",
          "The title, price, and description are pulled from your property details",
          "Share your link - platforms will show your custom image, not the default REBAL logo"
        ],
        tips: [
          "Hero images work best at 1200x630 pixels (Facebook/LinkedIn recommended size)",
          "If no hero image or logo is set, the default REBAL image is used",
          "Each property uses its own image when shared individually",
          "Use the 'Social Preview' card in Branding to see how your page will appear when shared"
        ]
      },
      {
        title: "Sharing on WhatsApp",
        content: "WhatsApp is the most effective way to share properties in Nigeria. Here's how to do it well.",
        steps: [
          "Copy your page link from the dashboard",
          "Share to your WhatsApp status (reaches all contacts)",
          "Send directly to individuals or groups",
          "When shared, WhatsApp shows a preview with your property image",
          "Use 'Share Property' button on individual properties for specific listings"
        ],
        tips: [
          "Update your WhatsApp status regularly with new listings",
          "Create a broadcast list for serious buyers",
          "Make sure you've uploaded a hero image so your brand appears in previews"
        ]
      },
      {
        title: "Social Media Sharing",
        content: "REBAL automatically creates beautiful previews when you share on social media.",
        steps: [
          "Copy your link and paste on Facebook, Instagram bio, Twitter/X",
          "The preview automatically shows your property image and title",
          "Use individual property links for specific listings",
          "Add a compelling caption with price and key features"
        ],
        tips: [
          "Post consistently - once a day or every other day",
          "Use relevant hashtags: #RealEstateNigeria #PropertyForSale #Lagos",
          "Preview appearance depends on your uploaded hero image or logo"
        ]
      },
      {
        title: "Creating Marketing Materials",
        content: "REBAL helps you create professional marketing materials for your properties.",
        steps: [
          "Property Flyers: Download printable flyers with property details and QR code",
          "QR Codes: Generate scannable codes for print materials",
          "Social Graphics: Share-ready images for social media",
          "All materials include your branding and contact info"
        ],
        tips: [
          "Print flyers for open houses and property viewings",
          "Put QR codes on 'For Sale' signage at the property"
        ]
      }
    ]
  },
  {
    id: "saved-searches",
    title: "Saved Searches",
    icon: Heart,
    description: "Save search criteria and get notified of new matching properties",
    articles: [
      {
        title: "How Saved Searches Work",
        content: "Logged-in users can save their search criteria on the marketplace. When new properties match their criteria, they receive email notifications automatically.",
        steps: [
          "Browse the public marketplace at /properties",
          "Apply filters (location, price, property type, etc.)",
          "Click 'Save Search' button",
          "Name your search (e.g., '3 Bed in Lekki under 5M')",
          "Enable email notifications to get alerts",
          "When new properties match, you'll receive an email"
        ],
        tips: [
          "This feature is great for clients actively looking for properties",
          "Agents can use it to track competing listings in their area"
        ]
      }
    ]
  },
  {
    id: "settings",
    title: "Account Settings",
    icon: Settings,
    description: "Manage your account, profile, and business details",
    articles: [
      {
        title: "Updating Your Profile",
        content: "Keep your business information current so clients can reach you.",
        steps: [
          "Go to Settings in the sidebar",
          "Profile tab shows your business details",
          "Update: Business name, tagline, description",
          "Contact: Phone, email, address, WhatsApp number",
          "Social Media: Facebook, Instagram, Twitter/X, LinkedIn links",
          "Click Save Changes when done"
        ],
        tips: [
          "Add a WhatsApp number - clients prefer messaging",
          "Keep your description short but informative"
        ]
      },
      {
        title: "Security Settings",
        content: "Keep your account secure with these settings.",
        steps: [
          "Change your password regularly (if using email login)",
          "Review your login history",
          "Manage connected accounts (Google, etc.)"
        ]
      }
    ]
  },
  {
    id: "subscription",
    title: "Plans & Billing",
    icon: CreditCard,
    description: "Subscription options and payment management",
    articles: [
      {
        title: "Available Plans",
        content: "Choose the plan that fits your business size and needs.",
        steps: [
          "Free Trial: 14 days, 1 property, basic features - perfect for testing",
          "Starter (₦3,000/month): 10 properties, basic analytics, email support",
          "Pro (₦8,000/month): 50 properties, custom branding, lead scoring, priority support",
          "Business (₦20,000/month): Unlimited properties, custom domain (add-on), API access, verification badge, dedicated support"
        ],
        tips: [
          "Annual billing saves you up to 17%",
          "You can upgrade or downgrade anytime"
        ]
      },
      {
        title: "Upgrading Your Plan",
        content: "Ready for more features? Here's how to upgrade.",
        steps: [
          "Go to Settings > Subscription tab",
          "View available plans and compare features",
          "Select the plan you want",
          "Complete payment via Paystack (card, bank transfer, USSD)",
          "New features activate immediately after payment"
        ]
      },
      {
        title: "Payment History and Invoices",
        content: "Track all your payments and download invoices for your records.",
        steps: [
          "Go to Settings > Billing tab",
          "See all past payments with dates and amounts",
          "View payment status and method",
          "Your subscription auto-renews unless cancelled"
        ]
      }
    ]
  },
  {
    id: "custom-domain",
    title: "Custom Domain",
    icon: Globe,
    badge: "Business",
    description: "Use your own domain name for a professional touch",
    articles: [
      {
        title: "Setting Up Your Custom Domain",
        content: "Premium plan users can connect their own domain (e.g., www.yourcompany.com) to their REBAL page.",
        steps: [
          "Go to Settings > Features tab",
          "Enter your domain name (e.g., properties.yourcompany.com)",
          "Add DNS records at your domain registrar (GoDaddy, Namecheap, etc.):",
          "  • A Record: @ pointing to 185.158.133.1",
          "  • TXT Record: _rebal with value rebal_verify=YOUR_TOKEN",
          "Wait for DNS to propagate (can take up to 48 hours)",
          "Click 'Verify DNS' to confirm",
          "Once verified, your custom domain is live"
        ],
        tips: [
          "Use a subdomain like 'properties.yoursite.com' if you have an existing website",
          "Check dnschecker.org to see if your DNS has propagated"
        ]
      }
    ]
  },
  {
    id: "verification",
    title: "Verification Badge",
    icon: BadgeCheck,
    badge: "Business",
    description: "Get verified to build trust with clients",
    articles: [
      {
        title: "What is Verification?",
        content: "The verification badge shows clients that your business has been validated by REBAL. It appears next to your name on your public page.",
        steps: [
          "Verified businesses get a blue checkmark badge",
          "Increases trust with potential clients",
          "Shows you're a legitimate, established business",
          "Only available on Premium plan"
        ]
      },
      {
        title: "Applying for Verification",
        content: "Here's how to get your business verified.",
        steps: [
          "Go to Settings > Features tab",
          "Click 'Request Verification'",
          "Provide your CAC registration or business documents",
          "Submit valid ID of business owner",
          "Our team reviews your application (1-3 business days)",
          "You'll be notified once approved",
          "Badge appears automatically on your page"
        ],
        tips: [
          "Have your documents ready before starting",
          "Ensure all information matches your business registration"
        ]
      }
    ]
  },
  {
    id: "notifications",
    title: "Notifications",
    icon: Bell,
    description: "Stay informed about important updates",
    articles: [
      {
        title: "Types of Notifications",
        content: "REBAL keeps you informed with real-time notifications about important activities.",
        steps: [
          "🔔 New Inquiry: When someone submits a contact form on your property",
          "💳 Payment Confirmed: When your subscription payment goes through",
          "🎁 Referral Reward: When someone signs up using your referral code",
          "⏰ Subscription Reminder: 3 days before your plan expires",
          "💸 Withdrawal Update: When your withdrawal request status changes"
        ]
      },
      {
        title: "Managing Notifications",
        content: "Access and manage your notifications from the header.",
        steps: [
          "Click the bell icon in the top navigation bar",
          "Red badge shows number of unread notifications",
          "Click any notification to see details",
          "Click 'Mark all as read' to clear the badge",
          "Old notifications are automatically archived"
        ]
      }
    ]
  },
  {
    id: "support",
    title: "Getting Help",
    icon: HelpCircle,
    description: "How to get assistance when you need it",
    articles: [
      {
        title: "Submitting a Support Ticket",
        content: "Have a problem or question? Submit a support ticket and we'll help.",
        steps: [
          "Go to Settings > Support tab",
          "Click 'New Ticket' button",
          "Choose a category (Technical, Billing, Feature Request, etc.)",
          "Describe your issue in detail",
          "Attach screenshots if helpful",
          "Submit and await response",
          "Pro/Premium users get priority support"
        ],
        tips: [
          "Be specific about what you're experiencing",
          "Include steps to reproduce technical issues",
          "Check the Help docs first - your answer might be here!"
        ]
      },
      {
        title: "Contact Information",
        content: "Reach us directly for urgent matters.",
        steps: [
          "Email: rebalpros@gmail.com",
          "Phone: +234 802 510 0844",
          "WhatsApp: Available for Pro/Premium users",
          "Response time: Usually within 24 hours"
        ]
      }
    ]
  }
];

const DashboardHelpPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { company } = useDashboard();

  const filteredSections = guideSections.filter(section => {
    const matchesSearch =
      section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.articles.some(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesSearch;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          Help Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Everything you need to know about using REBAL
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help (e.g., 'add property', 'referral', 'branding')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Card */}
      {!searchQuery && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Start Checklist
            </CardTitle>
            <CardDescription>
              Get your property page live in 5 minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { step: 1, title: "Profile", icon: CheckCircle2, done: !!company?.name },
                { step: 2, title: "Logo", icon: Image, done: !!company?.logo_url },
                { step: 3, title: "Property", icon: Building2, done: false },
                { step: 4, title: "Share", icon: Share2, done: false },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background/50">
                  <div className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full flex-shrink-0 ${item.done ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                    }`}>
                    {item.done ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <span className="text-sm sm:text-base font-bold">{item.step}</span>}
                  </div>
                  <span className={`text-xs sm:text-sm font-medium ${item.done ? "text-green-600" : ""}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Highlights Section */}
      {!searchQuery && (
        <Card className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary" />
              Platform Features
            </CardTitle>
            <CardDescription>
              Everything you need to grow your real estate business
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Property Listings", icon: Building2, description: "Add unlimited properties with images, pricing, and location details" },
                { title: "Lead Management", icon: MessageSquare, description: "Receive and track inquiries with smart lead scoring" },
                { title: "Analytics Dashboard", icon: BarChart3, description: "Track views, engagement, and conversion metrics" },
                { title: "Short Links & QR", icon: Link, description: "Create memorable links and printable QR codes" },
                { title: "Custom Branding", icon: Palette, description: "Match your brand with custom colors and fonts" },
                { title: "Referral Program", icon: Gift, description: "Earn rewards by inviting other agents" },
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentation Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {section.title}
                      {section.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {section.badge === "Pro" && <Crown className="h-3 w-3 mr-1" />}
                          {section.badge === "Premium" && <Star className="h-3 w-3 mr-1" />}
                          {section.badge}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {section.articles.map((article, index) => (
                  <AccordionItem key={index} value={`${section.id}-${index}`} className="border-b-0">
                    <AccordionTrigger className="hover:no-underline py-3">
                      <span className="text-sm font-medium text-left">{article.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-4">
                      <p>{article.content}</p>

                      {article.steps && (
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">Steps:</p>
                          <ol className="list-decimal list-inside space-y-1.5 ml-2">
                            {article.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {article.tips && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <p className="font-medium text-primary text-xs uppercase tracking-wide mb-2">💡 Tips</p>
                          <ul className="space-y-1">
                            {article.tips.map((tip, tipIndex) => (
                              <li key={tipIndex} className="text-sm flex items-start gap-2">
                                <ArrowRight className="h-3 w-3 mt-1 text-primary shrink-0" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Still Need Help */}
      <Card className="border-secondary/30">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                <HelpCircle className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Still need help?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact our support team for personalized assistance
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <a
                href="mailto:rebalpros@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </a>
              <a
                href="tel:+2348025100844"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Phone className="h-4 w-4" />
                Call Us
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHelpPage;
