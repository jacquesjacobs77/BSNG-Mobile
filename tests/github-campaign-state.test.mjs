import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseAssemblyReport,planWholeAssembly} from '../src/lib/whole-assembly-manifest.mjs';
import {CTCF_SCREEN_POLICY} from '../src/lib/whole-assembly-ctcf-batch.mjs';
import {makeCampaignIndex,auditCampaignIndex,nextCampaignBatch,addPublishedReceipt}
 from '../src/lib/github-campaign-state.mjs';
const h=x=>createHash('sha256').update(x).digest('hex');
function makePlan(){
 const rs=[...Array.from({length:22},(_,i)=>String(i+1)),'X','Y','MT'];
 const records=rs.map((x,i)=>[x,'assembled-molecule',x,'Chromosome','CM_'+i+'.1','=',
  x==='MT'?'NC_012920.1':'NC_'+String(i+1).padStart(6,'0')+'.11',
  x==='MT'?'non-nuclear':'Primary Assembly','43','na'].join('\t'));
 records.push('test-unplaced\tunplaced-scaffold\tna\tna\tCM123.1\t=\tNW_012345.1\tPrimary Assembly\t24\tna');
 records.push('test-alt\talt-scaffold\t6\tChromosome\tCM321.1\t=\tNT_012345.1\tALT_REF_LOCI_1\t37\tna');
 return planWholeAssembly(parseAssemblyReport([
  '# Assembly name: GRCh38.p14',
  '# RefSeq assembly accession: GCF_000001405.40',
  '# Sequence-Name\tSequence-Role\tAssigned-Molecule\tAssigned-Molecule-Location/Type\tGenBank-Accn\tRelationship\tRefSeq-Accn\tAssembly-Unit\tSequence-Length\tUCSC-style-name',
  ...records,''].join('\n')),{maxBases:40});
}
const plan=makePlan(),sourceHash=h('synthetic fixture fasta bytes');
function receiptFor(batch){
 return {
  schemaVersion:1,status:'VERIFIED_STORED',scientificStatus:'NATURAL_REFERENCE_CTCF_SEQUENCE_ONLY',
  batchId:batch.id,track:batch.track,contig:batch.refseqAccession,planSha256:plan.planSha256,
  sourceFastaSha256:sourceHash,refseqAssemblyAccession:'GCF_000001405.40',
  start1BasedInclusive:batch.start1BasedInclusive,end1BasedInclusive:batch.end1BasedInclusive,
  contigLength:batch.contigLength,ownedBases:batch.ownedBases,validWindows:batch.ownedBases,
  ambiguousWindows:0,terminalUnscorableStarts:0,qualifyingCandidateCount:2,
  modelPfmSha256:CTCF_SCREEN_POLICY.modelPfmSha256,
  exploratoryThresholdLog2Odds:CTCF_SCREEN_POLICY.exploratoryThresholdLog2Odds,
  ownedReferenceUppercaseSha256:h('synthetic reference bases '+batch.id),
  compressedCandidateSha256:h('compressed data '+batch.id),
  uncompressedCandidateNdjsonSha256:h('uncompressed data '+batch.id),
  candidateArchiveFile:batch.id+'.candidates.ndjson.gz',
  actualBsngBinding:'NOT_ASSESSABLE',actualGenomicIntegration:'NOT_ASSESSABLE',
  createdAt:'2026-01-01T00:00:00.000Z',codeCommit:'test'
 };
}
test('fixture handoff has a stable and explicitly synthetic campaign identity',()=>{
 const a=makeCampaignIndex(plan,{sourceFastaSha256:sourceHash,kind:'SYNTHETIC_TEST_FIXTURE'});
 const b=makeCampaignIndex(plan,{sourceFastaSha256:sourceHash,kind:'SYNTHETIC_TEST_FIXTURE'});
 assert.equal(a.id,b.id);
 assert.match(a.scientificStatus,/SYNTHETIC/);
 assert.equal(a.coverage.completedBatches,0);
 assert.equal(a.status,'NOT_STARTED');
 assert.equal(auditCampaignIndex(plan,a).completedBatches,0);
 assert.equal(nextCampaignBatch(plan,a).id,'B000001');
 const real=makeCampaignIndex(plan,{sourceFastaSha256:sourceHash,kind:'REAL_REFERENCE'});
 assert.notEqual(real.id,a.id);
 assert.throws(()=>makeCampaignIndex(plan,{sourceFastaSha256:'broken'}),/SHA256/);
});
test('only an uploaded release asset matching first pending batch may become permanent scientific checkpoint',()=>{
 const initial=makeCampaignIndex(plan,{sourceFastaSha256:sourceHash,kind:'SYNTHETIC_TEST_FIXTURE'});
 const first=plan.batches[0],second=plan.batches[1];
 assert.throws(()=>addPublishedReceipt(plan,initial,receiptFor(second),{
  assetName:second.id+'.candidates.ndjson.gz',releaseTag:initial.releaseTagPrefix}),/out-of-order/);
 const one=addPublishedReceipt(plan,initial,receiptFor(first),{
  assetName:first.id+'.candidates.ndjson.gz',releaseTag:initial.releaseTagPrefix});
 assert.equal(one.coverage.completedBatches,1);
 assert.equal(one.coverage.completedOwnedBases,first.ownedBases);
 assert.equal(one.coverage.candidateCountVerified,2);
 assert.equal(nextCampaignBatch(plan,one).id,second.id);
 assert.equal(auditCampaignIndex(plan,one).completedBatches,1);
 const two=addPublishedReceipt(plan,one,receiptFor(second),{
  assetName:second.id+'.candidates.ndjson.gz',releaseTag:initial.releaseTagPrefix});
 assert.equal(two.coverage.completedBatches,2);
 assert.equal(two.coverage.candidateCountVerified,4);
 assert.equal(two.status,'INCOMPLETE');
});
test('published receipt remains idempotent under honest re-run but refuses silent data substitution',()=>{
 const init=makeCampaignIndex(plan,{sourceFastaSha256:sourceHash,kind:'SYNTHETIC_TEST_FIXTURE'});
 const b=plan.batches[0],receipt=receiptFor(b);
 const one=addPublishedReceipt(plan,init,receipt,{
  assetName:b.id+'.candidates.ndjson.gz',releaseTag:init.releaseTagPrefix});
 assert.equal(addPublishedReceipt(plan,one,{...receipt,createdAt:'2026-03-01T00:00:00Z'},{
  assetName:b.id+'.candidates.ndjson.gz',releaseTag:init.releaseTagPrefix}),one);
 assert.throws(()=>addPublishedReceipt(plan,one,{...receipt,compressedCandidateSha256:h('tampered')},{
  assetName:b.id+'.candidates.ndjson.gz',releaseTag:init.releaseTagPrefix}),/Refuse replacement/);
 const corrupted=structuredClone(one);corrupted.receipts[0].compressedCandidateAssetName='../bad.gz';
 assert.throws(()=>auditCampaignIndex(plan,corrupted),/unauditable/);
});
test('no scientific status, track, candidate count or scope can be self-certified by editing the JSON ledger',()=>{
 const init=makeCampaignIndex(plan,{sourceFastaSha256:sourceHash,kind:'SYNTHETIC_TEST_FIXTURE'});
 const b=plan.batches[0];
 const one=addPublishedReceipt(plan,init,receiptFor(b),{
  assetName:b.id+'.candidates.ndjson.gz',releaseTag:init.releaseTagPrefix});
 for(const [path,value] of [['status','COMPLETE'],['sourcePlanSha256',h('other plan')],
   ['scientificStatus','PHYSICAL_BSNG_BINDING_CONFIRMED']]){
  const x=structuredClone(one);x[path]=value;
  assert.throws(()=>auditCampaignIndex(plan,x));
 }
 const changed=structuredClone(one);changed.coverage.completedBatches=plan.totalBatches;
 assert.throws(()=>auditCampaignIndex(plan,changed),/coverage/);
 const wrong=receiptFor(plan.batches[1]);wrong.actualBsngBinding='VERIFIED';
 assert.throws(()=>addPublishedReceipt(plan,one,wrong,{
  assetName:plan.batches[1].id+'.candidates.ndjson.gz',
  releaseTag:one.releaseTagPrefix}),/unsupported\/unmatched/);
});
