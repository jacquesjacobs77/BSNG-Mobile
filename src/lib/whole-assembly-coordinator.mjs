/**
 * Local durable genomic campaign coordinator. Requires persistent disk (NOT
 * ephemeral GitHub Actions checkout) and an externally checksum-verified
 * official RefSeq GRCh38.p14 FASTA. No AI or wet-lab action.
 */
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir,readFile,writeFile,rename,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {verifyPlan} from './whole-assembly-manifest.mjs';
import {loadFai,verifyReferenceFai,withIndexedFasta} from './whole-assembly-fasta.mjs';
import {CTCF_SCREEN_POLICY,verifyBatchArtifacts,scanCtcfBatch} from './whole-assembly-ctcf-batch.mjs';
const sha256Stream=async path=>{
 const h=createHash('sha256');
 for await(const chunk of createReadStream(path))h.update(chunk);
 return h.digest('hex');
};
async function exists(path){try{await stat(path);return true;}catch(err){if(err.code==='ENOENT')return false;throw err;}}
async function atomicJson(path,data){
 const tmp=path+'.tmp';
 await writeFile(tmp,JSON.stringify(data,null,2)+'\n',{flag:'w'});
 await rename(tmp,path);
}
export function campaignCoverage(plan,receipts){
 verifyPlan(plan);
 const stored=new Set(receipts.map(x=>x.batchId));
 if(stored.size!==receipts.length)throw Error('Duplicate verified receipts');
 const counts={},expected={};
 for(const [k,v] of Object.entries(plan.trackTotals)){
   expected[k]=v;
   counts[k]={completedBatches:0,totalBatches:v.batches,completedOwnedBases:0,
     totalOwnedBases:v.bases,coveredFraction:0};
 }
 const batchIds=new Set(plan.batches.map(x=>x.id));
 const expectedById=new Map(plan.batches.map(x=>[x.id,x]));
 for(const receipt of receipts){
  if(!batchIds.has(receipt.batchId))throw Error('Receipt not in assembly plan');
  const batch=expectedById.get(receipt.batchId),t=counts[batch.track];
  if(receipt.planSha256!==plan.planSha256||receipt.ownedBases!==batch.ownedBases||
     receipt.contig!==batch.refseqAccession||
     receipt.validWindows+receipt.ambiguousWindows+receipt.terminalUnscorableStarts!==batch.ownedBases)
    throw Error('Receipt does not prove assigned genomic-start coverage');
  t.completedOwnedBases+=batch.ownedBases;t.completedBatches++;
 }
 for(const t of Object.values(counts))t.coveredFraction=t.totalOwnedBases===0?1:t.completedOwnedBases/t.totalOwnedBases;
 const completedBatches=stored.size,allComplete=completedBatches===plan.totalBatches;
 return {status:allComplete?'COMPLETE':'INCOMPLETE',
  completedBatches,totalBatches:plan.totalBatches,
  completedOwnedBases:Object.values(counts).reduce((n,x)=>n+x.completedOwnedBases,0),
  totalOwnedBases:plan.totalOwnedBases,coverageByTrack:counts,
  overallFraction:allComplete?1:Object.values(counts).reduce((n,x)=>n+x.completedOwnedBases,0)/plan.totalOwnedBases,
  candidateCountVerified:receipts.reduce((n,x)=>n+x.qualifyingCandidateCount,0),
  bsngPhysicalBindingStatus:'NOT_ASSESSABLE',
  excludedFromCompleteness:'FASTA may contain N; genomic-start coordinates are still explicitly accounted for'};
}
export async function runWholeGenomeCampaign({
 plan,referenceFasta,referenceFai,expectedFastaSha256,outputDir,
 maxBatches=1,readBases=250000,onBatchCompleted
}){
 verifyPlan(plan);
 if(!/^[a-f0-9]{64}$/.test(expectedFastaSha256))
  throw Error('Require pinned, independently sourced full FASTA SHA-256');
 if(!Number.isSafeInteger(maxBatches)||maxBatches<1)throw Error('Explicit positive batch budget required');
 if(!outputDir||!referenceFasta||!referenceFai)throw Error('Durable storage and reference FASTA/FAI required');
 await mkdir(outputDir,{recursive:true});
 const receiptDir=join(outputDir,'receipts');
 await mkdir(receiptDir,{recursive:true});
 // Refuse concurrent writers: directory creation is atomic on one POSIX filesystem.
 const lockDir=join(outputDir,'.active-writer-lock');
 try{await mkdir(lockDir)}catch(e){if(e.code==='EEXIST')throw Error('Campaign already has an active writer; do not run concurrent scanners');throw e}
 try{
  const actualFastaSha256=await sha256Stream(referenceFasta);
  if(actualFastaSha256!==expectedFastaSha256)throw Error('Reference FASTA does not match pinned source SHA-256');
  const fai=await loadFai(referenceFai);
  verifyReferenceFai(plan,fai,{complete:true});
  const ledgerFile=join(outputDir,'campaign-ledger.json');
  let previous=null;
  if(await exists(ledgerFile)){
   previous=JSON.parse(await readFile(ledgerFile,'utf8'));
   if(previous.planSha256!==plan.planSha256||previous.expectedFastaSha256!==expectedFastaSha256||
      previous.modelPfmSha256!==CTCF_SCREEN_POLICY.modelPfmSha256)
    throw Error('Existing campaign has a different frozen model, source, or plan');
  }
  const receipts=[];
  for(const batch of plan.batches){
   if(await exists(join(receiptDir,batch.id+'.json'))){
    const receipt=await verifyBatchArtifacts(receiptDir,batch);
    if(receipt.planSha256!==plan.planSha256||receipt.sourceFastaSha256!==expectedFastaSha256)
     throw Error('Receipt references another assembly/source');
    receipts.push(receipt);
   }
  }
  if(previous && previous.completedBatchIds.some(id=>!receipts.find(x=>x.batchId===id)))
    throw Error('Previously verified batch artifact missing/corrupted; refused to conceal data loss');
  const newReceipts=[];
  const done=new Set(receipts.map(x=>x.batchId));
  await withIndexedFasta(referenceFasta,async fh=>{
   for(const batch of plan.batches){
    if(done.has(batch.id))continue;
    if(newReceipts.length===maxBatches)break;
    // Never mark as complete before the compressed candidate partition
    // and receipt have both been persisted and checksum-verified.
    const receipt=await scanCtcfBatch({fh,fai,batch,outputDir:receiptDir,
      planSha256:plan.planSha256,sourceFastaSha256:expectedFastaSha256,readBases});
    receipts.push(receipt);newReceipts.push(receipt);done.add(batch.id);
    const coverage=campaignCoverage(plan,receipts);
    const ledger={
     schemaVersion:1,planSha256:plan.planSha256,
     refseqAssemblyAccession:plan.refseqAssemblyAccession,
     expectedFastaSha256,modelPfmSha256:CTCF_SCREEN_POLICY.modelPfmSha256,
     qualificationPolicy:CTCF_SCREEN_POLICY,
     updatedAt:new Date().toISOString(),
     completedBatchIds:plan.batches.filter(x=>done.has(x.id)).map(x=>x.id),
     coverage,
     candidateArtifacts:'receipts/*.candidates.ndjson.gz',
     note:'This is a repeatable natural CTCF reference computation. NOT physical BSNG binding, integration or safety.',
    };
    await atomicJson(ledgerFile,ledger);
    if(onBatchCompleted)await onBatchCompleted({batch,receipt,coverage});
   }
  });
  const coverage=campaignCoverage(plan,receipts);
  if(!(await exists(ledgerFile))){
   await atomicJson(ledgerFile,{
    schemaVersion:1,planSha256:plan.planSha256,
    refseqAssemblyAccession:plan.refseqAssemblyAccession,
    expectedFastaSha256,modelPfmSha256:CTCF_SCREEN_POLICY.modelPfmSha256,
    qualificationPolicy:CTCF_SCREEN_POLICY,
    completedBatchIds:plan.batches.filter(x=>done.has(x.id)).map(x=>x.id),
    updatedAt:new Date().toISOString(),coverage,
    note:'Natural CTCF model evidence only, not BSNG molecular measurement',
   });
  }
  return {coverage,completedThisInvocation:newReceipts.length,
   nextBatchId:plan.batches.find(x=>!done.has(x.id))?.id||null};
 }finally{
  // Only the process that successfully acquired the lock reaches this finally.
  const {rm}=await import('node:fs/promises');
  await rm(lockDir,{recursive:true,force:true});
 }
}
