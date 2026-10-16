/**
 * Cross-run research state for ephemeral GitHub Actions runners.
 * Candidate archives live as checksum-verifiable GitHub Release assets.
 * Only after asset upload+download verification is a compact receipt
 * committed to a dedicated git branch. No unsigned AI assertions.
 */
import {createHash} from 'node:crypto';
import {CTCF_SCREEN_POLICY} from './whole-assembly-ctcf-batch.mjs';
import {verifyPlan} from './whole-assembly-manifest.mjs';
import {campaignCoverage} from './whole-assembly-coordinator.mjs';
const sha256=x=>createHash('sha256').update(x).digest('hex');
const safe=/^[a-f0-9]{64}$/;
export function makeCampaignIndex(plan,{sourceFastaSha256,kind='REAL_REFERENCE',codeCommit='UNSPECIFIED'}={}){
 verifyPlan(plan);
 if(!safe.test(sourceFastaSha256))throw Error('Frozen reference SHA256 required');
 if(!['REAL_REFERENCE','SYNTHETIC_TEST_FIXTURE'].includes(kind))throw Error('Unknown data source class');
 const campaignId=sha256(JSON.stringify({plan:plan.planSha256,source:sourceFastaSha256,
    model:CTCF_SCREEN_POLICY.modelPfmSha256,threshold:CTCF_SCREEN_POLICY.exploratoryThresholdLog2Odds,kind})).slice(0,20);
 return {schemaVersion:1,
  id:campaignId,
  campaignType:kind,
  assembly:plan.assembly,
  sourcePlanSha256:plan.planSha256,
  sourceFastaSha256,
  modelPfmSha256:CTCF_SCREEN_POLICY.modelPfmSha256,
  naturalCtcfThresholdLog2Odds:CTCF_SCREEN_POLICY.exploratoryThresholdLog2Odds,
  scientificStatus:kind==='SYNTHETIC_TEST_FIXTURE'?'SYNTHETIC_WORKFLOW_TEST_NOT_REAL_HUMAN_DATA':
     'NATURAL_CTCF_REFERENCE_COMPUTATION_NOT_BSNG_BINDING',
  sourceCodeCommit:codeCommit,
  releaseTagPrefix:'bsng-v09-'+(kind==='SYNTHETIC_TEST_FIXTURE'?'fixture':'grch38')+'-'+campaignId,
  receipts:[],
  coverage:campaignCoverage(plan,[]),
  status:'NOT_STARTED',
  operationalWarnings:['GitHub workflow cache is disposable; original FASTA must be verified on each newly built source cache.',
    'GitHub Release assets are versioned research artifacts, not a transactional genomic database.',
    'No BSNG nanite physical binding or genomic insertion safety is measured.']
 };
}
/** At most 100 real candidate assets per GitHub Release, preventing 1000+ assets on one release. */
export function candidateReleaseTag(plan,index,batchId){
 const i=plan.batches.findIndex(x=>x.id===batchId);
 if(i<0)throw Error('No such genome batch for release sharding');
 if(index.campaignType==='SYNTHETIC_TEST_FIXTURE')return index.releaseTagPrefix;
 return index.releaseTagPrefix+'-shard-'+String(Math.floor(i/100)).padStart(3,'0');
}
export function auditCampaignIndex(plan,index){
 verifyPlan(plan);
 if(index?.schemaVersion!==1||!safe.test(index.sourceFastaSha256)||
    !/^[a-f0-9]{20}$/.test(index.id)||!Array.isArray(index.receipts))
   throw Error('Invalid GitHub campaign index');
 const expected=makeCampaignIndex(plan,{
  sourceFastaSha256:index.sourceFastaSha256,kind:index.campaignType,
  codeCommit:index.sourceCodeCommit
 });
 for(const k of ['id','sourcePlanSha256','sourceFastaSha256','modelPfmSha256',
   'releaseTagPrefix','scientificStatus']){
  if(index[k]!==expected[k])throw Error('Campaign identity changed: '+k);
 }
 const knownIds=new Map(plan.batches.map(x=>[x.id,x]));
 const unique=new Set();
 const receipts=[];
 for(const row of index.receipts){
  if(unique.has(row.batchId))throw Error('Duplicate durable candidate receipt');
  unique.add(row.batchId);
  const b=knownIds.get(row.batchId);
  if(!b||row.batchId!==b.id||row.track!==b.track||
      row.contig!==b.refseqAccession||
      row.start1BasedInclusive!==b.start1BasedInclusive||
      row.end1BasedInclusive!==b.end1BasedInclusive||
      row.ownedBases!==b.ownedBases||
      row.planSha256!==index.sourcePlanSha256||
      row.sourceFastaSha256!==index.sourceFastaSha256||
      row.modelPfmSha256!==index.modelPfmSha256||
      row.status!=='VERIFIED_STORED'||
      !safe.test(row.compressedCandidateSha256)||
      !safe.test(row.uncompressedCandidateNdjsonSha256)||
      row.compressedCandidateReleaseTag!==candidateReleaseTag(plan,index,row.batchId)||
      row.compressedCandidateAssetName!==row.batchId+'.candidates.ndjson.gz'||
      !Number.isSafeInteger(row.qualifyingCandidateCount)||row.qualifyingCandidateCount<0)
     throw Error('Invalid or unauditable GitHub candidate archive receipt '+row.batchId);
  receipts.push(row);
 }
 const coverage=campaignCoverage(plan,receipts);
 if(index.coverage.completedBatches!==coverage.completedBatches||
    index.coverage.candidateCountVerified!==coverage.candidateCountVerified||
    index.coverage.completedOwnedBases!==coverage.completedOwnedBases||
    index.coverage.status!==coverage.status)
   throw Error('Published index understates/overstates verified coverage');
 if(index.status!=='NOT_STARTED'&&index.status!==coverage.status)
   throw Error('Published index claims unsupported completion');
 if(index.status==='NOT_STARTED'&&receipts.length>0)
   throw Error('Started campaign must not say NOT_STARTED');
 return coverage;
}
export function nextCampaignBatch(plan,index){
 auditCampaignIndex(plan,index);
 const existing=new Set(index.receipts.map(r=>r.batchId));
 return plan.batches.find(x=>!existing.has(x.id))||null;
}
export function addPublishedReceipt(plan,index,receipt,{assetName,releaseTag,sourceCommit}){
 auditCampaignIndex(plan,index);
 if(!receipt||!assetName||!releaseTag||
    !/^B\d{6,}$/.test(receipt.batchId))throw Error('Invalid candidate promotion inputs');
 const before=index.receipts.find(r=>r.batchId===receipt.batchId);
 if(before){
  // A retry may re-create the same genome result at a different wall clock
  // time. Only byte-identical *candidate archives* and the frozen scientific
  // receipt fields may be treated as already published.
  for(const key of ['compressedCandidateSha256','uncompressedCandidateNdjsonSha256',
    'ownedReferenceUppercaseSha256','qualifyingCandidateCount','planSha256',
    'sourceFastaSha256','modelPfmSha256','start1BasedInclusive',
    'end1BasedInclusive','refseqAssemblyAccession']){
    if(before[key]!==receipt[key])throw Error('Refuse replacement of already published scientific receipt: '+key);
  }
  if(before.compressedCandidateAssetName!==assetName||
    before.compressedCandidateReleaseTag!==releaseTag)
    throw Error('Refuse replacement with another release asset identity');
  return index;
 }
 const expected=nextCampaignBatch(plan,index);
 if(expected?.id!==receipt.batchId)throw Error('Refuse out-of-order checkpoint publication; expected '+expected?.id);
 if(receipt.status!=='VERIFIED_STORED'||receipt.planSha256!==index.sourcePlanSha256||
    receipt.sourceFastaSha256!==index.sourceFastaSha256||
    receipt.modelPfmSha256!==index.modelPfmSha256||
    receipt.refseqAssemblyAccession!==plan.refseqAssemblyAccession||
    receipt.ownedBases!==expected.ownedBases||
    receipt.contig!==expected.refseqAccession||
    receipt.start1BasedInclusive!==expected.start1BasedInclusive||
    receipt.end1BasedInclusive!==expected.end1BasedInclusive||
    receipt.track!==expected.track||
    receipt.validWindows+receipt.ambiguousWindows+receipt.terminalUnscorableStarts!==expected.ownedBases||
    receipt.actualBsngBinding!=='NOT_ASSESSABLE'||receipt.actualGenomicIntegration!=='NOT_ASSESSABLE'||
    assetName!==expected.id+'.candidates.ndjson.gz'||releaseTag!==candidateReleaseTag(plan,index,expected.id))
   throw Error('Refuse to publish unsupported/unmatched science receipt');
 const promoted={...receipt,
  compressedCandidateAssetName:assetName,
  compressedCandidateReleaseTag:releaseTag,
  publishedAt:new Date().toISOString(),
  sourceCommit:sourceCommit||index.sourceCodeCommit
 };
 const next={...index,receipts:[...index.receipts,promoted]};
 next.coverage=campaignCoverage(plan,next.receipts);
 next.status=next.coverage.status;
 next.updatedAt=new Date().toISOString();
 // An immutable fixture must not be exposed as authentic human reference data.
 auditCampaignIndex(plan,next);
 return next;
}
