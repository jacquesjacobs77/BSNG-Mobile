#!/usr/bin/env bash
# Verified Github Releases asset + dedicated git-branch checkpoint handoff.
# Test-only for now: fixture-v09, SYNTHETIC data. Never represent as human DNA.
set -euo pipefail
: "${GH_TOKEN:?GitHub workflow token missing}"
: "${GITHUB_REPOSITORY:?GitHub repo missing}"
: "${GITHUB_WORKSPACE:?GitHub workspace missing}"
export BSNG_FIXTURE_ROOT="${BSNG_FIXTURE_ROOT:-/tmp/bsng-v09-handoff-fixture}"
export BSNG_LOCAL_OUTPUT="${BSNG_LOCAL_OUTPUT:-/tmp/bsng-v09-local-output}"
export BSNG_CHECKPOINT_WORKTREE="/tmp/bsng-v09-fixture-durable-ledger"
BRANCH="bsng-v09-fixture-checkpoints"
if [[ "$GITHUB_REPOSITORY" != "jacquesjacobs77/BSNG-Mobile" ]]; then
 echo "::error::Fixture handoff test restricted to verified BSNG repository"
 exit 1
fi
if [[ "${BSNG_HANDOFF_MODE:-}" != "fixture" ]]; then
 echo "::error::Handoff proof is synthetic fixture only. Do not treat as real human reference."
 exit 1
fi
mkdir -p "$BSNG_CHECKPOINT_WORKTREE"
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
 git fetch origin "$BRANCH"
 git worktree add --detach "$BSNG_CHECKPOINT_WORKTREE" FETCH_HEAD
else
 git worktree add --detach "$BSNG_CHECKPOINT_WORKTREE"
 git -C "$BSNG_CHECKPOINT_WORKTREE" switch --orphan "$BRANCH"
fi
node scripts/github_handoff_cli.mjs init
git -C "$BSNG_CHECKPOINT_WORKTREE" config user.name 'github-actions[bot]'
git -C "$BSNG_CHECKPOINT_WORKTREE" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git -C "$BSNG_CHECKPOINT_WORKTREE" add --all
if ! git -C "$BSNG_CHECKPOINT_WORKTREE" diff --cached --quiet; then
 git -C "$BSNG_CHECKPOINT_WORKTREE" commit -m 'Freeze synthetic cross-GitHub-run fixture campaign identity'
 git -C "$BSNG_CHECKPOINT_WORKTREE" push origin HEAD:refs/heads/"$BRANCH"
fi
if [[ "${1:-}" == "audit" ]]; then
 node scripts/github_handoff_cli.mjs audit
 exit 0
fi
# Exactly ONE new batch may be processed in this fresh GitHub runner.
# A separate dependent Actions job reopens the remote branch to process batch two.
nextfile=$(mktemp)
GITHUB_OUTPUT="$nextfile" node scripts/github_handoff_cli.mjs next
source "$nextfile"
rm "$nextfile"
if [[ -z "${next_batch_id:-}" ]]; then
 echo "Every synthetic handoff fixture batch already has verified release-backed receipt."
 node scripts/github_handoff_cli.mjs audit
 exit 0
fi
export BSNG_BATCH_ID="$next_batch_id"
export BSNG_SYNTHETIC_FIXTURE_ACK=TRUE
node scripts/github_handoff_cli.mjs scan
asset="$BSNG_LOCAL_OUTPUT/$BSNG_BATCH_ID.candidates.ndjson.gz"
test -f "$asset"
expected_sha="$(sha256sum "$asset" | cut -d' ' -f1)"
TAG="$release_tag"
if ! gh release view "$TAG" --repo "$GITHUB_REPOSITORY" >/dev/null 2>&1; then
 gh release create "$TAG" --repo "$GITHUB_REPOSITORY" \
  --target "$GITHUB_SHA" --latest=false \
  --title "BSNG GitHub ephemeral-run handoff SYNTHETIC TEST ONLY" \
  --notes "Synthetic fixture only. Tests independent Github Actions runner continuation and candidate archival. NOT real human DNA or nanite binding."
fi
# Never clobber assets. Previous upload could have succeeded even if the
# receipt commit failed; the hash comparison below detects exact recovery.
if ! gh release view "$TAG" --repo "$GITHUB_REPOSITORY" --json assets \
 | grep -Fq '"name":"'"$BSNG_BATCH_ID"'.candidates.ndjson.gz"'; then
 gh release upload "$TAG" "$asset" --repo "$GITHUB_REPOSITORY"
fi
# Verify release persistence by actually downloading the archived asset,
# not just trusting that the upload command succeeded.
tmp="$(mktemp -d)"
for attempt in 1 2 3 4 5; do
 if gh release download "$TAG" --repo "$GITHUB_REPOSITORY" \
   --pattern "$BSNG_BATCH_ID.candidates.ndjson.gz" --dir "$tmp" --clobber; then break; fi
 sleep "$((attempt*2))"
done
test -f "$tmp/$BSNG_BATCH_ID.candidates.ndjson.gz"
actual_sha="$(sha256sum "$tmp/$BSNG_BATCH_ID.candidates.ndjson.gz" | cut -d' ' -f1)"
if [[ "$expected_sha" != "$actual_sha" ]]; then
 echo "::error::Published GitHub release candidate asset SHA256 differs from source"
 exit 1
fi
echo "ARCHIVED CANDIDATE SHA256 VERIFIED $BSNG_BATCH_ID $actual_sha"
export BSNG_RELEASE_ASSET_VERIFIED=TRUE
node scripts/github_handoff_cli.mjs promote
git -C "$BSNG_CHECKPOINT_WORKTREE" add --all
if ! git -C "$BSNG_CHECKPOINT_WORKTREE" diff --cached --quiet; then
 git -C "$BSNG_CHECKPOINT_WORKTREE" commit -m "Checkpoint SYNTHETIC fixture batch $BSNG_BATCH_ID and verified release candidate SHA"
 git -C "$BSNG_CHECKPOINT_WORKTREE" push origin HEAD:refs/heads/"$BRANCH"
fi
node scripts/github_handoff_cli.mjs audit
echo "INDEPENDENT GH RUNNER CANDIDATE HANDOFF COMPLETED: $BSNG_BATCH_ID"
