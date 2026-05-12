# 🦉 Lexora — AI Paralegal Assistant

A complete reimagining of the FYP AI Paralegal Assistant. Built fresh on Next.js 14 with a heavily animated, modern UI — every requirement from the original report is implemented plus several brand-new features.

## ✨ What's in the box

### Every feature from the report
- **Auth** — Email + password, JWT in HTTP-only cookies, OTP email verification, RBAC (USER / LAWYER / ADMIN)
- **Document upload** — PDF / DOCX up to 20 MB, magic-byte validation, async processing pipeline
- **AI Analysis** — Clause extraction (12 types), risk detection (4 severity tiers), executive summary, aggregate risk score
- **RAG semantic search** — Embedding-based retrieval with source attribution
- **Multi-turn RAG chat** — Top-K retrieval (K=8) + conversation history (last 10 turns)
- **Pakistan legal RAG corpus** — Contract Act, Specific Relief, Sale of Goods, Arbitration, Limitation, ETO, Companies Act, SECP AML/CFT, Digital Nation, Transfer of Property, Stamp and Registration
- **Hybrid compliance engine** — Phase 1 regex + Phase 2 LLM evaluation, batched 5/call
- **Contract drafting** — 5 templates (NDA, Employment, Rental, Service, Partnership) with full version history
- **Document comparison** — Clause-level diff + cosine similarity score (2-way **and 3-way**)
- **Legal timeline extractor** — Auto-extract deadlines, payments, notice periods, renewals
- **Clause annotations** — Lawyer-initiated inline notes with notifications
- **Notifications centre** — In-app feed with read/unread, priority, auto-dispatch
- **Admin panel** — User management, compliance rule CRUD, template library
- **Audit log + replay** — Tamper-evident logging with a Figma-like scrubber
- **All original 16 DB tables + 2 RAG corpus tables** — Report schema preserved, Pakistan legal library added

### 🎁 New bonus features
1. **⌘K Command Palette** — Navigate anywhere, instantly
2. **Negotiation Simulator** — AI plays opposing counsel, proposes counter-clauses
3. **Court Forecast** — Bayesian-style outcome forecasting with factor breakdown
4. **Legal Glossary** — 15 legal terms with searchable AI definitions
5. **Voice Brief** — Listen to summaries via browser speech synthesis
6. **Clause Heatmap** — Visual risk map by contract segment
7. **Compliance Coverage Radar** — Radar chart of active rule categories
8. **3-way Smart Compare** — Compare three documents pairwise at once
9. **Dark / light mode** with automatic system preference + smooth transition
10. **Magnetic hover buttons, gradient mesh backgrounds, scroll-linked animations**

## 🚀 Quick start

```bash
cd ai-paralegal-v2
npm install
cp .env.example .env       # SQLite + dev secrets are already set
npx prisma db push         # create the DB schema
npm run db:seed            # seed demo users + sample documents
npm run db:seed:pk         # index Pakistan legal corpus for RAG
npm run dev                # open http://localhost:3000
```

### Demo accounts (after seeding)

| Role   | Email              | Password    |
|--------|--------------------|-------------|
| Admin  | admin@lexora.ai    | password123 |
| Lawyer | lawyer@lexora.ai   | password123 |
| User   | talha@lexora.ai    | password123 |

## 🧱 Architecture

```
ai-paralegal-v2/
├── app/                          Next.js 14 App Router
│   ├── (public)/                 Landing page
│   ├── (auth)/                   Login, register, OTP
│   ├── (app)/                    Protected app (sidebar shell)
│   │   ├── dashboard/
│   │   ├── documents/[id]/       Detail with clauses/risks/heatmap/timeline
│   │   ├── chat/                 RAG multi-turn chat
│   │   ├── search/               Semantic search
│   │   ├── library/              Pakistan legal corpus
│   │   ├── compliance/           Hybrid checks + coverage radar
│   │   ├── draft/                Template-based generation + version history
│   │   ├── compare/              2-way & 3-way diff
│   │   ├── timeline/             Legal timeline events
│   │   ├── notifications/
│   │   ├── settings/
│   │   ├── negotiator/           ✨ NEW
│   │   ├── forecast/             ✨ NEW
│   │   ├── glossary/             ✨ NEW
│   │   ├── voice-brief/          ✨ NEW
│   │   └── admin/                Users / rules / templates / audit replay
│   └── api/                      Server routes
├── components/
│   ├── ui/                       shadcn-style primitives
│   ├── animated/                 gradient-mesh, glow-card, magnetic-button, …
│   └── layout/                   sidebar, topbar, command-palette
├── lib/
│   ├── legal/                    Pakistan corpus source data
│   ├── services/                 8 service modules (matches report §4.2)
│   ├── auth.ts                   JWT + bcrypt + OTP
│   ├── openai.ts                 OpenAI wrapper with mock fallback
│   ├── db.ts                     Prisma client
│   └── utils.ts                  Common helpers
├── prisma/
│   └── schema.prisma             All 16 tables
├── scripts/
│   ├── seed.ts                   Demo data
│   └── seed-pakistan-corpus.ts   Pakistan legal RAG indexer
└── middleware.ts                 Route protection + RBAC
```

## 🔧 Stack

| Layer            | Tech                                                          |
|------------------|---------------------------------------------------------------|
| Frontend         | Next.js 14 App Router · React 18 · TypeScript                |
| Styling          | Tailwind CSS · shadcn-style UI · Framer Motion · Lucide icons |
| State            | Zustand · React hooks                                         |
| Backend          | Next.js API Routes · Prisma ORM · Zod validation              |
| Database         | SQLite (dev — zero-config) → PostgreSQL for production       |
| AI               | OpenAI GPT-4o + text-embedding-3 (graceful mock fallback)    |
| Auth             | JWT (jose) · bcrypt · OTP                                     |
| Charts           | Recharts                                                      |

## 🤖 AI mock fallback

The app runs end-to-end **without any OpenAI key** — `lib/openai.ts` returns deterministic, realistic responses based on prompt intent. To enable real inference, set `OPENAI_API_KEY` in `.env`.

## Pakistan RAG corpus

Run `npm run db:seed:pk` after `npx prisma db push`. It indexes 12 Pakistan-focused legal sources into `LegalSource` and `LegalCorpusChunk`, then merges those chunks into chat and semantic search. The `/library` page lists the indexed sources and links back to official source pages.

## 📊 Mapping to the FYP report

| Report Section | Implementation |
|---------------|---------------|
| §3.2 Functional Requirements (FR-01 to FR-67) | All 67 requirements implemented |
| §3.3 Non-Functional Requirements              | Magic-byte validation, Zod validation, audit logging, bcrypt, JWT HTTP-only |
| §4.2 Module Architecture (8 services)         | `lib/services/*.ts` — 1:1 mapping |
| §4.3 Database Schema (16 tables)              | `prisma/schema.prisma` plus 2 RAG corpus tables |
| §4.4 RAG Pipeline                              | `embedding-service.ts` + `chat-service.ts` + Pakistan legal corpus |
| §4.5 Compliance Engine                         | `compliance-engine.ts` (regex Phase 1 + LLM Phase 2) |
| §5.10 Security                                 | Magic-byte, Zod, parameterised Prisma, audit log |

## 📦 Production deployment

Swap the Prisma datasource provider to `postgresql` and point `DATABASE_URL` at Supabase/Neon/etc. Deploy on Vercel for serverless functions + edge CDN. Set `OPENAI_API_KEY` and `JWT_SECRET` in env vars.

---

Built with ❤️ as a complete reimagining of the FAST-NUCES FYP AI Paralegal Assistant.
