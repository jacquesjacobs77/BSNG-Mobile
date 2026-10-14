import test from 'node:test';
import assert from 'node:assert/strict';
import { createGenomeAccumulator, MAX_REGION_BASES } from '../src/lib/genome-stream.mjs';

test('chunk boundaries exactly reproduce one-shot computation',()=>{
  const whole='AAAAACCCCCNNNACGTCGCGTTTTTT';
  const single=createGenomeAccumulator({windowSize:5});
  single.addChunk(whole);
  const streamed=createGenomeAccumulator({windowSize:5});
  for (const part of ['AA','AAA','CC','CCC','N','NNAC','GTC','GCGTTTTTT']) streamed.addChunk(part);
  const x=single.summary(), y=streamed.summary();
  assert.equal(x.length, y.length);
  assert.equal(y.chunksProcessed,8);
  assert.deepEqual(x.nucleotideCounts,y.nucleotideCounts);
  assert.deepEqual(x.topWindows,y.topWindows);
  assert.equal(x.windowsExamined,y.windowsExamined);
  assert.equal(x.windowsExcludedAmbiguous,y.windowsExcludedAmbiguous);
});

test('correctly finds final window across arbitrary boundaries',()=>{
  const acc=createGenomeAccumulator({windowSize:5});
  acc.addChunk('AAAAA');
  acc.addChunk('C');
  acc.addChunk('CCCC');
  const r=acc.summary();
  assert.equal(r.topWindows[0].index0Based,5);
  assert.equal(r.topWindows[0].sequence,'CCCCC');
  assert.equal(r.gcFraction,0.5);
  assert.equal(r.windowsExamined,6);
});

test('N is counted but excluded from scored sliding windows',()=>{
  const acc=createGenomeAccumulator({windowSize:3});
  acc.addChunk('ANNA');
  const r=acc.summary();
  assert.equal(r.validBases,2);
  assert.equal(r.gcFraction,0);
  assert.equal(r.windowsExamined,0);
  assert.equal(r.windowsExcludedAmbiguous,2);
});

test('invalid and oversized chunks are rejected before state mutation',()=>{
  const acc=createGenomeAccumulator({windowSize:2,maxBases:5});
  acc.addChunk('ACG');
  assert.throws(()=>acc.addChunk('AX'),/unsupported/);
  assert.throws(()=>acc.addChunk('AAA'),/exceeds/);
  assert.equal(acc.summary().length,3);
  assert.equal(MAX_REGION_BASES,10_000_000);
});

test('10M-base processing does not retain raw DNA or every window',()=>{
  const acc=createGenomeAccumulator({windowSize:15,maxBases:MAX_REGION_BASES,topK:5});
  const block='ACGT'.repeat(1250);
  for(let i=0;i<2_000;i++) acc.addChunk(block);
  const result=acc.summary();
  assert.equal(result.length,10_000_000);
  assert.equal(result.validBases,10_000_000);
  assert.equal(result.gcFraction,0.5);
  assert.equal(result.windowsExamined,10_000_000-14);
  assert.ok(result.topWindows.length<=5);
  assert.ok(JSON.stringify(result).length<5000);
});
