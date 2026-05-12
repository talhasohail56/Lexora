"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Marquee({
  items,
  speed = 30,
  className,
}: {
  items: React.ReactNode[];
  speed?: number;
  className?: string;
}) {
  const all = [...items, ...items];
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
      >
        {all.map((it, i) => (
          <div key={i} className="shrink-0">
            {it}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
