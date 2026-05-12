"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  glowColor?: string;
}

export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ children, className, glow = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border/80 bg-card shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-elevated",
          className
        )}
        {...props}
      >
        {glow && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        )}
        <div className="relative h-full bg-card/95">
          {children}
        </div>
      </div>
    );
  }
);
GlowCard.displayName = "GlowCard";
