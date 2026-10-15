/**
 * RNA-guided natural-system benchmark for published TrueOT SpCas9 outcomes.
 * Fixed naive guide-vs-target sequence-distance model. NO BSNG nanite,
 * guide design, genome editing advice, or physical binding prediction.
 */
export const RNA_REFERENCE_BENCHMARK_VERSION='bsng-rna-reference-trueot/0.5.0';
export const TRUEOT_GIT_BLOB='8cd903a85c123105daed641a2579d2e161009d38';
export const TRUEOT_COMMIT='4ff0ccd2493de3dc658747d05fa6bb4fe12ea2c7';

export function parseTrueOT(csv) {
  if(typeof csv!=='string')throw Error('TrueOT dataset must be a string.');
  const lines=csv.trim().split(/\r?\n/);
  if(lines.shift()!=='gRNA,OT,label')throw Error('Unexpected TrueOT source schema.');
  return lines.map((line,index)=>{
    const fields=line.split(',');
    if(fields.length!==3 || !['0','1'].includes(fields[2]))throw Error('Invalid TrueOT row '+(index+2));
    return {guide:fields[0],observedTarget:fields[1],label:Number(fields[2]),sourceRow:index+2};
  });
}
export function scoreObservedPair(guide,target){
  if(guide.length!==23||target.length!==23||/[^ACGT]/.test(guide+target))return null;
  let mismatches=0,gc=0;
  for(let i=0;i<20;i++){
    if(guide[i]!==target[i])mismatches++;
    if(target[i]==='G'||target[i]==='C')gc++;
  }
  return {score:-mismatches,mismatches,referenceGC:gc/20};
}
export function describeRows(rows){
  if(!Array.isArray(rows)||!rows.length)throw Error('Expected nonempty published experimental observations.');
  const accepted=[],excluded=[];
  let nonStandardLength=0,invalidAlphabet=0;
  const guides=new Map(),uniquePairs=new Set(),uniqueTriples=new Set();
  const conflicting=new Map();
  for(const row of rows){
    if(!row || !['0','1'].includes(String(row.label))||typeof row.guide!=='string'||typeof row.observedTarget!=='string')
      throw Error('Invalid original record.');
    guides.set(row.guide,(guides.get(row.guide)||0)+1);
    const pair=row.guide+'|'+row.observedTarget,triplet=pair+'|'+row.label;
    uniquePairs.add(pair);uniqueTriples.add(triplet);
    const present=conflicting.get(pair)||new Set();
    present.add(row.label);conflicting.set(pair,present);
    const prediction=scoreObservedPair(row.guide,row.observedTarget);
    if(prediction)accepted.push({...row,...prediction});
    else{
      if(row.guide.length!==23||row.observedTarget.length!==23)nonStandardLength++;
      else invalidAlphabet++;
      excluded.push({sourceRow:row.sourceRow,label:row.label,reason:'UNSUPPORTED_LENGTH_OR_ALPHABET'});
    }
  }
  const totalPositive=rows.filter(r=>r.label===1).length;
  return {
    accepted,excluded,
    provenance:{
      publishedRows:rows.length,positiveRows:totalPositive,negativeRows:rows.length-totalPositive,
      distinctGuideCount:guides.size,
      distinctGuideTargetPairs:uniquePairs.size,
      distinctTriplets:uniqueTriples.size,
      conflictingGuideTargetPairs:[...conflicting.values()].filter(s=>s.size>1).length,
      acceptedRows:accepted.length,excludedRows:excluded.length,
      excludedNonstandardLength:nonStandardLength,
      excludedInvalidAlphabet:invalidAlphabet,
      acceptedPositiveRows:accepted.filter(r=>r.label===1).length,
      acceptedNegativeRows:accepted.filter(r=>r.label===0).length,
      excludedPositiveRows:excluded.filter(r=>r.label===1).length,
      excludedNegativeRows:excluded.filter(r=>r.label===0).length,
    }
  };
}
export function rocAuc(observations,scoreKey='score'){
  let positive=0,negative=0;
  const samples=[];
  for(const x of observations){
    if(![0,1].includes(x.label)||!Number.isFinite(x[scoreKey]))throw Error('Invalid score or experimental label.');
    positive+=x.label;negative+=1-x.label;
    samples.push({score:x[scoreKey],label:x.label});
  }
  if(!positive||!negative)return null;
  samples.sort((a,b)=>a.score-b.score);
  let priorNegatives=0,wins=0;
  for(let i=0;i<samples.length;){
    let j=i,neg=0,pos=0;
    while(j<samples.length&&samples[j].score===samples[i].score){
      if(samples[j].label===1)pos++;else neg++;
      j++;
    }
    wins+=pos*priorNegatives+0.5*pos*neg;
    priorNegatives+=neg;
    i=j;
  }
  return wins/(positive*negative);
}
export function averagePrecision(observations,scoreKey='score'){
  const p=observations.filter(x=>x.label===1).length;
  if(!p)return null;
  const samples=observations.map(x=>({score:x[scoreKey],label:x.label})).sort((a,b)=>b.score-a.score);
  let seen=0,positives=0,weightedPrecision=0;
  for(let i=0;i<samples.length;){
    let j=i,pHere=0;
    while(j<samples.length&&samples[j].score===samples[i].score){
      if(samples[j].label===1)pHere++;
      j++;
    }
    seen+=j-i;
    positives+=pHere;
    weightedPrecision+=pHere*(positives/seen);
    i=j;
  }
  return weightedPrecision/p;
}
export function seededPRNG(seed=1729){
  let state=seed>>>0;if(!state)state=0x6d2b79f5;
  return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/0x100000000;};
}
const mean=values=>values.length?values.reduce((sum,x)=>sum+x,0)/values.length:null;
function percentile(sorted,fraction){
  if(!sorted.length)return null;
  const p=(sorted.length-1)*fraction,lo=Math.floor(p),hi=Math.ceil(p),weight=p-lo;
  return sorted[lo]*(1-weight)+sorted[hi]*weight;
}
export function analyzeTrueOT(rows,{seed=1729,bootstrapIterations=500}={}){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid seed.');
  if(!Number.isInteger(bootstrapIterations)||bootstrapIterations<1||bootstrapIterations>1000)throw Error('Invalid bootstrap count.');
  const {accepted,provenance}=describeRows(rows);
  const groups=new Map();
  for(const row of accepted){
    if(!groups.has(row.guide))groups.set(row.guide,[]);
    groups.get(row.guide).push(row);
  }
  const eligible=[],excludedSingleClass=[];
  for(const [guide,items] of groups){
    const positives=items.filter(x=>x.label===1).length,negatives=items.length-positives;
    if(positives===0||negatives===0){excludedSingleClass.push({count:items.length,positives,negatives});continue;}
    eligible.push({
      // Underlying guide sequences are in pinned upstream public CSV, not repeated here.
      guide,auc:rocAuc(items),gcComparatorAuc:rocAuc(items,'referenceGC'),
      averagePrecision:averagePrecision(items),count:items.length,
      positiveCount:positives,negativeCount:negatives,
    });
  }
  if(!eligible.length)throw Error('No guide groups with both observed activity classes.');
  const averageGuideAuc=mean(eligible.map(g=>g.auc));
  const random=seededPRNG(seed),bootstrap=[];
  for(let repeat=0;repeat<bootstrapIterations;repeat++){
    const sample=[];
    for(let j=0;j<eligible.length;j++)sample.push(eligible[Math.floor(random()*eligible.length)].auc);
    bootstrap.push(mean(sample));
  }
  bootstrap.sort((a,b)=>a-b);
  return {
    schemaVersion:1,
    benchmarkVersion:RNA_REFERENCE_BENCHMARK_VERSION,
    sourceSystem:'NATURAL_RNA_GUIDED_SPCAS9_RETROSPECTIVE_OFF_TARGET_ACTIVITY',
    evidenceType:'PUBLISHED_EXPERIMENTAL_ACTIVITY_LABELS_NOT_BINDING_AFFINITY',
    sourceGitCommit:TRUEOT_COMMIT,sourceExpectedGitBlob:TRUEOT_GIT_BLOB,
    computationalModel:'UNTRAINED_NEGATIVE_HAMMING_DISTANCE_ON_FIRST_20_POSITIONS_OF_23NT_PAIR',
    noModelFitPerformed:true,
    labelsMeasuredDirectPhysicalBinding:false,
    biologicalBSNGHybridBindingDemonstrated:false,
    experimentalBSNGIntegrationDemonstrated:false,
    datasetSummary:provenance,
    metrics:{
      primaryMacroAucEligibleGuides:averageGuideAuc,
      primaryMacroAucGuideBootstrap95PercentileCI:[
        percentile(bootstrap,0.025),percentile(bootstrap,0.975)
      ],
      bootstrapIterations,seed,
      eligibleGuideCount:eligible.length,
      excludedSingleClassGuideCount:excludedSingleClass.length,
      pooledAuc:rocAuc(accepted),
      pooledAveragePrecision:averagePrecision(accepted),
      pooledPositivePrevalence:provenance.acceptedPositiveRows/accepted.length,
      pooledGcContentComparatorAuc:rocAuc(accepted,'referenceGC'),
      guideMacroGcContentComparatorAuc:mean(eligible.map(x=>x.gcComparatorAuc))
    },
    perGuideSummary:eligible.map(({guide,...other})=>other),
    exclusionSingleClassSummary:excludedSingleClass,
    moduleEvidenceStates:{
      rnaGuidedReference:'RETROSPECTIVE_EXTERNAL_ACTIVITY_BENCHMARK',
      proteinReference:'CTCF_REFERENCE_BENCHMARK_ALREADY_COMPLETED_SEPARATELY',
      physicalBSNGHybrid:'NOT_ASSESSABLE',
      bsngGenomicIntegration:'NOT_ASSESSABLE',
    },
    limitations:[
      'Published 0/1 labels are historical nuclease activity readouts, not DNA-binding affinity measurements.',
      'Source CSV has no chromosome, GRCh38 coordinates or experimental assay context columns.',
      'This calculation was NOT performed on the 10M chrX reference interval and does not locate RNA-guided target sites there.',
      'Unequal-length potential bulge records are excluded from this naive 23/23 sequence distance baseline.',
      'Labels are heterogeneous curated study results; class zero is not universal absence of recognition.',
      'ROC discrimination is retrospective, not prospective wet-lab validation of BSNG nanites.',
      'CTCF reference is separate; the model does not combine natural references into a physical BSNG hybrid system.',
      'Model scores are not probabilities of nanite binding, safety or successful genome integration.',
    ]
  };
}
