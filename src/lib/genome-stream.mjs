/**
 * Memory-bounded public-reference DNA aggregator for up to 10M bases.
 * Processes validated A/C/G/T/N chunks without saving all windows or DNA.
 * Not a physical nanite interaction model.
 */
export const MAX_REGION_BASES = 10_000_000;

export function createGenomeAccumulator({ windowSize = 15, maxBases = MAX_REGION_BASES, topK = 5 } = {}) {
  if (!Number.isInteger(windowSize) || windowSize < 1 || windowSize > 1000) throw Error('Invalid window size.');
  if (!Number.isInteger(maxBases) || maxBases < windowSize || maxBases > MAX_REGION_BASES) throw Error('Invalid region limit.');
  if (!Number.isInteger(topK) || topK < 1 || topK > 100) throw Error('Invalid top-window limit.');

  let length = 0;
  let carry = '';
  let windowsExamined = 0;
  let windowsExcludedAmbiguous = 0;
  let chunksProcessed = 0;
  const counts = { A: 0, C: 0, G: 0, T: 0, N: 0 };
  const top = [];

  function addChunk(raw) {
    if (typeof raw !== 'string') throw Error('DNA chunk must be a string.');
    const chunk = raw.replace(/\s+/g,'').toUpperCase();
    if (!chunk.length) throw Error('Empty DNA chunk.');
    if (/[^ACGTN]/.test(chunk)) throw Error('Chunk contains an unsupported DNA base.');
    if (length + chunk.length > maxBases) throw Error('Region exceeds configured maximum bases.');

    const combined = carry + chunk;
    const globalStart = length - carry.length;
    for (const base of chunk) counts[base]++;

    if (combined.length >= windowSize) {
      let gc = 0, ambiguous = 0;
      for (let j = 0; j < windowSize; j++) {
        if (combined[j] === 'G' || combined[j] === 'C') gc++;
        if (combined[j] === 'N') ambiguous++;
      }
      for (let i = 0; i <= combined.length - windowSize; i++) {
        if (i > 0) {
          const left = combined[i - 1], right = combined[i + windowSize - 1];
          if (left === 'G' || left === 'C') gc--;
          if (right === 'G' || right === 'C') gc++;
          if (left === 'N') ambiguous--;
          if (right === 'N') ambiguous++;
        }
        if (ambiguous > 0) {
          windowsExcludedAmbiguous++;
        } else {
          windowsExamined++;
          if (top.length < topK || gc > top[top.length - 1].gcCount) {
            top.push({
              index0Based: globalStart + i,
              sequence: combined.slice(i, i + windowSize),
              gcCount: gc,
              gcFraction: gc / windowSize,
            });
            top.sort((a,b) => b.gcCount - a.gcCount || a.index0Based - b.index0Based);
            if (top.length > topK) top.pop();
          }
        }
      }
    }

    length += chunk.length;
    chunksProcessed++;
    carry = windowSize === 1 ? '' : combined.slice(-Math.min(windowSize - 1,combined.length));
    return { processedBases: length, fractionComplete: length / maxBases, chunksProcessed };
  }

  function summary() {
    const validBases = counts.A + counts.C + counts.G + counts.T;
    return {
      schemaVersion: 1, method:'COMPOSITION_ONLY_NOT_NANITE_BINDING',
      maxRegionBases:maxBases, length, chunksProcessed, windowSize,
      nucleotideCounts:{...counts}, validBases,
      gcFraction:validBases ? (counts.G + counts.C) / validBases : null,
      windowsExamined, windowsExcludedAmbiguous,
      topWindows:top.map(({gcCount,...entry})=>({...entry})),
      memoryNote:'Retains only the last windowSize-1 bases and topK window records.',
    };
  }

  return {addChunk, summary};
}
