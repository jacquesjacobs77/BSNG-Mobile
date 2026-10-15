/**
 * Compare a natural, measured human DNA-binding reference (CTCF ChIP-seq)
 * against fixed JASPAR motif scores. This benchmark is NOT a BSNG-nanite test.
 */
import { scoreSite, maxScoreInInterval } from './ctcf-reference-model.mjs';

export function makeSeededRandom(seed=1729){
  let state=seed>>>0;
  if(!state)state=0x6d2b79f5;
  return ()=>{
    state^=state<<13;state^=state>>>17;state^=state<<5;
    return (state>>>0)/4294967296;
  };
}
export function parseNarrowPeaks(text,chromosome,refStart1,refLength){
  if(typeof text!=='string')throw Error('BED must be UTF-8 text.');
  const left=refStart1-1,right=left+refLength;
  const peaks=[];
  for(const line of text.split(/\r?\n/)){
    if(!line || line[0]==='#'||line.startsWith('track '))continue;
    const c=line.split('\t');
    if(c.length<3 || c[0]!==('chr'+chromosome))continue;
    const start=Number(c[1]),end=Number(c[2]);
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<=start)throw Error('Malformed BED coordinates.');
    if(end<=left||start>=right)continue;
    const offset=Number(c[9]);
    const summit=(Number.isInteger(offset)&&offset>=0&&offset<end-start)?start+offset:Math.floor((start+end)/2);
    if(summit<left+150||summit>=right-150)continue;
    peaks.push({bedStart0:start,bedEnd0:end,summit0:summit,relativeSummit0:summit-left});
  }
  peaks.sort((a,b)=>a.bedStart0-b.bedStart0);
  return peaks;
}
function overlapsPeakNeighborhood(peaks,absolute0,padding=1000){
  // Peak intervals are BED 0-based half-open; binary search by start.
  let lo=0,hi=peaks.length;
  while(lo<hi){
    const mid=(lo+hi)>>1;
    if(peaks[mid].bedStart0<=absolute0+padding)lo=mid+1;else hi=mid;
  }
  // Nested peak intervals are possible; conservatively look back up to
  // 1000 entries; ENCODE IDR peak intervals are typically locally sparse.
  for(let i=Math.max(0,lo-1000);i<lo;i++){
    if(peaks[i].bedEnd0+padding>=absolute0)return true;
  }
  return false;
}
function localGC(encoded,center,half=100){
  if(center-half<0||center+half>=encoded.length)return null;
  let gc=0;
  for(let i=center-half;i<=center+half;i++){
    const x=encoded[i];
    if(x>3)return null;
    if(x===1||x===2)gc++;
  }
  return gc/(2*half+1);
}
export function auc(positives,negatives){
  if(!positives.length||!negatives.length)return null;
  let wins=0;
  for(const p of positives)for(const n of negatives){
    if(p>n)wins++;else if(p===n)wins+=0.5;
  }
  return wins/(positives.length*negatives.length);
}
function median(values) {
  const sorted=[...values].sort((a,b)=>a-b);
  const middle=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;
}
export function evaluateCtcFObservedPeaks({encoded,scores,peaks,refStart1=1_000_000,seed=1729,positiveLimit=150}){
  if(peaks.length<10)throw Error('Insufficient real measured peaks in this genomic interval.');
  const random=makeSeededRandom(seed);
  const positiveScores=[],negativeScores=[];
  const examples=[];
  const selected=[];
  for(let i=0;i<Math.min(positiveLimit,peaks.length);i++){
    const peak=peaks[Math.floor(i*peaks.length/Math.min(positiveLimit,peaks.length))];
    const gc=localGC(encoded,peak.relativeSummit0);
    const scored=maxScoreInInterval(scores,peak.relativeSummit0-100,peak.relativeSummit0+101);
    if(gc!==null&&scored!==null)selected.push({peak,gc,scored});
  }
  for(const item of selected){
    let negative=null;
    for(let attempt=0;attempt<2500;attempt++){
      const pos=120+Math.floor(random()*(encoded.length-240));
      if(overlapsPeakNeighborhood(peaks,refStart1-1+pos,1000))continue;
      const gc=localGC(encoded,pos);
      if(gc===null||Math.abs(gc-item.gc)>0.06)continue;
      const scored=maxScoreInInterval(scores,pos-100,pos+101);
      if(scored===null)continue;
      negative={pos,gc,scored};
      break;
    }
    if(!negative)continue;
    positiveScores.push(item.scored.score);
    negativeScores.push(negative.scored.score);
    if(examples.length<30)examples.push({
      positiveChIPPeakSummit1Based:item.peak.summit0+1,
      positiveReferenceMotifStart1Based:refStart1+item.scored.position0,
      positivePWMScore:item.scored.score,
      negativeBackgroundMidpoint1Based:refStart1+negative.pos,
      negativePWMScore:negative.scored.score,
      positiveWindowGC:item.gc,negativeWindowGC:negative.gc,
    });
  }
  if(positiveScores.length<10)throw Error('Insufficient GC-matched peak/background comparisons.');
  const area=auc(positiveScores,negativeScores);
  const pairedWinRate=positiveScores.reduce((s,x,i)=>s+(x>negativeScores[i]?1:x===negativeScores[i]?0.5:0),0)/positiveScores.length;
  return {
    measuredSystem:'Human CTCF ChIP-seq enrichment in K562 cells (not exact single-molecule occupancy)',
    pairedSampleCount:positiveScores.length,
    matchedBackgroundCriteria:'201-bp windows with |GC fraction delta| <= 0.06, center >1000bp away from known CTCF peaks',
    selectedPeakSampler:'Sort BED peaks by chromosome coordinate; approximately evenly spaced sample up to 150 peaks',
    negativeWindowSeed:seed,
    scoreWindow:'Maximum both-strand CTCF 19-base log2 PWM score from motif starts within 100 bases of peak summit/background midpoint',
    aucAgainstGcMatchedBackground:area,
    pairedWinRate,
    medianPeakScore:median(positiveScores),
    medianBackgroundScore:median(negativeScores),
    validationStatus:area>0.5?'EXPLORATORY_MOTIF_ENRICHMENT_ABOVE_MATCHED_BACKGROUND':'NO_MOTIF_ENRICHMENT_DETECTED',
    interpretation:'ChIP-seq signal is a cell-context-dependent proxy for CTCF DNA association. This is not independent nanite validation, nor proof of affinity, causal binding, or integration safety.',
    firstPairedExamples:examples,
  };
}
export function decorateTopCtcFCandidates(top,encoded,peaks,refStart1=1_000_000){
  return top.map(({position0,score},index)=>{
    const site=scoreSite(encoded,position0);
    const absoluteStart1=refStart1+position0;
    return {
      rank:index+1,
      chr:'X',assembly:'GRCh38',
      start1BasedInclusive:absoluteStart1,
      end1BasedInclusive:absoluteStart1+18,
      strand:site.strand,
      sequence19:'ACGTN'.split('').length===5?Array.from(encoded.slice(position0,position0+19)).map(x=>'ACGTN'[x]).join(''):null,
      pwmScore:score,
      scoreRelativeToTheoreticalMaximum:null,
      overlappingK562CtcFPeak:overlapsPeakNeighborhood(peaks,absoluteStart1-1,0),
      status:'NATURAL_CTCF_MOTIF_CANDIDATE_ONLY',
      caution:'NOT an actionable genomic integration target and not BSNG nanite binding.'
    };
  });
}
