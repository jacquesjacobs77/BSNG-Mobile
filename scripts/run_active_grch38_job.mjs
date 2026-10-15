/**
 * BSNG v0.7 cloud research job — authentic human GRCh38 public reference only.
 * Range is selected in GitHub Actions workflow inputs. No BSNG physical
 * molecular binding, safe integration, gene editing or therapy is assessed.
 */
import {createHash} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGzip} from 'node:zlib';
import {once} from 'node:events';
import {finished} from 'node:stream/promises';
import {createGenomeAccumulator} from '../src/lib/genome-stream.mjs';
import {validateRegion,createCtcfStreamingScreen} from '../src/lib/bsng-active-ctcf-screen.mjs';
import {CTCF_PFM,CTCF_REFERENCE} from '../src/lib/ctcf-reference-model.mjs';

const chromosome=(process.env.BSNG_CHROMOSOME||'X').toUpperCase();
const start=Number(process.env.BSNG_START||1_000_000);
const length=Number(process.env.BSNG_LENGTH||10_000_000);
const region=validateRegion({chromosome,start,length});
const CHUNK_SIZE=500_000;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const sha256=data=>createHash('sha256').update(data).digest('hex');
const accession=(from,to)=>region.chromosome+':'+from+'..'+to+':1';
const runId=process.env.GITHUB_RUN_ID||'local-example';
const attempt=process.env.GITHUB_RUN_ATTEMPT||'1';
const jobId=runId+'-'+attempt;

async function fetchPublicReference(from,to){
 const interval=accession(from,to);
 const url='https://rest.ensembl.org/sequence/region/human/'+interval+'?content-type=application/json';
 for(let attempt=1;attempt<=5;attempt++){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),90000);
  try{
   const response=await fetch(url,{
    headers:{Accept:'application/json','User-Agent':'BSNG-Research-Studio/0.7 (verified public GRCh38 reference)'},
    signal:controller.signal
   });
   if(!response.ok){
    if((response.status===429||response.status>=500)&&attempt<5){
      const retryAfter=Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter)&&retryAfter>0?Math.min(retryAfter*1000,30000):attempt*3000);
      continue;
    }
    throw Error('Ensembl rejected requested region '+interval+' HTTP '+response.status);
   }
   const json=await response.json();
   const expectedPrefix='chromosome:GRCh38:'+region.chromosome+':';
   if(typeof json?.id!=='string'||!json.id.startsWith(expectedPrefix)||
      !json.id.endsWith(':'+from+':'+to+':1')){
     throw Error('Wrong reference genome assembly or coordinates: '+String(json?.id));
   }
   const seq=json.seq;
   if(typeof seq!=='string'||seq.length!==to-from+1||/[^ACGTN]/i.test(seq))
     throw Error('Ensembl sequence length or alphabet inconsistent for '+interval);
   return {sequence:seq.toUpperCase(),id:json.id,url};
  }catch(err){
   if(attempt===5)throw err;
   console.log('Reference retrieval retry '+attempt+': '+String(err).slice(0,160));
   await sleep(attempt*2000);
  }finally{clearTimeout(timer)}
 }
 throw Error('Public reference exhausted retries');
}

await mkdir('artifacts',{recursive:true});
const artifactFasta='artifacts/BSNG-'+jobId+'-GRCh38-reference.fa.gz';
const gzip=createGzip({level:6});
const out=createWriteStream(artifactFasta);
gzip.pipe(out);
gzip.write('>BSNG|Homo_sapiens|GRCh38|chr'+region.chromosome+':'+region.start1BasedInclusive+'-'+region.end1BasedInclusive+'|+\n');
const digest=createHash('sha256');
const gc=createGenomeAccumulator({maxBases:length,topK:5,windowSize:15});
const scan=createCtcfStreamingScreen({regionStart1:region.start1BasedInclusive,topK:20,binSize:1000});
const firstFetchedAt=new Date().toISOString();
const chunks=[];

for(let from=region.start1BasedInclusive;from<=region.end1BasedInclusive;from+=CHUNK_SIZE){
 const to=Math.min(region.end1BasedInclusive,from+CHUNK_SIZE-1);
 const item=await fetchPublicReference(from,to);
 digest.update(item.sequence,'ascii');
 gc.addChunk(item.sequence);
 scan.addChunk(item.sequence);
 chunks.push({
  number:chunks.length+1,chromosome:region.chromosome,
  start1BasedInclusive:from,end1BasedInclusive:to,
  bases:item.sequence.length,sha256:sha256(item.sequence),
  ensemblIdentifier:item.id,sourceUrl:item.url
 });
 for(let n=0;n<item.sequence.length;n+=100){
  if(!gzip.write(item.sequence.slice(n,n+100)+'\n'))await once(gzip,'drain');
 }
 console.log('VERIFIED REAL HUMAN GRCh38',region.chromosome,
   (to-region.start1BasedInclusive+1).toLocaleString('en-US')+'/'+length.toLocaleString('en-US'),'bp');
 await sleep(280);
}
gzip.end();
await finished(out);
const sequenceSha256=digest.digest('hex'),composition=gc.summary(),ctcf=scan.summary();
if(composition.length!==length||ctcf.examinedBases!==length||!ctcf.allWindowsAccountedFor||
   chunks.reduce((s,x)=>s+x.bases,0)!==length)throw Error('Chunk continuity or complete-window accounting failed.');
const modelPfmSha256=sha256(JSON.stringify(CTCF_PFM));
const runUrl=process.env.GITHUB_RUN_ID?
  'https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/'+runId:null;
const results={
 schemaVersion:1,reportType:'BSNG_PUBLIC_HUMAN_REFERENCE_COMPUTATIONAL_RESEARCH_JOB',
 status:'COMPLETED_REFERENCE_ONLY_NOT_PHYSICAL_BSNG_BINDING',
 runId:jobId,
 githubRunId:runId,
 githubRunUrl:runUrl,
 generatedAt:new Date().toISOString(),firstFetchedAt,
 codeCommit:process.env.BSNG_CODE_REVISION||process.env.GITHUB_SHA||'local-uncommitted',
 codeBranch:process.env.BSNG_CODE_BRANCH||process.env.GITHUB_REF_NAME||'local',
 source:{
   type:'REAL_HUMAN_PUBLIC_REFERENCE',organism:'Homo sapiens',
   service:'Ensembl REST',assembly:region.assembly,
   coordinateConvention:'GRCh38 1-based inclusive',
   chromosome:region.chromosome,
   start1BasedInclusive:region.start1BasedInclusive,
   end1BasedInclusive:region.end1BasedInclusive,
   bases:length,sequenceSha256,
   totalChunks:chunks.length,chunkSize:CHUNK_SIZE,chunks,
   compressedFastaArtifact:artifactFasta
 },
 analysis:{
   nucleotideComposition:composition,
   naturalProteinMotifScreen:{
     ...ctcf,
     // Serialize assembly-scoped chromosome in both findings and candidate export.
     // Older immutable reports may contain null here; the app reads the verified source chromosome.
     findings:ctcf.findings.map(s=>({...s,chromosome:'chr'+region.chromosome})),
     candidates:ctcf.findings.map(s=>({
      ...s,chromosome:'chr'+region.chromosome,
      sourceReferenceRegion:'GRCh38 chr'+region.chromosome+':'+s.start1BasedInclusive+'-'+s.end1BasedInclusive,
     })),
     modelPfmSha256,
     measuredCTCFBindingInSelectedRegion:false,
     experimentallyVerifiedBSNGBinding:false,
   }
 },
 evidence:{
   exactReferenceSequenceComputationallyVerified:true,
   naturalProteinModel:'CTCF JASPAR MA0139.1',
   modelAlreadyBenchmarkedAgainstOtherRealHumanChIPSeqData:true,
   independentProteinBenchmark:
    'https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38684724899',
   independentRnaGuidedReferenceBenchmark:
    'https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38688521675',
   physicalBsngRnaModule:'NOT_ASSESSABLE',
   physicalBsngProteinModule:'NOT_ASSESSABLE',
   jointBsngHybridRecognition:'NOT_ASSESSABLE',
   physicalBsngBindingAffinity:'NOT_MEASURED',
   genomicIntegrationFeasibility:'NOT_ASSESSABLE',
   genomicIntegrationSafety:'NOT_MEASURED',
   genomicFeatureAnnotations:'NOT_YET_ASSESSED_FOR_NEW_JOB',
   offTargetGenomeWideAssay:'NOT_PERFORMED',
 },
 interpretation:'Top-ranked matches are natural CTCF recognition-motif score maxima, one per fixed 1000-bp bin; they are NOT predicted BSNG nanite binding sites and NOT safe integration recommendations. Actual BSNG molecular characterization and independently measured recognition are still required.',
 limitations:[
  'True reference DNA, but no experimentally characterized BSNG nanite molecule or RNA-protein recognition model.',
  'CTCF is a natural DNA-binding protein, not part of a constructed BSNG nanite.',
  'High CTCF motif scores are sequence-model predictions, not experimental binding measurements for this newly selected region.',
  'No RNA-guided sequence was specified; RNA-specific candidate coordinates cannot be scored.',
  'Missing genome-wide off-target testing, annotation review, chromatin context and clinical safety evaluation.',
  'This workflow is reproducible computational research, not independent wet-lab replication.',
  'A reported negative or missing candidate must not be replaced with a favorable simulated result.',
 ],
 reproducibility:{
   codeCommit:process.env.BSNG_CODE_REVISION||process.env.GITHUB_SHA||'local-uncommitted',
   protocol:'docs/bsng-v07-active-research-protocol.md',
   requestedSettings:{chromosome:region.chromosome,start:region.start1BasedInclusive,length},
   model:'JASPAR MA0139.1 CTCF',modelPfmSha256,
   hashConvention:'SHA-256 of concatenated uppercase ACGTN reference bytes, no whitespace',
   sourceAccess:'Each Ensembl REST endpoint stored with its GRCh38 chromosome identifier and SHA-256',
   expectedResultsDeterministic:true,
   binSize:1000,
   runUrl,
 }
};
const output='artifacts/BSNG-active-report.json';
await writeFile(output,JSON.stringify(results,null,2)+'\n');
const meta={
 runId:jobId,
 createdAt:results.generatedAt,
 status:'COMPLETED_REFERENCE_ONLY',
 assembly:'GRCh38',chromosome:region.chromosome,
 start:region.start1BasedInclusive,end:region.end1BasedInclusive,bases:length,
 sequenceSha256,model:'Natural CTCF JASPAR MA0139.1',candidateCount:ctcf.findings.length,
 bestModelScore:ctcf.findings[0]?.pwmLog2OddsScore??null,
 githubRunUrl:runUrl,
 reportPath:'reports/'+jobId+'.json',
 physicalBsngBindingStatus:'NOT_ASSESSABLE',
};
await writeFile('artifacts/BSNG-active-index-entry.json',JSON.stringify(meta,null,2)+'\n');
console.log('BSNG REAL GENOMIC ACTIVE JOB COMPLETE',JSON.stringify({
 runId:jobId,region:'GRCh38 chr'+region.chromosome+':'+region.start1BasedInclusive+'-'+region.end1BasedInclusive,
 bases:length,referenceSha256:sequenceSha256,
 candidateCount:ctcf.findings.length,
 topCtcFSite:results.analysis.naturalProteinMotifScreen.candidates[0]??null,
 physicalBsngBindingStatus:'NOT_ASSESSABLE',
 }));
