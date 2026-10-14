import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { runRecognitionScreen, reverseComplement } from '../src/lib/bsng-recognition-assay.mjs';

// Synthetic fixture with target inserted deliberately. It validates the *code*,
// NOT BSNG's physical hypothesis. Do not publish as experimental evidence.
const motif = 'ACGTTGCACTAGTCA';
const sequence = 'T'.repeat(18) + motif + 'CCCCCC' + reverseComplement(motif) + 'N'.repeat(15);
const report = runRecognitionScreen({
  sequence, motif, controls:32, seed:1729,
  source:{ type:'SYNTHETIC_UNIT_TEST', assembly:null, chromosome:null, isExperimental:false },
});
const output = {
  ...report,
  evidenceStatus:'SOFTWARE_TEST_ONLY',
  sequenceSha256:createHash('sha256').update(report.reproducibility.sequence).digest('hex'),
  sourceCodeRevision:process.env.GITHUB_SHA || 'local-uncommitted',
};
await mkdir('artifacts', { recursive:true });
await writeFile('artifacts/bsng-synthetic-assay-fixture.json', JSON.stringify(output,null,2)+'\n');
console.log('Saved reproducible synthetic fixture:', output.observedMatchCount, 'exact matches; p=', output.empiricalEnrichmentP);
