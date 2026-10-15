/**
 * After a verified public-reference run, update durable PUBLIC JSON registry.
 * Called by GitHub Actions with a worktree checked out on research-results-v07.
 * No private genomes or secrets can enter this registry: source is Ensembl GRCh38.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const target=resolve(process.argv[2]||'');
const workspace=resolve(process.argv[3]||'.');
if(!process.argv[2]||!process.argv[3])throw Error('Usage: node scripts/publish_v07_result.mjs WORKTREE WORKSPACE');
const report=JSON.parse(await readFile(join(workspace,'artifacts/BSNG-active-report.json'),'utf8'));
const meta=JSON.parse(await readFile(join(workspace,'artifacts/BSNG-active-index-entry.json'),'utf8'));
if(report.source.type!=='REAL_HUMAN_PUBLIC_REFERENCE'||report.source.assembly!=='GRCh38'||
   report.source.bases<100000||report.source.bases>10000000||
   report.evidence.jointBsngHybridRecognition!=='NOT_ASSESSABLE'||
   report.evidence.genomicIntegrationFeasibility!=='NOT_ASSESSABLE'||
   !/^[a-f0-9]{64}$/.test(report.source.sequenceSha256)||
   report.runId!==meta.runId||!/^\d+-\d+$/.test(meta.runId)||
   report.analysis.naturalProteinMotifScreen.allWindowsAccountedFor!==true||
   report.analysis.naturalProteinMotifScreen.findings.length!==meta.candidateCount){
 throw Error('Refusing to publish incomplete, unsupported or mislabelled research report.');
}
if(!Array.isArray(report.source.chunks)||report.source.chunks.reduce((n,c)=>n+c.bases,0)!==report.source.bases)
 throw Error('Chunk continuity/length mismatch');
const reports=join(target,'reports');
await mkdir(reports,{recursive:true});
await writeFile(join(reports,meta.runId+'.json'),JSON.stringify(report,null,2)+'\n');
let prior={schemaVersion:1,reports:[]};
try{prior=JSON.parse(await readFile(join(target,'index.json'),'utf8'))}catch(err){
 if(err.code!=='ENOENT')throw err;
}
if(prior.schemaVersion!==1||!Array.isArray(prior.reports))throw Error('Invalid existing public report registry.');
const entries=[meta,...prior.reports.filter(x=>x.runId!==meta.runId)].slice(0,100);
const index={
 schemaVersion:1,
 title:'BSNG public human GRCh38 computational research report registry',
 updatedAt:new Date().toISOString(),
 reportCountInIndex:entries.length,
 totalRetainedInGitHistory:'Reports are committed individually, index shows last 100.',
 privacy:'Only public human reference genome, never patient data',
 sourceModel:'Natural human CTCF JASPAR MA0139.1; NOT a physical BSNG nanite',
 researchStatus:'PUBLIC_REFERENCE_COMPUTATION_NOT_BSNG_BINDING_PROOF',
 reports:entries,
};
await writeFile(join(target,'index.json'),JSON.stringify(index,null,2)+'\n');
console.log('PERSISTED RESEARCH HISTORY',meta.runId,meta.assembly,meta.chromosome,
  meta.start,meta.end,meta.candidateCount,'motif candidates; history count',entries.length);
