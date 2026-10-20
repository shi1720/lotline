import type {Receipt,Production,Shipment} from './trace';
export type ImportKind='receipts'|'production'|'shipments';
export const fieldsByKind:Record<ImportKind,string[]>={receipts:['ingredient','lot','supplier','receivedDate','quantity','unit'],production:['batch','product','ingredient','lot','quantity','unit','producedDate','outputQuantity','outputUnit'],shipments:['batch','product','customer','email','shippedDate','quantity','unit']};
export const requiredFieldsByKind=fieldsByKind;
/** RFC 4180-style CSV, including quoted delimiters, escaped quotes, CRLF, and multiline fields. */
export function parseCSV(text:string):{headers:string[];rows:string[][];rowNumbers:number[]}{
 const records:string[][]=[],recordStarts:number[]=[];let record:string[]=[],field='',quoted=false,afterQuote=false,physicalRow=1,recordStart=1;
 const input=text.replace(/^\uFEFF/,'');
 for(let i=0;i<input.length;i++){
  const ch=input[i];
  if(quoted){if(ch==='"'){if(input[i+1]==='"'){field+='"';i++;}else{quoted=false;afterQuote=true;}}else {field+=ch;if(ch==='\n'||(ch==='\r'&&input[i+1]!=='\n'))physicalRow++;}continue;}
  if(ch==='"'){if(field||afterQuote)throw new Error('Unexpected quote in unquoted CSV field.');quoted=true;continue;}
  if(ch===','){record.push(field);field='';afterQuote=false;continue;}
  if(ch==='\n'||ch==='\r'){if(ch==='\r'&&input[i+1]==='\n')i++;record.push(field);if(record.some(v=>v.trim())){records.push(record);recordStarts.push(recordStart);}physicalRow++;recordStart=physicalRow;record=[];field='';afterQuote=false;continue;}
  if(afterQuote){if(ch===' '||ch==='\t')continue;throw new Error('Unexpected text after closing CSV quote.');}
  field+=ch;
 }
 if(quoted)throw new Error('Unclosed quoted CSV field.');
 record.push(field);if(record.some(v=>v.trim())){records.push(record);recordStarts.push(recordStart);}
 const headers=(records.shift()??[]).map(h=>h.trim());recordStarts.shift();
 if(!headers.length||headers.some(h=>!h))throw new Error('CSV must include non-empty column headers.');
 if(new Set(headers.map(h=>h.toLowerCase())).size!==headers.length)throw new Error('CSV column headers must be unique.');
 return {headers,rows:records,rowNumbers:recordStarts};
}
const normalize=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,'');
const aliases:Record<string,string[]>={ingredient:['ingredientname','material'],lot:['lotnumber','ingredientlot','supplierlot','lotid'],supplier:['suppliername','vendor'],receivedDate:['received','receiptdate','datereceived'],quantity:['qty','amount'],unit:['uom','units'],batch:['batchid','batchnumber','productionbatch'],product:['productname','sku'],producedDate:['productiondate','dateproduced'],outputQuantity:['outputqty','yield','batchquantity'],outputUnit:['outputuom','yieldunit'],customer:['customername','account'],email:['customeremail','contactemail'],shippedDate:['shipdate','shipmentdate','dateshipped']};
export function defaultMapping(kind:ImportKind,headers:string[]):Record<string,string>{return Object.fromEntries(fieldsByKind[kind].map(f=>[f,headers.find(h=>normalize(h)===normalize(f)||aliases[f]?.includes(normalize(h)))??'']));}
type Records={receipts:Receipt;production:Production;shipments:Shipment};
export interface ImportError{row:number;field:string;message:string}
export function importRows<K extends ImportKind>(kind:K,headers:string[],rows:string[][],mapping:Record<string,string>,source:string,rowNumbers?:number[]):{records:Records[K][];errors:ImportError[]}{
 const errors:ImportError[]=[],records:Records[K][]=[];
 for(const f of fieldsByKind[kind])if(!mapping[f]||!headers.includes(mapping[f]))errors.push({row:1,field:f,message:`Map a source column for ${f}.`});
 if(errors.length)return {records,errors};
 rows.forEach((row,i)=>{
  const rowNumber=rowNumbers?.[i]??i+2,before=errors.length;const result:Record<string,string|number>={id:`${kind}:${source}:${rowNumber}`,source,row:rowNumber};
  if(row.length!==headers.length){errors.push({row:rowNumber,field:'',message:`Expected ${headers.length} columns; found ${row.length}.`});return;}
  for(const field of fieldsByKind[kind]){
   const value=(row[headers.indexOf(mapping[field])]??'').trim();
   if(field==='quantity'||field==='outputQuantity'){
    if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)||!Number.isFinite(Number(value)))errors.push({row:rowNumber,field,message:'Use a finite non-negative number without unit text or separators.'});
    result[field]=Number(value);continue;
   }
   result[field]=value;
   // Missing lineage is retained explicitly so the engine can surface an unresolved exposure.
   if(!value&&!['lot','batch','email'].includes(field))errors.push({row:rowNumber,field,message:`${field} is required.`});
   if(field.endsWith('Date')&&value){const d=new Date(`${value}T00:00:00Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==value)errors.push({row:rowNumber,field,message:'Use a valid date in YYYY-MM-DD format.'});}
   if(field==='email'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))errors.push({row:rowNumber,field,message:'Use a valid email address or leave blank for investigation.'});
  }
  if(errors.length===before)records.push(result as unknown as Records[K]);
 });return {records,errors};
}
