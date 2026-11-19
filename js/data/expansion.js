// ===== The Unbroken Chorus: new machines, pilots, and eight campaign interludes =====
'use strict';
const EXPANSION = (() => {
  const units = [
    ['aegis', 'AEGIS', 'Disaster-Relief Bulwark', 'HEAVY', 'L', 6200, 160, 1650, 74, 4, false, 'bastion', 'allied-vanguard', 0,
      'Anika welded the shield from shelter doors. Aegis was designed to carry survivors through bombardments, and it still carries their names beneath its armor.',
      [W('Rescue Shotgun','KIN',2300,1,3,{ammo:12,acc:20,anim:'vulcan'}),W('Anchor Cable','BLADE',2600,1,4,{en:12,anim:'harpoon',status:{id:'SLOW',ch:65}}),W('Shield Ram','KIN',3200,1,1,{en:20,melee:true,anim:'punch',status:{id:'BREAK',ch:45}}),W('Shelter Line','BEAM',4100,2,5,{en:45,will:115,anim:'shieldburst',big:true})]],
    ['nautilus','NAUTILUS','Abyssal Recovery Frame','HULL','M',5300,180,1250,90,5,false,'bastion','allied-vanguard',1,
      'Corin brought Nautilus up from a flooded Lethe drydock. Its pressure hull and magnetic harpoons make it a capable hunter above the waterline too.',
      [W('Pressure Harpoon','KIN',2700,1,5,{ammo:10,acc:15,anim:'harpoon'}),W('Crush Pincer','BLADE',3300,1,1,{en:15,crit:20,anim:'drill'}),W('Depth Charge','EXPL',3100,2,6,{ammo:5,anim:'missile',status:{id:'SHOCK',ch:35}}),W('Abyssal Bell','GRAV',4800,1,4,{en:65,will:120,anim:'sonar',status:{id:'SLOW',ch:60},big:true})]],
    ['vesper','VESPER','Choir Interdiction Frame','COAT','M',3900,220,950,126,6,true,'noctis','allied-vanguard',2,
      'A field-research instrument rebuilt around Leda’s archive receiver. Its ribbon drones can disentangle a Vael signal without erasing the person inside it.',
      [W('Tuning Ray','BEAM',2400,1,6,{en:8,acc:20,anim:'rifle'}),W('Ribbon Choir','SPIR',3300,2,7,{en:30,anim:'funnel',status:{id:'JAM',ch:60}}),W('Quiet Interval','GRAV',3700,1,5,{en:35,anim:'sonar',status:{id:'SHOCK',ch:40}}),W('Names Remembered','SPIR',5600,1,6,{en:75,will:130,finisher:true,anim:'finisher',seq:['funnel','sonar','spirit'],cut:'One voice at a time. No one is lost in the choir.'})]],
    ['mastodon','MASTODON','Tracked Rail Siege Engine','HEAVY','L',6500,150,1550,62,4,false,'bastion','allied-vanguard',3,
      'A mining machine with two survey accelerators turned outward. Hugo can tell you where every plate came from; he would rather tell you where the ore used to go.',
      [W('Rivet Battery','KIN',2200,1,3,{ammo:16,anim:'vulcan'}),W('Seismic Shell','EXPL',3300,3,8,{ammo:6,post:false,anim:'cannon',status:{id:'SLOW',ch:50}}),W('Twin Rail Driver','KIN',3900,3,9,{en:30,acc:25,post:false,anim:'railgun',big:true}),W('Bedrock Verdict','KIN',5100,4,10,{en:60,will:125,post:false,anim:'railgun',big:true,status:{id:'BREAK',ch:75}})]],
    ['kestrel','KESTREL','Duct-Fan Interceptor','LIGHT','S',3400,150,800,148,8,true,'sylph','allied-outriders',0,
      'Noor’s courier has flown through every blockade on the northern coast. The four fans can vector independently, keeping it aloft when a wing comes home in pieces.',
      [W('Wing Needles','KIN',1900,1,3,{ammo:18,acc:25,anim:'vulcan'}),W('Crosswind Beams','BEAM',2700,1,5,{en:12,acc:15,anim:'rifle'}),W('Slipstream Cut','BLADE',3100,1,2,{en:20,crit:25,anim:'multislash'}),W('Return Address','BEAM',4700,1,5,{en:55,will:120,finisher:true,anim:'finisher',seq:['rifle','multislash','beam'],cut:'Noor to all stations: your message is coming through!'})]],
    ['cinder','CINDER','Industrial Furnace Titan','HEAVY','L',7000,190,1750,70,5,false,'kaiser','allied-outriders',1,
      'Emi refused the order to melt her district’s machines for war material. She made the foundry walk instead. Its reactor burns hot enough to temper a blade during a strike.',
      [W('Piston Fist','KIN',3100,1,2,{en:10,melee:true,anim:'punch'}),W('Slag Lance','PLAS',3400,1,5,{en:20,anim:'plasma',status:{id:'BURN',ch:60}}),W('Furnace Vent','PLAS',4000,1,4,{en:35,anim:'breath',status:{id:'BURN',ch:45}}),W('Second Shift','PLAS',6200,1,2,{en:80,will:130,finisher:true,anim:'finisher',seq:['punch','drill','plasma'],cut:'We built this city. You do not get to burn it.'})]],
    ['orpheus','ORPHEUS','Harmonic Duelist','VOID','M',4300,210,1050,136,6,true,'carmine','allied-outriders',2,
      'Orran severed Orpheus from the Choir to remember a single friend. The tuning blades turn hostile resonance against itself; using them risks hearing that friend’s voice again.',
      [W('Forked Edge','BLADE',3100,1,2,{acc:25,crit:25,anim:'multislash'}),W('Countermelody','SPIR',3500,2,6,{en:30,anim:'sonar',status:{id:'JAM',ch:50}}),W('Broken Measure','GRAV',3900,1,4,{en:40,anim:'gravity',status:{id:'BREAK',ch:50}}),W('A Single Voice','SPIR',5900,1,3,{en:75,will:130,finisher:true,anim:'finisher',seq:['multislash','sonar','spirit'],cut:'I remember you. That is enough.'})]],
    ['palisade','PALISADE','Centaur Escort Artillery','COAT','L',5700,170,1350,104,6,false,'trinity','allied-outriders',3,
      'Vale’s escort frame walks beside refugee columns rather than ahead of them. Its four-leg chassis carries an entire signal mast beneath the armored saddle.',
      [W('Lance Carbine','BEAM',2700,1,5,{en:10,acc:20,anim:'rifle'}),W('Escort Rockets','EXPL',3100,2,7,{ammo:6,anim:'missile'}),W('Pennant Lance','BLADE',3500,1,2,{en:20,crit:20,anim:'harpoon',melee:true}),W('Road to Dawn','BEAM',5100,2,8,{en:60,will:120,post:false,anim:'shieldburst',status:{id:'BREAK',ch:50}})]],
    ['mantle','Ourobor Mantle','Brood Shield-Carrier','BIO','M',4700,120,1350,65,4,false,'crawler','enemy-brood',0,'A plate-backed guardian that places its shell between the Heart and incoming fire.',
      [W('Carapace Shear','BLADE',2500,1,1,{anim:'slash'}),W('Caustic Glob','PLAS',2400,1,4,{en:12,anim:'plasma',status:{id:'BURN',ch:45}})]],
    ['leech','Ourobor Leech','Burrowing Disruptor','BIO','M',4000,130,800,108,6,false,'crawler','enemy-brood',1,'Its drilling jaws feed on reactor waste. Damaged relay stations often mark the route of a migrating brood.',
      [W('Ring Jaws','BLADE',2800,1,1,{crit:20,anim:'drill',status:{id:'BREAK',ch:50}}),W('Static Bile','SPIR',2300,1,4,{en:15,anim:'sonar',status:{id:'JAM',ch:55}})]],
    ['chrysalis','Ourobor Chrysalis','Airborne Spore Vessel','BIO','L',5900,180,900,85,5,true,'wyrmling','enemy-brood',2,'A nursery vessel whose navigation signals interfere with human targeting systems.',
      [W('Spore Lattice','PLAS',2800,2,6,{en:20,anim:'spores',status:{id:'BURN',ch:55}}),W('Nursery Pulse','SPIR',3000,1,4,{en:25,anim:'sonar',status:{id:'SLOW',ch:45}})]],
    ['bellwether','Ourobor Bellwether','Resonant Herd Leader','BIO','XL',10500,200,1450,58,4,false,'behemoth','enemy-brood',3,'Its horns carry instructions across entire valleys. Human bombardment has driven it to broadcast one signal: defend.',
      [W('Tuning Horn','KIN',3400,1,2,{melee:true,anim:'punch'}),W('Valley Resonance','GRAV',3500,2,6,{en:25,anim:'sonar',status:{id:'SHOCK',ch:45}}),W('Fault Chorus','SPIR',4400,1,5,{en:50,will:115,anim:'spores',big:true})]],
    ['bailiff','Concord Bailiff','Riot Suppression Frame','HEAVY','M',5000,140,1450,78,4,false,'warden','enemy-legions',0,'Emergency procurement replaced crowd-control rounds with armor-piercing ammunition. The shield still bears the old safety markings.',
      [W('Riot Rotary','KIN',2500,1,4,{ammo:12,anim:'vulcan'}),W('Compliance Ram','KIN',2800,1,1,{melee:true,anim:'punch',status:{id:'SLOW',ch:50}}),W('Lockdown Shell','EXPL',2900,2,6,{ammo:4,anim:'cannon',status:{id:'JAM',ch:35}})]],
    ['marauder','Free States Marauder','Salvage Rocket Cavalry','LIGHT','M',3800,130,850,118,7,false,'zephyr','enemy-legions',1,'Built from cargo movers and stolen launch rails. Its speed lets a single crew threaten several supply roads.',
      [W('Scrap Scatter','KIN',2200,1,3,{ammo:12,anim:'vulcan'}),W('Salvage Swarm','EXPL',3000,2,7,{ammo:6,anim:'missile'}),W('Hot-Rod Lance','PLAS',3100,1,2,{en:20,melee:true,anim:'harpoon',status:{id:'BURN',ch:40}})]],
    ['cantor','Vael Cantor','Choir Resonance Tripod','VOID','L',6300,220,1150,110,5,true,'knight','enemy-legions',2,'A Choir conductor carried by three bladed limbs. Its pulses can immobilize several networks without touching their armor.',
      [W('Choir Needle','BEAM',3000,2,7,{en:15,acc:15,anim:'rifle'}),W('Stolen Verse','SPIR',3500,1,6,{en:25,anim:'sonar',status:{id:'JAM',ch:60}}),W('Violet Benediction','GRAV',4000,2,5,{en:45,will:115,anim:'gravity',status:{id:'SHOCK',ch:45}})]],
    ['nullmaw','Silence Nullmaw','Entropic Ring Predator','VOID','L',7100,250,1200,126,6,true,'shard','enemy-legions',3,'The Silence learned the shape of a gate from the Vael. It now wears that shape to hunt the voices escaping through it.',
      [W('Missing Edge','BLADE',3300,1,3,{crit:20,anim:'slash'}),W('Unwritten Wake','GRAV',3700,2,6,{en:25,anim:'gravity',status:{id:'SLOW',ch:55}}),W('No Return','SPIR',4600,1,5,{en:50,will:115,anim:'nullring',big:true,status:{id:'JAM',ch:60}})]],
  ];
  units.forEach(([id,name,cls,armor,size,hp,en,arm,mob,move,fly,base,sheet,row,desc,weapons]) => {
    MECHS[id] = {name,cls,armor,size,hp,en,arm,mob,move,fly,desc,weapons,vis:{...MECHS[base].vis},atlas:{sheet,row}};
  });
  MECHS.aegis.abil={barrier:{name:'Shelter Shield',val:600,en:8,bypass:['GRAV','SPIR']}};
  MECHS.nautilus.ratings={sea:'S',lnd:'A',spc:'B'};
  MECHS.nautilus.amphibious=true;
  MECHS.kestrel.ratings={air:'S'};
  MECHS.cinder.abil={regenEN:.1};
  MECHS.mantle.abil={barrier:{name:'Carapace',val:450,en:8,bypass:['BLADE','GRAV']}};
  MECHS.marauder.faction='free_states';
  const crew = [
    ['anika','Anika Sen','aegis','gunnar','EXPL',['Rescue Line','Shelter','Evacuation'],'cap_ilse','Open Corridor','Allies within 2 tiles gain +10 hit and evasion.',['mend','ironwall'],'portraits-relief',0,
      ['There is a shelter behind me. You stop here.','Aegis, anchor the line.'],['Door holds. Keep moving.'],['The last transport is clear.']],
    ['corin','Corin Vale','nautilus','jin','KIN',['Soundings','Pressure Hull','Recovery'],'cap_jin','Ballast Heart','Max HP +2000 and regenerate 10% HP each phase.',['guts','mend'],'portraits-relief',1,
      ['Pressure steady. Harpoon away.','I brought people up from deeper water.'],['Hull pressure rising. Still within limits.'],['Recovery channel is open.']],
    ['leda','Leda Quill','vesper','yuna','SPIR',['Intervals','Counterpoint','Witness'],'cap_yuna','Unredacted Signal','Spirit damage +25%. Your attacks ignore barriers.',['cleanse','resolve'],'portraits-relief',2,
      ['Your name is still in the record.','I will not let them redact this.'],['Receiver damaged. Recording continues.'],['One less voice under compulsion.']],
    ['hugo','Hugo Rusk','mastodon','gunnar','KIN',['Surveyor','Bedrock','Union'],'cap_gunnar','Surveyor’s Verdict','Kinetic and Explosive damage +25%; ammo +50%.',['strike','ironwall'],'portraits-relief',3,
      ['Two barrels. One answer.','Survey complete. Marking the fault.'],['Old steel. Good steel.'],['The road is ours again.']],
    ['noor','Noor Haddad','kestrel','mira','BEAM',['Courier','Crosswind','Homebound'],'cap_mira','Open Sky','Evasion +20 and Movement +1.',['zeal','cleanse'],'portraits-outriders',0,
      ['No blockade has kept me yet.','Message received. Delivering personally.'],['Wing warning. I see it.'],['Clear skies behind us!']],
    ['emi','Emi Tanaka','cinder','brann','PLAS',['Furnace','Temper','Second Shift'],'cap_brann','Workers’ Fire','Will +2 extra when hit. Damage +15% at Will 140+.',['zeal','guts'],'portraits-outriders',1,
      ['Foundry pressure at red. Good.','This is what we kept the furnace for.'],['I have worked hotter shifts.'],['The workers get to go home.']],
    ['orran','Orran Vey','orpheus','sera','SPIR',['Single Voice','Dissonance','Remembrance'],'cap_sera','Remembered Light','Damage taken −15%; regenerate 8% EN each phase.',['resolve','alert'],'portraits-outriders',2,
      ['A voice belongs to the one who speaks.','I remember the shape of your silence.'],['I am still here. I choose to be.'],['Your echo is free.']],
    ['vale','Vale Ibrahim','palisade','odessa','BEAM',['Escort','Roadwarden','Safe Passage'],'cap_odessa','Roadwarden’s Sight','Critical +30. Ranged weapons +1 max range.',['mend','ironwall'],'portraits-outriders',3,
      ['Column, keep walking. I have this.','No one gets left on the road.'],['Armor holds. Stay behind me.'],['Convoy route secured.']],
  ];
  const portraits={};
  crew.forEach(([id,name,mech,base,mastery,branches,capid,capname,capdesc,spirits,sheet,row,atk,hit,kill])=>{
    NAMES[id]=name;const p=PILOTS[base];
    PILOTS[id]={...p,mech,base:{...p.base},gr:[...p.gr],mastery,branches,cap:{id:capid,name:capname,desc:capdesc},spirits:[[spirits[0],1],['focus',1],[spirits[1],5],['valor',12],['zeal',24]],lines:{atk,hit,kill,dodge:['Clear of the shot.','Not today.']}};
    BRANCH_SPIRIT[id]=spirits;PORTRAITS[id]={...PORTRAITS[base]};portraits[id]={sheet,row};
  });
  // Interludes are placed between the original chapters, preserving the route
  // split, character reveals, player choices, and both authored endings.
  const extras=[
    {id:'i1',after:['c1'],next:'c2',num:'01.5',title:'The Shelter Line',bg:'city',theme:'urban',lvl:2,join:['anika','corin'],enemy:['crawler','lancer','leech','wyrmling','bailiff','mantle'],
      brief:'Open the eastern shelter road. Ourobor are at the substations, and a Concord robot detachment has sealed the evacuation checkpoint.',
      pre:[['ilse','Kestrel is behind us. Six shelters are still broadcasting. We turn back.'],['mira','The command tower is gone. Dad is gone. And those things are still—'],['anika','Mira. I heard him order the shelters open before his channel cut. There are people alive because he stayed.'],['mira','Then we get them out. Show me the road.'],['corin','Ourobor at the pumps. And north of the crossing, I count Concord Lancers and a Bailiff. They have their rifles on the evacuation lane.'],['grunt_c','Halcyon, stand clear of the checkpoint. Our orders are to seize the prototype and hold the road.'],['ilse','That road is full of civilians. Lower your weapons and let them through.'],['anika','If they move on the buses, Aegis takes point.']],
      post:[['anika','Shelter Six reports its last bus clear. No one left below.'],['mira','You said he opened the shelters. Did you hear anything after that?'],['anika','Only the evacuation tone. I kept the recording, if you want it.'],['mira','Not tonight. Keep it safe. Please.'],['corin','We are coming with you, Captain. Somebody has to keep your people afloat.']]},
    {id:'i2',after:['c2'],next:'c3',num:'02.5',title:'A Record of the Missing',bg:'ruins',theme:'coast',lvl:4,join:['leda','hugo'],enemy:['bailiff','lancer','warden','leech','bailiff','mantle'],
      brief:'Recover the civilian relay archive before Concord seizure teams destroy it. The survey crews have brought heavy equipment.',
      pre:[['leda','Your distress call included a casualty figure the Concord archive does not recognize. Forty-one thousand.'],['rei','Ashfall. They called it a meteor.'],['leda','They called nine thousand of those people temporary residents. Then removed the temporary records.'],['hugo','Leda copied the names. The Bailiffs arrived before she could send them.'],['ilse','You knew Lethe was not the only erased column.'],['leda','I knew the columns did not add up. That is a smaller courage. I would like to attempt a larger one.'],['hugo','Mastodon will open the road. You keep the relay standing.']],
      post:[['leda','The archive is aboard. It is evidence, Captain. Not absolution.'],['ilse','I know. Put my firing order beside the names. The whole order.'],['hugo','People will read it and hate you.'],['ilse','Some of them should.'],['rei','The names stay visible. Whatever we find next.']]},
    {id:'i3',after:['c3'],next:'c4',num:'03.5',title:'The Second Shift',bg:'fire',theme:'lab',lvl:6,join:['noor','emi'],enemy:['marauder','zephyr','bailiff','warden','marauder','chrysalis'],
      brief:'The foundry workers refuse a forced evacuation into detention. Secure the rail junction and break the siege.',
      pre:[['noor','Halcyon, this is courier Kestrel. Please tell me your captain still accepts unlicensed passengers.'],['ilse','How many?'],['noor','Three thousand. And one walking blast furnace.'],['emi','They requisitioned our tools, then our output, then the workers. We agreed to none of it.'],['brann','You made the foundry into a robot?!'],['emi','No. We made it into a way out. The difference matters to the people inside.'],['mira','Noor, tag the launchers. I will cover your run.']],
      post:[['emi','The last train is moving. They kept the workshop keys. Said we might need them after the war.'],['brann','We will. Grandpa says machines should do something useful when the fighting stops.'],['emi','He sounds like someone worth meeting.'],['noor','I have a packet for him. Forty years late. From the first crew that helped him pour the reactor housing.']]},
    {id:'i4',after:['c4'],next:null,num:'04.5',title:'Names Above the Clouds',bg:'sky',theme:'elevator',lvl:8,join:[],enemy:['bailiff','lancer','marauder','zephyr','bailiff','chrysalis'],
      brief:'A refugee convoy is caught beneath the elevator firing lanes. Break the cordon before the fleet divides its forces.',
      pre:[['gunnar','We split the fleet now, those transports spend six hours without an escort.'],['odessa','The launchers are aimed at their departure lane. That is not an accident.'],['leda','The registry lists those transports as empty. It has already decided no one aboard can die.'],['mira','Put the names on our channel. All of them.'],['ilse','Both routes will wait. Today we escort one fleet.']],
      post:[['mira','I thought saying their names would make me feel better.'],['leda','Did it?'],['mira','It made them people. That is harder.'],['ilse','Keep that difficulty. Commands get dangerous when it becomes easy.']]},
    {id:'i5',after:['c6a','c6b'],next:'c7',num:'06.5',title:'A Voice Outside the Choir',bg:'colony',theme:'colony',lvl:15,join:['orran','vale'],enemy:['cantor','knight','shard','marauder','cantor','bailiff'],
      brief:'A Vael dissident and a civilian escort are trapped between three forces. Silence the conductors and secure the colony docks.',
      pre:[['orran','Do not answer the conductor. It will use the reply to find you.'],['rei','I can hear it through the hull. It is making every voice sound the same.'],['vale','My convoy followed a rescue signal. It turned out to be a targeting beacon. Orpheus cut it before the cruisers arrived.'],['orran','The Choir calls that treason. My friend called it listening. She is no longer here to name it.'],['rei','Then you can name it. Fly with us.'],['vale','Palisade has eighteen families behind its shield. Find us a route, and we are yours.']],
      post:[['orran','You will ask me what the Vael want. I cannot answer for all of them.'],['rei','Good. Neither can I.'],['vale','The convoy wants to stop for the night. Somewhere with a sky.'],['ilse','Pell, find them a sky. Then put their escort on the roster.']]},
    {id:'i6',after:['c7'],next:'c8',num:'07.5',title:'The Molting Choir',bg:'hive',theme:'hive',lvl:18,join:[],enemy:['mantle','leech','chrysalis','bellwether','wyrmling','mantle','leech'],
      brief:'A wounded brood has mistaken the fleet’s reactor wake for a stolen Heart fragment. Clear a corridor without destroying its nursery.',
      pre:[['corin','The pressure echoes are not attack calls. Something underneath is hurt.'],['leda','Every human sonar pulse sounds like a drill to them. We are announcing an excavation.'],['brann','Can we turn the sonar off?'],['gunnar','In a tunnel full of teeth? Terrible idea.'],['anika','We can hold a visual line. Shield to shield. Slow, but possible.'],['rei','The core knows the nursery is there. It keeps pulling us away from it. Follow me.']],
      post:[['corin','The brood is moving east. Away from us.'],['brann','They carried the little ones first.'],['leda','Put that in the report before the combat numbers.'],['anika','Done. And Captain? We should decide what we call this. It was not a victory over them.']]},
    {id:'i7',after:['c8'],next:'i8',num:'08.3',title:'The Weight of an Order',bg:'space',theme:'space',lvl:21,join:[],enemy:['bailiff','warden','marauder','cantor','knight','cruiser','bailiff'],
      brief:'Concord and Free States remnants are fighting over evacuation tugs. Disable the seizure force and keep the common channel open.',
      pre:[['hugo','They are charging passage by reactor output. Small boats get no berth.'],['lucien','The commander used to fly under my flag. I can make him listen.'],['ilse','Try. Before we fire.'],['lucien','Remnant squadron: this is Lucien Ash. Those people are not cargo.'],['vale','He has cut the civilian channel.'],['ilse','Then send it through ours. Every gunner hears the passengers before receiving a target.'],['leda','Including our gunners, Captain?'],['ilse','Especially ours.']],
      post:[['lucien','He surrendered to you. Not to me.'],['ilse','He surrendered when the tug pilots refused to move. Give them the credit.'],['hugo','For once, that can be literal. I have his requisition ledger.'],['leda','And the first unredacted one I have seen in years.']]},
    {id:'i8',after:[],next:'c9',num:'08.7',title:'What the Dark Repeats',bg:'void',theme:'vael',lvl:23,join:[],enemy:['nullmaw','cantor','shard','nullmaw','knight','cantor'],
      brief:'An entropic echo has learned the refugee frequencies. Sever the false beacons before the fleet reaches Antarctica.',
      pre:[['noor','I have a message from Kestrel Base. Original timestamp. Commander Solenne’s voice.'],['mira','Play it.'],['orran','Wait. It repeats the breath between every word. Exactly the same breath.'],['mira','...Do not play it.'],['yuna','The dark found our recordings. It is learning which voices make us turn around.'],['rei','Dad said the Heart remembers. Maybe the Silence only copies.'],['mira','Then it can copy this: we are coming, and we know the difference.']],
      post:[['mira','Anika. The real recording. I think I can listen now.'],['anika','I will sit with you.'],['orran','A copied voice cannot choose to stay. A remembered one can teach us to.'],['rei','Antarctica ahead. All hands, keep the channel open.']]},
  ];
  const stagePilots=[['rei','mira','ilse','gunnar'],['rei','mira','ilse','gunnar','odessa'],['rei','mira','ilse','gunnar','brann','odessa'],['rei','mira','ilse','gunnar','brann','odessa'],['rei','mira','ilse','gunnar','brann','odessa','jin','yuna'],['rei','mira','ilse','gunnar','brann','odessa','jin','yuna','sera'],['rei','mira','ilse','gunnar','brann','odessa','jin','yuna','sera','lucien'],['rei','mira','ilse','gunnar','brann','odessa','jin','yuna','sera','lucien']];
  const slots=[[3,5],[3,7],[1,3],[2,8],[4,6],[1,6],[4,9],[5,4],[2,2],[5,8]],enemySlots=[[11,2],[12,8],[13,5],[15,7],[14,2],[15,10],[10,10],[11,5],[16,3],[16,9],[13,10],[10,1]];
  const mapSizes = [[16,11], [20,11], [18,14], [23,11], [18,14], [20,16], [22,14], [18,13]];
  const script=(rows)=>rows.map(([s,t])=>({s,e:'normal',t}));
  extras.forEach((x,i)=>{
    const [width, height] = mapSizes[i];
    const oldNext=x.after.length?CHAPTERS[x.after[0]].next:null;
    const next=x.next||oldNext;
    x.after.forEach(id=>CHAPTERS[id].next=x.id);
    CHAPTERS[x.id]={num:x.num,title:x.title,bg:x.bg,mood:i<4?'tense':'battle',brief:x.brief,
      pre:[{title:x.title.toUpperCase(),sub:'The Unbroken Chorus'},{bg:x.bg,m:'tense'},...script(x.pre),...x.join.map(join=>({join}))],
      map:{w:width,h:height,theme:x.theme,seed:1401+i*137,space:['space','colony','vael'].includes(x.theme)},
      deploy:stagePilots[i].map((p,k)=>({p,x:slots[k][0],y:slots[k][1]})),
      enemies:x.enemy.concat(x.enemy.slice(0,i<2?2:i<5?3:5)).map((m,k)=>{
        const [x,y] = enemySlots[k];
        return E(m, x + Math.max(0, Math.round((width - 18) * (x - 9) / 8)), Math.round(y * (height - 1) / 11), extras[i].lvl, {tag:'interlude_'+i+'_'+k});
      }),
      events:[],win:'rout',vital:['rei','ilse'],
      bonus:{text:'Clear by turn 9',check:s=>s.turn<=9,part:['repair','targeting','reactor','plating','resonator','nanocoat','thruster','reactor'][i]},
      post:[{bg:i===5?'hive':'bridge',m:'calm'},...script(x.post),{codex:'unbroken'}],next,
      reward:{credits:4500+i*1500,parts:i===0?['repair']:[]}};
  });
  const shelter = CHAPTERS.i1;
  // Two roadbeds meet at the eastern gate. Hills and rubble screen the north
  // checkpoint while the southern causeway passes exposed reservoir tiles.
  shelter.map.rows = [
    'ffmfff....mff...',
    '.ffm...r..c..f..',
    'b......r.cc..c..',
    '..f..f.r.c.r.cc.',
    '...b.f.r..cr....',
    'b...........bb..',
    '...c.........b..',
    '...c..r...ww....',
    '.f...r..wwww.r..',
    '..fr..wwww...r..',
    '...f..ww.w..f...',
  ];
  const checkpoint = [[5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5]];
  const pumps = [[5, 5], [6, 5], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6]];
  shelter.allies = save => {
    const road = save.flags.shelter_route === 'pumps' ? pumps : checkpoint;
    return [road, [[4, 5], ...road]].map((path, index) => ({
      m: 'aegis', x: path[0][0], y: path[0][1], lvl: 4, hpMul: 1.65,
      tag: 'shelter_' + (index + 1), name: 'Shelter Carrier ' + (index + 1), escortPath: path,
    }));
  };
  shelter.win = { escort: ['shelter_1', 'shelter_2'] };
  shelter.lose = { turn: 12, text: 'The carriers missed the last evacuation window.' };
  shelter.bonus = { text: 'Evacuate both carriers without taking damage', check: s => s.units.filter(u => u.escortPath).every(u => !u.escortDamaged), part: 'repair' };
  shelter.brief = 'Escort two shelter carriers to the eastern gate by turn 12. Clear their marked route so both can advance during the ally phase.';
  shelter.pre.splice(shelter.pre.length - 2, 0,
    { s: 'anika', t: 'Both carriers can walk as long as there is road in front of them. At the gate, they go off our frequency and into the tunnel.' },
    { s: 'corin', t: 'The checkpoint is shorter. The pump road is open too, but there is water on one side and no room to pass a stalled carrier.' },
    { s: 'mira', t: 'I have their two callsigns written down. When one stops answering, I want to know which.' },
    { choice: [
      { t: 'Take the checkpoint. Clear the shorter road.', set: { shelter_route: 'checkpoint' } },
      { t: 'Take the pump road. Approach the gate from the south.', set: { shelter_route: 'pumps' } },
    ] });
  shelter.events = [
    { at: { turn: 1, phase: 'player' }, script: [
      { s: 'pell', t: 'Both carriers are on the board. Their road is marked in cyan. They advance after us, one space at a time.' },
      { s: 'anika', t: 'Park on the shoulder. Leave the road clear. Our drivers have never had to do this with a squadron watching.' },
      { s: 'mira', t: 'Carrier Two, if you need us to wait, say so. We are not on the test flight clock anymore.' },
    ] },
    { at: { turn: 2, phase: 'player' }, script: [
      { s: 'pell', e: 'shock', t: 'Two Concord signatures on the east road. I have marked their approach. They will be in range next turn.' },
      { s: 'corin', t: 'They will see the carriers before they see Nautilus. Let me stand somewhere they cannot look past me.' },
      { s: 'ilse', t: 'Take the cover at the junction. Keep the drivers on the civilian channel.' },
    ] },
    { at: { turn: 3, phase: 'enemy' }, telegraph: true, add: [
      E('valkyr', 15, 1, 2), E('lancer', 15, 8, 2),
    ], script: [
      { s: 'grunt_c', t: 'Control, we can see people in the rear racks. Confirm seizure authority.' },
      { s: 'anika', t: 'You can have my name and my frame number. They are not coming off those carriers.' },
    ] },
    { at: { escorted: 'shelter_1' }, script: [
      { s: 'pell', t: 'Carrier One is through. The gate crew is keeping the ramp down for Two.' },
      { s: 'mira', t: 'I hear Two. I am staying right here until they stop needing me.' },
    ] },
  ];
  shelter.post.push(
    { s: 'anika', t: 'The shelter registry has a place for names and a place for numbers. Either will tell the next crew how many beds to make.' },
    { choice: [
      { t: 'Record names where the survivors give permission.', set: { shelter_consent: 'named' } },
      { t: 'Send a count. Keep names with the shelter crew.', set: { shelter_consent: 'counted' } },
    ] });
  // Keep ordinary formations varied as the campaign introduces new opponents.
  const replace={c2:{lancer:['bailiff']},c3:{crawler:['mantle','leech']},c4:{lancer:['bailiff']},c5a:{crawler:['chrysalis','leech']},c6a:{crawler:['mantle','leech'],wyrmling:['chrysalis']},c5b:{zephyr:['marauder']},c6b:{lancer:['bailiff'],zephyr:['marauder']},c7:{crawler:['mantle','leech'],wyrmling:['chrysalis']},c8:{knight:['cantor']},c9:{shard:['cantor']},c10:{shard:['nullmaw']}};
  Object.entries(replace).forEach(([chapter,types])=>{const n={};CHAPTERS[chapter].enemies.forEach(e=>{if(e.boss||e.tag||e.pilot)return;const list=types[e.m];if(list){const k=n[e.m]||0;n[e.m]=k+1;if(k%2===0)e.m=list[Math.floor(k/2)%list.length];}});});
  CHAPTERS.i2.post.push({s:'leda',e:'normal',t:'One more decision. Release the archive now, and relief crews can trace their families. Hold it, and we can protect the surviving witnesses until they leave Concord territory.'},
    {choice:[{t:'Release a searchable record. Give the families a way to answer.',set:{archive_public:true},res:1},{t:'Protect the living witnesses first. Keep a sealed copy.',set:{archive_public:false}}]});
  CHAPTERS.i2.pre.push(
    { if: s => s.flags.shelter_consent === 'named', go: 'named_manifest' },
    { s: 'leda', t: 'I can work from a count. If someone wants to tell us their name later, the door is open.' },
    { go: 'manifest_reviewed' },
    { label: 'named_manifest' },
    { s: 'leda', t: 'The shelter drivers asked me to add their names. They had already marked the others who chose to speak.' },
    { label: 'manifest_reviewed' });
  CHAPTERS.i7.pre.push({if:s=>s.flags.archive_public,go:'record_response'},{s:'leda',t:'Our witnesses are safe aboard. The records remain sealed until they choose to testify.'},{go:'record_end'},
    {label:'record_response'},{s:'noor',t:'The families used the archive to find each other. A relief escort is answering our channel.'},{label:'record_end'});
  CHAPTERS.i7.allies=s=>s.flags.archive_public?[{m:'aegis',x:6,y:1,lvl:20,name:'Civilian Relief Escort'}]:[];
  CHAPTERS.i6.post.push({s:'rei',t:'The nursery is still calling. If we leave a receiver open, the brood could find us again.'},
    {choice:[{t:'Leave the channel open. A warning can become a conversation.',set:{nursery_channel:true},res:1},{t:'Close the receiver. The crew needs a quiet night.',set:{nursery_channel:false}}]});
  const originalC9Allies=CHAPTERS.c9.allies;
  CHAPTERS.c9.allies=s=>(typeof originalC9Allies==='function'?originalC9Allies(s):originalC9Allies||[]).concat(s.flags.nursery_channel?[{m:'mantle',x:7,y:0,lvl:22,name:'Nursery Guardian'}]:[]);
  CODEX.unbroken={t:'The Unbroken Chorus',b:'Eight crews joined the Halcyon for eight different reasons: shelter, recovery, evidence, work, a message, a home, a remembered friend, a road. Their machines were built for tasks the war tried to erase. The auxiliary wing deploys up to four of them alongside the main squadron.'};
  CHAPTERS.i8.map.fog = true;
  return {crew:crew.map(x=>x[0]),portraits,units:units.map(x=>x[0]),chapters:extras.map(x=>x.id)};
})();
