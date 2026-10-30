const { load, save, slug, json, parse } = require('./_lib');

module.exports = async (req, res) => {
  try {
    const people = await load();
    if (req.method === 'GET') return json(res, 200, { people });
    if (req.method === 'POST') {
      const name = String(parse(req).name || '').trim().slice(0, 20);
      if (!slug(name)) return json(res, 400, { error: 'Please enter a name using letters or numbers.' });
      if (people.some(p => slug(p.name) === slug(name))) return json(res, 409, { error: name + ' already has an envelope.' });
      const p = { name, wishes: [] };
      people.push(p);
      await save(people);
      return json(res, 201, { person: p });
    }
    json(res, 405, { error: 'Method not allowed' });
  } catch (e) { json(res, 500, { error: String(e.message || e) }); }
};
