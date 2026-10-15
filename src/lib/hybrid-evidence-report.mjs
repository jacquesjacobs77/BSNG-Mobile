/**
 * BSNG evidence report contract, v0.4.
 * Scientific interpretation only. No DNA targeting, wet-lab design, gene editing,
 * physical binding or molecular engineering is implemented in this module.
 */
export const HYBRID_REPORT_VERSION='bsng-hybrid-evidence/0.4.0';
export const MODULES=Object.freeze(['rnaRecognition','proteinRecognition','hybridInteraction','genomicIntegration']);
export const EVIDENCE_STATES=Object.freeze([
  'NOT_ASSESSABLE',
  'COMPUTATIONAL_PREDICTION_ONLY',
  'REFERENCE_SYSTEM_OBSERVATION',
  'EXPERIMENTALLY_OBSERVED_FOR_BSNG',
  'DISCONFIRMED',
]);
const PHYSICAL_STATES=new Set(['EXPERIMENTALLY_OBSERVED_FOR_BSNG','DISCONFIRMED']);
const REFERENCE_STATES=new Set(['REFERENCE_SYSTEM_OBSERVATION']);

function requireText(text,label){
  if(typeof text!=='string'||!text.trim())throw Error(label+' must be nonempty text.');
  return text;
}
export function createHybridEvidenceReport({
  runId,reference,sourceCommit,protocolId,
  rnaRecognition={},proteinRecognition={},hybridInteraction={},genomicIntegration={},
  candidates=[],
}){
  requireText(runId,'runId');
  requireText(sourceCommit,'sourceCommit');
  requireText(protocolId,'protocolId');
  if(!reference||typeof reference!=='object')throw Error('Reference provenance is required.');
  for(const name of ['assembly','species','chromosome','sequenceSha256'])requireText(reference[name],name);
  if(!Number.isSafeInteger(reference.start1BasedInclusive)||!Number.isSafeInteger(reference.end1BasedInclusive)||
    reference.start1BasedInclusive<1||reference.end1BasedInclusive<reference.start1BasedInclusive){
    throw Error('Invalid 1-based inclusive genomic coordinates.');
  }
  if(!/^[a-f0-9]{64}$/i.test(reference.sequenceSha256))throw Error('Reference SHA-256 must contain 64 hexadecimal digits.');
  const moduleData={rnaRecognition,proteinRecognition,hybridInteraction,genomicIntegration};
  const results={};
  for(const id of MODULES){
    const current=moduleData[id];
    if(!current||typeof current!=='object')throw Error('Module '+id+' must be an object.');
    const state=current.state||'NOT_ASSESSABLE';
    if(!EVIDENCE_STATES.includes(state))throw Error('Unsupported evidence state '+state+' for '+id+'.');
    const evidence=current.evidence||[];
    if(!Array.isArray(evidence)||evidence.some(e=>typeof e!=='string'||!e.trim()))throw Error('Evidence must be source identifiers.');
    if((PHYSICAL_STATES.has(state)||REFERENCE_STATES.has(state))&&evidence.length===0){
      throw Error(id+' requires a traceable evidence source for this state.');
    }
    if(PHYSICAL_STATES.has(state)&&!current.physicalConstructId){
      throw Error(id+' requires measured physical construct identity for a BSNG-specific experimental claim.');
    }
    if(id==='hybridInteraction'&&state==='EXPERIMENTALLY_OBSERVED_FOR_BSNG'&&
      (moduleData.rnaRecognition?.state!=='EXPERIMENTALLY_OBSERVED_FOR_BSNG'||
       moduleData.proteinRecognition?.state!=='EXPERIMENTALLY_OBSERVED_FOR_BSNG')){
      throw Error('Joint BSNG experimental recognition cannot be asserted without independently evidenced constituent modules.');
    }
    results[id]={
      state,evidence:[...evidence],
      physicalConstructId:current.physicalConstructId??null,
      finding:current.finding??null,
      limitations:current.limitations??[],
      interpretation:state==='NOT_ASSESSABLE'
       ? 'No sufficiently characterized physical BSNG mechanism/measurement is available.'
       : (current.interpretation||null),
    };
  }
  if(!Array.isArray(candidates))throw Error('Candidates must be an array.');
  const reportedCandidates=candidates.map((c,index)=>{
    if(!c||typeof c!=='object'||!Number.isSafeInteger(c.start1BasedInclusive)||
      !Number.isSafeInteger(c.end1BasedInclusive)||c.start1BasedInclusive<reference.start1BasedInclusive||
      c.end1BasedInclusive>reference.end1BasedInclusive||
      c.end1BasedInclusive<c.start1BasedInclusive)throw Error('Candidate '+index+' coordinates outside tested reference.');
    if(!['+','-'].includes(c.strand))throw Error('Candidate strand must be + or -.');
    return {...c,biologicalBSNGBindingProven:false,integrationSafetyEstablished:false};
  });
  return {
    schemaVersion:1,
    reportVersion:HYBRID_REPORT_VERSION,
    nature:'RESEARCH_EVIDENCE_RECORD_NOT_A_BIOLOGICAL_INTERVENTION_DESIGN',
    runId,protocolId,sourceCommit,
    reference:{...reference,coordinateConvention:'1-based inclusive'},
    modules:results,
    candidates:reportedCandidates,
    claimsBoundary:{
      humanReferenceGenomeMeansPhysicalBinding:false,
      naturalProteinReferenceMeansBSNGPhysicalRecognition:false,
      sequenceRecognitionMeansSafeGenomicIntegration:false,
      biologicalExperimentRequiredForBSNGClaims:true,
    },
  };
}
