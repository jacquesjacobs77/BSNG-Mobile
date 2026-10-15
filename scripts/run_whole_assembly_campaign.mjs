/**
 * Operate the persistent-disk continuous genome campaign.
 * Precondition: official UNCOMPRESSED GRCh38.p14 RefSeq genome FASTA and
 * its EXACT samtools .fai; pinned authoritative source FASTA SHA-256.
 * Default runs ONE batch, --all requires the caller to allocate durable
 * storage/time/budget and to supervise this long operation.
 */
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {runWholeGenomeCampaign} from '../src/lib/whole-assembly-coordinator.mjs';
import {verifyPlan} from '../src/lib/whole-assembly-manifest.mjs';
const dir=process.env.BSNG_CAMPAIGN_DIR||'artifacts/bsng-grch38-p14-campaign';
const plan=JSON.parse(await readFile(join(dir,'whole-assembly-plan.json'),'utf8'));
verifyPlan(plan);
const input=process.env.BSNG_REFSEQ_FASTA,idx=process.env.BSNG_REFSEQ_FAI;
const freeze=JSON.parse(await readFile(join(dir,'reference-fasta-freeze.json'),'utf8'));
if(freeze.status!=='FASTA_SOURCE_VERIFIED_LOCALLY_NOT_YET_GENOME_SCANNED'||
   freeze.assemblyPlanSha256!==plan.planSha256||
   !/^[a-f0-9]{64}$/.test(freeze.fullUncompressedFastaSha256))
 throw Error('Refusing unverified or mismatched official RefSeq FASTA');
const expected=freeze.fullUncompressedFastaSha256;
if(process.env.BSNG_EXPECTED_FASTA_SHA256&&process.env.BSNG_EXPECTED_FASTA_SHA256!==expected)
 throw Error('Optional explicit FASTA SHA-256 disagrees with official verified frozen source');
const budget=process.env.BSNG_BATCH_BUDGET||'1';
const maxBatches=budget==='all'?plan.totalBatches:Number(budget);
const outputDir=process.env.BSNG_RESEARCH_STORAGE_DIR||join(dir,'research-records');
const report=await runWholeGenomeCampaign({
 plan,referenceFasta:input,referenceFai:idx,expectedFastaSha256:expected,
 maxBatches,outputDir,
 onBatchCompleted:({batch,receipt,coverage})=>console.log(JSON.stringify({
  event:'VERIFIED_BATCH_STORED',id:batch.id,track:batch.track,
  accession:batch.refseqAccession,ownedBases:batch.ownedBases,
  naturalCtcfQualifyingMotifs:receipt.qualifyingCandidateCount,
  campaignCompletion:coverage.completedBatches+'/'+coverage.totalBatches,
  scopeComplete:coverage.status==='COMPLETE'
 }))
});
console.log(JSON.stringify({event:'WHOLE_ASSEMBLY_CAMPAIGN_CHECKPOINT',
 status:report.coverage.status,completedThisInvocation:report.completedThisInvocation,
 nextBatchId:report.nextBatchId,coverage:report.coverage},null,2));
