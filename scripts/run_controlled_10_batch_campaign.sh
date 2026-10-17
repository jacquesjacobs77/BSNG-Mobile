#!/usr/bin/env bash
# Bound an ALREADY ACTIVE authentic NCBI GRCh38.p14 RefSeq CTCF research
# campaign at precisely 13 verified batches (3 baseline + 10 new).
# Under ONE GitHub Actions job: FASTA preflight once, release-backed receipt
# after EACH 10M batch, strict remote before/after audit, stop on any error.
# Also auditable/resumable after a runner interruption without adding more.
set -euo pipefail
: "${GH_TOKEN:?GitHub Actions token required}"
: "${GITHUB_REPOSITORY:?Repository identity required}"
: "${GITHUB_WORKSPACE:?GitHub workspace missing}"
[[ "$GITHUB_REPOSITORY" == "jacquesjacobs77/BSNG-Mobile" ]] || { echo "::error::Wrong repository"; exit 1; }
CONTROL="$GITHUB_WORKSPACE"
ENGINE="$CONTROL/engine"
CHECKPOINT_BRANCH="bsng-v09-real-ctcf-checkpoints"
LEDGER_PATH="grch38p14-natural-ctcf-v09/index.json"
LOCKED_SCIENCE_SHA="e91c8d85b0c92d56666383e9e7e3a36d0133d391"
TARGET=13
INITIAL=3
[[ -d "$ENGINE/.git" || -f "$ENGINE/.git" ]] || { echo "::error::Pinned engine checkout missing"; exit 1; }
[[ "$(git -C "$ENGINE" rev-parse HEAD)" == "$LOCKED_SCIENCE_SHA" ]] || {
 echo "::error::Genome engine SHA differs from validated scientific release";exit 1;
}
export BSNG_CODE_REVISION="$LOCKED_SCIENCE_SHA"
export BSNG_CAMPAIGN_DIR="/tmp/bsng-v09-real-source"
export BSNG_LOCAL_OUTPUT="/tmp/bsng-v09-real-output"
export BSNG_REAL_REFERENCE_PILOT_ACK=TRUE
export BSNG_TRIAL_AUDIT_JSON="$CONTROL/bsng-ten-batch-final-audit.json"
mkdir -p "$CONTROL/bsng-ten-batch-logs"
snapshot(){
  local filename="$1"
  git -C "$ENGINE" fetch --quiet origin "refs/heads/$CHECKPOINT_BRANCH"
  git -C "$ENGINE" show "FETCH_HEAD:$LEDGER_PATH" > "$filename"
  node "$CONTROL/scripts/audit_bounded_10_batch.mjs" snapshot "$filename"
}
before="$CONTROL/bsng-ten-batch-logs/before.json"
snapshot "$before"
initial_count="$(node "$CONTROL/scripts/audit_bounded_10_batch.mjs" count "$before")"
[[ "$initial_count" -ge "$INITIAL" && "$initial_count" -le "$TARGET" ]] || {
 echo "::error::Checkpoints outside the explicitly approved trial window";exit 1;
}
echo "Research trial authorized: $INITIAL original checkpoints, target $TARGET, currently $initial_count."
if [[ "$initial_count" -lt "$TARGET" ]];then
 echo "Validating exact original NCBI GRCh38.p14 full FASTA on persistent GitHub job cache..."
 ( cd "$ENGINE" && bash scripts/prepare_github_refseq_full_source.sh )
fi
for ((step=0;step<10;step++));do
  snapshot "$before" > "$CONTROL/bsng-ten-batch-logs/current-$step.json"
  current="$(node "$CONTROL/scripts/audit_bounded_10_batch.mjs" count "$before")"
  if [[ "$current" -ge "$TARGET" ]];then
    echo "STOP: exact target $TARGET reached. No additional genome jobs are permitted."
    break
  fi
  expected="$(printf 'B%06d' "$((current+1))")"
  echo "BEGIN independently checkpointed real reference batch $expected ($((current-INITIAL+1)) / 10 planned new batches)"
  # Every existing single-batch adapter independently verifies the FASTA and
  # Release asset after uploading it, before atomically committing its receipt.
  ( cd "$ENGINE" && timeout --signal=TERM --kill-after=15s 9m bash scripts/github_refseq_checkpoint_handoff.sh ) \
   | tee "$CONTROL/bsng-ten-batch-logs/$expected.log"
  # Remove only the local ephemeral worktree. The authoritative checkpoint
  # is already committed remotely, so another workflow could resume safely.
  git -C "$ENGINE" worktree remove --force /tmp/bsng-v09-real-durable-ledger
  git -C "$ENGINE" worktree prune
  after="$CONTROL/bsng-ten-batch-logs/after-$expected.json"
  snapshot "$after" > "$CONTROL/bsng-ten-batch-logs/audit-$expected.json"
  node "$CONTROL/scripts/audit_bounded_10_batch.mjs" step "$before" "$after" \
   > "$CONTROL/bsng-ten-batch-logs/verified-step-$expected.json"
  echo "Verified exactly ONE new candidate-archive-backed checkpoint for $expected."
done
final="$CONTROL/bsng-ten-batch-logs/final.json"
snapshot "$final" > "$CONTROL/bsng-ten-batch-logs/final-summary.json"
final_count="$(node "$CONTROL/scripts/audit_bounded_10_batch.mjs" count "$final")"
[[ "$final_count" -eq "$TARGET" ]] || {
 echo "::error::10-batch trial stopped safely at $final_count/$TARGET. Existing verified work remains durable; manual review required.";exit 1;
}
node "$CONTROL/scripts/audit_bounded_10_batch.mjs" summarize "$final"
# Independent audit of ALL ten newly archived partitions, not just the newest.
echo "Independently re-downloading and SHA-256-verifying all ten newly stored GitHub Release candidate partitions..."
audit_dir="$(mktemp -d)"
for ((n=4;n<=13;n++));do
  batch="$(printf 'B%06d' "$n")"
  read -r asset release sha < <(node - "$final" "$n" <<'NODE'
const fs=require('fs');
const i=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const r=i.receipts[Number(process.argv[3])-1];
if(!r||r.batchId!=='B'+String(process.argv[3]).padStart(6,'0'))process.exit(4);
console.log(r.compressedCandidateAssetName,r.compressedCandidateReleaseTag,r.compressedCandidateSha256);
NODE
)
  gh release download "$release" --repo "$GITHUB_REPOSITORY" --pattern "$asset" \
   --dir "$audit_dir" --clobber
  test -f "$audit_dir/$asset"
  actual="$(sha256sum "$audit_dir/$asset" | cut -d' ' -f1)"
  if [[ "$actual" != "$sha" ]];then
    echo "::error::Old persisted candidate archive is missing or corrupted: $asset"
    exit 1
  fi
  echo "REVALIDATED $batch release asset SHA-256 $actual"
done
echo "SUCCESS: ten additional real NCBI GRCh38.p14 batches are independently archived and re-audited."
echo "Genome campaign remains INCOMPLETE: $TARGET/1003 RefSeq batches. Nanite physical binding remains NOT ASSESSABLE."
