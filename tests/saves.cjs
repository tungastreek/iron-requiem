// Save migration and storage regression tests; no browser or packages required.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
function fixture(root) {
  const stored = new Map(), messages = [], failures = { get: false, set: false, remove: false }; let now = 100000;
  class Clock extends Date { static now() { return now; } }
  const nodes = new Map(), element = id => { if (!nodes.has(id)) nodes.set(id, { hidden: true, disabled: false, style: {}, getContext: () => ({}) }); return nodes.get(id); };
  const context = vm.createContext({ console, Date: Clock, performance: { now: () => now }, window: { addEventListener() {} }, document: { hidden: false, addEventListener() {} }, requestAnimationFrame() {}, cancelAnimationFrame() {},
    localStorage: { getItem(k) { if (failures.get) throw Error('blocked'); return stored.get(k) || null; }, setItem(k, v) { if (failures.set) throw Error('quota'); stored.set(k, String(v)); }, removeItem(k) { if (failures.remove) throw Error('blocked'); stored.delete(k); } },
    $: element, ART: { clearPortraits() {} }, UI: { toast: s => messages.push(s), intermission() {} }, SFX: {}, G: { map: null }, MAP: { stop() {} } });
  for (const file of ['data/types', 'data/mechs', 'data/pilots', 'data/story', 'data/expansion', 'battle/combat', 'main']) vm.runInContext(fs.readFileSync(path.join(root, 'js', file + '.js'), 'utf8'), context, { filename: file + '.js' });
  return { stored, messages, failures, eval: s => vm.runInContext(s, context), setNow: n => now = n };
}
function verify(root = path.resolve(__dirname, '..')) {
  const f = fixture(root), json = value => JSON.stringify(value), copy = value => JSON.parse(json(value));
  const legacy = copy(f.eval('defaultSave()')); legacy.v = 1; delete legacy.meta; delete legacy.settings.graphics;
  legacy.chapter = 'i5'; legacy.credits = 44700; legacy.flags = { route: 'B', zero: true, res: 4, archive_public: true };
  legacy.roster.push('anika'); legacy.pilots.anika = { lvl: 12, exp: 440, pp: 7, nodes: { a1: true, b2: true }, kills: 11 };
  legacy.mechs.aegis = { up: { hp: 3, wpn: 2 }, parts: ['repair', null] }; legacy.auxiliary = ['anika']; legacy.extensionRecord = { proof: 'retained' };
  f.eval('var testSave=' + json(legacy)); const migrated = copy(f.eval('migrate(testSave)'));
  assert.equal(migrated.v, 2); assert.equal(migrated.settings.graphics, 'auto'); assert.equal(migrated.meta.playtime, 0);
  for (const key of ['chapter', 'credits', 'flags', 'roster', 'pilots', 'mechs', 'inventory', 'auxiliary', 'extensionRecord']) assert.deepEqual(migrated[key], legacy[key], 'Migration preserves ' + key);
  assert.deepEqual(copy(f.eval('testSave')), legacy, 'Migration does not modify its input');
  f.stored.set('iron-requiem-save-v1', json(legacy)); const slots = copy(f.eval('GAME.slots()'));
  assert.equal(slots.length, 4); assert.deepEqual(slots.map(s => s.id), ['auto', '1', '2', '3']); assert.equal(slots[0].save.v, 2);
  assert.equal(JSON.parse(f.stored.get('iron-requiem-save-v1')).v, 2, 'Legacy autosave is migrated in place');
  const manual = { ...migrated, chapter: 'c4', meta: { savedAt: 50000, playtime: 61000 } };
  f.stored.set('iron-requiem-slot-2', json(manual)); f.eval('GAME.continue()'); assert.equal(f.eval('SAVE.chapter'), 'c4', 'Continue chooses newest slot');
  assert.equal(f.eval('SAVE.meta.playtime'), 61000); assert.equal(JSON.parse(f.stored.get('iron-requiem-save-v1')).chapter, 'c4');
  f.eval('SAVE.chapter="c2"'); f.setNow(102000); assert.equal(f.eval('GAME.saveSlot("1")'), true);
  f.eval('SAVE.chapter="c3"'); f.setNow(105000); assert.equal(f.eval('GAME.saveSlot("3")'), true);
  assert.equal(JSON.parse(f.stored.get('iron-requiem-slot-1')).chapter, 'c2'); assert.equal(JSON.parse(f.stored.get('iron-requiem-slot-3')).chapter, 'c3');
  assert.equal(f.eval('SAVE.meta.playtime'), 66000, 'Visible playtime accrues once across saves');
  f.eval('GAME.loadSlot("1")'); assert.equal(f.eval('SAVE.chapter'), 'c2');
  const before = f.eval('JSON.stringify(SAVE)'); assert.equal(f.eval('GAME.deleteSlot("2")'), true); assert.equal(f.stored.has('iron-requiem-slot-2'), false); assert.equal(f.eval('JSON.stringify(SAVE)'), before, 'Deleting a slot leaves current campaign intact');
  const backup = f.eval('GAME.exportJSON()'); assert.equal(JSON.parse(backup).chapter, 'c2'); assert.deepEqual(JSON.parse(backup).auxiliary, ['anika']);
  f.stored.set('iron-requiem-slot-2', 'not json'); assert.equal(f.eval('GAME.slots().find(s=>s.id==="2").corrupt'), true); assert.throws(() => f.eval('GAME.loadSlot("2")'));
  const invalids = ['not json', json({ ...legacy, v: 99 }), json({ ...legacy, chapter: 'missing' }), json({ ...legacy, roster: ['missing'] }), json({ ...legacy, credits: -1 }), json({ ...legacy, inventory: { nonexistent: 1 } }), json({ ...legacy, auxiliary: ['mira', 'mira'] }), '{"v":1,"__proto__":{"bad":true}}'];
  for (const text of invalids) { f.eval('var input=' + json(text)); const snapshot = f.eval('JSON.stringify(SAVE)'); assert.throws(() => f.eval('GAME.importJSON(input)')); assert.equal(f.eval('JSON.stringify(SAVE)'), snapshot, 'Invalid import preserves current save'); }
  f.eval('var input=' + json(json(legacy))); f.eval('GAME.importJSON(input)'); assert.equal(f.eval('SAVE.chapter'), 'i5'); assert.equal(f.eval('SAVE.v'), 2); assert.equal(f.eval('SAVE.flags.archive_public'), true);
  const blocked = fixture(root); blocked.failures.get = blocked.failures.set = blocked.failures.remove = true;
  assert.equal(blocked.eval('GAME.persist(true)'), false); assert.equal(blocked.eval('GAME.saveSlot("1")'), false);
  assert.equal(blocked.eval('GAME.slots()[0].save.chapter'), 'c1', 'Storage failure keeps autosave in memory');
  assert.equal(blocked.eval('GAME.slots()[1].save.chapter'), 'c1', 'Storage failure keeps manual slot in memory');
  assert.equal(JSON.parse(blocked.eval('GAME.exportJSON()')).chapter, 'c1', 'Export still works when storage is unavailable');
  assert.equal(blocked.eval('GAME.deleteSlot("1")'), false); assert.equal(blocked.eval('GAME.slots()[1].save'), null);
  assert(blocked.messages.some(m => m.includes('export a backup')), 'Storage failure is visible to the player');
  return { status: 'passed', checks: ['v1 migration without progress loss', 'three manual slots and legacy-key autosave', 'most recent Continue', 'independent slot writes and deletion', 'playtime accumulation', 'JSON backup and valid legacy import', 'invalid/corrupt save rejection without state loss', 'blocked-storage memory fallback and export'], limits: ['No browser screenshots or clipboard playback test; browser access unavailable.', 'No end-to-end browser test was run by this subtask.'] };
}
module.exports = { verify };
if (require.main === module) { try { console.log(JSON.stringify(verify(), null, 2)); } catch (e) { console.error(e); process.exitCode = 1; } }
