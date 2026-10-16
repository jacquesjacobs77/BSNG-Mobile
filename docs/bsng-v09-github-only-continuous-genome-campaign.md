# BSNG v0.9 — GitHub-only, checksum-verified whole-genome continuation

**Status: three real human GRCh38.p14 RefSeq genomic batches completed and persistently archived; entire genome NOT yet scanned. Android v0.9 progress panel is developed.** This document is an operational milestone and explicitly NOT independent proof of BSNG nanite DNA recognition, RNA/protein binding, integration safety or therapeutic effect.

## Why we can reuse our existing GitHub infrastructure

- Standard GitHub-hosted runners can execute each computational job in a public repository. In this verified public repo, standard GitHub Actions compute is available without a separate commercial cloud subscription, subject to GitHub's limits and acceptable use policies.
- Runners are **ephemeral**. A job's local FASTA, output and RAM disappear afterward. Therefore the canonical scientific checkpoint is a **dedicated durable Git branch** (`bsng-v09-real-ctcf-checkpoints`) and each candidate partition is a **SHA-256-verified GitHub Release asset**. Temporary Actions artifacts/caches do NOT establish persistent scientific storage.
- GitHub Actions cache reduces repeated downloading of the full reference FASTA; it may be evicted at any time and is always revalidated against the source freeze. Default cache allowance is 10GB/repository and capacity may be billed beyond this. The pipeline works by re-downloading the source if cache is evicted.
- A later job pulls the previously committed index, verifies source and pinned code revision, computes **only the first missing batch**, uploads the complete qualifying-candidate archive, downloads it again, checks its SHA-256 and only then commits a new scientific receipt and advances coverage.
- Release assets are partitioned into shards holding up to 100 batch archives each. Original JSON receipts and code revision remain inspectable in Git history. Release assets are not cryptographically immutable by the host; their recorded SHA-256 must be checked on each subsequent audit.
- Launch further cloud analysis using the main-branch GitHub Actions workflow `bsng-v09-refseq-github-continuation.yml`. Select `scan-one-batch`, and authorize zero, one or two further automatically chained jobs. **Default is inspect-only.** There is no unattended 1,003-job run and no automatic retry claiming completion.

## Real NCBI GRCh38.p14 source freeze

| Check | Verified value |
|---|---|
| Official RefSeq assembly | `GCF_000001405.40` / GRCh38.p14 |
| Assembly plan SHA-256 | `22c67ad85730b19c97725ddf913b41d6749b7169b880a5af6724b64dea513e50` |
| NCBI compressed file MD5 | `c30471567037b2b2389d43c908c653e1` |
| Whole compressed FASTA SHA-256 | `11912a45a545bf01a10b2a7f10eb7a42924436b4d19b476b1899834fb7ba74a3` |
| Exact complete uncompressed FASTA SHA-256 | `df6e4918316e05a9cc1fd29c352841d3678b607d7a436819cd43371b52c814c0` |
| Exact uncompressed FASTA bytes | 3,339,739,109 |
| Scientific engine frozen commit | `e91c8d85b0c92d56666383e9e7e3a36d0133d391` |
| Primary chromosome-level research track | Track A; chromosomes 1–22, X, Y and MT |
| Whole GCF RefSeq representation plan | 705 sequences, 1,003 owned-coordinate batches, 3,298,430,636 represented bases |
| Excluded GenBank-only reference sequences | Four additional records, 481,426 bases; separate future GCA analysis needed |

Official source access: https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/405/GCF_000001405.40_GRCh38.p14/

## Completed real human DNA sequence analyses

| Verified batch | Reference chromosome accession | Actual reference coordinates (1-based inclusive) | Analyzed bases | All qualifying natural CTCF motif windows archived |
|---|---|---|---:|---:|
| B000001 | `NC_000001.11` / chr1 | 1–10,000,000 | 10,000,000 | 277 |
| B000002 | `NC_000001.11` / chr1 | 10,000,001–20,000,000 | 10,000,000 | 211 |
| B000003 | `NC_000001.11` / chr1 | 20,000,001–30,000,000 | 10,000,000 | 196 |
| **TOTAL** | | | **30,000,000** | **684** |

These are **not nanite binding sites**. They are model-specific natural CTCF sequence motif windows above a *preregistered exploratory but uncalibrated* JASPAR MA0139.1 PWM log₂-odds cutoff of 15, with both DNA orientations scanned. Every qualifying candidate above that selected threshold is archived in compressed machine-readable NDJSON, not only the top 20. Rejected, ambiguous and unscorable genomic-start counts remain available in each scientific batch receipt; a negative CTCF score should not be treated as evidence for or against an unspecified BSNG physical nanite. The threshold does not correspond to measured affinity, specificity, or non-harm.

**Current official campaign status: INCOMPLETE (3/1003 batches; approximately 0.91% of included RefSeq represented bases), not three completed genomes.** Chromosome 1 has been scanned consecutively through base 30,000,000; the next planned batch is B000004 (chr1:30,000,001–40,000,000), unless subsequent verified commits extend the checkpoint after this document's date.

## Permanent scientific evidence and relevant workflows

- Frozen real-science checkpoint index: https://github.com/jacquesjacobs77/BSNG-Mobile/blob/bsng-v09-real-ctcf-checkpoints/grch38p14-natural-ctcf-v09/index.json
- First batch receipt: https://github.com/jacquesjacobs77/BSNG-Mobile/blob/bsng-v09-real-ctcf-checkpoints/grch38p14-natural-ctcf-v09/receipts/B000001.json
- Third batch receipt: https://github.com/jacquesjacobs77/BSNG-Mobile/blob/bsng-v09-real-ctcf-checkpoints/grch38p14-natural-ctcf-v09/receipts/B000003.json
- Candidate Release shard: https://github.com/jacquesjacobs77/BSNG-Mobile/releases/tag/bsng-v09-grch38-cd19fbf992d9bae65026-shard-000
- First verified full NCBI run: https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38883712259
- Second independent run: https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38884125961
- Third automatically chained independent run: https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38884249018
- Controlled GitHub runner: https://github.com/jacquesjacobs77/BSNG-Mobile/actions/workflows/bsng-v09-refseq-github-continuation.yml
- Phone-compatible v0.9 read-only campaign progress panel: `src/screens/WholeGenomeCampaignPanel.tsx` on `feature/bsng-github-continuation-v0.9`.

## Technical and scientific limitations

1. The existing v0.9 engine has no experimentally calibrated BSNG-specific molecular construct, hybrid RNA–protein recognition model, affinity measurements, off-target evidence, integration persistence, mutation-repair measurements or clinical safety data.
2. Coverage of individual GRCh38 alternate representations may overlap primary chromosomes; the 1,003-batch plan scans 3.298 billion represented bases, not that many independent unique biological sites.
3. Four GenBank-only assembly-report sequences lack RefSeq accessions and remain unassessed by this GCF-specific pipeline. A later GCA track must independently cover them before claiming every GRCh38.p14 representation.
4. Public GitHub repositories are inappropriate for individual clinical/human genomes or private patient data. Only public reference sequences and experimental reference datasets may be published this way.
5. The future BSNG AI Scientific Brain and independent lab validation remain distinct development milestones; running full reference DNA computations alone does not prove the BSNG nanite hypothesis.
6. Large-scale, continually chained scientific jobs should be benchmarked against GitHub Actions acceptable-use terms, cache retention limits, asset availability and restart/cost budgets. Optimize batches per workflow before attempting an entire 1,003-batch unattended scan.

**Checkpoint protocol:** Keep the installed v0.2.0 native APK unchanged. Publish only validated compatible JavaScript app changes. All real-genome score records are tied to frozen code SHA `e91c8d85b0c92d56666383e9e7e3a36d0133d391`; subsequent UI edits cannot silently alter the scorer used by existing checkpoints.
