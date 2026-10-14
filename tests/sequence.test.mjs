import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSequence, calculateGC, normalizeSequence, DEMO_MAX_BASES } from '../src/lib/sequence.ts';
test('normalize input and calculate GC',()=>{
  assert.equal(normalizeSequence('a c\ngt'),'ACGT');
  assert.equal(calculateGC('GCGT'),.75);
  assert.equal(calculateGC(''),0);
});
test('last sliding window is evaluated',()=>{
  const r=analyzeSequence('AAAAACCCCC',5);
  assert.equal(r.topWindows[0].index,5);
  assert.equal(r.topWindows[0].sequence,'CCCCC');
});
test('invalid input and oversized demo are rejected',()=>{
  assert.throws(()=>analyzeSequence('ATGCNNNNAAAAATTT'),/only/);
  assert.throws(()=>analyzeSequence('ATG'),/at least/);
  assert.throws(()=>analyzeSequence('A'.repeat(DEMO_MAX_BASES+1)),/at most/);
});
