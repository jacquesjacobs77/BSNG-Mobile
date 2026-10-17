/**
 * BSNG Physical Binding Feasibility Gate (v1.1).
 *
 * Critically separates authentic reference-genome CTCF motif scoring from
 * physical binding of an uncharacterized RNA-guided / peptide-protein hybrid.
 * This module DOES NOT engineer a molecule or propose genomic insertion sites.
 *
 * A computational CTCF match CANNOT be promoted to a nanite DNA-binding claim.
 * External measurements remain labeled awaiting independent scientific review.
 */
import {createHash} from 'node:crypto';

export const BSNG_FEASIBILITY_GATE='BSNG_BINDING_FEASIBILITY_V1.1';
export const EVIDENCE_STATES=Object.freeze({
  NOT_ASSESSABLE:'NOT_ASSESSABLE',
  REFERENCE_SEQUENCE_VERIFIED:'REFERENCE_SEQUENCE_VERIFIED',
  NATURAL_CTCF_SEQUENCE_PREDICTION:'NATURAL_CTCF_SEQUENCE_PREDICTION',
  EVIDENCE_SUBMITTED_REQUIRES_EXTERNAL_REVIEW:'EVIDENCE_SUBMITTED_REQUIRES_EXTERNAL_REVIEW',
  INDEPENDENTLY_REVIEWED_MEASUREMENT:'INDEPENDENTLY_REVIEWED_MEASUREMENT',
});
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const isString=value=>typeof value==='string'&&value.trim().length>0;
const hasNamedSource=value=>value&&typeof value==='object'&&
  isString(value.recordId)&&isString(value.primaryDataAccession)&&
  isString(value.assayType)&&isString(value.measurementUnit)&&
  isString(value.independentReviewRecord);
const sourceCheck=(index)=>{
 if(!index||index.campaignType!=='REAL_REFERENCE'||
    index.assembly!=='GRCh38.p14'||
    index.scientificStatus!=='NATURAL_CTCF_REFERENCE_COMPUTATION_NOT_BSNG_BINDING'||
    !/^[a-f0-9]{64}$/.test(index.sourceFastaSha256||'')||
    !Array.isArray(index.receipts)||
    index.receipts.length!==index.coverage?.completedBatches||
    index.status!=='INCOMPLETE')
   throw Error('Scientific source checkpoint is not a valid authentic-reference computational registry');
 let coveredBases=0,qualifyingCandidates=0;
 const observedIds=new Set();
 for(const row of index.receipts){
  if(!row||observedIds.has(row.batchId)||row.status!=='VERIFIED_STORED'||
     row.actualBsngBinding!=='NOT_ASSESSABLE'||
     row.actualGenomicIntegration!=='NOT_ASSESSABLE'||
     !Number.isSafeInteger(row.ownedBases)||row.ownedBases<=0||
     !Number.isSafeInteger(row.qualifyingCandidateCount)||row.qualifyingCandidateCount<0||
     !/^[a-f0-9]{64}$/.test(row.compressedCandidateSha256||''))
    throw Error('Reference evidence missing/corrupted or illegally relabeled as physical BSNG binding');
  observedIds.add(row.batchId);
  coveredBases+=row.ownedBases;qualifyingCandidates+=row.qualifyingCandidateCount;
 }
 if(index.coverage.completedOwnedBases!==coveredBases||
    index.coverage.candidateCountVerified!==qualifyingCandidates)
   throw Error('Reference candidate accounting is inconsistent');
 return {coveredBases,qualifyingCandidates};
};
const questions=[
 {id:'H_RECOGNITION',title:'Specific recognition of human DNA',
  observable:'Molecular target-versus-control interaction, with controls and independent samples'},
 {id:'H_PERSISTENCE',title:'Binding lifetime and dissociation',
  observable:'Direct measured association/dissociation or residence time for the SAME physical complex'},
 {id:'H_SPECIFICITY',title:'Genome-wide selectivity and nonspecific association',
  observable:'Specificity measurements including off-target and negative comparator regions'},
 {id:'H_CONTEXT',title:'Biological genomic context',
  observable:'Cell-type-specific chromatin state, local regulatory context and genetic variation evidence'},
 {id:'H_GENOME_INTEGRITY',title:'DNA integrity after association',
  observable:'Independent DNA integrity/genotoxicity readouts with relevant controls and uncertainty'},
 {id:'H_FUNCTIONAL_PERTURBATION',title:'Normal genomic function under exposure',
  observable:'Cell-state-dependent gene expression, chromatin and functional measurements'},
 {id:'H_HYBRID_COUPLING',title:'RNA/protein-peptide joint behavior',
  observable:'Measured BOTH-component function compared with isolated-component controls'},
];
export function evaluateBindingFeasibility({registry,construct=null,site=null,
  evidence={},review={}}){
 const {coveredBases,qualifyingCandidates}=sourceCheck(registry);
 if(site!==null&&(!site||typeof site!=='object'||
    !isString(site.refseqAccession)||
    !Number.isSafeInteger(site.start1BasedInclusive)||
    !Number.isSafeInteger(site.end1BasedInclusive)||
    site.start1BasedInclusive<1||site.end1BasedInclusive<site.start1BasedInclusive))
  throw Error('Site must be null or exact reference accession and 1-based-inclusive coordinates');
 // A *specified* component is not yet a physically tested DNA-binding system.
 const constructDefined=Boolean(construct&&
  isString(construct.physicalConstructId)&&
  isString(construct.rnaRecognitionComponentId)&&
  isString(construct.proteinPeptideComponentId)&&
  isString(construct.characterizationRecord));
 const raw=questions.map(q=>{
  const submitted=evidence[q.id];
  const accepted=constructDefined&&hasNamedSource(submitted);
  return {
   id:q.id,title:q.title,
   evidenceStatus:accepted?
      EVIDENCE_STATES.EVIDENCE_SUBMITTED_REQUIRES_EXTERNAL_REVIEW:
      EVIDENCE_STATES.NOT_ASSESSABLE,
   requiredMeasurement:q.observable,
   primaryDataAccession:accepted?submitted.primaryDataAccession:null,
   assayType:accepted?submitted.assayType:null,
   noEvidenceReason:!constructDefined?
    'PHYSICAL_HYBRID_RNA_PROTEIN_CONSTRUCT_NOT_CHARACTERIZED':
    accepted?null:'NO_TRACEABLE_INDEPENDENT_MEASUREMENT',
  };
 });
 const evidenceSubmitted=raw.filter(x=>x.evidenceStatus===EVIDENCE_STATES.EVIDENCE_SUBMITTED_REQUIRES_EXTERNAL_REVIEW).length;
 // Independent-review can be recorded but must never be self-certified by the
 // module: a stored review record is a necessary artifact, not proof of truth.
 const externallyReviewable=Boolean(constructDefined&&
   raw.every(q=>q.evidenceStatus===EVIDENCE_STATES.EVIDENCE_SUBMITTED_REQUIRES_EXTERNAL_REVIEW)&&
   isString(review.independentLabId)&&
   isString(review.signedReviewReportAccession)&&
   isString(review.blindedControlsRecord)&&
   isString(review.uncertaintyAndReplicationReport));
 const blockers=[
  ...(!constructDefined?['CHARACTERIZED_PHYSICAL_RNA_PROTEIN_COMPLEX_REQUIRED']:[]),
  ...(evidenceSubmitted!==questions.length?['ALL_SEVEN_INDEPENDENT_MEASUREMENT_CLASSES_REQUIRED']:[]),
  ...(!externallyReviewable?['QUALIFIED_INDEPENDENT_LAB_REVIEW_REQUIRED']:[]),
 ];
 const snapshot={
  schemaVersion:1,gate:BSNG_FEASIBILITY_GATE,
  purpose:'TEST_IF_A_DEFINED_BSNG_COMPLEX_BINDS_PERSISTS_AND_SPARES_GENOMIC_FUNCTION',
  sourceEvidence:{
    class:EVIDENCE_STATES.REFERENCE_SEQUENCE_VERIFIED,
    assembly:registry.assembly,genomeSourceSha256:registry.sourceFastaSha256,
    campaignId:registry.id,batchesVerified:registry.coverage.completedBatches,
    referenceBasesProcessed:coveredBases,
    naturalCtcfMotifQualifiedCount:qualifyingCandidates,
    ctcfStatus:EVIDENCE_STATES.NATURAL_CTCF_SEQUENCE_PREDICTION,
    genomeCampaignCompletion:'INCOMPLETE',
  },
  selectedSite:site?{...site,
   naniteBindingSuitability:EVIDENCE_STATES.NOT_ASSESSABLE,
   integrationSafety:EVIDENCE_STATES.NOT_ASSESSABLE}:null,
  physicalConstructSpecified:constructDefined,
  physicalConstructId:constructDefined?construct.physicalConstructId:null,
  physicalBindingStatus:EVIDENCE_STATES.NOT_ASSESSABLE,
  molecularPersistenceStatus:EVIDENCE_STATES.NOT_ASSESSABLE,
  nonHarmStatus:EVIDENCE_STATES.NOT_ASSESSABLE,
  integrationSafetyStatus:EVIDENCE_STATES.NOT_ASSESSABLE,
  independentLabReviewStatus:externallyReviewable?
   'EVIDENCE_PACKAGE_PRESENT_BUT_NOT_SCIENTIFICALLY_ADJUDICATED':
   'NOT_READY',
  submittedMeasurementClasses:evidenceSubmitted,
  scientificQuestions:raw,
  nextGate:!constructDefined?'PHYSICAL_MOLECULAR_IDENTITY_AND_RECOGNITION_MECHANISM':
    evidenceSubmitted!==questions.length?'INDEPENDENT_CONTROLLED_BINDING_AND_SAFETY_MEASUREMENTS':
    'INDEPENDENT_BLINDED_REPLICATION_AND_EVIDENCE_REVIEW',
  blockers,
  interpretation:'CTCF motif hits are findings about natural human CTCF sequence preference, not verified BSNG nanite targets; the physical hypothesis cannot be decided by reference scanning.',
  allNaniteSafetyClaimsForbidden:true,
 };
 return {...snapshot,scientificSnapshotSha256:digest(snapshot)};
}
