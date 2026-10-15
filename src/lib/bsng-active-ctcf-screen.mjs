/**
 * BSNG v0.7 — streaming evaluation of *natural human CTCF* motif preference.
 * It is NOT a physical BSNG nanite recognition, insertion, or safety model.
 *
 * Stores only best-ranked PWM motif match per fixed 1 kb bin. This gives
 * deterministic, spatially distributed descriptive motif candidates.
 * Coordinates are always 1-based inclusive GRCh38, source region is validated
 * separately. This is NOT a binding affinity/probability.
 */
import { CTCF_PWM, CTCF_REFERENCE, encodeDNA } from './ctcf-reference-model.mjs';

const COMP=[3,2,1,0];
export const MAX_ANALYSIS_BASES=10_000_000;
export const DEFAULT_BIN_SIZE=1000;

export function validateRegion({chromosome,start,length}) {
 const normalized=String(chromosome).toUpperCase().replace(/^CHR/,'');
 if(!/^(?:[1-9]|1[0-9]|2[0-2]|X|Y|MT)$/.test(normalized))
   throw Error('Invalid human reference chromosome.');
 if(!Number.isSafeInteger(start)||start<1)throw Error('Invalid 1-based start.');
 if(!Number.isSafeInteger(length)||length<100_000||length>MAX_ANALYSIS_BASES)
   throw Error('Region length must be between 100,000 and 10,000,000 bases.');
 if(start+length-1 > 250_000_000)throw Error('Region end outside supported coordinate range.');
 return {species:'Homo sapiens',assembly:'GRCh38',chromosome:normalized,start1BasedInclusive:start,
   end1BasedInclusive:start+length-1,length,coordinateConvention:'1-based inclusive'};
}

export function createCtcfStreamingScreen({regionStart1,topK=20,binSize=DEFAULT_BIN_SIZE,pwm=CTCF_PWM}={}) {
 if(!Number.isSafeInteger(regionStart1)||regionStart1<1)throw Error('Invalid region start.');
 if(!Number.isSafeInteger(topK)||topK<1||topK>200)throw Error('Invalid number of findings.');
 if(!Number.isSafeInteger(binSize)||binSize<250||binSize>100000)throw Error('Invalid motif bin size.');
 const maxByBin=new Map();
 let processed=0,carry='',chunksProcessed=0,validWindows=0,ambiguousWindows=0;
 const alphabet='ACGTN';
 function addChunk(raw) {
   if(typeof raw!=='string'||raw.length===0||/[^ACGTN]/.test(raw))
     throw Error('Invalid source DNA chunk.');
   if(processed+raw.length>MAX_ANALYSIS_BASES)throw Error('Region exceeds ten-million-base limit.');
   const combined=carry+raw;
   const encoded=encodeDNA(combined);
   const offset=processed-carry.length;
   const limit=combined.length-pwm.length+1;
   for(let i=0;i<limit;i++) {
     let plus=0,minus=0,valid=true;
     for(let j=0;j<pwm.length;j++) {
       const b=encoded[i+j];
       if(b>3){valid=false;break;}
       plus+=pwm.weights[j][b];
       minus+=pwm.weights[pwm.length-1-j][COMP[b]];
     }
     if(!valid){ambiguousWindows++;continue;}
     validWindows++;
     const score=Math.max(plus,minus), strand=plus>=minus?'+':'-';
     const position0=offset+i, bin=Math.floor(position0/binSize);
     const previous=maxByBin.get(bin);
     if(previous && (previous.score>score ||
       (previous.score===score&&previous.position0<position0))) continue;
     maxByBin.set(bin,{
       position0,score,strand,
       sequence19:combined.slice(i,i+pwm.length),
       regionBin0:bin,
     });
   }
   processed+=raw.length;
   chunksProcessed++;
   carry=combined.slice(-Math.min(pwm.length-1,combined.length));
   return {processedBases:processed,chunksProcessed};
 }
 function summary() {
   const ranked=[...maxByBin.values()].sort((a,b)=>b.score-a.score||a.position0-b.position0)
     .slice(0,topK).map((site,i)=>({
       rank:i+1,chromosome:null,
       start1BasedInclusive:regionStart1+site.position0,
       end1BasedInclusive:regionStart1+site.position0+pwm.length-1,
       position0RelativeToRegion:site.position0,
       strand:site.strand,referencePlusStrand19:site.sequence19,
       pwmLog2OddsScore:site.score,binIndex0:site.regionBin0,
       evidenceStatus:'COMPUTATIONAL_NATURAL_CTCF_MOTIF_ONLY',
       measuredBsngBinding:false,measuredIntegration:false,
     }));
   return {
     method:'PUBLISHED_JASPAR_CTCF_PWM_BEST_PER_1KB_REFERENCE_BIN',
     model:'natural human CTCF',jasparMatrixId:CTCF_REFERENCE.jasparMatrixId,
     pwmLength:pwm.length,pwmPseudocount:CTCF_REFERENCE.pseudocount,
     logOddsBackground:CTCF_REFERENCE.nucleotideBackground,
     modelSource:CTCF_REFERENCE.sourceUrl,
     modelLicense:CTCF_REFERENCE.license,
     binSize,topK,
     examinedBases:processed,chunksProcessed,validWindows,ambiguousWindows,
     expectedSlidingWindows:Math.max(0,processed-pwm.length+1),
     allWindowsAccountedFor:validWindows+ambiguousWindows===Math.max(0,processed-pwm.length+1),
     eligibleBins:maxByBin.size,
     findings:ranked,
     interpretation:'Ranked natural CTCF sequence motif preference within the requested region. Not physical BSNG nanite binding, predicted integration safety, or experimental CTCF occupancy.',
   };
 }
 return {addChunk,summary};
}
