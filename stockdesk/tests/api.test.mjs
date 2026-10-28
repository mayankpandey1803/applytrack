import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
let child,base;const dir=mkdtempSync(join(tmpdir(),'portfolio-test-'));
before(async()=>{child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'0',DB_PATH:join(dir,'test.sqlite')},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),5000);child.stdout.on('data',d=>{const m=String(d).match(/http:\/\/127.0.0.1:\d+/);if(m){base=m[0];clearTimeout(timer);resolve()}});child.on('exit',c=>reject(Error('Server exited '+c)))})});
after(async()=>{if(child){const closed=new Promise(r=>child.once('exit',r));child.kill();await closed}rmSync(dir,{recursive:true,force:true})});
async function request(path,method='GET',body){const r=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json()}}
test('stock movements preserve non-negative balances and audit history',async()=>{
 const p=await request('products','POST',{sku:'KB-01',name:'Keyboard',threshold:5});assert.equal(p.status,201);
 assert.equal((await request('movements','POST',{product_id:p.data.id,delta:10,reason:'Received'})).status,201);
 assert.equal((await request('movements','POST',{product_id:p.data.id,delta:-4,reason:'Issued'})).status,201);
 assert.equal((await request('movements','POST',{product_id:p.data.id,delta:-7,reason:'Too many'})).status,409);
 assert.equal((await request('products')).data[0].quantity,6);assert.equal((await request('movements')).data.length,2);
});
test('reject duplicate SKUs, bad values and nonexistent products',async()=>{
 assert.equal((await request('products','POST',{sku:'KB-01',name:'Duplicate',threshold:5})).status,409);
 assert.equal((await request('products','POST',{sku:'A',name:'Bad',threshold:-1})).status,400);
 assert.equal((await request('movements','POST',{product_id:999,delta:1,reason:'Missing'})).status,404);
 assert.equal((await request('movements','POST',{product_id:1,delta:0,reason:'Zero'})).status,400);
});
test('search finds product by SKU',async()=>{assert.equal((await request('products?q=KB-01')).data[0].name,'Keyboard')});
