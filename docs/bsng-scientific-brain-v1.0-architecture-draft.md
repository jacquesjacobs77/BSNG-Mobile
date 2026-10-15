<!-- Draft scientific architecture only. Android code, Expo OTA channel, and all existing research reports are unchanged. -->
**Google Drive review copy:** https://docs.google.com/document/d/11MjvvpaIeeeNbwSL_WCo4qpaMcy-JlU-W02tFOFA5M8/edit

# BSNG SCIENTIFIC BRAIN v1.0

ARCHITECTURE AND SCIENTIFIC VALIDATION SPECIFICATION

Version 0.1 | Draft for joint review | 15 October 2026

DESIGN ONLY: this does not modify the working Android app or claim that the proposed learning engine is implemented.

## 1 — Executive agreement

The architecture is a continuously improving, multidisciplinary scientific research platform. It should challenge as well as explore the BSNG hypothesis, record negative findings, distinguish measured facts from interpretations, and require independent validation. Genome processing is continuous across the full defined reference: up to 10 million OWNED bases per batch, with durable checkpointing, not a 10-million-base total limit. Retain ALL qualifying model-specific candidates under preregistered criteria; never discard evidence solely because it does not appear in a top-20 UI list.

## 2 — Dossier and scientific boundaries

The April 2025 BioSynaptic Nanogenesis Technical Dossier proposes RNA-programmable logic, protein sensing, cellular bioenergetics, nanoscale chassis, potential genetic/chromatin interaction and controlled lifecycle. These are proposed capabilities, not experimental BSNG nanite measurements. The original Research Classification and Field of Study names synthetic biology, molecular nanotechnology, bio-nanorobotics, and a combined biomedical/genomic engineering category, separated here into five software specialties. The original GC mutation code is historical research context, not a calibrated nanite binding model. The existing v0.7 Android/Ensembl/CTCF system is a natural protein sequence-reference benchmark, not complete genome coverage.

## 3 — Five scientific specialist modules

A. SYNTHETIC BIOLOGY: gene regulation, RNA/protein expression, molecular logic and synthetic biological systems.

B. MOLECULAR NANOTECHNOLOGY: nanoscale materials, structural constraints, molecular interactions, biophysical stability.

C. BIO-NANOROBOTICS: sensing, control, feedback, lifecycle and engineered biological information processing.

D. BIOMEDICAL ENGINEERING: cellular/immune context, toxicology, delivery, safety evidence, clinical ethics.

E. GENOMIC ENGINEERING: assembly, DNA/RNA, chromatin, genome annotation, repair, off-target contexts and human variation.

Cross-cutting: ATP/metabolism and bioenergetics, molecular computing, epigenomics, statistics, methods, reproducibility and research ethics. These are AI software capabilities, not credentialed independent human scientists.

## 4 — Six-layer technical architecture

L1 Sources: pinned reference genomes, curated literature, public experimental results and variant sources with IDs, licenses and provenance.

L2 Deterministic services: genome streaming, coordinate checking, model scoring, statistics and repeatable reports.

L3 Scientific memory: immutable source snapshots, batch checkpoints, a genome coverage ledger, indexed candidate records, experimental labels and citation-linked knowledge.

L4 Scientific AI: five specialist reviewers plus a coordinator for interpretation, contradiction seeking and falsifiable hypotheses.

L5 Learning laboratory: independent-data model training/validation, calibration, uncertainty, release gating and rollback.

L6 Governance and interfaces: permissions, user approvals, audit trail, compute budgets and mobile access.

AI commentary is versioned separately; original source data and measurement records cannot be overwritten by a model.

## 5 — Whole-GRCh38 scan engine

Freeze a specific GRCh38 reference source and indexed FASTA, accession, checksum, chromosome lengths and aliases. Primary assembly chromosomes 1–22, X, Y and mitochondrion form the first separately scoped coverage target; ALT, patches and unplaced/unlocalized sequences must be addressed explicitly as additional scope. An earlier project reference manifest says GRCh38.p14 / RefSeq GCF_000001405.40 but has no full SHA-256, so it cannot yet establish an independently verified freeze. Avoid silently treating an Ensembl API reference and a RefSeq FASTA as identical bytes.

The baseline is ~3.1 billion reference bases, requiring roughly 310–320 batches; the exact frozen genome manifest defines the count. Batches contain at most 10M assigned genomic start positions; overlap read-only flanking bases where a model window spans a batch boundary. Deduplicate by one owner batch per window. No crossing chromosome boundaries. Every run retrieves and checks reference DNA, scores applicable windows, saves qualifying candidates, logs negative/unassessable outcomes, commits a report, and advances only when durable storage is confirmed.

States: PLANNED, CLAIMED, RUNNING, VERIFIED, STORED, COMPLETE, RETRYABLE_ERROR, BLOCKED_FOR_REVIEW. Retries must be idempotent. Coverage reports must account for ambiguous bases, errors and all in-scope windows. COMPLETED means genuine coverage, not just that a scheduled series finished.

## 6 — Candidate preservation and ranking

Preregister model-specific window length, threshold, background distribution, strand treatment, ambiguous-N policy, deduplication and controls. Retain all qualifying sites in partitioned, searchable records, plus score distributions, exclusion counts and genuine null findings. Top-K is a display view only. Estimate cardinality and costs using a representative real-data pilot before large-scale ingestion. Do not create a single combined BSNG nanite-binding or safety score by mixing unrelated reference models.

Minimal candidate: ID, source accession/chromosome, start/end (explicit 1-based inclusive), orientation, reference hash/context, batch ID, model+version, raw/calibrated score if genuinely available, inclusion rule, source labels, evidence level, annotation/variant snapshot IDs and immutable run checksum.

## 7 — Multiple human genomes

Only after a frozen baseline: analyze ethically authorized, suitable public or consented human genomic resources to assess observed variant-specific changes. Use appropriate haplotype/indel/structural variation representation, coordinate mapping and transparent population diversity limits. An observed variant changing a motif score is a computational sensitivity, not a proven future mutation or physical destabilization of an uncharacterized BSNG construct. Never upload identifiable individual genomes to a public code repository or shared public Drive folder.

## 8 — AI memory and scientific literature learning

Three distinct memories: (1) immutable source observations and reproducible computations; (2) literature claims and biological assertions tied to exact citations, context, revisions, uncertainties and counterevidence; (3) proposed AI interpretations and research hypotheses clearly marked unverified. The system continuously incorporates source-checked literature and database corrections through retrieval and a versioned evidence graph; learning from reading literature is not the same as improving a biochemical prediction model.

## 9 — Real predictive learning

All new models need named training/validation/test sources, leakage-resistant splits, independent experiments where available, calibration, uncertainty intervals, negative controls and external benchmarks. Test how performance changes by guide/locus/cell/assay source as appropriate. An AI may not train on its own generated positives as if they were measured binding. Model promotion must be reviewed, independently benchmarked and reversible. Improvements must demonstrate measurable gains over frozen baseline models, not merely agreeable explanations. Learning covers all five disciplines only where data and valid scientific outputs exist.

## 10 — Autonomous computational research

Permitted first-phase autonomous actions: reproduce a public genome report, audit a mismatch, run preregistered annotation comparisons, test a frozen reference-model benchmark, search for falsifying evidence and propose a new non-interventional analysis. Each self-initiated investigation records ID, reason, original question, approved data sources, code/model hashes, budget/time cap, limitations and outcomes.

Cycle: OBSERVE → VERIFY SOURCES → FORMULATE HYPOTHESIS → PREDECLARE ANALYSIS → SANDBOX COMPUTATION → AUDIT RESULT → SEEK DISCONFIRMATION → REPORT → HUMAN REVIEW. Any larger cost, protected data, publication, promoted model or physical experiment requires explicit human authorization and specialist oversight. Autonomous AI does not equal an independently credentialed scientist.

## 11 — Separate biological evidence gates

E0: concept/no measurement. E1: authentic data with reproducible computational model result. E2: independently validated natural biological comparator system (e.g. CTCF or GUIDE-seq; not BSNG). E3: direct, well-controlled physical measurements on a specified BSNG hybrid molecule. E4: independently repeated cellular/system-level efficacy and adverse-effect evidence with proper governance.

The AI must separately evaluate sequence recognition, measured specificity, persistence/dissociation, variants, chromatin accessibility, tissue context, interference with gene activity/repair and host responses. None can be replaced with GC score alone. For the current proposed construct, physical BSNG affinity, integration persistence, and no-harm predictions remain NOT ASSESSABLE. A noncoding site is not universally safe.

## 12 — Google Drive and durable scientific storage

Google Drive: approved research documents, working drafts, citations, protocol versions, audit summaries, non-sensitive study exports, and reproducibility manifests. Use this dedicated folder for human-readable archival review.

Operational services still to choose: structured transaction database for candidate indexes and batch ledger; verified bulk object storage for FASTA and compressed datasets; evidence/citation search index; version-controlled code and frozen manifests. Public GitHub reports are acceptable for small non-sensitive public-reference exports, not as the high-volume database. Selection depends on actual cloud quota, security, cost, reliability and data sensitivity. No claim is made that these production services exist already.

## 13 — Verification milestones

M0: review and approve this draft. M1: freeze full reference checksum/chromosome manifest with provider reconciliation. M2: resumable full primary-chromosome scan with exact, independently audited coverage and retry safety. M3: all-qualifying-candidates registry and threshold provenance, not top-20 archival loss. M4: annotation and genetic-variation evidence. M5: five-specialty citation-grounded AI agent, controlled computational autonomy and external model evaluation. M6: authorized multi-genome comparisons. M7: experimental hypotheses and independent BSNG-specific validation only after physical molecular definition and professional oversight.

Tests: identical chunked/one-shot results; no gaps or duplicate windows; chromosome edge; N handling; data hashes; failed/resumed jobs; correct source biology status; candidate retention; no leakage; independent score reproduction and auditability.

## 14 — Open scientific architecture decisions

(1) First scan scope: GRCh38 primary chromosomes (1–22, X, Y, MT), with ALT/patch/unplaced sequence in a separate auditable extension? Recommended YES.

(2) Use Google Drive for archives and separate secure database/object storage for operational millions of findings? Recommended YES.

(3) Initial autonomy: bounded public-data computational investigations, larger cost and all wet-lab work require approval? Recommended YES.

(4) Initial mobile app only, with older desktop/tablet implementations assessed as a separate integration track? Needs scope agreement.

(5) BSNG-specific physical model remains unassessable until actual component identity and data are available? Recommended YES.

## 15 — Reference register and honesty statement

Project sources: BioSynaptic Nanogenesis: A Technical Dossier; Research Classification and Field of Study; White Paper: BioSynaptic Nanogenesis; Code BSNG; bsng_reference_manifest.json. These establish project concepts, not independent proof of biochemical feasibility.

Existing computational run: BSNG-Mobile v0.7 public GRCh38 chrX 1,000,000–10,999,999, natural CTCF motif model, run 38728890063-1; full DNA SHA-256 5bc91fa875ca7c069548838d1fef58a32d527d59211fb28c74331e1369f71953. Computational reference evidence only: https://github.com/jacquesjacobs77/BSNG-Mobile/blob/research-results-v07/reports/38728890063-1.json

All service layers, scientific governance rules, machine memory/learning and implementation milestones in this document are architecture proposals, not existing deployed components.

APP STATUS: unchanged. WHOLE GENOME STATUS: not scanned. AI SCIENTIFIC BRAIN STATUS: design only. BSNG PHYSICAL BINDING PROOF: not established.
