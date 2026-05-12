/**
 * Seed script — creates demo users, sample documents with full analysis, compliance rules,
 * legal templates, sample notifications and audit log entries.
 *
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { embed } from "../lib/openai";
import { chunkText } from "../lib/utils";

const prisma = new PrismaClient();

const SAMPLE_NDA = `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of 1 June 2026 by and between Acme Inc. and XYZ Ltd.

1. CONFIDENTIAL INFORMATION
Each party agrees to maintain confidentiality of disclosed information for a period of three (3) years.

2. LIABILITY
Liability shall be limited to the total fees paid under this Agreement.

3. INDEMNIFICATION
The Service Provider shall indemnify the Client against all third-party claims arising from negligence.

4. TERMINATION
Either party may terminate this Agreement with thirty (30) days written notice.

5. GOVERNING LAW
This Agreement shall be governed by the laws of Pakistan. The parties consent to the exclusive jurisdiction of the courts of Karachi.

6. PAYMENT
Invoices are payable within thirty (30) days of receipt.

7. NON-COMPETE
Neither party shall solicit the employees of the other for a period of one (1) year following termination.

8. ENTIRE AGREEMENT
This Agreement constitutes the entire understanding between the parties.`;

async function main() {
  console.log("🌱 Seeding Lexora…");

  // Wipe
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.documentShare.deleteMany();
  await prisma.annotation.deleteMany();
  await prisma.draftedDocument.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.complianceCheck.deleteMany();
  await prisma.complianceRule.deleteMany();
  await prisma.legalTemplate.deleteMany();
  await prisma.documentEmbedding.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.clause.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const pw = await bcrypt.hash("password123", 10);
  const admin = await prisma.user.create({
    data: { email: "admin@lexora.ai", passwordHash: pw, name: "Admin Lexora", role: "ADMIN", isVerified: true },
  });
  const lawyer = await prisma.user.create({
    data: { email: "lawyer@lexora.ai", passwordHash: pw, name: "Hasnain Raza", role: "LAWYER", isVerified: true, barNumber: "BAR-22K-4284", jurisdiction: "Pakistan" },
  });
  const user = await prisma.user.create({
    data: { email: "talha@lexora.ai", passwordHash: pw, name: "Muhammad Talha", role: "USER", isVerified: true },
  });
  console.log(`✅ Users: admin, lawyer, user (password: password123)`);

  // Sample document with full analysis
  const doc = await prisma.document.create({
    data: {
      userId: user.id,
      originalName: "Sample NDA - Acme x XYZ.txt",
      storagePath: "uploads/sample-nda.txt",
      mimeType: "text/plain",
      fileSize: SAMPLE_NDA.length,
      documentType: "NDA",
      status: "COMPLETED",
      extractedText: SAMPLE_NDA,
      summary:
        "This Mutual NDA establishes confidentiality obligations between Acme Inc. and XYZ Ltd. for a 3-year term, with a liability cap tied to fees paid and broad indemnification by the Service Provider. Termination requires 30 days written notice; governing law is Pakistan with exclusive Karachi jurisdiction.",
      riskScore: 58,
      processingTime: 12400,
    },
  });

  // Clauses
  const clauseData = [
    { clauseType: "Confidentiality", text: "Each party agrees to maintain confidentiality of disclosed information for a period of three (3) years.", confidence: 0.92 },
    { clauseType: "Liability",       text: "Liability shall be limited to the total fees paid under this Agreement.", confidence: 0.88 },
    { clauseType: "Indemnification", text: "The Service Provider shall indemnify the Client against all third-party claims arising from negligence.", confidence: 0.84 },
    { clauseType: "Termination",     text: "Either party may terminate this Agreement with thirty (30) days written notice.", confidence: 0.91 },
    { clauseType: "GoverningLaw",    text: "This Agreement shall be governed by the laws of Pakistan.", confidence: 0.95 },
    { clauseType: "Payment",         text: "Invoices are payable within thirty (30) days of receipt.", confidence: 0.93 },
    { clauseType: "NonCompete",      text: "Neither party shall solicit the employees of the other for a period of one (1) year following termination.", confidence: 0.86 },
  ];
  const clauses = await Promise.all(
    clauseData.map((c) => prisma.clause.create({ data: { ...c, documentId: doc.id } }))
  );

  // Risks
  await prisma.risk.createMany({
    data: [
      { documentId: doc.id, clauseId: clauses[1].id, severity: "HIGH",     category: "Vague Liability Cap",     description: "Liability cap referenced 'fees paid' without specifying period or scope.", suggestion: "Specify cap as 12-month aggregate fees.", confidence: 0.81 },
      { documentId: doc.id, clauseId: clauses[2].id, severity: "CRITICAL", category: "Unbounded Indemnification", description: "Indemnification scope is broad with no caps or carve-outs.", suggestion: "Cap at contract value; carve out IP/data breaches.", confidence: 0.86 },
      { documentId: doc.id, clauseId: clauses[3].id, severity: "MEDIUM",   category: "Short Notice Period",     description: "30-day termination may be insufficient for material engagements.", suggestion: "Consider 60–90 days.", confidence: 0.74 },
      { documentId: doc.id, clauseId: clauses[6].id, severity: "MEDIUM",   category: "Broad Non-Compete",       description: "1-year non-solicit may not be enforceable in all jurisdictions.", suggestion: "Narrow to senior employees only.", confidence: 0.72 },
      { documentId: doc.id, clauseId: clauses[4].id, severity: "LOW",      category: "No Forum Selection",     description: "Governing law present but no exclusive forum clause.", suggestion: "Add Karachi courts exclusive forum.", confidence: 0.69 },
    ],
  });

  // Embeddings (lightweight chunks)
  const chunks = chunkText(SAMPLE_NDA, 200, 20);
  const vecs = await embed(chunks);
  await prisma.documentEmbedding.createMany({
    data: chunks.map((c, i) => ({
      documentId: doc.id,
      chunkIndex: i,
      chunkText: c,
      embedding: JSON.stringify(vecs[i]),
      tokenCount: Math.ceil(c.length / 4),
    })),
  });

  // Timeline events
  await prisma.timelineEvent.createMany({
    data: [
      { documentId: doc.id, eventType: "PAYMENT",       description: "Invoice payment due (30 days from receipt)", relativeExpr: "30 days from invoice", urgency: "UPCOMING" },
      { documentId: doc.id, eventType: "EXPIRY",        description: "Confidentiality period ends", eventDate: new Date("2029-06-01"), urgency: "FUTURE" },
      { documentId: doc.id, eventType: "NOTICE_PERIOD", description: "Termination notice (30 days)", relativeExpr: "30 days prior to termination", urgency: "FUTURE" },
    ],
  });

  // Annotation by lawyer
  await prisma.annotation.create({
    data: {
      documentId: doc.id,
      clauseId: clauses[2].id,
      authorId: lawyer.id,
      content: "Recommend capping this indemnification at the contract value with explicit carve-outs for gross negligence and IP infringement.",
    },
  });

  // Compliance rules (admin-created)
  const rules = await Promise.all([
    prisma.complianceRule.create({
      data: {
        name: "NDA Confidentiality Duration Clause",
        description: "Contract must specify a confidentiality duration in years or months.",
        category: "Contract Essentials",
        jurisdiction: "GENERIC",
        rulePattern: "\\b(\\d+)\\s*(year|month)s?\\b.*\\b(confidential|non-disclosure)\\b|\\b(confidential|non-disclosure)\\b.*\\b(\\d+)\\s*(year|month)s?\\b",
        severity: "HIGH",
        requiresLLM: false,
        createdBy: admin.id,
      },
    }),
    prisma.complianceRule.create({
      data: {
        name: "Governing Law Specified",
        description: "Document must explicitly state a governing law jurisdiction.",
        category: "Contract Essentials",
        jurisdiction: "GENERIC",
        rulePattern: "governed by the laws of|governing law",
        severity: "MEDIUM",
        requiresLLM: false,
        createdBy: admin.id,
      },
    }),
    prisma.complianceRule.create({
      data: {
        name: "Liability Cap Required",
        description: "Contract must include a clear cap on liability exposure.",
        category: "Contract Essentials",
        jurisdiction: "GENERIC",
        rulePattern: "liability\\s+(shall be|is)\\s+limited|liability\\s+cap",
        severity: "HIGH",
        requiresLLM: false,
        createdBy: admin.id,
      },
    }),
    prisma.complianceRule.create({
      data: {
        name: "Data Protection Clause (PK Bill 2023)",
        description: "Contracts involving personal data must reference the Pakistan Personal Data Protection Bill 2023.",
        category: "Data Protection",
        jurisdiction: "PK",
        rulePattern: "personal\\s+data|data\\s+protection",
        severity: "CRITICAL",
        requiresLLM: false,
        createdBy: admin.id,
      },
    }),
    prisma.complianceRule.create({
      data: {
        name: "Force Majeure Coverage",
        description: "Contract should include a force majeure clause covering extraordinary events.",
        category: "Contract Essentials",
        jurisdiction: "GENERIC",
        rulePattern: "force\\s+majeure|act\\s+of\\s+god",
        severity: "MEDIUM",
        requiresLLM: false,
        createdBy: admin.id,
      },
    }),
    prisma.complianceRule.create({
      data: {
        name: "Reasonable Indemnification Cap",
        description: "Indemnification clauses should include caps and carve-outs.",
        category: "Contract Essentials",
        jurisdiction: "GENERIC",
        rulePattern: null,
        severity: "HIGH",
        requiresLLM: true,
        createdBy: admin.id,
      },
    }),
    prisma.complianceRule.create({
      data: {
        name: "Termination Notice Period ≥ 60 days",
        description: "For material contracts, termination notice should be at least 60 days.",
        category: "Contract Essentials",
        jurisdiction: "GENERIC",
        rulePattern: null,
        severity: "MEDIUM",
        requiresLLM: true,
        createdBy: admin.id,
      },
    }),
    prisma.complianceRule.create({
      data: {
        name: "IP Assignment Clarity",
        description: "Contracts should explicitly assign or license intellectual property rights.",
        category: "IP Rights",
        jurisdiction: "GENERIC",
        rulePattern: "intellectual\\s+property|IP\\s+rights",
        severity: "HIGH",
        requiresLLM: false,
        createdBy: admin.id,
      },
    }),
  ]);

  // Legal templates
  await prisma.legalTemplate.createMany({
    data: [
      { createdBy: admin.id, name: "Standard NDA — Pakistan", category: "NDA", jurisdiction: "PK", promptText: "Generate a mutual NDA under Pakistani jurisdiction with 3-year confidentiality, mutual obligations, and Karachi forum selection.", isActive: true },
      { createdBy: admin.id, name: "Employment Contract — Permanent", category: "EMPLOYMENT", jurisdiction: "PK", promptText: "Generate a permanent employment contract under Pakistani labour law with probation, leave, and termination provisions.", isActive: true },
      { createdBy: admin.id, name: "Rental — Residential", category: "RENTAL", jurisdiction: "PK", promptText: "Generate a residential lease agreement under Sindh tenancy law with security deposit and maintenance provisions.", isActive: true },
      { createdBy: admin.id, name: "Service Agreement — Consultancy", category: "SERVICE", jurisdiction: "GENERIC", promptText: "Generate a consultancy services agreement with scope, fees, IP assignment, and confidentiality.", isActive: true },
      { createdBy: admin.id, name: "Partnership — 50/50", category: "PARTNERSHIP", jurisdiction: "GENERIC", promptText: "Generate an equal-share partnership agreement with capital contributions, management, and dissolution provisions.", isActive: true },
    ],
  });

  // Chat session w/ messages
  const session = await prisma.chatSession.create({
    data: { userId: user.id, title: "What's the termination notice in my NDA?" },
  });
  await prisma.chatMessage.createMany({
    data: [
      { sessionId: session.id, role: "USER", content: "What's the termination notice period in my NDA?" },
      {
        sessionId: session.id,
        role: "ASSISTANT",
        content: `According to your "Sample NDA - Acme x XYZ.txt", either party may terminate the Agreement with **30 days written notice**. Note: Lexora flagged this as a MEDIUM risk — for material engagements, 60–90 days is more typical.`,
        sourceChunks: JSON.stringify([
          { documentId: doc.id, documentName: doc.originalName, chunkIndex: 3, similarity: 0.91 },
        ]),
      },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: user.id, type: "ANALYSIS_COMPLETE", title: "Analysis ready", body: `${doc.originalName} has been analysed. Risk score: 58/100.`, resourceId: doc.id, priority: "MEDIUM" },
      { userId: user.id, type: "ANNOTATION_ADDED", title: "New annotation", body: `${lawyer.name} added a note to your indemnification clause.`, resourceId: doc.id, priority: "MEDIUM" },
      { userId: user.id, type: "TIMELINE_DUE", title: "Upcoming deadline", body: "Invoice payment due in 30 days.", resourceId: doc.id, priority: "HIGH", isRead: false },
    ],
  });

  // Drafted document
  await prisma.draftedDocument.create({
    data: {
      userId: user.id,
      templateType: "NDA",
      title: "Mutual NDA — Lexora v1",
      content: SAMPLE_NDA,
      version: 1,
      versionHistory: "[]",
      parties: JSON.stringify({ partyA: "Acme Inc.", partyB: "XYZ Ltd." }),
    },
  });

  // Audit log entries
  const actions = ["REGISTER", "LOGIN", "UPLOAD", "ANALYSE", "COMPLIANCE_RUN", "ANNOTATE", "DRAFT_CREATE", "LOGOUT"];
  await prisma.auditLog.createMany({
    data: actions.map((a, i) => ({
      userId: i % 2 ? user.id : lawyer.id,
      action: a,
      resourceType: a === "REGISTER" || a === "LOGIN" || a === "LOGOUT" ? "User" : "Document",
      resourceId: a === "REGISTER" || a === "LOGIN" || a === "LOGOUT" ? (i % 2 ? user.id : lawyer.id) : doc.id,
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    })),
  });

  console.log(`✅ Sample document: "${doc.originalName}" with ${clauses.length} clauses + 5 risks`);
  console.log(`✅ ${rules.length} compliance rules, 5 legal templates`);
  console.log(`✅ 3 notifications, 8 audit log entries`);
  console.log(`\n🎉 Done! Login at http://localhost:3000/login`);
  console.log(`   admin@lexora.ai   / password123  (ADMIN)`);
  console.log(`   lawyer@lexora.ai  / password123  (LAWYER)`);
  console.log(`   talha@lexora.ai   / password123  (USER)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
