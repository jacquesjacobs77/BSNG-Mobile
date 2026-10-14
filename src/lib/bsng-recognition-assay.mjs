/**
 * BSNG preclinical in-silico recognition screen, v0.1.
 * This is NOT a nanite-binding simulator. It tests an explicit exact-match
 * recognition assumption against sequence-composition-matched decoys.
 * Experimental binding measurements are required to assess the physical claim.
 */
export const ASSAY_VERSION = 'bsng-recognition-screen/0.1.0';
export const ASSAY_MAX_BASES = 5000;
export const ASSAY_MOTIF_BASES = 15;

export function reverseComplement(raw) {
  const motif = raw.toUpperCase();
  if (/[^ACGT]/.test(motif)) throw Error('Motif must contain only A/C/G/T.');
  const pairs = { A: 'T', T: 'A', C: 'G', G: 'C' };
  return [...motif].reverse().map(base => pairs[base]).join('');
}

function countBothStrands(sequence, motif) {
  const reverse = reverseComplement(motif);
  let hits = 0;
  const firstPositions = [];
  for (let i = 0; i <= sequence.length - motif.length; i++) {
    const window = sequence.slice(i, i + motif.length);
    if (window === motif || window === reverse) {
      hits++;
      if (firstPositions.length < 25) firstPositions.push(i);
    }
  }
  return { hits, firstPositions };
}

function createPrng(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x6D2B79F5;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function compositionMatchedControls(motif, count, seed) {
  const random = createPrng(seed);
  const exclude = new Set([motif, reverseComplement(motif)]);
  const controls = [];
  const source = [...motif];
  for (let attempt = 0; controls.length < count && attempt < count * 400; attempt++) {
    const candidate = source.slice();
    for (let i = candidate.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [candidate[i], candidate[j]] = [candidate[j], candidate[i]];
    }
    const shuffled = candidate.join('');
    if (!exclude.has(shuffled)) {
      exclude.add(shuffled);
      exclude.add(reverseComplement(shuffled));
      controls.push(shuffled);
    }
  }
  if (controls.length !== count) {
    throw Error('Cannot generate enough distinct composition-matched controls for this motif.');
  }
  return controls;
}

/**
 * Test an explicitly supplied hypothetical 15-base recognition motif.
 * The resulting p-value measures only sequence-match enrichment relative
 * to shuffled motifs; it is NOT a probability of nanite binding.
 */
export function runRecognitionScreen({ sequence, motif, controls = 32, seed = 1729, source = null }) {
  if (typeof sequence !== 'string' || typeof motif !== 'string') throw Error('Sequence and motif must be strings.');
  const input = sequence.replace(/\s+/g, '').toUpperCase();
  const target = motif.replace(/\s+/g, '').toUpperCase();
  if (!input || /[^ACGTN]/.test(input)) throw Error('Sequence must contain only A/C/G/T/N.');
  if (input.length < ASSAY_MOTIF_BASES || input.length > ASSAY_MAX_BASES) {
    throw Error('Sequence must be 15 to 5,000 bases for this initial screen.');
  }
  if (target.length !== ASSAY_MOTIF_BASES || /[^ACGT]/.test(target)) {
    throw Error('Supply an explicit 15-base A/C/G/T recognition motif.');
  }
  if (!Number.isInteger(controls) || controls < 1 || controls > 100) throw Error('Control count must be 1 to 100.');
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw Error('Seed must be a 32-bit unsigned integer.');

  const observed = countBothStrands(input, target);
  const decoys = compositionMatchedControls(target, controls, seed);
  const controlHits = decoys.map(decoy => countBothStrands(input, decoy).hits);
  const exceed = controlHits.filter(count => count >= observed.hits).length;
  return {
    schemaVersion: 1,
    assayVersion: ASSAY_VERSION,
    evidenceType: 'COMPUTATIONAL_SEQUENCE_MATCH_ONLY',
    interpretation: 'Exact motif matching is not physical nanite binding or an affinity measurement.',
    assumptions: ['exact 15-base recognition', 'either DNA strand', 'no mismatches', 'no chromatin or energy model'],
    source,
    parameters: { motif: target, seed, controls },
    sequenceLength: input.length,
    ambiguousBases: (input.match(/N/g) || []).length,
    observedMatchCount: observed.hits,
    firstObservedPositions0Based: observed.firstPositions,
    compositionMatchedControlMotifs: decoys,
    controlMatchCounts: controlHits,
    empiricalEnrichmentP: (1 + exceed) / (controls + 1),
    reproducibility: { sequence: input, source, parameterSet: {motif: target,seed,controls} },
  };
}
