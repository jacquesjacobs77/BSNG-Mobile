/**
 * Obtain published hg38 GUIDE-seq pipeline test-output coordinates, verify them
 * against GRCh38 Ensembl sequence, and export an auditable example evidence set.
 *
 * This is an existing human RNA-guided nuclease observation resource;
 * it does NOT establish new BSNG nanite-binding or insertion sites.
 */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {
  GUIDESEQ_REFERENCE,parseGUIDEseqObservedSites,verifySiteAgainstReference,
  summarizeGUIDEseqObservedSites
} from '../src/lib/guideseq-coordinate-evidence.mjs';

const sha256=buffer=>createHash('sha256').update(buffer).digest('hex');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function sourceFile(path,expectedBlobSha){
 const url=`https://raw.githubusercontent.com/${GUIDESEQ_REFERENCE.sourceRepository}/${GUIDESEQ_REFERENCE.sourceCommit}/${path}`;
 for(let i=1;i<=4;i++){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetch(url,{headers:{'Accept':'text/plain','User-Agent':'BSNG-Research-Studio/0.6 published GUIDE-seq audit'},signal:controller.signal});
   if(!response.ok)throw Error('Source HTTP '+response.status);
   const bytes=Buffer.from(await response.arrayBuffer());
   const gitBlobSha1=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
   if(gitBlobSha1!==expectedBlobSha)throw Error('Pinned source git blob mismatch for '+path);
   return {text:bytes.toString('utf8'),sha256:sha256(bytes),url,bytes:bytes.length,gitBlobSha1};
  } catch(e){if(i===4)throw e;await wait(1800*i)}
  finally{clearTimeout(timer)}
 }
 throw Error('Could not retrieve pinned source.');
}
async function referenceSequence(site){
 const region=`${site.chromosome.replace(/^chr/,'')}:${site.regionStart1BasedInclusive}..${site.regionEnd1BasedInclusive}:1`;
 const url=`https://rest.ensembl.org/sequence/region/human/${region}?content-type=application/json`;
 for(let i=1;i<=5;i++){
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),60000);
  try{
   const response=await fetch(url,{headers:{'Accept':'application/json','User-Agent':'BSNG-Research-Studio/0.6 reference verification'},signal:ctrl.signal});
   if(!response.ok){
    if((response.status===429||response.status>=500)&&i<5){
      const retryAfter=Number(response.headers.get('retry-after'));
      await wait(Number.isFinite(retryAfter)&&retryAfter>0?Math.min(20000,retryAfter*1000):i*1000);
      continue;
    }
    throw Error('Ensembl HTTP '+response.status+' for '+region);
   }
   const json=await response.json();
   if(typeof json?.id!=='string'||!json.id.startsWith('chromosome:GRCh38:19:')||
     !json.id.includes(`:${site.regionStart1BasedInclusive}:${site.regionEnd1BasedInclusive}:1`))
    throw Error('Wrong Ensembl assembly/region id: '+json?.id);
   if(typeof json?.seq!=='string'||json.seq.length!==site.referenceAlignedSiteSequence.length)
    throw Error('Reference sequence length mismatch at '+region);
   return {referencePlusStrandSequence:json.seq.toUpperCase(),ensemblId:json.id,queryUrl:url};
  }catch(e){if(i===5)throw e;await wait(i*1500)}
  finally{clearTimeout(timer)}
 }
 throw Error('Ensembl exhausted retries.');
}

const [source,manifest]=await Promise.all([
 sourceFile(GUIDESEQ_REFERENCE.sourcePath,GUIDESEQ_REFERENCE.originalGitBlobSha1),
 sourceFile(GUIDESEQ_REFERENCE.manifestPath,GUIDESEQ_REFERENCE.manifestBlobSha1)
]);
if(!/^genome:\s*hg38\s*$/m.test(manifest.text)||!/^reference_genome:\s*chr19\.fa\s*$/m.test(manifest.text)){
 throw Error('Upstream manifest does NOT document hg38 chr19 genome.');
}
const original=parseGUIDEseqObservedSites(source.text);
if(original.length!==7)throw Error('Upstream filtered GUIDE-seq example has changed expected row count.');
const observed=[];
for(const site of original){
 if(site.locationStatus==='PENDING_REFERENCE_SEQUENCE_VERIFICATION'){
   const ref=await referenceSequence(site);
   const verified=verifySiteAgainstReference(site,ref.referencePlusStrandSequence);
   verified.referenceCheck.ensemblReferenceId=ref.ensemblId;
   verified.referenceCheck.queryUrl=ref.queryUrl;
   observed.push(verified);
   console.log('SOURCE ALIGNMENT',verified.chromosome,
      verified.regionStart1BasedInclusive+'..'+verified.regionEnd1BasedInclusive,
      verified.referenceCheck.status,'reads',site.observedGuideSeqUniqueMoleculeCount);
   await wait(350);
 } else {
   observed.push(verifySiteAgainstReference(site,null));
 }
}
const summary=summarizeGUIDEseqObservedSites(observed);
const byCount=[...observed].sort((a,b)=>b.observedGuideSeqUniqueMoleculeCount-a.observedGuideSeqUniqueMoleculeCount||a.sourceRow-b.sourceRow);
const ctcf=JSON.parse(await readFile('results/BSNG-CTCF-K562-GRCh38-X-10M-reference-benchmark-38684724899.json','utf8'));
const trueot=JSON.parse(await readFile('results/BSNG-TrueOT-natural-RNA-reference-benchmark-38688521675.json','utf8'));
const output={
  schemaVersion:1,
  title:'Published GUIDE-seq hg38 chr19 coordinate-resolved RNA-guided experimental-read evidence example',
  evidenceType:'PUBLISHED_GUIDESEQ_PIPELINE_TEST_OUTPUT_WITH_READ_SUPPORTED_SITES',
  biologicalClaim:'Existing RNA-guided nuclease-associated DNA cleavage evidence, NOT BSNG nanite DNA-binding affinity',
  sampleType:'Published GUIDE-seq pipeline demonstration/test read data, not independent biological replication',
  source:{
    ...GUIDESEQ_REFERENCE,
    sourceRawUrl:source.url,
    sourceExactFileSha256:source.sha256,
    sourceOriginalGitBlobSha1:source.gitBlobSha1,
    manifestRawUrl:manifest.url,
    manifestExactFileSha256:manifest.sha256,
    referenceVerificationService:'Ensembl REST / Homo sapiens GRCh38',
  },
  evidenceIsPersonalGenome:false,
  referenceBuild:'GRCh38',
  coordinateSystem:'GRCh38 1-based inclusive, converted from source hg38 BED zero-based half-open',
  readCountMeaning:'GUIDE-seq unique molecular index support. This is NOT a binding-affinity magnitude, cleavage rate or therapeutic benefit.',
  summary,
  rankedByObservedGuideSeqReadSupport:byCount.map((x,i)=>({...x,evidenceRankByReadSupport:i+1,
     status:x.referenceCheck?.match?'REFERENCE_AND_PUBLISHED_READS_CONFIRMED':'REFERENCE_NOT_VERIFIED',
     notNaniteTarget:true,notSafeInsertionSite:true,
  })),
  integrationAssessment:{
    mode:'GENOMIC_ANNOTATION_CONTEXT_ONLY',
    integrationIsExperimentallyMeasured:false,
    safetyCanBeInferredFromPromoterOrIntronLabel:false,
    sourceFeatureLabelsAreUnverifiedHistoricalAnnotations:true,
  },
  comparisonWithOtherNaturalSystems:{
    ctcf:{measuredSystem:'Natural CTCF protein ChIP-seq in K562, chrX 10M GRCh38',descriptiveAuc:ctcf.benchmark.aucAgainstGcMatchedBackground,
      sameExperiment:false,sameGenomicRegion:false,scoreCombinationPermitted:false},
    trueot:{measuredSystem:'Natural SpCas9 guide-target activity labels, no reference genomic coordinates in source CSV',macroGuideAuc:trueot.findings.primaryMacroAuc,
      sameExperiment:false,sourceCoordinatesPresent:false,scoreCombinationPermitted:false}
  },
  provenance:{
    runId:process.env.GITHUB_RUN_ID||'local',
    codeCommit:process.env.GITHUB_SHA||'local-uncommitted',
    generatedAt:new Date().toISOString(),
    protocol:'docs/guideseq-hg38-coordinate-evidence-v0.6.md',
  },
  limitations:[
    'This is a published pipeline TEST example, not a complete population or independently replicated experiment.',
    'Read counts indicate RNA-guided Cas-nuclease-associated DNA cleavage support and are not equilibrium binding affinities.',
    'Upstream feature annotations are historical source text; they have not been re-annotated with a release-pinned Ensembl/GENCODE source.',
    'Gapped or unaligned read-supported source entries must not be called verified exact sequence alignments.',
    'Experiment uses hg38 chromosome 19; prior CTCF benchmark scans separate chrX GRCh38 10M region.',
    'No BSNG physical RNA/protein construct, physical hybrid binding or genomic integration is tested.',
    'Do not interpret a high count as a safe or recommended insertion location.',
  ]
};
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/BSNG-GUIDEseq-hg38-chr19-coordinate-evidence.json',JSON.stringify(output,null,2)+'\n');
await writeFile('artifacts/GUIDEseq-published-hg38-chr19-original.tsv',source.text);
await writeFile('artifacts/GUIDEseq-published-hg38-source-manifest.yaml',manifest.text);
console.log('REAL HG38 GUIDESEQ COORDINATE AUDIT COMPLETE',JSON.stringify({
  rows:summary.observedSites,
  supportedCoordinates:summary.withSubstitutionsOnlyCoordinates,
  verified:summary.verifiedReferenceSequenceSites,
  mismatched:summary.mismatchedReferenceSequenceSites,
  gappedUnverified:summary.gappedOrUnresolvedSites,
  top:byCount.slice(0,4).map(s=>({
   chromosome:s.chromosome,start:s.regionStart1BasedInclusive,end:s.regionEnd1BasedInclusive,
   reads:s.observedGuideSeqUniqueMoleculeCount,
   status:s.locationStatus,
  })),
  sourceSha256:source.sha256,
}));
if(summary.verifiedReferenceSequenceSites<1 || summary.mismatchedReferenceSequenceSites>0){
 throw Error('Published GUIDE-seq GRCh38 locus verification failed. Do not promote unverified site coordinates.');
}
