import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
const ROOT = new URL('./dist/', import.meta.url).pathname
const TYPES = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml' }
createServer(async (req,res)=>{ const p=new URL(req.url,'http://x').pathname
  let f=join(ROOT,normalize(p)); if(p.endsWith('/')) f=join(f,'index.html')
  try{ const b=await readFile(f); res.writeHead(200,{'content-type':TYPES[extname(f)]??'application/octet-stream'}); res.end(b) }
  catch{ res.writeHead(404,{'content-type':'text/html'}); res.end(await readFile(join(ROOT,'404.html'))) }
}).listen(5600)
