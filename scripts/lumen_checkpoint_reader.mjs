import { readFileSync, writeFileSync } from 'node:fs';
const input = process.argv[2];
const output = process.argv[3] || 'bsng-campaign-summary.json';
if (!input) throw new Error('A checkpoint index file is required');
const archive = JSON.parse(readFileSync(input, 'utf8'));
if (archive.assembly !== 'GRCh38.p14' || !archive.coverage || archive.coverage.totalBatches < 1)
  throw new Error('Unexpected GRCh38 checkpoint format. Do not substitute claims.');
const c = archive.coverage;
const report = {
  study: 'archived read-only natural CTCF reference checkpoint',
  assembly: archive.assembly,
  source_fasta_sha256: archive.sourceFastaSha256 || null,
  frozen_science_code_commit: archive.sourceCodeCommit || null,
  status: archive.status,
  completion: {batches: c.completedBatches, planned_batches: c.totalBatches,
    analyzed_owned_bases: c.completedOwnedBases, planned_owned_bases: c.totalOwnedBases,
    overall_fraction: c.overallFraction},
  reference_motif_candidates: c.candidateCountVerified,
  candidate_interpretation: 'Model-defined motif candidates, NOT nanite binding or human-safe genomic integration sites.',
  bsng_physical_binding_status: 'NOT_ASSESSABLE',
  proof_of_thesis: false,
};
if (!Number.isInteger(report.reference_motif_candidates) || c.completedBatches > c.totalBatches || c.completedOwnedBases > c.totalOwnedBases)
  throw new Error('Inconsistent scientific checkpoint counters');
writeFileSync(output, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output, status:report.status, batches:report.completion.batches, candidates:report.reference_motif_candidates}));
