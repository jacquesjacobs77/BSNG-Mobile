import test from 'node:test';
import assert from 'node:assert/strict';
import { reverseComplement, runRecognitionScreen, ASSAY_MOTIF_BASES } from '../src/lib/bsng-recognition-assay.mjs';

const motif = 'ACGTTGCACTAGTCA'; // a hypothetical 15-base motif; NOT a validated nanite target
const sequence = 'T'.repeat(18) + motif + 'CCCCCC' + reverseComplement(motif) + 'N'.repeat(15);

test('assay evaluates both strands, offsets, and ambiguous bases', () => {
  assert.equal(motif.length, ASSAY_MOTIF_BASES);
  const result = runRecognitionScreen({ sequence, motif });
  assert.equal(result.observedMatchCount, 2);
  assert.deepEqual(result.firstObservedPositions0Based, [18, 39]);
  assert.equal(result.ambiguousBases, 15);
  assert.equal(result.evidenceType, 'COMPUTATIONAL_SEQUENCE_MATCH_ONLY');
});

test('composition-matched controls preserve A/C/G/T counts and exclude target', () => {
  const result = runRecognitionScreen({ sequence, motif, controls: 32, seed: 42 });
  const tally = text => ['A','C','G','T'].map(base => [...text].filter(c => c === base).length);
  for (const control of result.compositionMatchedControlMotifs) {
    assert.deepEqual(tally(control), tally(motif));
    assert.notEqual(control, motif);
    assert.notEqual(control, reverseComplement(motif));
  }
  assert.equal(result.compositionMatchedControlMotifs.length, 32);
  assert.ok(result.empiricalEnrichmentP > 0 && result.empiricalEnrichmentP <= 1);
});

test('identical source and seed reproduce exactly the same machine-readable results', () => {
  const config = { sequence, motif, controls: 24, seed: 1776, source: { assembly:'GRCh38', chromosome:'X', region:'X:1000000..1000092:1' } };
  assert.deepEqual(runRecognitionScreen(config), runRecognitionScreen(config));
});

test('absence of candidate exact matches is not positive evidence', () => {
  const result = runRecognitionScreen({ sequence: 'A'.repeat(100), motif, controls: 8 });
  assert.equal(result.observedMatchCount, 0);
  assert.equal(result.empiricalEnrichmentP, 1);
});

test('invalid inputs and impractical experiments are rejected', () => {
  assert.throws(() => runRecognitionScreen({sequence, motif:'ACGT'}), /15-base/);
  assert.throws(() => runRecognitionScreen({sequence:'A'.repeat(5001), motif}), /5,000/);
  assert.throws(() => runRecognitionScreen({sequence:'A'.repeat(20)+'Z', motif}), /A\/C\/G\/T\/N/);
  assert.throws(() => runRecognitionScreen({sequence, motif, controls:0}), /1 to 100/);
  assert.throws(() => runRecognitionScreen({sequence, motif:'A'.repeat(15), controls:8}), /Cannot generate/);
});
