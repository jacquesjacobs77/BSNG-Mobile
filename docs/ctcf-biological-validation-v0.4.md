# BSNG biological reference benchmark v0.4 — preregistered before first run

## Scientific objective
**Can the BSNG software discriminate DNA regions showing actual experimental human-protein DNA association from composition-matched background using a biological recognition model?**

This is an assessment of an existing, experimentally characterized natural human protein (CTCF), **not evidence that BSNG nanites exist or bind DNA**. The BSNG theoretical framework describes possible CRISPR/vector-based genomic insertion, host-ATP integration and programmable biologically derived nanites, but provides no physically specified recognition construct, binding constants, quantitative binding model or independent measurement of a BSNG nanite.

## Locked independent source data
- GRCh38 Ensembl chromosome X: 1,000,000–10,999,999 (1-based inclusive); real human reference, not a personal genome. Expected exact uppercase 10M-sequence SHA-256 `5bc91fa875ca7c069548838d1fef58a32d527d59211fb28c74331e1369f71953`.
- JASPAR human CTCF position frequency matrix, **MA0139.1**, 19-nt; https://jaspar.elixir.no/matrix/MA0139.1/ ; JASPAR CC BY 4.0 attribution. Profile is **ChIP-seq-derived**; the specific original training experiments could overlap related datasets, so *true training-set independence has not been proven*.
- ENCODE **CTCF ChIP-seq** in human **K562** cell line (ENCSR000AKO); released **GRCh38** optimal-IDR-thresholded narrowPeak dataset **ENCFF519CXF**, https://www.encodeproject.org/files/ENCFF519CXF/ ; expected MD5 of released file `7828af6ccfcb579226ce54757b98f05b`. K562 is a cancer-derived cell line, not healthy human tissue.
- Genomic positions reported as chromosome and **1-based inclusive** coordinates; BED experimental peak file is **0-based half-open**. Conversion is logged.

## Locked analysis approach
1. Compute 19-nt CTCF position-specific log2 odds from source PFM with **0.5 pseudocount per nucleotide and column** and **uniform 0.25 genomic background**. Score both forward and reverse complement DNA.
2. Scan all valid 19-nt windows in the exact 10M GRCh38 interval, omit N-overlapping windows, preserve 50 top locally nonoverlapping natural CTCF motif candidates with at least 250 bp separation. Report exact reference coordinates, DNA sequence, strand, score and proximity to ENCODE peaks.
3. Select up to 150 ENCODE peaks, ordered by chromosome coordinate and approximately evenly spaced across the interval. Define a 201-bp genomic window centered on the ENCODE ChIP-seq summit. For each positive select a deterministic random non-peak window (seed **1729**) within the same 10M reference, at least 1 kb from known peaks, matching 201-bp local GC fraction within **0.06 absolute**. Exclude windows with N bases or with no valid 19-base motif. No successful negative after 2,500 tries => exclude pair **and report attrition**.
4. Score each window as the maximum CTCF motif score for motif starts within ±100 bases of the window midpoint. Compare positive vs matched controls using descriptive **AUROC** (rank-based probability that a peak scores higher than background) and *paired win rate*, plus medians. These are **software-performance observations**, not molecular binding probabilities.
5. Report all observed validation metrics, including AUC ≤0.5 or insufficient data. Never tune or replace this matrix after observing the results and call the same observations independent test data.

## Acceptance and interpretation
- **Engineering gate:** all tests pass; exact source file hashes verify; alignment/strands/coordinates and result provenance verified; failed downloads or incorrect assemblies are failures.
- **Biological reference benchmark:** a nonzero empirical AUROC above chance would indicate CTCF sequence-motif scores are enriched near some ENCODE CTCF ChIP-seq events compared with GC-matched non-peak background. It does **not** prove exact molecular occupancy, physical affinity, or BSNG nanite recognition. AUROC at/below chance must be reported unchanged.
- **Independent biological validation:** requires a truly independent experimental dataset not represented in the model-building studies, with biological replicates and pre-set quality thresholds. This initial observational reference benchmark does not claim that level.
- **BSNG recognition gate:** **NOT ASSESSABLE** until a specific physical nanite recognition component and independent measured response are supplied. Do not invent nanite targets, therapeutic performance, or binding affinities.
- **BSNG integration gate:** **NOT ASSESSABLE** until a specific integration mechanism and independently supported site-safety data are supplied. No actionable insertion-site recommendations.

## Reproducibility
Record run/commit, timestamps, source accessions, downloaded file hashes, pinned model counts, code/config, fixed seed, exact reference hash, per-window scores at reported candidates, positive/negative comparison metrics, and all negative findings. Export JSON plus original public ENCODE evidence and reference FASTA in GitHub Actions artifacts. Source code and preregistration remain in the repository.
