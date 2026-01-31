import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { Shield } from "lucide-react";

const Privacy = () => {
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
        <div className="absolute top-20 left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl floating-element" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Your Privacy Matters</span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold font-heading text-foreground mb-4">
              Privacy Policy
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
                  Your privacy is important to us at REBAL. This Privacy Policy explains how we collect, use, 
                  store, and protect your information when you use our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  1. Information We Collect
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect the following types of information:
                </p>
                
                <h3 className="text-lg font-medium text-foreground mb-2">Account Data</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                  <li>Full name</li>
                  <li>Email address (including via Google Sign-in)</li>
                  <li>Company or business name</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2">Property Data</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                  <li>Property listings and descriptions</li>
                  <li>Property images and media</li>
                  <li>Pricing and location information</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2">Contact Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                  <li>Phone numbers</li>
                  <li>Business email addresses</li>
                  <li>Social media handles</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2">Technical Data</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Device type and browser information</li>
                  <li>IP address (for basic analytics)</li>
                  <li>Usage patterns and page interactions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  2. How We Use Your Information
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Create and display public property pages</li>
                  <li>Enable communication between property seekers and owners</li>
                  <li>Improve platform performance and user experience</li>
                  <li>Provide analytics and insights to property owners</li>
                  <li>Send service-related notifications and updates</li>
                  <li>Prevent fraud and maintain platform security</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  3. Public vs Private Data
                </h2>
                
                <h3 className="text-lg font-medium text-foreground mb-2">Public Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The following information may be visible on your public pages:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-4">
                  <li>Company name and logo</li>
                  <li>Property listings and details</li>
                  <li>Contact information (as chosen by the owner)</li>
                  <li>Social media links</li>
                </ul>

                <h3 className="text-lg font-medium text-foreground mb-2">Private Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  The following information remains private:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>Login credentials and passwords</li>
                  <li>Internal analytics data</li>
                  <li>Administrative settings</li>
                  <li>Billing and payment information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  4. Cookies & Analytics
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  REBAL uses cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences</li>
                  <li>Track platform performance</li>
                  <li>Analyze usage patterns to improve our service</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  We do not use invasive tracking or sell your browsing data to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  5. Data Storage & Security
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We take data security seriously and implement reasonable safeguards including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Secure, encrypted data storage</li>
                  <li>Cloud-based image and file storage with access controls</li>
                  <li>Limited access to authorized systems only</li>
                  <li>Regular security reviews and updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  6. Third-Party Services
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  REBAL integrates with third-party services including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Google Sign-In for authentication</li>
                  <li>Cloud hosting and storage providers</li>
                  <li>Analytics tools for platform improvement</li>
                  <li>Payment processors (for subscription plans)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  These third-party services have their own privacy policies. REBAL is not responsible for 
                  their privacy practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  7. Data Sharing
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong>REBAL does not sell your personal data.</strong> We may share information only:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>When required by law or legal process</li>
                  <li>To provide core platform functionality</li>
                  <li>With service providers who assist our operations (under strict confidentiality)</li>
                  <li>To protect the rights and safety of REBAL, our users, or the public</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  8. Your Rights
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                  <li>Access and view your personal data</li>
                  <li>Edit or update your information at any time</li>
                  <li>Delete your property listings</li>
                  <li>Request complete account deletion</li>
                  <li>Opt out of non-essential communications</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  To exercise these rights, contact us at rebalpros@gmail.com.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  9. Children's Privacy
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  REBAL is not intended for users under the age of 18. We do not knowingly collect personal 
                  information from children. If you believe a child has provided us with personal information, 
                  please contact us immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  10. Policy Updates
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  We may update this Privacy Policy from time to time. When we make significant changes, we 
                  will notify users through the platform or via email. Continued use of REBAL after policy 
                  updates constitutes acceptance of the revised terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-heading text-foreground mb-4">
                  11. Contact Information
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  For questions about this Privacy Policy or your personal data, please contact us:
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

export default Privacy;
