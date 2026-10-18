# Lumen × BSNG — controlled research protocol (18 October 2026)

## Goal, claims and current scientific status

BSNG is a proposed molecular integration framework: programmable bio-synthetic microstructures, DNA/chromatin interaction, cellular ATP/metabolic energy, conditional sensing, constrained replication and failsafes, and eventual therapeutic applications. This is a **research hypothesis**, not an experimentally validated integrated platform. Lumen is the planned scientific reasoning and evidence-critique layer; describing Lumen as AI is only accurate when a genuine model connection is operational.

We are explicitly testing whether *individual necessary claims* withstand evidence. Failure of one necessary claim would weigh against the integrated concept; success of a sequence-composition model cannot establish the whole system.

| Claim | Computational question | Present evidence | What could falsify or validate it |
|---|---|---|---|
| Molecular recognition | Are published natural RNA/protein reference systems predictable? | TrueOT SpCas9 macro per-guide AUROC 0.7946374 (33 guides; 1,579 eligible observations); separate CTCF AUC 0.8702221 | Replicated independent external datasets and controls for each reference, not hybrid BSNG |
| Physical hybrid coupling | Does a characterized BSNG construct selectively attach in a measured system? | **NOT ASSESSABLE** | Independent measurements of the specific physical construct, affinity, off-target recognition and specificity |
| Cellular energy | Is any proposed function sustainable from intracellular metabolism? | **NOT ASSESSABLE** | Quantified energy budget and perturbation controls; separate viability measurements |
| Genomic integration | Can the construct achieve validated controlled integration without damaging cells? | **NOT ASSESSABLE** | Physical evidence of integration, genomic stability, off-target consequences and long-term safety |
| Safety and controllability | Does activation/replication terminate as required? | **NOT ASSESSABLE** | Independent containment, lifecycle, failure-mode and toxicity assessments |
| Therapeutic benefit | Are defined biological outcomes reproducible and safe? | **NOT ASSESSABLE** | Controlled independent preclinical validation; no clinical use based on current data |

**Never combine the TrueOT and CTCF retrospective AUC values into a nanite-binding score.** GC proportion is not a binding-energy or therapeutic-response predictor. Do not infer genomic coordinates from TrueOT; its raw dataset does not contain them.

## What is implemented in this branch

- **Four actual parallel Node.js worker threads:** A/C/G/T base composition, sliding 15-bp GC extrema and *local* offsets, reverse-complement consistency, and 64 seeded base-composition-preserving shuffled controls.
- **Input safety:** accepted sequences must be A/C/G/T only, 15–5,000 bases. Output is a SHA-256 sequence hash and aggregate statistics; raw input is not saved in reports.
- **Reproducible output:** JSON includes source class, seed, method, all lane outputs, uncertainty limitations, negative-control results, evidence-source boundaries, and a formal insufficient-evidence verdict.
- **Archived authentic reference audit:** the GH Action reads the already-existing `bsng-v09-real-ctcf-checkpoints` branch's `index.json` and emits a sanitized summary of completion, source hash and candidate counts. It does **not** rerun or alter the frozen scientific genome engine or checkpoints.
- **Optional remote Lumen reviewer:** server-side `POST /v1/responses` sends **aggregate metadata and measurements only** with `store:false`. Strict instructions require skepticism and limit inference. It is not used as the source of numeric biological measurements.
- **Mobile Lumen tab:** reuses the on-device sequence input and local composition analysis; links to the separate GH Actions research audits. It **cannot** yet dispatch authenticated cloud jobs from the phone nor display live cloud reports.
- **Current state:** mobile OTA code staged; not published. Offline AI review status `NOT_CONNECTED`; no AI model call was executed in this preparation.

## Activation, credentials and automatic execution

The GH Actions workflow `.github/workflows/lumen-research.yml` is read-only, bounded, runs automatically after merging research-engine changes to `main`, and allows manual repeat via workflow dispatch. It will still run **without** credentials and explicitly report `NOT_CONNECTED` rather than impersonating AI.

If a cloud AI reviewer is desired, administrators can configure server-only secret `BSNG_REVIEW_API_KEY` and repository variable `BSNG_REVIEW_MODEL` (valid model available to the account). Never put either into a phone app, repository file, public logs, screenshots, or chat. AI-provider usage may incur cost; no automatic recurring model bill is enabled by this branch. The record of each run is an Actions artifact (30-day retention), not the permanent BSNG research DB.

The OTA deployment pipeline is **separate** from the research workflow. The current EAS publish workflow is defined as `workflow_dispatch` and uses secret `BSNG_STUDIO_GITHUB_UPDATES`. The mobile app targets project `0169fa50-1d3c-41d9-9109-fc7ae3f58e07`, preview channel, runtime app version `0.2.0`. Expo can support completely automated EAS updates using stored tokens, but a past successful OTA does not prove that the present workflow is automatic or that its secret/channel bindings are healthy. **Do not publish until after review, tests and a verified build.**

## How to reproduce the present bounded computational proof-of-pipeline

```bash
node --test tests/lumen-research.test.mjs
node scripts/lumen_research_engine.mjs --out bsng-lumen-research-results.json
node scripts/lumen_checkpoint_reader.mjs path/to/archived/index.json bsng-campaign-summary.json
node scripts/lumen_ai_reviewer.mjs bsng-lumen-research-results.json bsng-lumen-ai-review.json bsng-campaign-summary.json
```

Without the server-side API secret/model variable, the last command produces a machine-readable `NOT_CONNECTED` report; every numeric result is computed by local code, never invented by the language model.

**Not yet implemented:** automated reproducible physical-binding model against a characterized BSNG construct, genome-wide sequence retrieval from the Vivo, experimental physics or clinical validation, signed streaming genomic-data service, on-device LLM, active autonomous task generation, dedicated encrypted long-term repository, or a live bidirectional mobile/cloud scientific results service. The existing desktop `D:\BSNG_Learning_DB` remains an integration target, not a remotely accessible database.

## Release conditions

1. Run TS check and full Node tests on the source branch; inspect GH CI logs.
2. Verify fixed evidence reference counts against archived JSON and never overwrite the original research.
3. Ensure no raw human genomes, private files or API tokens enter the public repository or AI payload.
4. Confirm app `0.2.0` binary has an EAS Updates-compatible `preview` channel.
5. Release the JS-only OTA deliberately, validate app launch, then confirm Lumen and Evidence tabs on the Vivo.

The central outcome of today's sample simulation: **the pipeline executes; the BSNG physical thesis remains unproven and not disproven.**
