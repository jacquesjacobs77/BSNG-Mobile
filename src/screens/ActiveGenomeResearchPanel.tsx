import React, {useCallback,useEffect,useState} from 'react';
import {Alert,Linking,Share,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';

type IndexEntry={
 runId:string;createdAt:string;status:string;assembly:string;chromosome:string;
 start:number;end:number;bases:number;sequenceSha256:string;model:string;
 candidateCount:number;bestModelScore:number|null;githubRunUrl:string|null;
 reportPath:string;physicalBsngBindingStatus:string;
};
type Catalog={schemaVersion:number;reports:IndexEntry[]};
type Finding={
 rank:number;chromosome:string;start1BasedInclusive:number;end1BasedInclusive:number;
 strand:string;pwmLog2OddsScore:number;referencePlusStrand19:string;
 evidenceStatus:string;measuredBsngBinding:boolean;measuredIntegration:boolean;
};
type ResearchReport={
 schemaVersion:number;runId:string;generatedAt:string;codeCommit:string;status:string;
 source:{assembly:string;chromosome:string;start1BasedInclusive:number;end1BasedInclusive:number;
 bases:number;sequenceSha256:string;totalChunks:number};
 analysis:{nucleotideComposition:{gcFraction:number|null; nucleotideCounts:{N:number}};
 naturalProteinMotifScreen:{method:string;model:string;jasparMatrixId:string;
 modelPfmSha256:string;findings:Finding[];validWindows:number;ambiguousWindows:number;
 allWindowsAccountedFor:boolean}};
 evidence:{jointBsngHybridRecognition:string;genomicIntegrationFeasibility:string;
 physicalBsngBindingAffinity:string;genomicFeatureAnnotations:string;offTargetGenomeWideAssay:string};
 interpretation:string;githubRunUrl:string|null;reproducibility:{protocol:string};
};
const ROOT='https://raw.githubusercontent.com/jacquesjacobs77/BSNG-Mobile/research-results-v07';
const RUNNER='https://github.com/jacquesjacobs77/BSNG-Mobile/actions/workflows/bsng-v07-active-research.yml';
const ST={background:'#0D1D2D',panel:'#101E30',border:'#29465B',cyan:'#57E6E0',green:'#7BDBAC',
 white:'#EDF6FF',muted:'#9BB3C7',amber:'#FFD18C'};
const format=(n:number)=>n.toLocaleString('en-US');
async function readJson(path:string):Promise<unknown>{
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),18000);
 try{
  const response=await fetch(ROOT+'/'+path+'?t='+Date.now(),{
   headers:{Accept:'application/json'},signal:controller.signal
  });
  if(!response.ok)throw new Error(response.status===404?
   'No public research reports are published yet. Create the first run in GitHub Actions.':
   'Public research registry returned HTTP '+response.status);
  return await response.json();
 }finally{clearTimeout(timeout)}
}
function Line({label,value}:{label:string;value:string}){
 return <View style={s.line}><Text style={s.lineLabel}>{label}</Text><Text selectable style={s.lineValue}>{value}</Text></View>;
}
function Link({label,url}:{label:string;url:string}){
 return <TouchableOpacity accessibilityRole="link" onPress={()=>Linking.openURL(url).catch(()=>
   Alert.alert('Source unavailable','Could not open the GitHub page.'))} style={s.external}>
   <Text style={s.externalText}>{label+' ↗'}</Text>
 </TouchableOpacity>;
}
export default function ActiveGenomeResearchPanel(){
 const [chromosome,setChromosome]=useState('X');
 const [start,setStart]=useState('1000000');
 const [length,setLength]=useState('10000000');
 const [loading,setLoading]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [history,setHistory]=useState<IndexEntry[]>([]);
 const [report,setReport]=useState<ResearchReport|null>(null);
 const [more,setMore]=useState(false);

 const refresh=useCallback(async()=>{
  if(loading)return;
  setLoading(true);setError('');
  try{
   const data=await readJson('index.json') as Catalog;
   if(data?.schemaVersion!==1||!Array.isArray(data.reports))throw Error('Unexpected report registry format.');
   const rows=data.reports.filter(x=>x.assembly==='GRCh38'&&
     /^\d+-\d+$/.test(x.runId)&&/^reports\/\d+-\d+\.json$/.test(x.reportPath)&&
     x.reportPath==='reports/'+x.runId+'.json'&&x.physicalBsngBindingStatus==='NOT_ASSESSABLE');
   setHistory(rows.slice(0,50));
   if(!rows.length)setError('No verified public GRCh38 computational research reports yet.');
  }catch(err){setError(err instanceof Error?err.message:'Unable to read the public report registry.');}
  finally{setLoading(false)}
 },[loading]);
 useEffect(()=>{void refresh()},[]);

 async function selectReport(entry:IndexEntry){
  setBusy(true);setError('');
  try{
   if(!/^reports\/\d+-\d+\.json$/.test(entry.reportPath)||
     entry.reportPath!=='reports/'+entry.runId+'.json')throw Error('Invalid report path.');
   const data=await readJson(entry.reportPath) as ResearchReport;
   if(data?.schemaVersion!==1||data.runId!==entry.runId||data.source.assembly!=='GRCh38'||
     data.source.sequenceSha256!==entry.sequenceSha256||
     !data.analysis.naturalProteinMotifScreen.allWindowsAccountedFor||
     data.evidence.jointBsngHybridRecognition!=='NOT_ASSESSABLE'||
     data.evidence.genomicIntegrationFeasibility!=='NOT_ASSESSABLE'){
     throw Error('Research report provenance or scientific status validation failed.');
   }
   setReport(data);setMore(false);
  }catch(err){setError(err instanceof Error?err.message:'Unable to verify this research report.');}
  finally{setBusy(false)}
 }
 function openRunner(){
  const chr=chromosome.toUpperCase().replace(/^CHR/,'');
  const pos=Number(start),span=Number(length);
  if(!/^(?:[1-9]|1[0-9]|2[0-2]|X|Y|MT)$/.test(chr)||
    !Number.isSafeInteger(pos)||pos<1||
    ![100000,1000000,10000000].includes(span)){
   Alert.alert('Check research settings','Choose a valid human chromosome, positive start and one of the supported region sizes.');
   return;
  }
  Alert.alert('Run this real human reference analysis',
   'The GitHub cloud runner will open. In Actions tap “Run workflow”, select branch main, and enter: chromosome '+chr+
   ', start '+pos+', length '+span+'. Then return and tap Refresh completed reports. This app never collects your GitHub password.',
   [{text:'Cancel',style:'cancel'},{text:'Open GitHub Actions',onPress:()=>
     Linking.openURL(RUNNER).catch(()=>Alert.alert('GitHub unavailable','Open the GitHub Actions URL in a browser.'))}]);
 }
 async function share(){
  if(!report)return;
  const message=[
   'BSNG v0.7 PUBLIC GRCh38 COMPUTATIONAL REFERENCE REPORT (NOT PHYSICAL NANITE BINDING)',
   'Run '+report.runId+' '+report.source.assembly+' chr'+report.source.chromosome+':'+report.source.start1BasedInclusive+'-'+report.source.end1BasedInclusive,
   'Bases '+report.source.bases,'Full reference SHA256 '+report.source.sequenceSha256,
   'Code '+report.codeCommit,'CTCF model JASPAR MA0139.1',
   'Natural CTCF motif candidates '+report.analysis.naturalProteinMotifScreen.findings.length,
   ...report.analysis.naturalProteinMotifScreen.findings.slice(0,10).map(x=>
    '#'+x.rank+' '+x.chromosome+':'+x.start1BasedInclusive+'-'+x.end1BasedInclusive+' '+x.strand+
    ' PWM log2 odds '+x.pwmLog2OddsScore.toFixed(4)),
   'BSNG hybrid binding: NOT ASSESSABLE; integration: NOT ASSESSABLE.',
   'Public report '+ROOT+'/reports/'+report.runId+'.json',
   report.githubRunUrl||'',
  ].join('\n');
  try{await Share.share({message})}catch{Alert.alert('Share unavailable','Could not open share panel.')}
 }
 return <View style={s.root}>
  <View style={s.card}>
   <Text style={s.eyebrow}>BSNG ACTIVE RESEARCH JOBS · v0.7</Text>
   <Text style={s.title}>Real Human Genome Analysis</Text>
   <Text style={s.body}>Run a new computation on genuine GRCh38 DNA, preserve its sequence hash, and inspect coordinate-specific findings. This first model scores the natural human CTCF recognition motif—not an uncharacterized BSNG nanite.</Text>
   <Line label="Execution" value="GitHub cloud · verified public data"/>
   <Text style={s.label}>Chromosome (1–22, X, Y, MT)</Text>
   <TextInput style={s.input} value={chromosome} onChangeText={setChromosome} autoCapitalize="characters" maxLength={5} placeholderTextColor={ST.muted}/>
   <Text style={s.label}>First base (GRCh38, 1-based)</Text>
   <TextInput style={s.input} value={start} onChangeText={setStart} keyboardType="numeric" maxLength={10} placeholderTextColor={ST.muted}/>
   <Text style={s.label}>Region size</Text>
   <View style={s.sizes}>{([
     ['100K','100000'],['1M','1000000'],['10M','10000000']
   ] as const).map(([title,value])=><TouchableOpacity key={value} onPress={()=>setLength(value)}
     accessibilityRole="button" accessibilityState={{selected:length===value}}
     style={[s.size,length===value&&s.sizeSelected]}>
     <Text style={[s.sizeText,length===value&&{color:ST.cyan}]}>{title+' bp'}</Text>
    </TouchableOpacity>)}</View>
   <Text style={s.help}>The first release uses GitHub Actions to authenticate job requests. Copy these settings into the GitHub workflow form; the phone does not carry secret API tokens.</Text>
   <TouchableOpacity onPress={openRunner} accessibilityRole="button" style={s.primary}>
    <Text style={s.primaryText}>OPEN CLOUD RESEARCH RUNNER ↗</Text>
   </TouchableOpacity>
  </View>
  <View style={s.card}>
   <Text style={s.title}>Completed Research History</Text>
   <Text style={s.body}>The latest verified public-reference reports are stored on a separate GitHub results branch, not in an expiring 30-day artifact alone.</Text>
   <TouchableOpacity onPress={()=>{void refresh()}} disabled={loading} accessibilityRole="button" style={s.secondary}>
     <Text style={s.secondaryText}>{loading?'LOADING VERIFIED REPORTS…':'REFRESH COMPLETED REPORTS ↻'}</Text>
   </TouchableOpacity>
   {error!==''&&<Text style={s.error}>{error}</Text>}
   {history.length===0&&<Text style={s.body}>No completed cloud research jobs loaded.</Text>}
   {history.slice(0,more?20:4).map(x=><TouchableOpacity key={x.runId} onPress={()=>{void selectReport(x)}}
      disabled={busy} accessibilityRole="button" style={[s.history,report?.runId===x.runId&&s.selected]}>
      <Text style={s.historyTitle}>{'GRCh38 chr'+x.chromosome+':'+format(x.start)+'–'+format(x.end)}</Text>
      <Text style={s.help}>{'Run '+x.runId+' · '+format(x.bases)+' real bases · '+x.candidateCount+' natural CTCF motif candidates'}</Text>
    </TouchableOpacity>)}
   {history.length>4&&<TouchableOpacity onPress={()=>setMore(x=>!x)}><Text style={s.externalText}>{more?'SHOW LESS':'SHOW MORE RESEARCH RUNS'}</Text></TouchableOpacity>}
  </View>
  {report&&<View style={s.card}>
    <Text style={s.eyebrow}>INDEPENDENTLY RE-RUNNABLE COMPUTATIONAL REPORT</Text>
    <Text style={s.title}>{'GRCh38 chr'+report.source.chromosome+' · '+format(report.source.bases)+' bp'}</Text>
    <Line label="Run ID" value={report.runId}/>
    <Line label="Verified chunks" value={String(report.source.totalChunks)}/>
    <Line label="GC fraction" value={report.analysis.nucleotideComposition.gcFraction===null?'Unknown':
      (report.analysis.nucleotideComposition.gcFraction*100).toFixed(2)+'%'}/>
    <Line label="Ambiguous reference bases (N)" value={format(report.analysis.nucleotideComposition.nucleotideCounts.N)}/>
    <Text style={s.label}>Exact source-sequence SHA-256</Text>
    <Text selectable style={s.mono}>{report.source.sequenceSha256}</Text>
    <Text style={s.help}>Natural CTCF motif model · JASPAR MA0139.1 · maximum PWM log₂ score per 1,000-base bin. These are sequence preference rankings, not experimental affinity or safe insertion sites.</Text>
    {report.analysis.naturalProteinMotifScreen.findings.slice(0,10).map(x=><View key={x.rank} style={s.finding}>
      <Text style={s.findingLocation} selectable>{'#'+x.rank+' '+x.chromosome+':'+format(x.start1BasedInclusive)+'–'+format(x.end1BasedInclusive)+' ('+x.strand+')'}</Text>
      <Text selectable style={s.mono}>{x.referencePlusStrand19}</Text>
      <Text style={s.help}>{'CTCF PWM log₂ odds: '+x.pwmLog2OddsScore.toFixed(4)}</Text>
    </View>)}
    {report.analysis.naturalProteinMotifScreen.findings.length===0&&<Text style={s.help}>No unambiguous motif candidates passed scanning.</Text>}
    <View style={s.caution}>
     <Text style={s.cautionTitle}>BSNG PHYSICAL BINDING · NOT ASSESSABLE</Text>
     <Text style={s.body}>Actual BSNG RNA–protein binding, genomic integration and integration safety have not been experimentally measured. Genomic annotations and genome-wide off-target testing are not yet included in this run.</Text>
    </View>
    <Link label="View original GitHub research execution" url={report.githubRunUrl||RUNNER}/>
    <Link label="Full machine-readable independent reproduction report" url={ROOT+'/reports/'+report.runId+'.json'}/>
    <TouchableOpacity onPress={()=>{void share()}} accessibilityRole="button" style={s.secondary}>
     <Text style={s.secondaryText}>SHARE EXACT RESULTS AND SOURCES ↗</Text>
    </TouchableOpacity>
  </View>}
 </View>;
}
const s=StyleSheet.create({
 root:{gap:16,marginBottom:22},
 card:{gap:12,padding:15,borderRadius:15,borderWidth:1,borderColor:ST.border,backgroundColor:ST.panel},
 eyebrow:{fontSize:10,color:ST.cyan,fontWeight:'900',letterSpacing:1},
 title:{fontSize:18,color:ST.white,fontWeight:'900'},
 body:{color:ST.muted,fontSize:12,lineHeight:20},
 line:{gap:3},lineLabel:{color:ST.muted,fontSize:11},
 lineValue:{color:ST.white,fontSize:13,fontWeight:'700'},
 label:{fontSize:11,color:ST.muted,fontWeight:'700'},
 input:{borderColor:ST.border,borderWidth:1,borderRadius:9,padding:11,fontSize:14,
  color:ST.white,backgroundColor:'#080F1C'},
 sizes:{flexDirection:'row',gap:7},
 size:{flex:1,alignItems:'center',padding:11,borderRadius:8,borderColor:ST.border,borderWidth:1},
 sizeSelected:{borderColor:ST.cyan,backgroundColor:'#103640'},
 sizeText:{color:ST.muted,fontWeight:'900',fontSize:12},
 help:{color:ST.muted,fontSize:11,lineHeight:17},
 primary:{backgroundColor:ST.cyan,borderRadius:10,alignItems:'center',padding:13},
 primaryText:{color:'#071827',fontWeight:'900',fontSize:11},
 secondary:{borderWidth:1,borderColor:ST.cyan,borderRadius:10,alignItems:'center',padding:12},
 secondaryText:{color:ST.cyan,fontWeight:'900',fontSize:11},
 error:{color:ST.amber,fontSize:12,lineHeight:19},
 history:{borderWidth:1,borderColor:ST.border,borderRadius:10,padding:12,gap:4},
 selected:{borderColor:ST.green},
 historyTitle:{color:ST.white,fontSize:12,fontWeight:'800'},
 external:{paddingVertical:6},
 externalText:{color:ST.cyan,fontSize:11,fontWeight:'900'},
 mono:{color:ST.cyan,fontSize:11,fontFamily:'monospace',lineHeight:18},
 finding:{padding:11,borderRadius:10,borderWidth:1,borderColor:ST.border,gap:6,backgroundColor:'#080F1C'},
 findingLocation:{fontSize:12,color:ST.white,fontWeight:'800'},
 caution:{borderColor:'#8B6D35',borderWidth:1,padding:10,gap:7,borderRadius:9},
 cautionTitle:{color:ST.amber,fontSize:11,fontWeight:'900'},
});
