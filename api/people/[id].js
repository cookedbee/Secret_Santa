const { load, save, slug, json, parse } = require('../_lib');

module.exports = async (req, res) => {
  try {
    if (req.method !== 'PUT') return json(res, 405, { error: 'Method not allowed' });
    const people = await load();
    const p = people.find(x => slug(x.name) === req.query.id);
    if (!p) return json(res, 404, { error: 'Not found' });
    const w = parse(req).wishes;
    if (!Array.isArray(w)) return json(res, 400, { error: 'Bad wishes' });
    p.wishes = w.map(x => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, 30);
    await save(people);
    json(res, 200, { person: p });
  } catch (e) { json(res, 500, { error: String(e.message || e) }); }
};
