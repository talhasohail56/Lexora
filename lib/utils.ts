import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function formatRelative(date: Date | string) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function severityColor(s: string) {
  switch (s.toUpperCase()) {
    case "CRITICAL": return "text-red-600 bg-red-500/10 border-red-500/30";
    case "HIGH":     return "text-orange-600 bg-orange-500/10 border-orange-500/30";
    case "MEDIUM":   return "text-amber-600 bg-amber-500/10 border-amber-500/30";
    case "LOW":      return "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";
    default:         return "text-muted-foreground bg-muted border-border";
  }
}

export function severityWeight(s: string) {
  switch (s.toUpperCase()) {
    case "CRITICAL": return 25;
    case "HIGH":     return 10;
    case "MEDIUM":   return 5;
    case "LOW":      return 2;
    default:         return 0;
  }
}

export function computeRiskScore(severities: string[]) {
  if (!severities.length) return 0;
  const total = severities.reduce((acc, s) => acc + severityWeight(s), 0);
  const max = severities.length * 25;
  return Math.min(100, Math.round((total / max) * 100));
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  // Approximate token-aware chunking using 4 chars/token heuristic.
  const charsPerChunk = chunkSize * 4;
  const overlapChars = overlap * 4;
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > charsPerChunk) {
      if (current) chunks.push(current.trim());
      const tail = current.slice(-overlapChars);
      current = tail + sentence + " ";
    } else {
      current += sentence + " ";
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 50);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function safeJson<T = unknown>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try { return JSON.parse(s) as T; } catch { return fallback; }
}
