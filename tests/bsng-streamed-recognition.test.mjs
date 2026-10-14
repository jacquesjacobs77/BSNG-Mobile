import test from 'node:test';
import assert from 'node:assert/strict';
import { runRecognitionScreen, reverseComplement } from '../src/lib/bsng-recognition-assay.mjs';
import { createStreamedRecognitionAssay } from '../src/lib/bsng-streamed-recognition.mjs';

const motif='ACGTTGCACTAGTCA';
const longSequence='TTTT'.repeat(7) + motif + 'GG'.repeat(13) + reverseComplement(motif) + 'N'.repeat(16) + motif + 'TTTAAC';
const cfg={motif,controls:32,seed:1729};

test('10M-capable recognition matches original validated small-sequence assay',()=>{
  const original=runRecognitionScreen({sequence:longSequence,...cfg});
  const newer=createStreamedRecognitionAssay(cfg);
  newer.addChunk(longSequence);
  const result=newer.summary();
  assert.equal(result.observedMatchCount,original.observedMatchCount);
  assert.deepEqual(result.firstObservedPositions0Based,original.firstObservedPositions0Based);
  assert.deepEqual(result.decoyMotifs,original.compositionMatchedControlMotifs);
  assert.deepEqual(result.decoyMatchCounts,original.controlMatchCounts);
  assert.equal(result.empiricalEnrichmentP,original.empiricalEnrichmentP);
  assert.equal(result.ambiguousBases,original.ambiguousBases);
});

test('scanning is invariant across irregular chunk boundaries',()=>{
  const reference=createStreamedRecognitionAssay(cfg);
  reference.addChunk(longSequence);
  const expected=reference.summary();
  const actual=createStreamedRecognitionAssay(cfg);
  for (let p=0;p<longSequence.length;) {
    const width=p%17+1;
    actual.addChunk(longSequence.slice(p,p+width));
    p+=width;
  }
  const found=actual.summary();
  assert.equal(found.observedMatchCount,expected.observedMatchCount);
  assert.deepEqual(found.firstObservedPositions0Based,expected.firstObservedPositions0Based);
  assert.deepEqual(found.decoyMatchCounts,expected.decoyMatchCounts);
  assert.equal(found.ambiguousBases,expected.ambiguousBases);
});

test('matches can overlap and span chunk boundaries without duplication',()=>{
  const target='ACACACACACACACA';
  const assay=createStreamedRecognitionAssay({motif:target,controls:1,seed:1729});
  // A 17-base alternating sequence has two overlapping 15-base windows.
  assay.addChunk('ACACA');
  assay.addChunk('CACACACACACA');
  const report=assay.summary();
  assert.equal(report.observedMatchCount,2);
  assert.deepEqual(report.firstObservedPositions0Based,[0,2]);
});

test('a negative result is preserved, not misrepresented as evidence of binding',()=>{
  const assay=createStreamedRecognitionAssay(cfg);
  assay.addChunk('A'.repeat(200));
  const report=assay.summary();
  assert.equal(report.observedMatchCount,0);
  assert.equal(report.empiricalEnrichmentP,1);
  assert.equal(report.biologicalClaimSupported,false);
});

test('reproducibility from identical assumptions, chunking, and seed',()=>{
  const run=()=>{
    const a=createStreamedRecognitionAssay(cfg);
    a.addChunk(longSequence.slice(0,11));
    a.addChunk(longSequence.slice(11));
    return a.summary();
  };
  assert.deepEqual(run(),run());
});

test('rejects invalid pre-registrations, maximum lengths, and invalid bases',()=>{
  assert.throws(()=>createStreamedRecognitionAssay({motif:'ACGT'}),/15-base/);
  const a=createStreamedRecognitionAssay({...cfg,maxBases:40});
  a.addChunk('A'.repeat(20));
  assert.throws(()=>a.addChunk('NAZ'),/Invalid/);
  assert.throws(()=>a.addChunk('A'.repeat(21)),/exceeds/);
  assert.equal(a.summary().sequenceLength,20);
});
