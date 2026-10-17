import test from 'node:test';
import assert from 'node:assert/strict';
import {TRIAL,auditTenBatchContinuation,assertOneStep}
 from '../src/lib/bounded-10-batch-policy.mjs';
const sha=(digit)=>digit.repeat(64);
const batch=(i,findings)=>{
 const id='B'+String(i).padStart(6,'0');
 return {
  batchId:id,contig:'NC_000001.11',refseqAssemblyAccession:TRIAL.accession,
  track:'A_CHROMOSOMES',status:'VERIFIED_STORED',
  start1BasedInclusive:(i-1)*10_000_000+1,end1BasedInclusive:i*10_000_000,
  ownedBases:10_000_000,planSha256:TRIAL.wholeAssemblyPlanSha256,
  sourceFastaSha256:TRIAL.fullSourceSha256,
  qualifyingCandidateCount:findings,
  compressedCandidateReleaseTag:TRIAL.releaseTag,
  compressedCandidateAssetName:id+'.candidates.ndjson.gz',
  compressedCandidateSha256:sha('a'),uncompressedCandidateNdjsonSha256:sha('b'),
  actualBsngBinding:'NOT_ASSESSABLE',actualGenomicIntegration:'NOT_ASSESSABLE',
  createdAt:'2026-10-15T00:00:00Z'
 };
};
const baseline=[batch(1,277),batch(2,211),batch(3,196)];
function registry(receipts=baseline){
 return {
  schemaVersion:1,id:TRIAL.campaignId,assembly:TRIAL.refseqAssembly,campaignType:'REAL_REFERENCE',
  sourceCodeCommit:TRIAL.scientificSourceCommit,sourceFastaSha256:TRIAL.fullSourceSha256,
  sourcePlanSha256:TRIAL.wholeAssemblyPlanSha256,
  scientificStatus:'NATURAL_CTCF_REFERENCE_COMPUTATION_NOT_BSNG_BINDING',
  status:'INCOMPLETE',receipts,
  coverage:{status:'INCOMPLETE',completedBatches:receipts.length,totalBatches:1003,
    completedOwnedBases:receipts.reduce((a,r)=>a+r.ownedBases,0),
    candidateCountVerified:receipts.reduce((a,r)=>a+r.qualifyingCandidateCount,0)}
 };
}
test('first three authentic-reference milestones are frozen; precisely 10 further batches authorized',()=>{
 const report=auditTenBatchContinuation(registry());
 assert.equal(report.completedBatches,3);
 assert.equal(report.remainingAllowedBatches,10);
 assert.equal(report.nextBatchId,'B000004');
 assert.equal(report.qualifyingNaturalCtcfWindows,684);
 assert.equal(report.completedOwnedBases,30_000_000);
});
test('one newly archived exact genomic interval is accepted, earlier scientific receipts cannot mutate',()=>{
 const a=registry();
 const b=registry([...baseline,batch(4,99)]);
 assert.equal(assertOneStep(a,b).completedBatches,4);
 const changed=structuredClone(b);changed.receipts[0].compressedCandidateSha256=sha('c');
 assert.throws(()=>assertOneStep(a,changed),/Previously archived receipt changed/);
 const missing=registry([...baseline,batch(5,99)]);
 assert.throws(()=>auditTenBatchContinuation(missing),/B000004/);
 assert.throws(()=>assertOneStep(a,registry([...baseline,batch(4,1),batch(5,2)])),/EXACTLY one/);
});
test('after B000013 all 130 million represented bases are counted and no additional jobs permitted',()=>{
 const ten=[...baseline,...Array.from({length:10},(_,i)=>batch(i+4,100+i))];
 const full=registry(ten);
 const report=auditTenBatchContinuation(full);
 assert.equal(report.trialStatus,'TARGET_VERIFIED_STOP');
 assert.equal(report.nextBatchId,null);
 assert.equal(report.remainingAllowedBatches,0);
 assert.equal(report.completedBatches,13);
 assert.equal(report.completedOwnedBases,130_000_000);
 assert.throws(()=>assertOneStep(full,registry([...ten,batch(14,5)])),/already complete|overrun/);
 assert.throws(()=>auditTenBatchContinuation(registry([...ten,batch(14,5)])),/overrun/);
});
test('scientific source, source-code, model status and actual DNA coordinates are immutable',()=>{
 for(const [path,value] of [
   ['sourceCodeCommit','0'.repeat(40)],['sourceFastaSha256',sha('c')],
   ['sourcePlanSha256',sha('d')],['campaignType','SYNTHETIC_TEST_FIXTURE'],
   ['scientificStatus','BSNG_NANITE_BINDING_CONFIRMED'],
   ['id','another-campaign']
 ]){
  const x=registry();x[path]=value;
  assert.throws(()=>auditTenBatchContinuation(x),/study identity/);
 }
 for(const [path,value] of [
  ['start1BasedInclusive',999],['end1BasedInclusive',1],['ownedBases',5],
  ['actualBsngBinding','VERIFIED'],['actualGenomicIntegration','SAFE'],
  ['compressedCandidateAssetName','other.gz'],['qualifyingCandidateCount',-1],
  ['track','C_ALTERNATES_PATCHES']
 ]){
  const x=structuredClone(registry());x.receipts[1][path]=value;
  assert.throws(()=>auditTenBatchContinuation(x),/receipt|inconsistent/);
 }
});
test('no fake complete genome status, skipped/duplicated batches, altered original candidates or trial retarget',()=>{
 let x=structuredClone(registry());x.status='COMPLETE';
 assert.throws(()=>auditTenBatchContinuation(x),/coverage/);
 x=structuredClone(registry());x.coverage.completedBatches=13;
 assert.throws(()=>auditTenBatchContinuation(x),/checkpoint/);
 x=structuredClone(registry());x.receipts[2].qualifyingCandidateCount=999;x.coverage.candidateCountVerified=1487;
 assert.throws(()=>auditTenBatchContinuation(x),/original independent/);
 x=structuredClone(registry());x.receipts[1].batchId='B000001';
 assert.throws(()=>auditTenBatchContinuation(x),/B000002/);
 assert.throws(()=>auditTenBatchContinuation(registry(),{target:1003}),/Target must/);
});
