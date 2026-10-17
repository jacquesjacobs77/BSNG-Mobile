#!/usr/bin/env node
/**
 * Machine-enforced fixed 10-batch continuation audit for public human
 * GRCh38 reference. Read-only: no raw human sequence or scientific claims
 * are modified. Usage: node scripts/audit_bounded_10_batch.mjs snapshot FILE
 * or count FILE, or step BEFORE_FILE AFTER_FILE.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {TRIAL,auditTenBatchContinuation,assertOneStep}
 from '../src/lib/bounded-10-batch-policy.mjs';
const [action,path1,path2]=process.argv.slice(2);
const load=async p=>JSON.parse(await readFile(p,'utf8'));
if(!path1)throw Error('Missing JSON registry path');
if(action==='snapshot'){
 const record=auditTenBatchContinuation(await load(path1));
 console.log(JSON.stringify(record,null,2));
}else if(action==='count'){
 console.log(auditTenBatchContinuation(await load(path1)).completedBatches);
}else if(action==='step'){
 if(!path2)throw Error('Requires pre-run and post-run registries');
 console.log(JSON.stringify(assertOneStep(await load(path1),await load(path2)),null,2));
}else if(action==='summarize'){
 const i=await load(path1),summary=auditTenBatchContinuation(i);
 const out=process.env.BSNG_TRIAL_AUDIT_JSON;
 const audit={
  ...summary,createdAt:new Date().toISOString(),
  immutableCodeCommit:TRIAL.scientificSourceCommit,
  fullGenomeFastaSha256:TRIAL.fullSourceSha256,
  assemblyPlanSha256:TRIAL.wholeAssemblyPlanSha256,
  referenceScope:'REFSEQ_GCF_000001405.40_GRCH38P14_ONLY',
  allGenomeAssemblyRepresentationsComplete:false,
  trialVerifiedScientificReceipts:i.receipts.slice(3,13).map(r=>({
   batchId:r.batchId,accession:r.contig,start1BasedInclusive:r.start1BasedInclusive,
   end1BasedInclusive:r.end1BasedInclusive,ownedBases:r.ownedBases,
   qualifyingNaturalCtcfWindows:r.qualifyingCandidateCount,
   compressedCandidateAssetName:r.compressedCandidateAssetName,
   compressedCandidateSha256:r.compressedCandidateSha256,
   compressedCandidateReleaseTag:r.compressedCandidateReleaseTag,
   biologicalBinding:'NOT_ASSESSABLE'
  })),
  candidatesAreNotBSNGBinding:true,
  source:(process.env.GITHUB_REPOSITORY||'jacquesjacobs77/BSNG-Mobile'),
 };
 if(out)await writeFile(out,JSON.stringify(audit,null,2)+'\n');
 console.log(JSON.stringify(audit,null,2));
}else throw Error('Unknown audit command');
