// Talks to the free Upstash Redis database you add in Vercel (Storage tab).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'secret-santa-people';
const SEED = ['Aliyah', 'Hala', 'Kayla', 'Ohm', 'Abdalla'].map(name => ({ name, wishes: [] }));

async function cmd(args) {
  if (!URL_ || !TOKEN) throw new Error('Database not connected');
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.result;
}
async function load() {
  const v = await cmd(['GET', KEY]);
  if (!v) { await save(SEED); return SEED.map(p => ({ ...p })); }
  return JSON.parse(v);
}
async function save(people) { await cmd(['SET', KEY, JSON.stringify(people)]); }
const slug = n => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function json(res, code, obj) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).json(obj);
}
function parse(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}
module.exports = { load, save, slug, json, parse };
