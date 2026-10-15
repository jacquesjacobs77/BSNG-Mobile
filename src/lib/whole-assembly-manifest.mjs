/**
 * GRCh38.p14 whole-assembly manifest from the official NCBI assembly report.
 * Track A: 1–22, X, Y, MT assembled molecules
 * Track B: other PRIMARY ASSEMBLY records (unlocalized/unplaced)
 * Track C: ALT and PATCH sequence representations (NOT independent loci)
 * Exact scope is recorded; never describe an unfinished track as complete.
 */
import {createHash} from 'node:crypto';
export const MAX_OWNED_BASES=10_000_000;
export const PRIMARY_CHROMOSOMES=[...Array.from({length:22},(_,i)=>String(i+1)),'X','Y','MT'];
export const ASSEMBLY_REPORT_URL='https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/405/GCF_000001405.40_GRCh38.p14/GCF_000001405.40_GRCh38.p14_assembly_report.txt';
export const EXPECTED_ASSEMBLY='GCF_000001405.40';
const hash=x=>createHash('sha256').update(x).digest('hex');
const safeInt=v=>Number.isSafeInteger(v)&&v>0;
export function parseAssemblyReport(text){
 if(typeof text!=='string'||!text.includes('# Sequence-Name')||
    !text.includes('GRCh38.p14')||!text.includes(EXPECTED_ASSEMBLY))
    throw Error('Not an authenticated-content GRCh38.p14 assembly report; accession/name missing');
 const records=[],accessions=new Set(),names=new Set();
 const rows=text.split(/\r?\n/).filter(x=>x&&!x.startsWith('#'));
 for(const row of rows){
   const columns=row.split('\t');
   if(columns.length!==10)throw Error('Assembly report has unexpected column count.');
   const [sequenceName,sequenceRole,molecule,moleculeType,genbankAccession,relationship,
     refseqAccession,assemblyUnit,sequenceLength,ucscName]=columns;
   const length=Number(sequenceLength);
   if(!safeInt(length)||!refseqAccession||refseqAccession==='na'||accessions.has(refseqAccession))
      throw Error('Invalid or duplicate RefSeq accession/length: '+refseqAccession);
   accessions.add(refseqAccession);
   let track;
   if(assemblyUnit==='Primary Assembly'){
     if(sequenceRole==='assembled-molecule'&&PRIMARY_CHROMOSOMES.includes(molecule))track='A_CHROMOSOMES';
     else track='B_REMAINING_PRIMARY';
   }else track='C_ALTERNATES_PATCHES';
   const record={track,sequenceName,sequenceRole,assignedMolecule:molecule,
     assignedMoleculeType:moleculeType,genbankAccession,relationship,refseqAccession,
     assemblyUnit,length,ucscName,biologicallyDistinctLocus:track!=='C_ALTERNATES_PATCHES'};
   if(track==='A_CHROMOSOMES'&&names.has(molecule))throw Error('Duplicate primary assembled molecule '+molecule);
   if(track==='A_CHROMOSOMES')names.add(molecule);
   records.push(record);
 }
 if(records.length<25)throw Error('Incomplete assembly report: fewer than 25 records');
 for(const chr of PRIMARY_CHROMOSOMES)if(!names.has(chr))throw Error('Missing primary reference chromosome '+chr);
 records.sort((a,b)=>{
  const ai=['A_CHROMOSOMES','B_REMAINING_PRIMARY','C_ALTERNATES_PATCHES'].indexOf(a.track),
        bi=['A_CHROMOSOMES','B_REMAINING_PRIMARY','C_ALTERNATES_PATCHES'].indexOf(b.track);
  if(ai!==bi)return ai-bi;
  if(ai===0)return PRIMARY_CHROMOSOMES.indexOf(a.assignedMolecule)-PRIMARY_CHROMOSOMES.indexOf(b.assignedMolecule);
  return a.refseqAccession.localeCompare(b.refseqAccession);
 });
 return {assembly:'GRCh38.p14',refseqAssemblyAccession:EXPECTED_ASSEMBLY,
  reportSha256:hash(text),reportSourceUrl:ASSEMBLY_REPORT_URL,records};
}
export function planWholeAssembly(parsed,{maxBases=MAX_OWNED_BASES}={}){
 if(!Number.isSafeInteger(maxBases)||maxBases<1||maxBases>MAX_OWNED_BASES)
   throw Error('Each batch must own 1 to 10,000,000 bases');
 if(parsed?.refseqAssemblyAccession!==EXPECTED_ASSEMBLY||
   !Array.isArray(parsed.records)||!parsed.reportSha256)throw Error('Unfrozen assembly report');
 const batches=[],trackTotals={};
 for(const seq of parsed.records){
  if(!safeInt(seq.length)||!seq.refseqAccession||!seq.track)throw Error('Invalid contig');
  const total=trackTotals[seq.track]??{sequences:0,bases:0,batches:0};
  total.sequences++;total.bases+=seq.length;
  for(let start=1;start<=seq.length;start+=maxBases){
   const end=Math.min(seq.length,start+maxBases-1);
   const id='B'+String(batches.length+1).padStart(6,'0');
   batches.push({id,track:seq.track,sequenceName:seq.sequenceName,refseqAccession:seq.refseqAccession,
    assignedMolecule:seq.assignedMolecule,sequenceRole:seq.sequenceRole,
    assemblyUnit:seq.assemblyUnit,
    start1BasedInclusive:start,end1BasedInclusive:end,ownedBases:end-start+1,
    contigLength:seq.length,completionStatus:'PLANNED'});
   total.batches++;
  }
  trackTotals[seq.track]=total;
 }
 // Extra checksum is over the frozen ordered batch contract, not a DNA file hash.
 const planHash=hash(JSON.stringify({assembly:parsed.refseqAssemblyAccession,
   reportSha256:parsed.reportSha256,maxBases,
   batches:batches.map(x=>[x.id,x.refseqAccession,x.start1BasedInclusive,x.end1BasedInclusive])}));
 return {schemaVersion:1,kind:'BSNG_GRCH38_P14_WHOLE_ASSEMBLY_CAMPAIGN_PLAN',
  scientificStatus:'NATURAL_REFERENCE_COMPUTATION_ONLY',
  refseqAssemblyAccession:parsed.refseqAssemblyAccession,assembly:parsed.assembly,
  assemblyReportSourceUrl:parsed.reportSourceUrl,
  assemblyReportSha256:parsed.reportSha256,planSha256:planHash,
  maximumOwnedBasesPerBatch:maxBases,coordinateConvention:'1-based inclusive',
  trackSequenceCounts:Object.fromEntries(Object.entries(trackTotals).map(([k,v])=>[k,v.sequences])),
  trackTotals,totalSequences:parsed.records.length,totalOwnedBases:parsed.records.reduce((n,x)=>n+x.length,0),
  totalBatches:batches.length,
  targetScopes:{A_CHROMOSOMES:'chr1–22, X, Y, MT chromosome-level references',
   B_REMAINING_PRIMARY:'primary unlocalized/unplaced and other additional primary',
   C_ALTERNATES_PATCHES:'alternative loci and patches; non-independent representation'},
  limitations:[
   'Processing every RefSeq reference representation is not the same as measuring every unique human haplotype.',
   'NCBI assembly report is metadata; source FASTA bytes and per-record lengths must be independently checked.',
   'No physical BSNG RNA-protein hybrid has been characterized for binding or integration safety.',
  ],
  sequences:parsed.records,batches};
}
export function verifyPlan(plan){
 if(plan?.schemaVersion!==1||!Array.isArray(plan.batches)||!Array.isArray(plan.sequences)||
    !/^[a-f0-9]{64}$/.test(plan.planSha256))throw Error('Invalid plan schema');
 const expected=planWholeAssembly({
  refseqAssemblyAccession:plan.refseqAssemblyAccession,assembly:plan.assembly,
  reportSha256:plan.assemblyReportSha256,reportSourceUrl:plan.assemblyReportSourceUrl,records:plan.sequences
 },{maxBases:plan.maximumOwnedBasesPerBatch});
 if(expected.planSha256!==plan.planSha256||
   expected.totalOwnedBases!==plan.totalOwnedBases||
   expected.totalBatches!==plan.totalBatches||
   JSON.stringify(expected.batches)!==JSON.stringify(plan.batches))throw Error('Tampered or incomplete whole-genome plan');
 return true;
}
