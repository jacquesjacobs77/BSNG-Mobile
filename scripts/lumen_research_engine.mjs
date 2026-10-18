import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

const ENGINE = 'lumen-research-engine-v0.1';
const BASES = 'ACGT';
const WINDOW = 15;
const MAX_BASES = 5000;
const SAMPLE = 'ATGCGGATCGATCGGCCATTAACGGCTTAGCCGTAGCTAGGCTACCTAGCTAACGTTAGCGATCGTACGT';

function fractionGC(seq) { return (seq.match(/[GC]/g) || []).length / seq.length; }
function complement(seq) { return seq.split('').reverse().map(c => ({ A: 'T', T: 'A', C: 'G', G: 'C' })[c]).join(''); }
function profile(seq) {
  let gc = (seq.slice(0, WINDOW).match(/[GC]/g) || []).length;
  let max = -1, min = WINDOW + 1;
  const high = [], low = [];
  for (let i = 0; i <= seq.length - WINDOW; i++) {
    if (i > 0) gc += Number('GC'.includes(seq[i + WINDOW - 1])) - Number('GC'.includes(seq[i - 1]));
    if (gc > max) { max = gc; high.length = 0; high.push(i); }
    else if (gc === max && high.length < 5) high.push(i);
    if (gc < min) { min = gc; low.length = 0; low.push(i); }
    else if (gc === min && low.length < 5) low.push(i);
  }
  return { window_bases: WINDOW, max_gc_fraction: max / WINDOW, min_gc_fraction: min / WINDOW,
    high_gc_local_offsets_0_based: high, low_gc_local_offsets_0_based: low,
    caveat: 'GC extrema and local offsets are not gene annotations, binding sites or safe integration targets.' };
}
function shuffled(seq, seed) {
  let state = seed >>> 0;
  const array = seq.split('');
  for (let i = array.length - 1; i > 0; i--) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    const j = (state >>> 0) % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.join('');
}
function calculate(lane, seq) {
  if (lane === 'composition') {
    const counts = Object.fromEntries(BASES.split('').map(b => [b, (seq.match(new RegExp(b, 'g')) || []).length]));
    return { length_bp: seq.length, base_counts: counts, gc_fraction: fractionGC(seq), at_fraction: 1 - fractionGC(seq) };
  }
  if (lane === 'windows') return profile(seq);
  if (lane === 'strand_qc') {
    const reverse = complement(seq);
    return { double_reverse_complement_matches: complement(reverse) === seq,
      gc_fraction_reverse_complement: fractionGC(reverse),
      forward_reverse_gc_equal: Math.abs(fractionGC(seq) - fractionGC(reverse)) < 1e-12,
      caveat: 'Strand symmetry is a code integrity check, not biological validation.' };
  }
  if (lane === 'composition_null') {
    const observed = profile(seq).max_gc_fraction;
    const distribution = [];
    for (let i = 0; i < 64; i++) distribution.push(profile(shuffled(seq, 1729 + i)).max_gc_fraction);
    return { seed: 1729, permutations: 64, null_model: 'mononucleotide-shuffle (composition-preserving)',
      observed_max_gc_fraction: observed,
      null_mean_max_gc_fraction: distribution.reduce((a,b)=>a+b,0) / distribution.length,
      empirical_tail_fraction: (1 + distribution.filter(x => x >= observed).length) / (distribution.length + 1),
      caveat: 'Exploratory sequence-composition null only; not a binding, clinical, or genome-wide significance test.' };
  }
  throw new Error('Unknown lane');
}
function guardInput(input) {
  const sequence = input.replace(/^>[^\n]*\n/gm, '').replace(/\s/g, '').toUpperCase();
  if (sequence.length < WINDOW || sequence.length > MAX_BASES || /[^ACGT]/.test(sequence))
    throw new Error('Require a non-identifying A/C/G/T sequence of 15–5,000 bases. Reject ambiguous bases.');
  return sequence;
}
function launch(lane, sequence) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: { lane, sequence } });
    let settled = false;
    worker.once('message', result => { settled = true; resolve(result); });
    worker.once('error', reject);
    worker.once('exit', code => { if (!settled) reject(new Error('Research lane '+lane+' exited '+code)); });
  });
}
export async function runResearch(sequence, origin='synthetic_demo') {
  const normalized = guardInput(sequence);
  const tasks = ['composition', 'windows', 'strand_qc', 'composition_null'];
  const start = Date.now();
  const outputs = await Promise.all(tasks.map(async lane => [lane, await launch(lane, normalized)]));
  const lanes = Object.fromEntries(outputs);
  return {
    schema_version: 1, engine: ENGINE, generated_at_utc: new Date().toISOString(),
    input: { origin, length_bp: normalized.length,
      sha256: createHash('sha256').update(normalized).digest('hex'),
      genomic_coordinates: null, patient_sequence_retained: false },
    execution: { mode: 'four_parallel_worker_threads', elapsed_ms: Date.now() - start, lanes_completed: tasks },
    results: lanes,
    known_external_references: {
      trueot_spcas9: { status: 'RETROSPECTIVE_EXTERNAL_REFERENCE', eligible_rows: 1579, eligible_guides: 33, macro_guide_auc: 0.7946374362465487 },
      ctcf_protein: { status: 'SEPARATE_RETROSPECTIVE_REFERENCE', descriptive_auc: 0.8702221074380165 },
      combination_prohibited: true,
    },
    falsification_gates: {
      binding_affinity: 'NOT_ASSESSABLE', physical_hybrid: 'NOT_ASSESSABLE',
      genome_integration: 'NOT_ASSESSABLE', therapeutic_effect: 'NOT_ASSESSABLE',
      failed_controls: Object.entries(lanes.strand_qc).filter(([key,value])=>key.endsWith('_matches')||key.endsWith('_equal')).some(([,v])=>v === false),
    },
    verdict: 'INSUFFICIENT_EVIDENCE_TO_PROVE_OR_DISPROVE_BSNG',
    disclaimer: 'Sequence composition statistics and limited shuffled controls do not predict or validate synthetic nanites, genomic insertion, or therapeutic efficacy.',
  };
}
if (!isMainThread) {
  try { parentPort.postMessage(calculate(workerData.lane, workerData.sequence)); }
  catch (error) { throw error; }
} else if (process.argv[1] && import.meta.url === new URL('file://' + process.argv[1]).href) {
  const args = process.argv.slice(2);
  const option = name => { const at = args.indexOf(name); return at < 0 ? null : args[at + 1]; };
  const inputPath = option('--fasta');
  const outputPath = option('--out') || 'bsng-lumen-research-results.json';
  try {
    const result = await runResearch(inputPath ? readFileSync(inputPath, 'utf8') : SAMPLE, inputPath ? 'operator_supplied_local_fasta' : 'bundled_synthetic_demo');
    writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');
    process.stdout.write(JSON.stringify({ output: outputPath, verdict: result.verdict, lanes: result.execution.lanes_completed,
      length_bp: result.input.length_bp, input_sha256: result.input.sha256 }) + '\n');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
