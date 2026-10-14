# BSNG v0.3 — Locked computational assay specification (before the first integrated real-data run)

**Evidence tier:** exploratory in-silico sequence recognition **only**. No BSNG nanite has been supplied or characterized. No nanite binding or therapeutic hypothesis can be confirmed through sequence motif counting.

**Public reference:** Ensembl REST; Homo sapiens, GRCh38, chromosome X, 1-based inclusive range X:1,000,000–10,999,999 (exactly 10,000,000 reference bases). The reference assembly represents a published reference, not individual patient's DNA.

**Positive targeting assumption:** a purely hypothetical exact 15-nt motif `ACGTTGCACTAGTCA` on either strand. This motif is adopted from the earlier synthetic **software** regression fixture, not chosen after examining this 10M human interval, and is **not a validated BSNG nanite target**.

**Null comparison:** 32 unique DNA-composition-preserving scrambled motifs; seeded pseudorandom shuffles with `seed=1729`; exclude the target and its reverse complement (and reverse-complement duplicates among controls). Independently count exact matches to each control and its reverse complement in exactly the same 10M-base human interval. Overlapping matches count as distinct starts. The N base cannot match an A/C/G/T-only motif. Positions are zero-based offsets relative to the region start, with conversion to GRCh38 coordinates explained in the report. No sequence-specific parameter fitting after retrieval.

**Readout:** observed target match count, each of 32 control match counts, up to 25 first target positions, base counts and window GC, exact checksums, parameter seed and code revision. Report a descriptive one-sided permutation-rank statistic `(1 + #{controls with match count >= observed}) / (1 + 32)`, **not a calibrated probability of biological binding**.

**Caveat:** a single 15-base motif may be absent across 10M genomic bases; no matches or ties produce no evidence for selective targeting. Even an extreme result is only a statement about reference-DNA string occurrences, subject to genome composition and repeat patterns. Controls are matching-composition shuffles, not experimental negative controls.

**Independent software verification:** compare streaming scan against the pre-existing 5,000-base assay using common fixtures; require chunk partition invariance and sequence-length continuity; keep full per-chunk SHA-256 and cumulative SHA-256. Mark differences as failures.

**Scientific next gate:** define an experimentally characterizable recognition entity, mechanism and measurable binding observable using real-world established DNA-binding systems; lock parameters from training data and evaluate independent held-out experimental measurements with negative controls. Do not make physical nanite binding, ATP usage, replication, in vivo or clinical claims from this run.

**Data governance:** store report and reference FASTA in GitHub Actions artifact only, retain for 30 days, no individual sample or health data.
