import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
// One-time transcription of the supplied tab-delimited attachment, including quoted multiline cells.
const input=readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'');
const rows=[];let row=[],cell='',quoted=false;
for(let i=0;i<input.length;i++){
 const c=input[i];
 if(c==='"'&&(quoted||cell==='')){if(quoted&&input[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
 else if(!quoted&&(c==='\t'||c==='\n')){row.push(cell.trim());cell='';if(c==='\n'){if(row.some(Boolean))rows.push(row);row=[];}}
 else if(c!=='\r')cell+=c;
}
if(quoted)throw Error('Unclosed quoted field');
if(cell||row.length){row.push(cell.trim());if(row.some(Boolean))rows.push(row);}
if(rows.some(r=>r.length!==5))throw Error('Expected five columns for every source row');
mkdirSync('supabase/seeds/2026',{recursive:true});
writeFileSync('supabase/seeds/2026/kpi-source.json',JSON.stringify(rows.map(([name,definition,formula,system,departments],i)=>({id:`attachment-kpi-${String(i+1).padStart(2,'0')}`,name,definition,formula,system,departments})),null,2)+'\n');
console.log(`${rows.length} source rows transcribed; no database writes.`);
