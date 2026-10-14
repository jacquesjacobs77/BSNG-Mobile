# BSNG v0.3 — Pre-registered computational research test, draft 0.1

## What BSNG proposes (project documents)
The BSNG technical dossier and theoretical framework propose DNA-associated programmable biological constructs, conditional intracellular logic, host-cell energy integration, and controlled lifecycle. These are research hypotheses; the supplied materials do not specify a fabricated nanite, validated binding constants, or a experimentally measured recognition model.

The original desktop 'simulate_binding' function searches 15-base windows and selects the highest GC content. GC composition is not a measurement of nanite affinity or therapeutic function. We preserve the 15-base window solely as a **historical baseline**.

## Independent computational question 1: exact-match targeting
**User-specified assumption:** a hypothetical interface recognizes an explicit 15-base DNA target exactly on either strand.

**H0 (sequence-only null):** the target's exact-match count is not unusually high relative to scrambled recognition strings preserving identical A/C/G/T composition.

**Input:** public reference sequence with chromosome, assembly, coordinates, retrieval timestamp, exact bytes, and a recognition motif chosen **before** inspecting results.

**Controls:** independently generated distinct composition-matched 15-base motifs, same DNA region and scanning protocol, fixed seed. Control motifs must not equal the target or its reverse complement.

**Readout:** exact hits on either strand, 0-based positions, control hit distribution and one-sided empirical tail statistic (1 + # control counts >= target count) / (1 + number of controls). This describes **motif-match enrichment, not nanite binding probability**.

**Failure and negative results:** no matches, zero enrichment, repeated target matches, inaccessible reference, invalid sequence, or insufficient unique controls are retained in the report. No automatic declaration of biological success.

**Pass criteria (engineering only):** identical input/parameters/seed yield identical JSON results; both strands and window boundaries are checked; control composition is preserved; invalid bases and ambiguous N are handled; results can be exported and independently rerun.

**Biological evidence requirement (not yet available):** identify the physical recognition construct, its intended target, and an independently measured binding observable (such as affinity or enrichment) under defined conditions, including negative controls and uncertainty. Prediction-vs-measurement comparisons may then assess predictive accuracy. Until then, the app must label its outputs as IN-SILICO HYPOTHESIS SCREEN and never as validated nanite binding.

## Parallel genomic-data track
Target analysis extent: up to 10,000,000 reference base pairs per job. Download in smaller chunks; validate coordinates, assembly, and continuity; aggregate counts/window summaries without retaining every window. Save checkpoints and failures. A 10M reference fetch alone is **not** a nanite hypothesis test.

## Evidence and storage contract (planned)
Each run needs run_id, analysis_version, model assumptions, reference assembly and source, coordinate interval, data hash (SHA-256), retrieval timestamp, parameters, control method and seed, code commit, numerical results, negative results, limitations, and exportable JSON/CSV. Private genomic inputs must stay private unless explicitly shared.

## Planned scientific gates
A: test algorithm verification on synthetic fixtures.
B: reference retrieval and 10M chunk-boundary invariance.
C: independent benchmark on experimentally characterized *existing* DNA-binding systems (not evidence of BSNG nanites).
D: physical nanite testing **only if a specific construct and empirical measurements exist**, with independent review and appropriate safety oversight.

No software-only result establishes the physical feasibility, controlled replication, immune compatibility, or clinical safety of BSNG.
