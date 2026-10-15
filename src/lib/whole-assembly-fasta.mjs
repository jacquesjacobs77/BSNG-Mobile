/**
 * Random-access reader for an UNCOMPRESSED, indexed RefSeq FASTA.
 * A .fai file must be generated from the SAME FASTA (samtools faidx).
 * Byte-exact index permits reading up to 10M bases without loading 3Gb DNA.
 */
import {readFile,open} from 'node:fs/promises';
export async function loadFai(path){
 const body=await readFile(path,'utf8');const map=new Map();
 for(const row of body.trimEnd().split(/\r?\n/)){
  if(!row)continue;
  const fields=row.split('\t');
  if(fields.length<5)throw Error('FAI requires name length offset line_bases line_bytes');
  const [name,...numbers]=fields;
  const [length,offset,lineBases,lineBytes]=numbers.slice(0,4).map(Number);
  if(!name||map.has(name)||![length,offset,lineBases,lineBytes].every(Number.isSafeInteger)||
     length<1||offset<0||lineBases<1||lineBytes<lineBases||lineBytes>lineBases+2)
     throw Error('Invalid or duplicated FASTA index record: '+name);
  map.set(name,{length,offset,lineBases,lineBytes});
 }
 if(!map.size)throw Error('Empty FASTA index');
 return map;
}
export function verifyReferenceFai(plan,fai,{complete=true}={}){
 const missing=[],lengthMismatches=[];
 for(const seq of plan.sequences){
  const idx=fai.get(seq.refseqAccession);
  if(!idx){if(complete)missing.push(seq.refseqAccession);continue;}
  if(idx.length!==seq.length)lengthMismatches.push(seq.refseqAccession);
 }
 if(missing.length||lengthMismatches.length)throw Error('FASTA and GRCh38.p14 assembly report disagree: '+JSON.stringify({
  missing:missing.slice(0,5),lengthMismatches:lengthMismatches.slice(0,5),
  missingTotal:missing.length,mismatchTotal:lengthMismatches.length
 }));
 return true;
}
export async function readFastaInterval(fh,faiEntry,start1BasedInclusive,end1BasedInclusive){
 const idx=faiEntry;
 if(!idx||!Number.isSafeInteger(start1BasedInclusive)||!Number.isSafeInteger(end1BasedInclusive)||
    start1BasedInclusive<1||end1BasedInclusive<start1BasedInclusive||
    end1BasedInclusive>idx.length||end1BasedInclusive-start1BasedInclusive+1>10_000_200)
  throw Error('Invalid indexed FASTA bounds');
 const a=start1BasedInclusive-1,b=end1BasedInclusive-1;
 const position=x=>idx.offset+Math.floor(x/idx.lineBases)*idx.lineBytes+x%idx.lineBases;
 const begin=position(a),span=position(b)-begin+1;
 const buf=Buffer.allocUnsafe(span);
 let n=0;while(n<span){
  const {bytesRead}=await fh.read(buf,n,span-n,begin+n);
  if(bytesRead===0)throw Error('Truncated FASTA byte range');
  n+=bytesRead;
 }
 const dna=buf.toString('ascii').replace(/[\r\n]/g,'').toUpperCase();
 if(dna.length!==end1BasedInclusive-start1BasedInclusive+1||!/^[ACGTN]+$/.test(dna))
  throw Error('Reference FASTA sequence length/alphabet mismatch');
 return dna;
}
export async function withIndexedFasta(path,callback){
 const fh=await open(path,'r');
 try{return await callback(fh);}finally{await fh.close();}
}
