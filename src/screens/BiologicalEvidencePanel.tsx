import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  GUIDESEQ_PUBLISHED_SITES, GUIDESEQ_REFERENCE_SNAPSHOT, NATURAL_REFERENCE_STATUS,
  type GuideSeqPublishedSite,
} from '../data/biologicalEvidence';

type Tab='rna'|'protein'|'hybrid';
const C={cyan:'#56E8E3',purple:'#AF90FF',green:'#75DAAF',amber:'#F9C878',
  white:'#E9F5FC',muted:'#94AABF',line:'#284158',panel:'#101C2C',bg:'#070E1B'};
const T=({children}:{children:React.ReactNode})=><Text style={st.body}>{children}</Text>;
function OpenResearchSource({label,url}:{label:string;url:string}){
  return <TouchableOpacity accessibilityRole="link" onPress={()=>{
    Linking.openURL(url).catch(()=>Alert.alert('Link unavailable','Please open the source on GitHub.'));
  }} style={st.sourceButton}><Text style={st.sourceLabel}>{label+' ↗'}</Text></TouchableOpacity>;
}
function KeyValue({name,value}:{name:string;value:string}){
  return <View style={st.kv}><Text style={st.dim}>{name}</Text><Text selectable style={st.kvValue}>{value}</Text></View>;
}
function Status({children,kind='neutral'}:{children:React.ReactNode;kind?:'green'|'amber'|'neutral'}){
 const color=kind==='green'?C.green:kind==='amber'?C.amber:C.cyan;
 return <View style={[st.status,{borderColor:color}]}><Text style={{color,fontWeight:'800',fontSize:10}}>{children}</Text></View>;
}
function GuideSite({site}:{site:GuideSeqPublishedSite}){
 const exact=site.verification==='GRCH38_REFERENCE_VERIFIED';
 const description=exact?
   `${site.chromosome}:${site.start1?.toLocaleString('en-US')}–${site.end1?.toLocaleString('en-US')}`:
   'chr19 · gapped alignment (exact site unresolved)';
 return <View style={st.site}>
   <View style={st.headingRow}>
     <Text style={st.siteTitle} selectable>{description}</Text>
     <Text style={st.siteCount}>{site.readSupport.toLocaleString('en-US')}</Text>
   </View>
   <View style={st.headingRow}>
     <Status kind={exact?'green':'amber'}>{exact?'GRCH38 VERIFIED':'ALIGNMENT UNRESOLVED'}</Status>
     <Text style={st.dim}>{'GUIDE-seq read support'}</Text>
   </View>
   {exact && <Text selectable style={st.mono}>{site.sequence}</Text>}
   {exact&&<Text style={st.dim}>{'Strand '+site.strand+' · 1-based inclusive genomic coordinates'}</Text>}
   {site.sourceFeatureLabel && <Text style={st.detail}>{'Source annotation: '+site.sourceFeatureLabel}</Text>}
   <Text style={st.dim}>{'Upstream source row '+site.sourceRow+' · published test dataset'}</Text>
 </View>;
}
export default function BiologicalEvidencePanel(){
 const [tab,setTab]=useState<Tab>('rna');
 const [allSites,setAllSites]=useState(false);
 async function shareAudit(){
  const message=[
   'BSNG Studio — PUBLIC BIOLOGICAL REFERENCE EVIDENCE (NOT BSNG NANITE VALIDATION)',
   'Source: '+GUIDESEQ_REFERENCE_SNAPSHOT.source,
   'Original CSV/TSV SHA-256: '+GUIDESEQ_REFERENCE_SNAPSHOT.sourceFileSHA256,
   'Verification: '+GUIDESEQ_REFERENCE_SNAPSHOT.verificationRun,
   'Assembly: GRCh38 (hg38), chromosome 19; BED 0-based half-open converted to 1-based inclusive.',
   'Observed published GUIDE-seq example: 7 read-supported sites, 6 exact-site alignments independently matched to Ensembl GRCh38, 1 gapped unresolved.',
   'Natural CTCF/ENCODE model reference: '+NATURAL_REFERENCE_STATUS.protein.run,
   'Natural SpCas9 TrueOT activity reference: '+NATURAL_REFERENCE_STATUS.rnaGuidedLabels.run,
   'Hybrid physical BSNG binding: NOT ASSESSABLE; BSNG genomic integration: NOT ASSESSABLE.',
   'No candidate is verified as an optimal BSNG nanite attachment or safe insertion site.',
  ].join('\n');
  try{await Share.share({message})}catch{Alert.alert('Share unavailable','Could not open the Android share panel.')}
 }
 return <View style={st.root}>
   <Text style={st.eyebrow}>EXPERIMENTAL REFERENCE EVIDENCE · V0.6</Text>
   <Text style={st.mainTitle}>Genomic Evidence Registry</Text>
   <T>Verified human reference coordinates and published experimental observations. This is not a validated physical BSNG nanite-binding test.</T>
   <View style={st.stats}>
     <View style={st.stat}><Text style={st.statValue}>6/7</Text><Text style={st.statCaption}>RNA sites aligned / total</Text></View>
     <View style={st.stat}><Text style={st.statValue}>GRCh38</Text><Text style={st.statCaption}>Genome assembly</Text></View>
   </View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.tabs}>
     {([
       ['rna','RNA · GUIDE-seq'],
       ['protein','PROTEIN · CTCF'],
       ['hybrid','BSNG EVIDENCE'],
     ] as const).map(([id,label])=>
       <TouchableOpacity accessibilityRole="tab" accessibilityState={{selected:tab===id}} key={id}
         style={[st.tab,tab===id&&st.tabSelected]} onPress={()=>setTab(id)}>
         <Text style={[st.tabText,tab===id&&{color:C.cyan}]}>{label}</Text>
       </TouchableOpacity>
     )}
   </ScrollView>

   {tab==='rna' && <View style={st.panel}>
     <Text style={st.sectionTitle}>RNA-guided cleavage observations</Text>
     <View style={st.flags}><Status kind="green">6 EXACT ALIGNMENTS VERIFIED</Status><Status kind="amber">1 GAP UNRESOLVED</Status></View>
     <T>Human chromosome 19. All six canonical 23-base alignments were checked against the real Ensembl GRCh38 reference, including DNA strand orientation.</T>
     <T>Locations are ordered by published GUIDE-seq read support. Higher read support does not establish stronger binding or safer integration.</T>
     <KeyValue name="Experiment" value="Published GUIDE-seq test • AAVS1_site_14"/>
     <KeyValue name="Coordinate type" value="GRCh38 · 1-based inclusive"/>
     {(allSites?GUIDESEQ_PUBLISHED_SITES:GUIDESEQ_PUBLISHED_SITES.slice(0,3)).map(site=><GuideSite key={site.id} site={site}/>)}
     <TouchableOpacity accessibilityRole="button" onPress={()=>setAllSites(x=>!x)} style={st.outlineButton}>
       <Text style={st.outlineLabel}>{allSites?'SHOW TOP THREE':'VIEW ALL SEVEN OBSERVATIONS'}</Text>
     </TouchableOpacity>
     <OpenResearchSource label="Original GUIDE-seq source" url={GUIDESEQ_REFERENCE_SNAPSHOT.source}/>
     <OpenResearchSource label="GRCh38 coordinate verification" url={GUIDESEQ_REFERENCE_SNAPSHOT.verificationRun}/>
   </View>}

   {tab==='protein' && <View style={st.panel}>
     <Text style={st.sectionTitle}>Natural protein · CTCF</Text>
     <Status kind="green">NATURAL PROTEIN BENCHMARK</Status>
     <T>A separate, real human chrX GRCh38 experiment: published JASPAR CTCF motif preferences evaluated against ENCODE K562 ChIP-seq signals.</T>
     <KeyValue name="Scanned region" value={NATURAL_REFERENCE_STATUS.protein.genome}/>
     <KeyValue name="Experimentally enriched regions" value="88"/>
     <KeyValue name="Descriptive AUROC vs matched background" value="0.870"/>
     <Text style={st.sectionTitle}>Example high-scoring natural CTCF motif</Text>
     <Text selectable style={st.location}>chrX:8,743,317–8,743,335 (+)</Text>
     <T>CTCF motif score: 23.536 log₂ odds. Overlaps K562 ChIP-seq enrichment. Not measured BSNG nanite binding or a safe insertion-site recommendation.</T>
     <OpenResearchSource label="CTCF evidence audit" url={NATURAL_REFERENCE_STATUS.protein.run}/>
   </View>}

   {tab==='hybrid' && <View style={st.panel}>
     <Text style={st.sectionTitle}>BSNG hybrid hypothesis</Text>
     <Status kind="amber">PHYSICAL MECHANISM NOT ASSESSABLE</Status>
     <T>RNA-guided and protein/peptide recognition are the proposed BSNG molecular components. Two existing natural biological systems are used as separate research benchmarks.</T>
     <KeyValue name="RNA-guided natural reference" value={'SpCas9 · guide-level AUROC '+NATURAL_REFERENCE_STATUS.rnaGuidedLabels.meanGuideAuc.toFixed(3)}/>
     <KeyValue name="Protein reference" value={'CTCF · AUROC '+NATURAL_REFERENCE_STATUS.protein.descriptiveAuc.toFixed(3)}/>
     <KeyValue name="Joint BSNG hybrid binding" value="NOT ASSESSABLE"/>
     <KeyValue name="BSNG genomic integration" value="NOT ASSESSABLE"/>
     <T>These metrics describe different known natural systems. They cannot be combined into a BSNG binding score. A characterized physical hybrid complex and independent joint measurements are still required.</T>
     <OpenResearchSource label="Natural RNA-guided activity benchmark" url={NATURAL_REFERENCE_STATUS.rnaGuidedLabels.run}/>
   </View>}

   <View style={st.warning}><Text style={st.warningTitle}>SCIENTIFIC INTEGRITY</Text>
     <T>Published GUIDE-seq read counts, CTCF motif predictions and GC content are not measurements of physical nanite affinity, therapeutic activity, or integration safety.</T>
   </View>
   <TouchableOpacity onPress={shareAudit} accessibilityRole="button" style={st.shareButton}>
     <Text style={st.shareLabel}>SHARE REPRODUCIBILITY SOURCES ↗</Text>
   </TouchableOpacity>
 </View>;
}
const st=StyleSheet.create({
 root:{marginBottom:18,gap:12},
 eyebrow:{color:C.cyan,fontSize:10,fontWeight:'800',letterSpacing:1},
 mainTitle:{color:C.white,fontSize:21,fontWeight:'900'},
 body:{color:C.muted,fontSize:12,lineHeight:19},
 stats:{flexDirection:'row',gap:10},
 stat:{flex:1,minWidth:0,borderRadius:12,padding:13,backgroundColor:C.panel,borderWidth:1,borderColor:C.line},
 statValue:{color:C.white,fontSize:18,fontWeight:'800'},
 statCaption:{color:C.muted,fontSize:10,marginTop:4},
 tabs:{gap:7,paddingVertical:3},
 tab:{borderWidth:1,borderRadius:11,borderColor:C.line,paddingVertical:10,paddingHorizontal:11,backgroundColor:C.panel},
 tabSelected:{borderColor:C.cyan,backgroundColor:'#103241'},
 tabText:{color:C.muted,fontSize:10,fontWeight:'800'},
 panel:{backgroundColor:C.panel,borderWidth:1,borderColor:C.line,borderRadius:15,padding:15,gap:12},
 sectionTitle:{color:C.white,fontSize:15,fontWeight:'900',marginTop:2},
 flags:{flexDirection:'row',flexWrap:'wrap',gap:6},
 status:{borderWidth:1,borderRadius:6,paddingVertical:4,paddingHorizontal:7,alignSelf:'flex-start',backgroundColor:C.bg},
 kv:{gap:4},
 dim:{color:C.muted,fontSize:10},
 kvValue:{color:C.white,fontSize:12,fontWeight:'700'},
 site:{gap:8,padding:12,borderWidth:1,borderColor:C.line,borderRadius:10,backgroundColor:C.bg},
 headingRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'},
 siteTitle:{color:C.white,fontWeight:'800',fontSize:12,flexShrink:1},
 siteCount:{color:C.green,fontSize:15,fontWeight:'900'},
 mono:{color:C.cyan,fontFamily:'monospace',fontSize:11},
 detail:{color:C.white,fontSize:11},
 outlineButton:{padding:11,borderWidth:1,borderColor:C.cyan,borderRadius:9,alignItems:'center'},
 outlineLabel:{color:C.cyan,fontSize:11,fontWeight:'900'},
 sourceButton:{paddingVertical:3,alignSelf:'flex-start'},
 sourceLabel:{color:C.cyan,fontWeight:'700',fontSize:11},
 location:{color:C.cyan,fontWeight:'900',fontSize:14},
 warning:{gap:7,borderWidth:1,borderColor:'#6B5638',padding:12,borderRadius:12,backgroundColor:'#1B1B23'},
 warningTitle:{color:C.amber,fontSize:10,fontWeight:'900'},
 shareButton:{backgroundColor:'#173A42',borderRadius:10,padding:13,alignItems:'center'},
 shareLabel:{color:C.cyan,fontWeight:'900',fontSize:11},
});
