#!/usr/bin/env bash
# AUTHENTIC public human reference only. A single-batch GitHub Actions adapter
# with cryptographic candidate archive verification and immutable receipt ledger.
# Explicitly stopped at one 10M-owned-position batch per runner.
set -euo pipefail
: "${GH_TOKEN:?GitHub workflow GITHUB_TOKEN unavailable}"
: "${GITHUB_REPOSITORY:?GitHub repo unavailable}"
: "${GITHUB_WORKSPACE:?Source checkout missing}"
[[ "$GITHUB_REPOSITORY" == 'jacquesjacobs77/BSNG-Mobile' ]] || exit 1
export BSNG_CAMPAIGN_DIR="${BSNG_CAMPAIGN_DIR:-/tmp/bsng-v09-real-source}"
export BSNG_LOCAL_OUTPUT="${BSNG_LOCAL_OUTPUT:-/tmp/bsng-v09-real-output}"
export BSNG_CHECKPOINT_WORKTREE="/tmp/bsng-v09-real-durable-ledger"
export BSNG_CODE_REVISION="${BSNG_CODE_REVISION:-$(git rev-parse HEAD)}"
[[ "$BSNG_CODE_REVISION" =~ ^[a-f0-9]{40}$ ]] || exit 1
BRANCH="bsng-v09-real-ctcf-checkpoints"
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
 git fetch origin "$BRANCH"
 git worktree add --detach "$BSNG_CHECKPOINT_WORKTREE" FETCH_HEAD
else
 git worktree add --detach "$BSNG_CHECKPOINT_WORKTREE"
 git -C "$BSNG_CHECKPOINT_WORKTREE" switch --orphan "$BRANCH"
fi
node scripts/github_refseq_handoff_cli.mjs init
git -C "$BSNG_CHECKPOINT_WORKTREE" config user.name 'github-actions[bot]'
git -C "$BSNG_CHECKPOINT_WORKTREE" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git -C "$BSNG_CHECKPOINT_WORKTREE" add --all
if ! git -C "$BSNG_CHECKPOINT_WORKTREE" diff --cached --quiet; then
 git -C "$BSNG_CHECKPOINT_WORKTREE" commit -m "Freeze official NCBI GRCh38.p14 full source and scientific code for v0.9 campaign"
 git -C "$BSNG_CHECKPOINT_WORKTREE" push origin HEAD:refs/heads/"$BRANCH"
fi
if [[ "${1:-}" == "audit" ]]; then node scripts/github_refseq_handoff_cli.mjs audit;exit 0;fi
out="$(mktemp)"
GITHUB_OUTPUT="$out" node scripts/github_refseq_handoff_cli.mjs next
source "$out"
rm "$out"
if [[ -z "${next_batch_id:-}" ]]; then
 echo "All planned RefSeq batches complete; any GCA-only exclusions remain explicitly NOT ASSESSED."
 node scripts/github_refseq_handoff_cli.mjs audit
 exit 0
fi
export BSNG_BATCH_ID="$next_batch_id"
export BSNG_REAL_REFERENCE_PILOT_ACK=TRUE
node scripts/github_refseq_handoff_cli.mjs scan
asset="$BSNG_LOCAL_OUTPUT/$BSNG_BATCH_ID.candidates.ndjson.gz"
test -f "$asset"
local_sha="$(sha256sum "$asset" | cut -d' ' -f1)"
if [[ -z "${release_tag:-}" ]]; then echo "::error::Missing release tag";exit 1;fi
TAG="$release_tag"
if ! gh release view "$TAG" --repo "$GITHUB_REPOSITORY" >/dev/null 2>&1; then
 gh release create "$TAG" --repo "$GITHUB_REPOSITORY" --target "$BSNG_CODE_REVISION" --latest=false \
  --title "BSNG v0.9 genuine GRCh38.p14 natural CTCF research (computational only)" \
  --notes "Official NCBI GCF_000001405.40 RefSeq DNA. This is naturally occurring CTCF DNA-motif preference computation only; not BSNG nanite binding, persistence, genomic integration, or safety evidence. Every asset has a SHA-256 receipt on branch bsng-v09-real-ctcf-checkpoints."
fi
if ! gh release view "$TAG" --repo "$GITHUB_REPOSITORY" --json assets --jq '.assets[].name' \
  | grep -Fxq "$BSNG_BATCH_ID.candidates.ndjson.gz"; then
 gh release upload "$TAG" "$asset" --repo "$GITHUB_REPOSITORY"
fi
verify_dir="$(mktemp -d)"
for attempt in 1 2 3 4 5; do
 if gh release download "$TAG" --repo "$GITHUB_REPOSITORY" \
  --pattern "$BSNG_BATCH_ID.candidates.ndjson.gz" --dir "$verify_dir" --clobber; then break;fi
 sleep "$((attempt*2))"
done
test -f "$verify_dir/$BSNG_BATCH_ID.candidates.ndjson.gz"
remote_sha="$(sha256sum "$verify_dir/$BSNG_BATCH_ID.candidates.ndjson.gz" | cut -d' ' -f1)"
if [[ "$remote_sha" != "$local_sha" ]]; then
 echo "::error::GitHub Release downloaded candidate partition is corrupt; no receipt committed"
 exit 1
fi
echo "AUTHENTIC GRCH38 CTCF CANDIDATE ARCHIVE VERIFIED $BSNG_BATCH_ID $remote_sha"
export BSNG_RELEASE_ASSET_VERIFIED=TRUE
node scripts/github_refseq_handoff_cli.mjs promote
git -C "$BSNG_CHECKPOINT_WORKTREE" add --all
if ! git -C "$BSNG_CHECKPOINT_WORKTREE" diff --cached --quiet; then
 git -C "$BSNG_CHECKPOINT_WORKTREE" commit -m "Archive verified NCBI GRCh38.p14 natural-CTCF candidate batch $BSNG_BATCH_ID with SHA256"
 git -C "$BSNG_CHECKPOINT_WORKTREE" push origin HEAD:refs/heads/"$BRANCH"
fi
node scripts/github_refseq_handoff_cli.mjs audit
echo "ONE REAL 10M-MAX GRCH38.P14 BATCH ARCHIVED. NEXT RUN MAY CONTINUE FROM VERIFIED GH BRANCH."
