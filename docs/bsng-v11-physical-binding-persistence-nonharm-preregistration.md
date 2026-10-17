# BSNG v1.1 — Genomic DNA binding persistence and non-harm: falsifiable feasibility study

**Status: study specification and software evidence-gate. NOT a physical nanite experiment, nor evidence of BSNG DNA binding or safety.**  
**Research target:** a *characterized hybrid RNA-guided + protein/peptide-mediated recognition construct* interacting with DNA; genome integration is a separate question.

## 1. Audited starting point (17 October 2026)

Public human reference: **NCBI GRCh38.p14 GCF_000001405.40**, reference FASTA exact-source SHA-256 `df6e4918316e05a9cc1fd29c352841d3678b607d7a436819cd43371b52c814c0`. Three original + ten continued scientific batches B000001–B000013 account for **130,000,000 bases** of reference chromosome 1, `NC_000001.11:1–130,000,000`, 1-based inclusive. Full reference campaign: **13/1,003 batches**; **1,689** archived *natural CTCF* JASPAR MA0139.1 exploratory score-qualified motifs, **not BSNG target sites**. Four GenBank-only sequences totaling 481,426 bases remain outside the RefSeq-only scope. The multi-batch audit passed all SHA-256 Release-asset redownload verifications and source/receipt invariants. Job runtime approximately 2 minutes 24 seconds; cached source availability and cost policies vary.

Scientific audit: https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/39006202956  
Frozen index: https://github.com/jacquesjacobs77/BSNG-Mobile/blob/bsng-v09-real-ctcf-checkpoints/grch38p14-natural-ctcf-v09/index.json  
The BSNG v0.4 physical-readiness document already notes: original dossier has a *conceptual* RNA/protein hybrid, but **no individually identified, experimentally characterized physical nanite with a measured affinity to a named DNA sequence**. A paper-design TRL claim does not establish a working physical device. The legacy Python `simulate_binding` ranks windows by **GC content**; this is neither binding affinity nor an experimentally validated BSNG binding model.

## 2. Essential distinction: what would 'sustain a nanite binding' mean?

A physical binding claim needs a **physical binding entity**, a **DNA substrate**, and **independent, measurable observations**. A gene sequence does not itself reveal whether a hypothetical nanite can remain bound, whether a native chromatin protein blocks it, or whether attachment interferes with genomic regulation. Genomic integration or mutation repair requires additional mechanisms, not binding alone.

We will answer seven falsifiable questions separately, keeping negative and inconclusive results:

| Hypothesis | What independent investigators would need to observe | Status as of this report |
|---|---|---|
| H-RECOGNITION | Defined molecular complex associates with candidate DNA more than matched negative controls | NOT ASSESSABLE |
| H-PERSISTENCE | Association and dissociation kinetics, measured residence time and stability of the same physical complex | NOT ASSESSABLE |
| H-SPECIFICITY | Genuine sequence/context selectivity against alternate and irrelevant loci | NOT ASSESSABLE |
| H-CONTEXT | Whether the DNA region is physically accessible in the relevant cell type and how variation changes available context | NOT ASSESSABLE FOR BSNG |
| H-GENOME-INTEGRITY | Whether the interaction correlates with chromosome breaks, repair signaling or mutation patterns compared with independent controls | NOT ASSESSABLE |
| H-FUNCTIONAL-PERTURBATION | Whether local/global gene expression or chromatin organization changes with the system compared with controls | NOT ASSESSABLE |
| H-HYBRID-COUPLING | Whether RNA + protein/peptide functions jointly, beyond each module independently, in the SAME molecular construct | NOT ASSESSABLE |

A strong CTCF-motif score is **not a desirable BSNG binding-site recommendation**. CTCF participates in chromatin organization and gene regulation. Changing interactions at CTCF-associated regulatory sites could be harmful. Do not infer 'safe' from high motif affinity scores, noncoding labels, lack of annotated genes, or GC content.

## 3. What we can do now (computational stage, no experimental binding claim)

1. Freeze assembly, data source, scientific code and the complete candidate registry; retain unscored/negative genomic positions as covered-but-not-qualified.
2. Produce a **genomic context dossier** for any explicitly nominated locus: RefSeq accession, GRCh38.p14 coordinate and strand, repeat/low-complexity, coding/transcript/regulatory annotations with source versions, conservation and known variant context where available. Mark gaps as UNKNOWN, not 'safe'.
3. Compare the locus against a *measured recognition model* for the same physical entity—only if such a model exists. If it does not, this step MUST return **NOT ASSESSABLE**, not synthetic affinity probabilities or physical residence-time guesses.
4. Record genome-wide motif occurrence and natural CTCF benchmark data as **separate reference observations**, never add them to a combined nanite score.
5. Define prospective candidate/control allocation and statistical analysis before independent observations; report controls, missing data, nonspecific binding and failures.

**Do not use the 1,689 CTCF motifs as 'top BSNG nanite binding sites.'** Their role is benchmarking an existing natural-protein model and exercising the data infrastructure.

## 4. Prerequisites to start an authentic physical binding feasibility experiment

**Physical-system identity gate:** a demonstrably existing and traceable DNA-recognition construct, identified by an independent material/specification record. Document RNA-associated recognition component, protein/peptide recognition component, whether they form one characterized physical complex, and whether the nanite is proposed to bind noncovalently, crosslink, integrate or remain near chromatin. These outcomes are not interchangeable. No human-cell genetic modification or active replication is presumed or authorized.

**External molecular evidence gate:** a qualified, appropriately equipped laboratory and an independently agreed experimental protocol, with matched controls and documented biological/technical repeats. Quantify binding to target versus negative DNA substrate, reproducible association and dissociation as applicable, and uncertainty. Biolayer interferometry (BLI) or surface-plasmon resonance (SPR) are examples of established nonclinical biomolecular-interaction measurements *when appropriate to the defined molecular chemistry*. These are NOT instructions to construct the device. See: https://pubmed.ncbi.nlm.nih.gov/35108320/ and https://pubmed.ncbi.nlm.nih.gov/25640894/.

**Cellular context and integrity gate (separate, later, qualified-review stage):** test independently whether a molecular interaction takes place in the cell type of interest; assess relevant chromatin accessibility and binding occupancy, gene regulation, damage/repair signals, genomic sequence integrity, persistence, cytotoxicity and immunological context where applicable. Experimental negative findings are always specific to assay sensitivity, dose, duration and cell type; they cannot justify a general claim of "no harm." Relevant context: https://www.encodeproject.org/publications/0b76ffdf-715e-4b55-9cfd-62cf99da5f47/.

**Independent replication gate:** preregister the candidate and control allocation, outcome variables, relevant confounders, replicate structure, interpretation thresholds and statistical plan with qualified scientists, then test on truly independent observations. Provide failure criteria and report inconclusive outcomes. A computer model is not an independent physical replicate.

## 5. Required evidence deliverables from an external laboratory

For each independently measured property, archive: named physical construct identity, material provenance, blinded candidate/control IDs, validated experimental observable and units, instrument or assay context, raw primary-data accession, biological and technical replicate/quality structure, association/dissociation or residence-time observations where appropriate, controls and background, uncertainty and limitations, signed independent review report. Preserve full negative and inconclusive findings.

**BSNG software evidence states:**
- `REFERENCE_SEQUENCE_VERIFIED`: authentic GRCh38 coordinate and source hash.
- `NATURAL_CTCF_SEQUENCE_PREDICTION`: a score from a published *natural human* protein-binding sequence preference model.
- `NOT_ASSESSABLE`: no physically identified BSNG complex or suitable independent measurement.
- `EVIDENCE_SUBMITTED_REQUIRES_EXTERNAL_REVIEW`: traceable measurements supplied, not yet verified.
- `EVIDENCE_PACKAGE_PRESENT_BUT_NOT_SCIENTIFICALLY_ADJUDICATED`: a complete-looking package is not automatically evidence of safety or physical success.

No software flag may automatically transition to 'experimentally safe,' 'no mutations possible,' or 'physical BSNG binding confirmed' on the strength of sequence matches, a user-supplied file or arbitrary scoring assumptions.

## 6. Interpretation and decision

**Current decision: computational genome research is reproducible; physical BSNG hybrid binding, longevity, specificity and DNA safety are NOT ASSESSABLE.**

**Next decision required from the research owner:** Is a real, material, characterized hybrid RNA/protein-peptide DNA-binding BSNG complex already available, with a measured recognition mechanism? If yes, independently provide the construct characterization and data provenance so a specialist can design an appropriately controlled verification study. If not, the next stage is to validate the hybrid molecular mechanism in a **non-clinical, qualified research setting** before treating any genomic coordinate as a prospective nanite binding site.

Continue public-reference whole-genome computation as a **separate** program, but it does not substitute for that molecular feasibility milestone. No new uncontrolled scan jobs or Expo OTA changes are required for this readiness gate.
