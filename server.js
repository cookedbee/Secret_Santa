// Secret Santa Wishlists - tiny server, no dependencies. Run: node server.js
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data.json');
const PAGE = path.join(__dirname, 'public', 'index.html');

const slug = n => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
let people;
try { people = JSON.parse(fs.readFileSync(DATA, 'utf8')); }
catch (e) {
  people = ['Aliyah', 'Hala', 'Kayla', 'Ohm', 'Abdalla'].map(name => ({ name, wishes: [] }));
  save();
}
function save() {
  fs.writeFileSync(DATA + '.tmp', JSON.stringify(people, null, 2));
  fs.renameSync(DATA + '.tmp', DATA);
}
function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 20000) { reject(new Error('too big')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch (e) { reject(e); } });
  });
}

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  try {
    if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(PAGE));
    }
    if (url === '/api/people' && req.method === 'GET') return send(res, 200, { people });
    if (url === '/api/people' && req.method === 'POST') {
      const name = String((await body(req)).name || '').trim().slice(0, 20);
      if (!slug(name)) return send(res, 400, { error: 'Please enter a name using letters or numbers.' });
      if (people.some(p => slug(p.name) === slug(name))) return send(res, 409, { error: name + ' already has an envelope.' });
      const p = { name, wishes: [] };
      people.push(p); save();
      return send(res, 201, { person: p });
    }
    const m = url.match(/^\/api\/people\/([a-z0-9-]+)$/);
    if (m && req.method === 'PUT') {
      const p = people.find(x => slug(x.name) === m[1]);
      if (!p) return send(res, 404, { error: 'Not found' });
      const w = (await body(req)).wishes;
      if (!Array.isArray(w)) return send(res, 400, { error: 'Bad wishes' });
      p.wishes = w.map(x => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, 30);
      save();
      return send(res, 200, { person: p });
    }
    send(res, 404, { error: 'Not found' });
  } catch (e) { send(res, 400, { error: 'Bad request' }); }
}).listen(PORT, '0.0.0.0', () => {
  console.log('\n🎄 Secret Santa is running!\n');
  console.log('  On this computer:  http://localhost:' + PORT);
  Object.values(os.networkInterfaces()).flat().filter(i => i.family === 'IPv4' && !i.internal)
    .forEach(i => console.log('  Same Wi-Fi/network: http://' + i.address + ':' + PORT));
  console.log('');
});
