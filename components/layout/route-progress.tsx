"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function isModifiedClick(event: MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPending(false);
    document.body.style.cursor = "";
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [pathname, searchParams]);

  useEffect(() => {
    function startPending() {
      setPending(true);
      document.body.style.cursor = "progress";
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setPending(false);
        document.body.style.cursor = "";
      }, 9000);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || isModifiedClick(event)) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      startPending();
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {pending && (
        <>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 right-0 top-0 z-[9999] h-0.5 origin-left bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent-warm)),hsl(var(--primary)))] shadow-[0_0_24px_hsl(var(--primary)/0.55)]"
          />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none fixed bottom-5 right-5 z-[9999] rounded-full border border-border/70 bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-elevated backdrop-blur-xl"
          >
            Loading workspace...
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
