// Machine skill trees. Class node IDs stay with a pilot when their frame changes.
'use strict';
const CLASSES = (() => {
  const costs = [2, 4, 7, 10, 15];
  const deedLabels = { hits: 'landed attacks', ranged: 'kills at range 5+', guards: 'interceptions', repairs: 'assists in the field', moves: 'tiles moved', counters: 'counterattacks', spirits: 'spirits used', kills: 'enemies defeated' };
  const data = {
    aurora: ['Aurora', '#6feaff', { resonance: 1 }, 'Will gained charges the Aurora Core. A full core lets your next attack pierce barriers.', 'hits', 45, [
      ['Core', ['Seed Attunement',{en:15}], ['Pulse Containment',{reduction:.05}], [['Listening Crystal',{spiritDamage:.10}],['White Circuit',{regenEN:.07}]], ['Lattice Sync',{hit:10}], [['Unbroken Chorus',{spirit:'resolve'}],['Heart of Light',{spiritDamage:.20}]]],
      ['Feathers', ['Toward the Dawn',{mob:6}], ['Lightened Frame',{move:1}], [['Solar Feather',{crit:10}],['Silver Aileron',{evade:10}]], ['Awakened Flight',{range:1}], [['Zero Interval',{finisherWill:15}],['Morning Star',{critPower:.25}]]],
      ['Fieldcraft', ['Signal Check',{hit:4}], ['Pulse Guard',{arm:120}], [['Grounded Soul',{statusResist:.30}],['Bright Nerve',{will:10}]], ['White Mantle',{hp:650}], [['One More Voice',{reduction:.15}],['Stand Together',{sp:28}]]],
    ]],
    titan: ['Titan', '#ff885e', { willStride:1 }, 'Moving toward a hostile builds Will. Commit to the approach before unleashing a finisher.', 'moves', 95, [
      ['Momentum', ['Full Stride',{will:4}], ['Iron Advance',{melee:.08}], [['Unstoppable',{steady:1}],['Heat of Battle',{willCap:20}]], ['Closing Force',{afterburn:.04}], [['Furnace Crown',{finisherWill:15}],['Earthbreaker',{critPower:.25}]]],
      ['Iron', ['Cast Plating',{arm:80}], ['Second Shell',{hp:400}], [['Fireproof Hull',{statusResist:.30}],['Impact Mantle',{reduction:.08}]], ['Redoubled Armor',{arm:200}], [['Deep Reactor',{regenHP:.10}],['Sovereign Weight',{hp:1400}]]],
      ['Oath', ['Close Ranks',{hit:4}], ['Stand In',{guard:1}], [['Shield the Crew',{guardAura:.08}],['Battle Cry',{spirit:'rally'}]], ['Hold Ground',{melee:.12}], [['Engine of Hope',{spirit:'resolve'}],['Titan Awake',{will:18}]]],
    ]],
    interceptor: ['Interceptor', '#65f3cc', { hitrun:1 }, 'Attack after moving at most three tiles to earn one reposition.', 'moves', 140, [
      ['Wing', ['Open Throttle',{move:1}], ['Vector Fins',{mob:10}], [['Slipstream',{moveAura:1}],['Lone Wolf',{soloEvade:15}]], ['Afterburn',{afterburn:.10}], [['Ace of Skies',{reposition:2}],['Dogfighter',{flyCounter:1}]]],
      ['Strafe', ['Swept Sights',{postRange:1}], ['Close Burst',{lightDamage:.12}], [['Split Run',{statusChance:20}],['Pin Down',{slow:20}]], ['Deep Magazines',{ammo:.50}], [['Gale Mastery',{finisherWill:15}],['Harrier',{statusDuration:1}]]],
      ['Wingman', ['Formation Drill',{formation:1}], ['Support Attack I',{support:1}], [['Escort',{guardAura:.08}],['Bait',{bait:1,evade:12}]], ['Support Attack II',{support:1}], [['Wingman Ace',{supportCrit:1}],['Cover Fire',{supportAim:15}]]],
    ]],
    duelist: ['Duelist', '#ef849b', { sureCounter:1 }, 'Your first counterattack each enemy phase is a guaranteed hit unless the target has Alert.', 'counters', 18, [
      ['Razor', ['Keen Edge',{melee:.04}], ['Step Inside',{move:1}], [['Red Tempo',{crit:10}],['Bladework',{afterburn:.04}]], ['Blade Pressure',{melee:.14}], [['Crosscut',{critPower:.25}],['Hall of Blades',{finisherWill:15}]]],
      ['Riposte', ['Quiet Poise',{evade:4}], ['Read the Arm',{hit:8}], [['Split Second',{counterDamage:.15}],['Deflect',{reduction:.08}]], ['Glass Footwork',{mob:14}], [['Unseen Return',{flyCounter:1,crit:8}],['End the Exchange',{counterDamage:.25}]]],
      ['Drive', ['Cold Start',{will:4}], ['Open Nerve',{en:30}], [['Overdrive',{willCap:20}],['Hunter’s Pace',{willStride:1}]], ['Hold the Edge',{crit:14}], [['Final Word',{spirit:'resolve'}],['Always Moving',{hitrun:1,reposition:1}]]],
    ]],
    artillery: ['Artillery', '#ffd084', { stationary:.20, moveLimit:2 }, 'Stationary attacks gain +20% damage. No attacks after moving more than two tiles.', 'ranged', 15, [
      ['Barrage', ['Gun Deck',{hit:4}], ['Support Attack I',{support:1}], [['Crossfire',{supportAim:12}],['Shell Cradle',{ammo:.30}]], ['Support Attack II',{support:1}], [['Battery Marshal',{supportCrit:1}],['Tight Spread',{ranged:.18}]]],
      ['Siege', ['Traverse Gears',{postRange:1}], ['Long Chamber',{range:1}], [['Broken Ground',{slow:25}],['Survey Fire',{hit:15}]], ['Pressure Shell',{ranged:.12}], [['No Safe Angle',{critPower:.25}],['High Arc',{range:1,crit:10}]]],
      ['Revetment', ['Crew Cage',{arm:80}], ['Sandbags',{hp:500}], [['Fixed Emplacement',{steady:1}],['Tactical Haul',{moveLimit:1,move:1}]], ['Supply Cage',{en:55}], [['Fire Through It',{hp:1100}],['Battery Fortress',{reduction:.15}]]],
    ]],
    sniper: ['Sniper', '#b8f096', { overwatch:1 }, 'While stationary, fire once when an enemy moves into range. Overwatch uses the equipped weapon’s ammunition or energy.', 'ranged', 15, [
      ['Sightline', ['Zero the Scope',{hit:5}], ['High Magnification',{range:1}], [['Patient Shot',{stationary:.15}],['Snap Shot',{postRange:1,hit:6}]], ['Cold Bore',{crit:14}], [['One Clean Shot',{critPower:.25}],['Last Light',{range:1,hit:10}]]],
      ['Overwatch Support', ['Call Range',{formation:1}], ['Support Attack I',{support:1}], [['Second Watch',{overwatch:1}],['Spotter',{supportAim:15}]], ['Support Attack II',{support:1}], [['Sight Picture',{supportCrit:1}],['Eyes Open',{spirit:'insight',hit:14}]]],
      ['Conceal', ['Breathe Out',{evade:4}], ['Adaptive Panels',{mob:9}], [['Ghost Perch',{soloEvade:15}],['Break Contact',{hitrun:1}]], ['Mask the Heat',{reduction:.12}], [['Vanishing Point',{evade:18}],['Watch the Sky',{flyCounter:1,hit:10}]]],
    ]],
    bulwark: ['Bulwark', '#84bfff', { guardAura:.15 }, 'Adjacent allies take 15% less damage. The aura does not protect its own source.', 'guards', 12, [
      ['Wall', ['Tank Plate',{arm:150}], ['Bulkheads',{hp:800}], [['Immovable',{steady:1,reduction:.10}],['Rampart',{rearGuard:.25}]], ['Seal Integrity',{statusResist:.50}], [['Last Stand',{lastStand:1}],['Bastion Field',{wideGuard:.10}]]],
      ['Guardian', ['Support Defend I',{guard:1}], ['Armed Guard',{defendCounter:.50}], [['Interpose',{guardRange:1}],['Riposte',{defendCounter:.50}]], ['Support Defend II',{guard:1}], [['Aegis',{interceptReduction:.50}],['Martyr',{guardWill:3}]]],
      ['Control', ['Catch the Foot',{slow:20}], ['Hold the Line',{zone:1}], [['Taunt',{taunt:1}],['Shield Bash',{meleePush:1}]], ['Driving Wall',{pushDistance:1}], [['Fortress Line',{zone:1}],['Breakwater',{guardPenalty:15}]]],
    ]],
    engineer: ['Engineer', '#ffb677', { fieldService:1 }, 'Spend an action to repair or resupply an adjacent ally.', 'repairs', 14, [
      ['Recovery', ['Field Kit',{repair:.04}], ['Patch Receiver',{serviceRange:1}], [['Hot Swap',{resupply:.20}],['Strongback',{repair:.17}]], ['Emergency Crew',{hp:600}], [['Dry Dock',{repair:.28}],['Long Arm',{serviceRange:1,repair:.12}]]],
      ['Sustain', ['Spare Battery',{en:20}], ['Workshop Cache',{regenEN:.04}], [['Second Supply',{ammo:.30}],['Fresh Crew',{spirit:'mend'}]], ['Patch Cable',{regenHP:.07}], [['Keep It Running',{regenEN:.14}],['Restore the Line',{spirit:'resolve'}]]],
      ['Pressure Hull', ['Dive Plate',{arm:90}], ['Compensators',{mob:10}], [['Anchor Deep',{steady:1}],['Hunt the Hull',{ranged:.14}]], ['Pressure Cycle',{reduction:.12}], [['No Flooding',{statusResist:.55}],['Abyss Engine',{hp:1200}]]],
    ]],
    resonant: ['Resonant', '#d7a4ff', { spDiscount:.10 }, 'The cockpit reduces Spirit command costs by 10%.', 'spirits', 22, [
      ['Choir', ['Larger Chorus',{sp:15}], ['Steady Voice',{regenSP:3}], [['Echo',{echo:1}],['Solo',{spDiscount:.15}]], ['Common Frequencies',{spirit:'rally'}], [['Resonance Cascade',{cascade:5}],['Overflow',{sp:40}]]],
      ['Lunar', ['Harmonic Pressure',{statusChance:15}], ['Violet Charge',{spiritDamage:.10}], [['Hex',{statusDuration:1}],['Purge',{purge:1}]], ['Distant Bits',{range:1}], [['Lunar Mastery',{finisherStatus:1}],['Eclipse',{openingHit:1}]]],
      ['Veil', ['Between Signals',{evade:8}], ['Quiet Alert',{alertDiscount:5}], [['Phase Veil',{phaseVeil:1}],['Mirror',{reflect:.30}]], ['Clear Channel',{selfCleanse:1}], [['Unreachable',{rangedEvade:20}],['Sanctuary',{statusAura:1}]]],
    ]],
    command: ['Command', '#ffe08e', { commandAura:5, fieldOrders:1 }, 'Allies within three tiles gain +5 hit and evasion. Issue one order each player phase.', 'guards', 12, [
      ['Formation', ['Signal Drills',{formation:1}], ['Support Defend I',{guard:1}], [['Long Call',{commandAura:5}],['Screening Order',{guardAura:.08}]], ['Support Defend II',{guard:1}], [['Fleet Screen',{wideGuard:.12}],['All Stations',{guardWill:3}]]],
      ['Fire Control', ['Gunnery Plan',{hit:5}], ['Support Attack I',{support:1}], [['Aimed Salvo',{supportAim:15}],['Emergency Power',{en:55}]], ['Support Attack II',{support:1}], [['Fire Director',{supportCrit:1}],['Concentrated Broadside',{ranged:.20}]]],
      ['Bridge', ['Signal Battery',{sp:10}], ['Medical Deck',{spirit:'mend'}], [['Fleet Tender',{fieldService:1}],['Stand Ready',{orderPower:5}]], ['Flew Together',{regenSP:5}], [['Halcyon Answer',{spirit:'resolve'}],['Duty of Care',{hp:1200,guardAura:.10}]]],
    ]],
    starborn: ['Starborn', '#e2c1ff', { regenHP:.035, regenEN:.035, gravityPull:1 }, 'Regenerate every friendly phase. Gravity attacks draw a grounded target one tile closer.', 'hits', 40, [
      ['Tides', ['Falling Arc',{hit:4}], ['Low Orbit',{range:1}], [['Apogee',{gravityPush:1}],['Event Horizon',{afterburn:.06}]], ['Folded Light',{spiritDamage:.12}], [['Perihelion',{finisherWill:15}],['Starfall',{critPower:.25}]]],
      ['Shell', ['Starlight Coat',{arm:90}], ['Restored Circuit',{regenEN:.05}], [['Gentle Orbit',{reduction:.08}],['Unbroken Shape',{steady:1}]], ['Second Horizon',{hp:650}], [['A Thousand Dawns',{regenHP:.12}],['Seraph’s Mantle',{wideGuard:.12}]]],
      ['Voice', ['Breath Between',{sp:10}], ['Different Key',{spDiscount:.10}], [['Let Them Answer',{cascade:3}],['Bright Silence',{statusResist:.35}]], ['A Shared Measure',{spirit:'rally'}], [['Requiem of Stars',{spirit:'resolve'}],['Unbound Flight',{hitrun:1,reposition:1}]]],
    ]],
  };
  const frameClass = {
    alteon:'aurora', alteonz:'aurora', alteon_s:'titan', alteonz_s:'titan', kaiser:'titan', trinity:'titan', cinder:'titan',
    sylph:'interceptor', kestrel:'interceptor', carmine:'duelist', orpheus:'duelist', bastion:'artillery', mastodon:'artillery', palisade:'artillery',
    talos:'sniper', aegis:'bulwark', nautilus:'engineer', noctis:'resonant', vesper:'resonant', halcyon:'command', seraphyne:'starborn',
  };
  const labels = {
    hit:'Hit', evade:'Evasion', crit:'Critical chance', critPower:'Critical damage', hp:'HP', en:'EN', arm:'Armor', mob:'Mobility',
    move:'Move', range:'Ranged attack reach', postRange:'Post-move reach', finisherWill:'Finisher Will reduction', will:'Starting Will',
    willCap:'Maximum Will', sp:'SP', regenSP:'SP regenerated per phase', statusChance:'Status chance', statusDuration:'Status duration',
    ammo:'Ammo capacity', resistance:'Resistance', statusResist:'Status resistance', reduction:'Damage reduction', melee:'Melee damage',
    ranged:'Ranged damage', spiritDamage:'Spirit weapon damage', regenHP:'HP refreshed per phase', regenEN:'EN refreshed per phase',
    stationary:'Stationary damage', afterburn:'Damage per two tiles moved (up to 30%)', guardAura:'Adjacent ally damage reduction',
    support:'Support Attack rank', guard:'Support Defend rank', supportAim:'Support opening hit bonus', supportCrit:'Supports can crit',
    guardRange:'Support Defend range', guardWill:'Squad Will gained on interception', fieldService:'Field service', repair:'Repair fraction',
    resupply:'Extra EN restored', serviceRange:'Field service range', overwatch:'Overwatch uses per phase', moveLimit:'Artillery movement limit',
    hitrun:'Hit-and-run enabled', reposition:'Extra tiles when repositioning', commandAura:'Command aura hit and evasion',
    spDiscount:'Spirit cost reduction', counterDamage:'Counter damage', lightDamage:'Light weapon damage', soloEvade:'Evasion while alone',
    moveAura:'Adjacent allies’ move', flyCounter:'Counters against flyers can’t miss', formation:'Formation evasion multiplier bonus',
    slow:'Chance to inflict Slow', steady:'Immune to displacement', rearGuard:'Protect allies behind the frame', wideGuard:'Protection within 2 tiles',
    lastStand:'Survive a lethal hit once per mission', defendCounter:'Counter while defending', interceptReduction:'Intercept damage reduction',
    zone:'Zone of control radius', taunt:'Taunt command', meleePush:'Melee hits push the target', pushDistance:'Knockback distance bonus',
    guardPenalty:'Adjacent enemy hit penalty', echo:'Single-target spirits affect one adjacent ally', cascade:'Adjacent ally Will on cast',
    purge:'Remove enemy spirit effects on hit', finisherStatus:'Finishers apply Jam and Break', openingHit:'First attack each phase cannot be evaded',
    alertDiscount:'Alert SP discount', phaseVeil:'Negate one hit per phase above half HP', reflect:'Reflect missed damage', selfCleanse:'Cleanse at phase start',
    rangedEvade:'Evasion versus ranged attacks', statusAura:'Adjacent allies resist statuses', orderPower:'Extra Will from orders',
    gravityPush:'Push with Gravity weapons', bait:'Draw enemy fire',
  };
  const fractions = new Set(['critPower','ammo','statusResist','reduction','melee','ranged','spiritDamage','regenHP','regenEN','stationary','afterburn','guardAura','repair','resupply','spDiscount','counterDamage','lightDamage','rearGuard','wideGuard','defendCounter','interceptReduction','reflect']);
  const switches = new Set(['supportCrit','fieldService','hitrun','flyCounter','steady','lastStand','taunt','meleePush','echo','purge','finisherStatus','openingHit','phaseVeil','selfCleanse','statusAura','gravityPush','bait']);
  function description(fx) {
    return Object.entries(fx).map(([key, value]) => {
      if (key === 'spirit') return 'Learn ' + SPIRITS[value].name;
      if (key === 'skill') return null;
      const label = labels[key] || key;
      return switches.has(key) ? label : label + ' +' + (fractions.has(key) ? Math.round(value * 100) + '%' : value);
    }).filter(Boolean).join(' · ');
  }
  const byId = {};
  const branches = {};
  const empty = new Proxy({}, {get: () => 0});
  for (const [id, [name, color, passive, intro, deed, target, paths]] of Object.entries(data)) {
    branches[id] = paths.map(([path, ...tiers], index) => ({
      name: path, color, tiers: tiers.map((choice, tier) => (Array.isArray(choice[0]) ? choice : [choice]).map(([label, fx], option) => {
        const key = id + ':' + index + ':' + tier + ':' + option;
        const node = { id: key, name: label, fx, cost: costs[tier], desc: description(fx), deed: tier === 4 ? { key: deed, target } : null };
        byId[key] = node;
        return node;
      })),
    }));
  }
  const personal = Object.fromEntries(Object.entries(PILOTS).map(([id,p]) => {
    const sp = BRANCH_SPIRIT[id]?.[1] || 'ironwall';
    const nodes = [
      [p.branches[0] + ' drills', {hit:5}], [p.branches[1] + ' discipline', {reduction:.05}],
      [p.branches[2] + ' technique', {spirit:sp}], [TYPE_NAMES[p.mastery] + ' mastery', {mastery:p.mastery}],
      [p.cap.name,{skill:p.cap.id},p.cap.desc],
    ].map(([name,fx,desc],i) => {
      const node = { id:'pilot:'+id+':'+i, name, fx, cost:costs[i], desc:desc || (fx.mastery ? TYPE_NAMES[fx.mastery] + ' attack bonus +15%' : description(fx)) };
      byId[node.id] = node;
      return [node];
    });
    return [id,{ name:'Pilot discipline',color:'#f6cc84',tiers:nodes }];
  }));
  const roleClass = { artillery:'artillery', support:'engineer', guardian:'bulwark', scout:'interceptor', sniper:'sniper', melee:'duelist' };
  function classOf(mid) {
    const m = MECHS[mid];
    return frameClass[mid] || roleClass[m?.role] || (m?.ship ? 'command' : m?.fly ? 'interceptor' : m?.size === 'XL' ? 'titan' : 'duelist');
  }
  function get(mid) {
    const id = classOf(mid), [name,color,,intro] = data[id];
    return { id, name, color, intro, branches: branches[id] };
  }
  function owned(unit, save, visit) {
    if (unit.team !== 'player') return;
    const id = classOf(unit.mech), pilot = save.pilots[unit.pilot];
    for (const key of Object.keys(pilot?.nodes || {})) {
      if (pilot.nodes[key] && (key.startsWith(id + ':') || key.startsWith('pilot:' + unit.pilot + ':')) && byId[key]) visit(byId[key]);
    }
  }
  const cached = new WeakMap();
  function effects(u, save) {
    if (u.team !== 'player') return empty;
    const id = classOf(u.mech), nodes = save.pilots[u.pilot]?.nodes;
    let entry = nodes && cached.get(nodes);
    if (entry?.id === id) return entry.fx;
    const out = {...data[id][2]};
    owned(u, save, node => {
      for (const [key,value] of Object.entries(node.fx)) if (typeof value === 'number') out[key] = (out[key] || 0) + value;
    });
    const fx = new Proxy(out, {get: (o,k) => o[k] || 0});
    if (nodes) cached.set(nodes, {id,fx});
    return fx;
  }
  function deed(pilot, key) { return key === 'kills' ? pilot.kills : (pilot.deeds?.[key] || 0); }
  function canBuy(pilot, branch, tier, node) {
    return pilot.pp >= node.cost && !branch.tiers[tier].some(n => pilot.nodes[n.id])
      && (tier === 0 || branch.tiers[tier-1].some(n => pilot.nodes[n.id]))
      && (!node.deed || deed(pilot,node.deed.key) >= node.deed.target);
  }
  function learn(pilot, branch, tier, node) {
    if (!canBuy(pilot,branch,tier,node)) return false;
    pilot.nodes = { ...pilot.nodes, [node.id]:true };
    pilot.pp -= node.cost;
    return true;
  }
  function spent(pilot) { return Object.keys(pilot.nodes).reduce((sum,key) => sum + (pilot.nodes[key] ? byId[key]?.cost || 0 : 0),0); }
  function spiritCost(u, id, save) {
    const fx = effects(u,save);
    return Math.max(1, Math.ceil(SPIRITS[id].cost * (1 - Math.min(.5,fx.spDiscount))) - (id === 'alert' ? fx.alertDiscount : 0));
  }
  return { get, classOf, personal, effects, owned, byId, deed, deedLabels, canBuy, learn, spent, spiritCost };
})();
