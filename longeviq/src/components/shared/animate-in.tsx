"use client";

import { cn } from "@/lib/utils";

interface AnimateInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * A wrapper that fades in children with a subtle upward slide.
 * Uses CSS animations (not framer-motion) for performance.
 * Supports stagger via a `delay` prop (in ms).
 */
export function AnimateIn({ children, delay = 0, className }: AnimateInProps) {
  return (
    <div
      className={cn("animate-in", className)}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
