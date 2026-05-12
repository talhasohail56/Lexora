# Lexora - AI Paralegal Assistant

## FYP Presentation and Technical Documentation

Project name: Lexora - AI Paralegal Assistant  
Project type: Final Year Project web application  
Primary jurisdiction: Pakistan  
Application category: AI legal document analysis, retrieval, drafting, compliance, and review platform  
Current stack: Next.js 14, React 18, TypeScript, Tailwind CSS, Prisma, PostgreSQL, OpenAI, Google OAuth, Gmail/Resend OTP

---

## 1. Executive Summary

Lexora is a Pakistan-focused AI paralegal assistant built to automate and improve common legal document workflows. The system allows a user to upload a legal document, extract its text, break it into searchable chunks, generate embeddings, identify clauses, detect risks, run compliance checks, ask RAG-grounded questions, compare document versions, generate contract drafts, extract timelines, and manage legal review tasks from one interface.

The project is designed as a production-style full-stack application rather than a simple prototype. It includes authentication, email OTP verification, Google login, role-based access control, subscription plans, admin tools, audit logging, notifications, a Pakistan legal corpus for RAG, and deployment support for Vercel with Supabase PostgreSQL.

In a presentation, the simplest explanation is:

Lexora turns a static contract into an interactive legal workspace. It can read the document, understand clauses, highlight risks, retrieve relevant legal context, answer questions with citations, compare versions, and produce legally formatted draft documents.

---

## 2. Problem Statement

Legal documents are long, technical, and difficult for non-lawyers to understand. Even lawyers and students spend significant time manually identifying clauses, checking risks, comparing revisions, and searching relevant law. In Pakistan, users also need jurisdiction-specific legal context rather than generic international contract guidance.

The problem addressed by Lexora is:

- Manual contract review is slow and repetitive.
- Non-lawyers struggle to understand legal clauses and obligations.
- Risky terms can be missed during review.
- Comparing two versions of a contract is tedious.
- Legal search is fragmented across documents and public legal sources.
- Existing AI tools often answer without grounding or source context.
- FYP-level legal assistant systems often lack end-to-end workflows, authentication, persistence, and deployment readiness.

Lexora solves this by combining document processing, embeddings, RAG, LLM analysis, compliance rules, and a modern legal workflow interface.

---

## 3. Project Objectives

The objectives of the system are:

1. Provide secure user authentication with email/password, OTP verification, Google OAuth, JWT sessions, and role-based access.
2. Allow users to upload PDF and DOCX legal documents with validation.
3. Extract document text and store it in the database.
4. Chunk extracted text and generate embeddings for semantic retrieval.
5. Detect important legal clauses using AI.
6. Identify risks and assign severity levels.
7. Generate document summaries and risk scores.
8. Provide RAG chat over uploaded documents and Pakistan legal sources.
9. Provide semantic search across user documents and the legal corpus.
10. Run compliance checks using regex rules and LLM-based evaluation.
11. Generate contract drafts from templates and save them as formatted Word documents.
12. Compare two or three legal documents and explain actual differences.
13. Extract deadlines, payment dates, notice periods, renewals, and expiry events.
14. Provide lawyer annotations and notifications.
15. Provide admin controls for users, compliance rules, templates, subscriptions, and audit logs.
16. Make the application deployable to Vercel with PostgreSQL.

---

## 4. High-Level Architecture

Lexora uses a modular monolith architecture. The frontend, backend routes, and service layer are all inside a Next.js application, while persistent data is stored in PostgreSQL through Prisma ORM.

### 4.1 Layers

| Layer | Implementation | Purpose |
|---|---|---|
| Presentation layer | Next.js App Router, React, Tailwind, Framer Motion | Pages, dashboards, forms, animations, app shell |
| API layer | Next.js route handlers under `app/api` | Receives requests, validates sessions, calls services |
| Service layer | `lib/services/*.ts` | Business logic for auth, documents, AI, RAG, compliance, drafting, compare |
| Data layer | Prisma ORM | Typed access to PostgreSQL |
| AI layer | OpenAI wrapper | Chat completions and embeddings with mock fallback |
| Email layer | Gmail SMTP or Resend | OTP delivery |
| Deployment layer | Vercel and Supabase | Hosting and managed PostgreSQL |

### 4.2 Request Flow Example: Document Upload

1. User chooses PDF or DOCX from the upload page.
2. Frontend sends `FormData` to `/api/documents/upload`.
3. API checks the user session and subscription entitlement.
4. `document-service.ts` validates file type and magic bytes.
5. The file is processed in memory on Vercel to avoid read-only filesystem errors.
6. Text is extracted using `pdf-parse` or `mammoth`.
7. Text is chunked into RAG chunks.
8. OpenAI embeddings are generated and stored.
9. AI analysis detects clauses, risks, summary, and risk score.
10. The completed document opens with clauses, risks, chunks, summary, and actions available.

---

## 5. Technology Stack

| Area | Technology |
|---|---|
| Frontend framework | Next.js 14 App Router |
| UI runtime | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| UI primitives | shadcn-style Radix components |
| Backend | Next.js API route handlers |
| ORM | Prisma |
| Database | PostgreSQL |
| AI chat | OpenAI chat completions |
| Embeddings | OpenAI text embeddings |
| PDF extraction | pdf-parse |
| DOCX extraction | mammoth |
| DOCX generation | docx |
| Auth tokens | jose JWT |
| Password hashing | bcryptjs |
| Email | nodemailer Gmail SMTP, Resend fallback |
| Validation | Zod |
| Charts | Recharts |
| Notifications | In-app notification table |
| Deployment | Vercel |

---

## 6. Database Design

The database is implemented in `prisma/schema.prisma` and uses PostgreSQL. It contains the original legal assistant entities plus subscription and legal corpus extensions.

### 6.1 Core Tables

| Table | Purpose |
|---|---|
| `User` | Stores user account, role, verification, OTP, status, profile fields |
| `Document` | Stores uploaded or generated documents, extracted text, summary, risk score |
| `Clause` | Stores AI-extracted clauses from documents |
| `Risk` | Stores risk findings with severity, description, suggestion, confidence |
| `DocumentEmbedding` | Stores chunk text and JSON-encoded embedding vectors |
| `ComplianceRule` | Stores rule definitions, regex patterns, severity, jurisdiction |
| `ComplianceCheck` | Stores compliance results for each document/rule pair |
| `ChatSession` | Stores user chat sessions |
| `ChatMessage` | Stores user and assistant messages with source chunks |
| `DraftedDocument` | Stores generated contract drafts and version history |
| `Annotation` | Stores lawyer notes attached to documents or clauses |
| `DocumentShare` | Stores sharing permissions |
| `TimelineEvent` | Stores extracted dates, deadlines, renewals, and obligations |
| `Notification` | Stores in-app notifications |
| `AuditLog` | Stores security and workflow activity |
| `LegalTemplate` | Stores admin-managed drafting templates |

### 6.2 Extended Tables

| Table | Purpose |
|---|---|
| `LegalSource` | Stores Pakistan legal sources such as acts, rules, guidelines, and official links |
| `LegalCorpusChunk` | Stores chunked and embedded legal source text for Pakistan law RAG |
| `Plan` | Stores subscription plans and limits |
| `Subscription` | Stores active user plan, trial, billing period, status |
| `UsageEvent` | Tracks feature usage against plan limits |

### 6.3 Important Relationships

- A `User` owns many `Document`, `ChatSession`, `DraftedDocument`, `Notification`, and `AuditLog` records.
- A `Document` has many `Clause`, `Risk`, `DocumentEmbedding`, `ComplianceCheck`, `Annotation`, and `TimelineEvent` records.
- A `LegalSource` has many `LegalCorpusChunk` records.
- A `Subscription` belongs to one `User` and one `Plan`.
- A `ComplianceCheck` links a `Document`, `User`, and `ComplianceRule`.

---

## 7. User Roles and Access Control

Lexora has three primary roles.

| Role | Main capabilities |
|---|---|
| User | Upload documents, analyze, chat, search, draft, compare, view legal library, billing |
| Lawyer | User capabilities plus annotations and higher review limits |
| Admin | Full access including users, subscriptions, compliance rules, templates, audit replay |

Access control is enforced through:

- JWT session cookie.
- Next.js middleware route protection.
- Role checks for admin and lawyer-only features.
- Subscription feature checks through `subscription-service.ts`.
- Server-side validation in API routes.

---

## 8. Authentication and Onboarding

### 8.1 Email and Password Registration

The registration flow is implemented in `auth-service.ts`.

Steps:

1. User submits name, email, password, role, and optional selected plan.
2. Password is hashed using bcrypt.
3. A six-digit OTP is generated.
4. OTP is hashed and stored with an expiry time.
5. A user is created as unverified.
6. An initial subscription is created.
7. OTP email is sent through Gmail SMTP if configured, otherwise Resend.
8. User enters the OTP on the verify page.
9. OTP is verified and the account becomes active.

### 8.2 Login

Login verifies:

- Email exists.
- Password hash is valid.
- Account status is active.
- Email is verified.

If valid, a JWT session is signed and stored in an HTTP-only cookie.

### 8.3 Google OAuth

Google login is implemented in:

- `lib/google-auth.ts`
- `/api/auth/google`
- `/api/auth/google/callback`

It uses OpenID Connect scopes:

- `openid`
- `email`
- `profile`

If the Google email is verified:

- Existing account is updated and marked verified.
- New account is created if it does not exist.
- A subscription is created for new users.
- A JWT session cookie is issued.

---

## 9. Subscription Model

Lexora includes an application-wide subscription layer.

Plans are defined in `lib/subscription-config.ts` and seeded using `subscription-service.ts`.

### 9.1 Plan Examples

| Plan | Audience | Price | Use case |
|---|---|---:|---|
| Starter | User | Free | Basic student or demo workflow |
| Professional | User | Paid | Individual full workflow |
| Lawyer Trial | Lawyer | Free trial | Lawyer review and annotation demo |
| Lawyer Pro | Lawyer | Paid | Professional lawyer workspace |
| Firm | All/Admin | Paid | Team or firm-level access |

### 9.2 Feature Limits

Subscription limits are enforced for features such as:

- document uploads
- AI analysis
- chat messages
- semantic searches
- drafts
- compliance runs
- comparisons
- timelines
- annotations
- negotiator
- forecast
- voice brief

The system tracks feature usage through the `UsageEvent` table.

### 9.3 Billing Implementation Status

The current checkout is a simulated card checkout designed for FYP demonstration. It validates card-like fields and updates the subscription state. For real production billing, Stripe Checkout or another payment provider would replace the simulated provider.

---

## 10. Document Upload and Processing

The document upload pipeline is implemented in `document-service.ts`.

### 10.1 Accepted Formats

- PDF
- DOCX
- Text files internally for generated drafts

### 10.2 Validation

The upload service validates:

- Maximum file size: 20 MB
- MIME type
- Magic bytes:
  - PDF begins with `%PDF`
  - DOCX begins with ZIP signature `PK`

### 10.3 Vercel-Safe File Handling

Vercel's deployed bundle is read-only. Therefore, Lexora avoids relying on persistent writes to `public/uploads` in deployment. Uploaded bytes are processed in memory, and the important persistent outputs are stored in the database:

- extracted text
- chunks
- embeddings
- clauses
- risks
- summary
- risk score

### 10.4 Analysis Completion

The upload route now waits for analysis to finish before returning success. This prevents the document detail page from opening with missing clauses, risks, or chunks.

---

## 11. AI Document Analysis

The analyzer is implemented in `ai-analyzer-service.ts`.

It performs:

- clause extraction
- risk detection
- summary generation
- risk scoring
- notification creation
- audit logging

### 11.1 Clause Types

The AI prompt recognizes these clause categories:

- Confidentiality
- Liability
- Indemnification
- Termination
- Payment
- Intellectual Property
- Dispute
- Governing Law
- Non-Compete
- Warranty
- Force Majeure
- Amendment
- Other

### 11.2 Risk Levels

Risks are classified as:

- LOW
- MEDIUM
- HIGH
- CRITICAL

### 11.3 Risk Score

The aggregate risk score is computed from the severity distribution using helper logic in `utils.ts`. The document page presents this as a visible risk score out of 100.

---

## 12. RAG Implementation

RAG means Retrieval-Augmented Generation. Lexora uses it so answers are grounded in stored documents and Pakistan legal sources rather than being free-form guesses.

### 12.1 RAG Pipeline

The pipeline is:

1. Extract text from document.
2. Split text into chunks.
3. Generate embedding vector for each chunk.
4. Store chunk and vector in `DocumentEmbedding`.
5. When a user asks a question, embed the query.
6. Compare query embedding to stored chunk embeddings using cosine similarity.
7. Retrieve top matching chunks.
8. Provide retrieved context to the LLM.
9. Store answer and source chunk metadata in `ChatMessage`.

### 12.2 User Document Retrieval

Implemented in:

- `embedding-service.ts`
- `chat-service.ts`
- `/api/search`
- `/api/chat`

The chat retrieves up to eight chunks and includes them in the system context.

### 12.3 Pakistan Legal Corpus Retrieval

Implemented in:

- `legal-corpus-service.ts`
- `lib/legal/pakistan-corpus.ts`
- `scripts/seed-pakistan-corpus.ts`
- `scripts/ingest-pakistan-code.ts`

The legal corpus allows Lexora to retrieve legal context from Pakistan-focused legal sources and cite source names in answers.

### 12.4 Why RAG Matters

Without RAG, the model answers only from general training data. With RAG, answers are based on:

- the user's uploaded documents
- official or curated Pakistan legal sources
- retrieved chunks with similarity scores
- stored source metadata

This makes answers more explainable and more defensible in a legal assistant context.

---

## 13. RAG Chat

The chat page is implemented through:

- `app/(app)/chat/page.tsx`
- `app/(app)/chat/client.tsx`
- `app/api/chat/route.ts`
- `chat-service.ts`

Key features:

- multi-turn conversations
- session list
- scoped chat for one document
- all-document chat
- Pakistan legal corpus context
- source badges under responses
- chat scrollbar inside the conversation pane

The system prompt instructs the assistant to:

- answer using only retrieved context
- cite source names
- avoid presenting responses as final legal opinions
- recommend lawyer review for high-stakes questions

---

## 14. Semantic Search

Semantic search allows users to ask concept-based queries rather than exact keyword searches.

Example:

- Query: "termination notice"
- Possible retrieval: a clause saying "Either party may end this agreement by giving thirty days written notice."

This works because embeddings encode meaning rather than exact words.

The search page uses `/api/search` and `embedding-service.ts`.

---

## 15. Pakistan Legal Library

The legal library page exposes indexed Pakistan legal sources. It helps demonstrate that the system is not just trained on small examples, but can retrieve jurisdiction-specific material.

The library provides:

- source title
- authority
- jurisdiction
- source type
- chunk count
- official source link

The legal corpus is also used by chat and semantic search.

---

## 16. Compliance Engine

The compliance module is implemented in `compliance-engine.ts`.

It uses a hybrid approach:

### 16.1 Phase 1: Regex Rules

Rules with `rulePattern` and `requiresLLM = false` are checked using regular expressions.

Use case:

- Check whether a confidentiality period exists.
- Check whether governing law is mentioned.
- Check whether a signature block exists.

### 16.2 Phase 2: LLM Rules

Rules marked `requiresLLM = true` are evaluated by the LLM in batches of five.

Use case:

- Determine if a clause is substantively compliant even when wording differs.
- Evaluate whether obligations are complete.
- Assess context-dependent rules.

### 16.3 Outputs

Each compliance check stores:

- compliant / non-compliant / partial status
- matched text
- confidence
- explanation
- linked rule

The compliance page also includes a coverage radar by category.

---

## 17. Contract Drafting

The drafting system is implemented in `drafting-service.ts` and `draft-export-service.ts`.

### 17.1 Supported Templates

- NDA
- Employment Contract
- Rental / Lease Agreement
- Service Agreement
- Partnership Agreement

### 17.2 Draft Flow

1. User selects a template.
2. User enters parties, effective date, and jurisdiction.
3. AI generates a professional draft.
4. The draft is editable in the browser.
5. Saving creates a version in `DraftedDocument`.
6. Saving also creates or updates a real `Document` record.
7. The saved draft is exported as a formal `.docx`.
8. The saved draft is indexed into embeddings for search and RAG.
9. The saved draft can be opened in Documents and used in Smart Compare.

### 17.3 Pakistan-Oriented Formatting

When saved, generated drafts include:

- governing law and jurisdiction language
- stamp duty and registration note
- execution block
- signature lines
- CNIC / registration number fields
- witness blocks

This makes the output more useful for Pakistan-facing contract review.

---

## 18. Smart Compare

Smart Compare is implemented in `compare-service.ts` and the compare page.

### 18.1 Use Case

The purpose is not simply to show a similarity score. The real use case is to tell the reviewer:

- what was added
- what was removed
- what was modified
- what the old wording said
- what the new wording says
- why the change matters
- how risky the change is
- what action should be taken

### 18.2 Inputs

Smart Compare can compare:

- two uploaded documents
- two generated drafts saved as documents
- uploaded document vs generated draft
- three documents pairwise

### 18.3 Output

The output includes:

- review summary
- key differences and legal impact
- added clauses
- removed clauses
- modified wording
- risk level for each difference
- recommendation for each difference
- similarity score based on text and phrase overlap

### 18.4 Why Similarity Was Changed

Earlier similarity was based on embeddings. That can make different legal documents appear too similar because legal language is semantically close. The updated similarity uses phrase and token overlap, which is better for version comparison.

---

## 19. Timeline Extraction

Timeline extraction identifies time-based obligations from legal documents.

Examples:

- payment due within 30 days
- termination notice period
- renewal date
- expiry date
- milestone deadline
- notice period

Timeline events are stored in `TimelineEvent` and shown in the timeline page.

---

## 20. Negotiation Simulator

The negotiator feature lets the user paste a clause and choose a stance such as buyer, seller, or lawyer. The AI then proposes counter-language and explains the rationale.

Use case:

- User receives a harsh indemnity clause.
- User asks Lexora to negotiate from buyer perspective.
- Lexora suggests capped liability, narrower indemnity, and carve-outs.

This is useful for demonstrating AI-assisted legal negotiation strategy.

---

## 21. Court Forecast

The court forecast feature is a demo-oriented legal risk estimator. It uses document and risk factors to produce an outcome probability-style explanation.

Important presentation note:

This is not a real court prediction engine. It is a demonstrative decision-support feature. It should be presented as a risk forecast or argument-strength estimator, not as a guaranteed legal outcome.

---

## 22. Voice Brief

Voice Brief uses browser speech synthesis to read document summaries aloud.

Use case:

- A user uploads a long contract.
- Lexora generates a summary.
- User can listen to the summary instead of reading the entire page.

This improves accessibility and demonstration value.

---

## 23. Notifications

Notifications are created for events such as:

- analysis complete
- compliance complete
- annotations
- timeline events
- account activity

Notifications have:

- title
- body
- priority
- read/unread state
- resource link metadata

The notification system supports dashboard alerts and a notification center.

---

## 24. Audit Logging

Audit logs are written for important actions:

- registration
- login
- logout
- upload
- analysis
- compliance run
- draft creation
- draft save
- role changes
- account status changes
- annotations
- document delete

Admin users can view and replay audit events through the Audit Replay page. This supports transparency and accountability, which are important in legal software.

---

## 25. Admin Panel

The admin area includes:

- users management
- role and status updates
- compliance rule management
- legal template management
- subscription oversight
- audit replay

Admin routes are protected by middleware and server-side role checks.

---

## 26. Frontend and User Experience

The UI is designed as a modern, animated legal workspace.

Important UX elements:

- animated landing page
- dark visual theme with legal-tech branding
- dashboard cards
- sidebar navigation
- command palette
- glow cards
- page transitions
- loading and progress states
- responsive layouts
- internal scroll areas for chat
- visually distinct pricing and subscription pages

The goal is to make the system feel more complete and polished than a typical student CRUD prototype.

---

## 27. Security Measures

| Security concern | Implementation |
|---|---|
| Password security | bcrypt hashing |
| Session security | JWT in HTTP-only cookie |
| OTP security | OTP hashes and expiry |
| File validation | MIME and magic-byte checks |
| Authorization | middleware, API checks, role checks |
| Subscription abuse | feature usage tracking |
| SQL injection | Prisma parameterized queries |
| Auditability | audit log table |
| Email verification | OTP email |
| OAuth safety | Google verified email required |
| Deployment secrets | `.env` ignored; Vercel env import |

---

## 28. API Route Overview

| Category | Routes |
|---|---|
| Auth | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/verify-otp`, `/api/auth/resend-otp`, `/api/auth/google`, `/api/auth/google/callback` |
| Documents | `/api/documents`, `/api/documents/upload`, `/api/documents/[id]`, `/api/documents/[id]/download`, `/api/documents/[id]/reanalyze`, `/api/documents/[id]/explain-clause` |
| Chat and search | `/api/chat`, `/api/chat/sessions/[id]`, `/api/search`, `/api/library` |
| Drafting | `/api/draft`, `/api/draft/generate`, `/api/draft/[id]`, `/api/negotiate` |
| Compliance | `/api/compliance/run`, `/api/compliance/rules`, `/api/compliance/history` |
| Compare | `/api/compare` |
| Timeline | `/api/timeline`, `/api/timeline/extract` |
| Notifications | `/api/notifications`, `/api/notifications/[id]`, `/api/notifications/read-all`, `/api/notifications/unread` |
| Billing | `/api/billing/plans`, `/api/billing/subscription`, `/api/billing/checkout` |
| Admin | `/api/admin/users`, `/api/admin/users/[id]`, `/api/admin/templates`, `/api/admin/audit`, `/api/admin/subscriptions` |

---

## 29. Page Overview

| Page | Purpose |
|---|---|
| `/` | Animated landing page |
| `/pricing` | Public pricing page |
| `/login` | Sign in with email/password or Google |
| `/register` | Create account and select role/plan |
| `/verify-otp` | Email verification |
| `/dashboard` | System overview and recent activity |
| `/documents` | List uploaded/generated documents |
| `/documents/upload` | Upload PDF/DOCX |
| `/documents/[id]` | Summary, clauses, risks, heatmap, timeline, notes |
| `/chat` | RAG chat |
| `/search` | Semantic search |
| `/library` | Pakistan legal corpus |
| `/draft` | AI contract drafting |
| `/compare` | Smart document comparison |
| `/compliance` | Rule-based and AI compliance |
| `/timeline` | Extracted legal deadlines |
| `/negotiator` | Counter-clause simulator |
| `/forecast` | Court/risk forecast demo |
| `/voice-brief` | Audio summaries |
| `/notifications` | Notification center |
| `/billing` | Subscription and checkout |
| `/settings` | Account details |
| `/admin/users` | Admin user management |
| `/admin/rules` | Compliance rule administration |
| `/admin/templates` | Legal template administration |
| `/admin/audit` | Audit replay |
| `/admin/subscriptions` | Subscription administration |

---

## 30. AI Model and Fallback Design

The AI wrapper is in `lib/openai.ts`.

It supports:

- OpenAI chat completions
- OpenAI embeddings
- deterministic mock fallback

The fallback is useful for:

- local demos without API key
- offline screenshots
- development reliability
- predictable seed data

When `OPENAI_API_KEY` is configured, the system uses real model calls.

---

## 31. Deployment

The app is prepared for Vercel deployment.

### 31.1 Required Production Services

- Vercel for app hosting
- Supabase PostgreSQL or another PostgreSQL provider
- OpenAI API key
- Gmail app password or Resend API key
- Google OAuth client credentials

### 31.2 Important Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `OPENAI_API_KEY` | Real AI output |
| `OPENAI_MODEL` | Chat model |
| `OPENAI_EMBED_MODEL` | Embedding model |
| `NEXT_PUBLIC_APP_URL` | Base app URL |
| `GMAIL_USER` | Gmail OTP sender |
| `GMAIL_APP_PASSWORD` | Gmail SMTP app password |
| `RESEND_API_KEY` | Resend fallback |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GOOGLE_REDIRECT_URI` | OAuth redirect |

### 31.3 Vercel Notes

Vercel's filesystem is read-only at runtime. Lexora processes uploads in memory and stores extracted content in PostgreSQL. Generated Word documents are created on demand for download.

---

## 32. Testing and Verification Strategy

The current verification approach includes:

- TypeScript type checking using `npx tsc --noEmit`.
- Prisma schema validation using `npx prisma validate`.
- Production build using `npm run build`.
- Route compilation through Next.js build output.
- Runtime checks for specific workflows during development:
  - document upload read-only deployment fix
  - draft save as Word document
  - Smart Compare similarity and difference output
  - chat scroll behavior
  - favicon metadata
  - subscription checkout flow

For FYP presentation, demonstrate:

1. Register a user and verify OTP.
2. Log in.
3. Upload a contract.
4. Show analysis result with risk score, clauses, and risks.
5. Ask a RAG question in chat.
6. Search for a clause semantically.
7. Run compliance.
8. Generate and save a contract draft.
9. Open generated draft in Documents.
10. Compare two documents and show key differences.
11. Extract timeline events.
12. Show admin audit replay.

---

## 33. Demo Script

### Step 1: Landing Page

Show the animated landing page and explain that Lexora is a complete AI legal workspace.

### Step 2: Login

Use the demo user or register a new account. Explain OTP verification and Google OAuth support.

### Step 3: Dashboard

Show recent documents, usage, notifications, and risk summary.

### Step 4: Upload Document

Upload a PDF or DOCX contract. Explain validation, extraction, embeddings, and analysis.

### Step 5: Document Detail

Show:

- summary
- risk score
- extracted clauses
- risk list
- heatmap
- raw text
- Ask AI button

### Step 6: RAG Chat

Ask a question such as:

"What are the termination rights and what Pakistan legal context applies?"

Explain that the answer is grounded in retrieved chunks.

### Step 7: Semantic Search

Search:

"payment delay consequences"

Show that it retrieves conceptually related chunks even if exact words differ.

### Step 8: Compliance

Run compliance checks and show regex plus AI evaluation.

### Step 9: Drafting

Generate an NDA or service agreement. Save it. Show that it becomes a Word document and appears in Documents.

### Step 10: Smart Compare

Compare two documents. Explain key differences, legal impact, risk level, and recommendation.

### Step 11: Admin

Login as admin and show:

- users
- subscriptions
- rules
- templates
- audit replay

---

## 34. Mapping to FYP Requirements

| Requirement area | Lexora implementation |
|---|---|
| User management | Register, login, OTP, Google OAuth, roles |
| Document upload | PDF/DOCX upload, validation, extraction |
| Clause extraction | AI analyzer stores clauses |
| Risk detection | AI analyzer stores risks and risk score |
| RAG search | embeddings, semantic search, RAG chat |
| Legal corpus | Pakistan legal source chunks |
| Compliance | regex + LLM rules |
| Drafting | five templates, version history, Word export |
| Compare | 2-way and 3-way smart comparison |
| Timeline | deadline and event extraction |
| Notifications | in-app notifications |
| Audit | audit log and replay |
| Admin | users, rules, templates, subscriptions |
| Security | JWT, bcrypt, OTP, validation, audit |
| Deployment | Vercel and PostgreSQL ready |

---

## 35. Limitations

The current system is strong for FYP demonstration, but limitations should be stated honestly:

1. It is not a substitute for a licensed lawyer.
2. AI outputs require human review.
3. Pakistan legal corpus quality depends on indexed source quality.
4. Embeddings are stored as JSON arrays, not pgvector.
5. Billing checkout is simulated, not a live payment gateway.
6. Large PDFs may take longer to process due to LLM and embedding calls.
7. On Vercel, original uploaded files are not permanently stored unless object storage is added.
8. Urdu legal text support is not fully implemented.

---

## 36. Future Enhancements

Recommended future work:

1. Add Supabase Storage or S3 for persistent original file storage.
2. Move embeddings to pgvector for faster large-scale search.
3. Add Urdu OCR and Urdu legal retrieval.
4. Add Stripe Checkout for real payments.
5. Add collaborative document review with live comments.
6. Add redline DOCX export for Smart Compare.
7. Add e-signature integration.
8. Add lawyer marketplace or review assignment.
9. Add official citation parser for Pakistan statutes.
10. Add automated test suite for services and API routes.

---

## 37. Final Presentation Positioning

Lexora should be presented as:

An end-to-end AI legal document platform for Pakistan-focused contract workflows. It is not just a chatbot. It includes secure onboarding, document ingestion, AI analysis, RAG retrieval, legal corpus search, compliance checking, contract drafting, document comparison, timeline extraction, subscription management, and admin audit controls.

The strongest presentation angle is:

"We built a complete legal document operating system where every uploaded contract becomes searchable, explainable, comparable, and actionable."

---

## 38. Current Verification Checklist

The final verification pass should confirm:

- Git worktree status reviewed.
- Prisma schema validates.
- TypeScript type check passes.
- Production build passes.
- Routes compile successfully.
- Documentation generated.
- DOCX visual render checked if LibreOffice is available.
- No real `.env` file is committed.

---

## 39. Final Verification Result

Final verification date: 2026-05-13

The following checks were run successfully:

| Check | Command / method | Result |
|---|---|---|
| Prisma schema validation | `npx prisma validate` | Passed |
| TypeScript type check | `npx tsc --noEmit --pretty false` | Passed |
| ESLint | `npm run lint` | Passed with no warnings or errors |
| Production build | `npm run build` | Passed and compiled 63 routes |
| Production server smoke test | `next start` with curl checks | `/`, `/pricing`, `/login`, `/api/billing/plans` returned HTTP 200 |
| Secret file safety | `git check-ignore -v .env .env.vercel` and `git ls-files .env .env.vercel` | `.env` files are ignored and not tracked |
| Documentation render QA | DOCX rendered to 21 page images and inspected | Passed after fixing numbering layout |

Final technical status:

- The site builds successfully for production.
- The Prisma schema is valid.
- TypeScript passes.
- ESLint passes.
- Public routes smoke tested successfully.
- The generated FYP documentation is available as both Markdown and DOCX.
- Real environment files are not tracked by Git.
