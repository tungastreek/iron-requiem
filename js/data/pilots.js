// ===== Pilots, portraits, skill trees =====
'use strict';
// Portrait spec: skin, hair, hs(hairstyle), eye, suit, suit2, jaw, acc, age, bg
const PORTRAITS = {
  rei:     { skin: '#f1d2b6', hair: '#20242e', hs: 'spiky',  eye: '#3fd6ff', suit: '#e9eef6', suit2: '#2856c9', jaw: 'sharp',  acc: 'none',     age: 'young', bg: '#1b3a7a' },
  mira:    { skin: '#f6dcc4', hair: '#f2a03d', hs: 'pony',   eye: '#2fd1b5', suit: '#f3f5fa', suit2: '#14a3a3', jaw: 'soft',   acc: 'none',     age: 'young', bg: '#0f5b5b' },
  gunnar:  { skin: '#d8a988', hair: '#8f8a80', hs: 'short',  eye: '#8fb0c8', suit: '#5b6b4a', suit2: '#2d3328', jaw: 'square', acc: 'beard',    age: 'old',   bg: '#3b4a2a' },
  ilse:    { skin: '#e8c4a8', hair: '#c9ccd6', hs: 'bob',    eye: '#9a7cff', suit: '#2a3346', suit2: '#d5d9e0', jaw: 'sharp',  acc: 'scar',     age: 'adult', bg: '#2a2f45' },
  brann:   { skin: '#7a4a2f', hair: '#14110f', hs: 'wild',   eye: '#ffb02e', suit: '#1d2433', suit2: '#c8102e', jaw: 'square', acc: 'none',     age: 'young', bg: '#6a1018' },
  odessa:  { skin: '#c99b7a', hair: '#e8e8ea', hs: 'undercut', eye: '#7cff6b', suit: '#3a3f4b', suit2: '#9aa3b2', jaw: 'sharp', acc: 'eyepatch', age: 'adult', bg: '#1f2b23' },
  jin:     { skin: '#efd0b0', hair: '#0f1a14', hs: 'slick',  eye: '#9ff07a', suit: '#e8e2d0', suit2: '#1f6f3a', jaw: 'sharp',  acc: 'none',     age: 'young', bg: '#1f4a2a' },
  tessa:   { skin: '#f3d6c2', hair: '#c94f2c', hs: 'braid',  eye: '#5ab0ff', suit: '#e8e2d0', suit2: '#ff9a1f', jaw: 'soft',   acc: 'glasses',  age: 'young', bg: '#5a3a14' },
  dash:    { skin: '#a8714f', hair: '#ffd23f', hs: 'spiky',  eye: '#ff8a3d', suit: '#e8e2d0', suit2: '#d03a2a', jaw: 'soft',   acc: 'earring',  age: 'young', bg: '#5a1f14' },
  yuna:    { skin: '#f7e1d3', hair: '#cfd5ff', hs: 'long',   eye: '#c7a6ff', suit: '#20172e', suit2: '#6c3bd1', jaw: 'soft',   acc: 'circlet',  age: 'young', bg: '#2a1650' },
  lucien:  { skin: '#f0d6c0', hair: '#e8d7a8', hs: 'long',   eye: '#ff4d4d', suit: '#a3121d', suit2: '#2a0b10', jaw: 'sharp',  acc: 'none',     age: 'adult', bg: '#4a0b12' },
  sera:    { skin: '#e9e2ff', hair: '#ffffff', hs: 'long',   eye: '#ffd166', suit: '#5a2d91', suit2: '#f1e6ff', jaw: 'soft',   acc: 'horns',    age: 'adult', bg: '#3a1f66' },
  solenne: { skin: '#e2b896', hair: '#5a5550', hs: 'short',  eye: '#2fd1b5', suit: '#3c4a5e', suit2: '#ffd23f', jaw: 'square', acc: 'beard',    age: 'old',   bg: '#24344a' },
  okonkwo: { skin: '#6e4129', hair: '#e8e8e8', hs: 'bald',   eye: '#ffcf70', suit: '#f0f0f0', suit2: '#c8102e', jaw: 'square', acc: 'glasses',  age: 'old',   bg: '#5a3010' },
  pell:    { skin: '#d9b08f', hair: '#3a2a6a', hs: 'bob',    eye: '#62f3ff', suit: '#2a3346', suit2: '#62f3ff', jaw: 'soft',   acc: 'visor',    age: 'young', bg: '#13314a' },
  kroll:   { skin: '#e3c2a6', hair: '#d8d8d8', hs: 'slick',  eye: '#8899aa', suit: '#e8e3d3', suit2: '#d4af37', jaw: 'square', acc: 'scar',     age: 'old',   bg: '#3a3220' },
  draike:  { skin: '#d6ad8f', hair: '#2a2420', hs: 'undercut', eye: '#ff3b3b', suit: '#2b3445', suit2: '#ffcc00', jaw: 'square', acc: 'none',   age: 'adult', bg: '#3a1a1a' },
  vasse:   { skin: '#c49272', hair: '#3a3a3a', hs: 'bald',   eye: '#ff7a2e', suit: '#3a4a3e', suit2: '#ff5a1f', jaw: 'square', acc: 'beard',    age: 'old',   bg: '#3a2410' },
  ixion:   { skin: '#f4efff', hair: '#b9a3ff', hs: 'long',   eye: '#ffffff', suit: '#ffffff', suit2: '#8a5cff', jaw: 'sharp',  acc: 'mask',     age: 'adult', bg: '#2e1a5a' },
  aurelion:{ skin: '#fff3dc', hair: '#ffd98a', hs: 'long',   eye: '#ffcf4a', suit: '#2a1650', suit2: '#ffcf4a', jaw: 'sharp',  acc: 'circlet',  age: 'adult', bg: '#4a3410' },
  soren:   { skin: '#e8c8ae', hair: '#5a6070', hs: 'short',  eye: '#3fd6ff', suit: '#f0f0f0', suit2: '#2856c9', jaw: 'sharp',  acc: 'glasses',  age: 'old',   bg: '#1b2a4a' },
  hollow:  { skin: '#05040a', hair: '#05040a', hs: 'bald',   eye: '#ffffff', suit: '#05040a', suit2: '#1a1030', jaw: 'soft',   acc: 'void',     age: 'adult', bg: '#000000' },
  grunt_c: { skin: '#d9b08f', hair: '#333',    hs: 'short',  eye: '#888',    suit: '#8592a3', suit2: '#2c3a4f', jaw: 'square', acc: 'visor',    age: 'adult', bg: '#2c3a4f' },
  grunt_f: { skin: '#c49272', hair: '#553',    hs: 'short',  eye: '#888',    suit: '#3f6b5a', suit2: '#ff7a3a', jaw: 'square', acc: 'visor',    age: 'adult', bg: '#1a2a26' },
  beast:   { skin: '#3b2a3f', hair: '#7a2f4a', hs: 'bald',   eye: '#c6ff4a', suit: '#3b2a3f', suit2: '#7a2f4a', jaw: 'soft',   acc: 'void',     age: 'adult', bg: '#2a0f1a' },
  vael:    { skin: '#efe6ff', hair: '#b9a3ff', hs: 'short',  eye: '#d48bff', suit: '#efe6ff', suit2: '#4a2a80', jaw: 'sharp',  acc: 'mask',     age: 'adult', bg: '#2a1650' },
};
const NAMES = {
  rei: 'Rei Kasuga', mira: 'Mira Solenne', gunnar: 'Gunnar Holt', ilse: 'Capt. Ilse Varga', brann: 'Brann Okonkwo', odessa: 'Odessa Rhee',
  jin: 'Jin Mao', tessa: 'Tessa Vaughn', dash: 'Dash Moreau', yuna: 'Yuna Ishara', lucien: 'Lucien Ash', sera: 'Seraphyne',
  solenne: 'Cmdr. Hal Solenne', okonkwo: 'Prof. Ade Okonkwo', pell: 'Pell (Operator)', kroll: 'Adm. Viktor Kroll', draike: 'Col. Rhys Draike',
  vasse: 'Gen. Ostrom Vasse', ixion: 'Ixion', aurelion: 'Aurelion', soren: 'Dr. Soren Kasuga', hollow: '???', grunt_c: 'Concord Pilot', grunt_f: 'Free States Pilot',
  beast: 'Ourobor', vael: 'Vael Knight', narr: '',
};

// base stats at level 1 and growth per level
const PILOTS = {
  rei:    { mech: 'alteon',  base: { MEL: 150, RNG: 152, DEF: 140, HIT: 160, EVA: 158, SKL: 150, SP: 60 }, gr: [2.2, 2.2, 1.8, 2.2, 2.2, 2.0, 2.2], mastery: 'BEAM',
            spirits: [['focus', 1], ['strike', 1], ['alert', 6], ['valor', 12], ['zeal', 22]], cap: { id: 'cap_rei', name: 'Aurora Resonance', desc: 'Finisher Will requirement −10. Spirit-type damage +20%.' },
            branches: ['Vanguard', 'Steadfast', 'Resonance'],
            lines: { atk: ['Here goes!', 'I won\'t let anyone else die!', 'Alteon, respond!', 'Target locked.'], hit: ['Ngh...! Still standing!', 'Damn it—!'], dodge: ['Too slow.', 'I can see it...!'], kill: ['Target down.', 'Rest... wherever you go.'] } },
  mira:   { mech: 'sylph',   base: { MEL: 142, RNG: 146, DEF: 124, HIT: 166, EVA: 178, SKL: 156, SP: 55 }, gr: [2.0, 2.1, 1.6, 2.3, 2.5, 2.1, 2.0], mastery: 'BLADE',
            spirits: [['accel', 1], ['focus', 1], ['alert', 4], ['insight', 9], ['strike', 14], ['zeal', 26]], cap: { id: 'cap_mira', name: 'Sky Dancer', desc: 'Evasion +20 and Movement +1.' },
            branches: ['Tempest', 'Featherfall', 'Afterimage'],
            lines: { atk: ['Eat this!', 'Dad, watch me!', 'Sylph, full throttle!'], hit: ['Hey! That hurt!', 'Gh—the frame\'s groaning!'], dodge: ['Miss me? Too bad.', 'Hah! Not even close!'], kill: ['That\'s for Kestrel!', 'Scratch one!'] } },
  gunnar: { mech: 'bastion', base: { MEL: 135, RNG: 156, DEF: 162, HIT: 150, EVA: 118, SKL: 140, SP: 50 }, gr: [1.6, 2.2, 2.4, 1.9, 1.4, 1.8, 1.8], mastery: 'EXPL',
            spirits: [['ironwall', 1], ['focus', 1], ['guts', 5], ['ardor', 11], ['valor', 20]], cap: { id: 'cap_gunnar', name: 'Saturation Fire', desc: 'Kinetic and Explosive damage +25%; ammo +50%.' },
            branches: ['Barrage', 'Bulwark', 'Old Soldier'],
            lines: { atk: ['Fire for effect!', 'Heads down, kids!', 'Bastion\'s still got teeth!'], hit: ['Heh, barely a scratch.', 'My back\'s going to feel that tomorrow.'], dodge: ['Even an old bear can duck.'], kill: ['Splash one.', 'Stay down.'] } },
  ilse:   { mech: 'halcyon', base: { MEL: 120, RNG: 152, DEF: 150, HIT: 152, EVA: 110, SKL: 152, SP: 75 }, gr: [1.2, 2.0, 2.0, 2.0, 1.2, 2.0, 2.6], mastery: 'BEAM',
            spirits: [['focus', 1], ['mend', 1], ['rally', 6], ['fortune', 10], ['zeal', 18]], cap: { id: 'cap_ilse', name: 'Fleet Command', desc: 'Allies within 2 tiles gain +10 hit and evasion.' },
            branches: ['Broadside', 'Fortress', 'Command'],
            lines: { atk: ['Main batteries—fire!', 'Bring us about. Fire!', 'Halcyon, open fire.'], hit: ['Damage report!', 'Seal the bulkheads!'], dodge: ['Evasive manoeuvres worked. For once.'], kill: ['Target eliminated. Next.'] } },
  brann:  { mech: 'kaiser',  base: { MEL: 168, RNG: 136, DEF: 156, HIT: 142, EVA: 120, SKL: 142, SP: 55 }, gr: [2.6, 1.6, 2.2, 1.8, 1.4, 1.8, 2.0], mastery: 'PLAS',
            spirits: [['guts', 1], ['ardor', 1], ['valor', 7], ['ironwall', 12], ['strike', 18]], cap: { id: 'cap_brann', name: 'Burning Soul', desc: 'Will +2 extra when hit. Damage +15% at Will 140+.' },
            branches: ['Inferno', 'Iron Giant', 'Hot Blood'],
            lines: { atk: ['KAISER KNUCKLE—wait, wrong one—DOESN\'T MATTER!', 'Feel the heat!!', 'Gaia Kaiser—GO!!', 'For Grandpa!!'], hit: ['Is that all you\'ve got?!', 'Kaiser doesn\'t fall that easy!'], dodge: ['Whoa—hah! Lucky!'], kill: ['YEAAAH!!', 'That\'s the power of Kaiser!'] } },
  odessa: { mech: 'talos',   base: { MEL: 128, RNG: 168, DEF: 124, HIT: 178, EVA: 146, SKL: 168, SP: 50 }, gr: [1.4, 2.6, 1.6, 2.6, 1.9, 2.4, 1.8], mastery: 'KIN',
            spirits: [['strike', 1], ['focus', 1], ['fortune', 6], ['valor', 14], ['insight', 20]], cap: { id: 'cap_odessa', name: 'Dead Eye', desc: 'Critical +30. Ranged weapons +1 max range.' },
            branches: ['Marksman', 'Ghost', 'Patience'],
            lines: { atk: ['Breathing in... out.', 'Wind\'s right.', 'One shot.'], hit: ['Tch. Exposed.', 'Repositioning.'], dodge: ['Predictable.'], kill: ['Confirmed.', 'Another line in the column.'] } },
  jin:    { mech: 'trinity', base: { MEL: 158, RNG: 148, DEF: 152, HIT: 150, EVA: 134, SKL: 148, SP: 60 }, gr: [2.2, 2.0, 2.2, 2.0, 1.7, 2.0, 2.0], mastery: 'KIN',
            spirits: [['focus', 1], ['ironwall', 1], ['valor', 9], ['ardor', 13], ['zeal', 22]], cap: { id: 'cap_jin', name: 'Triple Heart', desc: 'Max HP +2000 and regenerate 10% HP each phase.' },
            branches: ['Spiral', 'Bedrock', 'Unison'],
            lines: { atk: ['Tessa, power to the arms. Dash—now!', 'Trinity, advance.', 'We break through!'], hit: ['Hull integrity holding.', 'Tessa, reroute!'], dodge: ['Good call, Dash.'], kill: ['Target crushed.', 'Clear.'] } },
  yuna:   { mech: 'noctis',  base: { MEL: 128, RNG: 162, DEF: 120, HIT: 174, EVA: 180, SKL: 164, SP: 75 }, gr: [1.4, 2.3, 1.5, 2.4, 2.6, 2.2, 2.6], mastery: 'SPIR',
            spirits: [['alert', 1], ['focus', 1], ['mend', 5], ['insight', 10], ['resolve', 24]], cap: { id: 'cap_yuna', name: 'Choir', desc: 'Spirit damage +25%. Your attacks ignore barriers.' },
            branches: ['Lunar', 'Veil', 'Choir'],
            lines: { atk: ['Go, my bits.', 'I\'m sorry... I have to.', 'I can hear where you\'ll be.'], hit: ['Ah—!', 'It hurts... but I\'m okay.'], dodge: ['I heard it coming.'], kill: ['...Your song stopped.', 'Rest.'] } },
  lucien: { mech: 'carmine', base: { MEL: 166, RNG: 162, DEF: 136, HIT: 172, EVA: 174, SKL: 170, SP: 60 }, gr: [2.4, 2.3, 1.7, 2.4, 2.4, 2.3, 2.0], mastery: 'BLADE',
            spirits: [['focus', 1], ['strike', 1], ['alert', 1], ['valor', 1], ['zeal', 1]], cap: { id: 'cap_lucien', name: 'Crimson Fury', desc: 'Each kill: Will +10 and damage +10% (stacks 3x, this mission).' },
            branches: ['Crimson', 'Hound', 'Exile'],
            lines: { atk: ['Show me what you\'re worth.', 'For the colonies.', 'Too slow, Earthling.'], hit: ['Heh. Not bad.', 'You actually touched me.'], dodge: ['Is that the best you have?'], kill: ['Forgive me.', 'Next.'] } },
  sera:   { mech: 'seraphyne', base: { MEL: 162, RNG: 162, DEF: 152, HIT: 162, EVA: 152, SKL: 162, SP: 70 }, gr: [2.2, 2.2, 2.0, 2.2, 2.0, 2.2, 2.4], mastery: 'GRAV',
            spirits: [['focus', 1], ['alert', 1], ['mend', 1], ['valor', 1], ['resolve', 30]], cap: { id: 'cap_sera', name: 'Starborn', desc: 'Damage taken −15%; regenerate 8% EN each phase.' },
            branches: ['Stellar', 'Carapace', 'Song'],
            lines: { atk: ['Little brother of the stars, fall.', 'This is what my people made of me.', 'I will not run again.'], hit: ['I have survived worse than you.', 'Mm. Pain. A human thing.'], dodge: ['Gravity bends for me.'], kill: ['Be unwritten gently.', 'Sleep.'] } },
};

// Enemy pilots. lines used in battle scene
const EPILOTS = {
  grunt_c: { lines: { atk: ['Target the prototype!', 'Fire, fire!', 'For the Concord!'], hit: ['Gah! Taking damage!'], dodge: ['Missed me!'], kill: ['Got one!'] } },
  grunt_f: { lines: { atk: ['For a free sky!', 'Earth dogs!', 'Down with the Concord!'], hit: ['Damn it!'], dodge: ['Ha!'], kill: ['Splash!'] } },
  beast:   { lines: { atk: ['KRRRRAAAAH!', '—ssssss—', '(a sound like a cathedral bell cracking)'], hit: ['SKREEEE!'], dodge: ['—!'], kill: ['(the hive pulses)'] } },
  vael:    { lines: { atk: ['Submit to unwriting.', 'You are noise.', 'The Choir commands it.'], hit: ['Impossible—matter resisting?'], dodge: ['Predictable entropy.'], kill: ['Silence for you.'] } },
  draike:  { lines: { atk: ['Surrender the prototype!', 'Orders are orders, boy.', 'Executor, engage!'], hit: ['Insolent children!'], dodge: ['Amateurs.'], kill: ['Traitor neutralised.'] } },
  lucien:  { lines: PILOTS.lucien.lines },
  vasse:   { lines: { atk: ['Burn, Earth!', 'A century of chains ends today!', 'Tyrant, crush them!'], hit: ['Gnnh! You\'ll pay!'], dodge: ['Ha! Slow!'], kill: ['One less jailer!'] } },
  kroll:   { lines: { atk: ['Order is mercy.', 'Kneel before necessity.', 'Sovereign — judgement.'], hit: ['You don\'t understand what you\'re destroying!', 'Insolence!'], dodge: ['Predictable.'], kill: ['Regrettable. Necessary.'] } },
  ixion:   { lines: { atk: ['Your song is too loud.', 'The Herald speaks once.', 'Kneel, children of the cradle.'], hit: ['How... how is your noise wounding me?'], dodge: ['Matter is so slow.'], kill: ['Unwritten.'] } },
  aurelion:{ lines: { atk: ['I have watched ten thousand worlds go quiet.', 'Forgive me, cradle.', 'For the survival of the Vael.'], hit: ['This resonance... it is like the old songs...', 'You burn so brightly.'], dodge: ['Not yet.'], kill: ['I am sorry.'] } },
  hollow:  { lines: { atk: ['.', '...', '(the absence of sound grows louder)'], hit: ['(something like surprise)'], dodge: ['.'], kill: ['.'] } },
  mother:  { lines: { atk: ['(GIVE—IT—BACK)', 'SKREEEEEEEEEE!'], hit: ['(pain, pain, pain)'], dodge: ['—'], kill: ['(one less thief)'] } },
};

// ---------- Skill trees ----------
const TYPE_NAMES = { KIN: 'Kinetic', BEAM: 'Beam', PLAS: 'Plasma', BLADE: 'Blade', EXPL: 'Explosive', GRAV: 'Graviton', SPIR: 'Spirit' };
const BRANCH_SPIRIT = {
  rei: ['resolve', 'ironwall'], mira: ['zeal', 'cleanse'], gunnar: ['strike', 'mend'], ilse: ['resolve', 'ironwall'], brann: ['zeal', 'cleanse'],
  odessa: ['alert', 'ironwall'], jin: ['resolve', 'guts'], yuna: ['zeal', 'ironwall'], lucien: ['resolve', 'cleanse'], sera: ['zeal', 'ironwall'],
};
function buildTree(pid) {
  const p = PILOTS[pid]; const bs = BRANCH_SPIRIT[pid] || ['resolve', 'ironwall'];
  return [
    { name: p.branches[0], color: '#ff6b5c', icon: '⚔', nodes: [
      { id: 'a1', name: 'Combat Drills', cost: 1, fx: { stat: { MEL: 8, RNG: 8 } }, desc: 'MEL +8, RNG +8.' },
      { id: 'a2', name: TYPE_NAMES[p.mastery] + ' Mastery', cost: 2, fx: { mastery: p.mastery }, desc: TYPE_NAMES[p.mastery] + ' weapons deal +15% damage.' },
      { id: 'a3', name: 'Exploit Weakness', cost: 3, fx: { skill: 'exploit' }, desc: 'Effective / Devastating hits deal an extra +25%.' },
      { id: 'a4', name: 'Prevail', cost: 4, fx: { skill: 'prevail' }, desc: 'Up to +30% damage and +20 hit as your HP falls.' },
      { id: 'a5', name: p.cap.name, cost: 6, fx: { skill: p.cap.id }, desc: p.cap.desc, cap: true },
    ] },
    { name: p.branches[1], color: '#5cb8ff', icon: '⛨', nodes: [
      { id: 'b1', name: 'Reinforced Cockpit', cost: 1, fx: { stat: { DEF: 10, EVA: 4 } }, desc: 'DEF +10, EVA +4.' },
      { id: 'b2', name: ['gunnar','ilse','jin','brann'].includes(pid)?'Support Defend':'Steel Nerves', cost: 2, fx: { skill: ['gunnar','ilse','jin','brann'].includes(pid)?'guard':'nerves' }, desc: ['gunnar','ilse','jin','brann'].includes(pid)?'Once per enemy phase, take an adjacent ally’s incoming attack in Defend mode.':'Start missions with Will +5. Damage taken −10%.' },
      { id: 'b3', name: 'Iron Will', cost: 3, fx: { skill: 'ironwill' }, desc: 'Gain +2 extra Will whenever you are hit or dodge.' },
      { id: 'b4', name: 'Learn: ' + SPIRITS[bs[1]].name, cost: 4, fx: { spirit: bs[1] }, desc: 'Unlocks the ' + SPIRITS[bs[1]].name + ' spirit command. ' + SPIRITS[bs[1]].desc },
      { id: 'b5', name: 'Guardian', cost: 6, fx: { skill: 'guardian' }, desc: 'At Will 130+, damage taken −20% and status immunity.' },
    ] },
    { name: p.branches[2], color: '#7dffb0', icon: '✦', nodes: [
      { id: 'c1', name: 'Deep Focus', cost: 1, fx: { stat: { SP: 15, HIT: 6 } }, desc: 'SP +15, HIT +6.' },
      { id: 'c2', name: 'Support Attack', cost: 2, fx: { skill: 'support' }, desc: 'When an adjacent ally attacks, follow up with your best weapon at 60% power.' },
      { id: 'c3', name: 'Learn: ' + SPIRITS[bs[0]].name, cost: 3, fx: { spirit: bs[0] }, desc: 'Unlocks the ' + SPIRITS[bs[0]].name + ' spirit command. ' + SPIRITS[bs[0]].desc },
      { id: 'c4', name: 'Afflict', cost: 4, fx: { skill: 'afflict' }, desc: 'Status chance +25%. Regenerate 5 SP each phase.' },
      { id: 'c5', name: 'Overdrive', cost: 6, fx: { skill: 'overdrive' }, desc: 'Will cap 170, start missions at Will +10.' },
    ] },
  ];
}
PORTRAITS.rei_m = PORTRAITS.rei;
PORTRAITS.rina = { skin: '#f1d2b6', hair: '#20242e', hs: 'long', eye: '#3fd6ff', suit: '#e9eef6', suit2: '#2856c9', jaw: 'soft', acc: 'none', age: 'young', bg: '#1b3a7a' };

const OUROBOR_PORTRAITS = {
  beast: { sheet: 'ourobor-portraits', row: 0 },
  wyrmling: { sheet: 'ourobor-portraits', row: 1 },
  behemoth: { sheet: 'ourobor-portraits', row: 2 },
  mother: { sheet: 'ourobor-portraits', row: 3 },
  mantle: { sheet: 'ourobor-specialists', row: 0 },
  leech: { sheet: 'ourobor-specialists', row: 1 },
  chrysalis: { sheet: 'ourobor-specialists', row: 2 },
  bellwether: { sheet: 'ourobor-specialists', row: 3 },
};
const OUROBOR_FACE = {
  crawler: 'beast', wyrmling: 'wyrmling', behemoth: 'behemoth', hivemother: 'mother',
  prime: 'behemoth', mantle: 'mantle', leech: 'leech', chrysalis: 'chrysalis',
  bellwether: 'bellwether', spitter: 'chrysalis', burrower: 'leech', broodmaw: 'mother', skyray: 'wyrmling',
};
for (const id of Object.keys(OUROBOR_PORTRAITS)) PORTRAITS[id] ||= PORTRAITS.beast;
