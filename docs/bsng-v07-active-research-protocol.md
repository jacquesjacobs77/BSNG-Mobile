# BSNG v0.7 active GRCh38 genomic research pipeline

**Status:** Cloud workflow and Android report-reader design. Reports are computations on actual public human reference DNA, NOT evidence that the hypothetical BSNG nanite physically binds, integrates or is safe.

## User-facing route: Android + authenticated cloud
1. In BSNG Studio open Results → **Real Human Genome Analysis**, select chromosome (1–22, X/Y/MT), 1-based start and 100K / 1M / 10M span.
2. Open GitHub Actions **BSNG Active GRCh38 Research Run**. The phone links to GitHub's authenticated workflow; the application itself does **not** store GitHub tokens or submit unauthorized jobs. Enter the same chromosome, start and length in the GitHub Run workflow form (initial release requires manual input confirmation).
3. The cloud job fetches exactly the chosen 100,000 to 10,000,000 authentic **GRCh38 reference bases** from Ensembl REST in 500,000-base or smaller adjacent chunks, with per-chunk Ensembl identifier, SHA-256 and full concatenated-uppercase sequence SHA-256.
4. The model ranks pre-specified **natural human CTCF motif** sequence-preference maxima, using the published JASPAR MA0139.1 PFM (19 nt), pseudocount 0.5 and uniform A/C/G/T background 0.25. It scores **both strands**, excludes windows containing N, selects the maximum score per contiguous, non-overlapping **1,000-base bin relative to selected region**, and reports the top 20 bins. This binning is an engineering summarization device, *not* a biological justification of independent binding sites.
5. Store complete public-reference run report on public GitHub branch `research-results-v07` and an expiring GitHub Actions artifact containing gzipped FASTA, full JSON and exact index metadata. The registry index retains the newest 100 run pointers; individual committed report files remain on branch.
6. Back in the app tap **Refresh completed reports**, choose a run, inspect exact coordinates and raw reference sequence, and share the full JSON link, SHA-256, code revision and findings.

## Scientific hypothesis and interpretation
The source BSNG framework proposes a **hybrid RNA-guided and protein/peptide-mediated recognition construct** and genomic integration. No validated physical BSNG construct, RNA guide-specific recognition model, hybrid protein-RNA coupling model or measured nanite binding affinity is included in the project materials.

The v0.7 report is **computational evidence of where a natural CTCF motif model scores higher on public human reference DNA**, nothing more. CTCF is an established natural protein; it has a separate, previously recorded ChIP-seq reference benchmark, but the new job does not newly measure CTCF occupancy at its selected locations. No RNA guide sequences are generated or evaluated, and no combined RNA–protein nanite score is fabricated.

Genomic context (regulatory/genic/variant/repeat data), genome-wide off-target effects, molecular binding to real BSNG constructs, successful integration and safety are **NOT ASSESSABLE or NOT PERFORMED**. A site matching a CTCF motif is not a recommendation to modify human DNA or an ideal nanite binding candidate.

## Computation and validation contract
- Reference coordinates: GRCh38 **1-based inclusive**; source FASTA always the **forward reference strand**. Motif score reports both orientation strands and forward-strand 19-base sequence.
- Exact reproducibility: freeze source accessions/identifiers, timestamps, bytes & chunk checksums, full-sequence SHA-256, JASPAR matrix identifier+content SHA-256, bin size and ranking rule, source code commit and reference URLs.
- PFM scoring: `sum_i log2[(count(base,i)+0.5)/(sum_b count(b,i)+2.0)/0.25]` separately for forward and reverse-complement orientation; use maximal orientation. Log2 odds are **not physical binding probabilities**.
- For each 1,000-base bin anchored at the requested interval's start, keep highest-scoring unambiguous window (tie: earliest genomic position). Sort bins by descending score and ascending position. This avoids showing adjacent overlapping top hits as independent candidate sites. Rankings may change if scanned region start moves because bins move—record selected bins in every result.
- Negative and invalid cases: no eligible motif, N-rich spans, invalid assembly or coordinates, incorrect chunk lengths or IDs, network failures and checksum mismatches must be explicit errors/negative results, never filled with fabricated promising candidates.
- Independent rerun: researcher downloads source report, separately retrieves the exact Ensembl intervals, compares SHA-256 for each and all chunks, clones the specified Git commit, reruns the same script with inputs on Node 22 and checks the complete JSON numerical results. `runId`, creation timestamp and GitHub workflow URL will naturally differ on a separate run. The measured genomic input, scores, ranks, coordinates and all other deterministic fields should match. **This has not yet been independently reproduced by a separate laboratory.**
- Cloud jobs use **only public reference genome intervals**; do not send personal genomic or clinical data. GitHub results branch is PUBLIC by design.
- The first implementation requires a GitHub-authenticated human click to dispatch a cloud run. App-based no-click job submission will require a separately secured backend with scoped authentication, quotas, cost and privacy controls. **Do not embed personal access tokens in Android.**
- The v0.7 version label refers to JavaScript research UI / model version. The installed native APK stays `0.2.0`; compatible Expo OTA can update JS without a reinstall.

## Follow-up biological validation
1. Publish data-only comparator benchmarks for established reference systems with truly independent experimental datasets (the existing natural CTCF and TrueOT metrics are prior retrospective benchmarks, not nanite data).
2. Supply physical identity and measurements for BSNG's specific RNA–protein hybrid receptor; preregister an experimentally calibrated binding readout with independent controls. Only then should candidate ranking be attributed to the **BSNG-specific** molecular model.
3. Separately establish integration mechanism and safety evidence with appropriate specialist oversight; absence of gene overlap or a high motif score is never safety proof.
