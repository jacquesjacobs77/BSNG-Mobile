# BSNG research evidence — coordinate-verified RNA-guided human GUIDE-seq reference v0.6

**Date:** 2026-10-15
**Registration status:** Protocol frozen before first source-download comparison on this branch.
**Purpose:** display bona fide coordinate-resolved observations from an existing human RNA-guided nuclease experiment and independently verify the source reference alignment. Not an experiment with BSNG nanites, not a guide design or safe genomic insertion-site recommendation.

## Frozen public data source
- Published source: https://github.com/tsailabSJ/guideseq
- Repository commit: `82b015503e689f92f4d495ff5ba80d3fe2d5991c` (V2 source)
- Source filtered/annotated demonstration TSV: `test/identified/test_identifiedOfftargets.rmblck.rm_no_match.annot.tsv`
- Expected source Git blob: `107c27715bb6555c0945ec435abf8de82e4323d3`
- Companion experiment manifest: `test/test_manifest.yaml`
- Expected manifest Git blob: `ba1c486b460a5b97b04ce53c42017390381c3b14`
- Declared reference genome `chr19.fa`, `genome: hg38`. Sample is GUIDE-seq `AAVS1_site_14` **pipeline demonstration/test data**, not a published independent validation cohort.
- Use `bi.sum.mi` as observed UMI-associated supporting read count, **not molecular binding affinity**.

## Coordinate and source checks
1. Verify fetched test output and manifest against frozen upstream Git blob hashes, compute reproducibility SHA-256.
2. Parse the original source's `Site_SubstitutionsOnly.Start`, `End`, `Sequence`, `Strand`, `Position` and `bi.sum.mi`; preserve feature annotations as **upstream labels only**.
3. The source's aligned-site coordinates are zero-based **BED half-open**. Display 1-based **inclusive** as `start+1 .. end`. Positive and reverse-complement orientations must both be checked.
4. Fetch exactly each published unambiguous 23-base site from `https://rest.ensembl.org/sequence/region/human/` for `GRCh38 chr19`; verify assembly identifier, sequence length, and exact strand-correct sequence.
5. Retain gapped or unresolved sites as **read-supported, sequence-location-not-verified**; do not silently convert them to precise canonical sites. Fail CI if any canonical substitution-only site disagrees with Ensembl GRCh38.
6. Explicitly preserve output count, raw source read support, genomic coordinates and negative/unresolved findings. **No scientific parameters are optimized from observed counts**.

## Scope and scientific limits
- A GUIDE-seq detection reports a published **RNA-guided Cas nuclease-associated DNA cleavage event/read signal** in an experimental cell context, not equilibrium binding affinity.
- These are **pipeline test fixture** outputs; they are tied to real reference coordinates and experimental reads, but cannot substitute for an independently reproduced clinical or wet-lab experiment.
- The top-ranked example by `bi.sum.mi` is ranked for source **read count support only**; high read support does not imply an optimal, safe or even relevant BSNG nanite genomic site.
- The GUIDE-seq source describes **hg38 chromosome 19**; the prior CTCF benchmark concerns **GRCh38 chromosome X, 1,000,000–10,999,999**. These are **different loci, experiments and biology**. Never silently combine or average their scores.
- Our TrueOT RNA benchmark lacks coordinates in its three-column release and cannot be silently projected onto chr19.
- Neither GUIDE-seq nor CTCF nor TrueOT contains independent measurements of a BSNG hybrid molecular construct.
- Upstream feature annotations must remain unverified unless an independently versioned annotation release is explicitly attached.

## Results UI and audit contract
The Results page must show a dedicated **Published biological reference evidence** panel with real chromosome/coordinate/strand, experiment, natural molecular system, observed read support, source link, checksum and status. It must also show a distinct *Protein (CTCF)* reference panel and a visible **BSNG hybrid coupling: NOT ASSESSABLE** + **Genomic integration: NOT ASSESSABLE** section. A GC-demo user result must retain its honest local-demo label and not appear as a nanite assay.

The independent laboratory package consists of source commit, original TSV and manifest, JSON report, open analysis code, regression tests, exact SHA-256 hashes, correct coordinate conventions, and the original published reference sources. GitHub Actions artifacts expire after 30 days; persist a smaller verified summary in repository and link full upstream sources.

**Acceptance:** pinned source integrity passes; source manifest explicitly hg38; all provided contiguous substitution-only sequence-aligned sites match actual Ensembl GRCh38 chr19 sequence in correct strand; unresolved/gapped source rows remain unresolved; evidence limitations prominently rendered. Zero/failed matches are audit failures or inconclusive, never promoted to binding.
