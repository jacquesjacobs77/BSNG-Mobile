/**
 * Freeze a RefSeq GRCh38.p14 FASTA against the official NCBI FTP MD5 listing
 * and check that decompressed bytes match the user's indexed FASTA.
 * Transport MD5 is source-provided file check, not an authenticity signature.
 * We also capture cryptographic SHA-256 of ALL exact FASTA bytes.
 */
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {createGunzip} from 'node:zlib';
import {open,stat} from 'node:fs/promises';
import {loadFai,verifyReferenceFai} from './whole-assembly-fasta.mjs';
import {verifyPlan} from './whole-assembly-manifest.mjs';
const sha256=s=>createHash('sha256').update(s).digest('hex');
const EXPECTED_FILENAME='GCF_000001405.40_GRCh38.p14_genomic.fna.gz';
export const NCBI_MD5_URL='https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/000/001/405/GCF_000001405.40_GRCh38.p14/md5checksums.txt';
export function expectedNcbiMd5(listing,filename=EXPECTED_FILENAME){
 if(typeof listing!=='string'||!/^[A-Za-z0-9._-]+$/.test(filename))throw Error('Invalid source-listing request');
 const matches=listing.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{
  const match=x.match(/^([a-fA-F0-9]{32})\s+\*?(?:\.\/)?([^\s]+)$/);
  return match?{md5:match[1].toLowerCase(),file:match[2]}:null;
 }).filter(x=>x&&x.file===filename);
 if(matches.length!==1)throw Error('Expected exactly one official NCBI reference FASTA MD5 entry');
 return matches[0].md5;
}
export async function hashFile(path,algorithm='sha256'){
 const hash=createHash(algorithm);
 for await(const chunk of createReadStream(path))hash.update(chunk);
 return hash.digest('hex');
}
export async function uncompressedGzipSha256(path){
 const gunzip=createGunzip(),stream=createReadStream(path).pipe(gunzip);
 const hash=createHash('sha256');
 for await(const chunk of stream)hash.update(chunk);
 return hash.digest('hex');
}
export async function freezeOfficialFasta({
 plan,gzipPath,fastaPath,faiPath,officialMd5Listing,
 officialSourceUrl,
}){
 verifyPlan(plan);
 if(typeof officialSourceUrl!=='string'||!officialSourceUrl.startsWith('https://ftp.ncbi.nlm.nih.gov/'))
  throw Error('Reference must have an official NCBI source URL');
 if(!officialSourceUrl.endsWith('/'+EXPECTED_FILENAME))throw Error('Unexpected downloaded FASTA filename');
 const officialMd5=expectedNcbiMd5(officialMd5Listing);
 const downloadedMd5=await hashFile(gzipPath,'md5');
 if(officialMd5!==downloadedMd5)throw Error('Compressed reference FASTA differs from official NCBI MD5 entry');
 const [decompressedSha256,localSha256,compressedSha256,faiSha256]=await Promise.all([
  uncompressedGzipSha256(gzipPath),hashFile(fastaPath,'sha256'),
  hashFile(gzipPath,'sha256'),hashFile(faiPath,'sha256')
 ]);
 if(decompressedSha256!==localSha256)throw Error('Indexed FASTA differs from validated NCBI gzip decompression');
 const idx=await loadFai(faiPath);
 verifyReferenceFai(plan,idx);
 const compressedBytes=(await stat(gzipPath)).size,uncompressedBytes=(await stat(fastaPath)).size;
 return {
  schemaVersion:1,status:'FASTA_SOURCE_VERIFIED_LOCALLY_NOT_YET_GENOME_SCANNED',
  refseqAssemblyAccession:plan.refseqAssemblyAccession,assembly:'GRCh38.p14',
  sourceUrl:officialSourceUrl,md5ListUrl:NCBI_MD5_URL,
  officialNcbiCompressedMd5:officialMd5,
  fullCompressedSha256:compressedSha256,fullUncompressedFastaSha256:localSha256,
  indexedFaiSha256:faiSha256,
  referenceCompressedBytes:compressedBytes,referenceUncompressedBytes:uncompressedBytes,
  assemblyPlanSha256:plan.planSha256,sourceAssemblyReportSha256:plan.assemblyReportSha256,
  refseqSequencesPresent:plan.sequences.length,notRepresentedInGcf:plan.excludedGenbankOnlySequenceCount,
  note:'Validation of reference source bytes is necessary but does not establish any experimental BSNG binding.',
  frozenAt:new Date().toISOString()
 };
}
