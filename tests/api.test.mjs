/** Real route handlers against SQLite with injected platform identity/D1 bindings.
 * Run: node --test tests/api.test.mjs
 * No live credentials, API calls, or customer records are used.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { build } from 'esbuild';

let api, sqlite, workspaceId, firstSnapshot;
const dataset = {receipts:[{id:'r1',ingredient:'Cumin',lot:'LOT-1',supplier:'Spice Co',receivedDate:'2026-10-18',quantity:10,unit:'kg',source:'receipts.csv',row:2}],production:[{id:'p1',batch:'B1',product:'Soup',ingredient:'Cumin',lot:'LOT-1',quantity:2,unit:'kg',producedDate:'2026-10-19',outputQuantity:100,outputUnit:'cases',source:'production.csv',row:2}],shipments:[{id:'s1',batch:'B1',product:'Soup',customer:'Market',email:'qa@example.test',shippedDate:'2026-10-20',quantity:50,unit:'cases',source:'shipments.csv',row:2}]};
const context = () => ({params:Promise.resolve({id:workspaceId})});
const req = (method, payload, extra={}) => new Request('https://lotline.test/api/workspaces', {method,headers:{Origin:'https://lotline.test','Content-Type':'application/json',...extra},...(payload === undefined ? {} : {body:JSON.stringify(payload)})});
class Statement {
  constructor(sql, args=[]){this.sql=sql;this.args=args;}
  bind(...args){return new Statement(this.sql,args);}
  async first(){return sqlite.prepare(this.sql).get(...this.args)??null;}
  async all(){return {results:sqlite.prepare(this.sql).all(...this.args),success:true};}
  async run(){const result=sqlite.prepare(this.sql).run(...this.args);return {results:[],meta:{changes:result.changes},success:true};}
}
before(async()=>{
 sqlite = new DatabaseSync(':memory:'); sqlite.exec('PRAGMA foreign_keys=ON');
 for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(`drizzle/${file}`,'utf8'));
 globalThis.__lotlineD1 = {prepare(sql){return new Statement(sql);},async batch(statements){sqlite.exec('BEGIN');try{const values=[];for(const stmt of statements)values.push(await stmt.all());sqlite.exec('COMMIT');return values;}catch(error){sqlite.exec('ROLLBACK');throw error;}}};
 globalThis.__lotlineUser = {userId:'alice'};
 const result=await build({stdin:{contents:`export * as workspaces from './app/api/workspaces/route.ts';export * as workspace from './app/api/workspaces/[id]/route.ts';export * as events from './app/api/workspaces/[id]/events/route.ts';export * as drills from './app/api/workspaces/[id]/drills/route.ts';export * as snapshot from './app/api/workspaces/[id]/drills/[drillId]/route.ts';export * as mapping from './app/api/map/route.ts';export * as http from './lib/server-http.ts';`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',plugins:[{name:'test-platform',setup(build){build.onResolve({filter:/^(cloudflare:workers|@\/app\/chatgpt-auth)$/},args=>({path:args.path,namespace:'platform'}));build.onLoad({filter:/.*/,namespace:'platform'},args=>({contents:args.path==='cloudflare:workers'?'export const env = {get DB(){return globalThis.__lotlineD1;}, get ANTHROPIC_API_KEY(){return globalThis.__lotlineApiKey;}}':'export async function getChatGPTUser(){return globalThis.__lotlineUser;}',loader:'js'}));}}]});
 api=await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
});
after(()=>sqlite.close());
test('anonymous requests cannot read or mutate private data',async()=>{
 globalThis.__lotlineUser=null;
 for(const call of [()=>api.workspaces.GET(),()=>api.workspaces.POST(req('POST',{name:'x',dataset})),()=>api.mapping.POST(req('POST',{kind:'receipts',headers:['Lot']}))]){
  const response=await call();assert.equal(response.status,401);assert.match(response.headers.get('Cache-Control'),/no-store/);
 }
 globalThis.__lotlineUser={userId:'alice'};
});
test('mutation boundary rejects cross-origin, absent origin, invalid JSON type, oversized streams',async()=>{
 assert.equal((await api.workspaces.POST(req('POST',{name:'x',dataset},{Origin:'https://evil.test'}))).status,403);
 assert.equal((await api.workspaces.POST(new Request('https://lotline.test',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}))).status,403);
 assert.equal((await api.workspaces.POST(req('POST',{name:'x',dataset},{'Content-Type':'text/plain'}))).status,415);
 const oversized=new Request('https://lotline.test',{method:'POST',headers:{Origin:'https://lotline.test','Content-Type':'application/json'},body:' '.repeat(1_048_577)});
 assert.equal((await api.workspaces.POST(oversized)).status,413);
});
test('strict dataset validation rejects impossible dates, negative/zero/non-finite quantities and unknown fields',async()=>{
 for(const change of [{receivedDate:'2026-02-30'},{quantity:-1},{quantity:0},{quantity:Infinity},{unexpected:'data'},{row:1.5},{lot:'unsafe\u0000'}]){
  const invalid=structuredClone(dataset);Object.assign(invalid.receipts[0],change);
  assert.equal((await api.workspaces.POST(req('POST',{name:'x',dataset:invalid}))).status,400,JSON.stringify(change));
 }
});
test('shipment correction evidence is optional, bounded, complete and preserves safe multiline notes',async()=>{
 const corrected=structuredClone(dataset);Object.assign(corrected.shipments[0],{originalBatch:'',correctionNote:'Verified dispatch ledger.\nQA reviewer linked source row 2.',correctedAt:'2026-10-20T12:00:00.000Z'});
 const saved=await api.workspaces.POST(req('POST',{name:'Correction evidence',dataset:corrected}));assert.equal(saved.status,201);
 const {workspace}=await saved.json();assert.deepEqual(workspace.dataset.shipments[0],corrected.shipments[0]);
 const drill=await api.drills.POST(req('POST',{lot:'LOT-1',notes:'Reviewed source rows.\nNext: QA signoff.'}),{params:Promise.resolve({id:workspace.id})});assert.equal(drill.status,201);assert.equal((await drill.json()).drill.notes,'Reviewed source rows.\nNext: QA signoff.');
 for(const change of [{correctionNote:'bad\rline'},{correctionNote:'bad\u0000note'},{correctionNote:'x'.repeat(1001)},{correctedAt:'2026-02-30T12:00:00Z'},{correctedAt:'yesterday'},{originalBatch:'bad\nlot'}]){
  const invalid=structuredClone(corrected);Object.assign(invalid.shipments[0],change);assert.equal((await api.workspaces.POST(req('POST',{name:'Invalid correction',dataset:invalid}))).status,400);
 }
 const partial=structuredClone(dataset);partial.shipments[0].originalBatch='';assert.equal((await api.workspaces.POST(req('POST',{name:'Incomplete correction',dataset:partial}))).status,400);
 assert.equal((await api.drills.POST(req('POST',{lot:'LOT-1',notes:'bad\rnote'}),{params:Promise.resolve({id:workspace.id})})).status,400);
 await api.workspace.DELETE(req('DELETE'),{params:Promise.resolve({id:workspace.id})});
});
test('original source cells survive persistence with LF notes and reject oversized/control or pollution keys',async()=>{
 const records=structuredClone(dataset);
 for(const kind of ['receipts','production','shipments'])records[kind][0].sourceData={Address:'12 Cedar Street',Notes:'First source line\nSecond source line',Batch:kind==='shipments'?'unassigned':''};
 const response=await api.workspaces.POST(req('POST',{name:'Full source evidence',dataset:records}));assert.equal(response.status,201);const {workspace}=await response.json();
 for(const kind of ['receipts','production','shipments'])assert.deepEqual(workspace.dataset[kind][0].sourceData,records[kind][0].sourceData);
 const badSources=[{Notes:'x'.repeat(2001)},{Notes:'bad\rnote'},{Notes:'bad\u0000note'},{['x'.repeat(121)]:'value'},{['bad\nheader']:'value'},Object.fromEntries(Array.from({length:81},(_,i)=>['column'+i,'value'])),JSON.parse('{"__proto__":"pollution"}'),{constructor:'pollution'},{prototype:'pollution'}];
 for(const sourceData of badSources){const invalid=structuredClone(dataset);invalid.shipments[0].sourceData=sourceData;assert.equal((await api.workspaces.POST(req('POST',{name:'Bad source data',dataset:invalid}))).status,400);}
 await api.workspace.DELETE(req('DELETE'),{params:Promise.resolve({id:workspace.id})});
});
test('missing lineage stays representable and receipt creation produces a server audit event',async()=>{
 const missing=structuredClone(dataset);missing.shipments[0].batch='';
 const response=await api.workspaces.POST(req('POST',{name:'Recall exercise',dataset:missing}));assert.equal(response.status,201);
 const payload=await response.json();workspaceId=payload.workspace.id;assert.equal(payload.workspace.revision,1);
 const events=await (await api.events.GET(req('GET'),context())).json();assert.equal(events.events[0].kind,'system');assert.equal(events.events[0].action,'Workspace created');
});
test('tenant isolation uses non-leaky 404 across every workspace resource',async()=>{
 globalThis.__lotlineUser={userId:'bob'};
 assert.deepEqual((await (await api.workspaces.GET()).json()).workspaces,[]);
 for(const call of [()=>api.workspace.GET(req('GET'),context()),()=>api.workspace.PUT(req('PUT',{dataset,revision:1}),context()),()=>api.workspace.DELETE(req('DELETE'),context()),()=>api.events.GET(req('GET'),context()),()=>api.events.POST(req('POST',{action:'note',detail:'test'}),context()),()=>api.drills.GET(req('GET'),context()),()=>api.drills.POST(req('POST',{lot:'LOT-1'}),context())])assert.equal((await call()).status,404);
 globalThis.__lotlineUser={userId:'alice'};
});
test('revision compare-and-swap prevents lost updates and generates one audit event',async()=>{
 assert.equal((await api.workspace.PUT(req('PUT',{dataset,revision:1}),context())).status,200);
 assert.equal((await api.workspace.PUT(req('PUT',{dataset,revision:1}),context())).status,409);
 const events=await (await api.events.GET(req('GET'),context())).json();assert.equal(events.events.filter(e=>e.action==='Workspace updated').length,1);
});
test('client notes cannot impersonate verified system actions',async()=>{
 const response=await api.events.POST(req('POST',{action:'Workspace updated',detail:'This is a note'}),context());assert.equal(response.status,201);
 const {event}=await response.json();assert.equal(event.kind,'note');assert.equal(event.action,'User note: Workspace updated');
 assert.equal((await api.events.POST(req('POST',{action:'fake',detail:'x',kind:'system'}),context())).status,400);
});
test('snapshot is computed server-side and remains immutable when live records change',async()=>{
 const response=await api.drills.POST(req('POST',{lot:'LOT-1',notes:'Exercise only'}),context());assert.equal(response.status,201);
 const {drill}=await response.json();firstSnapshot=drill.id;assert.equal(drill.revision,2);assert.equal(drill.result.affectedShippedQuantity,50);
 const changed=structuredClone(dataset);changed.shipments[0].quantity=75;
 assert.equal((await api.workspace.PUT(req('PUT',{dataset:changed,revision:2}),context())).status,200);
 const saved=await (await api.snapshot.GET(req('GET'),{params:Promise.resolve({id:workspaceId,drillId:firstSnapshot})})).json();assert.equal(saved.drill.result.affectedShippedQuantity,50);assert.equal(saved.drill.dataset.shipments[0].quantity,50);
 const list=await (await api.drills.GET(req('GET'),context())).json();assert.equal(list.drills.length,1);assert.equal(list.drills[0].dataset,undefined);
});
test('mapping accurately reports rule fallback and only uses known headers',async()=>{
 const response=await api.mapping.POST(req('POST',{kind:'receipts',headers:['Ingredient','Lot Number','Qty','UOM']}));assert.equal(response.status,200);
 const result=await response.json();assert.equal(result.mode,'rules');assert.equal(result.mapping.lot,'Lot Number');assert.equal(result.mapping.quantity,'Qty');
 assert.equal((await api.mapping.POST(req('POST',{kind:'receipts',headers:['Lot'],sampleRows:[{secret:'not in headers'}]}))).status,400);
});
test('configured Claude suggestions enforce output allowlists, honest failure fallback and durable cost limits',async()=>{
 const realFetch=globalThis.fetch;globalThis.__lotlineApiKey='test-not-a-live-key';
 const mapping={ingredient:'Ingredient',lot:'Lot Number',supplier:'',receivedDate:'',quantity:'Qty',unit:'UOM'};
 const payload={kind:'receipts',headers:['Ingredient','Lot Number','Qty','UOM'],sampleRows:[{'Ingredient':'Cumin','Lot Number':'LOT-1','Qty':'10','UOM':'kg'}]};
 let calls=0;
 globalThis.fetch=async(url,options)=>{calls++;assert.equal(url,'https://api.anthropic.com/v1/messages');const content=JSON.parse(options.body);assert.equal(options.headers['x-api-key'],'test-not-a-live-key');assert.equal(JSON.stringify(content).includes('alice'),false);return Response.json({content:[{type:'text',text:JSON.stringify({mapping})}]});};
 try{
  let result=await (await api.mapping.POST(req('POST',payload))).json();assert.equal(result.mode,'ai');assert.deepEqual(result.mapping,mapping);
  mapping.lot='Invented header';result=await (await api.mapping.POST(req('POST',payload))).json();assert.equal(result.mode,'rules');
  mapping.lot='Ingredient';result=await (await api.mapping.POST(req('POST',payload))).json();assert.equal(result.mode,'rules');
  globalThis.fetch=async()=>{calls++;return new Response('unavailable',{status:503});};result=await (await api.mapping.POST(req('POST',payload))).json();assert.equal(result.mode,'rules');assert.match(result.explanation,/unavailable/);
  globalThis.fetch=async()=>{calls++;throw new DOMException('deadline','AbortError');};result=await (await api.mapping.POST(req('POST',payload))).json();assert.equal(result.mode,'rules');
  await api.mapping.POST(req('POST',payload));result=await (await api.mapping.POST(req('POST',payload))).json();assert.equal(calls,6);assert.equal(result.mode,'rules');assert.match(result.explanation,/limit/);
 }finally{globalThis.fetch=realFetch;globalThis.__lotlineApiKey=undefined;}
});
test('drill quota is enforced atomically and snapshot reads remain tenant isolated',async()=>{
 for(let i=1;i<100;i++)assert.equal((await api.drills.POST(req('POST',{lot:'LOT-1'}),context())).status,201);
 assert.equal((await api.drills.POST(req('POST',{lot:'LOT-1'}),context())).status,409);
 globalThis.__lotlineUser={userId:'bob'};
 assert.equal((await api.snapshot.GET(req('GET'),{params:Promise.resolve({id:workspaceId,drillId:firstSnapshot})})).status,404);
 globalThis.__lotlineUser={userId:'alice'};
});
test('workspace quota enforced inside the insert; delete clears dependent records',async()=>{
 for(let i=1;i<20;i++)assert.equal((await api.workspaces.POST(req('POST',{name:`Workspace ${i}`,dataset:{receipts:[],production:[],shipments:[]}}))).status,201);
 assert.equal((await api.workspaces.POST(req('POST',{name:'Over limit',dataset}))).status,409);
 assert.equal((await api.workspace.DELETE(req('DELETE'),context())).status,200);
 assert.equal((await api.workspace.GET(req('GET'),context())).status,404);
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM drills WHERE workspace_id=?').get(workspaceId).count,0);
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM events WHERE workspace_id=?').get(workspaceId).count,0);
});
test('25 MiB tenant quota counts actual UTF-8 bytes and bounds create/update/drill atomically without blocking shrink or delete',async()=>{
 const previousUser=globalThis.__lotlineUser;globalThis.__lotlineUser={userId:'quota-owner'};
 const quotaDataset=structuredClone(dataset);quotaDataset.receipts[0].supplier='Épices Montréal';
 const create=async(name,records)=>{const response=await api.workspaces.POST(req('POST',{name,dataset:records}));assert.equal(response.status,201);return (await response.json()).workspace;};
 const target=await create('Quota target',quotaDataset),holder=await create('Quota fixture holder',{receipts:[],production:[],shipments:[]});
 const used=()=>sqlite.prepare(`SELECT ${api.http.USER_STORAGE_BYTES_SQL} AS bytes`).get('quota-owner','quota-owner').bytes;
 const quota=api.http.MAX_STORAGE_BYTES;let remaining=quota-used(),fixtureIndex=0;
 // Seed bounded, valid JSON snapshots without 25+ expensive application calls.
 // Multibyte text catches an incorrect length(TEXT) implementation.
 while(remaining>0){
  const bytes=Math.min(1_000_000,remaining);assert.ok(bytes>=4);
  const payload='é'.repeat(Math.floor((bytes-4)/2))+((bytes-4)%2?'x':'');
  sqlite.prepare("INSERT INTO drills (id,workspace_id,lot,notes,result,dataset,revision,created_at) VALUES (?,?,?,'',?,'{}',1,?)").run(`quota-fixture-${fixtureIndex++}`,holder.id,'fixture',JSON.stringify(payload),'2026-10-20T12:00:00Z');
  remaining-=bytes;
 }
 assert.equal(used(),quota);
 const characterCount=sqlite.prepare('SELECT SUM(length(result)) AS chars FROM drills WHERE workspace_id=?').get(holder.id).chars;assert.ok(characterCount<quota/2+1000);
 let response=await api.workspaces.POST(req('POST',{name:'Over storage quota',dataset:{receipts:[],production:[],shipments:[]}}));assert.equal(response.status,409);assert.match((await response.json()).error,/25 MiB/);
 const targetContext={params:Promise.resolve({id:target.id})};
 response=await api.workspace.PUT(req('PUT',{dataset:quotaDataset,revision:1}),targetContext);assert.equal(response.status,200);assert.equal((await response.json()).workspace.revision,2);assert.equal(used(),quota);
 const larger=structuredClone(quotaDataset);larger.receipts[0].supplier+='x';response=await api.workspace.PUT(req('PUT',{dataset:larger,revision:2}),targetContext);assert.equal(response.status,409);assert.match((await response.json()).error,/25 MiB/);assert.equal(used(),quota);
 assert.equal((await api.drills.POST(req('POST',{lot:'LOT-1',notes:'New drill'}),targetContext)).status,409);assert.equal(used(),quota);
 // Another tenant's valid record cannot be denied by this account's quota.
 globalThis.__lotlineUser={userId:'quota-neighbour'};const neighbour=await create('Independent account',{receipts:[],production:[],shipments:[]});await api.workspace.DELETE(req('DELETE'),{params:Promise.resolve({id:neighbour.id})});globalThis.__lotlineUser={userId:'quota-owner'};
 // A smaller replacement subtracts the old dataset, rather than double charging it.
 response=await api.workspace.PUT(req('PUT',{dataset:{receipts:[],production:[],shipments:[]},revision:2}),targetContext);assert.equal(response.status,200);assert.ok(used()<quota);
 assert.equal((await api.workspace.DELETE(req('DELETE'),{params:Promise.resolve({id:holder.id})})).status,200);assert.ok(used()<1000);
 assert.equal((await api.drills.POST(req('POST',{lot:'LOT-1',notes:'Storage released'}),targetContext)).status,201);
 await api.workspace.DELETE(req('DELETE'),targetContext);assert.equal(used(),0);globalThis.__lotlineUser=previousUser;
});
