"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/animated/glow-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";
import { PageTransition } from "@/components/animated/page-transition";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState("Uploading and preparing analysis…");
  const [docType, setDocType] = useState("GENERAL");

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) return toast.error("File exceeds 20 MB");
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  async function submit() {
    if (!file) return;
    setUploading(true);
    setProgress(18);
    setStatusText("Uploading document…");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("documentType", docType);
    const timers: number[] = [];
    try {
      timers.push(
        window.setTimeout(() => { setProgress(42); setStatusText("Extracting legal text…"); }, 700),
        window.setTimeout(() => { setProgress(62); setStatusText("Creating RAG chunks and embeddings…"); }, 1800),
        window.setTimeout(() => { setProgress(82); setStatusText("Detecting clauses and risks…"); }, 3200)
      );
      const r = await fetch("/api/documents/upload", { method: "POST", body: fd });
      timers.forEach(window.clearTimeout);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Upload failed");
      setProgress(100);
      setStatusText("Analysis complete");
      toast.success("Analysis complete");
      setTimeout(() => router.push(`/documents/${data.id}`), 450);
    } catch (e: any) {
      timers.forEach(window.clearTimeout);
      toast.error(e.message);
      setUploading(false);
      setProgress(0);
      setStatusText("Uploading and preparing analysis…");
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Upload a document</h1>
          <p className="text-muted-foreground">PDF or DOCX, up to 20 MB.</p>
        </div>

        <GlowCard className="p-4 sm:p-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all sm:p-10 ${
              dragOver ? "border-lex-500 bg-lex-500/5" : "border-border bg-card/30"
            }`}
          >
            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div
                    className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-lex-500 to-amber-500 flex items-center justify-center text-white mb-4"
                    animate={{ y: dragOver ? -6 : 0 }}
                  >
                    <Upload className="h-7 w-7" />
                  </motion.div>
                  <p className="font-medium">Drag & drop your document here</p>
                  <p className="text-sm text-muted-foreground mt-1">or</p>
                  <label className="inline-block mt-3 cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-lex-500 to-amber-500 text-white text-sm font-medium shadow-glow hover:brightness-110">
                      Choose file
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-4">PDF · DOCX · 20 MB max</p>
                </motion.div>
              ) : (
                <motion.div key="file" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-lex-500/20 to-amber-500/20 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-lex-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">{formatBytes(file.size)} · {file.type || "unknown"}</div>
                    </div>
                    {!uploading && (
                      <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {uploading && (
                    <div className="mt-4">
                      <Progress value={progress} />
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                        {progress === 100 ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {progress === 100 ? "Done" : statusText}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Document type</label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["NDA", "EMPLOYMENT", "RENTAL", "SERVICE", "PARTNERSHIP", "GENERAL"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={submit} disabled={!file || uploading} variant="gradient" className="w-full h-10">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload & Analyse"}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Magic-byte validated</Badge>
            <Badge variant="outline">Auto-chunked</Badge>
            <Badge variant="outline">Embedded with text-embedding-3</Badge>
            <Badge variant="outline">12 clause types</Badge>
            <Badge variant="outline">4-tier risk detection</Badge>
          </div>
        </GlowCard>
      </div>
    </PageTransition>
  );
}
