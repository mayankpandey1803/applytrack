import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
const db=new DatabaseSync(process.env.DB_PATH || 'data.sqlite');
db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
const text=(value,max=120)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max)fail('Enter a non-empty value (max '+max+' characters).');return value.trim()};
const integer=(value,min=0)=>{if(!Number.isSafeInteger(value)||value<min||value>10000000)fail('Invalid numeric value');return value};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
const body=async req=>{let raw='';for await(const c of req){raw+=c;if(raw.length>16384)fail('Request too large',413)}try{return JSON.parse(raw)}catch{fail('Invalid JSON')}};
db.exec(`CREATE TABLE IF NOT EXISTS applications(id INTEGER PRIMARY KEY, company TEXT NOT NULL, role TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Applied', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
const statuses=['Applied','Interview','Offer','Rejected'];
const api=async(req,res,u)=>{
 if(u.pathname==='/api/applications'&&req.method==='GET'){
  const q='%'+(u.searchParams.get('q')||'')+'%',s=u.searchParams.get('status')||'';
  return json(res,200,db.prepare("SELECT * FROM applications WHERE (company LIKE ? OR role LIKE ?) AND (? = '' OR status=?) ORDER BY id DESC").all(q,q,s,s));
 }
 if(u.pathname==='/api/summary'&&req.method==='GET')return json(res,200,db.prepare('SELECT status,COUNT(*) AS count FROM applications GROUP BY status').all());
 if(u.pathname==='/api/applications'&&req.method==='POST'){
  const b=await body(req),company=text(b.company),role=text(b.role),notes=typeof b.notes==='string'?b.notes.slice(0,2000):'';
  const r=db.prepare('INSERT INTO applications(company,role,notes) VALUES(?,?,?)').run(company,role,notes);return json(res,201,{id:Number(r.lastInsertRowid)});
 }
 const m=u.pathname.match(/^\/api\/applications\/(\d+)$/);
 if(m&&req.method==='PATCH'){const b=await body(req);if(!statuses.includes(b.status))fail('Invalid status');const r=db.prepare('UPDATE applications SET status=? WHERE id=?').run(b.status,Number(m[1]));if(!r.changes)fail('Not found',404);return json(res,200,{ok:true})}
 if(m&&req.method==='DELETE'){const r=db.prepare('DELETE FROM applications WHERE id=?').run(Number(m[1]));if(!r.changes)fail('Not found',404);return json(res,200,{ok:true})}
 fail('Not found',404);
};

const assets={'/':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/style.css':['style.css','text/css']};
const server=http.createServer(async(req,res)=>{try{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'");
 const u=new URL(req.url,'http://localhost');
 if(req.method==='GET'&&assets[u.pathname]){const [f,m]=assets[u.pathname];res.writeHead(200,{'Content-Type':m});return res.end(readFileSync(new URL('./public/'+f,import.meta.url)))}
 if(req.method!=='GET'&&req.headers.origin&&req.headers.origin!=='http://'+req.headers.host)fail('Origin not allowed',403);
 await api(req,res,u);
}catch(e){json(res,e.status||500,{error:e.status?e.message:'Internal server error'});if(!e.status)console.error(e)}});
server.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Listening on http://127.0.0.1:'+server.address().port));
process.on('SIGTERM',()=>server.close(()=>{db.close();process.exit(0)}));
