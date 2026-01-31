import { Type } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Font options available for selection
const FONT_OPTIONS = [
  { value: "Inter", label: "Inter", category: "Sans-serif" },
  { value: "Open Sans", label: "Open Sans", category: "Sans-serif" },
  { value: "Roboto", label: "Roboto", category: "Sans-serif" },
  { value: "Poppins", label: "Poppins", category: "Sans-serif" },
  { value: "Montserrat", label: "Montserrat", category: "Sans-serif" },
  { value: "Lato", label: "Lato", category: "Sans-serif" },
  { value: "Playfair Display", label: "Playfair Display", category: "Serif" },
  { value: "Merriweather", label: "Merriweather", category: "Serif" },
  { value: "Georgia", label: "Georgia", category: "Serif" },
  { value: "Bebas Neue", label: "Bebas Neue", category: "Display" },
  { value: "Oswald", label: "Oswald", category: "Display" },
];

// Button style options
const BUTTON_STYLES = [
  { value: "rounded", label: "Rounded", description: "Softly rounded corners", radius: "0.5rem" },
  { value: "pill", label: "Pill", description: "Fully rounded ends", radius: "9999px" },
  { value: "square", label: "Square", description: "Sharp corners", radius: "0" },
];

interface TypographySectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  isLoading: boolean;
}

export const TypographySection = ({ form, isLoading }: TypographySectionProps) => {
  const primaryColor = form.watch("primary_color") || "#0F172A";
  const secondaryColor = form.watch("secondary_color") || "#3B82F6";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Typography & Buttons
        </CardTitle>
        <CardDescription>
          Choose fonts and button styles for your brand
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Selection */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="font_heading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Heading Font</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem
                        key={font.value}
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        <span className="flex items-center gap-2">
                          {font.label}
                          <span className="text-xs text-muted-foreground">
                            ({font.category})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Used for titles and headings
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="font_body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Body Font</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a font" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem
                        key={font.value}
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        <span className="flex items-center gap-2">
                          {font.label}
                          <span className="text-xs text-muted-foreground">
                            ({font.category})
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Used for paragraphs and regular text
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Button Style */}
        <FormField
          control={form.control}
          name="button_style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Button Style</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-3">
                  {BUTTON_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => field.onChange(style.value)}
                      className={`p-4 rounded-lg border transition-all ${
                        field.value === style.value
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div
                        className="w-full h-8 mb-2"
                        style={{
                          backgroundColor: primaryColor,
                          borderRadius: style.radius,
                        }}
                      />
                      <p className="text-sm font-medium">{style.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {style.description}
                      </p>
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preview */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-sm font-medium">Preview:</p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 text-white text-sm font-medium"
              style={{
                backgroundColor: primaryColor,
                borderRadius: BUTTON_STYLES.find((s) => s.value === form.watch("button_style"))?.radius || "0.5rem",
              }}
            >
              Primary Button
            </button>
            <button
              type="button"
              className="px-4 py-2 text-white text-sm font-medium"
              style={{
                backgroundColor: secondaryColor,
                borderRadius: BUTTON_STYLES.find((s) => s.value === form.watch("button_style"))?.radius || "0.5rem",
              }}
            >
              Secondary Button
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TypographySection;
