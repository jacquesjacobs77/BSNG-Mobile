import test from 'node:test';
import assert from 'node:assert/strict';
import {createHybridEvidenceReport,HYBRID_REPORT_VERSION,MODULES} from '../src/lib/hybrid-evidence-report.mjs';

const basis={
  runId:'demo-run-001',sourceCommit:'a'.repeat(40),protocolId:'hybrid-v0.4',
  reference:{
    species:'Homo sapiens',assembly:'GRCh38',chromosome:'X',
    start1BasedInclusive:1_000_000,end1BasedInclusive:10_999_999,
    sequenceSha256:'5bc91fa875ca7c069548838d1fef58a32d527d59211fb28c74331e1369f71953',
  }
};
test('by default all four evidence modules are NOT ASSESSABLE',()=>{
  const result=createHybridEvidenceReport(basis);
  assert.equal(result.reportVersion,HYBRID_REPORT_VERSION);
  assert.deepEqual(Object.keys(result.modules),[...MODULES]);
  assert.ok(Object.values(result.modules).every(r=>r.state==='NOT_ASSESSABLE'));
  assert.equal(result.claimsBoundary.sequenceRecognitionMeansSafeGenomicIntegration,false);
});
test('known natural protein reference can be reported without claiming BSNG hybrid binding',()=>{
  const result=createHybridEvidenceReport({...basis,
    proteinRecognition:{state:'REFERENCE_SYSTEM_OBSERVATION',evidence:['JASPAR MA0139.1','ENCODE ENCSR000AKO'],finding:{auc:0.8702221074380165}},
    candidates:[{start1BasedInclusive:8743317,end1BasedInclusive:8743335,strand:'+',label:'natural CTCF motif'}]});
  assert.equal(result.modules.proteinRecognition.state,'REFERENCE_SYSTEM_OBSERVATION');
  assert.equal(result.modules.hybridInteraction.state,'NOT_ASSESSABLE');
  assert.equal(result.modules.rnaRecognition.state,'NOT_ASSESSABLE');
  assert.equal(result.candidates[0].biologicalBSNGBindingProven,false);
  assert.equal(result.candidates[0].integrationSafetyEstablished,false);
});
test('without real evidence no module can claim experimental validation',()=>{
  assert.throws(()=>createHybridEvidenceReport({...basis,
    rnaRecognition:{state:'EXPERIMENTALLY_OBSERVED_FOR_BSNG'}}),/traceable evidence/);
  assert.throws(()=>createHybridEvidenceReport({...basis,
    rnaRecognition:{state:'EXPERIMENTALLY_OBSERVED_FOR_BSNG',evidence:['placeholder']} }),/physical construct/);
});
test('combined experimental status requires independently evidenced constituent modules',()=>{
  assert.throws(()=>createHybridEvidenceReport({...basis,
    hybridInteraction:{state:'EXPERIMENTALLY_OBSERVED_FOR_BSNG',evidence:['assay'],physicalConstructId:'hypothetical'}}),
    /independently evidenced/);
});
test('invalid genomic coordinates and missing provenance are not silently accepted',()=>{
  assert.throws(()=>createHybridEvidenceReport({...basis,
    reference:{...basis.reference,sequenceSha256:'not-a-hash'}}),/SHA-256/);
  assert.throws(()=>createHybridEvidenceReport({...basis,
    candidates:[{start1BasedInclusive:12,end1BasedInclusive:30,strand:'+'}]}),/outside tested reference/);
});
