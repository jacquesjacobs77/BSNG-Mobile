# BSNG v0.8 — Continuous, Three-Track GRCh38 Whole-Assembly Research Engine (Development)

## Implementation and verification
The v0.8 development branch implements:
- NCBI GRCh38.p14 RefSeq assembly-report retrieval, source SHA-256, deterministic ordered A/B/C batch plan, and per-sequence checks.
- Track A chromosome molecules 1–22, X, Y and mitochondrial NC_012920.1 (NCBI classifies mitochondrion in the non-nuclear assembly unit).
- Track B other Primary Assembly unlocalized/unplaced sequences.
- Track C additional ALT loci and patch representations. These may overlap primary chromosomes and must never be counted as new independent biological loci without coordinate relationships.
- 10,000,000 **owned genomic-start positions** maximum per processing batch; overlapping right-flank context of the 19-nt natural CTCF motif ensures motifs crossing batch boundaries are counted once at their true start.
- An indexed, uncompressed official FASTA reader requiring byte-exact `.fai`, accession checks, source FASTA SHA-256 and contig lengths matching the official assembly report.
- Streaming JASPAR MA0139.1 **natural CTCF motif** scoring (plus and minus strand); all windows meeting the fixed *exploratory* score threshold >=15 log₂-odds are archived in compressed NDJSON. This threshold has not been experimentally calibrated; it is not binding probability, a nanite target, or safe integration guidance.
- SHA-256 of each batch's owned reference bases and archived candidates, explicit N/terminal-unscorable counts, idempotent receipts, atomic progress ledger, fast stop/resume, detection of corruption and duplicate/omitted windows.
- A single writer lock on one persistent POSIX filesystem; default CLI runs one batch and supports explicit continuous `BSNG_BATCH_BUDGET=all` after a durable host and storage are prepared. GitHub Actions runners are ephemeral and are NOT designated persistent full-genome storage.
- 60/60 existing + new regression tests and validation against NCBI's official assembly-report data in GitHub CI.

## NCBI real assembly-plan results
Data source: GCF_000001405.40 GRCh38.p14 assembly report; source SHA-256 `64318ddff470b69b261a667d813210044f60d4ce654253a547db80ff73638d38`.
Deterministic plan SHA-256 `22c67ad85730b19c97725ddf913b41d6749b7169b880a5af6724b64dea513e50`.

| Track | Sequences | Covered/reference representation bases | Planned batches |
|---|---:|---:|---:|
| A: 1–22, X, Y, MT | 25 | 3,088,286,401 | 323 |
| B: remaining RefSeq Primary Assembly | 166 | 11,171,206 | 166 |
| C: RefSeq ALT/patch | 514 | 198,973,029 | 514 |
| **RefSeq GCF scope** | **705** | **3,298,430,636** | **1,003** |

**CRITICAL SOURCE GAP:** four official assembly-report rows totaling 481,426 bases have GenBank accessions but `na` RefSeq accessions (three Primary Assembly unlocalized/unplaced representations and one alternate; see manifest). The tool preserves these as `excludedSequences`. A complete GCF RefSeq scan MUST NOT be described as complete coverage of every GRCh38.p14 sequence representation until those four are separately sourced from the appropriate GCA/GenBank dataset and scanned. Also, GCF ALT and patches represent overlapping reference alternatives, not 3.298 billion unique biological bases.

The official manifest and complete 1,003-batch schedule are archived in the user's BSNG Scientific Brain Google Drive folder:
https://drive.google.com/file/d/1QBQVU0yTaWUCr2WyKfXXzFniZ4OJYZCt/view
GitHub validation: https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38787045662

## Source and operational preparation — NOT EXECUTED
Before scanning authentic RefSeq GCF bases:
1. Obtain the official `GCF_000001405.40_GRCh38.p14_genomic.fna.gz` from the same NCBI FTP assembly directory as the report. Confirm an official published source checksum (e.g. assembly `md5checksums.txt`) **before** trusting file contents.
2. Decompress the reference FASTA on a provisioned persistent storage host; generate a matching `.fai` with `samtools faidx`. Set `BSNG_REFSEQ_FASTA_GZIP`, `BSNG_REFSEQ_FASTA`, `BSNG_REFSEQ_FAI` and `BSNG_CAMPAIGN_DIR`; then run `node scripts/freeze_grch38p14_reference.mjs`. The preflight checks NCBI's official compressed-file MD5, decompression versus local FASTA SHA-256, and all RefSeq contig lengths, then writes `reference-fasta-freeze.json`.
3. Ensure a durable, monitored disk/object store holds the reference FASTA, campaign plan, candidacy NDJSON partitions and receipt ledger across machine restarts. The user's connected Google Drive serves as research document/archive destination, not a transactional scanner database.
4. Run `node scripts/prepare_grch38_assembly_plan.mjs` first, followed by the frozen-reference source preflight in step 2. With the same environment variables and a persistent `BSNG_RESEARCH_STORAGE_DIR`, set `BSNG_BATCH_BUDGET=1` and run `node scripts/run_whole_assembly_campaign.mjs` for the first actual-source pilot. The campaign CLI refuses to run without the matching `reference-fasta-freeze.json`; an arbitrary manually supplied SHA-256 is not accepted in place of source verification.
5. Independently audit pilot receipts and candidate partitions; then explicitly authorize a longer supervised continuous campaign by setting `BSNG_BATCH_BUDGET=all`. A campaign is COMPLETE for the GCF RefSeq scope only after every included contig's assigned starts are accounted for. If the four GenBank-only sequences remain unscanned, report `REFSEQ_SCOPE_COMPLETE_GENBANK_ONLY_REMAIN` instead of complete coverage of all assembly-report representations.

## Scientific interpretation
The genome campaign is sequence-motif computation only. It does **not** establish RNA-guided or combined RNA–protein BSNG nanite binding, mutational robustness in living cells, binding persistence, non-harm, genomic integration or safety. The Scientific Brain training and autonomous investigation capabilities are future work, not implemented by this scan engine. Independently reproduced biochemical and cellular measurements would be required for the physical BSNG hypothesis.

## Protected deployment policy
Development branch only; no Expo OTA or APK changes. No open-ended cloud run or paid high-volume genomic dataset download was launched during this implementation phase. New persistent storage, owner-controlled compute budget, and external host provisioning are prerequisites before launching all 1,003 batches. Existing verified v0.7 report remains unmodified.
