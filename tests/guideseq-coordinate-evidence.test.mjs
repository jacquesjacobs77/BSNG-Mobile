import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGUIDEseqObservedSites,verifySiteAgainstReference,summarizeGUIDEseqObservedSites,
  reverseComplementDNA,GUIDESEQ_REFERENCE
} from '../src/lib/guideseq-coordinate-evidence.mjs';
const cols=['#BED_Chromosome','Position','bi.sum.mi','Targetsite','TargetSequence',
 'Site_SubstitutionsOnly.Sequence','Site_SubstitutionsOnly.Strand',
 'Site_SubstitutionsOnly.Start','Site_SubstitutionsOnly.End',
 'Site_GapsAllowed.Sequence','Site_GapsAllowed.Start','Site_GapsAllowed.End','Annotation'].join('\t');
const data=cols+'\n'+[
 ['chr19',13795388,8,'AAVS1_site_14','source-published-target','GGGGCCAATAGGGACAGGCGGTG','+',13795374,13795397,'','','','promoter'],
 ['chr19',16064183,550,'AAVS1_site_14','source-published-target','GGGGCTTCTAAGGACAGGATGGG','-',16064176,16064199,'','','','intergenic'],
 ['chr19',2571945,66,'AAVS1_site_14','source-published-target','','','','','TAGGCCAAT-GGGACAGGATAGG',2571938,2571960,'intron']
].map(r=>r.join('\t')).join('\n')+'\n';

test('published GUIDE-seq GRCh38 coordinates are imported with BED-to-1-based conversion',()=>{
 const x=parseGUIDEseqObservedSites(data);
 assert.equal(x.length,3);
 assert.equal(x[0].regionStart1BasedInclusive,13795375);
 assert.equal(x[0].regionEnd1BasedInclusive,13795397);
 assert.equal(x[1].regionStart1BasedInclusive,16064177);
 assert.equal(x[0].observedGuideSeqUniqueMoleculeCount,8);
 assert.equal(x[2].locationStatus,'GAPPED_OR_UNRESOLVED_ALIGNMENT');
 assert.equal(GUIDESEQ_REFERENCE.assembly,'GRCh38');
});
test('reverse strand verification respects reference orientation without changing source annotations',()=>{
 const x=parseGUIDEseqObservedSites(data);
 const a=verifySiteAgainstReference(x[0],x[0].referenceAlignedSiteSequence);
 assert.equal(a.referenceCheck.match,true);
 assert.equal(a.locationStatus,'GRCH38_REFERENCE_VERIFIED');
 const b=verifySiteAgainstReference(x[1],reverseComplementDNA(x[1].referenceAlignedSiteSequence));
 assert.equal(b.referenceCheck.match,true);
 assert.equal(b.regionStart1BasedInclusive,16064177);
 const wrong=verifySiteAgainstReference(x[0],'A'.repeat(23));
 assert.equal(wrong.referenceCheck.match,false);
 assert.equal(wrong.locationStatus,'REFERENCE_SEQUENCE_MISMATCH');
});
test('unresolved and missing reference sequences cannot be called verified binding locations',()=>{
 const sites=parseGUIDEseqObservedSites(data);
 const gap=verifySiteAgainstReference(sites[2],null);
 assert.equal(gap.referenceCheck.match,false);
 const invalid=verifySiteAgainstReference(sites[0],'NNNNNNNNNNNNNNNNNNNNNNN');
 assert.equal(invalid.referenceCheck.match,false);
 const stats=summarizeGUIDEseqObservedSites([verifySiteAgainstReference(sites[0],sites[0].referenceAlignedSiteSequence),gap]);
 assert.equal(stats.observedSites,2);
 assert.equal(stats.verifiedReferenceSequenceSites,1);
 assert.equal(stats.gappedOrUnresolvedSites,1);
 assert.equal(stats.observedReadsSum,74);
 assert.equal(stats.observedUniqueChromosomes[0],'chr19');
});
test('schema mismatches and broken source coordinate records fail loudly',()=>{
 assert.throws(()=>parseGUIDEseqObservedSites('chr19\tstart\tend\n'),/Missing source column/);
 const malformed=data.replace('13795397','13795396');
 assert.throws(()=>parseGUIDEseqObservedSites(malformed),/Invalid source aligned coordinate/);
});
