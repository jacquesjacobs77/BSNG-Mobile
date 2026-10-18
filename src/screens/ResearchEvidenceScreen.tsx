import React, { useState } from 'react';
import { Alert, Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Curated, public-safe project summary. This is NOT a live lab or genome service.
// Content revision 2026-10-18. The app runtime remains 0.2.0 for OTA compatibility.
const C = {
  bg: '#070E1B', panel: '#101C2C', border: '#284158', cyan: '#56E8E3',
  purple: '#AF90FF', green: '#75DAAF', amber: '#F9C878',
  white: '#E9F5FC', muted: '#94AABF',
};
const sources = {
  trueot: 'https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38688521675',
  ctcf: 'https://github.com/jacquesjacobs77/BSNG-Mobile/actions/runs/38684724899',
  upstream: 'https://github.com/baolab-rice/CRISPR_OT_scoring',
  repo: 'https://github.com/jacquesjacobs77/BSNG-Mobile',
} as const;

type CardData = { key: string; heading: string; status: string; statusColor: string; summary: string; details: string[]; link?: keyof typeof sources; linkTitle?: string };
const evidence: CardData[] = [
  {
    key: 'rna', heading: 'RNA-guided natural reference · TrueOT', status: 'RETROSPECTIVE', statusColor: C.green,
    summary: 'SpCas9 external activity-label benchmark; a simple untrained mismatch baseline, not BSNG nanite recognition.',
    details: [
      'Published rows: 1,806; eligible observations: 1,579; excluded nonstandard-length observations: 227.',
      'Eligible guides: 33. Macro per-guide AUROC: 0.7946 (guide-bootstrap 95% percentile interval: 0.7461–0.8463).',
      'The score is negative Hamming mismatch count at positions 1–20 of accepted 23-nt guide/target pairs. No model was fitted.',
      'Historical activity labels are not physical binding-affinity measurements. The dataset has no GRCh38 coordinates.',
    ], link: 'trueot', linkTitle: 'Open archived TrueOT run',
  },
  {
    key: 'protein', heading: 'Natural protein reference · CTCF', status: 'SEPARATE REFERENCE', statusColor: C.green,
    summary: 'Separate descriptive protein-reference benchmark. It must not be numerically combined with TrueOT.',
    details: [
      'Reported descriptive AUC: 0.8702, from the separately archived CTCF analysis.',
      'This is neither a measured BSNG nanite binding affinity nor an independent demonstration of a hybrid biological interface.',
    ], link: 'ctcf', linkTitle: 'Open archived CTCF run',
  },
  {
    key: 'hybrid', heading: 'Physical BSNG hybrid & integration', status: 'NOT ASSESSABLE', statusColor: C.amber,
    summary: 'There is no experimentally characterized joint nanite hybrid complex in the supplied evidence.',
    details: [
      'No scientifically valid combined RNA/CTCF binding score is available.',
      'No experimental BSNG genomic integration or safe-site recommendation has been established.',
      'Therapeutic function, targeting specificity and safety require independent physical and biological validation.',
    ],
  },
  {
    key: 'genome', heading: 'Genome reference & compute roadmap', status: 'PARTIAL / OFF DEVICE', statusColor: C.purple,
    summary: 'GRCh38.p14 reference provenance exists; a whole-genome scanner is not embedded in this mobile client.',
    details: [
      'Reference manifest: GRCh38.p14 / RefSeq GCF_000001405.40. The original FASTA is recorded at a Windows-only desktop path.',
      'Manifest uses file size and modification time for routine checks; no SHA-256 was computed in that manifest.',
      'Published-reference computational campaigns and sex-chromosome/universality checks are separate research workflows, not live phone features.',
      'This phone currently offers a short local GC demonstration and optional short public Ensembl reference fetch.',
    ], link: 'repo', linkTitle: 'Open project code and workflow history',
  },
];
const releaseNotes = [
  'New read-only evidence register with separate RNA and protein reference benchmarks.',
  'Explicit NOT ASSESSABLE gates for physical hybrid binding and genomic integration.',
  'Reference manifest and reproducibility notes surfaced without uploading the proprietary or large genome files.',
  'Existing mobile research/sequence workspaces unchanged. No new native package, network collector or genomic upload added.',
  'Research status snapshot dated 18 October 2026. Figures do not refresh automatically.',
];

export default function ResearchEvidenceScreen() {
  const [expanded, setExpanded] = useState<string[]>(['rna', 'hybrid']);
  function toggle(key: string) {
    setExpanded(previous => previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]);
  }
  async function openSource(key: keyof typeof sources) {
    try {
      const url = sources[key];
      if (!(await Linking.canOpenURL(url))) throw new Error('No compatible link handler');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Source link unavailable', 'Open the GitHub BSNG-Mobile repository in your browser.');
    }
  }
  async function shareSummary() {
    const message = [
      'BSNG Research Studio — evidence snapshot, 2026-10-18',
      'TrueOT SpCas9: 1,579 eligible / 1,806 published rows, 33 eligible guides; macro per-guide AUROC 0.7946 (retrospective activity-label benchmark).',
      'CTCF natural protein reference: separate descriptive AUC 0.8702.',
      'Joint physical BSNG hybrid: NOT ASSESSABLE. Genome integration: NOT ASSESSABLE.',
      'Do not combine reference AUCs into nanite-binding or genomic-safety predictions.',
      sources.repo,
    ].join('\n');
    try { await Share.share({ message }); }
    catch { Alert.alert('Share unavailable', 'Please try the Android share action again.'); }
  }
  return <View>
    <Text style={s.over}>SCIENTIFIC LIBRARY / 2026-10-18</Text>
    <Text style={s.title}>BSNG Evidence Register</Text>
    <Text style={s.body}>A source-grounded summary of our project research. Each reference keeps its own evidence boundary; this screen does not run experiments or download genomic records.</Text>
    <View style={s.hero}>
      <Text style={s.heroTitle}>Computational evidence is not physical proof</Text>
      <Text style={s.body}>RNA and protein references have separately reported retrospective metrics. BSNG nanite attachment, hybrid coupling and genomic integration remain unvalidated.</Text>
    </View>
    {evidence.map(item => {
      const isExpanded = expanded.includes(item.key);
      return <View key={item.key} style={s.card}>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{expanded: isExpanded}} onPress={() => toggle(item.key)}>
          <Text style={s.cardHeading}>{item.heading}</Text>
          <Text style={[s.status, {color:item.statusColor}]}>{item.status}</Text>
          <Text style={s.body}>{item.summary}</Text>
          <Text style={s.expand}>{isExpanded ? 'HIDE DETAILS −' : 'VIEW DETAILS +'}</Text>
        </TouchableOpacity>
        {isExpanded && <View style={s.detailBlock}>
          {item.details.map((detail, index) => <Text key={index} style={s.detail}>• {detail}</Text>)}
          {item.link && <TouchableOpacity accessibilityRole="link" onPress={() => openSource(item.link!)} style={s.link}><Text style={s.linkText}>{item.linkTitle} ↗</Text></TouchableOpacity>}
        </View>}
      </View>;
    })}
    <View style={s.card}>
      <Text style={s.cardHeading}>What was added to the app</Text>
      {releaseNotes.map((line,index)=><Text key={index} style={s.detail}>• {line}</Text>)}
    </View>
    <View style={s.card}>
      <Text style={s.cardHeading}>Project materials on record</Text>
      <Text style={s.body}>The project archive includes the technical dossier, white paper, patent draft, tablet schematics, app source/APKs, reference manifest, and TrueOT benchmark. These documents are not embedded in this public mobile update.</Text>
      <Text style={s.body}>Next research questions include independent binding measurements, controls and safety evidence. There is no clinical or therapeutic readiness claim.</Text>
      <TouchableOpacity accessibilityRole="link" onPress={() => openSource('upstream')} style={s.link}><Text style={s.linkText}>View the original TrueOT project ↗</Text></TouchableOpacity>
    </View>
    <TouchableOpacity style={s.button} accessibilityRole="button" onPress={shareSummary}><Text style={s.buttonText}>SHARE EVIDENCE SUMMARY</Text></TouchableOpacity>
    <Text style={[s.over, {textAlign:'center', marginTop:23}]}>READ-ONLY SNAPSHOT • NO PATIENT DATA</Text>
  </View>;
}
const s = StyleSheet.create({
  over:{color:C.cyan,fontSize:10,fontWeight:'900',letterSpacing:1.4,marginBottom:9},
  title:{fontSize:27,fontWeight:'900',color:C.white,marginBottom:9},
  body:{fontSize:13,color:C.muted,lineHeight:20,marginTop:8},
  hero:{padding:16,borderWidth:1,borderColor:'#785B44',borderRadius:14,backgroundColor:'#221C22',marginTop:16,marginBottom:16},
  heroTitle:{fontSize:16,fontWeight:'900',color:C.amber},
  card:{backgroundColor:C.panel,borderWidth:1,borderColor:C.border,borderRadius:14,padding:16,marginBottom:13},
  cardHeading:{color:C.white,fontSize:15,fontWeight:'800',lineHeight:22},
  status:{fontWeight:'900',fontSize:10,letterSpacing:.8,marginTop:10},
  expand:{color:C.cyan,fontWeight:'900',fontSize:11,marginTop:14},
  detailBlock:{marginTop:14,borderTopWidth:1,borderTopColor:C.border,paddingTop:8},
  detail:{color:C.muted,fontSize:12,lineHeight:19,marginTop:10},
  link:{marginTop:15,padding:12,borderRadius:8,backgroundColor:'#143343',alignSelf:'flex-start'},
  linkText:{color:C.cyan,fontSize:12,fontWeight:'800'},
  button:{borderRadius:9,padding:14,backgroundColor:C.cyan,alignItems:'center',marginTop:4},
  buttonText:{fontSize:11,fontWeight:'900',color:C.bg,letterSpacing:1},
});
