# BSNG physical DNA-recognition hypothesis — biological evidence requirements v0.4
Status: **Draft specification; original documents do not yet define a characterized physical DNA-binding nanite.**

## Findings from original BSNG research
The theoretical framework proposes nanite genetic instructions inserted using CRISPR-Cas9 or viral vectors, human genomic safe-harbor or noncoding regions, ATP-dependent protein-like operations, RNA/DNA logic, and biological control/failsafe mechanisms. The technical dossier describes peptide/nucleic-acid/lipid components and protein-based conformational sensing. The patent draft similarly describes synthetic biological subunits and proposed insertion/replication. **None documents an identified BSNG construct with measured binding affinity to a named DNA sequence.** Its technology readiness estimate is an assertion, not verified experimental evidence.

## Separate the possible mechanisms
1. **Sequence recognition:** a specific physical molecule or molecular assembly interacts with a sequence motif. Recognition may be mediated by a nucleic-acid guide, protein domain, or hybrid component; each requires a distinct empirically calibrated recognition model.
2. **Integration or persistence:** a specified biological mechanism places or maintains a payload at/near DNA. An observed sequence match is neither integration nor evidence of non-disruptive genomic insertion.
3. **Nanite operation:** ATP use, molecular logic, conditional activation, replication control, immune response, and therapeutic effects are separate biological hypotheses; no output from an in-silico binding model establishes them.

## Required inputs before a genuine BSNG binding prediction
- Named **physical recognition construct/component**, its architecture and molecular identity, not simply 'nanite'.
- Measured **recognition readout**, e.g. established in-vitro DNA-binding affinity or experimentally observed enrichment in a specific cellular context, including effect-size units and uncertainty.
- An experimentally characterized **sequence preference model**: fixed PWM if appropriate, affinity model, or validated recognition-rule model; no GC-only stand-in.
- Conditions: experimental substrate, DNA and protein preparation provenance, cellular/tissue setting, key assay conditions, replicate identities, and quality controls.
- Specificity/counterevidence: negative controls, mismatched sequences, competing motifs, independent replicate effects and background correction.
- Frozen genome/annotation versions, sequence integrity and exact coordinates, plus independent experiments withheld from model fitting.
- For genomic **integration**: separate experimentally characterized integration mechanism, measured outcomes and uncertainty; sequence recognition alone cannot be translated into a risk-free insertion-site recommendation.

## Evidence classification for software
- `REFERENCE_SEQUENCE_CONFIRMED`: authentic reference DNA, coordinate and checksum verified.
- `COMPUTATIONAL_SEQUENCE_PREDICTION`: motif occurrence or model score only.
- `NATURAL_PROTEIN_BIOLOGICAL_BENCHMARK`: JASPAR CTCF profile compared with measured ENCODE CTCF ChIP data; can validate the generic scoring framework to a limited extent.
- `BSNG_PHYSICAL_BINDING_NOT_ASSESSABLE`: until the molecule and relevant data above are actually available.
- `BSNG_INTEGRATION_NOT_ASSESSABLE`: until distinct empirical evidence validates that process.
- `BSNG_EXPERIMENTALLY_SUPPORTED`: reserved for a separately reviewed real physical construct with multiple independent appropriately controlled measurements, not attainable by software-only genome scanning.

## Proposed independent evidence and laboratory handoff
A researcher should receive a frozen computational report identifying the exact target genome region, model/scoring assumptions, blinded candidate and control labels, observed measurement types, how experiments were allocated and a pre-declared success metric. An appropriate qualified laboratory would independently assess the supplied physical molecular system and record results. Never describe simulated model outputs as actual experiments.

## Outcome of first real-protein benchmark (2026-10-15)
- Actual GRCh38 chromosome-X 10M-base reference SHA-256: `5bc91fa875ca7c069548838d1fef58a32d527d59211fb28c74331e1369f71953`.
- JASPAR natural human **CTCF** MA0139.1 recognition matrix vs ENCODE ENCSR000AKO **K562 CTCF ChIP-seq**, GRCh38 peak file ENCFF519CXF.
- **88 real ChIP-seq peak regions vs 88 matched genomic controls; descriptive AUROC 0.8702221074**, 29/29 code regression checks.
- Example top high-scoring natural CTCF motif lies on GRCh38 chrX:8,743,317–8,743,335 (+ strand). Its motif prediction overlaps a measured K562 CTCF peak. It is **not a BSNG binding or genomic-insertion recommendation**.
- ChIP-seq and the reference matrix are related data modalities; model-training independence must be assessed before calling this a fully external held-out predictive validation. K562 findings cannot be assumed universal across tissues.

## Next gating decision
**Before any BSNG-specific wet-lab claims**, identify the intended recognition component in enough measurable biological detail to choose an evidence-based model. If no component exists, the next output is a **research requirements gap list**, not a fabricated binding-affinity score or experimental nanite outcome.

This specification is a framework for interpreting scientific evidence, not an experimental protocol for creating or deploying self-replicating constructs.
