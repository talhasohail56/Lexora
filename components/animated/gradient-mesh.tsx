"use client";
import { cn } from "@/lib/utils";

export function GradientMesh({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <div aria-hidden className="absolute inset-0 bg-gradient-mesh opacity-90" />
      <div className="absolute inset-0 grid-backdrop opacity-40" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,hsl(var(--background)/0.86)_78%,hsl(var(--background))_100%)]" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

export function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,hsl(var(--primary)/0.08),transparent_34%,hsl(var(--accent-warm)/0.10)_67%,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-40 border-b border-border/50 bg-background/30 backdrop-blur-[1px]" />
    </div>
  );
}
