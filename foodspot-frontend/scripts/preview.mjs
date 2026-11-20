// Loopback-only smoke-test server for static build output, not a production server.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
const dist=new URL('../dist/',import.meta.url);
if(!existsSync(new URL('index.html',dist))){console.error('Run npm run build first.');process.exit(1)}
const files=new Map([['/',['index.html','text/html; charset=utf-8']],['/index.html',['index.html','text/html; charset=utf-8']],['/assets/app.js',['assets/app.js','text/javascript; charset=utf-8']],['/assets/app.css',['assets/app.css','text/css; charset=utf-8']]]);
const server=createServer(async(req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return}
 const file=files.get((req.url??'/').split('?')[0]);if(!file){res.writeHead(404).end('Not found');return}
 try{const data=await readFile(new URL(file[0],dist));res.writeHead(200,{'Content-Type':file[1],'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}).end(req.method==='HEAD'?undefined:data)}catch{res.writeHead(404).end('Not found')}
});
server.listen(4173,'127.0.0.1',()=>console.log('FoodSpot preview: http://127.0.0.1:4173'));
