/**
 * DETERMINISTIC SYNTHETIC SMALL ASSEMBLY for cross-job state tests only.
 * NOT authentic human genomic sequence; provenance explicitly says SYNTHETIC.
 * Generates a 3-track manifest and indexed FASTA on each new runner.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {parseAssemblyReport,planWholeAssembly} from '../src/lib/whole-assembly-manifest.mjs';
import {CTCF_PWM} from '../src/lib/ctcf-reference-model.mjs';
const output=process.env.BSNG_FIXTURE_ROOT||'/tmp/bsng-v09-handoff-fixture';
await mkdir(output,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const chromosomes=[...Array.from({length:22},(_,i)=>String(i+1)),'X','Y','MT'];
const records=chromosomes.map((name,i)=>({
 name,molecule:name,role:'assembled-molecule',unit:name==='MT'?'non-nuclear':'Primary Assembly',
 accession:name==='MT'?'NC_012920.1':'NC_'+String(i+1).padStart(6,'0')+'.11',
 length:name==='MT'?41:123
})).concat([
 {name:'TEST_UNLOCALIZED',molecule:'1',role:'unlocalized-scaffold',unit:'Primary Assembly',accession:'NW_000001.1',length:72},
 {name:'TEST_UNPLACED',molecule:'na',role:'unplaced-scaffold',unit:'Primary Assembly',accession:'NW_000002.1',length:46},
 {name:'TEST_ALT',molecule:'6',role:'alt-scaffold',unit:'ALT_REF_LOCI_1',accession:'NT_111111.1',length:80},
 {name:'TEST_PATCH',molecule:'1',role:'fix-patch',unit:'PATCHES',accession:'NW_999001.1',length:54},
]);
const rows=[
 '# Assembly name: GRCh38.p14',
 '# RefSeq assembly accession: GCF_000001405.40',
 '# THIS FILE IS SYNTHETIC AND MUST NEVER BE USED AS REAL HUMAN REFERENCE GENOMIC DATA',
 '# Sequence-Name\tSequence-Role\tAssigned-Molecule\tAssigned-Molecule-Location/Type\tGenBank-Accn\tRelationship\tRefSeq-Accn\tAssembly-Unit\tSequence-Length\tUCSC-style-name',
 ...records.map((s,i)=>[
  s.name,s.role,s.molecule,'Chromosome','CM_'+i+'.1','=',''+s.accession,
  s.unit,String(s.length),'na'
 ].join('\t')),''
].join('\n');
const plan=planWholeAssembly(parseAssemblyReport(rows),{maxBases:40});
const best19=CTCF_PWM.weights.map(w=>'ACGT'[Array.from(w).indexOf(Math.max(...w))]).join('');
const repeat=(str,len)=>str.repeat(Math.ceil(len/str.length)).slice(0,len);
let fasta='',fai='',offset=0;
for(const s of records){
 const header='>'+s.accession+' SYNTHETIC_TEST_ONLY\n';fasta+=header;offset+=Buffer.byteLength(header);
 let seq=repeat('ACGTGCCACTGA',s.length);
 const start=s.name==='1'?37:7;
 seq=seq.slice(0,start-1)+best19+seq.slice(start+18);
 const startOffset=offset;
 for(let i=0;i<seq.length;i+=50){
  const line=seq.slice(i,i+50)+'\n';
  fasta+=line;offset+=Buffer.byteLength(line);
 }
 fai+=[s.accession,s.length,startOffset,50,51].join('\t')+'\n';
}
const fastaName='synthetic-reference.fna';
await Promise.all([
 writeFile(join(output,'synthetic-assembly-report.txt'),rows),
 writeFile(join(output,'whole-assembly-plan.json'),JSON.stringify(plan,null,2)+'\n'),
 writeFile(join(output,fastaName),fasta),
 writeFile(join(output,fastaName+'.fai'),fai),
 writeFile(join(output,'fixture-source.json'),JSON.stringify({
  type:'SYNTHETIC_TEST_FIXTURE_NOT_REAL_HUMAN_REFERENCE',
  sourceFastaSha256:sha(fasta),planSha256:plan.planSha256,
  instructions:'Test GitHub release and Git-branch continuation semantics only. No physical binding or biological inference.'
 },null,2)+'\n')
]);
console.log(JSON.stringify({event:'SYNTHETIC_GENOMIC_HANDOFF_FIXTURE_READY_NOT_REAL_DNA',
 totalBatches:plan.totalBatches,refseqRecords:plan.totalSequences,
 sourceFastaSha256:sha(fasta),planSha256:plan.planSha256,output}));
