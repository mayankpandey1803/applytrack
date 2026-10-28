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
db.exec(`CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY,sku TEXT UNIQUE NOT NULL,name TEXT NOT NULL,quantity INTEGER NOT NULL CHECK(quantity>=0),threshold INTEGER NOT NULL DEFAULT 5); CREATE TABLE IF NOT EXISTS movements(id INTEGER PRIMARY KEY,product_id INTEGER NOT NULL REFERENCES products(id),delta INTEGER NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
const api=async(req,res,u)=>{
 if(u.pathname==='/api/products'&&req.method==='GET'){const q='%'+(u.searchParams.get('q')||'')+'%';return json(res,200,db.prepare('SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? ORDER BY id DESC').all(q,q))}
 if(u.pathname==='/api/movements'&&req.method==='GET')return json(res,200,db.prepare('SELECT m.*,p.name,p.sku FROM movements m JOIN products p ON m.product_id=p.id ORDER BY m.id DESC LIMIT 100').all());
 if(u.pathname==='/api/products'&&req.method==='POST'){
  const b=await body(req),sku=text(b.sku,40),name=text(b.name),threshold=integer(b.threshold);
  if(db.prepare('SELECT id FROM products WHERE sku=?').get(sku))fail('SKU already exists',409);
  const r=db.prepare('INSERT INTO products(sku,name,quantity,threshold) VALUES(?,?,0,?)').run(sku,name,threshold);return json(res,201,{id:Number(r.lastInsertRowid)});
 }
 if(u.pathname==='/api/movements'&&req.method==='POST'){
  const b=await body(req),id=integer(b.product_id,1),reason=text(b.reason,200);
  if(!Number.isSafeInteger(b.delta)||b.delta===0||Math.abs(b.delta)>1000000)fail('Enter a non-zero stock change');
  db.exec('BEGIN IMMEDIATE');try{
   const p=db.prepare('SELECT * FROM products WHERE id=?').get(id);if(!p)fail('Product not found',404);if(p.quantity+b.delta<0)fail('Insufficient stock',409);
   db.prepare('UPDATE products SET quantity=quantity+? WHERE id=?').run(b.delta,id);
   db.prepare('INSERT INTO movements(product_id,delta,reason) VALUES(?,?,?)').run(id,b.delta,reason);db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e}return json(res,201,{ok:true});
 }
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
