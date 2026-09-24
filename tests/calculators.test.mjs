import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
class ClassList { constructor(active=false){this.names=new Set(active?['active']:[])} toggle(name,on){if(on)this.names.add(name);else this.names.delete(name)} contains(name){return this.names.has(name)} remove(name){this.names.delete(name)} }
function page(file){
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const nodes=new Map();const sectionRows=[];
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'',checked:false,style:{display:'none'},textContent:'',_html:'',set innerHTML(html){this._html=html;if(this.id.endsWith('Unit'))this.value=html.match(/value=\"([^\"]+)/)?.[1]??this.value},get innerHTML(){return this._html},classList:new ClassList(id==='metricBtn'),handlers:{},querySelectorAll(){return []},setAttribute(name,value){this[name]=value},addEventListener(name,fn){(this.handlers[name]??=[]).push(fn)},scrollIntoView(){}});return nodes.get(id)}
 for(const match of html.matchAll(/<(input|select|button|div|strong|span|label)\b[^>]*\bid="([^"]+)"[^>]*>/g)){
   const el=node(match[2]);const tag=match[0];el.value=tag.match(/\bvalue="([^"]*)"/)?.[1]??el.value;el.checked=/\bchecked\b/.test(tag); if(match[2]==='imperialBtn')el.classList.toggle('active',false);
   if(match[1]==='select'){el.value=html.slice(match.index+match[0].length).match(/<option\s+value="([^"]+)"/)?.[1]??el.value}
 }
 const document={getElementById:id=>nodes.get(id)??null,querySelectorAll(selector){return selector==='[data-gravel-section]'?sectionRows:[]}};
 if(nodes.has('gravelSections'))nodes.get('gravelSections').querySelectorAll=()=>sectionRows;
 const context=vm.createContext({document,console,Number,Math,setTimeout});context.window=context;
 // The primary calculation is deliberately tested separately from the optional purchase panel.
 const scripts=[...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)].map(m=>{const src=m[1].match(/src="([^"]+)/)?.[1];return src?.startsWith('/assets/') && !src.endsWith('toolkit.js')?fs.readFileSync(path.join(root,src),'utf8'):src?'':m[2]}).filter(s=>s.trim());
 for(const script of scripts)vm.runInContext(script,context,{filename:file});
 return {get:node,addSection(length,width){const l={value:String(length)},w={value:String(width)},lu={textContent:''},wu={textContent:''};const row={querySelector(selector){return {'[data-section-length]':l,'[data-section-width]':w,'[data-section-length-unit]':lu,'[data-section-width-unit]':wu}[selector]??null}};sectionRows.push(row);return {length:l,width:w}},click(id){const x=node(id);(x.handlers.click??[]).forEach(fn=>fn());x.onclick?.()},fill(id,v){node(id).value=String(v)}}
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
 const before={length:Number(p.get('length').value),depth:Number(p.get('depth').value)};
 p.click('imperialBtn');
 assert.ok(Math.abs(Number(p.get('length').value)-before.length/0.3048)<0.0001,file+' length conversion');
 assert.ok(Math.abs(Number(p.get('depth').value)-before.depth/2.54)<0.0001,file+' depth conversion');
 p.click('calculateBtn');assert.equal(p.get('result').style.display,'block',file+' imperial result');assert.ok(Number.isFinite(parseFloat(p.get('mainResult').textContent)),file+' imperial finite');
 p.fill('length',0);p.click('calculateBtn');assert.equal(p.get('error').style.display,'block',file+' zero input error');
 console.log('PASS',file);
}
// Volume-based bag sizes convert from litres to cubic feet without changing the order count.
for(const [slug,values] of [['mulch',{length:6,width:2,depth:7}],['soil',{length:6,width:3,depth:10}]]){
 const p=page(slug+'-calculator/index.html');for(const [id,v] of Object.entries(values))p.fill(id,v);p.click('calculateBtn');
 const original=parseInt(p.get('bagResult').textContent.replaceAll(',',''),10),litres=Number(p.get('bagSize').value);
 p.click('imperialBtn');assert.ok(Math.abs(Number(p.get('bagSize').value)-litres/28.3168466)<0.0001,slug+' bag unit conversion');
 p.click('calculateBtn');assert.equal(parseInt(p.get('bagResult').textContent.replaceAll(',',''),10),original,slug+' preserved bag count');
}
// Two measured gravel rectangles share one depth and survive a unit switch.
{const p=page('gravel-calculator/index.html');p.fill('length',8);p.fill('width',1.2);p.fill('depth',5);const extra=p.addSection(2,1.5);p.click('calculateBtn');assert.equal(p.get('areaResult').textContent,'12.60 m²');assert.ok(Math.abs(parseFloat(p.get('mainResult').textContent)-1.18)<0.01);p.click('imperialBtn');assert.ok(Math.abs(Number(extra.length.value)-2/0.3048)<0.0001);p.click('calculateBtn');assert.ok(Math.abs(parseFloat(p.get('mainResult').textContent)-1.298)<0.01);extra.width.value='0';p.click('calculateBtn');assert.equal(p.get('error').style.display,'block');}
// A supplier's stated density must override the preset, in both systems.
for(const [slug,dimensions,expected] of [['gravel',{length:8,width:1.2,depth:5},1.056],['sand',{length:5,width:3,depth:5},1.65],['soil',{length:6,width:3,depth:10},3.78]]){
 const p=page(slug+'-calculator/index.html');for(const [id,v] of Object.entries(dimensions))p.fill(id,v);p.get('density').value='custom';p.fill('customDensity',2);p.click('calculateBtn');
 const text=p.get(slug==='soil'?'weightResult':'mainResult').textContent.replaceAll(',','');
 assert.ok(Math.abs(parseFloat(text)-(slug==='soil'?3780:expected))<0.02,slug+' custom metric density '+text);
 p.click('imperialBtn');assert.ok(Math.abs(Number(p.get('customDensity').value)-3371.1)<1,slug+' custom density conversion');
 p.fill('customDensity',0);p.click('calculateBtn');assert.equal(p.get('error').style.display,'block',slug+' invalid custom density');
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
