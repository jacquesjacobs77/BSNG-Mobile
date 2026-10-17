/**
 * Hard acceptance gate for the fixed 10-batch (B000004..B000013) real-reference
 * continuation, starting from the independently verified first three receipts.
 *
 * Public GRCh38.p14 RefSeq CTCF motif calculations ONLY.
 * The gate protects the scientific audit and refuses a second set of ten.
 */
export const TRIAL = Object.freeze({
  campaignId:'cd19fbf992d9bae65026',
  refseqAssembly:'GRCh38.p14',
  refseqChromosomeOne:'NC_000001.11',
  accession:'GCF_000001405.40',
  scientificSourceCommit:'e91c8d85b0c92d56666383e9e7e3a36d0133d391',
  fullSourceSha256:'df6e4918316e05a9cc1fd29c352841d3678b607d7a436819cd43371b52c814c0',
  wholeAssemblyPlanSha256:'22c67ad85730b19c97725ddf913b41d6749b7169b880a5af6724b64dea513e50',
  startingBatchCount:3,
  maximumAdditionalBatches:10,
  targetBatchCount:13,
  basesPerBatch:10_000_000,
  releaseTag:'bsng-v09-grch38-cd19fbf992d9bae65026-shard-000',
});
const hex64=/^[0-9a-f]{64}$/;
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const fail=(message)=>{throw Error('TEN_BATCH_SAFETY_GATE: '+message)};
export function auditTenBatchContinuation(index,{target=TRIAL.targetBatchCount}={}){
 if(target!==TRIAL.targetBatchCount)fail('Target must be exactly original 3 + next 10');
 if(!index||index.id!==TRIAL.campaignId||index.assembly!==TRIAL.refseqAssembly||
    index.campaignType!=='REAL_REFERENCE'||index.sourceCodeCommit!==TRIAL.scientificSourceCommit||
    index.sourceFastaSha256!==TRIAL.fullSourceSha256||
    index.sourcePlanSha256!==TRIAL.wholeAssemblyPlanSha256||
    index.scientificStatus!=='NATURAL_CTCF_REFERENCE_COMPUTATION_NOT_BSNG_BINDING')
  fail('Frozen study identity, code, genome FASTA or biological evidence status changed');
 const coverage=index.coverage;
 if(!coverage||!Array.isArray(index.receipts)||!integer(coverage.completedBatches)||
    !integer(coverage.totalBatches)||coverage.totalBatches!==1003||
    coverage.completedBatches!==index.receipts.length)
  fail('Missing or incoherent preserved research checkpoint');
 const count=coverage.completedBatches;
 if(count<TRIAL.startingBatchCount||count>target)
  fail('Started before original 3 checkpoints or attempted to overrun trial target');
 let bases=0,findings=0;
 for(let i=0;i<count;i++){
   const r=index.receipts[i];
   const id='B'+String(i+1).padStart(6,'0');
   if(!r||r.batchId!==id||r.contig!==TRIAL.refseqChromosomeOne||
      r.refseqAssemblyAccession!==TRIAL.accession||
      r.track!=='A_CHROMOSOMES'||
      r.start1BasedInclusive!==i*TRIAL.basesPerBatch+1||
      r.end1BasedInclusive!==(i+1)*TRIAL.basesPerBatch||
      r.ownedBases!==TRIAL.basesPerBatch||
      r.sourceFastaSha256!==TRIAL.fullSourceSha256||
      r.planSha256!==TRIAL.wholeAssemblyPlanSha256||
      r.status!=='VERIFIED_STORED'||r.actualBsngBinding!=='NOT_ASSESSABLE'||
      r.actualGenomicIntegration!=='NOT_ASSESSABLE'||
      r.compressedCandidateReleaseTag!==TRIAL.releaseTag||
      r.compressedCandidateAssetName!==id+'.candidates.ndjson.gz'||
      !hex64.test(r.compressedCandidateSha256)||
      !hex64.test(r.uncompressedCandidateNdjsonSha256)||
      !integer(r.qualifyingCandidateCount))
    fail('Missing, duplicate, mutated or mislocated receipt '+id);
   bases+=r.ownedBases;findings+=r.qualifyingCandidateCount;
 }
 if(coverage.completedOwnedBases!==bases||coverage.candidateCountVerified!==findings||
   index.status!=='INCOMPLETE'||coverage.status!=='INCOMPLETE')
  fail('Campaign coverage, archived candidates or incomplete status is inconsistent');
 const original=index.receipts.slice(0,3).map(x=>x.qualifyingCandidateCount);
 if(JSON.stringify(original)!==JSON.stringify([277,211,196]))
  fail('Original independent 30M-base pilot evidence does not match frozen baseline');
 return {
   campaignId:index.id,
   startingBatchCount:TRIAL.startingBatchCount,
   completedBatches:count,
   additionalVerifiedBatches:count-TRIAL.startingBatchCount,
   targetBatchCount:target,
   remainingAllowedBatches:target-count,
   nextBatchId:count<target?'B'+String(count+1).padStart(6,'0'):null,
   completedOwnedBases:bases,
   qualifyingNaturalCtcfWindows:findings,
   trialStatus:count===target?'TARGET_VERIFIED_STOP':'INCOMPLETE_CAN_CONTINUE',
   biologicalInterpretation:'NATURAL_CTCF_MOTIF_PREDICTIONS_NOT_PHYSICAL_BSNG_BINDING',
 };
}
export function assertOneStep(before,after){
 const a=auditTenBatchContinuation(before),b=auditTenBatchContinuation(after);
 if(a.remainingAllowedBatches===0)fail('Trial was already complete before this step');
 if(b.completedBatches!==a.completedBatches+1)
  fail('Each step must advance by EXACTLY one verified, archived batch');
 for(let k=0;k<before.receipts.length;k++){
  const first=before.receipts[k],second=after.receipts[k];
  // Previous frozen scientific receipts must not be replaced or reordered.
  if(JSON.stringify(first)!==JSON.stringify(second))
   fail('Previously archived receipt changed at '+first.batchId);
 }
 return b;
}
