/**
 * Deterministic evaluation of published human natural RNA-guided SpCas9
 * activity labels. DOES NOT design novel guides or test physical BSNG nanites.
 */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {
 parseTrueOT,analyzeTrueOT,TRUEOT_COMMIT,TRUEOT_GIT_BLOB
} from '../src/lib/rna-guided-reference-benchmark.mjs';

const repository='baolab-rice/CRISPR_OT_scoring';
const relativePath='custom_scoring/parsed_datasets/TrueOT/TrueOT_1806uniqueTriplet_gRNA_OT_label.csv';
const sourceUrl=`https://raw.githubusercontent.com/${repository}/${TRUEOT_COMMIT}/${relativePath}`;
const publicPage=`https://github.com/${repository}/blob/${TRUEOT_COMMIT}/${relativePath}`;
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
async function getPublishedCsv(){
  let latestError;
  for(let attempt=1;attempt<=4;attempt++){
    const ctrl=new AbortController();
    const timeout=setTimeout(()=>ctrl.abort(),60_000);
    try{
      const response=await fetch(sourceUrl,{
        headers:{'Accept':'text/plain','User-Agent':'BSNG-Research-Studio/0.5 scientific reference validation'},
        signal:ctrl.signal
      });
      if(!response.ok)throw Error('HTTP '+response.status+' from original curated-data publisher');
      const buffer=Buffer.from(await response.arrayBuffer());
      const actualGitBlob=createHash('sha1').update(`blob ${buffer.length}\0`).update(buffer).digest('hex');
      if(actualGitBlob!==TRUEOT_GIT_BLOB)throw Error('Original TrueOT CSV Git blob differs from preregistered version.');
      return {buffer,sha1:actualGitBlob};
    }catch(error){
      latestError=error;
      console.log('Published dataset retry '+attempt+': '+String(error).slice(0,180));
      if(attempt<4)await new Promise(done=>setTimeout(done,attempt*2200));
    }finally{clearTimeout(timeout);}
  }
  throw latestError;
}
const {buffer,sha1}=await getPublishedCsv();
const rows=parseTrueOT(buffer.toString('utf8'));
if(rows.length!==1806)throw Error('Unexpected curated dataset size.');
const positives=rows.filter(row=>row.label===1).length;
if(positives!==250)throw Error('Unexpected number of positive experimental activity labels.');
const result=analyzeTrueOT(rows,{seed:1729,bootstrapIterations:500});
if(result.datasetSummary.distinctGuideCount!==36)throw Error('Unexpected source guide identity count.');

const protocol='docs/rna-guided-spcas9-trueot-preregistration-v0.5.md';
const ctcfRecord=JSON.parse(await readFile(
  'results/BSNG-CTCF-K562-GRCh38-X-10M-reference-benchmark-38684724899.json','utf8'));
if(ctcfRecord.benchmark.aucAgainstGcMatchedBackground!==0.8702221074380165){
  throw Error('Pinned CTCF natural protein benchmark changed unexpectedly.');
}
const record={
  ...result,
  runId:process.env.GITHUB_RUN_ID||'local',
  runUrl:process.env.GITHUB_RUN_ID
    ? `https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null,
  generatedAt:new Date().toISOString(),
  sourceCodeRevision:process.env.GITHUB_SHA||'local-uncommitted',
  preRegisteredProtocol:protocol,
  publishedDataset:{
    sourceRepository:repository,
    originalCsvPath:relativePath,
    sourceGitCommit:TRUEOT_COMMIT,
    sourceUrl:publicPage,
    sourceSha1GitBlob:sha1,
    exactCsvSha256:sha256(buffer),
    format:'UTF-8 CSV: gRNA, OT, label',
    provenance:'Curated TrueOT experimental off-target activity labels',
    sourceHasGenomeCoordinates:false,
    sourceGenomeAssembly:null,
  },
  proteinReferenceContext:{
    subject:'Natural human CTCF protein, separate independent computational module',
    referenceGenome:'GRCh38 chromosome X 1,000,000-10,999,999',
    sourceRecord:'results/BSNG-CTCF-K562-GRCh38-X-10M-reference-benchmark-38684724899.json',
    descriptiveAuc:ctcfRecord.benchmark.aucAgainstGcMatchedBackground,
    crossModuleJointPredictionsComputed:false,
  },
  hybridReadiness:{
    rnaReference:'RETROSPECTIVE_EXPERIMENTAL_ACTIVITY_BENCHMARK',
    proteinReference:'SEPARATE_EXPERIMENTAL_CTCF_CHIPSEQ_REFERENCE_BENCHMARK',
    physicalBSNGHybrid:'NOT_ASSESSABLE',
    physicalBSNGIntegration:'NOT_ASSESSABLE',
    physicalBSNGRecognitionConstructSpecified:false,
    physicallyMeasuredJointRNAProteinComplex:false,
  },
  claimsBoundary:'A computational benchmark of published natural SpCas9 editing activity; not physical nanite binding, in-vivo integration, therapeutic performance or genome-target design.'
};
await mkdir('artifacts',{recursive:true});
const output='artifacts/BSNG-TrueOT-RNA-guided-natural-reference-benchmark.json';
await writeFile(output,JSON.stringify(record,null,2)+'\n');
const audit={
  study:'BSNG dual-natural-reference computational readiness',
  rna:{
    knownNaturalSystem:'SpCas9 RNA-guided nuclease',
    source:publicPage,
    frozenSourceGitBlob:sha1,
    macroGuideAuc:result.metrics.primaryMacroAucEligibleGuides,
    eligibleGuideCount:result.metrics.eligibleGuideCount,
    acceptedObservationCount:result.datasetSummary.acceptedRows,
    excludedObservationCount:result.datasetSummary.excludedRows,
  },
  protein:{
    knownNaturalSystem:'human CTCF protein',
    auc:ctcfRecord.benchmark.aucAgainstGcMatchedBackground,
    evidenceSource:ctcfRecord.study.githubRun,
  },
  jointHybrid:{
    assessed:false,
    evidence:'NO_EXPERIMENTALLY_CHARACTERIZED_BSNG_HYBRID_COMPLEX',
    scientificallyValidCombinationScore:null,
  },
  integration:{
    experimentallyAssessed:false,
    safeSiteRecommendation:null,
  },
  caveat:'Protein and RNA data come from unrelated reference systems and MUST NOT be combined into a nanite binding score.'
};
await writeFile('artifacts/BSNG-natural-reference-hybrid-readiness.json',JSON.stringify(audit,null,2)+'\n');
console.log('REAL RNA-GUIDED EXPERIMENTAL REFERENCE BENCHMARK COMPLETE',JSON.stringify({
 sourceRows:rows.length,sourceSha256:record.publishedDataset.exactCsvSha256,
 accepted:result.datasetSummary.acceptedRows,excluded:result.datasetSummary.excludedRows,
 guideGroupsWithBothClasses:result.metrics.eligibleGuideCount,
 macroGuideAuc:result.metrics.primaryMacroAucEligibleGuides,
 macroGuideAucBootstrapCI:result.metrics.primaryMacroAucGuideBootstrap95PercentileCI,
 pooledAuc:result.metrics.pooledAuc,
 gcComparatorAuc:result.metrics.pooledGcContentComparatorAuc,
 hybridStatus:'NOT_ASSESSABLE'
}));
