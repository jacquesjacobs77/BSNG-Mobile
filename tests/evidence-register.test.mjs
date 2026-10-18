import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = fs.readFileSync(new URL('../src/screens/ResearchEvidenceScreen.tsx', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const config = JSON.parse(fs.readFileSync(new URL('../app.json', import.meta.url), 'utf8'));

test('Evidence tab is reachable in phone and tablet navigation', () => {
  assert.match(app, /id:'evidence',label:'Evidence'/);
  assert.match(app, /evidence:\(\)=> <ResearchEvidenceScreen\/>/);
  assert.match(app, /import ResearchEvidenceScreen/);
});

test('Evidence metrics remain explicitly retrospective and separate', () => {
  for (const token of ['1,806', '1,579', '33', '0.7946', '0.8702', 'NOT ASSESSABLE']) {
    assert.ok(evidence.includes(token), 'Missing evidence boundary or metric: '+token);
  }
  assert.match(evidence, /not physical binding-affinity measurements/);
  assert.match(evidence, /not be numerically combined/);
  assert.match(evidence, /no experimentally characterized joint nanite hybrid complex/i);
});

test('Research-only OTA does not change installed 0.2.0 runtime binding', () => {
  assert.equal(config.expo.version, '0.2.0');
  assert.equal(config.expo.android.package, 'za.jastudio.bsngresearch');
  assert.equal(config.expo.runtimeVersion.policy, 'appVersion');
  assert.equal(config.expo.updates.requestHeaders['expo-channel-name'], 'preview');
  assert.equal(config.expo.updates.url, 'https://u.expo.dev/0169fa50-1d3c-41d9-9109-fc7ae3f58e07');
});
