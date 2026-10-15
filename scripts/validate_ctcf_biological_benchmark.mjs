/**
 * First real biological-reference benchmark of BSNG's generic motif-scoring software.
 * Natural CTCF protein, experimental K562 ChIP-seq peak intervals, Ensembl GRCh38.
 * This does not imply BSNG nanites physically bind or integrate into DNA.
 */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { CTCF_REFERENCE,CTCF_PFM,CTCF_PWM,encodeDNA,scoreGenome } from '../src/lib/ctcf-reference-model.mjs';
import { parseNarrowPeaks,evaluateCtcFObservedPeaks,decorateTopCtcFCandidates } from '../src/lib/ctcf-chipseq-benchmark.mjs';

const regionStart1=1_000_000;
const regionEnd1=10_999_999;
const regionBases=10_000_000;
const expectedSeqSha256='5bc91fa875ca7c069548838d1fef58a32d527d59211fb28c74331e1369f71953';
const expectedEncodeMd5='7828af6ccfcb579226ce54757b98f05b';
const fasta='artifacts/GRCh38-chrX-1000000-10999999-10M.fa.gz';
const fastaBytes=await readFile(fasta);
const lines=gunzipSync(fastaBytes).toString('ascii').trim().split(/\r?\n/);
if(!lines[0]?.startsWith('>BSNG|reference=GRCh38|'))throw Error('Wrong FASTA reference header.');
const sequence=lines.slice(1).join('').toUpperCase();
if(sequence.length!==regionBases)throw Error('Incomplete 10M human reference region.');
const seqHash=createHash('sha256').update(sequence,'ascii').digest('hex');
if(seqHash!==expectedSeqSha256)throw Error('Human-reference SHA256 changed from previously verified Ensembl 10M result.');
const encoded=encodeDNA(sequence);

async function fetchTrustedDataset(url,attempts=4){
  for(let attempt=1;attempt<=attempts;attempt++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),90_000);
    try{
      const response=await fetch(url,{headers:{'User-Agent':'BSNG-Research-Studio/0.4 (academic open-data validation)','Accept':'application/octet-stream'},signal:controller.signal});
      if(!response.ok){
        if((response.status===429||response.status>=500)&&attempt<attempts){
          await new Promise(resolve=>setTimeout(resolve,attempt*2500));
          continue;
        }
        throw Error(`External measurement download failed HTTP ${response.status} for ${url}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch(err){
      if(attempt===attempts)throw err;
      console.log('Retry public dataset:',String(err).slice(0,150));
      await new Promise(resolve=>setTimeout(resolve,2500*attempt));
    }finally{clearTimeout(timer);}
  }
  throw Error('Dataset download exhausted retries.');
}
const urls=[
  'https://www.encodeproject.org/files/ENCFF519CXF/@@download/ENCFF519CXF.bed.gz',
  'https://www.encodeproject.org/files/ENCFF519CXF/@@download/',
];
let peakBytes=null,downloadUrl=null,lastError=null;
for(const url of urls){
  try{
    const data=await fetchTrustedDataset(url);
    const digest=createHash('md5').update(data).digest('hex');
    if(digest!==expectedEncodeMd5)throw Error(`ENCODE released file MD5 mismatch: ${digest}`);
    peakBytes=data;downloadUrl=url;break;
  }catch(error){lastError=error;}
}
if(!peakBytes)throw lastError||Error('Failed to download released ENCODE peak data.');
const bedText=(peakBytes[0]===0x1f&&peakBytes[1]===0x8b?gunzipSync(peakBytes):peakBytes).toString('utf8');
const measuredPeaks=parseNarrowPeaks(bedText,'X',regionStart1,regionBases);
console.log('Verified released ENCODE experiment ENCSR000AKO, measured CTCF GRCh38 chrX peaks:',measuredPeaks.length);
if(measuredPeaks.length<10)throw Error('Insufficient measured CTCF peaks, refusing fabricated benchmark.');
const scan=scoreGenome(encoded,{pwm:CTCF_PWM,topK:50,minSeparation:250});
const validation=evaluateCtcFObservedPeaks({
  encoded,scores:scan.scores,peaks:measuredPeaks,refStart1:regionStart1,seed:1729,positiveLimit:150
});
const candidates=decorateTopCtcFCandidates(scan.topCandidates,encoded,measuredPeaks,regionStart1);
const originalResearch=JSON.parse(await readFile('artifacts/GRCh38-chrX-10M-report.json','utf8'));
if(originalResearch.fullSequenceSha256!==seqHash)throw Error('Genomic assay report and reference FASTA disagree.');
const report={
  schemaVersion:1,
  title:'BSNG natural CTCF DNA recognition model vs experimental human-cell CTCF ChIP-seq benchmark',
  evidenceTier:'REAL_HUMAN_GENOME_PLUS_INDEPENDENT_OBSERVATIONAL_BINDING_DATA',
  subject:'Natural human CTCF transcription factor, NOT a BSNG nanite',
  biologicalNaniteBindingDemonstrated:false,
  naniteIntegrationSafetyDemonstrated:false,
  sourceCodeCommit:process.env.GITHUB_SHA||'local',
  genome:{assembly:'GRCh38',chromosome:'X',start1BasedInclusive:regionStart1,end1BasedInclusive:regionEnd1,
    bases:regionBases,sha256:seqHash,ensemblSource:'https://rest.ensembl.org/sequence/region/human/'},
  recognitionModel:{
    matrixId:CTCF_REFERENCE.jasparMatrixId,source:CTCF_REFERENCE.sourceUrl,license:CTCF_REFERENCE.license,
    name:CTCF_REFERENCE.protein,profile:CTCF_PFM,
    pfmJsonSha256:createHash('sha256').update(JSON.stringify(CTCF_PFM)).digest('hex'),
    pseudocount:CTCF_REFERENCE.pseudocount,background:CTCF_REFERENCE.nucleotideBackground,
    width:CTCF_PWM.length,scoreUnits:'log2 odds over 0.25 base background',
    strands:'forward and reverse complement',modelMaxPossibleScore:CTCF_PWM.theoreticalMax,
  },
  experimentalDataset:{
    archive:'ENCODE',experiment:'ENCSR000AKO',cellType:'human K562 cell line',assay:'CTCF ChIP-seq',
    peakFile:'ENCFF519CXF',peakFilePage:CTCF_REFERENCE.encodePeakFilePage,downloadUrl,
    assembly:'GRCh38',peakFileMd5:expectedEncodeMd5,
    peakFileSha256:createHash('sha256').update(peakBytes).digest('hex'),
    measuredPeakCountInRegion:measuredPeaks.length,
    genomeCoordinateDefinition:'ENCODE BED 0-based half-open converted to 1-based inclusive report coordinates',
  },
  scan:{validWindows:scan.validWindows,excludedAmbiguousWindows:scan.ambiguousWindows,topCandidateCount:candidates.length},
  observedBiologicalBenchmark:validation,
  topNaturalCTCFRecognitionCandidates:candidates,
  limitations:[
    'Natural protein CTCF is a software/model benchmark only; no physical BSNG receptor or nanite was tested.',
    'JASPAR DNA motif is ChIP-seq derived, and training/peak study overlap has not been exhaustively excluded: external observational comparison, not certified independent held-out validation.',
    'Predicted motif locations without K562 ChIP support are not experimentally confirmed binding events.',
    'ChIP-seq peaks do not establish molecular affinity, biochemical kinetics, integration feasibility or safe insertion sites.',
    'K562 is a cultured cancer-derived cell line, not a universal normal human tissue.',
    'PWM log2 scores are not probabilities, clinical predictions or an actionable nanite target ranking.',
  ],
  reproducibility:{
    seed:1729,positiveSampler:'evenly-spaced coordinate subsampling of available peaks, max 150',
    negativeControls:'GC-matched non-peak genomic windows with 1kb exclusion padding',
    benchmarkProtocol:'docs/ctcf-biological-validation-v0.4.md',
    noModelFitToEncodePeaks:true,
    dependencies:'Node.js 22 built-in libraries; pinned JASPAR matrix MA0139.1',
  }
};
await writeFile('artifacts/GRCh38-chrX-10M-CTCF-biological-benchmark.json',JSON.stringify(report,null,2)+'\n');
await writeFile('artifacts/ENCODE-ENCFF519CXF-K562-CTCF-peaks.bed.gz',peakBytes);
await writeFile('artifacts/JASPAR-MA0139.1-CTCF-PFM.json',JSON.stringify({
  model:'JASPAR MA0139.1',source:CTCF_REFERENCE.sourceUrl,license:CTCF_REFERENCE.license,pfm:CTCF_PFM,
},null,2)+'\n');
console.log('CTCF BIOLOGICAL REFERENCE BENCHMARK COMPLETE', JSON.stringify({
  genomeBases:regionBases,ChIPPeakCount:measuredPeaks.length,
  matchedComparisonCount:validation.pairedSampleCount,AUC:validation.aucAgainstGcMatchedBackground,
  pairedWinRate:validation.pairedWinRate,topCandidates:candidates.length,
  firstCandidate:candidates[0]||null
}));
