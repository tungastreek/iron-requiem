// ===== Attack types, armor classes, effectiveness chart, status effects =====
'use strict';
const ATK = {
  KIN:  { name: 'Kinetic',   short: 'KIN',  color: '#e0c98a', desc: 'Solid rounds, fists and drills. Shreds light frames and beam coatings, glances off heavy plate.' },
  BEAM: { name: 'Beam',      short: 'BEAM', color: '#5cf2ff', desc: 'Focused particle streams. Cooks organic tissue, scattered by beam coating.' },
  PLAS: { name: 'Plasma',    short: 'PLS',  color: '#ff7a2e', desc: 'Superheated matter. Melts heavy armor and burns biomass, but Void bodies drink the heat.' },
  BLADE:{ name: 'Blade',     short: 'BLD',  color: '#dfe8ff', desc: 'Edges and claws. Carves light frames open, dulls on heavy plate and ship hulls.' },
  EXPL: { name: 'Explosive', short: 'EXP',  color: '#ffcc33', desc: 'Missiles and shells. Devastating against hulls and heavy units, evaded by light frames.' },
  GRAV: { name: 'Graviton',  short: 'GRV',  color: '#b06cff', desc: 'Compressed spacetime. Crushes heavy units, ships and Void bodies; organics flex with it.' },
  SPIR: { name: 'Spirit',    short: 'SPR',  color: '#7dffb0', desc: 'Resonance given form. The only true answer to the Void. Ships have no soul to wound.' },
};
const ARMOR = {
  HEAVY: { name: 'Heavy Plate', color: '#c9a36a', desc: 'Super robots and siege frames. Thick alloy that shrugs off bullets and blades.' },
  LIGHT: { name: 'Light Frame', color: '#8fd3ff', desc: 'Agile real robots. Fast but fragile against kinetics and blades.' },
  COAT:  { name: 'Beam Coat',   color: '#9affe0', desc: 'Ablative anti-beam lacquer. Beams scatter, but metal still cuts.' },
  BIO:   { name: 'Biomass',     color: '#9be86a', desc: 'Ourobor living tissue. Regrows, but burns and cooks easily.' },
  VOID:  { name: 'Void Body',   color: '#d48bff', desc: 'Vael posthuman matter. Resists most physics — but not resonance.' },
  HULL:  { name: 'Ship Hull',   color: '#b8c0cc', desc: 'Capital-ship plating. Huge targets, weak to explosives and gravity.' },
};
const VARIANTS = {
  elite: { name: 'Elite', prefix: 'Elite ', desc: 'Veteran frame: stronger hull, armor, mobility and targeting.', hp: 1.4, arm: 1.15, mob: 10, accuracy: 10, stats: 0, regenHP: 0, reward: 1.5, skills: ['prevail'], badge: '⌃', color: '#c8d8e8', filter: 'saturate(1.3) brightness(1.05)' },
  commander: { name: 'Commander', prefix: 'Cmdr. ', desc: 'Command link: nearby allies gain +10 hit and evasion.', hp: 1.8, arm: 1.2, mob: 0, accuracy: 0, stats: 15, regenHP: 0, reward: 2, skills: ['prevail', 'nerves'], badge: '★', color: '#ffd166', filter: 'saturate(1.15) brightness(1.06)' },
  corrupted: { name: 'Corrupted', prefix: 'Corrupted ', desc: 'Resonance infection: regenerates 5% HP; status chance +15 points.', hp: 1.5, arm: 1, mob: 0, accuracy: 0, stats: 0, regenHP: .05, reward: 1.75, status: 15, skills: [], badge: '✣', color: '#b57dff', filter: 'hue-rotate(35deg) saturate(1.4) brightness(.85)' },
};
// multiplier[attack][armor]
const CHART = {
  KIN:  { HEAVY: 0.75, LIGHT: 1.25, COAT: 1.25, BIO: 1.0,  VOID: 0.75, HULL: 1.0 },
  BEAM: { HEAVY: 1.0,  LIGHT: 1.1,  COAT: 0.5,  BIO: 1.25, VOID: 1.0,  HULL: 1.0 },
  PLAS: { HEAVY: 1.25, LIGHT: 1.0,  COAT: 0.85, BIO: 1.5,  VOID: 0.6,  HULL: 1.0 },
  BLADE:{ HEAVY: 0.75, LIGHT: 1.5,  COAT: 1.25, BIO: 1.25, VOID: 1.0,  HULL: 0.75 },
  EXPL: { HEAVY: 1.25, LIGHT: 0.75, COAT: 1.0,  BIO: 1.0,  VOID: 0.75, HULL: 1.5 },
  GRAV: { HEAVY: 1.5,  LIGHT: 1.0,  COAT: 1.0,  BIO: 0.75, VOID: 1.25, HULL: 1.25 },
  SPIR: { HEAVY: 1.0,  LIGHT: 1.0,  COAT: 1.0,  BIO: 1.25, VOID: 1.75, HULL: 0.6 },
};
function effLabel(m) {
  if (m >= 1.5) return { t: 'DEVASTATING', c: '#ff4d6d' };
  if (m > 1.0) return { t: 'EFFECTIVE', c: '#ffb347' };
  if (m === 1.0) return { t: 'NEUTRAL', c: '#9fb3c8' };
  if (m >= 0.75) return { t: 'RESISTED', c: '#7a8ca3' };
  return { t: 'IMMUNE-ISH', c: '#56657a' };
}

// Status effects (WoW-style debuffs). turns = duration in owner's phases
const STATUS = {
  BURN:  { name: 'Burn',        color: '#ff7a2e', icon: '🔥', turns: 2, desc: 'Loses 8% max HP at the start of each phase.' },
  SHOCK: { name: 'Shock',       color: '#ffe066', icon: '⚡', turns: 2, desc: 'Loses 25 EN per phase; Mobility −20.' },
  BREAK: { name: 'Armor Break', color: '#ff4d6d', icon: '⛨', turns: 2, desc: 'Armor value −35%.' },
  SLOW:  { name: 'Slow',        color: '#6ec6ff', icon: '❄', turns: 2, desc: 'Movement −2.' },
  JAM:   { name: 'Jammed',      color: '#b06cff', icon: '◎', turns: 2, desc: 'Accuracy −25%.' },
};

const TERRAIN = {
  '.': { name: 'Plains',   cost: 1, def: 0,  eva: 0,  col: '#2a3b2a' },
  f:   { name: 'Forest',   cost: 2, def: 5,  eva: 15, col: '#1f3a24' },
  m:   { name: 'Mountain', cost: 3, def: 20, eva: 10, col: '#3d3a35' },
  c:   { name: 'City',     cost: 1, def: 10, eva: 10, col: '#2b3040' },
  r:   { name: 'Ruins',    cost: 2, def: 15, eva: 5,  col: '#36302c' },
  w:   { name: 'Water',    cost: 3, def: 0,  eva: -10, col: '#15324d' },
  b:   { name: 'Base',     cost: 1, def: 20, eva: 10, col: '#30384a', heal: true },
  s:   { name: 'Space',    cost: 1, def: 0,  eva: 0,  col: '#070b16' },
  a:   { name: 'Debris',   cost: 2, def: 10, eva: 20, col: '#1a1d26' },
  h:   { name: 'Hive Flesh', cost: 2, def: 0, eva: 0, col: '#3a1f2a', hurt: true },
  x:   { name: 'Wall',     cost: 99, def: 0, eva: 0,  col: '#111' },
  v:   { name: 'Void Lattice', cost: 1, def: 5, eva: 5, col: '#1a0f2a' },
};

const TERRAIN_NOTE = {
  '.': 'Open ground. No cover.', f: 'Forest canopy: +15% evasion, +5% defense. Slows ground units.', m: 'High ground: +20% defense, and attackers standing here gain +10 hit and +5% damage.',
  c: 'Urban cover: +10% defense, +10% evasion.', r: 'Rubble: +15% defense, +5% evasion.', w: 'Water: −10% evasion for ground units; slow to cross.',
  b: 'Base: +20% defense, +10% evasion, and restores 15% HP/EN each phase.', s: 'Open space.', a: 'Debris field: +20% evasion, +10% defense.',
  h: 'Hive flesh: deals 5% max HP damage to non-Ourobor ground units each phase.', x: 'Impassable.', v: 'Vael lattice: +5% defense, +5% evasion; restores 5 SP each phase to anyone standing on it.',
};
// hidden things buried under tiles (revealed when a unit ends its move there)
const SECRETS = {
  cache:   { name: 'Supply Cache',    desc: 'Credits recovered.' },
  part:    { name: 'Buried Part',     desc: 'A spare part, intact.' },
  shard:   { name: 'Aurora Shard',    desc: 'The pilot gains +2 skill points.' },
  repair:  { name: 'Repair Crate',    desc: 'HP and EN fully restored.' },
  node:    { name: 'Resonance Node',  desc: 'Will +10 and SP +20.' },
  ambush:  { name: 'Ambush!',         desc: 'It was a trap.' },
};
const SPIRITS = {
  focus:   { name: 'Focus',    cost: 15, desc: '+30% hit and evasion until your next phase.' },
  strike:  { name: 'Strike',   cost: 10, desc: 'Next attack is guaranteed to hit.' },
  alert:   { name: 'Alert',    cost: 15, desc: 'Evade the next attack completely.' },
  valor:   { name: 'Valor',    cost: 40, desc: 'Next attack deals double damage.' },
  ironwall:{ name: 'Iron Wall',cost: 20, desc: 'Damage taken reduced to 1/4 until your next phase.' },
  guts:    { name: 'Guts',     cost: 30, desc: 'Restore 50% of max HP.' },
  zeal:    { name: 'Zeal',     cost: 50, desc: 'Act again this turn.' },
  ardor:   { name: 'Ardor',    cost: 30, desc: 'Will +10.' },
  accel:   { name: 'Accel',    cost: 5,  desc: 'Movement +3 this turn.' },
  mend:    { name: 'Mend',     cost: 25, desc: 'Restore 3500 HP to an ally (or self).' },
  rally:   { name: 'Rally',    cost: 40, desc: 'All allies gain Will +5.' },
  fortune: { name: 'Fortune',  cost: 25, desc: 'Credits from your next kill are doubled.' },
  insight: { name: 'Insight',  cost: 20, desc: 'EXP from your next battle is doubled.' },
  resolve: { name: 'Resolve',  cost: 70, desc: 'Focus + Strike + Valor + Accel at once.' },
  cleanse: { name: 'Cleanse',  cost: 15, desc: 'Remove all status effects from self.' },
};
