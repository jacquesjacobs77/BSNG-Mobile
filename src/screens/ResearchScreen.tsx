import React, { useMemo } from 'react';
import { Text, TextInput, TouchableOpacity, View, useWindowDimensions, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Polyline, Rect, Stop } from 'react-native-svg';
import { analyzeSequence, normalizeSequence, SAMPLE_SEQUENCE, DEMO_MAX_BASES, type SequenceSummary } from '../lib/sequence';

const C={bg:'#070E1B',panel:'#0C1A2A',panel2:'#0B2133',edge:'#28506A',cyan:'#53E3E0',blue:'#64AFFF',violet:'#AA82FF',green:'#70DCB0',muted:'#96AEC3',white:'#E6F7FF',amber:'#FFCC83'};
type Props={sequence:string;setSequence:(value:string)=>void;sampleName:string;onOpenResults:()=>void};
const pct=(f:number)=>(f*100).toFixed(1)+'%';
function Panel({children,style}:{children:React.ReactNode;style?:object}){return <View style={[s.panel,style]}>{children}</View>;}
function Caption({children}:{children:React.ReactNode}){return <Text style={s.caption}>{children}</Text>;}
function Pulse({values}:{values:number[]}){
  const width=320, height=106;
  const points=values.map((v,i)=>({x:10+(i/Math.max(1,values.length-1))*(width-20),y:height-8-v*(height-23)}));
  const str=points.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
  return <Svg viewBox={'0 0 '+width+' '+height} width="100%" height={112} accessibilityLabel="GC fraction by sliding-window region">
    <Defs><LinearGradient id="pulse" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={C.cyan}/><Stop offset="1" stopColor={C.violet}/></LinearGradient></Defs>
    {[25,52,80].map(y=><Line key={y} x1="0" y1={y} x2={width} y2={y} stroke="#1D3549" strokeWidth="1" strokeDasharray="3 5"/>)}
    <Polyline points={str} fill="none" stroke="url(#pulse)" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"/>
    {points.map((p,i)=>i%3===0?<Circle key={i} cx={p.x} cy={p.y} r={2.4} fill={C.cyan}/>:null)}
  </Svg>;
}
function Helix({sequence}:{sequence:string}){
  const letters=normalizeSequence(sequence).slice(0,20).split('');
  const len=Math.max(letters.length,15), mids=Array.from({length:len},(_,i)=>i), h=240;
  const xA=(i:number)=>170+62*Math.sin(i*.58), xB=(i:number)=>170-62*Math.sin(i*.58), y=(i:number)=>18+i*(h-35)/(len-1);
  const a=mids.map(i=>'L '+xA(i).toFixed(2)+' '+y(i).toFixed(2)).join(' ').replace(/^L/,'M');
  const b=mids.map(i=>'L '+xB(i).toFixed(2)+' '+y(i).toFixed(2)).join(' ').replace(/^L/,'M');
  const points=[{x:36,y:45},{x:70,y:174},{x:275,y:38},{x:309,y:189},{x:250,y:210},{x:104,y:32},{x:32,y:221},{x:301,y:111}];
  return <Svg width="100%" height={245} viewBox="0 0 340 245" accessibilityLabel="Symbolic DNA visualization using the entered sequence">
    <Defs><LinearGradient id="helixA"><Stop offset="0" stopColor={C.blue}/><Stop offset="1" stopColor={C.cyan}/></LinearGradient><LinearGradient id="helixB"><Stop offset="0" stopColor={C.violet}/><Stop offset="1" stopColor={C.blue}/></LinearGradient></Defs>
    {points.map((p,i)=><React.Fragment key={i}><Line x1={p.x} y1={p.y} x2={170} y2={120} stroke="#236B96" strokeOpacity=".4" strokeWidth=".8"/><Circle cx={p.x} cy={p.y} r="4" fill="#173E63" stroke={i%2?C.violet:C.cyan} strokeWidth="1.2"/></React.Fragment>)}
    {mids.map(i=><Line key={i} x1={xA(i)} y1={y(i)} x2={xB(i)} y2={y(i)}
       stroke={letters[i]==='G'||letters[i]==='C'?C.cyan:C.violet} strokeOpacity=".78" strokeWidth={3.2} strokeLinecap="round"/>)}
    <Path d={a} stroke="url(#helixA)" fill="none" strokeWidth="5" strokeLinecap="round"/>
    <Path d={b} stroke="url(#helixB)" fill="none" strokeWidth="5" strokeLinecap="round"/>
    {mids.map(i=><Circle key={'ca'+i} cx={xA(i)} cy={y(i)} r="3.5" fill={C.cyan} opacity=".9"/>)}
    {mids.map(i=><Circle key={'cb'+i} cx={xB(i)} cy={y(i)} r="3.5" fill={C.violet} opacity=".85"/>)}
  </Svg>;
}
function BaseGrid({sequence}:{sequence:string}){
  const bases=normalizeSequence(sequence).slice(0,120).split('');
  const color=(b:string)=>b==='G'?C.cyan:b==='C'?C.violet:b==='A'?C.blue:C.green;
  return <View style={s.tiles} accessibilityLabel="First 120 sequence bases colored by nucleotide type">
   {bases.map((b,i)=><View key={i} style={[s.tile,{backgroundColor:color(b)+'24',borderColor:color(b)+'66'}]}><Text style={{color:color(b),fontSize:10,fontWeight:'800'}}>{b}</Text></View>)}
  </View>;
}
function Gauge({fraction,label}:{fraction:number;label:string}){
  const r=32,circ=2*Math.PI*r;
  return <View style={{alignItems:'center',minWidth:94,flex:1}}>
    <View style={{width:85,height:85,alignItems:'center',justifyContent:'center'}}>
      <Svg width={85} height={85} viewBox="0 0 100 100"><Circle cx="50" cy="50" r={r} fill="none" stroke="#244258" strokeWidth="9"/>
        <Circle cx="50" cy="50" r={r} fill="none" stroke={C.cyan} strokeWidth="9" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ*(1-fraction)} strokeLinecap="round" rotation="-90" origin="50,50"/>
      </Svg>
      <Text style={{position:'absolute',fontSize:15,color:C.white,fontWeight:'900'}}>{pct(fraction)}</Text>
    </View><Text style={s.mini}>{label}</Text>
  </View>;
}
export default function ResearchScreen({sequence,setSequence,sampleName,onOpenResults}:Props){
  const {width}=useWindowDimensions();
  const usable=width>=720?Math.min(980,width-280):width-38;
  const wide=usable>=690;
  const cleaned=normalizeSequence(sequence);
  const counts=useMemo(()=>({A:[...cleaned].filter(c=>c==='A').length,C:[...cleaned].filter(c=>c==='C').length,G:[...cleaned].filter(c=>c==='G').length,T:[...cleaned].filter(c=>c==='T').length}),[cleaned]);
  const state=useMemo<{result:SequenceSummary|null;error:string}>(()=>{
    try{return {result:analyzeSequence(sequence),error:''};}
    catch(e){return {result:null,error:e instanceof Error?e.message:'Invalid input'};}
  },[sequence]);
  const gc=state.result?.gcFraction??0;
  const signal=state.result?.plotFractions??[];
  return <View style={{paddingBottom:15}}>
    <View style={s.top}><View style={{flex:1}}><Text style={s.over}>RESEARCH CONSOLE / V0.2</Text>
      <Text style={s.title}>Genomic Signal Analysis</Text><Text style={s.sub}>Real-time local DNA composition · scientific research sandbox</Text></View>
      <View style={s.live}><View style={s.dot}/><Text style={{color:C.green,fontWeight:'900',fontSize:10}}>LIVE INPUT</Text></View>
    </View>
    <View style={[s.hero,{flexDirection:wide?'row':'column'}]}>
      <View style={{flex:wide?1.4:undefined}}>
        <Text style={s.over}>INTERACTIVE SEQUENCE MAP</Text><Helix sequence={sequence}/>
        <Text style={[s.mini,{textAlign:'center'}]}>Symbolic DNA illustration • not a molecular simulation</Text>
      </View>
      <View style={{flex:1,justifyContent:'center',padding:8}}>
        <Caption>ACTIVE INPUT</Caption>
        <Text style={{fontSize:15,fontWeight:'800',color:C.white,marginTop:6}} numberOfLines={2}>{sampleName}</Text>
        <Text style={s.data}>{cleaned.length.toLocaleString()+' bp'}</Text>
        <Gauge fraction={gc} label="GC composition"/>
        <View style={s.chips}><Text style={s.chip}>A {counts.A}</Text><Text style={s.chip}>C {counts.C}</Text><Text style={s.chip}>G {counts.G}</Text><Text style={s.chip}>T {counts.T}</Text></View>
      </View>
    </View>
    <View style={[s.modules,{flexDirection:wide?'row':'column'}]}>
      <Panel style={{flex:1}}>
        <Caption>WINDOW GC SIGNAL</Caption>
        {state.result?<Pulse values={signal}/>:<Text style={s.muted}>{state.error}</Text>}
        <Text style={s.mini}>15-bp sliding windows · values computed from entered DNA</Text>
      </Panel>
      <Panel style={{flex:1}}>
        <Caption>NUCLEOTIDE COMPOSITION</Caption>
        {(['A','C','G','T'] as const).map(b=><View key={b} style={s.barRow}><Text style={[s.barName,{color:b==='A'?C.blue:b==='C'?C.violet:b==='G'?C.cyan:C.green}]}>{b}</Text><View style={s.track}><View style={{height:10,width:`${Math.round((cleaned.length?counts[b]/cleaned.length:0)*100)}%` as `${number}%`,borderRadius:8,backgroundColor:b==='A'?C.blue:b==='C'?C.violet:b==='G'?C.cyan:C.green}}/></View><Text style={s.barValue}>{counts[b]}</Text></View>)}
      </Panel>
    </View>
    <Panel><Caption>LIVE SEQUENCE READS — FIRST 120 BASES</Caption>
      <Text style={s.mini}>Enter or paste a different sequence below to refresh every panel.</Text>
      <BaseGrid sequence={sequence}/>
    </Panel>
    <Panel><Caption>LOCAL SEQUENCE INPUT</Caption>
      <TextInput accessibilityLabel="DNA sequence research input" multiline autoCorrect={false} autoCapitalize="characters" value={sequence}
        onChangeText={setSequence} style={s.input} placeholder="Enter A/C/G/T bases" placeholderTextColor={C.muted} maxLength={DEMO_MAX_BASES+50}/>
      <Text style={[s.mini,{marginTop:8}]}>{cleaned.length+' / '+DEMO_MAX_BASES+' bases • '+(state.error||'Live composition calculation ready')}</Text>
      <View style={{flexDirection:'row',gap:9,marginTop:14,flexWrap:'wrap'}}>
        <TouchableOpacity style={[s.button,{flex:1}]} onPress={onOpenResults}><Text style={s.action}>OPEN FULL REPORT →</Text></TouchableOpacity>
        <TouchableOpacity style={[s.button,{backgroundColor:'#183346',flex:1}]} onPress={()=>setSequence(SAMPLE_SEQUENCE)}><Text style={[s.action,{color:C.cyan}]}>LOAD DEMO</Text></TouchableOpacity>
      </View>
    </Panel>
    <Panel><Caption>INTERPRETATION AND DATA PROVENANCE</Caption>
      <Text style={s.muted}>All measurements above are calculated directly on this device from the sequence field. No live laboratory instrument, external genomic feed, gene-expression assay, nanite model or AI service is connected. The DNA graphic is illustrative. GC composition alone does not establish binding, compatibility or therapeutic effects.</Text>
    </Panel>
  </View>;
}
const s=StyleSheet.create({
  top:{flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:16},over:{color:C.cyan,fontSize:10,fontWeight:'900',letterSpacing:1.4},
  title:{color:C.white,fontSize:26,fontWeight:'900',marginTop:9,marginBottom:9},sub:{color:C.muted,fontSize:12,lineHeight:18},
  live:{paddingHorizontal:8,paddingVertical:7,borderRadius:9,borderWidth:1,borderColor:'#176C61',flexDirection:'row',gap:5,alignItems:'center',marginTop:2},
  dot:{width:7,height:7,borderRadius:5,backgroundColor:C.green},
  hero:{backgroundColor:C.panel2,borderWidth:1,borderColor:'#236182',borderRadius:16,padding:15,marginBottom:13,gap:10},
  caption:{color:C.cyan,fontSize:10,fontWeight:'900',letterSpacing:1.2},muted:{color:C.muted,fontSize:12,lineHeight:18,marginTop:10},
  data:{color:C.cyan,fontSize:26,fontWeight:'900',marginVertical:12},mini:{color:C.muted,fontSize:10,marginTop:5},
  panel:{backgroundColor:C.panel,borderWidth:1,borderColor:C.edge,borderRadius:14,padding:15,marginBottom:13},
  modules:{gap:12},chips:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:8},chip:{fontSize:10,fontWeight:'800',color:C.white,backgroundColor:'#16374A',paddingHorizontal:10,paddingVertical:7,borderRadius:6},
  barRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:14},barName:{width:20,fontSize:14,fontWeight:'900'},
  track:{flex:1,height:10,backgroundColor:'#1C3B50',borderRadius:8,overflow:'hidden'},
  barValue:{width:33,textAlign:'right',color:C.muted,fontSize:12},tiles:{flexDirection:'row',flexWrap:'wrap',gap:4,marginTop:13},
  tile:{width:23,height:23,borderWidth:1,alignItems:'center',justifyContent:'center',borderRadius:4},
  input:{color:C.white,fontFamily:'monospace',fontSize:12,minHeight:100,maxHeight:180,backgroundColor:'#071727',borderColor:'#2B6077',borderWidth:1,padding:11,borderRadius:9,textAlignVertical:'top',marginTop:10},
  button:{backgroundColor:C.cyan,borderRadius:9,padding:13,justifyContent:'center',alignItems:'center',minWidth:120},action:{fontSize:10,fontWeight:'900',color:'#061A24'}
});
