export type PakistanLegalChunk = {
  heading: string;
  text: string;
};

export type PakistanLegalSource = {
  title: string;
  sourceType: "ACT" | "REGULATION" | "GUIDELINE" | "NOTE";
  authority: string;
  citation?: string;
  officialUrl: string;
  effectiveDate?: string;
  summary: string;
  tags: string[];
  chunks: PakistanLegalChunk[];
};

export const PAKISTAN_LEGAL_CORPUS: PakistanLegalSource[] = [
  {
    title: "Contract Act, 1872",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act IX of 1872",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-a50%3D-sg-jjjjjjjjjjjjj",
    effectiveDate: "1872-09-01",
    summary:
      "Core private contract law for Pakistan: formation, consent, capacity, lawful consideration, performance, breach, damages, indemnity, guarantee, bailment and agency.",
    tags: ["contracts", "formation", "damages", "agency", "indemnity"],
    chunks: [
      {
        heading: "Formation essentials",
        text:
          "Pakistan contract review should first check offer, acceptance, consideration, capacity, free consent and lawful object. A clause may be commercially useful but still weak if the parties, acceptance mechanics, consideration or authority to sign are unclear. For AI review, flag uncertainty around party names, signatures, consideration, scope of obligations and whether the person signing appears competent or authorised.",
      },
      {
        heading: "Consent and voidability",
        text:
          "Free consent is a key risk lens under the Contract Act. Red flags include coercion, undue influence, fraud, misrepresentation, mistake, unconscionable imbalance, hidden material facts and vague language that could defeat mutual assent. A contract induced by these issues may be voidable or disputed, so summaries should separate business risk from enforceability risk.",
      },
      {
        heading: "Breach, damages and penalties",
        text:
          "For breach analysis, identify the primary obligation, the exact failure, any cure period, the damages formula and whether the clause looks compensatory or punitive. Liquidated damages, indemnity and liability-cap provisions should be checked together because they control the financial consequence of breach. The app should flag unlimited indemnities, unclear caps, remote damages and remedies that conflict with the main bargain.",
      },
      {
        heading: "Agency and authority",
        text:
          "Where an agreement is signed by an agent, director, attorney or representative, the review should ask whether authority is shown. Agency duties include following instructions, using reasonable diligence and accounting for gains or losses. Contracts involving powers of attorney, company signatories or delegated authority should be checked for board approval, authorisation language and identity of the principal.",
      },
    ],
  },
  {
    title: "Specific Relief Act, 1877",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act I of 1877",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-bJ4%3D-sg-jjjjjjjjjjjjj",
    effectiveDate: "1877-02-07",
    summary:
      "Civil remedies statute covering specific performance, injunctions, rescission, cancellation, declaratory relief and related equitable remedies.",
    tags: ["remedies", "injunction", "specific performance", "rescission"],
    chunks: [
      {
        heading: "Specific performance lens",
        text:
          "When a contract asks for specific performance, review whether damages would be an adequate remedy, whether obligations are sufficiently definite, whether reciprocal obligations are performable and whether the requesting party has clean performance history. Vague service obligations, personal skill contracts and uncertain price or scope terms should be flagged as poor candidates for specific performance.",
      },
      {
        heading: "Injunctions and negative covenants",
        text:
          "Non-compete, confidentiality, non-solicit, IP misuse and disclosure clauses often rely on injunctive relief. The RAG answer should distinguish between a contractual promise and the practical court remedy. Strong drafting usually states irreparable harm, survival, narrow scope, duration, territory and permitted disclosures, while avoiding overbroad restraints.",
      },
      {
        heading: "Cancellation, rescission and declarations",
        text:
          "If a document appears void, voidable, forged, obtained by misrepresentation or creates a cloud over rights, the Specific Relief Act is relevant to cancellation, rescission or declaratory relief. In document review, flag clauses that create one-sided cancellation powers, unclear termination effects or missing return-of-property obligations after rescission.",
      },
    ],
  },
  {
    title: "Sale of Goods Act, 1930",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act III of 1930",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-a5aU-sg-jjjjjjjjjjjjj",
    effectiveDate: "1930-07-01",
    summary:
      "Commercial sale-of-goods framework for contracts of sale, conditions, warranties, title, delivery, acceptance, unpaid seller rights and damages.",
    tags: ["sale of goods", "warranty", "delivery", "title"],
    chunks: [
      {
        heading: "Goods contract checklist",
        text:
          "For sale-of-goods contracts, check identification of goods, quantity, price, delivery location, inspection, acceptance, risk transfer, title transfer, payment timing and rejection rights. Missing delivery and acceptance mechanics create avoidable disputes, especially where invoices, purchase orders and master terms conflict.",
      },
      {
        heading: "Conditions, warranties and quality",
        text:
          "Risk review should separate conditions, warranties and representations. Quality, fitness, sample, description and title terms often determine whether a buyer can reject goods or only claim damages. The AI should flag broad warranty disclaimers, inconsistent remedies, short inspection periods and missing product specifications.",
      },
      {
        heading: "Unpaid seller and remedies",
        text:
          "If payment is delayed or buyer insolvency is a risk, unpaid seller rights matter. Review retention of title, lien, stoppage in transit, resale rights, interest on late payments and dispute mechanics. Strong contracts align these remedies with delivery documents and invoice terms.",
      },
    ],
  },
  {
    title: "Arbitration Act, 1940",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act X of 1940",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-cJab-sg-jjjjjjjjjjjjj",
    effectiveDate: "1940-07-01",
    summary:
      "Pakistan's domestic arbitration framework for arbitration agreements, references, arbitral awards and court supervision.",
    tags: ["arbitration", "disputes", "award", "forum"],
    chunks: [
      {
        heading: "Arbitration clause essentials",
        text:
          "A Pakistani arbitration clause should identify the seat or place, number of arbitrators, appointment method, language, governing law, procedural rules and court forum for interim or supervisory relief. A clause that only says disputes will be arbitrated may still create appointment and enforcement friction.",
      },
      {
        heading: "Court interaction",
        text:
          "Domestic arbitration under the 1940 Act involves court interaction around filing, staying proceedings, appointing arbitrators in some cases and making an award enforceable. RAG answers should avoid implying that arbitration fully excludes courts. Flag clauses that confuse mediation, expert determination and arbitration.",
      },
      {
        heading: "Drafting risk flags",
        text:
          "Common arbitration defects include no seat, contradictory court jurisdiction, no appointment fallback, foreign institution named without rules, no interim-relief language and unclear cost allocation. For Pakistan contracts, align arbitration with governing law and exclusive jurisdiction provisions.",
      },
    ],
  },
  {
    title: "Limitation Act, 1908",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act IX of 1908",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apab-sg-jjjjjjjjjjjjj",
    effectiveDate: "1908-08-07",
    summary:
      "Limitation framework controlling when suits, appeals and applications become time-barred, plus computation and exclusion rules.",
    tags: ["limitation", "deadline", "litigation", "time bar"],
    chunks: [
      {
        heading: "Time-bar risk",
        text:
          "Every legal memo should ask when the cause of action accrued and what limitation article may apply. Contract deadlines, acknowledgments, renewals, payment defaults and demand notices can affect limitation analysis. The app should flag missing dates and recommend checking the schedule instead of giving a final limitation opinion from incomplete facts.",
      },
      {
        heading: "Computation issues",
        text:
          "Limitation computation can involve excluded time, legal disability, court closure, good-faith proceedings in the wrong forum and continuing obligations. A RAG answer should preserve uncertainty where facts are missing and should not treat a contractual notice period as the same thing as a statutory limitation period.",
      },
      {
        heading: "Document drafting impact",
        text:
          "Drafting should preserve evidence of breach, notice, acknowledgment, payment and cure communications. Clauses that require notices, invoices or certificates should state delivery mechanics because those records often become the timeline for limitation and enforcement.",
      },
    ],
  },
  {
    title: "Electronic Transactions Ordinance, 2002",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Ordinance LI of 2002",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apaUY2Fta5Y%3D-sg-jjjjjjjjjjjjj",
    effectiveDate: "2002-09-11",
    summary:
      "Legal recognition framework for electronic documents, electronic communications, electronic signatures and certification services in Pakistan.",
    tags: ["electronic signature", "digital contracts", "e-commerce", "records"],
    chunks: [
      {
        heading: "Electronic records and signatures",
        text:
          "Digital contracting in Pakistan should check whether the transaction can be electronic, whether electronic signature requirements are met and whether the system preserves integrity, attribution and audit trail. For important contracts, prefer signature logs, identity verification, timestamps and tamper-evident storage.",
      },
      {
        heading: "Attribution, dispatch and receipt",
        text:
          "Electronic notices need clear rules for sender identity, delivery address, dispatch time, receipt time and failed delivery. Contracts should name acceptable channels such as email, portal or certified e-sign provider and should avoid relying on informal messaging for legally significant notices unless expressly permitted.",
      },
      {
        heading: "Evidence and retention",
        text:
          "RAG answers about e-contracts should mention record retention, audit trail, document integrity and ability to reproduce the electronic record. Where a document must be stamped, registered or notarised under another law, electronic execution may not remove those separate formalities.",
      },
    ],
  },
  {
    title: "Companies Act, 2017",
    sourceType: "ACT",
    authority: "Securities and Exchange Commission of Pakistan",
    citation: "Act XIX of 2017",
    officialUrl: "https://www.secp.gov.pk/laws/companies-act-2017",
    effectiveDate: "2017-05-30",
    summary:
      "Corporate law framework for Pakistani companies, including incorporation, governance, directors, filings, accounts, meetings and corporate actions.",
    tags: ["companies", "corporate governance", "directors", "SECP"],
    chunks: [
      {
        heading: "Corporate authority",
        text:
          "When a Pakistani company signs a contract, review the corporate name, registration status, signatory title, board approval, power of attorney and any reserved matters. High-value contracts, asset transfers, guarantees, related-party arrangements and borrowing often require extra corporate authority checks.",
      },
      {
        heading: "Governance and filings",
        text:
          "Companies Act review should flag missing board minutes, shareholder approvals, statutory filings, beneficial ownership or disclosure obligations where the transaction changes control, directors, share capital or major assets. The AI should not assume a director can bind the company in every transaction without context.",
      },
      {
        heading: "Related-party and minority risk",
        text:
          "Related-party transactions, director interests and conflicts should be disclosed and approved through proper company processes. Contracts with affiliates, founders, directors or major shareholders should be checked for fairness, approval trail, valuation support and minority-shareholder risk.",
      },
    ],
  },
  {
    title: "SECP AML/CFT/CPF Regulatory Materials",
    sourceType: "REGULATION",
    authority: "Securities and Exchange Commission of Pakistan",
    citation: "AML/CFT/CPF Regulations and SECP guidance materials",
    officialUrl: "https://www.secp.gov.pk/documents/aml-cft-regulations/",
    summary:
      "SECP anti-money-laundering, countering-financing-of-terrorism and counter-proliferation-financing requirements for regulated sectors.",
    tags: ["AML", "CFT", "KYC", "beneficial ownership", "SECP"],
    chunks: [
      {
        heading: "KYC and customer due diligence",
        text:
          "For regulated-sector contracts, onboarding should address customer due diligence, identity verification, beneficial ownership, sanctions screening, politically exposed persons and ongoing monitoring. Agreements should support information requests, updates, suspension rights and termination for compliance failure.",
      },
      {
        heading: "Suspicious activity and recordkeeping",
        text:
          "AML-sensitive contracts should preserve records, transaction data, source-of-funds information and audit trails. A review should flag cash-heavy payments, nominee structures, unclear beneficial owners, offshore intermediaries and refusal to provide compliance documents.",
      },
      {
        heading: "Compliance clauses",
        text:
          "Strong AML clauses include representations on sanctions and beneficial ownership, cooperation obligations, audit rights, immediate notice of status changes, right to reject transactions and termination for regulatory risk. Do not treat AML as optional boilerplate for regulated SECP entities.",
      },
    ],
  },
  {
    title: "Digital Nation Pakistan Act, 2025",
    sourceType: "ACT",
    authority: "Pakistan Digital Authority",
    citation: "Act I of 2025",
    officialUrl: "https://www.pda.gov.pk/downloads/Digital-Nation-Pakistan-Act-1-of-2025.pdf",
    effectiveDate: "2025-01-29",
    summary:
      "Creates Pakistan's digital governance framework, including the National Digital Commission and Pakistan Digital Authority.",
    tags: ["digital governance", "data exchange", "public sector", "PDA"],
    chunks: [
      {
        heading: "Digital public infrastructure",
        text:
          "Technology contracts with Pakistan public-sector data should consider interoperability, digital public infrastructure, secure data exchange and government digital-service requirements. The Digital Nation framework increases the importance of auditability, identity, data governance and integration standards.",
      },
      {
        heading: "Data sharing and governance",
        text:
          "Where a contract involves government or citizen data, review data-sharing purpose, lawful authority, retention, access control, incident handling and audit logs. The app should flag broad data-use clauses, undefined processors, missing breach notice and vague transfer rights.",
      },
      {
        heading: "Procurement and platform risk",
        text:
          "Digital transformation projects should define uptime, cybersecurity, service levels, source code or escrow, migration assistance, data portability and exit support. For RAG answers, connect these drafting issues to Pakistan's public digital governance direction rather than treating them as generic SaaS terms.",
      },
    ],
  },
  {
    title: "Transfer of Property Act, 1882",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act IV of 1882",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-bpk%3D-sg-jjjjjjjjjjjjj",
    effectiveDate: "1882-07-01",
    summary:
      "Framework for transfers of immovable property, sale, mortgage, lease, exchange, gift and related property-law concepts.",
    tags: ["property", "lease", "mortgage", "transfer", "real estate"],
    chunks: [
      {
        heading: "Property transfer checks",
        text:
          "Real estate documents should identify the property, title chain, transferor capacity, consideration, possession, encumbrances, taxes, approvals and registration needs. A clause that describes property vaguely or omits title warranties should be flagged as high risk.",
      },
      {
        heading: "Lease drafting",
        text:
          "Lease review should cover term, rent, escalation, security deposit, repairs, permitted use, subletting, default, termination, possession handover and registration. For longer terms or immovable-property interests, coordinate the lease text with stamp and registration requirements.",
      },
      {
        heading: "Mortgage and security",
        text:
          "Security documents should specify secured obligations, property description, enforcement triggers, priority, insurance, maintenance, further assurances and release mechanics. The AI should flag security over property without ownership proof, valuation support or registration plan.",
      },
    ],
  },
  {
    title: "Stamp Act, 1899",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act II of 1899",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-cpg%3D-sg-jjjjjjjjjjjjj",
    effectiveDate: "1899-07-01",
    summary:
      "Stamp-duty framework for instruments, including chargeability, stamping mechanics, under-stamping and evidentiary consequences.",
    tags: ["stamp duty", "instruments", "execution", "evidence"],
    chunks: [
      {
        heading: "Stamping risk",
        text:
          "A Pakistan legal document may need stamp duty depending on instrument type, value, province and transaction structure. The app should flag agreements, leases, powers of attorney, mortgages, share transfers and settlement instruments for stamp review rather than assuming execution alone is enough.",
      },
      {
        heading: "Evidentiary consequences",
        text:
          "Under-stamped or unstamped instruments can create admissibility, penalty and enforcement issues. RAG answers should distinguish contract validity from the practical problem of relying on a document in court or before an authority when stamp requirements were missed.",
      },
      {
        heading: "Drafting controls",
        text:
          "Good drafting assigns responsibility for stamp duty, registration costs, penalties and presentation of original instruments. It should state who keeps originals, who bears taxes and what happens if a party fails to complete stamping or registration formalities.",
      },
    ],
  },
  {
    title: "Registration Act, 1908",
    sourceType: "ACT",
    authority: "Pakistan Code, Ministry of Law and Justice",
    citation: "Act XVI of 1908",
    officialUrl: "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apeU-sg-jjjjjjjjjjjjj",
    effectiveDate: "1909-01-01",
    summary:
      "Registration framework for documents affecting immovable property and other registrable instruments.",
    tags: ["registration", "property", "formalities", "documents"],
    chunks: [
      {
        heading: "Registrable documents",
        text:
          "Contracts affecting immovable property may require registration depending on document type and legal effect. Sale, mortgage, long-term lease, gift and certain property-right instruments should be flagged for registration review. Missing registration can weaken enforceability and third-party notice.",
      },
      {
        heading: "Presentation and execution evidence",
        text:
          "Registration review should ask who executed the document, whether identity and authority are provable, whether originals exist and whether presentation deadlines or registrar requirements apply. Powers of attorney and company signatories need special attention.",
      },
      {
        heading: "Interaction with stamp and property law",
        text:
          "Registration issues often overlap with stamp duty and Transfer of Property Act analysis. A robust RAG answer should not advise on property enforceability from contract wording alone; it should also check formalities, title, possession, mutation or registration steps where relevant.",
      },
    ],
  },
];

export const PAKISTAN_CORPUS_REVIEWED_AT = "2026-05-12";
