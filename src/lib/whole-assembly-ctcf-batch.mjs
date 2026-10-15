/**
 * Frozen, exploratory NATURAL CTCF motif screen. No nanite-specific binding model.
 * Every qualifying window is retained in gzipped NDJSON; NEVER use top-K
 * as an archival filter. Threshold 15 is an explicitly exploratory log2-odds
 * cutoff, NOT an affinity/probability/safety threshold.
 */
import {createHash} from 'node:crypto';
import {createWriteStream,createReadStream} from 'node:fs';
import {mkdir,readFile,rename,stat,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createGzip} from 'node:zlib';
import {once} from 'node:events';
import {finished,pipeline} from 'node:stream/promises';
import {CTCF_PFM,CTCF_REFERENCE,CTCF_PWM,encodeDNA} from './ctcf-reference-model.mjs';
import {readFastaInterval} from './whole-assembly-fasta.mjs';
const sha256=v=>createHash('sha256').update(v).digest('hex');
export const CTCF_SCREEN_POLICY=Object.freeze({
 model:'NATURAL_HUMAN_CTCF',matrixId:'MA0139.1',motifLength:CTCF_PWM.length,
 exploratoryThresholdLog2Odds:15,
 thresholdMeaning:'EXPLORATORY_SEQUENCE_MODEL_ONLY_NOT_BIOLOGICALLY_CALIBRATED',
 background:CTCF_REFERENCE.nucleotideBackground,pseudocount:CTCF_REFERENCE.pseudocount,
 sourceUrl:CTCF_REFERENCE.sourceUrl,modelPfmSha256:sha256(JSON.stringify(CTCF_PFM)),
});
const complement=[3,2,1,0];
export function scoreCtcfWindow(encoded,i,pwm=CTCF_PWM){
 let plus=0,minus=0;
 for(let k=0;k<pwm.length;k++){
  const b=encoded[i+k];
  if(b>3)return null;
  plus+=pwm.weights[k][b];
  minus+=pwm.weights[pwm.length-1-k][complement[b]];
 }
 return plus>=minus?{score:plus,strand:'+'}:{score:minus,strand:'-'};
}
async function hashFile(path){
 const h=createHash('sha256');
 for await(const chunk of createReadStream(path))h.update(chunk);
 return h.digest('hex');
}
export async function verifyBatchArtifacts(outputDir,batch,{model=CTCF_SCREEN_POLICY}={}){
 const reportPath=join(outputDir,batch.id+'.json'),candidatePath=join(outputDir,batch.id+'.candidates.ndjson.gz');
 const report=JSON.parse(await readFile(reportPath,'utf8'));
 if(report.batchId!==batch.id||report.status!=='VERIFIED_STORED'||
    report.contig!==batch.refseqAccession||report.track!==batch.track||
    report.start1BasedInclusive!==batch.start1BasedInclusive||
    report.end1BasedInclusive!==batch.end1BasedInclusive||
    report.ownedBases!==batch.ownedBases||
    report.modelPfmSha256!==model.modelPfmSha256||
    report.exploratoryThresholdLog2Odds!==model.exploratoryThresholdLog2Odds||
    report.validWindows+report.ambiguousWindows+report.terminalUnscorableStarts!==batch.ownedBases)
   throw Error('Invalid or inconsistent stored scientific batch receipt '+batch.id);
 const storedHash=await hashFile(candidatePath);
 if(storedHash!==report.compressedCandidateSha256)throw Error('Candidate artifact corruption '+batch.id);
 return report;
}
export async function scanCtcfBatch({fh,fai,batch,outputDir,planSha256,sourceFastaSha256,
 threshold=CTCF_SCREEN_POLICY.exploratoryThresholdLog2Odds,readBases=250000}){
 if(!batch||!/^B\d{6,}$/.test(batch.id)||batch.ownedBases>10000000||
   batch.ownedBases<1||batch.end1BasedInclusive-batch.start1BasedInclusive+1!==batch.ownedBases)
  throw Error('Invalid 10M-owned-base batch scope');
 if(!/^[a-f0-9]{64}$/.test(sourceFastaSha256)||!/^[a-f0-9]{64}$/.test(planSha256))
  throw Error('Full FASTA and assembly-plan SHA-256 are required before scanning');
 if(threshold!==CTCF_SCREEN_POLICY.exploratoryThresholdLog2Odds)
  throw Error('Threshold must match frozen exploratory model policy');
 if(!Number.isSafeInteger(readBases)||readBases<20||readBases>1000000)throw Error('Invalid streaming read size');
 const seq=fai.get(batch.refseqAccession);
 if(!seq||seq.length!==batch.contigLength)throw Error('Indexed FASTA reference missing or wrong length '+batch.refseqAccession);
 await mkdir(outputDir,{recursive:true});
 const output=join(outputDir,batch.id+'.candidates.ndjson.gz');
 const temporary=output+'.part';
 const zipped=createGzip({level:6}),fs=createWriteStream(temporary,{flags:'wx'});
 zipped.pipe(fs);
 const rawHash=createHash('sha256'),ownedHash=createHash('sha256');
 let candidateCount=0,valid=0,ambiguous=0,terminal=0,ns=0,maxScore=null;
 const hist={};
 try{
  for(let from=batch.start1BasedInclusive;from<=batch.end1BasedInclusive;from+=readBases){
   const to=Math.min(batch.end1BasedInclusive,from+readBases-1);
   const stop=Math.min(seq.length,to+CTCF_PWM.length-1);
   const dna=await readFastaInterval(fh,seq,from,stop),arr=encodeDNA(dna);
   const owned=to-from+1,ownedSeq=dna.slice(0,owned);
   ownedHash.update(ownedSeq,'ascii');
   ns+=(ownedSeq.match(/N/g)||[]).length;
   let outputBuffer='';
   for(let i=0;i<owned;i++){
    const genomicStart=from+i;
    if(genomicStart+CTCF_PWM.length-1>seq.length){terminal++;continue;}
    const v=scoreCtcfWindow(arr,i);
    if(!v){ambiguous++;continue;}
    valid++;
    const bucket=String(Math.floor(v.score));
    hist[bucket]=(hist[bucket]||0)+1;
    if(maxScore===null||v.score>maxScore)maxScore=v.score;
    if(v.score<threshold)continue;
    const row={
     candidateId:batch.id+'_'+genomicStart,
     refseqAssemblyAccession:'GCF_000001405.40',assembly:'GRCh38.p14',
     refseqAccession:batch.refseqAccession,track:batch.track,
     start1BasedInclusive:genomicStart,end1BasedInclusive:genomicStart+CTCF_PWM.length-1,
     strand:v.strand,referencePlusStrand19:dna.slice(i,i+CTCF_PWM.length),
     ctcfPwmLog2Odds:v.score,model:'JASPAR MA0139.1 natural CTCF',
     modelPfmSha256:CTCF_SCREEN_POLICY.modelPfmSha256,
     candidateQualification:'CTCF_LOG2_ODDS_AT_LEAST_15_EXPLORATORY_ONLY',
     bsngPhysicalBinding:'NOT_ASSESSABLE',integrationSafety:'NOT_ASSESSABLE'
    };
    candidateCount++;
    outputBuffer+=JSON.stringify(row)+'\n';
    if(outputBuffer.length>65536){
      rawHash.update(outputBuffer);
      if(!zipped.write(outputBuffer))await once(zipped,'drain');
      outputBuffer='';
    }
   }
   if(outputBuffer){rawHash.update(outputBuffer);if(!zipped.write(outputBuffer))await once(zipped,'drain');}
  }
  zipped.end();await finished(fs);
  if(valid+ambiguous+terminal!==batch.ownedBases)throw Error('Incomplete chromosome window coverage');
  await rename(temporary,output);
  const report={
   schemaVersion:1,status:'VERIFIED_STORED',scientificStatus:'NATURAL_REFERENCE_CTCF_SEQUENCE_ONLY',
   batchId:batch.id,planSha256,sourceFastaSha256,
   refseqAssemblyAccession:'GCF_000001405.40',
   track:batch.track,contig:batch.refseqAccession,
   start1BasedInclusive:batch.start1BasedInclusive,
   end1BasedInclusive:batch.end1BasedInclusive,contigLength:seq.length,
   ownedBases:batch.ownedBases,validWindows:valid,ambiguousWindows:ambiguous,
   terminalUnscorableStarts:terminal,ambiguousReferenceBases:ns,
   qualifyingCandidateCount:candidateCount,
   modelPfmSha256:CTCF_SCREEN_POLICY.modelPfmSha256,
   exploratoryThresholdLog2Odds:threshold,
   thresholdMeaning:CTCF_SCREEN_POLICY.thresholdMeaning,
   minimumNaturalCtcfPwmLog2Odds:threshold,
   maximumObservedNaturalCtcfPwmLog2Odds:maxScore,scoreFloorHistogram:hist,
   ownedReferenceUppercaseSha256:ownedHash.digest('hex'),
   uncompressedCandidateNdjsonSha256:rawHash.digest('hex'),
   compressedCandidateSha256:await hashFile(output),
   candidateArchiveFile:batch.id+'.candidates.ndjson.gz',
   actualBsngBinding:'NOT_ASSESSABLE',actualGenomicIntegration:'NOT_ASSESSABLE',
   codeCommit:process.env.BSNG_CODE_REVISION||'local-test-or-uncommitted',
   createdAt:new Date().toISOString(),
  };
  await writeFile(join(outputDir,batch.id+'.json.tmp'),JSON.stringify(report,null,2)+'\n');
  await rename(join(outputDir,batch.id+'.json.tmp'),join(outputDir,batch.id+'.json'));
  return await verifyBatchArtifacts(outputDir,batch);
 }catch(err){
  zipped.destroy();
  fs.destroy();
  await rm(temporary,{force:true}).catch(()=>{});
  throw err;
 }
}
