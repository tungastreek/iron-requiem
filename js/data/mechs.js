// ===== Mech roster =====
// w(): weapon helper.  cat M = melee (uses MEL), R = ranged (uses RNG)
'use strict';
function W(name, type, pow, rmin, rmax, o = {}) {
  return Object.assign({
    name, type, pow, rmin, rmax, acc: 0, crit: 0, en: 0, ammo: 0, will: 0, post: true,
    cat: (type === 'BLADE' || o.melee) ? 'M' : 'R', anim: 'rifle', status: null, finisher: false,
  }, o);
}
const SIZE_SCALE = { S: 0.82, M: 1.0, L: 1.22, XL: 1.5 };
const SIZE_HIT = { S: -10, M: 0, L: 8, XL: 18 };

const MECHS = {
  // ---------------- PLAYER ----------------
  alteon: {
    name: 'ALTEON', cls: 'Aurora-Core Prototype', armor: 'COAT', size: 'M', hp: 4200, en: 160, arm: 1100, mob: 112, move: 6, fly: false,
    desc: 'Built by Dr. Soren Kasuga around a crystalline fragment recovered from the Ashfall crater. Its frame hums when Rei is aboard.',
    vis: { body: 'humanoid', c1: '#e9eef6', c2: '#2856c9', c3: '#e0373f', g: '#62f3ff', bulk: 1, h: 1, head: 'vfin', shoulder: 'fin', back: 'thruster', weapon: 'rifle', chest: 'core', legs: 'normal' },
    weapons: [
      W('Photon Rifle', 'BEAM', 2600, 1, 5, { acc: 15, crit: 5, en: 10, anim: 'rifle' }),
      W('Arc Saber', 'BLADE', 2900, 1, 1, { acc: 20, crit: 20, anim: 'slash' }),
      W('Micro Missiles', 'EXPL', 2700, 2, 6, { acc: 5, ammo: 6, anim: 'missile' }),
      W('Prism Cannon', 'BEAM', 3800, 2, 7, { en: 40, will: 110, post: false, anim: 'beam', status: { id: 'JAM', ch: 30 } }),
      W('Aurora Break', 'SPIR', 5200, 1, 2, { en: 70, will: 130, crit: 30, acc: 10, finisher: true, anim: 'finisher', seq: ['multislash', 'beam'], cut: 'Aurora Core — resonate with me!' }),
    ],
  },
  alteonz: {
    name: 'ALTEON ZERO', cls: 'Awakened Aurora Frame', armor: 'COAT', size: 'M', hp: 6200, en: 230, arm: 1450, mob: 128, move: 7, fly: true,
    desc: 'The Aurora Core fully awakened, rebuilding Alteon from within. Light-feathers bloom from its back. It is no longer entirely a machine.',
    abil: { barrier: { name: 'Aurora Field', val: 900, en: 10, bypass: [] } },
    vis: { body: 'humanoid', c1: '#f6f8ff', c2: '#3b2bd0', c3: '#ffd166', g: '#9dfcff', bulk: 1.05, h: 1.05, head: 'crown', shoulder: 'fin', back: 'feather', weapon: 'sword', chest: 'gem', legs: 'normal' },
    weapons: [
      W('Photon Rifle Mk.II', 'BEAM', 3200, 1, 6, { acc: 20, crit: 10, en: 10, anim: 'rifle' }),
      W('Aurora Saber', 'BLADE', 3700, 1, 1, { acc: 25, crit: 25, anim: 'slash' }),
      W('Aurora Feathers', 'SPIR', 3900, 2, 6, { acc: 15, en: 30, anim: 'funnel', status: { id: 'JAM', ch: 30 } }),
      W('Prism Cannon Zero', 'BEAM', 4500, 2, 7, { en: 40, will: 110, post: false, anim: 'beam', status: { id: 'BREAK', ch: 30 } }),
      W('Requiem Zero', 'SPIR', 7400, 1, 3, { en: 80, will: 130, crit: 35, acc: 20, finisher: true, anim: 'finisher', seq: ['funnel', 'multislash', 'spirit'], cut: 'For everyone who sang before us — REQUIEM ZERO!' }),
    ],
  },
  sylph: {
    name: 'SYLPH', cls: 'Transforming Interceptor', armor: 'LIGHT', size: 'S', hp: 3500, en: 140, arm: 850, mob: 138, move: 7, fly: true,
    desc: 'Kestrel Base\'s pride: a variable-geometry interceptor Mira rebuilt bolt by bolt. Fragile, beautiful and absurdly fast.',
    vis: { body: 'humanoid', c1: '#f3f5fa', c2: '#14a3a3', c3: '#ff8fb3', g: '#7dffea', bulk: 0.82, h: 0.95, head: 'visor', shoulder: 'round', back: 'wings', weapon: 'rifle', chest: 'plate', legs: 'digit' },
    weapons: [
      W('Head Vulcans', 'KIN', 1600, 1, 2, { acc: 25, ammo: 20, anim: 'vulcan' }),
      W('Beam Pistol', 'BEAM', 2300, 1, 4, { acc: 15, crit: 10, en: 8, anim: 'rifle' }),
      W('Wire Talon', 'BLADE', 2600, 1, 3, { acc: 15, crit: 15, en: 10, anim: 'slash', status: { id: 'SLOW', ch: 45 } }),
      W('Gale Dance', 'BLADE', 4400, 1, 1, { en: 45, will: 120, acc: 25, crit: 30, finisher: true, anim: 'finisher', seq: ['multislash'], cut: 'Try and keep up — Gale Dance!' }),
    ],
  },
  bastion: {
    name: 'BASTION', cls: 'Siege Artillery Frame', armor: 'HEAVY', size: 'L', hp: 5800, en: 150, arm: 1500, mob: 72, move: 4, fly: false,
    desc: 'A walking fortress from the Third War. Gunnar refuses to retire it. "It still works, and so do I."',
    vis: { body: 'humanoid', c1: '#5b6b4a', c2: '#2d3328', c3: '#e8a33a', g: '#ffb347', bulk: 1.35, h: 1.0, head: 'mono', shoulder: 'pod', back: 'cannons', weapon: 'gatling', chest: 'vent', legs: 'heavy' },
    weapons: [
      W('Gatling Arm', 'KIN', 2100, 1, 3, { acc: 10, ammo: 12, anim: 'vulcan' }),
      W('Twin Cannon', 'KIN', 3000, 2, 7, { acc: 5, ammo: 8, crit: 10, anim: 'cannon' }),
      W('Missile Storm', 'EXPL', 3200, 3, 7, { ammo: 4, anim: 'missile' }),
      W('Buster Howitzer', 'EXPL', 4300, 3, 8, { ammo: 2, will: 115, post: false, crit: 15, anim: 'cannon', big: true, status: { id: 'BREAK', ch: 55 } }),
    ],
  },
  halcyon: {
    name: 'HALCYON', cls: 'Independent Battleship', armor: 'HULL', size: 'XL', hp: 14000, en: 250, arm: 1300, mob: 60, move: 5, fly: true, ship: true,
    desc: 'A decommissioned Concord cruiser Ilse Varga bought at auction and never repainted. Adjacent allies recover 10% HP/EN each phase.',
    vis: { body: 'ship', c1: '#cfd6df', c2: '#3a4658', c3: '#e0373f', g: '#62f3ff' },
    weapons: [
      W('AA Battery', 'KIN', 1800, 1, 3, { acc: 15, anim: 'vulcan' }),
      W('Missile Volley', 'EXPL', 2800, 2, 6, { ammo: 6, anim: 'missile' }),
      W('Main Cannon', 'BEAM', 3600, 3, 8, { en: 30, post: false, anim: 'megabeam' }),
      W('Halcyon Lance', 'PLAS', 4900, 3, 9, { en: 80, will: 120, post: false, crit: 10, anim: 'megabeam', status: { id: 'BURN', ch: 50 } }),
    ],
  },
  kaiser: {
    name: 'GAIA KAISER', cls: 'Super Robot', armor: 'HEAVY', size: 'L', hp: 6600, en: 180, arm: 1750, mob: 80, move: 5, fly: false,
    desc: 'Professor Ade Okonkwo spent forty years building a god of iron to fight an enemy no one believed in. The Gaia Reactor regenerates 10% EN each phase.',
    abil: { regenEN: 0.1 },
    vis: { body: 'humanoid', c1: '#1d2433', c2: '#c8102e', c3: '#ffcc00', g: '#ffdd55', bulk: 1.3, h: 1.08, head: 'horns', shoulder: 'spike', back: 'fins', weapon: 'none', chest: 'core', legs: 'heavy', cape: false },
    weapons: [
      W('Kaiser Knuckle', 'KIN', 3000, 1, 4, { acc: 10, en: 10, anim: 'punch', melee: false }),
      W('Storm Horn', 'EXPL', 2900, 1, 5, { acc: 10, en: 20, anim: 'lightning', status: { id: 'SHOCK', ch: 40 } }),
      W('Kaiser Blade', 'BLADE', 3600, 1, 2, { acc: 15, crit: 15, en: 15, anim: 'slash', big: true }),
      W('Breast Inferno', 'PLAS', 4400, 1, 4, { en: 40, will: 110, anim: 'megabeam', chestBeam: true, status: { id: 'BURN', ch: 50 } }),
      W('Final Kaiser Inferno', 'PLAS', 6500, 1, 1, { en: 80, will: 130, crit: 25, acc: 20, finisher: true, anim: 'finisher', seq: ['punch', 'slash', 'megabeam'], cut: 'Grandpa\'s dream burns in my chest! FINAL — KAISER — INFERNO!!' }),
    ],
  },
  talos: {
    name: 'TALOS', cls: 'Long-Range Recon Frame', armor: 'LIGHT', size: 'M', hp: 3800, en: 150, arm: 950, mob: 105, move: 5, fly: false,
    desc: 'A Free States sniper frame stripped of its insignia. Odessa keeps a tally of shots on the inside of the cockpit, and won\'t say what the second column means.',
    vis: { body: 'humanoid', c1: '#3a3f4b', c2: '#9aa3b2', c3: '#7cff6b', g: '#7cff6b', bulk: 0.95, h: 1.0, head: 'sensor', shoulder: 'block', back: 'none', weapon: 'lance', chest: 'plate', legs: 'normal', cape: true },
    weapons: [
      W('Beam Carbine', 'BEAM', 2300, 1, 5, { acc: 20, en: 8, anim: 'rifle' }),
      W('Smart Mines', 'EXPL', 2600, 2, 5, { ammo: 4, anim: 'missile', status: { id: 'SLOW', ch: 50 } }),
      W('Rail Lance', 'KIN', 3400, 3, 9, { acc: 30, crit: 25, en: 25, post: false, anim: 'railgun', status: { id: 'BREAK', ch: 30 } }),
      W('Phantom Shot', 'KIN', 4700, 4, 10, { acc: 45, crit: 45, en: 50, will: 120, post: false, anim: 'railgun', big: true, status: { id: 'JAM', ch: 50 } }),
    ],
  },
  trinity: {
    name: 'TRINITY ARC', cls: 'Triple-Combiner Robot', armor: 'HEAVY', size: 'L', hp: 7000, en: 170, arm: 1600, mob: 95, move: 5, fly: false,
    desc: 'Three drill-tanks that combine into one titan. Built by the Okonkwo Lab for subterranean war. Jin pilots; Tessa runs power; Dash handles "everything loud".',
    vis: { body: 'humanoid', c1: '#e8e2d0', c2: '#1f6f3a', c3: '#ff9a1f', g: '#b6ff5c', bulk: 1.25, h: 1.1, head: 'crest', shoulder: 'block', back: 'thruster', weapon: 'drill', chest: 'plate', legs: 'heavy' },
    weapons: [
      W('Arc Tomahawk', 'BLADE', 3200, 1, 3, { acc: 10, crit: 15, en: 10, anim: 'slash' }),
      W('Spiral Drill', 'KIN', 3600, 1, 1, { acc: 15, crit: 15, en: 15, melee: true, anim: 'drill', status: { id: 'BREAK', ch: 50 } }),
      W('Trinity Beam', 'BEAM', 3300, 2, 5, { en: 25, anim: 'beam' }),
      W('Trinity Storm', 'GRAV', 6100, 1, 3, { en: 80, will: 130, crit: 25, acc: 15, finisher: true, anim: 'finisher', seq: ['gravity', 'drill'], cut: 'Three hearts — one spiral! TRINITY STORM!' }),
    ],
  },
  noctis: {
    name: 'NOCTIS', cls: 'Psy-Frame', armor: 'LIGHT', size: 'M', hp: 4000, en: 190, arm: 1000, mob: 132, move: 6, fly: true,
    desc: 'A Free States weapon built to amplify Resonants. Its bits move before Yuna finishes thinking.',
    vis: { body: 'humanoid', c1: '#20172e', c2: '#6c3bd1', c3: '#e8e8ff', g: '#c7a6ff', bulk: 0.9, h: 1.02, head: 'visor', shoulder: 'fin', back: 'halo', weapon: 'rifle', chest: 'gem', legs: 'skirt' },
    weapons: [
      W('Beam Rifle', 'BEAM', 2600, 1, 6, { acc: 20, en: 10, anim: 'rifle' }),
      W('Psyblade', 'BLADE', 2900, 1, 1, { acc: 25, crit: 20, anim: 'slash' }),
      W('Resonance Bits', 'SPIR', 3500, 2, 7, { acc: 20, en: 35, will: 110, anim: 'funnel', status: { id: 'JAM', ch: 35 } }),
      W('Lunar Requiem', 'SPIR', 5900, 1, 6, { en: 75, will: 130, crit: 30, acc: 30, finisher: true, anim: 'finisher', seq: ['funnel', 'spirit'], cut: 'I hear all of you... please, rest now.' }),
    ],
  },
  carmine: {
    name: 'CARMINE HOUND', cls: 'Custom Ace Frame', armor: 'COAT', size: 'M', hp: 4600, en: 170, arm: 1080, mob: 142, move: 7, fly: true,
    desc: 'Lucien Ash\'s crimson custom. Every Free States child knows its silhouette.',
    vis: { body: 'humanoid', c1: '#a3121d', c2: '#2a0b10', c3: '#f2c14e', g: '#ff5e5e', bulk: 0.98, h: 1.02, head: 'mono', shoulder: 'spike', back: 'wings', weapon: 'lance', chest: 'vent', legs: 'digit' },
    weapons: [
      W('Scatter Gun', 'KIN', 2400, 1, 3, { acc: 15, ammo: 10, anim: 'vulcan' }),
      W('Beam Javelin', 'BEAM', 3000, 2, 6, { acc: 15, en: 15, anim: 'rifle' }),
      W('Heat Lance', 'PLAS', 3300, 1, 2, { acc: 20, crit: 20, en: 15, melee: true, anim: 'slash', status: { id: 'BURN', ch: 35 } }),
      W('Scarlet Requiem', 'BLADE', 5700, 1, 2, { en: 70, will: 125, crit: 35, acc: 25, finisher: true, anim: 'finisher', seq: ['multislash', 'plasma'], cut: 'You wanted the Crimson Hound? Here it is!' }),
    ],
  },
  seraphyne: {
    name: 'SERAPHYNE', cls: 'Vael Dragon-Knight', armor: 'VOID', size: 'L', hp: 6200, en: 200, arm: 1300, mob: 120, move: 6, fly: true,
    desc: 'Sera and her frame are one body — the Vael abandoned the distinction centuries ago. She regenerates 8% HP each phase.',
    abil: { regenHP: 0.08 },
    vis: { body: 'dragon', c1: '#f1e6ff', c2: '#5a2d91', c3: '#ffd166', g: '#e2a8ff' },
    weapons: [
      W('Void Fang', 'BLADE', 3100, 1, 1, { acc: 20, crit: 20, anim: 'slash' }),
      W('Starfire Breath', 'PLAS', 3700, 1, 5, { acc: 10, en: 25, anim: 'breath', status: { id: 'BURN', ch: 40 } }),
      W('Gravity Wing', 'GRAV', 3500, 2, 6, { acc: 10, en: 30, anim: 'gravity', status: { id: 'SLOW', ch: 40 } }),
      W('Requiem of Stars', 'GRAV', 6300, 1, 4, { en: 80, will: 130, crit: 30, acc: 20, finisher: true, anim: 'finisher', seq: ['gravity', 'spirit'], cut: 'Sing with me, little stars. Then fall.' }),
    ],
  },

  // ---------------- OUROBOR ----------------
  crawler: {
    name: 'Ourobor Crawler', cls: 'Bio-Drone', armor: 'BIO', size: 'S', hp: 3300, en: 100, arm: 700, mob: 78, move: 5, fly: false,
    vis: { body: 'beast', c1: '#3b2a3f', c2: '#7a2f4a', c3: '#c6ff4a', g: '#c6ff4a' },
    weapons: [W('Bio-Lance', 'BLADE', 2300, 1, 1, { acc: 10 }), W('Acid Spit', 'PLAS', 2100, 1, 3, { acc: 5, anim: 'plasma', status: { id: 'BURN', ch: 20 } })],
  },
  wyrmling: {
    name: 'Ourobor Wyrmling', cls: 'Bio-Flyer', armor: 'BIO', size: 'M', hp: 3700, en: 100, arm: 760, mob: 100, move: 6, fly: true,
    vis: { body: 'wyrm', c1: '#40263a', c2: '#9b3a5a', c3: '#c6ff4a', g: '#c6ff4a' },
    weapons: [W('Talon Rake', 'BLADE', 2500, 1, 1, { acc: 10, anim: 'slash' }), W('Sonic Shriek', 'SPIR', 2300, 1, 4, { acc: 10, anim: 'wave', status: { id: 'JAM', ch: 30 } })],
  },
  behemoth: {
    name: 'Ourobor Behemoth', cls: 'Bio-Siege Beast', armor: 'BIO', size: 'L', hp: 9500, en: 150, arm: 1300, mob: 60, move: 4, fly: false,
    vis: { body: 'beast', c1: '#2d1f2f', c2: '#6b2140', c3: '#ffea4a', g: '#ffea4a', big: true },
    weapons: [W('Crushing Maw', 'KIN', 3200, 1, 1, { acc: 5, anim: 'slash', melee: true }), W('Spine Volley', 'EXPL', 2900, 2, 5, { anim: 'missile' }), W('Bile Cannon', 'PLAS', 3400, 2, 6, { anim: 'beam', status: { id: 'BURN', ch: 40 } })],
  },
  hivemother: {
    name: 'Hive Mother', cls: 'Ourobor Matriarch', armor: 'BIO', size: 'XL', hp: 32000, en: 300, arm: 1500, mob: 70, move: 0, fly: false,
    abil: { regenHP: 0.06 },
    vis: { body: 'colossus', c1: '#2a1626', c2: '#8a2a55', c3: '#ffef7a', g: '#ffef7a' },
    weapons: [W('Tendril Storm', 'BLADE', 3500, 1, 3, { acc: 10, anim: 'multislash' }), W('Spawn Burst', 'EXPL', 3100, 2, 6, { anim: 'missile' }), W('Genesis Beam', 'SPIR', 4300, 2, 7, { anim: 'megabeam', status: { id: 'JAM', ch: 40 } })],
  },
  prime: {
    name: 'Ourobor Prime', cls: 'Heart-Warden', armor: 'BIO', size: 'XL', hp: 42000, en: 300, arm: 1650, mob: 85, move: 3, fly: false,
    abil: { regenHP: 0.05 },
    vis: { body: 'colossus', c1: '#1e1a2e', c2: '#3aa38a', c3: '#e8fff4', g: '#9dffe0', crown: true },
    weapons: [W('World Root', 'KIN', 3800, 1, 3, { acc: 10, anim: 'multislash' }), W('Aurora Echo', 'SPIR', 4400, 2, 7, { anim: 'megabeam' }), W('Seed Storm', 'EXPL', 3400, 2, 6, { anim: 'missile', status: { id: 'SLOW', ch: 40 } })],
  },

  // ---------------- CONCORD ----------------
  lancer: {
    name: 'Lancer GM-7', cls: 'Concord Mass-Production', armor: 'LIGHT', size: 'M', hp: 3000, en: 120, arm: 900, mob: 90, move: 5, fly: false,
    vis: { body: 'humanoid', c1: '#8592a3', c2: '#2c3a4f', c3: '#ffd23f', g: '#ff5c5c', bulk: 1, h: 0.98, head: 'mono', shoulder: 'block', back: 'thruster', weapon: 'rifle', chest: 'plate', legs: 'normal' },
    weapons: [W('Assault Rifle', 'KIN', 2200, 1, 5, { acc: 10, anim: 'rifle' }), W('Beam Saber', 'BLADE', 2400, 1, 1, { acc: 10, anim: 'slash' }), W('Grenade', 'EXPL', 2400, 2, 4, { anim: 'missile' })],
  },
  warden: {
    name: 'Warden HX', cls: 'Concord Heavy', armor: 'HEAVY', size: 'L', hp: 4900, en: 120, arm: 1300, mob: 66, move: 4, fly: false,
    vis: { body: 'humanoid', c1: '#6d7684', c2: '#262e3b', c3: '#ffd23f', g: '#ff5c5c', bulk: 1.35, h: 0.95, head: 'dome', shoulder: 'pod', back: 'cannons', weapon: 'cannon', chest: 'vent', legs: 'heavy' },
    weapons: [W('Shoulder Cannon', 'KIN', 2800, 2, 6, { anim: 'cannon' }), W('Missile Pod', 'EXPL', 2800, 2, 6, { anim: 'missile' }), W('Shock Maul', 'BLADE', 2700, 1, 1, { anim: 'slash', status: { id: 'SHOCK', ch: 30 } })],
  },
  cruiser: {
    name: 'Concord Cruiser', cls: 'Warship', armor: 'HULL', size: 'XL', hp: 13000, en: 200, arm: 1250, mob: 55, move: 4, fly: true, ship: true,
    vis: { body: 'ship', c1: '#7d8796', c2: '#222a36', c3: '#ffd23f', g: '#ff5c5c' },
    weapons: [W('Flak Guns', 'KIN', 2000, 1, 3, { anim: 'vulcan' }), W('Torpedo Salvo', 'EXPL', 3000, 2, 6, { anim: 'missile' }), W('Particle Cannon', 'BEAM', 3400, 3, 8, { anim: 'megabeam' })],
  },
  executor: {
    name: 'EXECUTOR', cls: 'Concord Commander Custom', armor: 'COAT', size: 'M', hp: 9500, en: 180, arm: 1200, mob: 100, move: 5, fly: true,
    vis: { body: 'humanoid', c1: '#2b3445', c2: '#d5d9e0', c3: '#ffcc00', g: '#ff3b3b', bulk: 1.05, h: 1.02, head: 'crest', shoulder: 'spike', back: 'thruster', weapon: 'rifle', chest: 'vent', legs: 'normal', cape: true },
    weapons: [W('Beam Rifle', 'BEAM', 2700, 1, 6, { acc: 15, anim: 'rifle' }), W('Executor Sword', 'BLADE', 3100, 1, 1, { acc: 15, crit: 15, anim: 'slash' }), W('Judgement Lance', 'BEAM', 3600, 2, 6, { anim: 'beam', status: { id: 'JAM', ch: 25 } })],
  },
  sovereign: {
    name: 'SOVEREIGN', cls: 'Concord Supreme Command Frame', armor: 'HEAVY', size: 'XL', hp: 40000, en: 300, arm: 1700, mob: 85, move: 4, fly: true,
    abil: { barrier: { name: 'Aegis Field', val: 1200, en: 10, bypass: ['GRAV'] } },
    vis: { body: 'humanoid', c1: '#e8e3d3', c2: '#1b2233', c3: '#d4af37', g: '#ff3355', bulk: 1.4, h: 1.15, head: 'crown', shoulder: 'spike', back: 'cannons', weapon: 'cannon', chest: 'gem', legs: 'skirt', cape: true },
    weapons: [W('Sovereign Rifles', 'BEAM', 3300, 1, 6, { acc: 15, anim: 'rifle' }), W('Judgement Missiles', 'EXPL', 3600, 2, 7, { anim: 'missile' }), W('Lethe Ray', 'GRAV', 4600, 2, 8, { anim: 'megabeam', status: { id: 'BREAK', ch: 40 } }), W('Iron Sceptre', 'BLADE', 3900, 1, 2, { anim: 'slash', crit: 20 })],
  },

  // ---------------- ORBITAL FREE STATES ----------------
  zephyr: {
    name: 'Zephyr FS', cls: 'Free States Space Frame', armor: 'COAT', size: 'M', hp: 3200, en: 130, arm: 920, mob: 102, move: 6, fly: true,
    vis: { body: 'humanoid', c1: '#3f6b5a', c2: '#1a2a26', c3: '#ff7a3a', g: '#ff9a3a', bulk: 0.95, h: 1, head: 'mono', shoulder: 'round', back: 'thruster', weapon: 'axe', chest: 'vent', legs: 'digit' },
    weapons: [W('Machine Gun', 'KIN', 2200, 1, 4, { acc: 10, anim: 'vulcan' }), W('Heat Axe', 'PLAS', 2600, 1, 1, { acc: 10, melee: true, anim: 'slash', status: { id: 'BURN', ch: 20 } }), W('Bazooka', 'EXPL', 2700, 2, 5, { anim: 'cannon' })],
  },
  tyrant: {
    name: 'TYRANT', cls: 'Free States Assault Fortress', armor: 'HEAVY', size: 'L', hp: 17000, en: 220, arm: 1550, mob: 75, move: 4, fly: true,
    vis: { body: 'humanoid', c1: '#3a4a3e', c2: '#141c18', c3: '#ff5a1f', g: '#ff7a2e', bulk: 1.45, h: 1.05, head: 'horns', shoulder: 'pod', back: 'cannons', weapon: 'gatling', chest: 'vent', legs: 'heavy' },
    weapons: [W('Gatling Array', 'KIN', 2900, 1, 4, { anim: 'vulcan' }), W('Hellfire Pods', 'EXPL', 3400, 2, 7, { anim: 'missile' }), W('Colony Breaker', 'PLAS', 4200, 2, 6, { anim: 'megabeam', status: { id: 'BURN', ch: 40 } })],
  },
  carmine_e: null, // assigned below (enemy Lucien uses carmine)

  // ---------------- VAEL ----------------
  shard: {
    name: 'Vael Shard', cls: 'Void Drone', armor: 'VOID', size: 'S', hp: 2700, en: 140, arm: 800, mob: 110, move: 6, fly: true,
    vis: { body: 'shard', c1: '#e9dcff', c2: '#6b45b8', c3: '#ffffff', g: '#d48bff' },
    weapons: [W('Prism Needle', 'BEAM', 2400, 1, 5, { acc: 15, anim: 'rifle' }), W('Null Pulse', 'GRAV', 2300, 1, 3, { anim: 'gravity', status: { id: 'SHOCK', ch: 30 } })],
  },
  knight: {
    name: 'Vael Knight', cls: 'Void Paladin', armor: 'VOID', size: 'M', hp: 5400, en: 180, arm: 1150, mob: 118, move: 6, fly: true,
    vis: { body: 'humanoid', c1: '#efe6ff', c2: '#4a2a80', c3: '#ffd166', g: '#d48bff', bulk: 0.95, h: 1.08, head: 'crown', shoulder: 'fin', back: 'halo', weapon: 'sword', chest: 'gem', legs: 'skirt' },
    weapons: [W('Lumen Blade', 'BLADE', 3100, 1, 1, { acc: 15, crit: 15, anim: 'slash' }), W('Star Lance', 'BEAM', 3000, 1, 5, { acc: 10, anim: 'beam' }), W('Gravity Sigil', 'GRAV', 3200, 2, 5, { anim: 'gravity', status: { id: 'SLOW', ch: 30 } })],
  },
  herald: {
    name: 'IXION, THE HERALD', cls: 'Vael Archon Frame', armor: 'VOID', size: 'L', hp: 34000, en: 300, arm: 1500, mob: 120, move: 5, fly: true,
    abil: { barrier: { name: 'Prism Field', val: 1500, en: 10, bypass: ['SPIR'] } },
    vis: { body: 'humanoid', c1: '#ffffff', c2: '#8a5cff', c3: '#ffd166', g: '#e0b3ff', bulk: 1.1, h: 1.15, head: 'crown', shoulder: 'fin', back: 'feather', weapon: 'lance', chest: 'gem', legs: 'skirt', cape: true },
    weapons: [W('Herald Lance', 'BLADE', 3600, 1, 2, { acc: 20, crit: 20, anim: 'multislash' }), W('Choir of Light', 'BEAM', 3700, 2, 7, { anim: 'funnel' }), W('Event Horizon', 'GRAV', 4600, 2, 6, { anim: 'gravity', status: { id: 'BREAK', ch: 40 } })],
  },
  aurelion: {
    name: 'AURELION', cls: 'Vael Emperor-Ark', armor: 'VOID', size: 'XL', hp: 58000, en: 400, arm: 1800, mob: 110, move: 4, fly: true,
    abil: { barrier: { name: 'Sovereign Prism', val: 1800, en: 10, bypass: ['SPIR'] }, regenHP: 0.04 },
    vis: { body: 'humanoid', c1: '#fff6d8', c2: '#2a1650', c3: '#ffcf4a', g: '#ffe08a', bulk: 1.3, h: 1.2, head: 'crown', shoulder: 'fin', back: 'feather', weapon: 'sword', chest: 'gem', legs: 'skirt', cape: true },
    weapons: [W('Ark Blade', 'BLADE', 4000, 1, 2, { acc: 20, crit: 25, anim: 'multislash' }), W('Stellar Choir', 'SPIR', 4200, 2, 7, { anim: 'funnel' }), W('Exodus Ray', 'GRAV', 5200, 2, 8, { anim: 'megabeam', status: { id: 'BREAK', ch: 40 } }), W('Sun Requiem', 'PLAS', 4800, 1, 5, { anim: 'plasma', status: { id: 'BURN', ch: 50 } })],
  },
  hollow: {
    name: 'THE HOLLOW', cls: 'Avatar of the Silence', armor: 'VOID', size: 'XL', hp: 80000, en: 999, arm: 1900, mob: 100, move: 3, fly: true,
    abil: { barrier: { name: 'Unwriting', val: 2200, en: 0, bypass: ['SPIR'] }, regenHP: 0.03 },
    vis: { body: 'hollow', c1: '#05040a', c2: '#1a1030', c3: '#ffffff', g: '#ffffff' },
    weapons: [W('Erasure', 'GRAV', 4600, 1, 3, { acc: 20, anim: 'gravity', status: { id: 'BREAK', ch: 50 } }), W('Stilled Chorus', 'SPIR', 4800, 2, 8, { anim: 'megabeam', status: { id: 'JAM', ch: 50 } }), W('Entropy Rain', 'EXPL', 4200, 2, 7, { anim: 'missile', status: { id: 'SHOCK', ch: 40 } })],
  },
};
MECHS.carmine_e = Object.assign({}, MECHS.carmine, { hp: 12000, name: 'CARMINE HOUND' });
delete MECHS.carmine_e.abil;
// Super-path protagonist variants (chosen at New Game)
MECHS.alteon_s = {
  name: 'ALTEON GIGAS', cls: 'Aurora-Core Prototype (Heavy)', armor: 'HEAVY', size: 'L', hp: 5600, en: 170, arm: 1500, mob: 92, move: 5, fly: false,
  desc: 'The heavy-armour configuration of the Alteon prototype: thicker plate, bigger fists, the same strange singing core.',
  vis: { body: 'humanoid', c1: '#e9eef6', c2: '#2856c9', c3: '#e0373f', g: '#62f3ff', bulk: 1.28, h: 1.06, head: 'horns', shoulder: 'spike', back: 'fins', weapon: 'none', chest: 'core', legs: 'heavy' },
  weapons: [
    W('Gigas Knuckle', 'KIN', 2900, 1, 3, { acc: 10, en: 10, anim: 'punch' }),
    W('Arc Cleaver', 'BLADE', 3100, 1, 1, { acc: 15, crit: 15, anim: 'slash', big: true }),
    W('Shoulder Missiles', 'EXPL', 2800, 2, 5, { ammo: 6, anim: 'missile' }),
    W('Prism Breaker', 'BEAM', 3900, 1, 5, { en: 40, will: 110, anim: 'megabeam', chestBeam: true, status: { id: 'BREAK', ch: 30 } }),
    W('Aurora Smash', 'SPIR', 5400, 1, 1, { en: 70, will: 130, crit: 25, acc: 10, finisher: true, anim: 'finisher', seq: ['punch', 'slash', 'spirit'], cut: 'Aurora Core — give me everything!' }),
  ],
};
MECHS.alteonz_s = {
  name: 'ALTEON ZERO GIGAS', cls: 'Awakened Aurora Frame (Heavy)', armor: 'HEAVY', size: 'L', hp: 7800, en: 230, arm: 1850, mob: 106, move: 6, fly: true,
  desc: 'The awakened core rebuilt the Gigas frame into a titan of light and iron.',
  abil: { barrier: { name: 'Aurora Field', val: 900, en: 10, bypass: [] } },
  vis: { body: 'humanoid', c1: '#f6f8ff', c2: '#3b2bd0', c3: '#ffd166', g: '#9dfcff', bulk: 1.32, h: 1.1, head: 'crown', shoulder: 'spike', back: 'feather', weapon: 'none', chest: 'gem', legs: 'heavy' },
  weapons: [
    W('Zero Knuckle', 'KIN', 3500, 1, 4, { acc: 15, en: 10, anim: 'punch' }),
    W('Aurora Cleaver', 'BLADE', 3900, 1, 2, { acc: 20, crit: 20, anim: 'slash', big: true }),
    W('Aurora Feathers', 'SPIR', 3900, 2, 6, { acc: 15, en: 30, anim: 'funnel', status: { id: 'JAM', ch: 30 } }),
    W('Prism Breaker Zero', 'BEAM', 4700, 1, 6, { en: 40, will: 110, anim: 'megabeam', chestBeam: true, status: { id: 'BREAK', ch: 40 } }),
    W('Requiem Zero', 'SPIR', 7600, 1, 2, { en: 80, will: 130, crit: 30, acc: 15, finisher: true, anim: 'finisher', seq: ['punch', 'multislash', 'spirit'], cut: 'For everyone who sang before us — REQUIEM ZERO!' }),
  ],
};
