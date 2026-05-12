import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(110deg,hsl(var(--muted))_8%,hsl(var(--muted-foreground)/0.1)_18%,hsl(var(--muted))_33%)] bg-[length:200%_100%]",
        className
      )}
    />
  );
}
