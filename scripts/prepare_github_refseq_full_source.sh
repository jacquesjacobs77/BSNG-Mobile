#!/usr/bin/env bash
# Authenticate an official NCBI GCF_000001405.40 full RefSeq FASTA before
# starting any single-batch GRCh38.p14 research job.
set -euo pipefail
ROOT="${BSNG_CAMPAIGN_DIR:-/tmp/bsng-v09-real-source}"
mkdir -p "$ROOT"
export BSNG_CAMPAIGN_DIR="$ROOT"
name="GCF_000001405.40_GRCh38.p14_genomic.fna"
archive="$ROOT/$name.gz"
fasta="$ROOT/$name"
index="$fasta.fai"
sourceUrl="https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/405/GCF_000001405.40_GRCh38.p14/$name.gz"
export BSNG_REFSEQ_FASTA_GZIP="$archive"
export BSNG_REFSEQ_FASTA="$fasta"
export BSNG_REFSEQ_FAI="$index"
echo "REFSEQ PROVENANCE PREFLIGHT: NCBI GRCh38.p14 GCF_000001405.40 (NOT BSNG BINDING EVIDENCE)"
node scripts/prepare_grch38_assembly_plan.mjs
if [[ ! -s "$archive" ]]; then
 echo "NCBI official compressed reference is missing; downloading once for the current runner/cache."
 curl --fail --location --silent --show-error --retry 4 --retry-all-errors \
  --connect-timeout 45 --max-time 2000 "$sourceUrl" --output "$archive.part"
 mv "$archive.part" "$archive"
fi
if [[ ! -s "$fasta" ]]; then
 echo "Decompressing full NCBI RefSeq genome to bounded indexed-read source disk."
 gzip -dc "$archive" > "$fasta.part"
 mv "$fasta.part" "$fasta"
fi
if [[ ! -s "$index" ]]; then
 if ! command -v samtools >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq samtools
 fi
 samtools faidx "$fasta"
fi
echo "Frozen source validation: official NCBI MD5 + gzip decompression and complete FASTA SHA256 + FAI accession/length checks."
node scripts/freeze_grch38p14_reference.mjs
node --input-type=module <<'NODE'
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {verifyPlan} from './src/lib/whole-assembly-manifest.mjs';
const base=process.env.BSNG_CAMPAIGN_DIR+'/';
const plan=JSON.parse(readFileSync(base+'whole-assembly-plan.json','utf8'));
const frozen=JSON.parse(readFileSync(base+'reference-fasta-freeze.json','utf8'));
assert.equal(verifyPlan(plan),true);
assert.equal(frozen.assemblyPlanSha256,plan.planSha256);
assert.equal(plan.totalBatches,1003);
assert.equal(plan.refseqAssemblyAccession,'GCF_000001405.40');
assert.ok(frozen.referenceUncompressedBytes>3_000_000_000);
assert.ok(plan.excludedGenbankOnlySequenceCount===4);
console.log('OFFICIAL REFSEQ SOURCE VERIFIED FOR ONE BOUNDED GRCh38.p14 BATCH; FOUR GCA-ONLY SEQUENCES EXPLICITLY REMAIN OUT OF SCOPE');
NODE
df -h "$ROOT"
