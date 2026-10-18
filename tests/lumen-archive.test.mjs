import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = new URL('../scripts/lumen_checkpoint_reader.mjs', import.meta.url).pathname;

test('authentic checkpoint shape is summarized without any nanite-target assertion', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bsng-archive-test-'));
  try {
    const input=join(dir, 'index.json'),out=join(dir,'out.json');
    writeFileSync(input, JSON.stringify({assembly:'GRCh38.p14',status:'INCOMPLETE',coverage:{totalBatches:1003,completedBatches:13,
      completedOwnedBases:130000000,totalOwnedBases:3298430636,overallFraction:.03941268268040668,candidateCountVerified:1689}}));
    const run=spawnSync(process.execPath,[script,input,out],{encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const s=JSON.parse(readFileSync(out,'utf8'));
    assert.equal(s.completion.batches,13);
    assert.equal(s.reference_motif_candidates,1689);
    assert.equal(s.bsng_physical_binding_status,'NOT_ASSESSABLE');
    assert.equal(s.proof_of_thesis,false);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

test('rejects wrong assembly rather than relabeling genomic coordinates', () => {
  const dir=mkdtempSync(join(tmpdir(),'bsng-archive-test-'));
  try {
    const file=join(dir,'bad.json');writeFileSync(file,JSON.stringify({assembly:'unknown',coverage:{totalBatches:10}}));
    const run=spawnSync(process.execPath,[script,file,join(dir,'out.json')],{encoding:'utf8'});
    assert.notEqual(run.status,0);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
