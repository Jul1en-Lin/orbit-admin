import http from 'node:http';
import { readFile } from 'node:fs/promises';
const production = process.env.NODE_ENV === 'production';
http.createServer(async (req,res) => {
  let html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  if(production) html = html.replace('<body>', '<body class="production">');
  res.writeHead(200, {'Content-Type':'text/html; charset=utf-8'}); res.end(html);
}).listen(4173, '127.0.0.1', () => console.log('Prototype: http://127.0.0.1:4173/?variant=A'));
