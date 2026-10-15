# BSNG — Hybrid RNA-guided / protein–peptide DNA-recognition model
**Status:** Conceptual and computational research specification, NOT a demonstrated BSNG nanite or physical design.

## Interpretation confirmed by project author
The intended recognition mechanism is a **hybrid of RNA-guided and protein/peptide-mediated components**, rather than either component alone. This confirms the mechanism *category*, not a particular molecule, sequence, molecular architecture or experimentally measured interaction.

## Source-derived foundations versus new scientific interpretation
- The original BSNG research documentation proposes genetically encoded biological structures, nucleic-acid-mediated programmability, protein/peptide-like conformational behavior, CRISPR-related genomic integration and cellular ATP-dependent functions. These are proposed components and mechanisms in the conceptual literature.
- **New proposed research decomposition (not demonstrated in the original documentation):**
  - **RNA recognition module:** hypotheses about sequence-complementarity-dependent discrimination, mismatches and possible non-target recognition.
  - **Protein/peptide interaction module:** hypotheses about DNA-associated molecular recognition, attachment/context dependence and experimentally measurable association.
  - **Coupling/interface module:** a distinct hypothesis that joint behavior is more selective or functional than either module alone. Joint activity cannot be inferred from multiplying two computational scores.
  - **Integration module:** separate research question about persistence/integration and associated genomic context. Neither binding nor complementarity establishes genomic integration or safety.
- Do not assume a functional RNA-protein complex, gene-insertion capability, therapeutic effect, energy utilization or self-replication has been established.

## Falsifiable biological questions
**H-RNA:** With an independently characterized RNA-associated recognition system, can its frozen recognition rule distinguish established target and non-target DNA sequences across a human reference genome better than suitable negative controls?
**H-PROTEIN:** With an experimentally characterized natural protein reference, can a preselected protein-recognition model distinguish genomic regions enriched for measured association compared with matched backgrounds?
**H-HYBRID:** For a *specific characterized complex with both elements*, does an experimentally calibrated **joint** model predict independent observations better than either single-module model? Until that physical system and data exist: **NOT ASSESSABLE**.
**H-INTEGRATION:** Is there independent experimental evidence of site-specific genomic persistence or integration and of its safety in the relevant biological context? Until that mechanism and data exist: **NOT ASSESSABLE**.

## Existing verified BSNG software benchmarks (not evidence for the hybrid system)
1. Ensembl GRCh38 human chromosome X 1,000,000–10,999,999 (10,000,000 reference bases) processed with checksums.
2. Arbitrary 15-base string vs 32 shuffled-sequence controls: 0 observed target hits and 0 hits for controls; **non-discriminating sequence-only comparison**.
3. Natural human CTCF (JASPAR MA0139.1) profile vs ENCODE K562 CTCF ChIP-seq peaks on the same human reference interval: 88 measured peak regions, 88 GC-matched backgrounds, descriptive AUROC **0.8702221074**, 29/29 software tests. **CTCF is not an RNA-guided system and these measurements DO NOT validate the hybrid BSNG mechanism.**

## Independent reproducibility package (required for any future hybrid evaluation)
- Frozen reference assembly, exact chromosome/coordinates and source release; both per-chunk and complete sequence hashes.
- Versioned identity and assay context of each **physical molecular component**; independent evidence that they function together, not just proposed components.
- Explicitly named experimental observable, units, assay context, biological replicates, controls and uncertainty, with publicly available primary-data accessions where permitted.
- Frozen model equations/algorithm, training/validation data separation and independent held-out experimental dataset. Preserve complete parameter set, seed, software commit, library versions and error policy.
- For each coordinate-resolved candidate, independent RNA-module status, protein-module status, joint-hybrid status, specificity/off-target findings, genomic-context annotations and their own provenance.
- Do not silently turn missing values into zero. Preserve **NOT ASSESSABLE**, **NOT OBSERVED**, **COMPUTATION ONLY**, **EXPERIMENTALLY OBSERVED** and **DISCONFIRMED** as separate states.
- Report both positive and negative results. Identical inputs and version-pinned parameters must reproduce the same *computational* outcome; independent physical replications are different evidence.

## Strict claims boundary and engineering plan
1. Keep existing CTCF results labeled **NATURAL_PROTEIN_BENCHMARK**, not a nanite-target map.
2. Use an **already characterized, published RNA-guided protein system** as a second external benchmark, where legally accessible sequence-specificity and assay measurements can be frozen and evaluated independently. Do not fabricate guide-specific predictions or call these BSNG results.
3. Implement a typed **dual-module results schema** with separate status and evidence provenance for RNA, protein, joint coupling, and genomic integration; use explicit missing-data states.
4. Implement **independent held-out predictive validation** for each characterized reference system, including failure modes and confidence intervals, before making any predictive performance claims.
5. Only after a specific BSNG physical recognition component and empirical measurements are supplied should the BSNG-hybrid candidate-ranking model be specified and assessed.
6. No wet-lab construction instructions, genomic insertion-site prescriptions or engineering procedures for replication are generated by this specification.

**Decision:** The hybrid model is the working BSNG biological hypothesis; physical binding/integration remains unmeasured and cannot be established through sequence analysis alone.
