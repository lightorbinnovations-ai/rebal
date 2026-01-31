import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, ExternalLink, Loader2 } from "lucide-react";

interface ContentSettings {
  about: {
    title: string;
    hero: string;
    mission: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
  };
}

const defaultContent: ContentSettings = {
  about: {
    title: "About REBAL",
    hero: "Your trusted platform for real estate property management",
    mission: "Empowering real estate professionals with modern tools",
  },
  contact: {
    email: "rebalpros@gmail.com",
    phone: "",
    address: "",
  },
  seo: {
    metaTitle: "REBAL - Real Estate Business Automation & Listings",
    metaDescription: "Create your mini-website, share properties anywhere, and track inquiries. The all-in-one platform for real estate professionals.",
    keywords: "real estate, property management, property listings, Nigeria",
  },
};

export default function AdminContent() {
  const { signOut, isLoading: authLoading, user } = useAdminAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [content, setContent] = useState<ContentSettings>(defaultContent);

  // Load content from platform_settings on mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("key, value")
          .in("key", ["content_about", "content_contact", "content_seo"]);

        if (error) throw error;

        if (data && data.length > 0) {
          const newContent = { ...defaultContent };
          data.forEach((item) => {
            if (item.key === "content_about" && item.value) {
              newContent.about = item.value as ContentSettings["about"];
            } else if (item.key === "content_contact" && item.value) {
              newContent.contact = item.value as ContentSettings["contact"];
            } else if (item.key === "content_seo" && item.value) {
              newContent.seo = item.value as ContentSettings["seo"];
            }
          });
          setContent(newContent);
        }
      } catch (error) {
        console.error("Error loading content:", error);
      } finally {
        setIsLoadingContent(false);
      }
    };

    if (!authLoading) {
      loadContent();
    }
  }, [authLoading]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upsert each content section
      const updates = [
        { key: "content_about", value: content.about },
        { key: "content_contact", value: content.contact },
        { key: "content_seo", value: content.seo },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .upsert(
            {
              key: update.key,
              value: update.value,
              updated_by: user?.id,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      toast({
        title: "Content saved",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Error saving content",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Content Management"
      description="Edit platform pages and SEO settings"
      isLoading={authLoading || isLoadingContent}
      onSignOut={signOut}
    >
      <Tabs defaultValue="about" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-max">
              <TabsTrigger value="about" className="text-xs sm:text-sm whitespace-nowrap">About Us</TabsTrigger>
              <TabsTrigger value="contact" className="text-xs sm:text-sm whitespace-nowrap">Contact</TabsTrigger>
              <TabsTrigger value="seo" className="text-xs sm:text-sm whitespace-nowrap">SEO</TabsTrigger>
              <TabsTrigger value="legal" className="text-xs sm:text-sm whitespace-nowrap">Legal</TabsTrigger>
            </TabsList>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto shrink-0">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About Us Page</CardTitle>
              <CardDescription>
                Edit the content displayed on the About page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="about-title">Page Title</Label>
                <Input
                  id="about-title"
                  value={content.about.title}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      about: { ...prev.about, title: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about-hero">Hero Text</Label>
                <Textarea
                  id="about-hero"
                  value={content.about.hero}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      about: { ...prev.about, hero: e.target.value },
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about-mission">Mission Statement</Label>
                <Textarea
                  id="about-mission"
                  value={content.about.mission}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      about: { ...prev.about, mission: e.target.value },
                    }))
                  }
                  rows={4}
                />
              </div>
              <Button variant="outline" asChild>
                <a href="/about" target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview Page
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update platform contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email Address</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={content.contact.email}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Phone Number</Label>
                <Input
                  id="contact-phone"
                  value={content.contact.phone}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value },
                    }))
                  }
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-address">Address</Label>
                <Textarea
                  id="contact-address"
                  value={content.contact.address}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, address: e.target.value },
                    }))
                  }
                  rows={2}
                  placeholder="Enter your business address"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>
                Optimize platform pages for search engines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">Default Meta Title</Label>
                <Input
                  id="seo-title"
                  value={content.seo.metaTitle}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, metaTitle: e.target.value },
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  {content.seo.metaTitle.length}/60 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">Default Meta Description</Label>
                <Textarea
                  id="seo-description"
                  value={content.seo.metaDescription}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, metaDescription: e.target.value },
                    }))
                  }
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {content.seo.metaDescription.length}/160 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-keywords">Keywords</Label>
                <Input
                  id="seo-keywords"
                  value={content.seo.keywords}
                  onChange={(e) =>
                    setContent((prev) => ({
                      ...prev,
                      seo: { ...prev.seo, keywords: e.target.value },
                    }))
                  }
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Terms & Conditions
                </CardTitle>
                <CardDescription>
                  View and edit terms of service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <a href="/terms" target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Terms Page
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Privacy Policy
                </CardTitle>
                <CardDescription>
                  View and edit privacy policy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <a href="/privacy" target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Privacy Page
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
