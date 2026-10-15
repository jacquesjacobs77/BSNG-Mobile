/**
 * Source-pinning preflight, run ONCE after fetching NCBI's GCF reference.
 * Does not trigger a whole-genome scan or report biologic BSNG binding.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {NCBI_MD5_URL,freezeOfficialFasta} from '../src/lib/whole-assembly-source-provenance.mjs';
const root=process.env.BSNG_CAMPAIGN_DIR||'artifacts/bsng-grch38-p14-campaign';
const zipped=process.env.BSNG_REFSEQ_FASTA_GZIP;
const fasta=process.env.BSNG_REFSEQ_FASTA;
const fai=process.env.BSNG_REFSEQ_FAI;
if(!zipped||!fasta||!fai)throw Error('Set BSNG_REFSEQ_FASTA_GZIP, BSNG_REFSEQ_FASTA, BSNG_REFSEQ_FAI to same official reference release');
const plan=JSON.parse(await readFile(join(root,'whole-assembly-plan.json'),'utf8'));
const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);
let md5List;
try{
 const response=await fetch(NCBI_MD5_URL,{signal:controller.signal});
 if(!response.ok)throw Error('Official MD5 list unavailable: HTTP '+response.status);
 md5List=await response.text();
}finally{clearTimeout(timeout)}
const sourceUrl=NCBI_MD5_URL.replace('/md5checksums.txt','/GCF_000001405.40_GRCh38.p14_genomic.fna.gz');
const freeze=await freezeOfficialFasta({plan,gzipPath:zipped,fastaPath:fasta,
 faiPath:fai,officialMd5Listing:md5List,officialSourceUrl:sourceUrl});
await mkdir(root,{recursive:true});
await writeFile(join(root,'GCF_000001405.40_official_md5checksums.txt'),md5List);
await writeFile(join(root,'reference-fasta-freeze.json'),JSON.stringify(freeze,null,2)+'\n');
console.log(JSON.stringify({event:'OFFICIAL_REFERENCE_FASTA_VERIFIED_AND_FROZEN',
 sha256:freeze.fullUncompressedFastaSha256,
 size:freeze.referenceUncompressedBytes,
 planSha256:freeze.assemblyPlanSha256,
 missingGenbankOnly:freeze.notRepresentedInGcf,
 status:'PROVISIONED_NOT_GENOME_WIDE_SCANNED'},null,2));
