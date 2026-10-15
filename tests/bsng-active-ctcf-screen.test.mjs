import test from 'node:test';
import assert from 'node:assert/strict';
import {createCtcfStreamingScreen,validateRegion} from '../src/lib/bsng-active-ctcf-screen.mjs';
import {CTCF_PWM, encodeDNA,scoreSite} from '../src/lib/ctcf-reference-model.mjs';

const best19=CTCF_PWM.weights.map(w=>'ACGT'[Array.from(w).indexOf(Math.max(...w))]).join('');
const fixture='N'.repeat(21)+best19+'ACGT'.repeat(300)+best19+'N'.repeat(19);
function run(parts,start=1_000_000){
  const scan=createCtcfStreamingScreen({regionStart1:start,binSize:1000,topK:6});
  for(const p of parts)scan.addChunk(p);
  return scan.summary();
}
test('coordinate validation is exact, accepts 10 million bases but rejects invalid intervals',()=>{
  assert.deepEqual(validateRegion({chromosome:'chrX',start:1_000_000,length:10_000_000}),
    {species:'Homo sapiens',assembly:'GRCh38',chromosome:'X',start1BasedInclusive:1_000_000,
     end1BasedInclusive:10_999_999,length:10_000_000,coordinateConvention:'1-based inclusive'});
  assert.throws(()=>validateRegion({chromosome:'23',start:100,length:100000}),/chromosome/);
  assert.throws(()=>validateRegion({chromosome:'X',start:0,length:100000}),/start/);
  assert.throws(()=>validateRegion({chromosome:'X',start:1,length:10000001}),/10,000,000/);
});
test('one-shot and arbitrarily chunked streaming scan yield exactly identical sites and counts',()=>{
 const original=run([fixture]);
 const chunks=[];
 for(let p=0;p<fixture.length;){const width=p%37+1;chunks.push(fixture.slice(p,p+width));p+=width;}
 const chunked=run(chunks);
 assert.deepEqual(chunked.findings,original.findings);
 assert.equal(chunked.validWindows,original.validWindows);
 assert.equal(chunked.ambiguousWindows,original.ambiguousWindows);
 assert.equal(chunked.examinedBases,original.examinedBases);
 assert.equal(chunked.allWindowsAccountedFor,true);
});
test('reported motif score and strand correspond to independent model score at exact position',()=>{
 const report=run([fixture]);
 for(const site of report.findings){
  const actual=scoreSite(encodeDNA(fixture),site.position0RelativeToRegion);
  assert.ok(Math.abs(actual.score-site.pwmLog2OddsScore)<1e-8);
  assert.equal(actual.strand,site.strand);
  assert.equal(site.start1BasedInclusive,1_000_000+site.position0RelativeToRegion);
  assert.equal(site.end1BasedInclusive,site.start1BasedInclusive+18);
  assert.equal(site.referencePlusStrand19,fixture.slice(site.position0RelativeToRegion,site.position0RelativeToRegion+19));
  assert.equal(site.measuredBsngBinding,false);
  assert.equal(site.measuredIntegration,false);
 }
});
test('one candidate per fixed reference-local 1000bp bin and zero on all ambiguous sequence',()=>{
 const report=run([fixture]);
 assert.equal(new Set(report.findings.map(x=>x.binIndex0)).size,report.findings.length);
 const none=run(['N'.repeat(300)]);
 assert.equal(none.findings.length,0);
 assert.equal(none.validWindows,0);
 assert.equal(none.ambiguousWindows,300-18);
 assert.equal(none.allWindowsAccountedFor,true);
});
test('10M-base streaming counts without retaining every window in report',()=>{
 const runner=createCtcfStreamingScreen({regionStart1:1_000_000,topK:5});
 // N's avoid misleading synthetic motif winners, while exercising all 10M offsets
 for(let j=0;j<10;j++)runner.addChunk('N'.repeat(1_000_000));
 const result=runner.summary();
 assert.equal(result.examinedBases,10_000_000);
 assert.equal(result.validWindows,0);
 assert.equal(result.ambiguousWindows,9_999_982);
 assert.equal(result.findings.length,0);
 assert.ok(JSON.stringify(result).length<4000);
});
test('rejects invalid DNA chunks and never silently treats N as canonical nucleotide',()=>{
 const runner=createCtcfStreamingScreen({regionStart1:1,topK:3});
 assert.throws(()=>runner.addChunk('ATGCz'),/Invalid/);
 assert.throws(()=>runner.addChunk(''),/Invalid/);
 runner.addChunk('ACGTNACGTNACGTNACGTN');
 assert.equal(runner.summary().validWindows,0);
});
