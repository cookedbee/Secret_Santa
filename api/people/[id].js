const { load, save, slug, json, parse } = require('../_lib');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'PUT' && req.method !== 'DELETE') return json(res, 405, { error: 'Method not allowed' });
    const people = await load();
    const i = people.findIndex(x => slug(x.name) === req.query.id);
    if (i < 0) return json(res, 404, { error: 'Not found' });
    if (req.method === 'DELETE') {
      people.splice(i, 1);
      await save(people);
      return json(res, 200, { ok: true });
    }
    const p = people[i];
    const w = parse(req).wishes;
    if (!Array.isArray(w)) return json(res, 400, { error: 'Bad wishes' });
    p.wishes = w.map(x => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, 30);
    await save(people);
    json(res, 200, { person: p });
  } catch (e) { json(res, 500, { error: String(e.message || e) }); }
};
