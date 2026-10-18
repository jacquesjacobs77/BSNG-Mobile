import { readFileSync, writeFileSync } from 'node:fs';

// Optional cloud reviewer. It receives ONLY aggregated summary statistics, never DNA strings.
// Secret belongs to server-side GitHub Actions; never put it in Expo/mobile code.
const inputPath = process.argv[2] || 'bsng-lumen-research-results.json';
const outputPath = process.argv[3] || 'bsng-lumen-ai-review.json';
const raw = JSON.parse(readFileSync(inputPath, 'utf8'));
const reviewerInput = {
  engine: raw.engine,
  input: {origin: raw.input.origin, length_bp: raw.input.length_bp, genomic_coordinates: raw.input.genomic_coordinates},
  results: raw.results,
  known_external_references: raw.known_external_references,
  falsification_gates: raw.falsification_gates,
  verdict: raw.verdict,
};
const record = {generated_at_utc: new Date().toISOString(), model: null, status: 'NOT_CONNECTED',
  evidence_is_computational_only: true, question: 'What evidence supports, contradicts, or fails to test the BSNG thesis?',
  review: 'No remote AI reviewer configured. Four deterministic computational lanes and falsification gates remain available.'};
const token = process.env.BSNG_REVIEW_API_KEY;
const model = process.env.BSNG_REVIEW_MODEL;
if (token && model) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: controller.signal,
      headers: {Authorization: 'Bearer '+token, 'Content-Type': 'application/json'},
      body: JSON.stringify({model, store: false, max_output_tokens: 700,
        instructions: [
          'You are Lumen, a skeptical BSNG computational evidence reviewer, not a laboratory instrument.',
          'Use ONLY supplied aggregated statistics and source labels; never invent missing genome coordinates, physical binding constants, clinical validation, or positive experimental results.',
          'Separate demonstrated calculations, retrospective external reference results, untested assumptions, and falsification opportunities.',
          'Do not combine CTCF and TrueOT AUC values into hybrid binding predictions.',
          'Summarize limitations clearly, with a short checklist of independent physical experiments needed before thesis claims.',
        ].join(' '), input: JSON.stringify(reviewerInput)}),
    });
    if (!response.ok) throw new Error('Remote review HTTP '+response.status);
    const json = await response.json();
    const text = (json.output || []).flatMap(item => (item.content || []).filter(p=>p.type==='output_text').map(p=>p.text)).join('\n').trim();
    if (!text) throw new Error('Remote review contained no usable output text');
    record.status = 'MODEL_REVIEW_RETURNED';
    record.model = model;
    record.review = text.slice(0, 12000);
  } catch (error) {
    record.status = 'REVIEW_FAILED';
    record.review = error instanceof Error ? error.message.replaceAll(token, '[redacted]') : 'Remote review failed';
  } finally { clearTimeout(timeout); }
}
writeFileSync(outputPath, JSON.stringify(record, null, 2)+'\n');
console.log(JSON.stringify({status:record.status, output:outputPath}));
