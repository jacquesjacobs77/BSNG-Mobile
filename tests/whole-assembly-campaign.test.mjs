import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,unlink,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';
import {open} from 'node:fs/promises';
import {parseAssemblyReport,planWholeAssembly,verifyPlan,PRIMARY_CHROMOSOMES} from '../src/lib/whole-assembly-manifest.mjs';
import {CTCF_PWM} from '../src/lib/ctcf-reference-model.mjs';
import {loadFai,verifyReferenceFai,readFastaInterval} from '../src/lib/whole-assembly-fasta.mjs';
import {CTCF_SCREEN_POLICY,scanCtcfBatch,verifyBatchArtifacts}
 from '../src/lib/whole-assembly-ctcf-batch.mjs';
import {campaignCoverage,runWholeGenomeCampaign}
 from '../src/lib/whole-assembly-coordinator.mjs';
import {freezeOfficialFasta,expectedNcbiMd5} from '../src/lib/whole-assembly-source-provenance.mjs';

const sha=x=>createHash('sha256').update(x).digest('hex');
const best19=CTCF_PWM.weights.map(col=>'ACGT'[Array.from(col).indexOf(Math.max(...col))]).join('');
const repeat=(seq,n)=>seq.repeat(Math.ceil(n/seq.length)).slice(0,n);
const fixtureRows=PRIMARY_CHROMOSOMES.map((chr,i)=>({
 name:chr,role:'assembled-molecule',molecule:chr,
 accession:chr==='MT'?'NC_012920.1':'NC_'+String(i+1).padStart(6,'0')+'.11',
 length:chr==='MT'?93:109,unit:chr==='MT'?'non-nuclear':'Primary Assembly'
})).concat([
 {name:'chr1-unlocal',role:'unlocalized-scaffold',molecule:'1',accession:'NW_000001.1',length:79,unit:'Primary Assembly'},
 {name:'unplaced',role:'unplaced-scaffold',molecule:'na',accession:'NW_000002.1',length:89,unit:'Primary Assembly'},
 {name:'ALT_A',role:'alt-scaffold',molecule:'6',accession:'NT_111111.1',length:101,unit:'ALT_REF_LOCI_1'},
 {name:'PATCH_A',role:'fix-patch',molecule:'1',accession:'NW_999001.1',length:98,unit:'PATCHES'},
]);
function createReport(){
 return [
 '# Assembly name: GRCh38.p14',
 '# RefSeq assembly accession: GCF_000001405.40',
 '# Sequence-Name\tSequence-Role\tAssigned-Molecule\tAssigned-Molecule-Location/Type\tGenBank-Accn\tRelationship\tRefSeq-Accn\tAssembly-Unit\tSequence-Length\tUCSC-style-name',
 ...fixtureRows.map((x,i)=>[
  x.name,x.role,x.molecule,'Chromosome','CM_'+i+'.1','=',''+x.accession,x.unit,String(x.length),'na'
 ].join('\t')),''
 ].join('\n');
}
async function makeFixture(){
 const root=await mkdtemp(join(tmpdir(),'bsng-whole-genome-'));
 const fasta=join(root,'reference.fna'),fai=join(root,'reference.fna.fai');
 let body='',index='',offset=0;
 const expected=new Map();
 for(const seq of fixtureRows){
  const header='>'+seq.accession+' TEST public-reference-only genome fixture\n';
  offset+=Buffer.byteLength(header);body+=header;
  let sequence=repeat('GCGCTATATGCTA',seq.length);
  // ensure explicit high-scoring 19-mers, including across the 40/41 split
  const site=seq.name==='1'?37:seq.name==='ALT_A'?30:3;
  sequence=sequence.slice(0,site-1)+best19+sequence.slice(site+18);
  expected.set(seq.accession,sequence);
  const start=offset;
  for(let i=0;i<sequence.length;i+=50){
    const line=sequence.slice(i,i+50)+'\n';
    body+=line;offset+=Buffer.byteLength(line);
  }
  index+=[seq.accession,seq.length,start,50,51].join('\t')+'\n';
 }
 await writeFile(fasta,body);
 await writeFile(fai,index);
 return {root,fasta,fai,sha:sha(body),expected};
}
const getPlan=(maxBases=40)=>planWholeAssembly(parseAssemblyReport(createReport()),{maxBases});
test('GRCh38 assembly plan includes A chromosomes, B remaining primary, C alternate patches, exact chromosome scope',()=>{
 const plan=getPlan();
 assert.equal(plan.trackTotals.A_CHROMOSOMES.sequences,25);
 assert.equal(plan.trackTotals.B_REMAINING_PRIMARY.sequences,2);
 assert.equal(plan.trackTotals.C_ALTERNATES_PATCHES.sequences,2);
 assert.equal(plan.totalSequences,29);
 assert.equal(plan.totalOwnedBases,fixtureRows.reduce((s,x)=>s+x.length,0));
 assert.ok(plan.batches.every(b=>b.ownedBases<=40&&b.ownedBases>0));
 assert.ok(plan.sequences.filter(x=>x.track==='C_ALTERNATES_PATCHES').every(x=>!x.biologicallyDistinctLocus));
 assert.ok(plan.batches.some(x=>x.refseqAccession==='NC_012920.1'));
 assert.equal(verifyPlan(plan),true);
 const broken=structuredClone(plan);broken.batches[1].start1BasedInclusive=12;
 assert.throws(()=>verifyPlan(broken),/Tampered/);
});
test('rejects mislabeled, truncated or incorrectly constructed assembly reports and batch policy',()=>{
 assert.throws(()=>parseAssemblyReport(createReport().replace('GRCh38.p14','T2T-CHM13')),/Not an authenticated-content/);
 assert.throws(()=>parseAssemblyReport(createReport().replace('NC_000001.11','NC_000002.11')),/duplicate/i);
 assert.throws(()=>planWholeAssembly(parseAssemblyReport(createReport()),{maxBases:10000001}),/10,000,000/);
});
test('FAI random access is exact across lines, 1-based and chromosome boundaries',async t=>{
 const fx=await makeFixture();t.after(()=>rm(fx.root,{recursive:true,force:true}));
 const fai=await loadFai(fx.fai),plan=getPlan();
 assert.equal(verifyReferenceFai(plan,fai),true);
 const file=await open(fx.fasta,'r');
 try{
  const idx=fai.get(fixtureRows[0].accession);
  assert.equal(await readFastaInterval(file,idx,40,70),fx.expected.get(fixtureRows[0].accession).slice(39,70));
  assert.equal(await readFastaInterval(file,idx,1,idx.length),fx.expected.get(fixtureRows[0].accession));
  await assert.rejects(()=>readFastaInterval(file,idx,109,110),/Invalid indexed/);
 }finally{await file.close();}
 const damaged=new Map(fai);damaged.get('NW_000001.1').length=999;
 assert.throws(()=>verifyReferenceFai(plan,damaged),/disagree/);
});
test('boundary ownership captures motif starting before 10M-style split and never duplicates candidate',async t=>{
 const fx=await makeFixture();t.after(()=>rm(fx.root,{recursive:true,force:true}));
 const plan=getPlan(),fai=await loadFai(fx.fai);
 const batches=plan.batches.filter(x=>x.refseqAccession==='NC_000001.11');
 const folder=join(fx.root,'read-small');
 const file=await open(fx.fasta,'r');
 try{
  const reports=[];
  for(const b of batches)reports.push(await scanCtcfBatch({fh:file,fai,batch:b,outputDir:folder,
   planSha256:plan.planSha256,sourceFastaSha256:fx.sha,readBases:21}));
  const candidates=[];
  for(const b of batches){
   const bytes=await readFile(join(folder,b.id+'.candidates.ndjson.gz'));
   candidates.push(...gunzipSync(bytes).toString().trim().split('\n').filter(Boolean).map(JSON.parse));
  }
  assert.ok(candidates.some(c=>c.start1BasedInclusive===37));
  assert.equal(candidates.filter(c=>c.start1BasedInclusive===37).length,1);
  assert.ok(candidates.every(c=>c.bsngPhysicalBinding==='NOT_ASSESSABLE'));
  assert.equal(reports.reduce((n,x)=>n+x.ownedBases,0),fixtureRows[0].length);
  assert.equal(reports.reduce((n,x)=>n+x.validWindows+x.ambiguousWindows+x.terminalUnscorableStarts,0),fixtureRows[0].length);
  assert.equal(reports.reduce((n,x)=>n+x.terminalUnscorableStarts,0),18);
 }finally{await file.close()}
});
test('arbitrary source-read chunk sizes never alter candidate eligibility or model observations',async t=>{
 const fx=await makeFixture();t.after(()=>rm(fx.root,{recursive:true,force:true}));
 const plan=getPlan(),fai=await loadFai(fx.fai),batch=plan.batches[0];
 const fh=await open(fx.fasta,'r');
 try{
  const a=await scanCtcfBatch({fh,fai,batch,planSha256:plan.planSha256,
    sourceFastaSha256:fx.sha,readBases:20,outputDir:join(fx.root,'small')});
  const b=await scanCtcfBatch({fh,fai,batch,planSha256:plan.planSha256,
    sourceFastaSha256:fx.sha,readBases:40,outputDir:join(fx.root,'large')});
  assert.equal(a.validWindows,b.validWindows);
  assert.equal(a.ambiguousWindows,b.ambiguousWindows);
  assert.equal(a.qualifyingCandidateCount,b.qualifyingCandidateCount);
  assert.equal(a.uncompressedCandidateNdjsonSha256,b.uncompressedCandidateNdjsonSha256);
  assert.equal(a.ownedReferenceUppercaseSha256,b.ownedReferenceUppercaseSha256);
 }finally{await fh.close()}
});
test('verified campaign resumes in order, heals receipt-before-ledger interruption, reaches EXACT three-track coverage',async t=>{
 const fx=await makeFixture();t.after(()=>rm(fx.root,{recursive:true,force:true}));
 const plan=getPlan(60),outputDir=join(fx.root,'campaign');
 const opts={plan,referenceFasta:fx.fasta,referenceFai:fx.fai,expectedFastaSha256:fx.sha,outputDir,readBases:35};
 const first=await runWholeGenomeCampaign({...opts,maxBatches:1});
 assert.equal(first.completedThisInvocation,1);
 assert.equal(first.coverage.status,'INCOMPLETE');
 assert.equal(first.nextBatchId,plan.batches[1].id);
 // Force a simulated receipt/ledger crash: persist second batch receipt directly
 // without ledger. Reconciliation must count and not repeat it on restart.
 const fh=await open(fx.fasta,'r');
 try{await scanCtcfBatch({fh,fai:await loadFai(fx.fai),batch:plan.batches[1],
  outputDir:join(outputDir,'receipts'),planSha256:plan.planSha256,sourceFastaSha256:fx.sha,readBases:40});}
 finally{await fh.close();}
 const resume=await runWholeGenomeCampaign({...opts,maxBatches:1});
 assert.equal(resume.completedThisInvocation,1);
 assert.equal(resume.coverage.completedBatches,3);
 assert.equal(resume.nextBatchId,plan.batches[3].id);
 const all=await runWholeGenomeCampaign({...opts,maxBatches:plan.totalBatches});
 assert.equal(all.coverage.status,'COMPLETE');
 assert.equal(all.coverage.completedBatches,plan.totalBatches);
 assert.equal(all.coverage.completedOwnedBases,plan.totalOwnedBases);
 for(const tr of Object.values(all.coverage.coverageByTrack))assert.equal(tr.coveredFraction,1);
 assert.equal(all.nextBatchId,null);
 const again=await runWholeGenomeCampaign({...opts,maxBatches:3});
 assert.equal(again.completedThisInvocation,0);
 assert.equal(again.coverage.status,'COMPLETE');
 const ledger=JSON.parse(await readFile(join(outputDir,'campaign-ledger.json'),'utf8'));
 assert.equal(ledger.completedBatchIds.length,plan.totalBatches);
 assert.equal(ledger.coverage.status,'COMPLETE');
 assert.ok(ledger.coverage.candidateCountVerified>0);
});
test('GenBank-only rows are explicitly listed and block claims of whole-assembly representation completion',()=>{
 const extra='GCA_ONLY\tunlocalized-scaffold\t11\tChromosome\tKI270721.1\tna\tna\tPrimary Assembly\t100316\tna\n';
 const parsed=parseAssemblyReport(createReport()+extra);
 assert.equal(parsed.excludedSequences.length,1);
 assert.equal(parsed.excludedSequences[0].genbankAccession,'KI270721.1');
 const plan=planWholeAssembly(parsed,{maxBases:50});
 assert.equal(plan.excludedGenbankOnlySequenceCount,1);
 assert.equal(plan.excludedGenbankOnlyBases,100316);
 assert.equal(verifyPlan(plan),true);
 const covered=plan.batches.map(x=>({batchId:x.id,planSha256:plan.planSha256,
  contig:x.refseqAccession,ownedBases:x.ownedBases,
  validWindows:x.ownedBases,ambiguousWindows:0,terminalUnscorableStarts:0,
  qualifyingCandidateCount:0}));
 const status=campaignCoverage(plan,covered);
 assert.equal(status.status,'REFSEQ_SCOPE_COMPLETE_GENBANK_ONLY_REMAIN');
 assert.equal(status.allAssemblyReportRepresentationsComplete,false);
 assert.equal(status.excludedGenbankOnlyBases,100316);
});
test('unverified partial candidate output is safely recomputed rather than blocking resume',async t=>{
 const fx=await makeFixture();t.after(()=>rm(fx.root,{recursive:true,force:true}));
 const plan=getPlan(),dir=join(fx.root,'crash-recovery');
 await mkdir(dir,{recursive:true});
 const batch=plan.batches[0],path=join(dir,batch.id+'.candidates.ndjson.gz.part');
 await writeFile(path,'PARTIAL UNVERIFIED DATA MUST NEVER COUNT');
 const file=await open(fx.fasta,'r');
 try{
  const result=await scanCtcfBatch({fh:file,fai:await loadFai(fx.fai),batch,
   outputDir:dir,planSha256:plan.planSha256,sourceFastaSha256:fx.sha,readBases:20});
  assert.equal(result.status,'VERIFIED_STORED');
  assert.equal(result.validWindows+result.ambiguousWindows+result.terminalUnscorableStarts,batch.ownedBases);
  await assert.rejects(()=>readFile(path),{code:'ENOENT'});
 }finally{await file.close()}
});
test('pinned FASTA hash mismatch blocks source, corrupt receipt cannot be silently skipped, concurrent lock is rejected',async t=>{
 const fx=await makeFixture();t.after(()=>rm(fx.root,{recursive:true,force:true}));
 const plan=getPlan(),outputDir=join(fx.root,'campaign');
 const opts={plan,referenceFasta:fx.fasta,referenceFai:fx.fai,outputDir,readBases:30};
 await assert.rejects(()=>runWholeGenomeCampaign({...opts,expectedFastaSha256:'0'.repeat(64),maxBatches:1}),/does not match pinned/);
 const a=await runWholeGenomeCampaign({...opts,expectedFastaSha256:fx.sha,maxBatches:1});
 assert.equal(a.completedThisInvocation,1);
 const dir=join(outputDir,'receipts');
 assert.equal((await verifyBatchArtifacts(dir,plan.batches[0])).status,'VERIFIED_STORED');
 const path=join(dir,plan.batches[0].id+'.candidates.ndjson.gz');
 await writeFile(path,'tampered');
 await assert.rejects(()=>runWholeGenomeCampaign({...opts,expectedFastaSha256:fx.sha,maxBatches:1}),/corruption/);
});

test('trusted official MD5 listing and decompressed SHA256 must match before genome FASTA can be frozen',async t=>{
 const fx=await makeFixture();t.after(()=>rm(fx.root,{recursive:true,force:true}));
 const zipped=join(fx.root,'GCF_000001405.40_GRCh38.p14_genomic.fna.gz');
 const raw=await readFile(fx.fasta),packed=gzipSync(raw);
 await writeFile(zipped,packed);
 const md5=createHash('md5').update(packed).digest('hex');
 const listing=md5+'  ./GCF_000001405.40_GRCh38.p14_genomic.fna.gz\\n';
 const official='https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/405/GCF_000001405.40_GRCh38.p14/GCF_000001405.40_GRCh38.p14_genomic.fna.gz';
 assert.equal(expectedNcbiMd5(listing),md5);
 assert.throws(()=>expectedNcbiMd5(listing+listing),/exactly one/);
 const inputs={plan:getPlan(),gzipPath:zipped,fastaPath:fx.fasta,
  faiPath:fx.fai,officialMd5Listing:listing,officialSourceUrl:official};
 const freeze=await freezeOfficialFasta(inputs);
 assert.equal(freeze.status,'FASTA_SOURCE_VERIFIED_LOCALLY_NOT_YET_GENOME_SCANNED');
 assert.equal(freeze.fullUncompressedFastaSha256,fx.sha);
 assert.equal(freeze.refseqSequencesPresent,29);
 await assert.rejects(()=>freezeOfficialFasta({...inputs,officialMd5Listing:'0'.repeat(32)+'  ./GCF_000001405.40_GRCh38.p14_genomic.fna.gz\\n'}),/differs from official/);
 await writeFile(fx.fasta,Buffer.concat([raw,Buffer.from('\\nTAMPERED')]));
 await assert.rejects(()=>freezeOfficialFasta(inputs),/differs from validated NCBI gzip decompression/);
});
