/**
 * AUTHENTIC REFERENCE MODE: stateless-per-GitHub-run adapter for the v0.8
 * NCBI GRCh38.p14 RefSeq 3-track campaign. Requires full validated FASTA.
 *
 * Uses one batch per runner; stores compressed candidates as Release assets
 * and commits only small, audited JSON receipts to a separate Git branch.
 * Neither GitHub cache nor temporary CI artifacts count as durable evidence.
 */
import {createHash} from 'node:crypto';
import {mkdir,readFile,rename,stat,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {loadFai,verifyReferenceFai,withIndexedFasta}
 from '../src/lib/whole-assembly-fasta.mjs';
import {hashFile} from '../src/lib/whole-assembly-source-provenance.mjs';
import {scanCtcfBatch,verifyBatchArtifacts}
 from '../src/lib/whole-assembly-ctcf-batch.mjs';
import {makeCampaignIndex,auditCampaignIndex,nextCampaignBatch,
 addPublishedReceipt,candidateReleaseTag} from '../src/lib/github-campaign-state.mjs';
import {verifyPlan} from '../src/lib/whole-assembly-manifest.mjs';

const mode=process.argv[2],root=process.env.BSNG_CAMPAIGN_DIR||'/tmp/bsng-v09-real-source';
const registry=process.env.BSNG_CHECKPOINT_WORKTREE,output=process.env.BSNG_LOCAL_OUTPUT||'/tmp/bsng-v09-real-output';
const scoped=registry?join(registry,'grch38p14-natural-ctcf-v09'):null;
if(!scoped||!mode)throw Error('Require mode and BSNG_CHECKPOINT_WORKTREE');
const plan=JSON.parse(await readFile(join(root,'whole-assembly-plan.json'),'utf8'));
const freeze=JSON.parse(await readFile(join(root,'reference-fasta-freeze.json'),'utf8'));
verifyPlan(plan);
if(freeze.status!=='FASTA_SOURCE_VERIFIED_LOCALLY_NOT_YET_GENOME_SCANNED'||
 freeze.assemblyPlanSha256!==plan.planSha256||
 freeze.refseqAssemblyAccession!==plan.refseqAssemblyAccession||
 !/^[a-f0-9]{64}$/.test(freeze.fullUncompressedFastaSha256)||
 !/^[a-f0-9]{32}$/.test(freeze.officialNcbiCompressedMd5))
 throw Error('Refusing unverified GRCh38.p14 FASTA in new GitHub cloud job');
const sourceSha=freeze.fullUncompressedFastaSha256;
const codeCommit=process.env.BSNG_CODE_REVISION||process.env.GITHUB_SHA;
if(!/^[a-f0-9]{40}$/.test(codeCommit||''))throw Error('Must pin immutable exact scientific code commit SHA');
const fasta=process.env.BSNG_REFSEQ_FASTA||join(root,'GCF_000001405.40_GRCh38.p14_genomic.fna');
const fai=process.env.BSNG_REFSEQ_FAI||fasta+'.fai';
const j=async p=>JSON.parse(await readFile(p,'utf8'));
async function atomic(path,data){
 const tmp=path+'.partial-'+process.pid;await writeFile(tmp,JSON.stringify(data,null,2)+'\n');await rename(tmp,path);
}
async function out(values){
 if(process.env.GITHUB_OUTPUT){
  const {appendFile}=await import('node:fs/promises');
  await appendFile(process.env.GITHUB_OUTPUT,Object.entries(values).map(([k,v])=>k+'='+String(v)+'\n').join(''));
 }
 console.log(JSON.stringify(values));
}
async function idx(){
 const index=await j(join(scoped,'index.json'));
 auditCampaignIndex(plan,index);
 if(index.sourceCodeCommit!==codeCommit)
  throw Error('Frozen scientific code revision has changed; do not silently combine different model implementations');
 if(index.campaignType!=='REAL_REFERENCE')throw Error('Cannot use synthetic data in real reference campaign');
 if(index.sourceFastaSha256!==sourceSha)throw Error('Source reference differs from stored original');
 return index;
}
if(mode==='init'){
 await mkdir(scoped,{recursive:true});
 let index;
 try{index=await idx()}catch(err){
  if(err.code!=='ENOENT')throw err;
  index=makeCampaignIndex(plan,{sourceFastaSha256:sourceSha,kind:'REAL_REFERENCE',codeCommit});
  await atomic(join(scoped,'plan.json'),plan);
  await atomic(join(scoped,'source-freeze.json'),freeze);
  await atomic(join(scoped,'index.json'),index);
 }
 const lockedPlan=await j(join(scoped,'plan.json'));
 const lockedSource=await j(join(scoped,'source-freeze.json'));
 if(lockedPlan.planSha256!==plan.planSha256||
   lockedSource.fullUncompressedFastaSha256!==sourceSha||
   lockedSource.officialNcbiCompressedMd5!==freeze.officialNcbiCompressedMd5)
  throw Error('Immutable source freeze or plan modified across GitHub jobs');
 await out({campaign_id:index.id,source_sha256:sourceSha,completed_batches:index.coverage.completedBatches,
  total_batches:plan.totalBatches,scope_status:index.status});
}else if(mode==='next'){
 const index=await idx(),next=nextCampaignBatch(plan,index);
 await out({next_batch_id:next?.id||'',release_tag:next?candidateReleaseTag(plan,index,next.id):'',
  completed_batches:index.coverage.completedBatches,
  scope_status:index.status,remaining_batches:plan.totalBatches-index.coverage.completedBatches,
  next_batch_refseq_accession:next?.refseqAccession||''});
}else if(mode==='scan'){
 const index=await idx();
 if(process.env.BSNG_REAL_REFERENCE_PILOT_ACK!=='TRUE')throw Error('Authenticated real-reference pilot acknowledgment required');
 const batchId=process.env.BSNG_BATCH_ID,next=nextCampaignBatch(plan,index);
 if(!next||next.id!==batchId)throw Error('Batch ID differs from checkpointed next genomic interval');
 const actualSha=await hashFile(fasta,'sha256');
 if(actualSha!==sourceSha)throw Error('This GitHub runner reference FASTA differs from pinned original SHA256');
 const reference=await loadFai(fai);
 verifyReferenceFai(plan,reference);
 await mkdir(output,{recursive:true});
 const report=await withIndexedFasta(fasta,async fh=>scanCtcfBatch({
  fh,fai:reference,batch:next,outputDir:output,
  planSha256:plan.planSha256,sourceFastaSha256:sourceSha,readBases:250000
 }));
 const archive=join(output,report.candidateArchiveFile);
 const size=(await stat(archive)).size;
 if(size>=2_000_000_000)throw Error('Candidate asset exceeds GitHub release file limit; needs sharding within batch');
 await out({batch_id:report.batchId,release_tag:candidateReleaseTag(plan,index,batchId),
  archive_name:report.candidateArchiveFile,archive_bytes:size,
  archive_sha256:report.compressedCandidateSha256,candidate_count:report.qualifyingCandidateCount,
  scanned_owned_bases:report.ownedBases,scientific_status:report.scientificStatus});
}else if(mode==='promote'){
 if(process.env.BSNG_RELEASE_ASSET_VERIFIED!=='TRUE')throw Error('Remote GitHub release candidate archive SHA256 not re-downloaded and verified');
 const index=await idx(),batchId=process.env.BSNG_BATCH_ID,next=nextCampaignBatch(plan,index);
 if(next?.id!==batchId)throw Error('Cross-run promotion must exactly match next pending batch');
 const receipt=await verifyBatchArtifacts(output,next);
 const releaseTag=candidateReleaseTag(plan,index,batchId);
 const promoted=addPublishedReceipt(plan,index,receipt,{
  releaseTag,assetName:receipt.candidateArchiveFile,sourceCommit:codeCommit
 });
 await mkdir(join(scoped,'receipts'),{recursive:true});
 await atomic(join(scoped,'receipts',batchId+'.json'),promoted.receipts.at(-1));
 await atomic(join(scoped,'index.json'),promoted);
 await out({stored_batch_id:batchId,stored_owned_bases:promoted.coverage.completedOwnedBases,
  stored_batches:promoted.coverage.completedBatches,total_batches:plan.totalBatches,
  scope_status:promoted.coverage.status,archived_candidates:promoted.coverage.candidateCountVerified});
}else if(mode==='audit'){
 const index=await idx(),receipts=index.receipts;
 for(const receipt of receipts){
  const persisted=await j(join(scoped,'receipts',receipt.batchId+'.json'));
  if(JSON.stringify(persisted)!==JSON.stringify(receipt))throw Error('Stored JSON receipt/index discrepancy');
 }
 await out({stored_batches:index.coverage.completedBatches,planned_batches:plan.totalBatches,
  total_verified_bases:index.coverage.completedOwnedBases,
  archived_candidates:index.coverage.candidateCountVerified,
  coverage_status:index.coverage.status,
  remaining_genbank_only_bases:index.coverage.excludedGenbankOnlyBases,
  latest_batch:receipts.at(-1)?.batchId||'',
  latest_asset_sha256:receipts.at(-1)?.compressedCandidateSha256||'',
  latest_asset_release_tag:receipts.at(-1)?.compressedCandidateReleaseTag||''});
}else throw Error('Expected init, next, scan, promote or audit');
