import test from 'node:test';
import assert from 'node:assert/strict';
import { parseNarrowPeaks,auc,makeSeededRandom,evaluateCtcFObservedPeaks } from '../src/lib/ctcf-chipseq-benchmark.mjs';
import { encodeDNA,scoreGenome,CTCF_PWM } from '../src/lib/ctcf-reference-model.mjs';

test('ENCODE narrowPeak BED positions are parsed as 0-based half-open; local and global coordinates aligned',()=>{
 const bed='chrX\t999999\t1000300\tone\t50\t.\t0\t0\t0\t200\nchrY\t999999\t1000300\ttwo\t50\t.\t0\t0\t0\t200\n';
 const peaks=parseNarrowPeaks(bed,'X',1_000_000,10000);
 assert.equal(peaks.length,1);
 assert.equal(peaks[0].relativeSummit0,200);
 assert.equal(peaks[0].summit0+1,1_000_200);
});
test('AUROC known positive, negative and tied ranks',()=>{
 assert.equal(auc([10,9],[2,1]),1);
 assert.equal(auc([1,2],[3,4]),0);
 assert.equal(auc([1,1],[1,1]),0.5);
 assert.equal(auc([],[]),null);
});
test('seeded negative control random function repeats exactly',()=>{
 const a=makeSeededRandom(1729),b=makeSeededRandom(1729);
 assert.deepEqual(Array.from({length:20},()=>a()),Array.from({length:20},()=>b()));
});
test('benchmark rejects insufficient experimental observations rather than creating artificial positives',()=>{
 const seq=encodeDNA('ACGT'.repeat(500));
 const score=scoreGenome(seq,{pwm:CTCF_PWM,topK:5});
 assert.throws(()=>evaluateCtcFObservedPeaks({encoded:seq,scores:score.scores,peaks:[]}),/Insufficient/);
});
