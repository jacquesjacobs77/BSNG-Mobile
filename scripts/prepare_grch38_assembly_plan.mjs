/**
 * Freeze the OFFICIAL NCBI GRCh38.p14 assembly report and generate the
 * three-track genome scan plan. This step DOES NOT fetch or scan the 3GB FASTA.
 */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {ASSEMBLY_REPORT_URL,parseAssemblyReport,planWholeAssembly,verifyPlan}
 from '../src/lib/whole-assembly-manifest.mjs';
const outDir=process.env.BSNG_CAMPAIGN_DIR||'artifacts/bsng-grch38-p14-campaign';
const inputPath=process.env.BSNG_ASSEMBLY_REPORT_PATH;
await mkdir(outDir,{recursive:true});
let source;
if(inputPath){
 source=await readFile(inputPath,'utf8');
}else{
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),90000);
 try{
  const response=await fetch(ASSEMBLY_REPORT_URL,{signal:controller.signal});
  if(!response.ok)throw Error('NCBI assembly report download returned HTTP '+response.status);
  source=await response.text();
 }finally{clearTimeout(timeout)}
}
const parsed=parseAssemblyReport(source);
const plan=planWholeAssembly(parsed,{maxBases:Number(process.env.BSNG_BATCH_OWNED_BASES||10_000_000)});
verifyPlan(plan);
await writeFile(join(outDir,'GCF_000001405.40_GRCh38.p14_assembly_report.txt'),source);
await writeFile(join(outDir,'whole-assembly-plan.json'),JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({
 event:'GRCH38_P14_WHOLE_ASSEMBLY_PLAN_CREATED_NOT_YET_SCANNED',
 assembly:plan.refseqAssemblyAccession,sourceSha256:plan.assemblyReportSha256,
 planSha256:plan.planSha256,totalSequences:plan.totalSequences,
 totalOwnedBases:plan.totalOwnedBases,totalBatches:plan.totalBatches,
 tracks:plan.trackTotals,output:outDir
},null,2));
