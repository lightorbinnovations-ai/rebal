import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { FileText } from "lucide-react";

const Terms = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 hero-gradient opacity-30" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl floating-element" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Legal</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 21, 2025
            </p>
          </ScrollReveal>
        </div>
      </section>

      <main className="container mx-auto px-4 lg:px-8 py-12 max-w-4xl">
        <ScrollReveal>
          <div className="bg-card rounded-2xl border border-border/50 shadow-xl p-8 lg:p-12">
            <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
              <section>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  These Terms govern your access to and use of the REBAL platform. By accessing or using REBAL, 
                  you agree to be bound by these Terms & Conditions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  By creating an account, accessing, or using the REBAL platform, you acknowledge that you have read, 
                  understood, and agree to be bound by these Terms. These terms apply to all users including property 
                  agents, agencies, developers, and visitors browsing the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  2. Platform Description
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  REBAL is a property listing and sharing platform that enables real estate professionals to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Create and manage property listings</li>
                  <li>Generate professional public property pages</li>
                  <li>Access an owner dashboard for property management</li>
                  <li>Share listings on social media platforms (WhatsApp, Facebook, X, Telegram, etc.)</li>
                  <li>Track analytics and manage inquiries</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  3. Account Responsibilities
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  When you create an account on REBAL, you agree to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Keep your login credentials secure and confidential</li>
                  <li>Be responsible for all activity that occurs under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  REBAL reserves the right to suspend or terminate accounts that violate these terms or engage in 
                  suspicious activity.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  4. Company & Property Content Rules
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Users must own or be legally authorized to list the properties they publish. The following content 
                  is strictly prohibited:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Fake or non-existent property listings</li>
                  <li>Misleading prices or property information</li>
                  <li>Stolen or unauthorized images</li>
                  <li>Illegal, fraudulent, or disputed properties</li>
                  <li>Content that infringes on intellectual property rights</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  REBAL reserves the right to remove any content without prior notice if it violates these guidelines.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  5. Public Pages Disclaimer
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  REBAL is a technology platform and is <strong>not</strong> a property broker, real estate agent, 
                  or intermediary. REBAL does not verify property ownership, conduct due diligence on listings, 
                  or guarantee the accuracy of any information posted by users. All property transactions and 
                  communications between buyers and sellers occur at the parties' own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  6. Payments & Subscription Plans
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  REBAL may offer paid subscription plans with additional features. By subscribing to a paid plan:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>You agree to pay the applicable fees as displayed at the time of purchase</li>
                  <li>Prices may change with reasonable notice</li>
                  <li>Refunds are only provided as explicitly stated in our refund policy</li>
                  <li>Subscription renewals occur automatically unless cancelled</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  7. Platform Availability
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  REBAL strives to maintain platform availability but may occasionally update features, perform 
                  maintenance, or temporarily suspend services. We reserve the right to modify, update, or 
                  discontinue any features at our discretion without prior notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  8. Intellectual Property
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>REBAL owns:</strong> The platform design, code, branding, logos, and all proprietary 
                  technology powering the service.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Users retain:</strong> Rights to their business names, property content, images, and 
                  other materials they upload to the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  9. Limitation of Liability
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  To the fullest extent permitted by law, REBAL shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Property disputes between users</li>
                  <li>Financial loss arising from transactions facilitated through the platform</li>
                  <li>Third-party misuse of information posted on public pages</li>
                  <li>Service interruptions or technical issues</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  The platform is provided "as-is" without warranties of any kind.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  10. Termination of Use
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  REBAL may suspend or terminate accounts that violate these Terms. Users may stop using the 
                  platform at any time by deleting their account. Upon termination, users' public pages and 
                  property listings will be removed from the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  11. Governing Law
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the Federal 
                  Republic of Nigeria. Any disputes arising from these Terms shall be subject to the exclusive 
                  jurisdiction of Nigerian courts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  12. Contact Information
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For questions about these Terms & Conditions, please contact us:
                </p>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li><strong>Email:</strong> rebalpros@gmail.com</li>
                  <li><strong>Phone:</strong> +234 802 510 0844</li>
                  <li><strong>Address:</strong> FCT, Abuja, Nigeria</li>
                </ul>
              </section>
            </div>
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
