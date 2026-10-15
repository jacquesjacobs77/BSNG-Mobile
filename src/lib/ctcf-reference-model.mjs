/**
 * A REAL, independently published molecular-recognition reference: human CTCF.
 * Fixed JASPAR MA0139.1 19-nt position-frequency matrix, ChIP-seq derived.
 * Matrix from https://jaspar.elixir.no/matrix/MA0139.1/ (CC BY 4.0).
 * Model is a motif preference, NOT calibrated affinity, binding probability,
 * genomic integration risk/safety, or evidence of any BSNG nanite.
 */
export const CTCF_REFERENCE = Object.freeze({
  protein:'CTCF',
  taxon:'Homo sapiens',
  jasparMatrixId:'MA0139.1',
  sourceUrl:'https://jaspar.elixir.no/matrix/MA0139.1/',
  dataType:'ChIP-seq-derived position frequency matrix',
  license:'CC BY 4.0; credit JASPAR',
  pseudocount:0.5,
  nucleotideBackground:0.25,
  genomicAssembly:'GRCh38',
  encodeExperiment:'ENCSR000AKO',
  encodePeakFile:'ENCFF519CXF',
  encodePeakFilePage:'https://www.encodeproject.org/files/ENCFF519CXF/',
  encodeCellLine:'K562',
});
export const CTCF_PFM = Object.freeze({
 A:[87,167,281,56,8,744,40,107,851,5,333,54,12,56,104,372,82,117,402],
 C:[291,145,49,800,903,13,528,433,11,0,3,12,0,8,733,13,482,322,181],
 G:[76,414,449,21,0,65,334,48,32,903,566,504,890,775,5,507,307,73,266],
 T:[459,187,134,36,2,91,11,324,18,3,9,341,8,71,67,17,37,396,59],
});
const BASES='ACGT';
const COMPLEMENT=[3,2,1,0];
export function createPwm(pfm=CTCF_PFM, pseudocount=0.5) {
  const length=pfm.A?.length;
  if(!Number.isInteger(length)||length<3||length>100)throw Error('Invalid PFM length.');
  const weights=Array.from({length},()=>new Float64Array(4));
  const columns=[];
  for(let i=0;i<length;i++){
    let total=0;
    for(let b=0;b<4;b++){
      const val=pfm[BASES[b]]?.[i];
      if(!Number.isFinite(val)||val<0)throw Error('PFM must have nonnegative finite counts at every position.');
      total+=val;
    }
    if(total<=0)throw Error('Empty PFM column.');
    columns.push(total);
    for(let b=0;b<4;b++){
      const frequency=(pfm[BASES[b]][i]+pseudocount)/(total+4*pseudocount);
      weights[i][b]=Math.log2(frequency/0.25);
    }
  }
  const theoreticalMax=weights.reduce((s,w)=>s+Math.max(...w),0);
  return {length,weights,theoreticalMax,columns};
}
export const CTCF_PWM=createPwm();

export function encodeDNA(raw) {
  if(typeof raw!=='string')throw Error('DNA must be a string.');
  const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++){
    const code=raw.charCodeAt(i);
    out[i]=code===65?0:code===67?1:code===71?2:code===84?3:code===78?4:255;
    if(out[i]===255)throw Error('DNA must contain only uppercase A/C/G/T/N.');
  }
  return out;
}
export function scoreSite(encoded,start,pwm=CTCF_PWM){
  if(start<0||start+pwm.length>encoded.length)throw Error('Site outside reference.');
  let plus=0,minus=0;
  for(let j=0;j<pwm.length;j++){
    const b=encoded[start+j];
    if(b>3)return {score:null,strand:null,reason:'ambiguous_N'};
    plus+=pwm.weights[j][b];
    minus+=pwm.weights[pwm.length-1-j][COMPLEMENT[b]];
  }
  return plus>=minus?{score:plus,strand:'+'}:{score:minus,strand:'-'};
}
export function scoreGenome(encoded,{pwm=CTCF_PWM,topK=50,minSeparation=250}={}){
  const n=encoded.length-pwm.length+1;
  if(n<1)throw Error('Reference shorter than motif.');
  const scores=new Float32Array(n);
  let validWindows=0,ambiguousWindows=0;
  const candidates=[];
  let floor=-Infinity;
  for(let i=0;i<n;i++){
    let plus=0,minus=0,ok=true;
    for(let j=0;j<pwm.length;j++){
      const b=encoded[i+j];
      if(b>3){ok=false;break;}
      plus+=pwm.weights[j][b];
      minus+=pwm.weights[pwm.length-1-j][COMPLEMENT[b]];
    }
    const score=ok?Math.max(plus,minus):-Infinity;
    scores[i]=score;
    if(!ok){ambiguousWindows++;continue;}
    validWindows++;
    if(score<=floor)continue;
    let nearby=-1;
    for(let k=0;k<candidates.length;k++){
      if(Math.abs(candidates[k].position0-i)<minSeparation){nearby=k;break;}
    }
    if(nearby>=0){
      if(score<=candidates[nearby].score)continue;
      candidates.splice(nearby,1);
    }
    candidates.push({position0:i,score});
    candidates.sort((a,b)=>b.score-a.score||a.position0-b.position0);
    if(candidates.length>topK)candidates.pop();
    if(candidates.length===topK)floor=candidates[candidates.length-1].score;
  }
  return {scores,topCandidates:candidates,validWindows,ambiguousWindows,modelLength:pwm.length};
}
export function maxScoreInInterval(scores,from,to){
  let best=-Infinity,index=-1;
  for(let i=Math.max(0,from);i<Math.min(scores.length,to);i++){
    if(scores[i]>best){best=scores[i];index=i;}
  }
  return index<0?null:{score:best,position0:index};
}
