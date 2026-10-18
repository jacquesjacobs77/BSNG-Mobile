# BSNG Research Studio — Mobile v0.2

A mobile-first, responsive Android **research interface prototype** for BioSynaptic NanoGenesis. This is a separate Expo / React Native app shell intended to grow around the BSNG desktop simulation engine. It takes visual inspiration from existing BSNG tablet schematics and architectural inspiration from JASTUDIO AI Brain.

## Current features
- Dedicated **Research** workspace inspired by futuristic genomic dashboards: a symbolic DNA helix and on-device live-input visualizations for GC signal, nucleotide counts, and sequence reads. Includes an optional **Ensembl public human reference-region fetch** (15–5,000 bp) with source label and download timestamp.
- Branded **BSNG Studio** Android launcher icon and short home-screen name (icons are generated before native prebuild).
- Dark navy/cyan/violet research dashboard and workspace navigation.
- Automatic portrait / landscape layout reflow. Narrow phones use a bottom navigation strip; wide screens use a left sidebar.
- Sequence input with an **on-device GC-content demonstrator** for up to 5,000 DNA bases and 15-base sliding windows, plus composition chart.
- A **concept-only** nanite research panel, GC report and native share sheet.
- Session notes (not persisted), transparent status for AI, database and genome services.
- A GitHub Actions workflow to produce an installable Android APK on GitHub-hosted hardware.

**Data distinction:** The Research workspace recalculates real measurements from the sequence entered on the device. It can optionally fetch public reference DNA from Ensembl REST; this is not live laboratory telemetry, patient DNA, human gene-expression data, or a connection to the BSNG computational backend.

**Not included:** 15-million-bp scanning, resumable jobs, scientific nanite binding calculations, clinical validation, downloaded reference genome, permanent records or connected AI models. The existing desktop source is not replaced or modified. GC score alone **does not** predict nanite binding.

## Build APK from your phone
1. Open this repository on GitHub in your phone's browser.
2. Tap **Actions → Android prototype APK**. If Actions are disabled, enable them for this repository.
3. Choose **Run workflow** on `main` (a code push to `main` also triggers a build).
4. If the run succeeds, open **Artifacts** and download **BSNG-Research-Studio-v0.2-prototype-APK**.
5. Extract the ZIP and install the enclosed `app-release.apk` on Android. This is a prototype and not a Play Store release.

GitHub's build has not yet been verified. A failed run should be investigated from the Actions log. No Expo account or Expo token is required for the GitHub Actions build.

## Work locally
```sh
npm install
python3 -m pip install Pillow==11.3.0
npm run assets
npm run check
npm test
npm start
```

**Android** (with Android SDK / Java 17 installed):
```sh
npx expo prebuild --platform android --non-interactive
cd android
./gradlew assembleRelease
```

## Architecture and scientific integrity
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). This public repository must never contain API keys, proprietary research datasets or identifiable genomic data. The JASTUDIO AI Brain service is an integration target, not currently connected.

**License:** to be determined.

## OTA updates — configuration prepared, delivery not yet verified
The Android app source now contains `expo-updates` and is bound to an existing Expo project, using:
- Expo project owner: `bsngs-team`
- Expo project slug: `jacques` (the dashboard **display name** is `BSNG`; they need not match)
- Expo Project ID: `0169fa50-1d3c-41d9-9109-fc7ae3f58e07`
- EAS Update channel: `preview`
- Runtime version policy: `appVersion` (currently Android/Expo version `0.2.0`).

Our GitHub Actions release APK uses native prebuild, so `expo.updates.requestHeaders` binds the `preview` channel even though we do **not** build the APK through EAS Build.

**OTA is not yet confirmed live.** First, the GitHub Android APK build **after** the `expo-updates` dependency must succeed and be installed on the device. The previously installed v0.1 APK does not support EAS Update. Next, the Expo project must have a channel/branch mapping for `preview`, and a compatible, tested update must be published.

A manual GitHub Actions workflow is provided at **Actions → Publish BSNG Android OTA update**. It is intentionally manual until release validation; it does not publish on every commit.
To activate the workflow securely:
1. In Expo, create an access token belonging to a user permitted to manage the `bsngs-team` project: https://expo.dev/settings/access-tokens
2. Add it to **this repository** at https://github.com/jacquesjacobs77/BSNG-Mobile/settings/secrets/actions as the secret `BSNG_STUDIO_GITHUB_UPDATES` (this is the exact key used by `.github/workflows/publish-eas-update.yml`). Never put the token in source code, screenshots or chat.
3. Use the action to publish a tested Android update to the `preview` channel. Ensure the channel exists and maps to the same-name branch; check Expo dashboard under Updates → Channels, or use `eas channel:create preview`.
4. To test: publish an obvious **JavaScript-only** change without modifying `runtimeVersion`, and fully close/reopen the release app twice to fetch and apply the update.

After this test, we may automate approved JavaScript-only updates on a stable branch. Native module upgrades, runtime changes and certain Android configuration changes **still require an APK rebuild**.

## Public-reference query
Research → Public reference DNA → enter a region, for example `X:1000000..1000092:1` → **Fetch real reference sequence**. This requires internet access. Requests are limited locally to 15–5,000 bases; ambiguous reference bases are rejected rather than silently counted as A/C/G/T. The displayed reference identifier is returned by the API. Source: https://rest.ensembl.org/documentation/info/sequence_region

## Proposed evidence-register OTA — 18 October 2026

This branch adds a **read-only Evidence** tab and overview tile, without changing the Android package, runtime, native dependencies, Expo project ID or `0.2.0` app version. It summarizes aggregated TrueOT (SpCas9 activity-label) and CTCF retrospective reference benchmarks, GRCh38.p14 manifest provenance, and explicit **NOT ASSESSABLE** status for BSNG physical hybrid binding and genomic integration. The mobile app remains a research UI; the new tab is not a laboratory result or a whole-genome scanner.

**Release procedure (manual, only after review and tests):**
1. Verify the installed Vivo build is **BSNG Studio v0.2.0**, package `za.jastudio.bsngresearch`, and was built with Expo Updates on the `preview` channel. The older v0.1 app cannot receive this OTA.
2. Review and merge the evidence-register pull request. Confirm `npm run check` and `npm test` pass and validate the mobile UI. Leave `expo.version`, runtime policy, and Android version code unchanged for this JavaScript-only update.
3. Confirm an authorized Expo token is stored as the GitHub Actions secret `BSNG_STUDIO_GITHUB_UPDATES`; verify the Expo `preview` channel maps to the branch intended to receive updates.
4. On GitHub open **Actions → Publish BSNG Android OTA update → Run workflow** on **main**. Inspect the job result and the published update's runtime/channel in Expo. If publishing fails, investigate the logs; do not claim delivery.
5. With internet enabled on the Vivo, completely close and reopen BSNG Studio twice. Look for **Evidence** on the bottom navigation or side rail. Existing session notes are not persistent, so copy any important unsaved notes before closing.

**Important:** The GitHub pull request or a new APK build does not by itself publish the OTA. ChatGPT cannot operate the Vivo device directly or inspect the Expo project's private publishing credentials. Do not uninstall the working build while diagnosing updates.
