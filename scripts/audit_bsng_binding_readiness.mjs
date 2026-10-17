/**
 * Read the existing public checkpoint, validate provenance, and issue
 * a defensible machine-readable *NOT-ASSESSABLE* BSNG binding readiness
 * report. Does not call synthetic DNA binding experiments or design a nanite.
 */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {evaluateBindingFeasibility} from '../src/lib/bsng-binding-feasibility-gate.mjs';
const registryUrl='https://raw.githubusercontent.com/jacquesjacobs77/BSNG-Mobile/bsng-v09-real-ctcf-checkpoints/grch38p14-natural-ctcf-v09/index.json';
const response=await fetch(registryUrl);
if(!response.ok)throw Error('Unable to obtain authentic GRCh38 checkpoint: HTTP '+response.status);
const registry=await response.json();
const result=evaluateBindingFeasibility({registry});
if(registry.coverage.completedBatches!==13||
   registry.coverage.completedOwnedBases!==130_000_000||
   registry.coverage.candidateCountVerified!==1_689)
 throw Error('Research baseline unexpectedly changed; do not publish a stale readiness gate');
if(result.physicalBindingStatus!=='NOT_ASSESSABLE'||
 result.nonHarmStatus!=='NOT_ASSESSABLE'||
 result.molecularPersistenceStatus!=='NOT_ASSESSABLE')
 throw Error('Binding-readiness output unsupported by available molecular evidence');
const out=process.env.BSNG_READINESS_DIR||'results/bsng-v11-readiness-evidence';
await mkdir(out,{recursive:true});
await writeFile(join(out,'binding-feasibility-current.json'),JSON.stringify({
 ...result,verifiedPublicRegistryUrl:registryUrl,
 generationType:'AUTHENTIC_REFERENCE_CHECKPOINT_AUDIT_WITHOUT_PHYSICAL_NANITE_EXPERIMENT',
 auditDateUTC:new Date().toISOString()
},null,2)+'\n');
console.log(JSON.stringify({
 gate:result.gate,
 archivedReferenceBases:result.sourceEvidence.referenceBasesProcessed,
 naturalCtcfMotifQualifiedCount:result.sourceEvidence.naturalCtcfMotifQualifiedCount,
 physicalBSNGBinding:result.physicalBindingStatus,
 nanitePersistence:result.molecularPersistenceStatus,
 genomicIntegrity:result.nonHarmStatus,
 nextScientificGate:result.nextGate,
 reportPath:join(out,'binding-feasibility-current.json'),
},null,2));
