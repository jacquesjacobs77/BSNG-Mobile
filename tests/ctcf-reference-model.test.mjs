import test from 'node:test';
import assert from 'node:assert/strict';
import { CTCF_PFM, CTCF_PWM, CTCF_REFERENCE, createPwm,encodeDNA,scoreSite,scoreGenome,maxScoreInInterval } from '../src/lib/ctcf-reference-model.mjs';

test('published 19nt CTCF PFM preserves expected column totals and source identification',()=>{
  assert.equal(CTCF_PWM.length,19);
  assert.equal(CTCF_REFERENCE.jasparMatrixId,'MA0139.1');
  for(let i=0;i<19;i++){
    assert.equal(['A','C','G','T'].reduce((s,b)=>s+CTCF_PFM[b][i],0),[913,913,913,913,913,913,913,912,912,911,911,911,910,910,909,909,908,908,908][i]);
    assert.ok(Number.isFinite(CTCF_PWM.weights[i][0]));
  }
});

test('scores both orientation strands symmetrically',()=>{
  const seq='ACGTTGCACGTGGTACGTA';
  const complement=x=>[...x].reverse().map(c=>({A:'T',C:'G',G:'C',T:'A'})[c]).join('');
  const a=scoreSite(encodeDNA(seq),0);
  const b=scoreSite(encodeDNA(complement(seq)),0);
  const a19=scoreSite(encodeDNA(seq.slice(0,19)),0);
  const b19=scoreSite(encodeDNA(complement(seq.slice(0,19))),0);
  assert.ok(Math.abs(a19.score-b19.score)<1e-8);
  assert.equal(a19.strand,b19.strand==='+'?'-':'+');
  assert.ok(Number.isFinite(a.score));
  assert.ok(Number.isFinite(b.score));
});

test('best canonical CTCF motif window outranks low-propensity homopolymer',()=>{
  const consensus=CTCF_PWM.weights.map(w=>'ACGT'[Array.from(w).indexOf(Math.max(...w))]).join('');
  const ideal=scoreSite(encodeDNA(consensus),0);
  const a=scoreSite(encodeDNA('A'.repeat(19)),0);
  assert.ok(ideal.score > a.score);
  assert.ok(Math.abs(ideal.score-CTCF_PWM.theoreticalMax)<1e-10);
});

test('a base N cannot yield an invented biological motif score',()=>{
  assert.deepEqual(scoreSite(encodeDNA('A'.repeat(10)+'N'+'A'.repeat(8)),0),{score:null,strand:null,reason:'ambiguous_N'});
});

test('genomic coordinate maxima respect 0-based window indexing and no duplicate candidate region',()=>{
  const motif=CTCF_PWM.weights.map(w=>'ACGT'[Array.from(w).indexOf(Math.max(...w))]).join('');
  const genome='N'.repeat(25)+motif+'N'.repeat(30)+motif+'N'.repeat(25);
  const x=scoreGenome(encodeDNA(genome),{topK:4,minSeparation:20});
  assert.equal(x.topCandidates.length,2);
  assert.deepEqual(x.topCandidates.map(c=>c.position0),[25,74]);
  assert.equal(x.topCandidates[0].score,x.topCandidates[1].score);
  assert.equal(maxScoreInInterval(x.scores,25,26).position0,25);
  assert.equal(maxScoreInInterval(x.scores,0,5),null);
});

test('invalid PFM and reference symbols are rejected',()=>{
  assert.throws(()=>createPwm({A:[1],C:[1],G:[1],T:[1]}),/length/);
  assert.throws(()=>encodeDNA('ATCGZ'),/uppercase/);
});
