# BSNG RNA-guided natural reference benchmark v0.5 — locked before evaluation

Status: **pre-registered computational comparison of a published RNA-guided nuclease reference system**. This is NOT a method for designing guide RNAs or nanites, and NO BSNG nanite-binding or genomic-integration claims follow.

## Why this source
RNA-guided SpCas9 is an established natural protein–RNA system for which guide–target sequence comparisons and independently collected biological activity observations have been published. Use the manually curated TrueOT dataset from Bao Lab (revision of the CRISPR off-target scoring study, 2021), incorporating experimental editing/cleavage readouts from various publications.
- Curated release: https://github.com/baolab-rice/CRISPR_OT_scoring
- Frozen repository commit: `4ff0ccd2493de3dc658747d05fa6bb4fe12ea2c7`
- Source CSV: `custom_scoring/parsed_datasets/TrueOT/TrueOT_1806uniqueTriplet_gRNA_OT_label.csv`
- Expected Git blob SHA1: `8cd903a85c123105daed641a2579d2e161009d38`
- Full published 1,806 rows: 250 labels = 1 and 1,556 labels = 0 across 36 distinct guide strings (inspected before test).
- CSV variables: `gRNA,OT,label`. The table itself does **NOT** give chromosome, reference genome build, per-site genomic coordinates or assay conditions. **Do not invent these or call this an analysis of the same chrX 10M interval**.
- `label` denotes *curated experimentally observed activity classification*, not molecular binding affinity; verify original paper for exact per-study readout definitions. A 0 does not necessarily prove the molecule never binds/cleaves under any conditions.

## Frozen a priori simple baseline
**NO model fitting or guide design.** For 23-nt `gRNA` and 23-nt `OT` with A/C/G/T-only symbols:
- Define **sequence similarity score = negative Hamming mismatch count on positions 1–20 only** (the common candidate protospacer representation in these 23-nt strings). Exclude terminal positions from the metric entirely; do not model PAM or bulge penalties. This ignores recognized biology and is intentionally a **simple naive baseline**.
- Independently quantify **GC-content-only score = GC fraction of the OT 20-nt prefix** as a non-mechanistic comparator, not a genuine Cas9 classifier.
- Exclude records not exactly 23/23 nt or containing non-ACGT; keep and report exclusion counts, reason and positive/negative label balance. Bulge-containing sites with unequal lengths cannot be scored by this baseline and must not be silently forced into alignment.
- Do NOT select a classification threshold from these observations; score based on full ranks.
- Primary metric: macro-average **per-guide AUROC** over guide groups containing at least one experimentally active and at least one inactive observation. Report group eligibility and excluded single-class guides.
- Secondary: pooled AUROC, pooled average precision (tie-aware), prevalence of positive events, per-guide counts, and comparator AUROC. Pooled results may be confounded by guide-specific prevalence.
- Uncertainty: seeded (**1729**) guide-cluster bootstrap of the macro AUROC, 500 repetitions, 2.5/97.5 percentile bounds; do not claim independent experiments from bootstrap samples.
- Falsification/negative outcomes: model AUROC <= 0.5, uninterpretable single-class groups, observed false positives, and failed data integrity checks must be preserved.
- Input source SHA-256 and code commit, metrics and model formula written to machine-readable JSON. Full source CSV included as immutable download from original cited source, subject to upstream license and redistribution terms (do NOT commit the CSV as source data).
- This is an **external-data retrospective reference benchmark without parameter fitting on its labels**. Not a prospective test, nor an independently replicated BSNG physical experiment. Reanalysis of the same literature is not independent laboratory replication.

## Human genome linkage & candidate locations
The existing **real Ensembl GRCh38 chrX:1,000,000–10,999,999** FASTA benchmark remains separately verified, with checksum `5bc91fa875ca7c069548838d1fef58a32d527d59211fb28c74331e1369f71953`. The TrueOT CSV does not provide enough provenance to cross-map its 1,806 pairs to that 10M interval. The code **must not invent genomic coordinates** or transfer empirical TrueOT labels to arbitrary chrX sites. A future coordinate-resolved RNA-guided benchmark must independently obtain a source with reference assembly, genomic coordinates and credible measured off-target readouts, and validate their reference consistency.

## Hybrid/BSNG claims boundary
- This SpCas9 dataset assesses an established native RNA-guided nuclease system, not the BSNG physical construct.
- CTCF JASPAR vs ENCODE is our separate natural **protein-recognition** benchmark; it does not independently validate the hybrid BSNG model.
- Do **NOT** multiply or add the two benchmark outputs to estimate any BSNG binding affinity or integration-site safety. A specifically characterized physical hybrid complex with joint experimental measurements is required.
- Report module statuses: natural RNA-guided reference = benchmarked; natural protein reference = benchmarked; **BSNG hybrid coupling = NOT ASSESSABLE**, **BSNG genomic integration = NOT ASSESSABLE**.

Reproducibility: commit-pinned curated release; published citation; archived source-hash and analysis code; deterministic random seed; include all failures and exclusions. This specification is computational evidence interpretation, not molecular construction or gene-editing guidance.
