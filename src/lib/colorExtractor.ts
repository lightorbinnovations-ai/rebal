/**
 * Color extraction utility for extracting dominant colors from images
 * Uses canvas to sample pixels and find the most prominent colors
 */

interface ExtractedColors {
  primary: string;
  secondary: string;
}

interface ColorCount {
  color: string;
  count: number;
  r: number;
  g: number;
  b: number;
}

// Convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// Calculate color brightness (0-255)
function getBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// Calculate color saturation (0-1)
function getSaturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

// Check if color is too close to white or black
function isNeutral(r: number, g: number, b: number): boolean {
  const brightness = getBrightness(r, g, b);
  const saturation = getSaturation(r, g, b);
  
  // Too bright (close to white)
  if (brightness > 240) return true;
  // Too dark (close to black)
  if (brightness < 15) return true;
  // Too gray (low saturation and mid brightness)
  if (saturation < 0.1 && brightness > 50 && brightness < 200) return true;
  
  return false;
}

// Calculate color distance (Euclidean)
function colorDistance(c1: ColorCount, c2: ColorCount): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

// Quantize color to reduce variations
function quantizeColor(r: number, g: number, b: number, factor: number = 24): [number, number, number] {
  return [
    Math.round(r / factor) * factor,
    Math.round(g / factor) * factor,
    Math.round(b / factor) * factor,
  ];
}

/**
 * Extract dominant colors from an image URL
 * Returns primary (darker, for backgrounds) and secondary (lighter, for accents)
 */
export async function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(null);
          return;
        }
        
        // Scale down for faster processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        const colorMap = new Map<string, ColorCount>();
        
        // Sample pixels
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];
          
          // Skip transparent pixels
          if (a < 128) continue;
          
          // Skip neutral colors
          if (isNeutral(r, g, b)) continue;
          
          const [qr, qg, qb] = quantizeColor(r, g, b);
          const key = `${qr},${qg},${qb}`;
          
          if (colorMap.has(key)) {
            const entry = colorMap.get(key)!;
            entry.count++;
          } else {
            colorMap.set(key, {
              color: rgbToHex(qr, qg, qb),
              count: 1,
              r: qr,
              g: qg,
              b: qb,
            });
          }
        }
        
        // Sort by frequency
        const sortedColors = Array.from(colorMap.values())
          .sort((a, b) => b.count - a.count);
        
        if (sortedColors.length === 0) {
          resolve(null);
          return;
        }
        
        // Get primary color (most frequent)
        const primaryColor = sortedColors[0];
        
        // Find secondary color that's visually distinct
        let secondaryColor = sortedColors[1];
        const minDistance = 80; // Minimum color distance for distinct colors
        
        for (let i = 1; i < sortedColors.length; i++) {
          if (colorDistance(primaryColor, sortedColors[i]) > minDistance) {
            secondaryColor = sortedColors[i];
            break;
          }
        }
        
        // Ensure we have both colors
        if (!secondaryColor) {
          secondaryColor = primaryColor;
        }
        
        // Determine which is darker (for primary) and lighter (for secondary)
        const primaryBrightness = getBrightness(primaryColor.r, primaryColor.g, primaryColor.b);
        const secondaryBrightness = getBrightness(secondaryColor.r, secondaryColor.g, secondaryColor.b);
        
        let finalPrimary: ColorCount;
        let finalSecondary: ColorCount;
        
        if (primaryBrightness <= secondaryBrightness) {
          finalPrimary = primaryColor;
          finalSecondary = secondaryColor;
        } else {
          finalPrimary = secondaryColor;
          finalSecondary = primaryColor;
        }
        
        // Make primary darker if needed (for better backgrounds)
        let adjustedPrimary = finalPrimary.color;
        if (getBrightness(finalPrimary.r, finalPrimary.g, finalPrimary.b) > 100) {
          // Darken the color
          const factor = 0.6;
          adjustedPrimary = rgbToHex(
            Math.round(finalPrimary.r * factor),
            Math.round(finalPrimary.g * factor),
            Math.round(finalPrimary.b * factor)
          );
        }
        
        // Make secondary brighter if needed (for better accents)
        let adjustedSecondary = finalSecondary.color;
        if (getBrightness(finalSecondary.r, finalSecondary.g, finalSecondary.b) < 100) {
          // Brighten the color
          const factor = 1.4;
          adjustedSecondary = rgbToHex(
            Math.min(255, Math.round(finalSecondary.r * factor)),
            Math.min(255, Math.round(finalSecondary.g * factor)),
            Math.min(255, Math.round(finalSecondary.b * factor))
          );
        }
        
        resolve({
          primary: adjustedPrimary,
          secondary: adjustedSecondary,
        });
      } catch (error) {
        console.error("Error extracting colors:", error);
        resolve(null);
      }
    };
    
    img.onerror = () => {
      console.error("Failed to load image for color extraction");
      resolve(null);
    };
    
    // Handle CORS for Supabase storage URLs
    img.src = imageUrl;
  });
}
