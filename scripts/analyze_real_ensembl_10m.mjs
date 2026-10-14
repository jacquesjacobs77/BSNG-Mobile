/**
 * Fetch a REAL, published GRCh38 human reference region from Ensembl REST.
 * This is reference-genome composition analysis, NOT evidence of nanite binding.
 * Designed for GitHub Actions (networked) because phone is not required to
 * download or retain 10,000,000 bases in a text field.
 */
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { once } from 'node:events';
import { finished } from 'node:stream/promises';
import { createGenomeAccumulator, MAX_REGION_BASES } from '../src/lib/genome-stream.mjs';

const chromosome = 'X';
const start = 1_000_000; // 1-based, inclusive
const length = MAX_REGION_BASES;
const end = start + length - 1;
const chunkSize = 1_000_000;
const ensembl = 'https://rest.ensembl.org';
const region = `${chromosome}:${start}..${end}:1`;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function ensemblChunk(from, to) {
  const interval = `${chromosome}:${from}..${to}:1`;
  const url = `${ensembl}/sequence/region/human/${interval}?content-type=application/json`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    let response;
    try {
      response = await fetch(url, {
        headers: {'Accept':'application/json', 'User-Agent':'BSNG-Research-Studio/0.3 (public reference analysis)'},
        signal:controller.signal,
      });
      if (!response.ok) {
        if ((response.status === 429 || response.status >= 500) && attempt < 5) {
          const retryAfter = Number(response.headers.get('retry-after'));
          await wait(Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(retryAfter * 1000, 60_000) : Math.min(3_000 * attempt, 20_000));
          continue;
        }
        throw Error(`Ensembl request ${interval} failed with HTTP ${response.status}: ${(await response.text()).slice(0,160)}`);
      }
      const data = await response.json();
      const sequence = data?.seq;
      if (typeof sequence !== 'string' || sequence.length !== to - from + 1 || /[^ACGTN]/i.test(sequence)) {
        throw Error(`Invalid Ensembl sequence content/length for ${interval}`);
      }
      const referenceId = data.id;
      if (typeof referenceId !== 'string' || !referenceId.startsWith('chromosome:GRCh38:X:') ||
          !referenceId.includes(`:${from}:${to}:1`)) {
        throw Error(`Reference mismatch for ${interval}: ${referenceId}`);
      }
      return {sequence:sequence.toUpperCase(),referenceId,url};
    } catch (error) {
      if (attempt === 5 || error?.name !== 'AbortError') throw error;
      await wait(3_000 * attempt);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw Error('Ensembl request unexpectedly exhausted retries.');
}

await mkdir('artifacts', {recursive:true});
const fastaPath='artifacts/GRCh38-chrX-1000000-10999999-10M.fa.gz';
const gzip=createGzip({level:6});
const output=createWriteStream(fastaPath);
gzip.pipe(output);
const hash=createHash('sha256');
const accumulator=createGenomeAccumulator({maxBases:length,windowSize:15});
const chunks=[];
const retrievedAt = new Date().toISOString();
const header = `>BSNG|reference=GRCh38|species=homo_sapiens|region=${region}|source=Ensembl_REST\n`;
gzip.write(header);

for (let from = start; from <= end; from += chunkSize) {
  const to = Math.min(end, from + chunkSize - 1);
  const {sequence,referenceId,url}=await ensemblChunk(from,to);
  hash.update(sequence,'ascii');
  accumulator.addChunk(sequence);
  chunks.push({
    from,to,referenceId,sourceUrl:url,
    bases:sequence.length,
    sha256:createHash('sha256').update(sequence,'ascii').digest('hex'),
  });
  // Standard 100-bases-per-line FASTA, with exact continuity of retrieved chunks.
  for (let i=0;i<sequence.length;i+=100) {
    if (!gzip.write(sequence.slice(i,i+100)+'\n')) await once(gzip,'drain');
  }
  console.log(`VERIFIED Ensembl GRCh38 human chrX: ${to-start+1}/${length} bases; chunk ${chunks.length}/10`);
  await wait(400); // courtesy interval between calls to the public service
}
gzip.end();
await finished(output);
const summary=accumulator.summary();
if (summary.length !== length || summary.chunksProcessed !== 10 ||
    summary.windowsExamined + summary.windowsExcludedAmbiguous !== length-14) {
  throw Error('Final completeness or sliding-window checks failed.');
}

const report={
  schemaVersion:1,
  evidenceType:'REAL_PUBLIC_HUMAN_REFERENCE_SEQUENCE_ANALYSIS',
  analysisType:'GENOMIC_COMPOSITION_ONLY_NOT_NANITE_BINDING',
  species:'Homo sapiens',
  source:'Ensembl REST',
  assembly:'GRCh38',
  referenceIsComposite:true,
  referenceIsPersonalGenome:false,
  referenceRegion:region,
  coordinates:{chromosome,start,end,strand:1,system:'1-based inclusive'},
  firstFetchedAt:retrievedAt,
  analysisFinishedAt:new Date().toISOString(),
  sourceCodeRevision:process.env.GITHUB_SHA||'unknown',
  fullSequenceSha256:hash.digest('hex'),
  fastaGzipFile:fastaPath,
  chunks,
  results:summary,
  hypothesisStatus:'NO_BIOLOGICAL_NANITE_INTERACTION_ASSAY_PERFORMED',
  interpretation:'Real human reference DNA with reproducible GC/window measurements. Not an experimental nanite-binding result.',
};
await writeFile('artifacts/GRCh38-chrX-10M-report.json',JSON.stringify(report,null,2)+'\n');
console.log('REAL HUMAN REFERENCE ANALYSIS COMPLETE',JSON.stringify({
  length:summary.length,fullSequenceSha256:report.fullSequenceSha256,
  gcFraction:summary.gcFraction,ambiguousBases:summary.nucleotideCounts.N,
  fastaGzipFile:fastaPath,
}));
