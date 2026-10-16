/**
 * File-only bridge used by isolated GH Actions runner jobs.
 * Asset uploading/download-verification is done by GH CLI workflow steps;
 * never commit a receipt before its Release asset exists and hashes correctly.
 */
import {createHash} from 'node:crypto';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {loadFai,withIndexedFasta} from '../src/lib/whole-assembly-fasta.mjs';
import {scanCtcfBatch,verifyBatchArtifacts} from '../src/lib/whole-assembly-ctcf-batch.mjs';
import {makeCampaignIndex,auditCampaignIndex,nextCampaignBatch,addPublishedReceipt}
 from '../src/lib/github-campaign-state.mjs';
import {verifyPlan} from '../src/lib/whole-assembly-manifest.mjs';
const mode=process.argv[2];
const root=process.env.BSNG_FIXTURE_ROOT||'/tmp/bsng-v09-handoff-fixture';
const registry=process.env.BSNG_CHECKPOINT_WORKTREE;
const base=process.env.BSNG_LOCAL_OUTPUT||'/tmp/bsng-v09-local-output';
if(!registry)throw Error('BSNG_CHECKPOINT_WORKTREE is required');
const scoped=join(registry,'fixture-v09');
const readJson=async path=>JSON.parse(await readFile(path,'utf8'));
const sha256=x=>createHash('sha256').update(x).digest('hex');
const fastaPath=join(root,'synthetic-reference.fna'),faiPath=fastaPath+'.fai';
const plan=await readJson(join(root,'whole-assembly-plan.json'));
verifyPlan(plan);
const source=await readJson(join(root,'fixture-source.json'));
if(source.type!=='SYNTHETIC_TEST_FIXTURE_NOT_REAL_HUMAN_REFERENCE'||
 source.planSha256!==plan.planSha256||!mode)throw Error('SYNTHETIC fixture required for cross-run handoff test');
async function atomic(path,data){
 const temp=path+'.part-'+process.pid;
 await writeFile(temp,JSON.stringify(data,null,2)+'\n');
 await rename(temp,path);
}
async function getIndex(){
 const index=await readJson(join(scoped,'index.json'));
 auditCampaignIndex(plan,index);
 return index;
}
async function writeOutput(values){
 if(process.env.GITHUB_OUTPUT){
  const {appendFile}=await import('node:fs/promises');
  await appendFile(process.env.GITHUB_OUTPUT,Object.entries(values).map(([k,v])=>k+'='+String(v)+'\n').join(''));
 }
 console.log(JSON.stringify(values));
}
if(mode==='init'){
 await mkdir(scoped,{recursive:true});
 let index;
 try{index=await getIndex();}
 catch(e){
  if(e.code!=='ENOENT')throw e;
  index=makeCampaignIndex(plan,{sourceFastaSha256:source.sourceFastaSha256,
   kind:'SYNTHETIC_TEST_FIXTURE',codeCommit:process.env.GITHUB_SHA||'fixture'});
  await writeFile(join(scoped,'plan.json'),JSON.stringify(plan,null,2)+'\n');
  await atomic(join(scoped,'index.json'),index);
 }
 const previousPlan=await readJson(join(scoped,'plan.json'));
 if(previousPlan.planSha256!==plan.planSha256||index.sourceFastaSha256!==source.sourceFastaSha256)
  throw Error('Cross-job plan/source mismatch');
 await writeOutput({release_tag:index.releaseTagPrefix,campaign_id:index.id,
   completed_batches:index.coverage.completedBatches});
}else if(mode==='next'){
 const index=await getIndex(),next=nextCampaignBatch(plan,index);
 await writeOutput({next_batch_id:next?.id||'',next_batch_contig:next?.refseqAccession||'',
  release_tag:index.releaseTagPrefix,already_completed:index.coverage.completedBatches,
  available_remaining:plan.totalBatches-index.coverage.completedBatches});
}else if(mode==='scan'){
 if(process.env.BSNG_SYNTHETIC_FIXTURE_ACK!=='TRUE')
  throw Error('Synthetic fixture must be explicitly acknowledged');
 const batchId=process.env.BSNG_BATCH_ID,index=await getIndex();
 const next=nextCampaignBatch(plan,index);
 if(next?.id!==batchId)throw Error('Out-of-order or already committed scan: '+batchId);
 const fastaHash=sha256(await readFile(fastaPath));
 if(fastaHash!==index.sourceFastaSha256)throw Error('Synthetic reference data changed across isolated runners');
 const fai=await loadFai(faiPath);
 await mkdir(base,{recursive:true});
 const receipt=await withIndexedFasta(fastaPath,async fh=>scanCtcfBatch({
  fh,fai,batch:next,outputDir:base,planSha256:plan.planSha256,
  sourceFastaSha256:fastaHash,readBases:20
 }));
 await writeOutput({batch_id:receipt.batchId,asset_name:receipt.candidateArchiveFile,
  asset_sha256:receipt.compressedCandidateSha256,
  candidate_count:receipt.qualifyingCandidateCount,mode:'SYNTHETIC_TEST_FIXTURE'});
}else if(mode==='promote'){
 if(process.env.BSNG_RELEASE_ASSET_VERIFIED!=='TRUE')
  throw Error('Promotion refused: release asset was not independently downloaded and hashed');
 const index=await getIndex(),batchId=process.env.BSNG_BATCH_ID;
 if(!/^B\d{6,}$/.test(batchId))throw Error('Invalid batch ID');
 const batch=plan.batches.find(x=>x.id===batchId);
 if(!batch)throw Error('Unexpected batch');
 const report=await verifyBatchArtifacts(base,batch);
 const promoted=addPublishedReceipt(plan,index,report,{
  assetName:batchId+'.candidates.ndjson.gz',
  releaseTag:index.releaseTagPrefix,
  sourceCommit:process.env.GITHUB_SHA||'fixture'
 });
 await mkdir(join(scoped,'receipts'),{recursive:true});
 await atomic(join(scoped,'receipts',batchId+'.json'),promoted.receipts.find(x=>x.batchId===batchId));
 await atomic(join(scoped,'index.json'),promoted);
 await writeOutput({published_batch_id:batchId,completed_batches:promoted.coverage.completedBatches,
  next_batch_id:nextCampaignBatch(plan,promoted)?.id||'',
  coverage_status:promoted.coverage.status});
}else if(mode==='audit'){
 const index=await getIndex();
 const directory=join(scoped,'receipts');
 for(const receipt of index.receipts){
  const saved=await readJson(join(directory,receipt.batchId+'.json'));
  if(JSON.stringify(saved)!==JSON.stringify(receipt))
   throw Error('Git commit receipt/index mismatch '+receipt.batchId);
 }
 await writeOutput({completed_batches:index.coverage.completedBatches,
  total_batches:plan.totalBatches,covered_bases:index.coverage.completedOwnedBases,
  coverage_status:index.coverage.status,all_sequence_real_human:'FALSE',
  previous_asset:index.receipts.at(-1)?.compressedCandidateAssetName||'',
  previous_sha256:index.receipts.at(-1)?.compressedCandidateSha256||'',
  release_tag:index.releaseTagPrefix});
}else throw Error('Unknown mode. Choose init, next, scan, promote, audit');
