import React,{useCallback,useEffect,useState} from 'react';
import {Alert,Linking,StyleSheet,Text,TouchableOpacity,View} from 'react-native';

const ROOT='https://raw.githubusercontent.com/jacquesjacobs77/BSNG-Mobile/bsng-v09-real-ctcf-checkpoints/grch38p14-natural-ctcf-v09';
const RUNNER='https://github.com/jacquesjacobs77/BSNG-Mobile/actions/workflows/bsng-v09-refseq-github-continuation.yml';
const COLOR={panel:'#101E30',border:'#29465B',cyan:'#57E6E0',white:'#EDF6FF',muted:'#9BB3C7',amber:'#FFD18C',green:'#7BDBAC'};
type Track={completedBatches:number,totalBatches:number,completedOwnedBases:number,totalOwnedBases:number,coveredFraction:number};
type Receipt={batchId:string;track:string;contig:string;start1BasedInclusive:number;end1BasedInclusive:number;
 ownedBases:number;qualifyingCandidateCount:number;compressedCandidateReleaseTag:string;compressedCandidateSha256:string};
type Campaign={
 schemaVersion:number;id:string;campaignType:string;assembly:string;status:string;sourceFastaSha256:string;
 scientificStatus:string;receipts:Receipt[];
 coverage:{completedBatches:number;totalBatches:number;completedOwnedBases:number;totalOwnedBases:number;
  overallFraction:number;candidateCountVerified:number;coverageByTrack:Record<string,Track>;
  excludedGenbankOnlySequenceCount:number;excludedGenbankOnlyBases:number;status:string};
};
const comma=(n:number)=>n.toLocaleString('en-US');
const urlOpen=(link:string)=>Linking.openURL(link).catch(()=>Alert.alert('Link unavailable','Please retry when connected to the internet.'));
export default function WholeGenomeCampaignPanel(){
 const [data,setData]=useState<Campaign|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const refresh=useCallback(async()=>{
  setLoading(true);setError('');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch(ROOT+'/index.json?t='+Date.now(),{
    signal:controller.signal,headers:{Accept:'application/json'}
   });
   if(!response.ok)throw Error(response.status===404?'Whole-genome campaign not yet started.':
     'Cannot fetch cloud genome campaign status (HTTP '+response.status+').');
   const result=await response.json() as Campaign;
   if(result?.schemaVersion!==1||result.campaignType!=='REAL_REFERENCE'||
      result.assembly!=='GRCh38.p14'||result.scientificStatus!=='NATURAL_CTCF_REFERENCE_COMPUTATION_NOT_BSNG_BINDING'||
      !Array.isArray(result.receipts)||!result.coverage||
      result.coverage.totalBatches!==1003||result.coverage.completedBatches!==result.receipts.length||
      result.coverage.completedOwnedBases>result.coverage.totalOwnedBases||
      !/^[a-f0-9]{64}$/.test(result.sourceFastaSha256)||
      result.coverage.candidateCountVerified!==result.receipts.reduce((sum,r)=>sum+r.qualifyingCandidateCount,0))
    throw Error('The genome checkpoint registry did not pass the phone-side data integrity checks.');
   setData(result);
  }catch(e){setError(e instanceof Error?e.message:'Unable to load verified research checkpoint.');}
  finally{clearTimeout(timer);setLoading(false)}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const tracks=[['A_CHROMOSOMES','Chromosomes + mitochondrial DNA'],
  ['B_REMAINING_PRIMARY','Remaining primary sequences'],
  ['C_ALTERNATES_PATCHES','Alternate loci and patches']] as const;
 const last=data?.receipts.at(-1);
 return <View style={s.panel}>
  <Text style={s.eyebrow}>BSNG CONTINUOUS GENOME RESEARCH · v0.9</Text>
  <Text style={s.title}>Whole-Genome Campaign</Text>
  <Text style={s.body}>Official human GRCh38.p14 RefSeq analysis. GitHub cloud jobs save verified checkpoints and continue through three genomic-assembly tracks. These are natural CTCF sequence-model findings, not physical BSNG nanite binding.</Text>
  <TouchableOpacity style={s.button} accessibilityRole="button" disabled={loading} onPress={()=>{void refresh()}}>
   <Text style={s.buttonText}>{loading?'CHECKING CLOUD RESEARCH…':'REFRESH WHOLE-GENOME PROGRESS ↻'}</Text>
  </TouchableOpacity>
  {!!error&&<Text style={s.warning}>{error}</Text>}
  {data&&<>
   <View style={s.metrics}>
    <View style={s.metric}><Text style={s.metricValue}>{comma(data.coverage.completedBatches)} / {comma(data.coverage.totalBatches)}</Text><Text style={s.metricLabel}>Archived verified batches</Text></View>
    <View style={s.metric}><Text style={s.metricValue}>{(data.coverage.overallFraction*100).toFixed(2)}%</Text><Text style={s.metricLabel}>RefSeq representation coverage</Text></View>
   </View>
   <View style={s.bar}><View style={[s.barValue,{width:(Math.min(1,Math.max(0,data.coverage.overallFraction))*100)+'%'}]}/></View>
   <View style={s.metrics}>
    <View style={s.metric}><Text style={s.metricValue}>{comma(data.coverage.completedOwnedBases)}</Text><Text style={s.metricLabel}>Source bases accounted for</Text></View>
    <View style={s.metric}><Text style={s.metricValue}>{comma(data.coverage.candidateCountVerified)}</Text><Text style={s.metricLabel}>Archived exploratory CTCF motif matches</Text></View>
   </View>
   {tracks.map(([code,label])=>{
    const t=data.coverage.coverageByTrack?.[code];
    return t?<View key={code} style={s.track}>
     <Text style={s.trackTitle}>{label}</Text>
     <Text style={s.trackInfo}>{comma(t.completedBatches)} / {comma(t.totalBatches)} verified batches · {(t.coveredFraction*100).toFixed(2)}%</Text>
    </View>:null;
   })}
   <Text style={s.label}>Pinned full-source FASTA SHA-256</Text>
   <Text selectable style={s.hash}>{data.sourceFastaSha256}</Text>
   {!!last&&<View style={s.latest}>
     <Text style={s.label}>Most recent verified genomic batch</Text>
     <Text style={s.latestTitle}>{last.batchId} · {last.contig}:{comma(last.start1BasedInclusive)}–{comma(last.end1BasedInclusive)}</Text>
     <Text style={s.body}>{comma(last.ownedBases)} actual reference bases · {comma(last.qualifyingCandidateCount)} archived CTCF motif findings</Text>
     <TouchableOpacity accessibilityRole="link" onPress={()=>urlOpen('https://github.com/jacquesjacobs77/BSNG-Mobile/releases/tag/'+last.compressedCandidateReleaseTag)}>
      <Text style={s.link}>OPEN CHECKSUM-ARCHIVED CANDIDATE PARTITION ↗</Text>
     </TouchableOpacity>
   </View>}
   <Text style={s.warning}>The remaining {comma(data.coverage.excludedGenbankOnlyBases)} GenBank-only reference bases from {data.coverage.excludedGenbankOnlySequenceCount} entries are separately tracked; no claim of universal human-genome or individual-genome coverage is made.</Text>
   <Text style={s.warning}>Physical BSNG binding, hybrid RNA–protein recognition, integration persistence and non-harm: NOT ASSESSABLE.</Text>
  </>}
  <TouchableOpacity accessibilityRole="link" onPress={()=>urlOpen(RUNNER)}>
   <Text style={s.link}>OPEN CONTROLLED GITHUB RESEARCH RUNNER ↗</Text>
  </TouchableOpacity>
  <TouchableOpacity accessibilityRole="link" onPress={()=>urlOpen(ROOT+'/index.json')}>
   <Text style={s.link}>VIEW COMPLETE MACHINE-READABLE CHECKPOINT REGISTRY ↗</Text>
  </TouchableOpacity>
 </View>
}
const s=StyleSheet.create({
 panel:{borderWidth:1,borderColor:COLOR.border,backgroundColor:COLOR.panel,borderRadius:15,
 padding:15,gap:12,marginBottom:16},
 eyebrow:{color:COLOR.cyan,fontWeight:'900',fontSize:10,letterSpacing:1},
 title:{color:COLOR.white,fontSize:18,fontWeight:'900'},
 body:{color:COLOR.muted,fontSize:12,lineHeight:20},
 button:{padding:12,borderWidth:1,borderColor:COLOR.cyan,borderRadius:10,alignItems:'center'},
 buttonText:{color:COLOR.cyan,fontSize:11,fontWeight:'900'},
 metrics:{flexDirection:'row',gap:10},
 metric:{flex:1,minWidth:0,padding:10,borderRadius:10,borderWidth:1,borderColor:COLOR.border},
 metricValue:{color:COLOR.cyan,fontWeight:'900',fontSize:16},
 metricLabel:{color:COLOR.muted,fontSize:10,lineHeight:16},
 bar:{height:9,borderRadius:8,overflow:'hidden',backgroundColor:'#071526'},
 barValue:{backgroundColor:COLOR.cyan,height:9},
 track:{padding:10,borderWidth:1,borderColor:COLOR.border,borderRadius:10,gap:4},
 trackTitle:{color:COLOR.white,fontWeight:'800',fontSize:12},
 trackInfo:{color:COLOR.muted,fontSize:11},
 label:{color:COLOR.muted,fontWeight:'700',fontSize:11},
 hash:{fontFamily:'monospace',fontSize:10,color:COLOR.cyan,lineHeight:18},
 latest:{padding:10,borderColor:COLOR.border,borderWidth:1,borderRadius:10,gap:7},
 latestTitle:{color:COLOR.white,fontSize:12,fontWeight:'800'},
 link:{color:COLOR.cyan,fontSize:11,fontWeight:'900',lineHeight:18,paddingVertical:3},
 warning:{color:COLOR.amber,fontSize:11,lineHeight:17}
});
