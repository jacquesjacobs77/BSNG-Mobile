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

## Automatic updates (planned, not yet active)
This APK still requires manual installation. For later JavaScript/visual updates without APK replacement, we intend to configure **Expo EAS Update** after the repository owner creates an Expo account and authorizes the project. This needs a new APK containing `expo-updates`, project ID and update channel before OTA delivery can work. Native upgrades can still require another APK.

## Public-reference query
Research → Public reference DNA → enter a region, for example `X:1000000..1000092:1` → **Fetch real reference sequence**. This requires internet access. Requests are limited locally to 15–5,000 bases; ambiguous reference bases are rejected rather than silently counted as A/C/G/T. The displayed reference identifier is returned by the API. Source: https://rest.ensembl.org/documentation/info/sequence_region
