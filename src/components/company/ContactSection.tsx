import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Company, Property } from "@/types/company";
import { submitInquiry } from "@/lib/publicApi";
import { inquirySchema, sanitizeInquiryData, type InquiryFormValues } from "@/lib/validationSchemas";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  MessageCircle,
} from "lucide-react";
import { SocialLinks } from "./SocialLinks";
import { ScrollReveal } from "@/hooks/useScrollReveal";

interface ContactSectionProps {
  company: Company;
  properties?: Property[];
}

export const ContactSection = ({ company, properties = [] }: ContactSectionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
      property_id: "",
    },
    mode: "onBlur",
  });

  const handleSubmit = async (data: InquiryFormValues) => {
    setIsSubmitting(true);

    try {
      const sanitizedData = sanitizeInquiryData(data);
      
      await submitInquiry({
        company_id: company.id!,
        ...sanitizedData,
      });

      toast.success("Your message has been sent successfully!");
      form.reset();
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      if (error.message?.includes("Too many requests")) {
        toast.error("You're sending too many messages. Please wait a few minutes.");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MessageCircle className="h-4 w-4" />
            Get in Touch
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Contact {company.name}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions about our properties? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
          </p>
        </ScrollReveal>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <ScrollReveal direction="left">
            <Card className="shadow-lg">
              <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@example.com"
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {properties.length > 0 && (
                    <FormField
                      control={form.control}
                      name="property_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property of Interest (Optional)</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              disabled={isSubmitting}
                              {...field}
                            >
                              <option value="">Select a property</option>
                              {properties.map((property) => (
                                <option key={property.id} value={property.id}>
                                  {property.title}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about your inquiry..."
                            rows={5}
                            disabled={isSubmitting}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full gap-2"
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
              </CardContent>
            </Card>
          </ScrollReveal>

          {/* Contact Info */}
          <ScrollReveal direction="right" className="space-y-8">
            {/* Contact Details */}
            <div className="space-y-6">
              {company.phone && (
                <ScrollReveal delay={100}>
                  <a
                    href={`tel:${company.phone}`}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Phone className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-semibold text-foreground">{company.phone}</p>
                    </div>
                  </a>
                </ScrollReveal>
              )}

              {company.email && (
                <ScrollReveal delay={200}>
                  <a
                    href={`mailto:${company.email}`}
                    className="flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-muted transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Mail className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold text-foreground">{company.email}</p>
                    </div>
                  </a>
                </ScrollReveal>
              )}

              {company.address && (
                <ScrollReveal delay={300}>
                  <div className="flex items-center gap-4 p-4 bg-card rounded-xl">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-semibold text-foreground">{company.address}</p>
                    </div>
                  </div>
                </ScrollReveal>
              )}
            </div>

            {/* Social Links */}
            <ScrollReveal delay={400}>
              <div className="p-6 bg-card rounded-xl">
                <h3 className="font-semibold text-foreground mb-4">Connect With Us</h3>
                <SocialLinks company={company} size="lg" />
              </div>
            </ScrollReveal>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
