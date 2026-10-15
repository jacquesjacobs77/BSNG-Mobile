/**\n * Immutable offline research-reference snapshot derived from the cited, upstream\n * GUIDE-seq pipeline TEST data and independently verified Ensembl GRCh38.\n * Not an actual BSNG nanite assay and not live-updating.\n * Exact upstream file checksum verified in GitHub Actions run 38693499750.\n */\nexport type GuideSeqPublishedSite = {\n  id:string;chromosome:string;start1:number|null;end1:number|null;strand:string|null;\n  readSupport:number;sequence:string|null;sourceRow:number;sourceFeatureLabel:string|null;\n  observedWindowCenter0:number;verification:string;\n};\nexport const GUIDESEQ_REFERENCE_SNAPSHOT = {
  "genomeAssembly": "GRCh38",
  "biology": "Published human RNA-guided Cas nuclease GUIDE-seq test observations",
  "sourceType": "PUBLIC_PIPELINE_TEST_DATA",
  "source": "https://github.com/tsailabSJ/guideseq/blob/82b015503e689f92f4d495ff5ba80d3fe2d5991c/test/identified/test_identifiedOfftargets.rmblck.rm_no_match.annot.tsv",
  "sourceCommit": "82b015503e689f92f4d495ff5ba80d3fe2d5991c",
  "sourceFileSHA256": "6a2883ec645c5368f7130c5b955236eee6ba3d25c8f205f9f0b1628f24cfdb70",
  "verificationRun": "https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38693499750",
  "numberReadSupported": 7,
  "numberCanonicalVerified": 6,
  "numberGappedUnresolved": 1,
  "upstreamSample": "AAVS1_site_14",
  "genomeCoordinateBasis": "GRCh38 chr19, 1-based inclusive",
  "bindingAffinityMeasured": false,
  "safeIntegrationMeasured": false
} as const;\nexport const GUIDESEQ_PUBLISHED_SITES:GuideSeqPublishedSite[] = [
  {
    "id": "GUIDESEQ-TEST-7",
    "chromosome": "chr19",
    "start1": 55115749,
    "end1": 55115771,
    "strand": "-",
    "readSupport": 6890,
    "sequence": "GGGGCCACTAGGGACAGGATTGG",
    "sourceRow": 8,
    "sourceFeatureLabel": "intron (PPP1R12C, intron 1 of 21)",
    "observedWindowCenter0": 55115755,
    "verification": "GRCH38_REFERENCE_VERIFIED"
  },
  {
    "id": "GUIDESEQ-TEST-2",
    "chromosome": "chr19",
    "start1": 16064177,
    "end1": 16064199,
    "strand": "-",
    "readSupport": 550,
    "sequence": "GGGGCTTCTAAGGACAGGATGGG",
    "sourceRow": 3,
    "sourceFeatureLabel": "Intergenic (LINC01855)",
    "observedWindowCenter0": 16064183,
    "verification": "GRCH38_REFERENCE_VERIFIED"
  },
  {
    "id": "GUIDESEQ-TEST-3",
    "chromosome": "chr19",
    "start1": null,
    "end1": null,
    "strand": null,
    "readSupport": 66,
    "sequence": null,
    "sourceRow": 4,
    "sourceFeatureLabel": "intron (GNG7, intron 2 of 4)",
    "observedWindowCenter0": 2571945,
    "verification": "GAPPED_ALIGNMENT_NOT_REFERENCE_VERIFIED"
  },
  {
    "id": "GUIDESEQ-TEST-5",
    "chromosome": "chr19",
    "start1": 45929459,
    "end1": 45929481,
    "strand": "+",
    "readSupport": 43,
    "sequence": "GGGGGACAGAGGGACAGGATGGG",
    "sourceRow": 6,
    "sourceFeatureLabel": "Intergenic (NANOS2)",
    "observedWindowCenter0": 45929474,
    "verification": "GRCH38_REFERENCE_VERIFIED"
  },
  {
    "id": "GUIDESEQ-TEST-4",
    "chromosome": "chr19",
    "start1": 45172697,
    "end1": 45172719,
    "strand": "-",
    "readSupport": 24,
    "sequence": "GCTGGGCCAGGGGACAGGATGGG",
    "sourceRow": 5,
    "sourceFeatureLabel": "intron (TRAPPC6A, intron 1 of 5)",
    "observedWindowCenter0": 45172703,
    "verification": "GRCH38_REFERENCE_VERIFIED"
  },
  {
    "id": "GUIDESEQ-TEST-1",
    "chromosome": "chr19",
    "start1": 13795375,
    "end1": 13795397,
    "strand": "+",
    "readSupport": 8,
    "sequence": "GGGGCCAATAGGGACAGGCGGTG",
    "sourceRow": 2,
    "sourceFeatureLabel": "promoter-TSS (ZSWIM4)",
    "observedWindowCenter0": 13795388,
    "verification": "GRCH38_REFERENCE_VERIFIED"
  },
  {
    "id": "GUIDESEQ-TEST-6",
    "chromosome": "chr19",
    "start1": 48749674,
    "end1": 48749696,
    "strand": "-",
    "readSupport": 5,
    "sequence": "AGGGCCCTTATGGACAGGATGGG",
    "sourceRow": 7,
    "sourceFeatureLabel": "3' UTR (NM_000148, exon 4 of 4)",
    "observedWindowCenter0": 48749680,
    "verification": "GRCH38_REFERENCE_VERIFIED"
  }
];\n\nexport const NATURAL_REFERENCE_STATUS = {
  "protein": {
    "name": "Human CTCF",
    "system": "JASPAR MA0139.1 vs ENCODE K562 ChIP-seq",
    "genome": "GRCh38 chrX:1,000,000–10,999,999",
    "experimentalPeakRegions": 88,
    "descriptiveAuc": 0.8702221074380165,
    "highestScoringMotif": {
      "chromosome": "chrX",
      "start1": 8743317,
      "end1": 8743335,
      "strand": "+",
      "score": 23.535866148651255,
      "overlapsChipPeak": true
    },
    "run": "https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38684724899"
  },
  "rnaGuidedLabels": {
    "name": "Natural SpCas9 published TrueOT labels",
    "activityLabelRows": 1806,
    "evaluatedRows": 1579,
    "meanGuideAuc": 0.7946374362465487,
    "sourceHasGenomicCoordinates": false,
    "run": "https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38688521675"
  },
  "physicalBsngHybrid": "NOT_ASSESSABLE",
  "integrationFeasibility": "NOT_ASSESSABLE"
} as const;\n