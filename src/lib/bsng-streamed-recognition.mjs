/**
 * Constant-memory, strand-aware recognition-motif scanner for REAL genome chunks.
 * This is a sequence-only, falsifiable computational test, NOT nanite binding.
 */
import { ASSAY_VERSION, ASSAY_MOTIF_BASES, compositionMatchedControls, reverseComplement } from './bsng-recognition-assay.mjs';

function scanPattern(text, pattern, offset, positionLimit) {
  let count = 0, positions = [];
  for (let index = text.indexOf(pattern); index !== -1; index = text.indexOf(pattern, index + 1)) {
    count++;
    if (positions.length < positionLimit) positions.push(offset + index);
  }
  return {count, positions};
}

function scanPair(text, motif, offset, positionLimit = 0) {
  const direct = scanPattern(text,motif,offset,positionLimit);
  const complement = reverseComplement(motif);
  if (complement === motif) return direct;
  const reverse = scanPattern(text,complement,offset,positionLimit);
  return {
    count:direct.count+reverse.count,
    positions:direct.positions.concat(reverse.positions).sort((a,b)=>a-b).slice(0,positionLimit),
  };
}

export function createStreamedRecognitionAssay({ motif, controls=32, seed=1729, maxBases=10_000_000, positionsLimit=25 } = {}) {
  if (typeof motif !== 'string' || motif.length !== ASSAY_MOTIF_BASES || /[^ACGT]/.test(motif)) {
    throw Error('A pre-registered 15-base uppercase A/C/G/T recognition motif is required.');
  }
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('Invalid random seed.');
  if (!Number.isInteger(controls) || controls < 1 || controls > 100) throw Error('Control count must be 1 to 100.');
  if (!Number.isInteger(maxBases) || maxBases < ASSAY_MOTIF_BASES || maxBases > 10_000_000) throw Error('Invalid maxBases.');
  if (!Number.isInteger(positionsLimit) || positionsLimit < 0 || positionsLimit > 100) throw Error('Invalid positions limit.');
  const decoys = compositionMatchedControls(motif, controls, seed);
  const decoyCounts = new Array(decoys.length).fill(0);
  let observedCount = 0;
  let firstObservedPositions0Based = [];
  let carry = '';
  let length = 0;
  let chunkCount = 0;
  let ambiguousBases = 0;

  function addChunk(raw) {
    if (typeof raw !== 'string') throw Error('Chunk must be a string.');
    const chunk = raw.toUpperCase();
    if (!chunk || /[^ACGTN]/.test(chunk)) throw Error('Invalid A/C/G/T/N DNA chunk.');
    if (length + chunk.length > maxBases) throw Error('Assay exceeds maximum region length.');
    const combined = carry + chunk;
    const offset = length - carry.length;
    const result = scanPair(combined, motif, offset, positionsLimit);
    observedCount += result.count;
    firstObservedPositions0Based = firstObservedPositions0Based
      .concat(result.positions).sort((a,b)=>a-b).slice(0,positionsLimit);
    for (let i=0;i<decoys.length;i++) {
      decoyCounts[i] += scanPair(combined,decoys[i],offset).count;
    }
    ambiguousBases += (chunk.match(/N/g)||[]).length;
    length += chunk.length;
    chunkCount++;
    carry = combined.slice(-Math.min(ASSAY_MOTIF_BASES-1,combined.length));
    return {processedBases:length, chunksProcessed:chunkCount};
  }

  function summary() {
    if (length < ASSAY_MOTIF_BASES) throw Error('Insufficient sequence for assay.');
    const countAtLeastObserved=decoyCounts.filter(count=>count >= observedCount).length;
    return {
      schemaVersion:1, assayVersion:ASSAY_VERSION,
      evidenceType:'COMPUTATIONAL_EXACT_SEQUENCE_MATCH_ONLY',
      testedAssumption:'An unspecified hypothetical receptor exactly recognizes the fixed pre-selected 15-base motif on either DNA strand.',
      biologicalClaimSupported:false,
      limitations:[
        'No molecular nanite, physical binding, affinity, energy model, chromatin access, or cellular experiment.',
        'Sequence-preserving shuffled motifs provide a descriptive null, not independent binding measurements.',
        'Rare 15-base motifs may give zero matches in 10M bp, yielding an uninformative negative result.',
      ],
      parameters:{motif,controls,seed,positionsLimit,strands:'forward_and_reverse',mismatchesAllowed:0},
      sequenceLength:length,ambiguousBases,chunkCount,
      observedMatchCount:observedCount,
      firstObservedPositions0Based,
      decoyMotifs:decoys,
      decoyMatchCounts:decoyCounts,
      controlCountAtLeastObserved:countAtLeastObserved,
      empiricalEnrichmentP:(countAtLeastObserved+1)/(decoys.length+1),
      interpretation:observedCount===0
        ? 'Target motif was not observed in this reference interval. No evidence of motif-match enrichment.'
        : 'Observed exact motif matches are computational coincidences under the stated model; no physical nanite binding was measured.',
    };
  }

  return {addChunk,summary};
}
