"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
import { GlowCard } from "@/components/animated/glow-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/animated/page-transition";

const TERMS = [
  { term: "Indemnification", def: "A contractual obligation by one party to compensate another for losses or damages arising from specified events. Often capped or carved out for specific liabilities." },
  { term: "Force Majeure", def: "A clause excusing a party from contractual obligations due to extraordinary events beyond their control (e.g., natural disasters, war, government action)." },
  { term: "Liquidated Damages", def: "A predetermined sum payable by a breaching party as compensation for breach, agreed upon at contract formation rather than calculated post-breach." },
  { term: "Severability", def: "A provision stating that if one part of a contract is held unenforceable, the remainder remains in effect." },
  { term: "Boilerplate", def: "Standard contract clauses (governing law, notices, entire agreement) that are reused across many contracts with minimal modification." },
  { term: "Estoppel", def: "A legal doctrine preventing a party from asserting a position inconsistent with one previously taken, where the other party has relied on the original position." },
  { term: "Pari Passu", def: "Latin for 'on equal footing' — used to describe equal treatment among multiple creditors, securities, or obligations." },
  { term: "Quantum Meruit", def: "Latin for 'as much as deserved' — a legal principle allowing recovery for services rendered when no formal contract exists." },
  { term: "Novation", def: "The substitution of a new contract for an existing one, or the replacement of one party with another, with all parties' consent." },
  { term: "Subrogation", def: "The legal right of one party to step into the shoes of another, typically to pursue a claim the other party held." },
  { term: "Tort", def: "A civil wrong that causes harm, giving rise to legal liability separate from contractual obligations." },
  { term: "Voidable", def: "A contract that is valid but may be rescinded by one party due to grounds such as misrepresentation, duress, or undue influence." },
  { term: "Warranty", def: "An assurance or guarantee given by one party regarding the truth of certain facts or the quality of goods/services." },
  { term: "Consideration", def: "Something of value (money, services, promise) exchanged between parties, required for a valid contract." },
  { term: "Privity of Contract", def: "The doctrine that only parties to a contract may sue to enforce it, with limited exceptions for third-party beneficiaries." },
];

export default function GlossaryPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<typeof TERMS[number] | null>(null);

  const filtered = TERMS.filter(
    (t) => !q || t.term.toLowerCase().includes(q.toLowerCase()) || t.def.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <BookOpen className="h-7 w-7 text-lex-500" /> Legal glossary
          </h1>
          <p className="text-muted-foreground">{TERMS.length} terms · click any to expand</p>
        </div>

        <GlowCard className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms…" className="pl-9" />
          </div>
        </GlowCard>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((t, i) => (
            <motion.button
              key={t.term}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setSelected(t)}
              className="text-left"
            >
              <GlowCard className="p-4 h-full hover:scale-[1.02] transition-transform">
                <Badge variant="info" className="mb-2">{t.term}</Badge>
                <p className="text-xs text-muted-foreground line-clamp-3">{t.def}</p>
              </GlowCard>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelected(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-lg w-full"
              >
                <GlowCard className="p-6">
                  <Badge variant="gradient" className="mb-2">{selected.term}</Badge>
                  <p className="text-sm leading-relaxed">{selected.def}</p>
                </GlowCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
