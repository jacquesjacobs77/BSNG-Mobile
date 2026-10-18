import test from 'node:test';
import assert from 'node:assert/strict';
import { runResearch } from '../scripts/lumen_research_engine.mjs';

test('four independent lanes run in workers and preserve epistemic boundaries', async () => {
  const r = await runResearch('GGGGGGGGGGGGGGGAAAAAAAAAAAAAAA');
  assert.deepEqual(r.execution.lanes_completed, ['composition','windows','strand_qc','composition_null']);
  assert.equal(r.results.composition.gc_fraction, .5);
  assert.deepEqual(r.results.windows.high_gc_local_offsets_0_based, [0]);
  assert.equal(r.results.strand_qc.forward_reverse_gc_equal, true);
  assert.equal(r.results.strand_qc.double_reverse_complement_matches, true);
  assert.equal(r.results.composition_null.permutations, 64);
  assert.equal(r.verdict, 'INSUFFICIENT_EVIDENCE_TO_PROVE_OR_DISPROVE_BSNG');
  assert.equal(r.falsification_gates.physical_hybrid, 'NOT_ASSESSABLE');
  assert.equal(r.input.genomic_coordinates, null);
  assert.equal(r.known_external_references.combination_prohibited, true);
});
test('reject ambiguous input instead of pretending a biological score', async () => {
  await assert.rejects(runResearch('ACGTNACGTNACGTNACGT'), /A\/C\/G\/T/);
});
test('randomization results are reproducible for a fixed sequence', async () => {
  const s = 'GGGTTAACCTAGTAGCTAGC'.repeat(5);
  const [a,b] = await Promise.all([runResearch(s),runResearch(s)]);
  assert.deepEqual(a.results.composition_null, b.results.composition_null);
  assert.equal(a.input.sha256, b.input.sha256);
});
