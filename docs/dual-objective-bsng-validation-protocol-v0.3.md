# BSNG v0.3 — Two-objective research and validation protocol

Status: **research specification / not evidence of a functioning nanite**.
This protocol defines the two separate questions the BSNG Studio interface and future computational engine must address.

## Objective A — genomic DNA recognition (binding-related computational predictions)
**Question:** When a physical recognition component and its independently established sequence-recognition model are supplied, which regions of a specified *authentic human reference genome* are predicted to be recognized, and with what uncertainty and off-target specificity?

**Current capability:** exact 15-nt motif occurrences and composition-matched decoy counts on authentic GRCh38 sequence (a **sequence-only** software baseline, not a binding-affinity calculation). The first 10M chrX run detected 0 motif occurrences and 0 occurrences in all 32 controls: **non-discriminating**, not a positive or negative biological binding experiment.

**Future prerequisites:** identity of recognition entity, mechanistic assumptions, experimentally characterized response variable, calibrated prediction model, negative controls and truly held-out validation data. Without these, molecular binding status must read **NOT ASSESSABLE** rather than reporting an invented binding probability or “optimal nanite binding site.”

## Objective B — genomic integration-context assessment
**Question:** Which analyzed genomic intervals meet *predefined annotation-based research criteria* for further evaluation, and which genomic features raise unresolved safety concerns?

The exploratory screen may attach reproducible **annotation context** from pinned, documented public assemblies/datasets: genes/transcripts, conserved and regulatory regions, repeats/low-complexity, variant annotations and other available evidence. Distinguish missing information from absence of an annotation.

**Crucial limit:** annotation overlap and GC content cannot establish actual integration success, a safe harbor, controlled replication, or in-vivo safety. Do not infer an actionable safe insertion site, nor treat a high rank as a recommendation for human genome modification. Integration capability requires a specified molecular integration mechanism and independent biological testing. Record **INTEGRATION FEASIBILITY NOT MEASURED** until such evidence exists.

## Non-negotiable data and scientific rules
1. Use public authentic human reference sequence for the primary computational run (initial fixed baseline: GRCh38 chrX 1,000,000–10,999,999, 1-based inclusive); distinguish reference assembly from an individual's personal genome.
2. Define genomic coordinate conventions (0-based half-open vs 1-based inclusive), assembly, chromosome, strand, source and version before every comparison. Never silently mix coordinates or assemblies.
3. Run Objectives A and B as **independent modules**; one score must never impersonate both recognition and integration evidence.
4. Pre-register the model, features, controls, weights, acceptance thresholds and exclusion criteria before evaluating a hold-out region. Do not optimize parameters after observing results and then call it external validation.
5. Report *all* tested candidates, including nonhits, insufficient-data cases and exclusion reasons. Do not auto-select a “best” candidate if no candidate meets pre-registered criteria.
6. Provide exact genomic location of each candidate and its evidentiary support or warning. A location is **screened**, never “experimentally proven to bind.”
7. Calibration must be compared against independent experimental data for an identified, physically characterized recognition or integration system, using a separate held-out dataset; no such validated BSNG construct or assay is in the source materials.
8. An independent lab should be able to rerun the exact code with frozen inputs and independently verify each output, including negative findings.

## Proposed BSNG Studio Results layout
**Panel A: DNA recognition**
- Status: observed sequence matches / recognition prediction supported by external model / NOT ASSESSABLE
- Candidate reference coordinates and strand (when available)
- Motif or recognition-model identifier; exact-match count; mismatch assumptions; comparator/off-target analyses
- Relevant experimentally established affinity measurements **only if supplied and validated**, otherwise show “not measured”
- Failed and inconclusive outcomes visibly retained

**Panel B: integration-context annotations**
- Exact coordinates and versioned genomic annotations
- Each annotation-based criterion, confidence, missing-data flag and reason for caution
- Historical/known safe-harbor literature may be linked for research context, not treated as a safety guarantee
- Explicit “integration feasibility and safety not experimentally tested” label

**Common run record**
- Stable run ID, experiment protocol ID and locked model version
- Species/assembly/coordinate system, genomic interval, source URL/accession, retrieval time
- Reference-sequence SHA-256 and per-chunk SHA-256, strand, all configuration parameters and PRNG seeds
- Code commit, pinned annotation datasets/releases/hashes, raw outputs, summary statistics and uncertainty
- Candidate list with objective-specific states, rejected cases and warnings
- Machine-readable JSON/CSV and documented re-execution instructions; human-readable PDF later
- Explicit evidence tier: SOFTWARE VERIFIED / REAL REFERENCE COMPUTATION / EXTERNAL PREDICTIVE VALIDATION / EXPERIMENTAL BINDING MEASUREMENT / IN-VIVO VALIDATION, with no unearned promotion

## Interpretation of first real 10M run
The previous run confirms actual Ensembl GRCh38 DNA was processed reproducibly and a specified arbitrary 15-nt string was absent in that interval along with all controls. This is an **uninterpretable recognition-ranking comparison for nanite binding**. It supplies no physical nanite recognition or integration result. Keep it as an audit record and test baseline; do not manufacture a best site from zero matching motifs.

## Implementation gates
- Gate 1: freeze and validate reference/data provenance and correctness of genomic coordinates.
- Gate 2: display real coordinate-resolved annotations for candidate sites and explain missing data.
- Gate 3: integrate an externally characterized recognition model only when its biological parameters/measurements are known.
- Gate 4: independently validate predictive accuracy and control performance; publish unsuccessful and inconclusive results.
- Gate 5: only with relevant specialist oversight and empirical evidence assess integration feasibility or in-vivo safety.

**This protocol is a scientific design, not experimental proof or actionable genomic intervention guidance.**
