import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateBindingFeasibility,EVIDENCE_STATES}
 from '../src/lib/bsng-binding-feasibility-gate.mjs';
const sha='a'.repeat(64);
const ref=(id,n)=>({batchId:id,status:'VERIFIED_STORED',track:'A_CHROMOSOMES',
 contig:'NC_000001.11',refseqAssemblyAccession:'GCF_000001405.40',
 ownedBases:10_000_000,qualifyingCandidateCount:n,
 compressedCandidateSha256:sha,actualBsngBinding:'NOT_ASSESSABLE',
 actualGenomicIntegration:'NOT_ASSESSABLE'});
const mkIndex=()=>({
 campaignType:'REAL_REFERENCE',assembly:'GRCh38.p14',sourceFastaSha256:sha,
 scientificStatus:'NATURAL_CTCF_REFERENCE_COMPUTATION_NOT_BSNG_BINDING',
 status:'INCOMPLETE',id:'true-ncbi-campaign-fixture',
 receipts:[ref('B000001',277),ref('B000002',211),ref('B000003',196)],
 coverage:{completedBatches:3,completedOwnedBases:30_000_000,candidateCountVerified:684}
});
test('a proven real genome-reference scan is not a physical nanite-binding experiment',()=>{
 const r=evaluateBindingFeasibility({registry:mkIndex()});
 assert.equal(r.sourceEvidence.referenceBasesProcessed,30_000_000);
 assert.equal(r.sourceEvidence.naturalCtcfMotifQualifiedCount,684);
 assert.equal(r.physicalBindingStatus,EVIDENCE_STATES.NOT_ASSESSABLE);
 assert.equal(r.molecularPersistenceStatus,EVIDENCE_STATES.NOT_ASSESSABLE);
 assert.equal(r.nonHarmStatus,EVIDENCE_STATES.NOT_ASSESSABLE);
 assert.equal(r.nextGate,'PHYSICAL_MOLECULAR_IDENTITY_AND_RECOGNITION_MECHANISM');
 assert.ok(r.blockers.includes('CHARACTERIZED_PHYSICAL_RNA_PROTEIN_COMPLEX_REQUIRED'));
 assert.equal(r.scientificQuestions.length,7);
 assert.match(r.scientificSnapshotSha256,/^[a-f0-9]{64}$/);
});
test('named natural CTCF region does not become a nanite binding or insertion recommendation',()=>{
 const r=evaluateBindingFeasibility({registry:mkIndex(),site:{
  refseqAccession:'NC_000001.11',start1BasedInclusive:1001,end1BasedInclusive:1019
 }});
 assert.equal(r.selectedSite.naniteBindingSuitability,'NOT_ASSESSABLE');
 assert.equal(r.selectedSite.integrationSafety,'NOT_ASSESSABLE');
 assert.equal(r.physicalBindingStatus,'NOT_ASSESSABLE');
});
test('molecular identity without independently measured binding is not sufficient',()=>{
 const r=evaluateBindingFeasibility({registry:mkIndex(),construct:{
  physicalConstructId:'CHARACTERIZED-IDENTITY-EXAMPLE',
  rnaRecognitionComponentId:'RNA-COMPONENT-ID-EXAMPLE',
  proteinPeptideComponentId:'PROTEIN-COMPONENT-ID-EXAMPLE',
  characterizationRecord:'LAB-MATERIAL-IDENTITY-EXAMPLE'
 }});
 assert.equal(r.physicalConstructSpecified,true);
 assert.equal(r.submittedMeasurementClasses,0);
 assert.equal(r.physicalBindingStatus,'NOT_ASSESSABLE');
 assert.ok(r.blockers.includes('ALL_SEVEN_INDEPENDENT_MEASUREMENT_CLASSES_REQUIRED'));
});
test('even a purported independent external package is labeled not adjudicated, never auto-certified as safe',()=>{
 const construct={physicalConstructId:'a',rnaRecognitionComponentId:'b',
  proteinPeptideComponentId:'c',characterizationRecord:'d'};
 const reference=evaluateBindingFeasibility({registry:mkIndex(),construct});
 const evidence=Object.fromEntries(reference.scientificQuestions.map(q=>[q.id,{
   recordId:'R-'+q.id,primaryDataAccession:'DATA-'+q.id,
   assayType:'INDEPENDENT_MEASUREMENT',measurementUnit:'SI_UNITS_AS_APPROPRIATE',
   independentReviewRecord:'REVIEW-'+q.id
 }]));
 const result=evaluateBindingFeasibility({registry:mkIndex(),construct,evidence,
  review:{independentLabId:'LAB-ID',signedReviewReportAccession:'AUDIT-REF',
   blindedControlsRecord:'BLINDED-CONTROL-REF',uncertaintyAndReplicationReport:'REPRO-REF'}
 });
 assert.equal(result.submittedMeasurementClasses,7);
 assert.equal(result.independentLabReviewStatus,'EVIDENCE_PACKAGE_PRESENT_BUT_NOT_SCIENTIFICALLY_ADJUDICATED');
 assert.equal(result.physicalBindingStatus,'NOT_ASSESSABLE');
 assert.equal(result.nonHarmStatus,'NOT_ASSESSABLE');
 assert.equal(result.integrationSafetyStatus,'NOT_ASSESSABLE');
});
test('rejects corrupted reference reporting or false BSNG binding status',()=>{
 const index=mkIndex();index.receipts[1].actualBsngBinding='CONFIRMED';
 assert.throws(()=>evaluateBindingFeasibility({registry:index}),/illegally relabeled/);
 const x=mkIndex();x.coverage.candidateCountVerified=100000;
 assert.throws(()=>evaluateBindingFeasibility({registry:x}),/inconsistent/);
 const y=mkIndex();y.receipts.push(y.receipts[0]);y.coverage.completedBatches=4;
 assert.throws(()=>evaluateBindingFeasibility({registry:y}),/corrupted/);
});
test('rejects invalid genomic coordinates rather than fabricating site identity',()=>{
 assert.throws(()=>evaluateBindingFeasibility({registry:mkIndex(),site:{
  refseqAccession:'NC_000001.11',start1BasedInclusive:100,end1BasedInclusive:99
 }}),/exact reference accession/);
});
