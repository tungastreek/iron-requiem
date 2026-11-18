# Iron Requiem — Art Prompt Pack

Prompts for generating the game's unit sprites and pilot portraits with an image model (ChatGPT image generation works well). The designs are original to Iron Requiem. The game's importer reads the files exactly as described in **Output format**, so stick to the layout and the file names.

---

## 0. What needs generated art (and what doesn't)

| Asset | Generate? | Section | Why |
|---|---|---|---|
| Unit sprite sheets (30) | **Yes** | 5 | Core look of battles and the map |
| Pilot portraits (25) | **Yes** | 6 | Dialogue, battle banners, cut-ins |
| Story backgrounds (17) | **Yes** | 9 | Behind every dialogue scene |
| Battle backdrops (11) | **Yes** | 10 | Behind every battle animation |
| Map terrain tiles (4 sets) | **Yes** | 11 | Tactical map |
| Icons (5 sheets, 80 icons) | **Yes** | 12 | Skill tree, spirits, parts/items, types, status, secrets |
| Title key art (1) | **Yes** | 13 | Title screen |
| Story event scenes (8) | Optional | 14 | Full-screen moments at key story beats |
| Attack VFX / particles | **No** | — | Must animate, glow and recolor per attack type; drawn in code |
| UI frames, panels, skill-tree layout | **No** | — | Built in code so they scale to any screen |
| Map unit icons, cut-ins | **No** | — | Cut automatically from the unit and portrait sheets |
| Logo text | **No** | — | Image models misspell text; the logo is set in type |

---

## 1. How to use

1. Open a new ChatGPT chat (a fresh chat per unit keeps designs from bleeding into each other).
2. Paste the **Global style block** (section 3), then one **unit block** (section 5) or **pilot block** (section 6) underneath it, as one message.
3. Ask for the **landscape** image size (1536 × 1024) for units and **square** (1024 × 1024) for portraits.
4. Check the result against the **acceptance checklist** (section 2.4). Regenerate if it fails. "Same design, fix frame 3 only" rarely works; regenerate the whole sheet instead.
5. Save the PNG (or WEBP) with the exact file name given in the block, into:
   - `iron-requiem/assets/units/` for units
   - `iron-requiem/assets/portraits/` for pilots
6. Units without a sheet keep using their 3D model, so you can add art in any order. The suggested order is in section 7.

---

## 2. Output format

### 2.1 Unit sprite sheet

| Property | Value |
|---|---|
| Canvas | 1536 × 1024 px, landscape (any 3:2 size works; the importer scales) |
| Layout | 2 × 2 grid of equal cells, each 768 × 512 px |
| Background | One flat solid color, **#2B2B2B** (charcoal). No gradient, floor, horizon, shadow, vignette or texture. |
| Facing | Unit faces **right** in all four frames, in a three-quarter side view |
| Scale and placement | Same size and same ground line in all four frames; the unit is centered in its cell with at least 32 px of empty background on every side; nothing crosses into another cell |
| Text | None. No labels, frame numbers, logos or watermarks. |
| Effects | No beams, explosions or speed lines (the game draws those). Small muzzle flash or sparks are allowed in frame 3 only. |

Cell order (reading order):

| Cell | Frame | Meaning |
|---|---|---|
| Top-left | 1 · Idle A | Neutral battle stance |
| Top-right | 2 · Idle B | Same stance with small motion: breathing shift, wing or cloth sway, hover bob, lights pulse. The game alternates frames 1 and 2 at about 3 fps. |
| Bottom-left | 3 · Attack | The unit's signature attack pose (described in each unit block) |
| Bottom-right | 4 · Hit | Recoiling from damage: braced, leaning back, armor chipped, a few sparks |

```
┌───────────────┬───────────────┐
│  1  Idle A    │  2  Idle B    │
├───────────────┼───────────────┤
│  3  Attack    │  4  Hit       │
└───────────────┴───────────────┘
        1536 × 1024, bg #2B2B2B
```

### 2.2 Pilot portrait sheet

| Property | Value |
|---|---|
| Canvas | 1024 × 1024 px, square |
| Layout | 2 × 2 grid, each cell 512 × 512 px |
| Framing | Head and shoulders, three-quarter view facing **right**, same crop and size in all four cells |
| Background | Flat solid **#101A33** (deep navy) |
| Text | None |

| Cell | Expression |
|---|---|
| Top-left | Neutral |
| Top-right | Angry / determined |
| Bottom-left | Smile |
| Bottom-right | Shocked / hurt |

### 2.3 File names

- Units: `assets/units/<unit_id>.png`, for example `assets/units/alteon.png`
- Pilots: `assets/portraits/<pilot_id>.png`, for example `assets/portraits/mira.png`
- Lowercase, exactly the ids in sections 5 and 6. `.webp` is also accepted.

### 2.4 Acceptance checklist

- [ ] Four frames, 2 × 2, in the order above
- [ ] Background is one flat color with no floor shadow
- [ ] The same design in all four frames: same colors, same weapon, same number of limbs or wings
- [ ] Facing right in every frame
- [ ] Nothing touches a cell edge
- [ ] No text or watermark

---

## 3. Global style block (paste first, every time)

```
Create a game sprite sheet for an original mecha tactics game.

ART STYLE: high-quality anime mecha concept art, cel-shaded with subtle painterly texture, crisp dark ink linework, layered armor plates with panel lines, small mechanical details (bolts, vents, pistons, hazard markings), light wear and scratches, dramatic rim lighting from the upper left, rich but controlled colors. Consistent with 1990s–2000s Japanese mecha anime but modern in rendering quality.

LAYOUT (strict): one 1536x1024 image divided into a 2x2 grid of equal cells. Every cell shows the SAME unit, identical design, colors and proportions, at the SAME scale and standing on the same ground line, facing RIGHT in a three-quarter side view, centered with generous empty margin so nothing touches the cell edges.
- Top-left: idle stance.
- Top-right: the same idle stance with a slight motion difference (breathing shift, sway, hover bob).
- Bottom-left: attack pose (described below).
- Bottom-right: hit reaction, recoiling from damage, a few sparks, armor slightly chipped.

BACKGROUND (strict): a single flat solid charcoal color #2B2B2B in every cell. No gradient, no floor, no ground shadow, no environment, no text, no labels, no frame numbers, no watermark, no borders. No beams, explosions or speed lines (a small muzzle flash or a few sparks is fine in the attack frame only).

UNIT:
```

### Portrait style block (paste first for pilots)

```
Create a character portrait sheet for an original mecha anime game.

ART STYLE: modern anime illustration, clean confident linework, soft cel shading with painterly texture, muted but rich palette, cinematic rim light. Grounded, mature character design, not chibi.

LAYOUT (strict): one 1024x1024 image divided into a 2x2 grid of equal cells. Every cell shows the SAME character, head and shoulders, three-quarter view facing RIGHT, identical crop, size and outfit.
- Top-left: neutral expression.
- Top-right: angry / determined.
- Bottom-left: smiling.
- Bottom-right: shocked / hurt.

BACKGROUND (strict): a single flat solid deep navy #101A33 in every cell. No text, no labels, no watermark, no borders.

CHARACTER:
```

---

## 4. Faction look guide (for consistency across units)

| Faction | Shape language | Palette | Finish |
|---|---|---|---|
| Halcyon crew (player) | Varied, heroic, readable silhouettes | Each unit has its own signature color | Clean but battle-worn |
| Terran Concord | Blocky, institutional, mono-eye sensors, riot gear | Gunmetal gray, navy, warning yellow, red sensor lights | Utilitarian, stenciled numbers |
| Orbital Free States | Repurposed industrial and space-labor equipment | Olive green, rust orange, brass | Patched, welded, weathered |
| Ourobor | Biomechanical insects and beasts; chitin, exposed sinew, glowing nodes | Deep plum, wine red, sickly yellow-green glow | Wet, organic, iridescent |
| Vael | Angelic, crystalline, haloed, impossibly slender | Pearl white, violet, gold, light-purple glow | Luminous, ceremonial, no wear |

---

## 5. Unit blocks

Each block goes under the global style block. Frame 3 describes the attack pose only; the game adds the actual beam, missile or slash effects.

### Player units

#### alteon — ALTEON (protagonist, Real path)
**File:** `assets/units/alteon.png`
```
ALTEON, a slender "falcon knight" humanoid mecha, about 18 m tall. White armor with royal blue (#2856C9) secondary plates and red/gold accents. Helmet shaped like a falcon's head: a sharp gold beak-like visor pointing forward, glowing cyan eye slit, swept-back blue head fins. A glowing cyan crystal core in the center of the chest. Two large layered mechanical wings on its back made of overlapping white and blue feather-blade plates with gold tips. Digitigrade legs ending in gold three-toed talon feet. Narrow waist with short armored skirt plates. Weapon: a long sleek photon sniper rifle with a cyan glowing scope.
Attack frame: aiming the long rifle forward with both hands, wings spread wide behind it, braced on one talon foot.
```

#### alteonz — ALTEON ZERO (protagonist awakened form)
**File:** `assets/units/alteonz.png`
```
ALTEON ZERO, the awakened form of a falcon-knight mecha: same slender silhouette and falcon helmet, now pearl white with deep indigo (#3B2BD0) and gold. Its wings are no longer metal: six pairs of translucent glowing cyan light-feathers fan out behind it. A thin golden halo ring floats behind its head; a crown of five small gold blades replaces the head fins. A glowing diamond-shaped gem in the chest. Gold talon feet. Weapon: an elegant longsword with a glowing cyan edge.
Attack frame: mid-slash with the sword sweeping upward, light-feather wings flared, body twisting forward.
```

#### alteon_s — ALTEON GIGAS (protagonist, Super path)
**File:** `assets/units/alteon_s.png`
```
ALTEON GIGAS, a heavy super-robot humanoid mecha with a broad, powerful build. White armor with royal blue and red accents. Horned knight helmet with two large swept red horns, a grilled faceplate and glowing cyan eyes. Massive layered shoulder pauldrons, a glowing cyan circular core in the chest ringed in gold, oversized armored gauntlets with fin blades. A dark blue cape. Heavy armored boots.
Attack frame: throwing a huge rocket punch: right fist thrust forward, body leaning in, cape whipping back.
```

#### alteonz_s — ALTEON ZERO GIGAS
**File:** `assets/units/alteonz_s.png`
```
ALTEON ZERO GIGAS, the awakened heavy form: the same broad horned super robot now pearl white, indigo and gold, with a golden halo ring behind the head, a crown of gold blades on the helmet, a glowing diamond chest gem, and translucent cyan light-feather wings. Huge gold-trimmed gauntlets.
Attack frame: both fists raised overhead crackling with light, wings flared.
```

#### sylph — SYLPH (Mira)
**File:** `assets/units/sylph.png`
```
SYLPH, a small, very fast "jet harpy" interceptor mecha. Slim feminine humanoid frame in white with teal (#14A3A3) and soft pink (#FF8FB3) accents. Sleek helmet with a single teal visor band and two swept antenna fins. Two jet-engine nacelles mounted on its back with forward-swept wings, teal glowing intakes. Reverse-jointed legs with small talon feet. A thin wire-claw on one forearm. Weapon: a compact beam pistol.
Attack frame: diving forward at speed, firing the pistol, wings swept back, jets glowing.
```

#### bastion — BASTION (Gunnar)
**File:** `assets/units/bastion.png`
```
BASTION, a four-legged walking artillery tank. Boxy armored hull in faded olive drab with rust streaks and yellow/black hazard stripes; a cab at the front with three warm-yellow lit windows and a heavy bull-bar grille. Four thick armored legs with hydraulic pistons and wide stomping feet. A large rotating turret on top carrying one very long howitzer barrel with a muzzle brake. Deck clutter: ammo crates, a rolled tarp, yellow safety railings, a tall whip antenna. Old, reliable, heavily maintained.
Attack frame: howitzer elevated and firing, a small muzzle flash, front legs braced wide, hull rocked back by recoil.
```

#### halcyon — HALCYON (the player battleship)
**File:** `assets/units/halcyon.png`
```
HALCYON, a sleek independent space battleship seen from the side, about 300 m long. Gray-white hull with dark blue lower plating and a single red stripe; a tall bridge tower toward the stern with a cyan-lit window band; two dorsal gun turrets; a long prow housing a main beam cannon; three glowing cyan engine nozzles at the back. An old military ship, unrepainted, with a faded government insignia.
Attack frame: main prow cannon charging with a cyan glow at its tip, turrets turned toward the target.
```

#### kaiser — GAIA KAISER (Brann)
**File:** `assets/units/kaiser.png`
```
GAIA KAISER, a heroic "lion king" super robot: tall and massive. Black and crimson (#C8102E) armor with bright gold trim. The helmet is a lion's head: a mane of spiked gold and crimson plates radiating around the head, two short gold horns, glowing yellow eyes. A gold lion's face emblem on the chest with glowing eyes (the reactor). Huge armored gauntlets for rocket punches, broad spiked shoulders, a short crimson cape.
Attack frame: firing a "breast inferno": standing wide, arms spread back, chest lion emblem blazing yellow-orange.
```

#### talos — TALOS (Odessa)
**File:** `assets/units/talos.png`
```
TALOS, a long-legged "heron" sniper walker. An animal-like bipedal machine with no arms: a compact armored gunmetal body draped in a ragged olive camouflage cloak, two long thin digitigrade bird legs with three-toed feet, and a long segmented neck ending in a small sensor head with a green glowing eye. The heron's "beak" is a very long rail-gun barrel wrapped in green glowing magnetic coils. Tail fins at the back.
Attack frame: neck lowered horizontal, rail-gun beak pointed straight ahead, legs crouched and braced.
```

#### trinity — TRINITY ARC (Jin, Tessa, Dash)
**File:** `assets/units/trinity.png`
```
TRINITY ARC, a giant excavator-titan built for underground war. A humanoid upper torso in bright construction orange with black/yellow hazard stripes mounted on a wide base with two heavy tank treads. One arm ends in a huge spiral drill; the other is a hydraulic excavator boom with a toothed bucket, raised high. A cab with cyan-lit windows, a small head with a cyan visor, a roll cage with three work floodlights on top. Dirty, scraped, mud on the treads.
Attack frame: drill arm thrust forward and spinning, bucket arm raised behind, treads gripping.
```

#### noctis — NOCTIS (Yuna)
**File:** `assets/units/noctis.png`
```
NOCTIS, a graceful "moth" psy-frame. Very slender humanoid in dark plum (#20172E) and violet (#6C3BD1) with white accents. An insect-like elongated helmet with large glowing lavender compound eyes and two long feathery antennae. Two pairs of large translucent moth wings with violet eye-spot patterns. A small diamond gem in the chest. Around it float four small crystal "bits" (remote weapons). Weapon: a slim beam rifle.
Attack frame: one hand raised commanding the floating crystal bits forward, wings fully open.
```

#### carmine — CARMINE HOUND (Lucien)
**File:** `assets/units/carmine.png` (also used for the enemy version)
```
CARMINE HOUND, a robotic crimson wolf: an animal-shaped mecha on four legs. Glossy crimson (#A3121D) armor plates over a black frame with gold accents. A sleek wolf head with swept armored ears, red glowing eyes and a jaw with metal fangs. A row of short gold spine fins along its back, a long beam lance mounted along its spine, and a segmented tail ending in a glowing orange heat blade. Sharp gold claws.
Attack frame: lunging forward mid-leap, jaws open, tail blade swinging.
```

#### seraphyne — SERAPHYNE (Sera)
**File:** `assets/units/seraphyne.png`
```
SERAPHYNE, a flying "sky manta" with a knight fused to it. A wide graceful manta-ray body in pearl white and deep violet (#5A2D91) with gold trim; broad rippling wings edged with glowing lavender lines and glowing spots; a long whip tail with a gold stinger blade. Rising from the front of the manta is the upper body of a slender knight with a crown of three gold horn-fins, holding a long gold trident.
Attack frame: the manta banking forward, wings curled, the knight thrusting the trident ahead.
```

### Ourobor (biomechanical enemies)

#### crawler — OUROBOR CRAWLER
**File:** `assets/units/crawler.png`
```
OUROBOR CRAWLER, a dog-sized-to-tank-sized biomechanical insect: segmented plum (#3B2A3F) and wine-red chitin body, eight jointed legs, a head with mandibles and glowing yellow-green nodes, exposed glowing sinew between plates. Wet and iridescent.
Attack frame: rearing up with mandibles open, front legs raised to strike.
```

#### wyrmling — OUROBOR WYRMLING
**File:** `assets/units/wyrmling.png`
```
OUROBOR WYRMLING, a flying biomechanical serpent: long segmented body in plum and wine red, two pairs of thin translucent membrane wings, a narrow head with a glowing yellow-green eye and a split jaw. Glowing nodes along its spine.
Attack frame: coiled and lunging forward, jaw open in a shriek.
```

#### behemoth — OUROBOR BEHEMOTH
**File:** `assets/units/behemoth.png`
```
OUROBOR BEHEMOTH, a huge armored biomechanical beast like a beetle crossed with a rhinoceros: thick dark plum chitin, rows of yellow spines along its back, six massive legs, a heavy head with crushing jaws, glowing yellow sacs on its flanks.
Attack frame: head lowered, charging, jaws open, spines raised.
```

#### hivemother — HIVE MOTHER
**File:** `assets/units/hivemother.png`
```
HIVE MOTHER, a colossal biomechanical matriarch: a swollen spherical body of dark plum flesh banded with ribbed chitin, a single enormous glowing yellow eye, dozens of tentacles below and thinner tendrils above tipped with glowing pods. Eggs pulse under translucent skin.
Attack frame: tentacles lashing forward, eye blazing.
```

#### prime — OUROBOR PRIME
**File:** `assets/units/prime.png`
```
OUROBOR PRIME, an ancient guardian colossus: a massive rounded body of dark indigo stone-like chitin veined with teal light, a crown of tall pale crystal spires on top, one great teal eye, roots and tentacles below. Majestic rather than monstrous.
Attack frame: crown spires glowing, roots surging forward.
```

### Terran Concord

#### lancer — LANCER GM-7 (Concord mass-production)
**File:** `assets/units/lancer.png`
```
LANCER GM-7, a mass-produced military humanoid mecha: blocky, practical, gunmetal gray with navy panels and warning-yellow stripes and stenciled unit numbers. A rounded helmet with a single red mono-eye in a visor slot and a short antenna. A tall riot tower-shield on the left arm with a red sensor slit. Weapon: an assault rifle.
Attack frame: firing the rifle over the top of the shield, crouched behind it.
```

#### warden — WARDEN HX (Concord heavy)
**File:** `assets/units/warden.png`
```
WARDEN HX, a six-legged armored crab walker: a wide flat gunmetal carapace with navy armor plates and yellow hazard stripes, two eye-stalks with red lights, six pointed jointed legs, two big pincer claws, and two box missile pods on its back with grids of red-lit launch tubes.
Attack frame: missile pods tilted up firing, claws raised.
```

#### cruiser — CONCORD CRUISER
**File:** `assets/units/cruiser.png`
```
CONCORD CRUISER, a military space warship seen from the side: a long angular gunmetal hull with navy and yellow markings, a stepped bridge tower, three gun turrets, torpedo bays along the side, red running lights, glowing engines at the stern.
Attack frame: turrets firing, a torpedo bay open.
```

#### executor — EXECUTOR (Col. Draike)
**File:** `assets/units/executor.png`
```
EXECUTOR, a Concord commander's custom humanoid in a samurai style: dark navy-gray armor with white and gold trim, a kabuto-like helmet with a gold crescent crest and a wide layered neck guard, glowing red eyes behind a dark faceplate, a long dark cape, layered skirt armor. Weapon: a long katana with a glowing red edge.
Attack frame: a fast iaido draw-slash, blade extended, cape flaring.
```

#### sovereign — SOVEREIGN (Adm. Kroll)
**File:** `assets/units/sovereign.png`
```
SOVEREIGN, a colossal four-legged "cathedral fortress" walker: an ivory-white and gold armored hull carrying gothic towers with gold spires, crimson banners hanging from them, and a twin-barreled heavy cannon turret at the front. Thick armored legs. Imperial, intimidating, immaculate.
Attack frame: twin cannons glowing purple-red as they charge, front legs braced.
```

### Orbital Free States

#### zephyr — ZEPHYR FS (Free States grunt)
**File:** `assets/units/zephyr.png`
```
ZEPHYR FS, a repurposed colony-diver work mecha: bulky olive green armor with rust stains, a large round brass helmet with a single glowing yellow porthole, two brass air tanks and coiled hoses on its back, heavy crab-pincer claw hands, wide flipper feet, a life ring strapped to its side. Patched and welded.
Attack frame: lunging forward, claw snapping open.
```

#### tyrant — TYRANT (Gen. Vasse)
**File:** `assets/units/tyrant.png`
```
TYRANT, a giant "turtle fortress" tank: a domed hexagonal-plated shell in dark olive with brass trim, a turtle-like armored head at the front with glowing amber eyes, heavy tank treads, a twin long-barrel cannon turret on top, and a small watchtower with a hanging green banner.
Attack frame: twin cannons fired, head pulled slightly back, treads digging in.
```

### Vael

#### shard — VAEL SHARD (drone)
**File:** `assets/units/shard.png`
```
VAEL SHARD, a floating "jellyfish" drone: a translucent violet bell-shaped body, a gold crown ring with spikes hovering above it, a single glowing lavender eye, and six blade-like tentacles hanging below with gold tips. A small glowing halo ring beneath.
Attack frame: tentacles flared outward, eye blazing.
```

#### knight — VAEL KNIGHT
**File:** `assets/units/knight.png`
```
VAEL KNIGHT, an impossibly slender angelic humanoid: pearl white armor with violet and gold, a crowned helmet with a lavender visor glow, a thin gold halo behind the head, wings of translucent violet light-feathers, a flowing skirt armor. Weapon: a long gold lance.
Attack frame: lance thrust forward, wings swept back.
```

#### herald — IXION, THE HERALD
**File:** `assets/units/herald.png`
```
IXION, THE HERALD, an angelic Vael archon: tall, white and violet, with gold trim. Behind it, three pairs of wing-like solar panels with gold frames and dark blue cell grids fan out, ringed by a glowing violet halo. A crowned, masked helmet. A long white cape. Weapon: a long gold spear.
Attack frame: spear raised overhead, solar wings fully fanned and glowing.
```

#### aurelion — AURELION (Vael Emperor)
**File:** `assets/units/aurelion.png`
```
AURELION, the Vael Emperor: a massive regal knight in pale gold-white and deep violet, with layered heavy armor, a tall crowned helmet, several concentric gold halos behind it, crimson banners hanging from its back, a large kite shield bearing a gold star, and a long ornate spear. Translucent golden light-feather wings.
Attack frame: spear thrust forward from behind the shield, halos blazing.
```

#### hollow — THE HOLLOW (final boss)
**File:** `assets/units/hollow.png`
```
THE HOLLOW, an avatar of entropy: a perfect black sphere ringed by a thin white glowing outline and a faint violet aura, with one enormous white eye at its center, and black crystal shards with white edges orbiting it. Minimal, eerie, unsettling.
Attack frame: the eye wide open, orbiting shards flung outward.
```

---

## 6. Pilot portrait blocks

Each goes under the **portrait style block**. File: `assets/portraits/<id>.png`.

| id | Character | Prompt text |
|---|---|---|
| `rei` | Rei Kasuga (protagonist, male option) | `Rei Kasuga, 18, Japanese young man, messy spiky black hair, cyan-blue eyes, thoughtful and a little haunted, white-and-royal-blue pilot suit with a high collar.` |
| `rina` | Rina Kasuga (protagonist, female option) | `Rina Kasuga, 18, Japanese young woman, long straight black hair, cyan-blue eyes, thoughtful and a little haunted, white-and-royal-blue pilot suit with a high collar.` |
| `mira` | Mira Solenne | `Mira Solenne, 18, young woman, orange hair in a high ponytail, teal eyes, bright and sharp-tongued with grief underneath, white-and-teal flight suit with harness straps.` |
| `gunnar` | Gunnar Holt | `Gunnar Holt, late 50s, big Scandinavian veteran, gray short hair and gray beard, pale blue eyes, warm crow's feet, olive military jacket with old patches.` |
| `ilse` | Capt. Ilse Varga | `Captain Ilse Varga, late 40s, stern woman with a silver-gray bob, violet eyes, a thin scar across her cheek, dark navy captain's uniform with gold trim and an earpiece.` |
| `brann` | Brann Okonkwo | `Brann Okonkwo, 19, Nigerian young man, wild black hair, amber eyes, loud hot-blooded grin, black-and-crimson pilot jacket with grease stains, goggles around his neck.` |
| `odessa` | Odessa Rhee | `Odessa Rhee, mid 30s, woman with white undercut hair, black eyepatch over one eye, green visible eye, calm and dry, charcoal sniper suit with a gray hood.` |
| `jin` | Jin Mao | `Jin Mao, 20, Chinese young man, slicked-back black hair, green eyes, stoic leader, cream-and-forest-green work pilot suit.` |
| `tessa` | Tessa Vaughn | `Tessa Vaughn, 19, freckled young woman, copper-red hair in a braid, round glasses, blue eyes, cheerful engineer, cream suit with orange hazard patches.` |
| `dash` | Dash Moreau | `Dash Moreau, 19, young man, spiky bleached-yellow hair, brown skin, orange eyes, an earring, reckless grin, cream suit with red stripes.` |
| `yuna` | Yuna Ishara | `Yuna Ishara, 17, gentle young woman, long pale lavender-silver hair, violet eyes, a thin gold circlet with a violet gem, dark plum psy-pilot bodysuit.` |
| `lucien` | Lucien Ash | `Lucien Ash, late 20s, handsome man, long pale-blond hair, red eyes, proud and tired, crimson-and-black officer's coat with gold epaulettes.` |
| `sera` | Seraphyne (Sera) | `Seraphyne, ageless posthuman woman, long white hair, gold eyes, pale lavender skin, two small elegant horns, violet-and-white ceremonial armor, otherworldly calm.` |
| `solenne` | Cmdr. Hal Solenne | `Commander Hal Solenne, 50s, kind square-jawed man, short graying brown hair, short beard, teal eyes, navy base-commander uniform with yellow rank stripes.` |
| `okonkwo` | Prof. Ade Okonkwo | `Professor Ade Okonkwo, 70s, Nigerian elder, bald, white beard, round glasses, warm amber eyes, white lab coat over a red sweater.` |
| `pell` | Pell (operator) | `Pell, 20s, bridge operator, purple bob haircut, cyan eyes behind a transparent cyan visor, headset, navy crew uniform.` |
| `kroll` | Adm. Viktor Kroll | `Admiral Viktor Kroll, 60s, severe man with slicked silver hair, cold gray eyes, a scar on his brow, ivory admiral's uniform with gold braid and medals.` |
| `draike` | Col. Rhys Draike | `Colonel Rhys Draike, 40s, hard-faced man with a dark undercut, red-tinted cybernetic eyes, dark navy uniform with yellow insignia.` |
| `vasse` | Gen. Ostrom Vasse | `General Ostrom Vasse, 60s, bald bearded man, burn scars, fierce orange eyes, olive revolutionary greatcoat with rust-orange armband.` |
| `ixion` | Ixion (the Herald) | `Ixion, Vael herald, tall posthuman with long pale violet hair, a smooth white mask covering the upper face with glowing lavender eye slits, white-and-violet robes.` |
| `aurelion` | Aurelion (the Emperor) | `Aurelion, Vael emperor, ageless and beautiful, long golden hair, glowing gold eyes, a gold circlet, deep violet and gold regal robes, sorrowful.` |
| `soren` | Dr. Soren Kasuga | `Dr. Soren Kasuga, 50s, gentle scientist, short gray-blue hair, glasses, cyan eyes like his child's, white coat, slightly translucent and glowing at the edges as if made of light.` |
| `grunt_c` | Concord pilot | `Anonymous Concord soldier pilot, face mostly hidden by a gray helmet with a cyan visor, gunmetal flight suit.` |
| `grunt_f` | Free States pilot | `Anonymous Free States rebel pilot, worn olive helmet with an amber visor, patched green flight suit.` |
| `vael` | Vael knight | `Anonymous Vael knight, white crystalline mask with violet eye glow, pale violet hair, ornate white armor collar.` |

---

## 7. Suggested order

1. **Most visible:** `alteon`, `mira` + `sylph`, `lancer`, `crawler`, `rei` (or `rina`)
2. **Early chapters:** `bastion`, `halcyon`, `gunnar`, `ilse`, `wyrmling`, `executor`, `draike`, `talos`, `odessa`
3. **Mid game:** `kaiser`, `brann`, `okonkwo`, `behemoth`, `carmine`, `lucien`, `zephyr`, `warden`, `cruiser`
4. **Routes:** `trinity`, `jin`, `tessa`, `dash`, `hivemother`, `prime`, `noctis`, `yuna`, `tyrant`, `vasse`
5. **Late game:** `alteonz`, `seraphyne`, `sera`, `soren`, `shard`, `knight`, `herald`, `ixion`, `sovereign`, `kroll`, `aurelion`, `hollow`
6. **Optional:** `alteon_s`, `alteonz_s` (Super path), `pell`, `solenne`, generic pilots

## 8. File checklist

Units (30): `alteon` `alteonz` `alteon_s` `alteonz_s` `sylph` `bastion` `halcyon` `kaiser` `talos` `trinity` `noctis` `carmine` `seraphyne` `crawler` `wyrmling` `behemoth` `hivemother` `prime` `lancer` `warden` `cruiser` `executor` `sovereign` `zephyr` `tyrant` `shard` `knight` `herald` `aurelion` `hollow`

Portraits (25): `rei` `rina` `mira` `gunnar` `ilse` `brann` `odessa` `jin` `tessa` `dash` `yuna` `lucien` `sera` `solenne` `okonkwo` `pell` `kroll` `draike` `vasse` `ixion` `aurelion` `soren` `grunt_c` `grunt_f` `vael`


---

# Part B — Environments, icons and key art

All files go under `iron-requiem/assets/`. Each section names its subfolder. For these, **do not** use the unit style block; each section has its own.

## 9. Story backgrounds

**Folder:** `assets/backgrounds/` · **Canvas:** 1536 × 1024 landscape, one image, no grid · **Name:** `<key>.png`

Shown full-screen behind dialogue with character portraits standing in the left and right thirds, and a dialogue box over the bottom 25%. The composition must keep the center and lower areas visually calm.

### Background style block (paste first)
```
Create a background painting for a visual-novel scene in an original mecha anime game.

ART STYLE: cinematic anime background art, painterly, detailed but soft-edged, strong atmospheric perspective, moody lighting, rich color, matching high-end 1990s-2000s mecha anime backgrounds with modern rendering.

COMPOSITION (strict): 1536x1024 landscape. NO people, NO characters, NO robots in the foreground, NO text, NO watermark. Keep the left and right thirds and the bottom quarter relatively low-detail (characters and a dialogue box will be placed there). Interest and light concentrated in the upper middle.

SCENE:
```

| key | Prompt text |
|---|---|
| `base` | `Kestrel military base at dusk in a mountain valley: hangars, runway lights, radar dishes, warm orange sunset behind snowy peaks, calm before disaster.` |
| `fire` | `The same mountain military base burning at night: collapsed hangars, a cracked runway split open by a glowing fissure, orange fire and black smoke under a red sky.` |
| `hangar` | `Interior of a giant mecha hangar at night: steel gantries, work lights, cables, a tall white humanoid mecha silhouette in a maintenance cradle far in the background, cool blue lighting.` |
| `bridge` | `The command bridge of a battleship: curved windows showing stars, holographic tactical displays in cyan, a captain's chair seen from behind, dim blue lighting.` |
| `sky` | `High above green countryside: bright blue sky, towering white clouds, rolling hills far below, sense of speed and freedom.` |
| `lab` | `A robotics lab carved into a cliff in the African Rift Valley: warm amber lighting, workbenches, blueprints, fossils in glass cases, a huge red-and-black robot silhouette behind a hangar door.` |
| `elevator` | `Base of a space elevator: a colossal tower rising from a coastal city into the clouds and beyond, cyan light rings climbing it, golden afternoon light.` |
| `space` | `Low Earth orbit: the blue curve of Earth below, a field of stars, a distant moon, scattered satellite debris glinting.` |
| `colony` | `Inside the view of an O'Neill space colony cylinder: a long rotating habitat with city lights along its inner surface, seen from outside through the dark, docking lights.` |
| `hive` | `A vast underground organic cavern: walls of ribbed flesh and chitin, glowing yellow-green nodes, sinewy pillars, wet reflections, deep reddish darkness.` |
| `vael` | `An alien cathedral-ship of light in space: enormous concentric rings of violet and white light, crystalline spires, a core of absolute black, stars around it.` |
| `ice` | `Antarctic ice shelf split open by a gigantic crevasse: deep blue ice walls, a glowing crystal mountain far below, pale sky, blowing snow.` |
| `void` | `A sky where the stars are going out: a perfect black sphere eclipsing the heavens with a thin white rim of light, everything around it fading to grey.` |
| `dawn` | `A peaceful dawn over a healed world: golden sunrise over the sea and green hills, glowing crystal flowers blooming in meadows, gentle hopeful light.` |
| `ruins` | `A ruined city after a battle: broken skyscrapers, rubble, smoke drifting, dusty brown light filtering through clouds.` |
| `city` | `A modern megacity in daylight: glass towers, elevated highways, a calm blue sky, seen from a high balcony.` |
| `black` | Not needed (plain black is drawn in code). |

## 10. Battle backdrops

**Folder:** `assets/battle/` · **Canvas:** 1536 × 1024 · **Name:** `<key>.png`

The game shows a 16:9 slice of this image and slowly pans it sideways, with two mechs standing on the lower part. These need a **clear horizon line at about 62% of the height** and a broad, **empty, flat ground area below it** (or open space for space scenes).

### Battle backdrop style block (paste first)
```
Create a wide battle backdrop for a 2D mecha battle scene in an original anime game.

ART STYLE: painterly anime background art, cinematic, strong depth and atmosphere, matching high-end mecha anime.

COMPOSITION (strict): 1536x1024. The horizon line sits at about 62% of the image height. The ground in the lower part is open and fairly flat with no objects in the middle area (two giant robots will stand there). Landmarks and silhouettes go along the horizon and in the sky. Horizontally balanced so the image can be panned left and right. NO robots, NO people, NO text, NO watermark.

SETTING:
```

| key | Used in | Prompt text |
|---|---|---|
| `city` | ch 6A, 8 | `A daytime megacity: glass towers on the horizon, a wide empty multi-lane highway plaza in the foreground, light haze.` |
| `fire` | ch 1 | `A burning military base at night: hangars and towers ablaze on the horizon, red sky, smoke, a cracked runway in the foreground.` |
| `ruins` | ch 3 | `A ruined research facility in a dry valley: broken buildings and cliffs on the horizon, dusty orange light, rubble-strewn flat ground.` |
| `sky` | ch 2 | `High altitude above clouds over a coastline: blue sky, a sea of white clouds forming the "ground", distant cliffs.` |
| `elevator` | ch 4 | `The base of a space elevator: the colossal tower rising on the horizon into the sky with cyan light rings, a coastal plaza in the foreground.` |
| `space` | ch 6B | `Earth orbit: Earth's curve filling the lower third, stars above, distant warships as tiny lights.` |
| `colony` | ch 5B | `Space near a giant colony cylinder that stretches across the horizon, stars, drifting debris.` |
| `hive` | ch 5A | `An underground organic cavern: ribbed flesh walls and sinew pillars on the far side, glowing yellow-green nodes, a wide wet chitin floor.` |
| `vael` | ch 7, 10 | `Space before an alien ship of light: concentric violet-white rings and crystal spires across the horizon, stars.` |
| `ice` | ch 9 | `An Antarctic ice field: blue ice cliffs and a glowing crystal mountain on the horizon, flat snow and ice foreground, pale sky.` |
| `void` | ch 10 | `A dying sky: a huge black sphere with a white rim on the horizon, stars fading, a cracked grey plain.` |

## 11. Map terrain tiles

**Folder:** `assets/tiles/` · **Canvas:** 1024 × 1024, a 4 × 4 grid of 256 × 256 tiles · **Name:** `tiles_<set>.png`

Tiles are drawn **top-down** and **fill their cell edge to edge** (no background, no gaps). Each tile should tile seamlessly with itself and blend at its edges with the neutral ground of its set.

### Tile style block (paste first)
```
Create a tileset sheet for a tactical strategy game map, viewed straight from above (orthographic top-down, slight soft shading as if lit from the upper left).

ART STYLE: painterly hand-painted game tiles, rich but readable, gentle detail, consistent lighting across all tiles, like a high-quality tactics RPG.

LAYOUT (strict): 1024x1024 image, a 4x4 grid of 16 square tiles of 256x256. Each tile fills its square completely edge to edge; no borders, no gaps, no background between tiles, no text, no grid lines. Each tile's edges should tile seamlessly with itself.

TILES, in reading order (left to right, top to bottom):
```

**`tiles_earth.png`**
```
1 grass plains A, 2 grass plains B, 3 dense forest (tree canopies), 4 forest edge with clearings,
5 rocky mountain peak with snow cap, 6 rocky hills, 7 city block (rooftops, streets), 8 city block with a plaza,
9 ruins and rubble, 10 cracked asphalt with debris, 11 river water, 12 shallow coastal water,
13 military base pad (hexagonal landing pad with cyan lights), 14 base hangar roof, 15 dirt road, 16 impassable cliff wall.
```
**`tiles_snow.png`**
```
1 snow plains A, 2 snow plains B, 3 snowy pine forest, 4 frozen trees,
5 icy mountain peak, 6 ice ridge, 7 snow-covered research station roofs, 8 station landing pad with cyan lights,
9 ice rubble, 10 cracked ice sheet, 11 dark arctic water, 12 thin ice over water,
13 blue glacier crevasse edge, 14 glowing crystal outcrop, 15 tracked snow path, 16 impassable ice cliff.
```
**`tiles_hive.png`**
```
1 organic floor A (wet purple chitin), 2 organic floor B, 3 sinew growths, 4 egg cluster,
5 chitin spire mound, 6 rib ridge, 7 fossilized ruins in flesh, 8 glowing yellow-green node pool,
9 bone rubble, 10 cracked chitin, 11 acidic fluid pool, 12 shallow bile,
13 crystal chamber floor with light murals, 14 crystal pillar base, 15 worn tunnel path, 16 impassable flesh wall.
```
**`tiles_space.png`**
```
1 open space A (stars on black), 2 open space B, 3 asteroid debris field, 4 dense debris,
5 large asteroid, 6 wreckage of a ship, 7 colony hull plating with lit windows, 8 colony docking pad with cyan lights,
9 floating scrap, 10 solar panel array, 11 nebula gas (blue), 12 nebula gas (violet),
13 Vael light lattice (glowing violet diamond grid), 14 Vael crystal, 15 space station corridor roof, 16 impassable hull bulkhead.
```

## 12. Icons

**Folder:** `assets/icons/` · **Canvas:** 1024 × 1024, a 4 × 4 grid of 256 × 256 icons · **Name:** `icons_<set>.png`

### Icon style block (paste first)
```
Create a sheet of game UI icons for an original sci-fi mecha tactics game.

ART STYLE: polished painted game icons, each a single bold emblem inside a rounded-square metal badge with a thin gold-and-steel bezel, subtle inner glow in the icon's theme color, crisp silhouette readable at small size, consistent lighting from the upper left, matching high-end anime mecha UI.

LAYOUT (strict): 1024x1024 image, a 4x4 grid of 16 icons, each centered in its 256x256 cell with ~24px margin. Background between and around badges is a single flat solid charcoal #2B2B2B. NO text, NO letters, NO numbers, NO watermark.

ICONS, in reading order (left to right, top to bottom):
```

**`icons_skills.png`** (skill tree)
```
1 Combat Drills: crossed sword and rifle (red glow),
2 Exploit Weakness: cracked shield with a target reticle (orange glow),
3 Prevail: a battered fist rising through flames (red glow),
4 Reinforced Cockpit: armored cockpit hatch with rivets (blue glow),
5 Steel Nerves: a calm heartbeat line over a steel plate (blue glow),
6 Iron Will: an anvil with a rising spark (blue glow),
7 Guardian: a tower shield with radiant wings (blue glow),
8 Deep Focus: a glowing eye inside concentric rings (green glow),
9 Support Attack: two mech silhouettes back to back (green glow),
10 Afflict: a dripping dagger with a status rune (green glow),
11 Overdrive: an engine core bursting with energy (green glow),
12 Offense branch emblem: a sword (red),
13 Defense branch emblem: a shield (blue),
14 Resonance branch emblem: a four-pointed star (green),
15 Skill point: a glowing hexagonal chip (gold),
16 Locked: a heavy padlock (grey).
```
**`icons_capstones.png`** (pilot capstones + map secrets)
```
1 Aurora Resonance: a crystal core radiating light-feathers (cyan),
2 Sky Dancer: a swept wing with motion trails (teal),
3 Saturation Fire: a rain of shells (amber),
4 Fleet Command: a battleship bow with a command star (gold),
5 Burning Soul: a lion head made of fire (crimson),
6 Dead Eye: a sniper scope crosshair with a single eye (green),
7 Triple Heart: three interlocked gears with a heart (orange),
8 Choir: a crescent moon with sound waves (violet),
9 Crimson Fury: a wolf fang with red flames (crimson),
10 Starborn: a dragon wing around a star (violet-gold),
11 Supply Cache: an open military crate with credits (gold),
12 Buried Part: a mechanical gear half buried in soil (steel),
13 Aurora Shard: a floating cyan crystal shard (cyan),
14 Repair Crate: a crate with a wrench and a cross (green),
15 Resonance Node: a glowing pillar of light from the ground (violet),
16 Ambush: a red warning triangle with claws (red).
```
**`icons_spirits.png`** (spirit commands)
```
1 Focus: an eye with a lens flare, 2 Strike: an arrow hitting a bullseye, 3 Alert: a dodging silhouette with afterimages, 4 Valor: a flaming fist,
5 Iron Wall: a fortress wall, 6 Guts: a heart with a bandage cross, 7 Zeal: a lightning-fast double arrow, 8 Ardor: a rising flame,
9 Accel: a winged boot, 10 Mend: hands holding a green light, 11 Rally: a raised banner, 12 Fortune: a gold coin with a star,
13 Insight: an open book with a glowing page, 14 Resolve: a radiant sun over a sword, 15 Cleanse: a water droplet with sparkles, 16 Spirit Points: a glowing lotus.
```
**`icons_parts.png`** (parts, status effects, misc)
```
1 Thruster Pack: twin rocket nozzles with blue flame, 2 Ceramic Plating: a stack of white armor tiles, 3 Targeting Array: a sensor dish with a reticle, 4 Reactor Cell: a glowing cylindrical power cell,
5 Nanite Repair Unit: a swarm of tiny glowing nanites around a wrench, 6 Resonance Lens: a crystal lens refracting light, 7 Purity Nanocoat: a shimmering shield droplet, 8 Apsaras Engine: an ornate winged engine,
9 Burn status: flame, 10 Shock status: lightning bolt, 11 Armor Break status: shattered plate, 12 Slow status: a gear frozen in ice,
13 Jammed status: a static-filled target reticle, 14 Credits: a stack of gold coins, 15 Bonus objective: a gold star medal, 16 Unknown secret: a glowing question-mark-shaped crystal (no letters, a crystal shaped like a hook and dot).
```
**`icons_types.png`** (attack types, armor classes, stats)
```
1 Kinetic: a bullet with impact rings (khaki), 2 Beam: a straight cyan laser beam, 3 Plasma: an orange plasma orb, 4 Blade: a gleaming sword edge (white),
5 Explosive: a missile with a blast (yellow), 6 Graviton: a black sphere warping a grid (purple), 7 Spirit: a glowing green feather, 8 Heavy Plate armor: a thick riveted plate (bronze),
9 Light Frame armor: a slim angular frame (light blue), 10 Beam Coat armor: a plate with a refracting film (mint), 11 Biomass armor: chitin with a glowing vein (lime), 12 Void Body armor: a crystalline void shard (violet),
13 Ship Hull armor: a ship hull section (grey), 14 HP: a green heart-shaped armor plate, 15 EN: a blue energy cell, 16 Will: a flame-shaped crest (gold).
```

## 13. Title key art

**Folder:** `assets/key/` · **Canvas:** 1536 × 1024 · **Name:** `title.png`
```
Key art for an original mecha anime game. A slender white-and-blue "falcon knight" mecha with gold beak-like visor and layered feather-blade wings (ALTEON, design from the unit sheet) hovers in Earth orbit, wings spread, a glowing cyan core in its chest; behind it the vast violet ring-ship of an alien fleet and the blue curve of Earth. Cinematic painterly anime style, dramatic rim light. The LEFT THIRD of the image is calm dark space with only faint stars (the title and menu go there). NO text, NO logo, NO watermark.
```

## 14. Story event scenes (optional)

**Folder:** `assets/events/` · **Canvas:** 1536 × 1024 · **Name:** `<key>.png` · Use the story background style block, but people and mechs are allowed here. Keep the bottom quarter calm for the dialogue box.

| key | Moment | Prompt text |
|---|---|---|
| `ev_ashfall` | Ch 1, the ground opens | `The runway of a mountain base splitting open at dusk; glowing insect-like biomechanical creatures climbing out of the fissure; a white falcon-winged mecha in a hangar doorway, eyes lighting up.` |
| `ev_tower` | Ch 1, Solenne's death | `A base command tower collapsing in flames at night; a small teal-and-white jet mecha in the foreground, reaching toward it.` |
| `ev_kaiser` | Ch 3, Gaia Kaiser rises | `A huge black-and-crimson lion-maned super robot rising from a cliffside lab hangar, gold eyes blazing, sparks and steam, dramatic low angle.` |
| `ev_mural` | Ch 5A, the light murals | `A vast crystal cathedral deep underground, walls covered in moving murals of light showing ancient humans leaving Earth in ships of light; tiny mechs at the bottom for scale.` |
| `ev_okonkwo` | Ch 5A, the professor's sacrifice | `A collapsing cavern, a small battered survey vehicle pushing a giant crimson robot out of the way as rocks fall; dust and light beams.` |
| `ev_zero` | Ch 7, Alteon Zero awakens | `A falcon-winged mecha in space bursting with light, its armor rebuilding itself into pearl and gold, wings becoming translucent cyan light-feathers, a golden halo forming.` |
| `ev_reach` | Ch 9, reaching Aurelion | `Over a glowing crystal mountain in Antarctic ice, a radiant falcon-winged mecha extends a hand toward a towering gold-and-violet emperor knight with many halos, who lowers his spear.` |
| `ev_dawn` | True ending | `Sunrise over a healed world; glowing crystal blooms across green hills; mechas of every faction standing together on a cliff, seen from behind, looking at the dawn.` |

## 15. Part B file checklist

- `assets/backgrounds/`: `base` `fire` `hangar` `bridge` `sky` `lab` `elevator` `space` `colony` `hive` `vael` `ice` `void` `dawn` `ruins` `city`
- `assets/battle/`: `city` `fire` `ruins` `sky` `elevator` `space` `colony` `hive` `vael` `ice` `void`
- `assets/tiles/`: `tiles_earth` `tiles_snow` `tiles_hive` `tiles_space`
- `assets/icons/`: `icons_skills` `icons_capstones` `icons_spirits` `icons_parts` `icons_types`
- `assets/key/`: `title`
- `assets/events/` (optional): `ev_ashfall` `ev_tower` `ev_kaiser` `ev_mural` `ev_okonkwo` `ev_zero` `ev_reach` `ev_dawn`

**Total:** 30 unit sheets + 25 portraits + 16 story backgrounds + 11 battle backdrops + 4 tile sheets + 5 icon sheets + 1 key art = **92 images** (+ 8 optional event scenes).
