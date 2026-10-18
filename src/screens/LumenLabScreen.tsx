import React, { useState } from 'react';
import { Linking, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { analyzeSequence, normalizeSequence } from '../lib/sequence';

const C = {panel:'#101C2C',border:'#284158',cyan:'#56E8E3',violet:'#AF90FF',
  amber:'#F9C878',white:'#E9F5FC',muted:'#94AABF',green:'#75DAAF'};
type Props = {sequence:string;sampleName:string};
type MiniAudit = {length:number;gc:number;max:number;positions:string;reversal:boolean};
const RC = (s:string) => s.split('').reverse().map(x=>({A:'T',T:'A',G:'C',C:'G'} as Record<string,string>)[x]).join('');

export default function LumenLabScreen({sequence,sampleName}:Props) {
  const [audit,setAudit] = useState<MiniAudit|null>(null);
  const [error,setError] = useState('');
  function run() {
    try {
      const seq = normalizeSequence(sequence);
      const summary = analyzeSequence(seq);
      const maxGC = Math.max(...summary.topWindows.map(w=>w.gcFraction));
      const positions = summary.topWindows.filter(w=>w.gcFraction===maxGC).slice(0,5).map(w=>w.index).join(', ');
      setAudit({length:summary.length,gc:summary.gcFraction,max:maxGC,positions,reversal:RC(RC(seq))===seq});
      setError('');
    } catch(e) {setError(e instanceof Error?e.message:'Invalid sequence');setAudit(null);}
  }
  async function share() {
    if (!audit) return;
    await Share.share({message:[
      'Lumen local sequence audit (NOT a biological binding prediction)',
      'Sample: '+sampleName,'Length: '+audit.length+' bp','GC: '+(audit.gc*100).toFixed(1)+'%',
      'Maximum 15-base-window GC: '+(audit.max*100).toFixed(1)+'%','Local 0-based offsets: '+audit.positions,
      'Reverse-complement code check: '+(audit.reversal?'PASS':'FAIL'),
      'Physical BSNG hybrid binding and genomic integration: NOT ASSESSABLE.'].join('\n')});
  }
  return <View>
    <Text style={s.eyebrow}>LUMEN / HYPOTHESIS TESTING</Text>
    <Text style={s.title}>Research Intelligence</Text>
    <Text style={s.para}>An evidence-first research console for the BSNG thesis. This app runs short local DNA statistics; the separate GitHub research engine runs four independent worker-thread analyses.</Text>
    <View style={s.card}>
      <Text style={s.cardTitle}>Computational lanes</Text>
      {['Sequence composition','15-base windows and local offsets','Reverse-complement integrity check','64 seeded shuffled negative controls (cloud runner)'].map((label,i)=><Text key={i} style={s.row}>◈ {label}</Text>)}
      <Text style={s.note}>Cloud research audits run in GitHub Actions and produce downloadable JSON audit reports. They are not yet fetched back into this app.</Text>
    </View>
    <View style={s.card}>
      <Text style={s.cardTitle}>Local sequence check</Text>
      <Text style={s.para}>Current input: {sampleName}</Text>
      <TouchableOpacity accessibilityRole="button" style={s.btn} onPress={run}><Text style={s.btnText}>RUN LOCAL CHECK</Text></TouchableOpacity>
      {!!error && <Text style={s.warning}>{error}</Text>}
      {audit && <View style={{marginTop:14}}>
        <Text style={s.result}>{audit.length} bases · {(audit.gc*100).toFixed(1)}% GC</Text>
        <Text style={s.para}>Highest 15-base GC fraction: {(audit.max*100).toFixed(1)}%</Text>
        <Text style={s.para}>Local offsets (0-based): {audit.positions || 'none'}</Text>
        <Text style={s.para}>Strand-check: {audit.reversal?'PASS':'FAIL'}</Text>
        <Text style={s.note}>These are local sequence offsets, not validated human-genome positions or proposed insertion sites.</Text>
        <TouchableOpacity accessibilityRole="button" style={s.subBtn} onPress={share}><Text style={s.subText}>SHARE LOCAL AUDIT</Text></TouchableOpacity>
      </View>}
    </View>
    <View style={s.card}>
      <Text style={s.cardTitle}>AI reviewer / Lumen</Text>
      <Text style={s.warning}>REMOTE MODEL: NOT VERIFIED CONNECTED</Text>
      <Text style={s.para}>Optional server-side AI review is designed to examine aggregate results, question assumptions and report contradictions. The phone contains no AI API key and does not send your DNA sequence to the model.</Text>
      <TouchableOpacity accessibilityRole="link" style={s.subBtn} onPress={()=>{void Linking.openURL('https://github.com/jacquesjacobs77/BSNG-Mobile/actions/workflows/lumen-research.yml');}}><Text style={s.subText}>VIEW CLOUD RESEARCH AUDITS ↗</Text></TouchableOpacity>
    </View>
    <View style={s.card}>
      <Text style={s.cardTitle}>Current thesis status</Text>
      <Text style={s.warning}>INSUFFICIENT EVIDENCE TO PROVE OR DISPROVE</Text>
      <Text style={s.para}>TrueOT RNA-guided and CTCF protein references are separately retrospective. Neither is an experimentally characterized BSNG hybrid. Genomic insertion safety, cellular energy use, replication control and therapeutic performance require independent evidence.</Text>
    </View>
  </View>;
}
const s=StyleSheet.create({
  eyebrow:{color:C.cyan,fontSize:10,fontWeight:'900',letterSpacing:1.2,marginBottom:9},
  title:{color:C.white,fontSize:27,fontWeight:'900',marginBottom:7},
  para:{color:C.muted,fontSize:13,lineHeight:20,marginTop:8},
  card:{backgroundColor:C.panel,borderColor:C.border,borderWidth:1,borderRadius:14,padding:16,marginTop:14},
  cardTitle:{color:C.white,fontSize:16,fontWeight:'800'},
  row:{color:C.violet,fontSize:12,lineHeight:24,marginTop:5},
  note:{color:C.amber,fontSize:11,lineHeight:17,marginTop:12},
  warning:{color:C.amber,fontSize:11,fontWeight:'800',marginTop:12},
  result:{color:C.green,fontSize:17,fontWeight:'900'},
  btn:{backgroundColor:C.cyan,borderRadius:9,padding:14,marginTop:15,alignItems:'center'},
  btnText:{color:'#071522',fontWeight:'900',fontSize:11},
  subBtn:{backgroundColor:'#183346',borderRadius:9,padding:13,marginTop:13,alignItems:'center'},
  subText:{color:C.cyan,fontSize:11,fontWeight:'900'}
});
