"use client";
import { animate, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

export function AnimatedCounter({
  value,
  duration = 1.2,
  suffix = "",
  prefix = "",
  decimals = 0,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motion = useMotionValue(0);
  const rounded = useTransform(motion, (v) => v.toFixed(decimals));

  useEffect(() => {
    if (inView) animate(motion, value, { duration, ease: [0.16, 1, 0.3, 1] });
  }, [inView, value, duration, motion]);

  return (
    <span ref={ref}>
      {prefix}
      <span style={{ display: "inline-block" }} ref={(el) => {
        if (!el) return;
        const unsub = rounded.on("change", (v) => { el.textContent = String(v); });
        return () => unsub();
      }} />
      {suffix}
    </span>
  );
}
