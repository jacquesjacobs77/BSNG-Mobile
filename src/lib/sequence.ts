/** Deterministic GC demonstration only; does not estimate nanite/DNA binding. */
export interface WindowGC { index: number; sequence: string; gcFraction: number }
export interface SequenceSummary { length: number; gcFraction: number; windowSize: number; topWindows: WindowGC[]; plotFractions: number[] }
export const DEMO_MAX_BASES = 5000;
export const DEMO_WINDOW_SIZE = 15;
export const SAMPLE_SEQUENCE = 'ATGTCGCTCACGGTCGTCAGCATGGCGTGCGTTGGGTTCTTCTTGCTGCAGGGGGCCTGATCGATCGATGCGCGATATATCGCGGCGTACGAT';
export function normalizeSequence(raw: string): string { return raw.replace(/\s+/g, '').toUpperCase(); }
export function calculateGC(sequence: string): number {
  if (!sequence.length) return 0;
  return [...sequence].filter(base => base === 'G' || base === 'C').length / sequence.length;
}
export function analyzeSequence(raw: string, windowSize = DEMO_WINDOW_SIZE): SequenceSummary {
  const sequence = normalizeSequence(raw);
  if (!Number.isInteger(windowSize) || windowSize < 1) throw Error('Invalid window size.');
  if (!sequence || /[^ACGT]/.test(sequence)) throw Error('Use only A, C, G and T.');
  if (sequence.length < windowSize) throw Error('Enter at least ' + windowSize + ' bases.');
  if (sequence.length > DEMO_MAX_BASES) throw Error('Local demo supports at most 5,000 bases.');
  const windows: WindowGC[] = [];
  let gc = 0;
  for (let i = 0; i < windowSize; i++) if (sequence[i] === 'G' || sequence[i] === 'C') gc++;
  for (let i = 0; i <= sequence.length - windowSize; i++) {
    if (i > 0) {
      if (sequence[i - 1] === 'G' || sequence[i - 1] === 'C') gc--;
      if (sequence[i + windowSize - 1] === 'G' || sequence[i + windowSize - 1] === 'C') gc++;
    }
    windows.push({index:i,sequence:sequence.slice(i,i+windowSize),gcFraction:gc/windowSize});
  }
  const topWindows = [...windows].sort((a,b)=>b.gcFraction-a.gcFraction||a.index-b.index).slice(0,5);
  const bins = Math.min(18,windows.length);
  const plotFractions = Array.from({length:bins},(_,bin)=>{
    const from=Math.floor(bin*windows.length/bins),to=Math.floor((bin+1)*windows.length/bins);
    const region=windows.slice(from,Math.max(from+1,to));
    return region.reduce((total,w)=>total+w.gcFraction,0)/region.length;
  });
  return {length:sequence.length,gcFraction:calculateGC(sequence),windowSize,topWindows,plotFractions};
}
