/**
 * OpenAI wrapper with graceful mock fallback when no API key is configured.
 * This lets the app run end-to-end out of the box without any external dependency.
 */

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
export const hasOpenAI = !!apiKey;

export const openai = apiKey ? new OpenAI({ apiKey }) : null;
export const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

// Deterministic hash → seeded pseudo-random vector (1536-dim like text-embedding-3-large but
// scaled down to 384 to keep DB rows lighter for the mock case).
const MOCK_DIM = 384;
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (openai) {
    const resp = await openai.embeddings.create({ model: EMBED_MODEL, input: texts });
    return resp.data.map((d) => d.embedding);
  }
  // Mock: hash-seeded vectors. Similar text → similar vectors via shared bigram features.
  return texts.map((t) => {
    const v = new Array(MOCK_DIM).fill(0);
    const tokens = t.toLowerCase().match(/[a-z]+/g) || [];
    for (const w of tokens) {
      const rng = mulberry32(hashString(w));
      for (let i = 0; i < 8; i++) {
        const idx = Math.floor(rng() * MOCK_DIM);
        v[idx] += rng();
      }
    }
    // Normalize
    const mag = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
    return v.map((x) => x / mag);
  });
}

export async function chatComplete(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { temperature?: number; max_tokens?: number; jsonMode?: boolean } = {}
): Promise<string> {
  if (openai) {
    const resp = await openai.chat.completions.create({
      model: CHAT_MODEL,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.max_tokens ?? 2048,
      response_format: opts.jsonMode ? { type: "json_object" } : undefined,
      messages,
    });
    return resp.choices[0]?.message?.content || "";
  }
  // Mock fallback — returns plausible canned responses depending on the prompt.
  return mockChat(messages, opts.jsonMode);
}

function mockChat(
  messages: { role: string; content: string }[],
  jsonMode?: boolean
): string {
  const userText = messages
    .filter((m) => m.role !== "system")
    .map((m) => m.content)
    .join("\n");

  // Detect intent based on prompt content.
  if (jsonMode || /respond with json|return json|json schema/i.test(userText)) {
    if (/clause extraction|extract clauses|identify clauses/i.test(userText)) {
      return JSON.stringify({
        clauses: [
          { clauseType: "Confidentiality", text: "Each party agrees to maintain confidentiality of disclosed information for a period of three (3) years.", confidence: 0.92 },
          { clauseType: "Liability", text: "Liability shall be limited to the total fees paid under this Agreement.", confidence: 0.88 },
          { clauseType: "Termination", text: "Either party may terminate this Agreement with thirty (30) days written notice.", confidence: 0.91 },
          { clauseType: "GoverningLaw", text: "This Agreement shall be governed by the laws of Pakistan.", confidence: 0.95 },
          { clauseType: "Indemnification", text: "The Service Provider shall indemnify the Client against all third-party claims arising from negligence.", confidence: 0.84 },
          { clauseType: "Payment", text: "Invoices are payable within thirty (30) days of receipt.", confidence: 0.93 },
        ],
        risks: [
          { severity: "HIGH", category: "Vague Liability Cap", description: "Liability cap is not specified in concrete amount.", suggestion: "Specify a numerical cap or formula.", confidence: 0.81 },
          { severity: "MEDIUM", category: "Short Notice Period", description: "30-day termination may be insufficient for ongoing projects.", suggestion: "Consider extending to 60–90 days for material engagements.", confidence: 0.74 },
          { severity: "LOW", category: "Jurisdiction Reference", description: "Governing law cited generically without forum selection.", suggestion: "Add an exclusive-forum clause naming Karachi courts.", confidence: 0.69 },
          { severity: "CRITICAL", category: "Unlimited Indemnification", description: "Indemnification scope appears unbounded.", suggestion: "Cap indemnification at contract value or carve out IP/data.", confidence: 0.86 },
        ],
        summary:
          "This appears to be a commercial services agreement establishing confidentiality, payment terms, termination conditions, and indemnification obligations between two parties. The most material risks are an unbounded indemnification clause and an unspecified liability cap; both should be revised before signature. Termination notice is relatively short for material engagements.",
      });
    }
    if (/compliance|verdict/i.test(userText)) {
      return JSON.stringify({
        results: [
          { ruleIndex: 0, status: "COMPLIANT", confidence: 0.91, explanation: "Clause clearly specifies a confidentiality duration of three years." },
          { ruleIndex: 1, status: "NON_COMPLIANT", confidence: 0.83, explanation: "No data-protection clause present in the document." },
        ],
      });
    }
    if (/timeline|deadline|date extract/i.test(userText)) {
      return JSON.stringify({
        events: [
          { eventType: "DEADLINE", description: "Final deliverable submission", relativeExpr: "60 days after contract execution", urgency: "UPCOMING" },
          { eventType: "PAYMENT", description: "First installment due", relativeExpr: "30 days after invoice", urgency: "UPCOMING" },
          { eventType: "RENEWAL", description: "Auto-renewal trigger", relativeExpr: "annual on contract anniversary", urgency: "FUTURE" },
        ],
      });
    }
    if (/compare|diff/i.test(userText)) {
      return JSON.stringify({
        added:   [{ clauseType: "DataProtection", text: "Personal data shall be processed in accordance with the Personal Data Protection Bill 2023." }],
        removed: [{ clauseType: "Arbitration",     text: "Disputes shall be resolved through binding arbitration in London." }],
        modified: [{
          clauseType: "Termination",
          before: "Either party may terminate with 30 days written notice.",
          after:  "Either party may terminate with 60 days written notice; the Client may terminate immediately for material breach.",
        }],
        unchanged: 8,
        similarityScore: 0.72,
      });
    }
    if (/draft|generate contract|template/i.test(userText)) {
      return JSON.stringify({
        content: mockNDA(),
      });
    }
    return JSON.stringify({ ok: true, note: "Mock response — set OPENAI_API_KEY for real inference." });
  }

  // Plain text: chat / explanation.
  if (/explain.*clause|plain english/i.test(userText)) {
    return "This clause means that whoever signs this contract must keep the information they receive private. They can't share it with anyone outside the agreement, and this duty lasts for three years from the date of signing. If they break this rule, the other party can sue for damages or seek a court order to stop further disclosure.";
  }
  if (/negotia/i.test(userText)) {
    return "As opposing counsel, I'd push back on the indemnification scope — it currently has no cap, which exposes our client to unlimited liability. We'd propose capping indemnification at the total fees paid under the agreement, with carve-outs only for gross negligence and IP infringement. Additionally, the governing-law clause should be reciprocal — Pakistan venue makes sense, but we'd want a mutually-agreed forum selection.";
  }
  return `Based on the provided context, here is a synthesised answer: ${userText.slice(0, 200).replace(/\s+/g, " ").trim()}... [Note: this is a mock LLM response. Set OPENAI_API_KEY in .env to enable real inference.]`;
}

function mockNDA(): string {
  return `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (the "Agreement") is entered into as of the date last signed below (the "Effective Date") by and between the parties identified in the signature block.

1. DEFINITIONS
"Confidential Information" means any information disclosed by one party (the "Disclosing Party") to the other (the "Receiving Party"), whether orally or in writing, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure.

2. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party shall: (a) use the Confidential Information solely for the purpose of evaluating the proposed business relationship; (b) protect the Confidential Information with the same degree of care it uses for its own confidential information of similar nature, but in no event less than reasonable care; and (c) not disclose any Confidential Information to any third party without the prior written consent of the Disclosing Party.

3. EXCLUSIONS
The obligations under Section 2 shall not apply to information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) is rightfully received by the Receiving Party from a third party without restriction; (c) is independently developed by the Receiving Party without use of the Confidential Information; or (d) is required to be disclosed by law or court order, provided the Receiving Party gives prompt notice to the Disclosing Party.

4. TERM
This Agreement shall remain in effect for a period of three (3) years from the Effective Date, unless earlier terminated by mutual written agreement of the parties. The confidentiality obligations set forth herein shall survive termination of this Agreement for a period of five (5) years.

5. RETURN OF MATERIALS
Upon the Disclosing Party's request, the Receiving Party shall promptly return or destroy all materials containing Confidential Information.

6. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, without regard to its conflict of laws principles. The parties consent to the exclusive jurisdiction of the courts of Karachi.

7. ENTIRE AGREEMENT
This Agreement constitutes the entire understanding between the parties with respect to the subject matter hereof and supersedes all prior agreements, whether written or oral.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.`;
}
