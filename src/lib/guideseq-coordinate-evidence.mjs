/**
 * Coordinate-resolved, published GUIDE-seq REFERENCE test-output interpreter.
 * Interprets observed RNA-guided nuclease-associated cleavage signals, NOT
 * DNA-binding affinity, novel guide recommendations, BSNG nanites or integration.
 *
 * hg38 coordinate convention: source BED columns are 0-based half-open.
 * Output uses GRCh38 1-based inclusive coordinates.
 */
export const GUIDESEQ_REFERENCE = Object.freeze({
  title:'Published GUIDE-seq hg38 chromosome 19 test-output evidence',
  organism:'Homo sapiens',
  assembly:'GRCh38',
  sourceRepository:'tsailabSJ/guideseq',
  sourceCommit:'82b015503e689f92f4d495ff5ba80d3fe2d5991c',
  sourcePath:'test/identified/test_identifiedOfftargets.rmblck.rm_no_match.annot.tsv',
  originalGitBlobSha1:'107c27715bb6555c0945ec435abf8de82e4323d3',
  manifestPath:'test/test_manifest.yaml',
  manifestBlobSha1:'ba1c486b460a5b97b04ce53c42017390381c3b14',
  assayType:'GUIDE-seq RNA-guided nuclease-associated DNA cleavage readouts',
  sample:'test / AAVS1_site_14 in published workflow demonstration',
  measuredReadout:'bi.sum.mi (unique-molecular-index summed GUIDE-seq support)',
  annotationCaveat:'Source annotation labels are inherited from upstream test output and not independently re-annotated.',
  experimentalCaveat:'Published pipeline demonstration data are not independently replicated biological validation.',
});

export function reverseComplementDNA(seq) {
 const pair={A:'T',T:'A',C:'G',G:'C'};
 if(typeof seq!=='string'||/[^ACGT]/.test(seq))throw Error('Cannot reverse-complement non-ACGT DNA.');
 return [...seq].reverse().map(base=>pair[base]).join('');
}
export function parseGUIDEseqObservedSites(tsv){
 if(typeof tsv!=='string'||!tsv.trim())throw Error('Source TSV is missing.');
 const lines=tsv.trimEnd().split(/\r?\n/);
 const headers=lines.shift().replace(/^#/,'').split('\t');
 const keys=[
  'BED_Chromosome','Position','bi.sum.mi','Targetsite','TargetSequence',
  'Site_SubstitutionsOnly.Sequence','Site_SubstitutionsOnly.Strand',
  'Site_SubstitutionsOnly.Start','Site_SubstitutionsOnly.End',
  'Site_GapsAllowed.Sequence','Site_GapsAllowed.Start','Site_GapsAllowed.End','Annotation'
 ];
 const cols=Object.fromEntries(keys.map(key=>[key,headers.indexOf(key)]));
 for(const key of keys)if(cols[key]<0)throw Error('Missing source column: '+key);
 const output=[];
 for(let i=0;i<lines.length;i++){
  if(!lines[i].trim())continue;
  const values=lines[i].split('\t'),field=key=>values[cols[key]]??'';
  const chr=field('BED_Chromosome'),position=Number(field('Position'));
  const reads=Number(field('bi.sum.mi'));
  if(!/^chr(?:[1-9]|1[0-9]|2[0-2]|X|Y|M)$/.test(chr)||!Number.isSafeInteger(position)||position<0||
      !Number.isSafeInteger(reads)||reads<0)throw Error('Untrusted source coordinate or count at row '+(i+2));
  const sequence=field('Site_SubstitutionsOnly.Sequence').toUpperCase();
  const strand=field('Site_SubstitutionsOnly.Strand');
  let start0=null,end0=null,locationStatus='GAPPED_OR_UNRESOLVED_ALIGNMENT';
  if(sequence && /^[ACGT]+$/.test(sequence) && (strand==='+'||strand==='-')){
    start0=Number(field('Site_SubstitutionsOnly.Start'));
    end0=Number(field('Site_SubstitutionsOnly.End'));
    if(!Number.isSafeInteger(start0)||!Number.isSafeInteger(end0)||start0<0||end0<=start0||
       end0-start0!==sequence.length)throw Error('Invalid source aligned coordinate at row '+(i+2));
    locationStatus='PENDING_REFERENCE_SEQUENCE_VERIFICATION';
  }else if(sequence)throw Error('Unexpected noncanonical substitution alignment at row '+(i+2));
  const gapSequence=field('Site_GapsAllowed.Sequence')||null;
  const gapStart=field('Site_GapsAllowed.Start');
  const gapEnd=field('Site_GapsAllowed.End');
  const observed={sourceRow:i+2,
   chromosome:chr,
   observedWindowCenter0Based:position,
   observedGuideSeqUniqueMoleculeCount:reads,
   sourceAssayLabel:field('Targetsite'),
   sourceTargetSequence:field('TargetSequence'),
   referenceAlignedSiteSequence:sequence||null,
   strand:strand||null,
   regionStart1BasedInclusive:start0===null?null:start0+1,
   regionEnd1BasedInclusive:end0,
   regionBEDStart0Based:start0,regionBEDEnd0BasedExclusive:end0,
   gappedAlignment:{sequence:gapSequence,start0Based:gapStart===''?null:Number(gapStart),end0BasedExclusive:gapEnd===''?null:Number(gapEnd)},
   upstreamFeatureAnnotation:field('Annotation')||null,
   locationStatus,
   physicalBindingAffinityMeasured:false,
   bsngNaniteBindingEvidence:false,
   safeIntegrationEvidence:false,
  };
  output.push(observed);
 }
 if(!output.length)throw Error('No source-observed GUIDE-seq sites.');
 return output;
}
export function verifySiteAgainstReference(site,referenceDNA){
 if(!site || site.locationStatus!=='PENDING_REFERENCE_SEQUENCE_VERIFICATION')
  return {...site,referenceCheck:{status:'NOT_ASSESSABLE_GAPPED_OR_UNALIGNED',match:false}};
 const seq=typeof referenceDNA==='string'?referenceDNA.toUpperCase():'';
 if(!/^[ACGTN]+$/.test(seq)||seq.length!==site.referenceAlignedSiteSequence.length)
  return {...site,referenceCheck:{status:'INVALID_REFERENCE_RESPONSE',match:false}};
 const comparable=site.strand==='-'?reverseComplementDNA(seq.replace(/N/g,'A')):seq;
 const passed=!seq.includes('N')&&comparable===site.referenceAlignedSiteSequence;
 return {
   ...site,locationStatus:passed?'GRCH38_REFERENCE_VERIFIED':'REFERENCE_SEQUENCE_MISMATCH',
   referenceCheck:{
     status:passed?'REFERENCE_ALIGNMENT_MATCH':'REFERENCE_ALIGNMENT_MISMATCH',
     match:passed,
     expectedAlignedSequence:site.referenceAlignedSiteSequence,
     actualAlignedSequence:comparable,
     actualReferencePlusStrand:seq,
     sourceCoordinateConvention:'BED 0-based half-open',
     verifiedCoordinateConvention:'GRCh38 1-based inclusive',
   },
 };
}
export function summarizeGUIDEseqObservedSites(sites){
 const verified=sites.filter(s=>s.locationStatus==='GRCH38_REFERENCE_VERIFIED');
 return {
  observedSites:sites.length,
  withSubstitutionsOnlyCoordinates:sites.filter(s=>s.regionStart1BasedInclusive!==null).length,
  verifiedReferenceSequenceSites:verified.length,
  mismatchedReferenceSequenceSites:sites.filter(s=>s.locationStatus==='REFERENCE_SEQUENCE_MISMATCH').length,
  gappedOrUnresolvedSites:sites.filter(s=>s.locationStatus==='GAPPED_OR_UNRESOLVED_ALIGNMENT').length,
  observedReadsSum:sites.reduce((s,site)=>s+site.observedGuideSeqUniqueMoleculeCount,0),
  observedUniqueChromosomes:[...new Set(sites.map(s=>s.chromosome))].sort(),
  rankingMeaning:'Sorted by published read support only, NOT independent binding affinity or suitability for integration.'
 };
}
