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
test('create, search, change status, aggregate and delete an application',async()=>{
 const c=await request('applications','POST',{company:'Example Labs',role:'Web Developer',notes:'Test'});assert.equal(c.status,201);
 const list=await request('applications?q=Example');assert.equal(list.data.length,1);assert.equal(list.data[0].status,'Applied');
 assert.equal((await request('applications/'+c.data.id,'PATCH',{status:'Interview'})).status,200);
 assert.equal((await request('applications?status=Interview')).data.length,1);
 assert.deepEqual((await request('summary')).data,[{status:'Interview',count:1}]);
 assert.equal((await request('applications/'+c.data.id,'DELETE')).status,200);assert.equal((await request('applications')).data.length,0);
});
test('reject empty fields, invalid status and missing records',async()=>{
 assert.equal((await request('applications','POST',{company:' ',role:'Dev'})).status,400);
 assert.equal((await request('applications/999','PATCH',{status:'Unknown'})).status,400);
 assert.equal((await request('applications/999','DELETE')).status,404);
});
test('parameterized search handles SQL-looking user input',async()=>{assert.equal((await request("applications?q="+encodeURIComponent("' OR 1=1 --"))).status,200)});
