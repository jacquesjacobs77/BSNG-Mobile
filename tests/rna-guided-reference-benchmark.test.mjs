import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTrueOT,scoreObservedPair,describeRows,rocAuc,averagePrecision,
  seededPRNG,analyzeTrueOT,TRUEOT_GIT_BLOB
} from '../src/lib/rna-guided-reference-benchmark.mjs';

const guide='ACGT'.repeat(5)+'TGG';
const positiveTarget=guide;
const mismatch=(s,index)=>s.slice(0,index)+(s[index]==='A'?'C':'A')+s.slice(index+1);
const mixed=[
  {guide,observedTarget:positiveTarget,label:1,sourceRow:2},
  {guide,observedTarget:mismatch(guide,1),label:1,sourceRow:3},
  {guide,observedTarget:mismatch(guide,3),label:0,sourceRow:4},
  {guide,observedTarget:mismatch(guide,4),label:0,sourceRow:5},
  {guide,observedTarget:guide.slice(0,22),label:0,sourceRow:6},
];

test('published file schema is strict and label set is binary',()=>{
  const r=parseTrueOT('gRNA,OT,label\n'+guide+','+positiveTarget+',1\n'+guide+','+mismatch(guide,1)+',0\n');
  assert.equal(r.length,2);
  assert.equal(r[0].label,1);
  assert.equal(r[1].sourceRow,3);
  assert.throws(()=>parseTrueOT('foo,bar,label\n'),/schema/);
  assert.throws(()=>parseTrueOT('gRNA,OT,label\naaa,bbb,2\n'),/row/);
});
test('locked 20 position Hamming metric does not score bulges or invent affinity',()=>{
  assert.equal(scoreObservedPair(guide,guide).score,0);
  assert.equal(scoreObservedPair(guide,mismatch(guide,1)).mismatches,1);
  assert.equal(scoreObservedPair(guide,guide.slice(0,22)),null);
  assert.equal(scoreObservedPair(guide,'N'+guide.slice(1)),null);
  const pamDifference=guide.slice(0,20)+'CCC';
  assert.equal(scoreObservedPair(guide,pamDifference).score,0);
});
test('AUROC tied ranks and average precision are deterministic and mathematically defined',()=>{
  assert.equal(rocAuc([{score:2,label:1},{score:1,label:0}]),1);
  assert.equal(rocAuc([{score:1,label:1},{score:2,label:0}]),0);
  assert.equal(rocAuc([{score:1,label:1},{score:1,label:0}]),0.5);
  assert.equal(rocAuc([{score:1,label:1}]),null);
  assert.equal(averagePrecision([{score:2,label:1},{score:1,label:0}]),1);
  assert.equal(averagePrecision([{score:1,label:1},{score:1,label:0}]),0.5);
});
test('zero observed activity and negative observations remain in exclusions',()=>{
  const summary=describeRows(mixed);
  assert.equal(summary.provenance.publishedRows,5);
  assert.equal(summary.provenance.excludedRows,1);
  assert.equal(summary.provenance.excludedNegativeRows,1);
  assert.equal(summary.provenance.acceptedRows,4);
});
test('identical seed reproduces equal cluster confidence interval and no BSNG physical claim',()=>{
  const first=analyzeTrueOT(mixed,{seed:1729,bootstrapIterations:25});
  const second=analyzeTrueOT(mixed,{seed:1729,bootstrapIterations:25});
  assert.deepEqual(first,second);
  assert.equal(first.biologicalBSNGHybridBindingDemonstrated,false);
  assert.equal(first.metrics.eligibleGuideCount,1);
  assert.equal(first.datasetSummary.excludedRows,1);
  assert.match(TRUEOT_GIT_BLOB,/^[a-f0-9]{40}$/);
});
test('published-source quality gates reject single-class fake benchmarks',()=>{
  const onlyPositive=mixed.filter(x=>x.label===1);
  assert.throws(()=>analyzeTrueOT(onlyPositive),/No guide groups/);
  const a=seededPRNG(1729),b=seededPRNG(1729);
  assert.deepEqual(Array.from({length:10},()=>a()),Array.from({length:10},()=>b()));
});
