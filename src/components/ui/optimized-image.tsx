import { useState, useRef, useEffect, ImgHTMLAttributes, useMemo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onError"> {
  src: string;
  alt: string;
  aspectRatio?: "video" | "square" | "4/3" | "21/9" | "auto";
  blur?: boolean;
  priority?: boolean;
  fallback?: React.ReactNode;
  /** Low quality image placeholder URL for blur-up effect */
  lqip?: string;
  /** Enable dominant color extraction for placeholder */
  dominantColor?: string;
}

/**
 * OptimizedImage component with:
 * - Lazy loading via Intersection Observer
 * - Blur-up placeholder animation with LQIP support
 * - Dominant color placeholder option
 * - Smooth fade-in transition
 * - Error fallback handling
 */
export const OptimizedImage = ({
  src,
  alt,
  className,
  aspectRatio = "auto",
  blur = true,
  priority = false,
  fallback,
  lqip,
  dominantColor,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [lqipLoaded, setLqipLoaded] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Generate a placeholder color from the image URL for consistency
  const placeholderColor = useMemo(() => {
    if (dominantColor) return dominantColor;
    if (!src) return "hsl(210, 40%, 96.1%)"; // Default muted color if src is missing

    // Create a consistent hash-based color from src
    let hash = 0;
    for (let i = 0; i < src.length; i++) {
      hash = src.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 20%, 85%)`;
  }, [src, dominantColor]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "200px", // Start loading 200px before entering viewport
        threshold: 0,
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const handleLqipLoad = () => {
    setLqipLoaded(true);
  };

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square",
    "4/3": "aspect-[4/3]",
    "21/9": "aspect-[21/9]",
    auto: "",
  };

  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={cn(
          "bg-muted flex items-center justify-center overflow-hidden",
          aspectClasses[aspectRatio],
          className
        )}
      >
        {fallback || (
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        )}
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn(
        "relative overflow-hidden",
        aspectClasses[aspectRatio],
        className
      )}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* LQIP (Low Quality Image Placeholder) layer */}
      {blur && lqip && !isLoaded && (
        <img
          src={lqip}
          alt=""
          aria-hidden="true"
          onLoad={handleLqipLoad}
          className={cn(
            "absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-300",
            lqipLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {/* Animated placeholder background */}
      {blur && !isLoaded && !lqip && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${placeholderColor} 0%, hsl(var(--muted-foreground) / 0.05) 100%)`,
          }}
        />
      )}

      {/* Shimmer effect while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 shimmer-loading" />
      )}

      {/* Actual image - only render when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className={cn(
            "w-full h-full object-cover transition-all duration-700 ease-out",
            isLoaded
              ? "opacity-100 scale-100 blur-0"
              : "opacity-0 scale-[1.02] blur-sm"
          )}
          {...props}
        />
      )}
    </div>
  );
};

/**
 * Lightweight thumbnail variant optimized for grid views
 */
interface ThumbnailImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const ThumbnailImage = ({
  src,
  alt,
  className,
  onClick,
  selected = false,
}: ThumbnailImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-lg border-2 transition-all",
        selected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30",
        className
      )}
    >
      <div className="w-full h-full bg-muted">
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 shimmer-loading" />
        )}
        {isInView && (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">Error</span>
          </div>
        )}
      </div>
    </button>
  );
};
