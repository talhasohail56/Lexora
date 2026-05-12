"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Typing({
  words,
  speed = 80,
  pause = 1400,
  className,
}: {
  words: string[];
  speed?: number;
  pause?: number;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const w = words[i];
    if (!del && text === w) {
      const t = setTimeout(() => setDel(true), pause);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setI((p) => (p + 1) % words.length);
      return;
    }
    const t = setTimeout(() => {
      setText((prev) => (del ? w.slice(0, prev.length - 1) : w.slice(0, prev.length + 1)));
    }, del ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [text, del, i, words, speed, pause]);

  return (
    <span className={className}>
      {text}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block w-[2px] h-[0.9em] translate-y-0.5 bg-current ml-0.5"
      />
    </span>
  );
}
