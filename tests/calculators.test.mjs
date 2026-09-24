import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
class ClassList { constructor(){this.names=new Set(['active'])} toggle(name,on){if(on)this.names.add(name);else this.names.delete(name)} contains(name){return this.names.has(name)} }
function page(file){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const nodes=new Map();
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'',checked:false,style:{display:'none'},textContent:'',innerHTML:'',classList:new ClassList(),handlers:{},addEventListener(name,fn){this.handlers[name]=fn},scrollIntoView(){}});return nodes.get(id)}
 for(const match of html.matchAll(/<(input|select|button|div|strong|span)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
   const el=node(match[2]);const tag=match[0];el.value=tag.match(/\bvalue="([^"]*)"/)?.[1]??el.value;el.checked=/\bchecked\b/.test(tag);
   if(match[1]==='select'){el.value=html.slice(match.index+match[0].length).match(/<option\s+value="([^"]+)"/)?.[1]??el.value}
 }
 const document={getElementById:node};
 const context=vm.createContext({document,console,Number,Math,setTimeout});
 // The primary calculation is deliberately tested separately from the optional purchase panel.
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>{const src=m[1].match(/src="([^"]+)/)?.[1];return src?.startsWith('/assets/') && !src.endsWith('toolkit.js')?fs.readFileSync(path.join(root,src),'utf8'):src?'':m[2]}).filter(s=>s.trim());
 for(const script of scripts)vm.runInContext(script,context,{filename:file});
 return {get:node,click(id){const x=node(id);(x.onclick??x.handlers.click)?.()},fill(id,v){node(id).value=String(v)}}
}
const cases=[
 {file:'gravel-calculator/index.html',values:{length:8,width:1.2,depth:5},expect:{mainResult:0.9,volumeResult:0.53}},
 {file:'concrete-calculator/index.html',values:{length:5,width:3,depth:10},expect:{mainResult:1.65,volumeResult:1.5}},
 {file:'mulch-calculator/index.html',values:{length:6,width:2,depth:7},expect:{mainResult:0.84,bagResult:17}},
 {file:'soil-calculator/index.html',values:{length:6,width:3,depth:10},expect:{mainResult:1.89,bagResult:48}},
 {file:'sand-calculator/index.html',values:{length:5,width:3,depth:5},expect:{mainResult:1.32,volumeResult:0.83}},
];
for(const {file,values,expect} of cases){
 const p=page(file);for(const [k,v] of Object.entries(values))p.fill(k,v);p.click('calculateBtn');
 assert.equal(p.get('result').style.display,'block',file+' valid input');
 for(const [id,v] of Object.entries(expect))assert.ok(Math.abs(parseFloat(p.get(id).textContent.replaceAll(',',''))-v)<0.011,file+' '+id+' = '+p.get(id).textContent);
 p.click('imperialBtn');p.click('calculateBtn');assert.equal(p.get('result').style.display,'block',file+' imperial result');assert.ok(Number.isFinite(parseFloat(p.get('mainResult').textContent)),file+' imperial finite');
 p.fill('length',0);p.click('calculateBtn');assert.equal(p.get('error').style.display,'block',file+' zero input error');
 console.log('PASS',file);
}
// Check every other existing calculator produces a result with ordinary positive inputs.
for(const slug of ['asphalt','paver','paint','tile','flooring','drywall','brick']){
 const file=slug+'-calculator/index.html',p=page(file);
 for(const id of ['length','width','depth','areaLength','areaWidth','tileLength','tileWidth','perBox','packCoverage','wallLength','wallHeight','sheetWidth','sheetHeight','brickLength','brickHeight','paverLength','paverWidth','perimeter','height','coats','coverage']){
   if(p.get(id).value==='')p.fill(id, id==='coverage'?10:5);
 }
 p.click('calculateBtn');assert.equal(p.get('result').style.display,'block',file+' valid result');
 p.click('imperialBtn');p.click('calculateBtn');assert.equal(p.get('result').style.display,'block',file+' imperial result');
 console.log('PASS',file);
}
