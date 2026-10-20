import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({
 entryPoints:['build/sites-worker.ts'],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env.DEV':'false'},
 plugins:[{name:'test-handler',setup(builder){builder.onResolve({filter:/^vinext\/server\/fetch-handler$/},()=>({path:'handler',namespace:'test'}));builder.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export default {async fetch(){return globalThis.__lotlineWorkerResponse;}}',loader:'js'}));}}],
});
const {default:worker}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const serve=async(path,response)=>{globalThis.__lotlineWorkerResponse=response;return worker.fetch(new Request('https://lotline.test'+path),{}, {props:{}});};
test('worker hardens streaming HTML/API responses and prevents shared caching including error responses',async()=>{
 for(const path of ['/','/?_rsc=example','/api/workspaces','/api/workspaces/missing','/api']){
  const response=await serve(path,new Response('stream retained',{status:403,headers:{'Cache-Control':'public, max-age=900','Content-Type':'text/plain'}}));
  assert.equal(response.status,403);assert.equal(await response.text(),'stream retained');
  assert.match(response.headers.get('Cache-Control'),/private, no-store/);assert.equal(response.headers.get('CDN-Cache-Control'),'no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');assert.equal(response.headers.get('Permissions-Policy'),'camera=(), microphone=(), geolocation=()');
  assert.match(response.headers.get('Content-Security-Policy'),/base-uri 'self'/);
 }
});
test('worker preserves static asset caching and existing CSP/frame policy',async()=>{
 const original="script-src 'self'; frame-ancestors https://chatgpt.com";
 const response=await serve('/assets/app.js',new Response('asset',{headers:{'Cache-Control':'public, max-age=31536000, immutable','Content-Security-Policy':original}}));
 assert.equal(response.headers.get('Cache-Control'),'public, max-age=31536000, immutable');assert.equal(response.headers.get('CDN-Cache-Control'),null);
 assert.equal(response.headers.get('Content-Security-Policy'),original+", base-uri 'self'; object-src 'none'; form-action 'self'");assert.equal(response.headers.get('X-Frame-Options'),null);
});
