import { Palette, Sparkles, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Predefined color palettes for easy selection
const COLOR_PRESETS = [
  { name: "Navy Blue", primary: "#0F172A", secondary: "#3B82F6" },
  { name: "Emerald", primary: "#064E3B", secondary: "#10B981" },
  { name: "Purple", primary: "#4C1D95", secondary: "#8B5CF6" },
  { name: "Rose", primary: "#881337", secondary: "#F43F5E" },
  { name: "Amber", primary: "#78350F", secondary: "#F59E0B" },
  { name: "Teal", primary: "#134E4A", secondary: "#14B8A6" },
  { name: "Slate", primary: "#1E293B", secondary: "#64748B" },
  { name: "Indigo", primary: "#312E81", secondary: "#6366F1" },
];

interface ColorPickerSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  isLoading: boolean;
  extractedColors: { primary: string; secondary: string } | null;
  isExtractingColors: boolean;
  applyExtractedColors: () => void;
  dismissExtractedColors: () => void;
}

export const ColorPickerSection = ({
  form,
  isLoading,
  extractedColors,
  isExtractingColors,
  applyExtractedColors,
  dismissExtractedColors,
}: ColorPickerSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Brand Colors
        </CardTitle>
        <CardDescription>
          Choose colors that represent your brand on your public page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Extracted colors suggestion (from logo) */}
        {extractedColors && !isExtractingColors && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Colors detected from your logo
              </div>
              <button
                type="button"
                onClick={dismissExtractedColors}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div
                  className="w-8 h-8 rounded-l border"
                  style={{ backgroundColor: extractedColors.primary }}
                  title="Primary"
                />
                <div
                  className="w-8 h-8 rounded-r border"
                  style={{ backgroundColor: extractedColors.secondary }}
                  title="Secondary"
                />
              </div>
              <button
                type="button"
                onClick={applyExtractedColors}
                className="text-sm font-medium text-primary hover:underline"
              >
                Use these colors
              </button>
            </div>
          </div>
        )}

        {/* Color Presets */}
        <div>
          <FormLabel className="text-sm font-medium mb-3 block">Quick Presets</FormLabel>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  form.setValue("primary_color", preset.primary, { shouldDirty: true });
                  form.setValue("secondary_color", preset.secondary, { shouldDirty: true });
                }}
                className="p-2 rounded-lg border hover:border-primary transition-colors group"
                title={preset.name}
              >
                <div className="flex gap-1">
                  <div
                    className="w-full h-8 rounded-l"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <div
                    className="w-full h-8 rounded-r"
                    style={{ backgroundColor: preset.secondary }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate group-hover:text-foreground">
                  {preset.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Color Pickers */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="primary_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={field.value || "#0F172A"}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isLoading}
                        className="w-12 h-10 rounded cursor-pointer border"
                      />
                    </div>
                    <Input
                      placeholder="#0F172A"
                      disabled={isLoading}
                      {...field}
                      className="font-mono uppercase"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Used for headers, buttons, and key UI elements
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="secondary_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Secondary Color</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={field.value || "#3B82F6"}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isLoading}
                        className="w-12 h-10 rounded cursor-pointer border"
                      />
                    </div>
                    <Input
                      placeholder="#3B82F6"
                      disabled={isLoading}
                      {...field}
                      className="font-mono uppercase"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Used for accents, links, and highlights
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Footer Colors */}
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="footer_bg_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footer Background</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={field.value || "#0F172A"}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isLoading}
                        className="w-12 h-10 rounded cursor-pointer border"
                      />
                    </div>
                    <Input
                      placeholder="#0F172A"
                      disabled={isLoading}
                      {...field}
                      className="font-mono uppercase"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="footer_text_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footer Text</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="relative">
                      <input
                        type="color"
                        value={field.value || "#FFFFFF"}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isLoading}
                        className="w-12 h-10 rounded cursor-pointer border"
                      />
                    </div>
                    <Input
                      placeholder="#FFFFFF"
                      disabled={isLoading}
                      {...field}
                      className="font-mono uppercase"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorPickerSection;
