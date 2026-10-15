import React, { useState } from 'react';
import { Alert, ScrollView, Share, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { analyzeSequence, normalizeSequence, SAMPLE_SEQUENCE, DEMO_MAX_BASES, type SequenceSummary } from './src/lib/sequence';
import ResearchScreen from './src/screens/ResearchScreen';
import BiologicalEvidencePanel from './src/screens/BiologicalEvidencePanel';

type Page = 'overview' | 'scan' | 'research' | 'nanite' | 'results' | 'notes' | 'settings';
type Note = { id: number; title: string; body: string };
const colors = { bg:'#070E1B', panel:'#101C2C', border:'#284158', cyan:'#56E8E3', purple:'#AF90FF', green:'#75DAAF', amber:'#F9C878', white:'#E9F5FC', muted:'#94AABF' };
const menu: {id:Page;label:string;glyph:string}[] = [
  {id:'overview',label:'Overview',glyph:'⌂'}, {id:'scan',label:'Sequence',glyph:'⌁'}, {id:'research',label:'Research',glyph:'◈'}, {id:'nanite',label:'Nanite',glyph:'⬡'},
  {id:'results',label:'Results',glyph:'▥'}, {id:'notes',label:'Notes',glyph:'✎'}, {id:'settings',label:'Settings',glyph:'⚙'}
];
const para = (text:string) => <Text style={s.para}>{text}</Text>;
function Tag({text, color=colors.cyan}:{text:string;color?:string}) {
  return <View style={[s.tag,{borderColor:color,backgroundColor:colors.bg}]}><Text style={{color,fontWeight:'800',fontSize:10}}>{text}</Text></View>;
}
function Box({children}:{children:React.ReactNode}) {return <View style={s.box}>{children}</View>;}
function Title({eyebrow,title,detail}:{eyebrow:string;title:string;detail:string}) {
  return <View style={{marginBottom:18}}><Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text><Text style={s.title}>{title}</Text>{para(detail)}</View>;
}
function Button({label,onPress,outlined=false}:{label:string;onPress:()=>void;outlined?:boolean}) {
  return <TouchableOpacity accessibilityRole="button" onPress={onPress} style={[s.button,outlined&&s.buttonOutline]}>
    <Text style={[s.buttonText,outlined&&{color:colors.cyan}]}>{label}</Text></TouchableOpacity>;
}
function AppBody() {
  const {width,height}=useWindowDimensions();
  const wide=width>=720, half=width>=500;
  const [page,setPage]=useState<Page>('overview');
  const [sequence,setSequence]=useState(SAMPLE_SEQUENCE);
  const [sampleName,setSampleName]=useState('Built-in sequence demo');
  const [result,setResult]=useState<SequenceSummary|null>(null);
  const [hypothesis,setHypothesis]=useState('Nucleic-acid recognition interface');
  const [noteTitle,setNoteTitle]=useState('');
  const [noteBody,setNoteBody]=useState('');
  const [notes,setNotes]=useState<Note[]>([]);
  function analyze() {
    try {setResult(analyzeSequence(sequence));setPage('results');}
    catch(err) {Alert.alert('Sequence input',err instanceof Error?err.message:'Input error');}
  }
  function addNote() {
    if(!noteTitle.trim()||!noteBody.trim()){Alert.alert('Complete the note','Enter a title and observation.');return;}
    setNotes([{id:Date.now(),title:noteTitle.trim(),body:noteBody.trim()},...notes]);
    setNoteTitle('');setNoteBody('');
  }
  async function share() {
    if (!result) return;
    const lines=['BSNG v0.1 — GC COMPOSITION DEMO (NOT BIOLOGICAL VALIDATION)',
      'Sample: '+sampleName,'Length: '+result.length+' bp',
      'GC composition: '+(result.gcFraction*100).toFixed(1)+'%',
      'Windows (0-based start positions):',
      ...result.topWindows.map(w=>w.index+' '+w.sequence+' '+(w.gcFraction*100).toFixed(1)+'%'),
      'No nanite binding has been modeled or experimentally demonstrated.'];
    try {await Share.share({message:lines.join('\n')});}catch {Alert.alert('Share unavailable');}
  }
  function quick(glyph:string,title:string,detail:string,target:Page) {
    return <TouchableOpacity key={target} onPress={()=>setPage(target)} style={[s.quick,{width:half?'48.7%':'100%'}]}>
      <Text style={{fontSize:28,color:target==='nanite'?colors.purple:colors.cyan}}>{glyph}</Text>
      <Text style={s.cardTitle}>{title}</Text>{para(detail)}
      <Text style={{color:colors.cyan,fontWeight:'800',fontSize:11,marginTop:14}}>OPEN →</Text>
    </TouchableOpacity>;
  }
  function overview() {return <>
    <Title eyebrow="research console / v0.2" title="BSNG Research Studio" detail="BioSynaptic NanoGenesis — responsive scientific workspace prototype."/>
    <Box><Tag text="UI PROTOTYPE"/><Text style={s.big}>Explore. Model. Evaluate.</Text>
      {para('An interface for biological sequence analysis, computational hypotheses, research notes and reproducible results.')}
      <View style={s.tags}><Tag text="LOCAL GC DEMO" color={colors.green}/><Tag text="AI NOT CONNECTED" color={colors.amber}/></View>
    </Box>
    <View style={s.grid}>
      <View style={[s.metric,{width:half?'48.7%':'100%'}]}><Text style={s.dim}>LOCAL DEMO LIMIT</Text><Text style={s.value}>5,000 bp</Text></View>
      <View style={[s.metric,{width:half?'48.7%':'100%'}]}><Text style={s.dim}>BACKEND BATCH TARGET</Text><Text style={[s.value,{color:colors.purple}]}>15M bp</Text></View>
    </View>
    <Text style={s.eyebrow}>WORKSPACES</Text>
    <View style={s.grid}>
      {quick('⌁','Sequence analysis','Run local GC demonstration','scan')}
      {quick('◈','Research lab','Live-input genomic signal dashboard','research')}
      {quick('⬡','Nanite hypotheses','Explore research categories','nanite')}
      {quick('▥','Results','Examine and share a report','results')}
      {quick('✎','Lab notebook','Record session observations','notes')}
    </View>
    <Box><Text style={s.dim}>RESEARCH INTEGRITY</Text>{para('GC content does not demonstrate biological nanite compatibility, selective binding or therapeutic activity.')}</Box>
  </>;}
  function scan(){return <>
    <Title eyebrow="module 01 / sequence" title="Sequence Analysis" detail="Short A/C/G/T text only. Full genome processing is a planned server-side feature."/>
    <Box><Tag text="LOCAL DEMO" color={colors.amber}/>
      <Text style={s.fieldLabel}>Sequence label</Text>
      <TextInput style={s.input} value={sampleName} onChangeText={setSampleName} maxLength={90} placeholderTextColor={colors.muted}/>
      <Text style={s.fieldLabel}>DNA sequence</Text>
      <TextInput style={[s.input,{height:170,textAlignVertical:'top',fontFamily:'monospace'}]}
        multiline autoCorrect={false} autoCapitalize="characters" value={sequence}
        maxLength={DEMO_MAX_BASES+50} onChangeText={setSequence} placeholder="Paste A/C/G/T" placeholderTextColor={colors.muted}/>
      <Text style={[s.dim,{marginBottom:16}]}>{normalizeSequence(sequence).length+' / 5,000 bases • 15-bp windows'}</Text>
      <Button label="RUN LOCAL GC DEMO" onPress={analyze}/>
      <Button label="RESTORE SAMPLE" outlined onPress={()=>{setSequence(SAMPLE_SEQUENCE);setSampleName('Built-in sequence demo');}}/>
    </Box>
    <Box><Text style={[s.eyebrow,{color:colors.purple}]}>NOT IMPLEMENTED — GENOME BACKEND</Text>
      {para('15-million-bp streaming batches, reference genome loading, checkpoints and resumed scans require a dedicated computational service.')}
    </Box>
  </>;}
  function nanite(){return <>
    <Title eyebrow="module 02 / concepts" title="Nanite Model" detail="Research hypotheses, not verified physical nanite designs."/>
    <Box><Text style={s.dim}>HYPOTHESIS CATEGORY</Text>
      {['Nucleic-acid recognition interface','Protein / peptide recognition interface','Hybrid bio-inspired interface'].map(item=>
        <TouchableOpacity key={item} onPress={()=>setHypothesis(item)} style={[s.option,hypothesis===item&&{borderColor:colors.purple}]}>
          <Text style={{color:hypothesis===item?colors.purple:colors.muted,fontSize:16,marginRight:9}}>{hypothesis===item?'◉':'○'}</Text>
          <Text style={{color:colors.white,flex:1,fontSize:13}}>{item}</Text>
        </TouchableOpacity>)}
    </Box>
    <Box><Tag text="CONCEPTUAL / UNVERIFIED" color={colors.amber}/>
      <Text style={s.cardTitle}>{hypothesis}</Text>
      {para('Research question: what evidence and biological constraints would be required to assess specificity, safety and feasibility?')}
      {para('No material specification, experimental binding constant or nanite construct is supplied by this prototype.')}
    </Box>
  </>;}
  function results(){return <>
    <Title eyebrow="module 03 / evidence registry" title="Results & Reports" detail="Published human-genome reference evidence, with a separate local GC composition demonstration. No physical BSNG nanite binding has been experimentally validated."/>
    <BiologicalEvidencePanel/>
    {!result?<Box><Tag text="NO RESULTS" color={colors.amber}/>{para('Run the local sequence demo to create a composition report.')}<Button label="OPEN SEQUENCE ANALYSIS" onPress={()=>setPage('scan')}/></Box>:<>
      <View style={s.grid}>
        <View style={[s.metric,{width:half?'48.7%':'100%'}]}><Text style={s.dim}>LENGTH</Text><Text style={s.value}>{result.length+' bp'}</Text></View>
        <View style={[s.metric,{width:half?'48.7%':'100%'}]}><Text style={s.dim}>GC CONTENT</Text><Text style={s.value}>{(result.gcFraction*100).toFixed(1)+'%'}</Text></View>
      </View>
      <Box><Text style={s.dim}>WINDOW GC DISTRIBUTION — 0 TO 100%</Text>
        <View style={s.chart}>{result.plotFractions.map((v,i)=><View key={i} style={{flex:1,height:Math.max(4,v*100),backgroundColor:i%3===0?colors.purple:colors.cyan,marginHorizontal:1}}/>)}</View>
      </Box>
      <Box><Text style={s.eyebrow}>HIGHEST GC WINDOWS · 0-BASED</Text>
        {result.topWindows.map((w,i)=><View key={w.index} style={s.window}>
          <Text style={{color:colors.muted,fontSize:11}}>{'#'+(i+1)+'  at '+w.index}</Text>
          <Text selectable style={{color:colors.white,fontFamily:'monospace',fontSize:12}}>{w.sequence}</Text>
          <Text style={{color:colors.green}}>{(w.gcFraction*100).toFixed(1)+'%'}</Text>
        </View>)}
      </Box>
      <Box><Tag text="INTERPRETATION LIMIT" color={colors.amber}/>
        {para('A high GC score is not evidence of nanite binding, sequence compatibility or therapeutic effect.')}
      </Box>
      <Button label="SHARE TEXT REPORT" onPress={share}/>
      <Button label="CLEAR SESSION RESULT" outlined onPress={()=>setResult(null)}/>
    </>}
  </>;}
  function notesPage(){return <>
    <Title eyebrow="module 04 / notebook" title="Lab Notebook" detail="Session-only research notes. These are not yet persisted to a database."/>
    <Box><Tag text="SESSION ONLY" color={colors.amber}/>
      <Text style={s.fieldLabel}>Title</Text>
      <TextInput style={s.input} value={noteTitle} onChangeText={setNoteTitle} maxLength={100} placeholder="Research question" placeholderTextColor={colors.muted}/>
      <Text style={s.fieldLabel}>Observation</Text>
      <TextInput style={[s.input,{height:120,textAlignVertical:'top'}]} multiline maxLength={2500} value={noteBody} onChangeText={setNoteBody} placeholder="Assumptions, observations, follow-up sources..." placeholderTextColor={colors.muted}/>
      <Button label="SAVE FOR THIS SESSION" onPress={addNote}/>
    </Box>
    <Text style={s.eyebrow}>{'SESSION NOTES ('+notes.length+')'}</Text>
    {notes.length===0?<Box>{para('No notes yet.')}</Box>:notes.map(note=><View key={note.id} style={s.box}><Text style={s.cardTitle}>{note.title}</Text>{para(note.body)}</View>)}
  </>;}
  function settings(){return <>
    <Title eyebrow="system status" title="Settings" detail="Project capabilities and planned research integrations."/>
    <Box>
      <Text style={s.cardTitle}>BSNG Studio v0.2</Text>
      {para('Orientation: automatic ('+(width>height?'landscape':'portrait')+')')}
      {para('Local GC demo: active')}
      {para('JASTUDIO AI Brain: not connected')}
      {para('BSNG desktop simulator: not connected')}
      {para('Research database: not connected')}
      {para('Reference genome: not loaded')}
    </Box>
    <Box><Text style={[s.eyebrow,{color:colors.purple}]}>PLANNED BACKEND TARGETS</Text>
      {para('15M-base streaming batches • persisted checkpoints • authenticated AI assistance • immutable analysis history • reference validation.')}
    </Box>
    <Box><Text style={s.dim}>DATA PROTECTION</Text>
      {para('Do not add identifiable human genomic data or API keys to this prototype. No network data submission or permanent notes storage is provided.')}
    </Box>
  </>;}
  const screens:Record<Page,()=>React.ReactNode>={overview,scan,research:()=> <ResearchScreen sequence={sequence} setSequence={setSequence} sampleName={sampleName} setSampleName={setSampleName} onOpenResults={analyze}/>,nanite,results,notes:notesPage,settings};
  return <SafeAreaView style={s.safe} edges={['top','left','right','bottom']}>
    <StatusBar barStyle="light-content" backgroundColor={colors.bg}/>
    <View style={s.header}>
      <TouchableOpacity onPress={()=>setPage('overview')} style={s.logo}><Text style={{color:colors.cyan,fontSize:23}}>⌬</Text></TouchableOpacity>
      <View style={{flex:1}}><Text style={{color:colors.white,fontSize:15,fontWeight:'900',letterSpacing:1}}>BSNG <Text style={{color:colors.cyan}}>STUDIO</Text></Text><Text style={s.dim}>SCIENTIFIC RESEARCH CONSOLE</Text></View>
      <TouchableOpacity accessibilityLabel="Settings" onPress={()=>setPage('settings')} style={{padding:11}}><Text style={{color:colors.muted,fontSize:20}}>⚙</Text></TouchableOpacity>
    </View>
    <View style={{flex:1,flexDirection:'row'}}>
      {wide&&<View style={s.side}>
        <Text style={s.dim}>WORKSPACES</Text>
        {menu.map(item=><TouchableOpacity key={item.id} onPress={()=>setPage(item.id)} style={[s.sideItem,page===item.id&&{backgroundColor:'#103241'}]}>
          <Text style={{color:page===item.id?colors.cyan:colors.muted,fontSize:20,width:29}}>{item.glyph}</Text>
          <Text style={{color:page===item.id?colors.cyan:colors.muted,fontSize:12,fontWeight:'700'}}>{item.label}</Text>
        </TouchableOpacity>)}
      </View>}
      <ScrollView style={{flex:1}} keyboardShouldPersistTaps="handled" contentContainerStyle={s.scroll}>
        <View style={{width:'100%',maxWidth:980,alignSelf:'center'}}>{screens[page]()}
          <Text style={[s.dim,{textAlign:'center',marginTop:25}]}>BSNG / RESEARCH SANDBOX • v0.2</Text>
        </View>
      </ScrollView>
    </View>
    {!wide&&<ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bottom} contentContainerStyle={{flexGrow:1,alignItems:'center',justifyContent:'space-around',paddingHorizontal:4}}>
      {menu.map(item=><TouchableOpacity key={item.id} onPress={()=>setPage(item.id)} style={[s.bottomItem,page===item.id&&{backgroundColor:'#123440'}]}>
        <Text style={{fontSize:20,color:page===item.id?colors.cyan:colors.muted}}>{item.glyph}</Text>
        <Text style={{fontSize:10,color:page===item.id?colors.cyan:colors.muted}}>{item.label}</Text>
      </TouchableOpacity>)}
    </ScrollView>}
  </SafeAreaView>;
}
export default function App(){return <SafeAreaProvider><AppBody/></SafeAreaProvider>;}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg},
  header:{minHeight:68,paddingHorizontal:16,flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:colors.border,gap:12},
  logo:{width:42,height:42,borderWidth:1,borderColor:'#37717F',borderRadius:11,alignItems:'center',justifyContent:'center',backgroundColor:'#12303A'},
  scroll:{padding:19,paddingBottom:30},
  side:{width:215,borderRightWidth:1,borderRightColor:colors.border,padding:14},
  sideItem:{padding:12,marginTop:9,borderRadius:10,flexDirection:'row',alignItems:'center',gap:7},
  bottom:{maxHeight:74,borderTopWidth:1,borderTopColor:colors.border,backgroundColor:'#091626'},
  bottomItem:{minWidth:68,paddingHorizontal:9,paddingVertical:6,borderRadius:10,alignItems:'center',gap:2},
  eyebrow:{color:colors.cyan,fontSize:10,fontWeight:'800',letterSpacing:1.4,marginBottom:9},
  title:{color:colors.white,fontSize:28,fontWeight:'900',marginBottom:10},
  para:{color:colors.muted,fontSize:13,lineHeight:20,marginTop:8},
  box:{backgroundColor:colors.panel,borderWidth:1,borderColor:colors.border,borderRadius:14,padding:17,marginBottom:14},
  tag:{borderWidth:1,borderRadius:30,paddingHorizontal:9,paddingVertical:5,alignSelf:'flex-start',marginBottom:10},
  big:{fontSize:23,fontWeight:'800',color:colors.white,marginBottom:4},
  tags:{flexDirection:'row',gap:7,flexWrap:'wrap',marginTop:17},
  dim:{color:colors.muted,fontSize:10,fontWeight:'800',letterSpacing:1},
  metric:{minWidth:130,flexGrow:1,backgroundColor:colors.panel,borderWidth:1,borderColor:colors.border,borderRadius:13,padding:15},
  value:{fontSize:22,fontWeight:'900',color:colors.cyan,marginTop:8},
  grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:9,marginBottom:15},
  quick:{backgroundColor:colors.panel,borderWidth:1,borderColor:colors.border,borderRadius:13,padding:16,minHeight:166,justifyContent:'center'},
  cardTitle:{fontWeight:'800',fontSize:15,color:colors.white,marginVertical:7},
  fieldLabel:{color:colors.white,fontWeight:'700',fontSize:12,marginTop:13,marginBottom:7},
  input:{backgroundColor:'#081526',borderWidth:1,borderColor:'#36506A',borderRadius:9,padding:12,color:colors.white,fontSize:13},
  button:{backgroundColor:colors.cyan,borderRadius:10,alignItems:'center',justifyContent:'center',padding:14,marginTop:12},
  buttonOutline:{backgroundColor:'#12313E',borderColor:'#316371',borderWidth:1},
  buttonText:{color:'#08141D',fontWeight:'900',letterSpacing:1,fontSize:11},
  option:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,marginTop:10},
  chart:{height:115,flexDirection:'row',alignItems:'flex-end',marginTop:15,borderBottomWidth:1,borderBottomColor:colors.border},
  window:{flexDirection:'row',justifyContent:'space-between',gap:7,paddingVertical:13,borderBottomWidth:1,borderBottomColor:colors.border},
});
