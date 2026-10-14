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
2. Add it to **this repository** at https://github.com/jacquesjacobs77/BSNG-Mobile/settings/secrets/actions as the secret `EXPO_TOKEN`. Never put the token in source code, screenshots or chat.
3. Use the action to publish a tested Android update to the `preview` channel. Ensure the channel exists and maps to the same-name branch; check Expo dashboard under Updates → Channels, or use `eas channel:create preview`.
4. To test: publish an obvious **JavaScript-only** change without modifying `runtimeVersion`, and fully close/reopen the release app twice to fetch and apply the update.

After this test, we may automate approved JavaScript-only updates on a stable branch. Native module upgrades, runtime changes and certain Android configuration changes **still require an APK rebuild**.

## Public-reference query
Research → Public reference DNA → enter a region, for example `X:1000000..1000092:1` → **Fetch real reference sequence**. This requires internet access. Requests are limited locally to 15–5,000 bases; ambiguous reference bases are rejected rather than silently counted as A/C/G/T. The displayed reference identifier is returned by the API. Source: https://rest.ensembl.org/documentation/info/sequence_region
