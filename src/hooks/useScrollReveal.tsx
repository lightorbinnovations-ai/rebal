import { useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export const useScrollReveal = (options: UseScrollRevealOptions = {}) => {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isVisible };
};

// Utility component for scroll reveal animations
import React, { forwardRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "fade";
}

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  ({ children, className = "", delay = 0, direction = "up" }, forwardedRef) => {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

    const getTransformStyle = () => {
      if (!isVisible) {
        switch (direction) {
          case "up":
            return "translateY(40px)";
          case "down":
            return "translateY(-40px)";
          case "left":
            return "translateX(40px)";
          case "right":
            return "translateX(-40px)";
          default:
            return "translateY(0)";
        }
      }
      return "translate(0, 0)";
    };

    // Merge refs if forwardedRef is provided
    const setRef = (element: HTMLDivElement | null) => {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = element;
      if (typeof forwardedRef === "function") {
        forwardedRef(element);
      } else if (forwardedRef) {
        forwardedRef.current = element;
      }
    };

    return (
      <div
        ref={setRef}
        className={className}
        style={{
          opacity: isVisible ? 1 : 0,
          transform: getTransformStyle(),
          transition: `opacity 0.6s ease-out ${delay}ms, transform 0.6s ease-out ${delay}ms`,
        }}
      >
        {children}
      </div>
    );
  }
);

ScrollReveal.displayName = "ScrollReveal";
