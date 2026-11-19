# Iron Requiem — Asset Requests V2 (art, music, sound, voice)

New assets requested by [HANDOFF_COMMERCIAL.md](HANDOFF_COMMERCIAL.md). A person generates them; agents integrate them (task A1 for art, M1 for music, M2 for sound and voice). Every asset is optional, and the game falls back gracefully until it arrives.

After adding any file, run `python3 tools/build_offline.py` so the game also loads it from disk.

## Summary and priority

| ID | Request | Count | Priority | Folder |
|---|---|---|---|---|
| R-01 | Replace the hangar background (IP fix) | 1 | **P0** | `assets/backgrounds/` |
| R-02 | New story locations for Halcyon talks and new beats | 10 | P1 | `assets/backgrounds/` |
| R-03 | Cockpit cut-ins | 24 sheets | P1 | `assets/cutins/` |
| R-04 | Finisher and combo splash art | 17 | P1 | `assets/splash/` |
| R-05 | Extra portrait expressions | 13 sheets + 2 atlases | P2 | `assets/portraits/` |
| R-06 | New event scenes | 16 | P1 | `assets/events/` |
| R-07 | Ending art and epilogue images | 3 + 18 | P2 | `assets/events/`, `assets/epilogues/` |
| R-08 | Emblems and system icons | 2 sheets | P2 | `assets/icons/` |
| R-09 | Map tokens (optional) | 4 atlases | P3 | `assets/tokens/` |
| R-10 | Tile transitions (optional, experimental) | 4 sheets | P3 | `assets/tiles/` |
| R-11 | Codex illustrations (optional) | 16 | P3 | `assets/codex/` |
| R-12 | Store and marketing art | 4 | P2 | `assets/store/` |
| M | Music: recorded score, character themes, stingers | 41 tracks | P1–P2 | `assets/music/` |
| S | Sound effects | 48 | P2 | `assets/sfx/` |
| V | Voice barks (optional) | per pilot | P3 | `assets/voice/` |

Generate in a fresh chat per item. Keep the **original content** rule: no franchise lookalikes (in particular no V-fin crests on twin-eyed faces), no logos, no text in images.

---

## Shared style blocks

Paste the matching block, then the item's line.

**Mech style** (same as the original pack):
```
ART STYLE: high-quality anime mecha concept art, cel-shaded with subtle painterly texture, crisp dark ink linework, layered armor plates with panel lines, small mechanical details (bolts, vents, pistons, hazard markings), light wear and scratches, dramatic rim lighting from the upper left, rich but controlled colors. Consistent with 1990s–2000s Japanese mecha anime but modern in rendering quality. Original designs only: no V-shaped head crests on a twin-eyed face, no logos, no text, no watermark.
```
**Character style:**
```
ART STYLE: modern anime illustration, clean confident linework, soft cel shading with painterly texture, muted but rich palette, cinematic rim light. Grounded, mature character design, not chibi. No text, no logos, no watermark.
```
**Scene style:**
```
ART STYLE: cinematic anime background art, painterly, detailed but soft-edged, strong atmospheric perspective, moody lighting, rich color, matching high-end 1990s–2000s mecha anime with modern rendering. No text, no logos, no watermark.
```

---

## R-01 Replace the hangar background (P0)

**File:** `assets/backgrounds/hangar.png` · 1536 × 1024 · scene style, story-background composition (calm left and right thirds and bottom quarter).

```
Interior of a giant mecha hangar at night: steel gantries, work lights, hanging cables, maintenance crews' walkways. In the far background, in a maintenance cradle, stands ALTEON: a slender white-and-royal-blue "falcon knight" mecha with a gold beak-like visor, swept-back blue head fins, a glowing cyan crystal core in the chest, and large folded mechanical wings of layered feather-blade plates. Its head must NOT have a V-shaped crest or a twin-eyed human-like face. Cool blue lighting with warm work-light accents. No people in the foreground.
```

---

## R-02 New story locations (P1)

**Folder:** `assets/backgrounds/` · 1536 × 1024 each · scene style, story-background composition.

| key | Prompt |
|---|---|
| `messhall` | `The Halcyon's cramped mess hall at night: bolted tables, a coffee machine with a handwritten "still terrible" note, a porthole showing stars, warm overhead light, mismatched mugs.` |
| `flightdeck` | `The Halcyon's open flight deck at dawn in the upper atmosphere: catapult rails, parked mechs as silhouettes in the distance, wind-blown tarps, pale gold sky.` |
| `medbay` | `A small starship medical bay: two beds, soft blue monitors, a window to the stars, a folded blanket and a child's drawing taped to a cabinet.` |
| `quarters` | `A starship captain's quarters: a desk with old paper files, a framed photo face-down, a decommissioned military uniform hung in a clear case, dim lamp light.` |
| `observation` | `A starship observation deck: a long curved window over Earth at night, city lights below, a bench, reflections on the glass.` |
| `memorial` | `A quiet memorial garden carved into a cliffside lab in the African Rift Valley: stones with names, wildflowers, a huge red-and-black robot silhouette kneeling far in the background at sunset.` |
| `colonymarket` | `A street market inside a space colony cylinder: lanterns, patched awnings, workers in olive overalls, the curved land rising overhead in the distance.` |
| `warroom` | `A Concord command war room: a vast holographic table of Earth, tiers of officers' consoles in shadow, cold white and gold lighting, banners without text.` |
| `arkinterior` | `Inside an alien ark of light: luminous violet corridors of crystal, floating glyph-like shapes (not letters), soft choir-like light beams, impossible architecture.` |
| `heartchamber` | `A cathedral-sized crystal chamber deep under Antarctic ice: a mountain of glowing aurora crystal at the center, ice walls with veins of light, tiny walkways for scale.` |

---

## R-03 Cockpit cut-ins (P1)

**Folder:** `assets/cutins/` · **File:** `<pilot_id>.png` · 1536 × 1024 · **2 × 2 grid** of 768 × 512 cells · character style.

```
Create a cockpit cut-in sheet for an original mecha anime game. LAYOUT (strict): one 1536x1024 image, a 2x2 grid of equal cells. Every cell shows the SAME pilot seated in the SAME mecha cockpit, framed from mid-chest up, three-quarter view facing RIGHT, with glowing cockpit displays around them (no readable text on the displays). Cell 1 top-left: calm focus, eyes forward. Cell 2 top-right: battle shout, leaning forward, motion in the hair. Cell 3 bottom-left: hurt, sparks and a cracked display, gritted teeth. Cell 4 bottom-right: finisher, face lit by intense light in the mecha's signature color, determined. Cockpit interior colors follow the mecha. No text, no borders.
PILOT AND COCKPIT:
```

| pilot_id | Pilot and cockpit line |
|---|---|
| `rei` | `Rei Kasuga, 18, messy black hair, cyan-blue eyes, white-and-blue pilot suit; ALTEON cockpit in white and royal blue with cyan crystal light.` |
| `rina` | `Rina Kasuga, 18, long straight black hair, cyan-blue eyes, white-and-blue pilot suit; ALTEON cockpit in white and royal blue with cyan crystal light.` |
| `mira` | `Mira Solenne, 18, orange high ponytail, teal eyes, white-and-teal flight suit; SYLPH cockpit, tight jet-fighter canopy, teal displays.` |
| `gunnar` | `Gunnar Holt, late 50s, gray hair and beard, olive veteran jacket; BASTION cockpit, heavy analog levers, amber gauges.` |
| `ilse` | `Captain Ilse Varga, late 40s, silver bob, thin scar, navy captain's coat; the HALCYON bridge command chair with tactical holograms.` |
| `brann` | `Brann Okonkwo, 19, wild black hair, amber eyes, black-and-crimson jacket, goggles; GAIA KAISER cockpit, red and gold, roaring reactor glow.` |
| `odessa` | `Odessa Rhee, mid 30s, white undercut, black eyepatch, green eye, gray hood; TALOS cockpit, sniper scope display in green.` |
| `jin` | `Jin Mao, 20, slicked black hair, green eyes, cream-and-green suit; TRINITY ARC cockpit, mining-machine controls, orange hazard trims.` |
| `yuna` | `Yuna Ishara, 17, long lavender-silver hair, violet eyes, gold circlet, plum psy-suit; NOCTIS cockpit, soft violet light, floating crystal motes.` |
| `lucien` | `Lucien Ash, late 20s, long pale-blond hair, red eyes, crimson officer's coat; CARMINE HOUND cockpit, crimson and gold, wolf-head emblem shape (no letters).` |
| `sera` | `Seraphyne, ageless, long white hair, gold eyes, small horns, violet armor; she is fused with her living dragon-manta frame: the "cockpit" is a cradle of violet light and crystal.` |
| `anika` | `Anika Sen, late 30s, tied-back black hair, square glasses, olive rescue suit; AEGIS cockpit, sturdy rescue-vehicle controls, olive and white.` |
| `corin` | `Corin Vale (see portraits-relief row 2 for appearance); NAUTILUS cockpit, deep-sea blue, sonar displays.` |
| `leda` | `Leda Quill (see portraits-relief row 3); VESPER cockpit.` |
| `hugo` | `Hugo Rusk (see portraits-relief row 4); MASTODON cockpit.` |
| `noor` | `Noor Haddad (see portraits-outriders row 1); KESTREL cockpit.` |
| `emi` | `Emi Tanaka (see portraits-outriders row 2); CINDER cockpit.` |
| `orran` | `Orran Vey (see portraits-outriders row 3); ORPHEUS cockpit.` |
| `vale` | `Vale Ibrahim (see portraits-outriders row 4); PALISADE cockpit.` |
| `draike` | `Colonel Rhys Draike, 40s, dark undercut, red cybernetic eyes, navy uniform; EXECUTOR cockpit, black and gold, red sensor light.` |
| `vasse` | `General Ostrom Vasse, 60s, bald, beard, burn scars, orange eyes; TYRANT cockpit, olive and rust, gauges cracked, rebel insignia shapes (no text).` |
| `kroll` | `Admiral Viktor Kroll, 60s, slicked silver hair, gray eyes, ivory admiral's uniform; SOVEREIGN command throne, ivory and gold, cold white light.` |
| `ixion` | `Ixion, Vael herald, long pale violet hair, smooth white mask over the upper face with lavender eye slits; a throne of white crystal and solar-panel light.` |
| `aurelion` | `Aurelion, Vael emperor, long golden hair, glowing gold eyes, gold circlet; a radiant throne in the heart of an ark of light, many halos.` |

For auxiliary pilots, paste the matching row's description from `assets/prompts/portraits-relief.txt` or `portraits-outriders.txt` in place of the "see" note.

---

## R-04 Finisher and combo splash art (P1)

**Folder:** `assets/splash/` · **File:** `<key>.png` · 1536 × 1024 single image · mech style.

```
Create a full-screen special-attack splash illustration for an original mecha anime game. One 1536x1024 image. A dynamic, dramatic key frame of the attack at its peak: strong diagonal composition, speed lines and energy in the attack's color, the machine large and in motion. Keep the LEFT 35% darker and less busy (the attack name is overlaid there in the game). No text, no letters, no logos, no borders.
ATTACK:
```

| key | Attack |
|---|---|
| `aurora_break` | `ALTEON (white-blue falcon knight, feather-blade wings) performs AURORA BREAK: a flurry of cyan saber slashes ending in a wide cyan beam, wings flared.` |
| `requiem_zero` | `ALTEON ZERO (pearl-white and indigo, gold halo, translucent cyan light-feather wings) performs REQUIEM ZERO: hundreds of light-feathers converge into a single radiant strike.` |
| `aurora_smash` | `ALTEON GIGAS (heavy horned white-blue super robot, dark blue cape) performs AURORA SMASH: a giant glowing rocket punch followed by a pillar of light.` |
| `gale_dance` | `SYLPH (slim white-teal-pink jet harpy) performs GALE DANCE: a whirlwind of teal blade arcs around a target.` |
| `final_kaiser_inferno` | `GAIA KAISER (black-crimson lion-maned super robot) performs FINAL KAISER INFERNO: the chest lion emblem erupts in a torrent of golden fire.` |
| `trinity_storm` | `TRINITY ARC (orange excavator titan on treads, huge drill) performs TRINITY STORM: a spinning drill wrapped in a gravity vortex.` |
| `lunar_requiem` | `NOCTIS (moth psy-frame, violet eye-spot wings) performs LUNAR REQUIEM: a crescent moon of light formed by orbiting crystal bits.` |
| `scarlet_requiem` | `CARMINE HOUND (crimson robotic wolf with a heat-blade tail) performs SCARLET REQUIEM: a crimson lunge leaving a burning trail.` |
| `requiem_of_stars` | `SERAPHYNE (pearl-and-violet sky manta with a knight torso and gold trident) performs REQUIEM OF STARS: a rain of falling stars pulled by gravity.` |
| `names_remembered` | `VESPER performs NAMES REMEMBERED (see assets/prompts/allied-vanguard.txt for VESPER's design).` |
| `return_address` | `KESTREL performs RETURN ADDRESS (see assets/prompts/allied-outriders.txt).` |
| `second_shift` | `CINDER performs SECOND SHIFT (see assets/prompts/allied-outriders.txt).` |
| `a_single_voice` | `ORPHEUS performs A SINGLE VOICE (see assets/prompts/allied-outriders.txt).` |
| `combo_falcon_gale` | `COMBINATION: ALTEON and SYLPH perform FALCON GALE together, flying in a double helix of cyan and teal light.` |
| `combo_gaia_spiral_crusher` | `COMBINATION: GAIA KAISER and TRINITY ARC perform GAIA SPIRAL CRUSHER: Kaiser's fire channelled through Trinity's drill.` |
| `combo_crimson_deadline` | `COMBINATION: CARMINE HOUND and TALOS (heron sniper walker) perform CRIMSON DEADLINE: the wolf drives the target into the heron's rail-gun line.` |
| `combo_starlit_requiem` | `COMBINATION: NOCTIS and SERAPHYNE perform STARLIT REQUIEM: moth wings and manta wings framing a sky of falling light.` |

Use the design lines in `ART_PROMPTS.md` / `assets/ART_PROMPTS_revised.md` for any unit that looks off-model.

---

## R-05 Extra portrait expressions (P2)

**Main cast:** `assets/portraits/<pilot_id>_b.png` · 1024 × 1024 · 2 × 2 grid, same framing and background as the original portraits (flat deep navy #101A33) · character style.

```
Create a second expression sheet for the SAME character as the existing portrait (match face, hair, outfit and framing exactly). LAYOUT (strict): 1024x1024, 2x2 grid, head and shoulders, three-quarter view facing RIGHT, identical crop. Top-left: sad, eyes glistening. Top-right: confident half-smile. Bottom-left: battle shout, mouth open. Bottom-right: quiet and thoughtful, eyes lowered. Background: flat solid deep navy #101A33. No text.
CHARACTER: (paste the character's line from the original portrait prompts)
```

Make sheets for: `rei`, `rina`, `mira`, `gunnar`, `ilse`, `brann`, `odessa`, `jin`, `yuna`, `lucien`, `sera`, `kroll`, `aurelion`.

**Auxiliary pilots:** `assets/portraits/portraits-relief_b.png` and `portraits-outriders_b.png`, using the same 2048 × 2048, 4 × 4 atlas prompt as the originals in `assets/prompts/portraits-relief.txt` and `portraits-outriders.txt`, with the columns changed to: sad, confident, battle shout, thoughtful.

---

## R-06 New event scenes (P1)

**Folder:** `assets/events/` · 1536 × 1024 · scene style (people and mechs allowed; keep the bottom quarter calm for dialogue).

| key | Moment | Prompt |
|---|---|---|
| `ev_launch` | c1 end | `The battered cruiser Halcyon lifting off from a burning mountain base at night, searchlights sweeping the smoke, small mechs on its deck.` |
| `ev_shelter` | i1 | `Civilians filing into a mountain shelter tunnel at night while two mechs stand guard at the entrance under emergency lights.` |
| `ev_hound` | c4 | `A crimson robotic wolf mech crouched on the girders of a space elevator, red eyes glowing, the tower vanishing into the clouds.` |
| `ev_names` | i4 | `Hundreds of handwritten name ribbons tied to a railing high on a space elevator, fluttering above the clouds at sunset; a lone mech nearby.` |
| `ev_trinity` | c5a | `Three drill-tanks combining into an orange excavator titan inside a glowing organic cavern, sparks and dust.` |
| `ev_prime_bow` | c6a (peace) | `A colossal ancient creature crowned with crystal spires lowering its head before a small white falcon-winged mech in a ruined city at dusk.` |
| `ev_funeral` | c6a end | `A dawn funeral on a starship flight deck: crew in a line, a young man in a crimson-and-black jacket standing beside a kneeling red-and-black lion-maned super robot.` |
| `ev_yuna` | c5b | `A slender moth-winged psy-frame mech turning away from a rebel fleet toward a white falcon-winged mech, violet light breaking through chains of red energy.` |
| `ev_lethe` | c5b end | `A woman captain with a silver bob sitting alone in dim quarters, an old uniform in a glass case behind her, a recorded colony on a screen going dark.` |
| `ev_herald` | c7 | `An angelic giant of white crystal with solar-panel wings and halos descending in front of Earth, a fleet of light behind it.` |
| `ev_sera` | c7 | `A pearl-and-violet sky manta with a knight torso turning its trident against a fleet of light to shield a small white mech.` |
| `ev_kroll_fall` | c8 end | `A colossal ivory-and-gold cathedral-walker fortress collapsing into a stormy sea off a coastal city, banners burning.` |
| `ev_night` | c8 end | `The night before the final battle: a starship's observation deck, two pilots seen from behind on a bench, Earth below.` |
| `ev_molting` | i6 | `A chamber of translucent cocoons inside a living hive, something vast and luminous stirring within one of them.` |
| `ev_dark_repeats` | i8 | `A field of stars going out one by one, reflected in the visor of a lone mech drifting in space.` |
| `ev_end_normal` | c9 normal ending | `A quiet ruined Antarctic shelf after battle: a broken golden spear in the ice, the sky clear but one patch of stars missing.` |

---

## R-07 Ending art and epilogues (P2)

**Endings** (`assets/events/`, 1536 × 1024, scene style). Final names come from task N1; use these working keys:
- `ev_end_costly`: `A victory parade under grey skies, half the seats empty, flags at half-mast, a white falcon-winged mech kneeling in salute.`
- `ev_end_alliance`: `Humans and luminous Vael figures together on a restored colony deck, an ark of light docked beside the Halcyon, children pointing upward.`
- (`ev_dawn` already covers the true ending.)

**Epilogue images** (`assets/epilogues/<pilot_id>.png`, 1024 × 1024 single scene, character style; one per playable pilot, 18 total):
```
Create a single quiet epilogue illustration for an original mecha anime game: the character's life after the war, warm natural light, a small detail that ties to their story. No text.
CHARACTER AND SCENE:
```
Examples (write the rest from docs/narrative/CAST.md once N1 exists):
- `rei`: `Rei Kasuga sitting in a hangar at night beside a sleeping white falcon-winged mech, listening to its core hum, a faint smile.`
- `mira`: `Mira Solenne teaching a flight class on a sunny airfield, a small teal jet behind her, her father's old cap on a bench.`
- `brann`: `Brann Okonkwo planting a tree in a memorial garden while a red-and-black lion-maned robot shades him.`

---

## R-08 Emblems and system icons (P2)

**Folder:** `assets/icons/` · 1024 × 1024 · 4 × 4 grid · same icon style block as the original pack (rounded-square metal badges, flat charcoal #2B2B2B background).

**`icons_emblems.png`**
```
1 Terran Concord (a laurel ring around a stylized globe, steel and gold), 2 Orbital Free States (a broken chain around a rising colony cylinder, olive and orange), 3 Ourobor (a coiled biomechanical serpent eating its tail, plum and lime glow), 4 Vael (a crystal star inside concentric halos, violet and white),
5 Halcyon crew (a kingfisher in flight over a starship bow, teal and white), 6 Okonkwo Lab (a lion head over a gear, crimson and gold), 7 Kestrel Base (a small falcon over mountains, navy and silver), 8 The Silence (a black circle with a thin white rim),
9 Easy difficulty (a single green chevron), 10 Normal (two blue chevrons), 11 Hard (three red chevrons), 12 Requiem (three chevrons over a black star),
13 Ace medal (a winged medal), 14 Bond link (two interlocked rings with a spark), 15 Secondary objective (a gold star with a point), 16 Reinforcement warning (a red triangle with arrows entering).
```
**`icons_systems.png`**
```
1 Defend target (shield over a tile), 2 Escort (two figures with an arrow), 3 Escape zone (a door with an arrow out), 4 Survive timer (an hourglass),
5 Capture beacon (a flag on a tower), 6 Timed destroy (a target with a clock), 7 Boss phase (a crown split in two), 8 Deploy slot (a hangar bay),
9 Support Defend (a cyan shield in front of an allied silhouette), 10 Combination attack (two crossing comets), 11 Pilot training (a dumbbell with a star), 12 Full-upgrade bonus (a gear with a laurel),
13 Part shop (a crate with a price tag shape, no numbers), 14 Crafting (a wrench and a gear merging), 15 Talk scene (two speech bubbles without text), 16 Epilogue (an open book with a sunrise).
```

---

## R-09 Map tokens (optional, P3)

Dedicated small tokens read better on the map than scaled-down battle sprites. **Folder:** `assets/tokens/` · 2048 × 2048 · 4 × 4 atlas, one unit per cell, single pose, transparent or flat #2B2B2B background.
```
Create a 4x4 atlas of tactical map tokens for an original mecha game. Each cell: ONE unit in a compact three-quarter TOP-DOWN view (camera from above at 60 degrees), facing RIGHT, bold silhouette and clear colors readable at 48 pixels, thick dark outline, no ground shadow. Same scale across cells. No text.
CELLS (reading order):
```
Group the 62 units into four atlases by faction (`tokens_allied.png`, `tokens_concord_fs.png`, `tokens_ourobor.png`, `tokens_vael.png`), using each unit's design line.

## R-10 Tile transitions (optional, experimental, P3)

`assets/tiles/tiles_<set>_edges.png` · 1024 × 1024 · 4 × 4 top-down tiles filling each cell: water/ground edges (N, E, S, W), outer corners (NE, SE, SW, NW), inner corners (NE, SE, SW, NW), road/ground edges (N, E, S, W). Image models struggle with exact edge alignment; A2 includes a procedural blending fallback, so treat these as an upgrade.

## R-11 Codex illustrations (optional, P3)

`assets/codex/<entry_key>.png` · 1024 × 1024 · scene style, one per codex entry (16), e.g. `ashfall`: `the Kestrel Valley crater ten years after the disaster, a field of crystal shards glowing faintly at dusk`.

## R-12 Store and marketing art (P2)

**Folder:** `assets/store/` · scene or mech style · no text (the logo is added later):

| file | size | Prompt |
|---|---|---|
| `capsule_main.png` | 1840 × 860 (scale to 920 × 430 / 460 × 215) | `ALTEON and GAIA KAISER back to back against a sky split between a burning Earth city and an ark of violet light; Seraphyne and Carmine Hound in the background; strong central composition with space at the top for a logo.` |
| `hero_wide.png` | 3840 × 1240 | `A panoramic battle: the Halcyon cruiser at center, allied mechs fanning out, Ourobor swarm on the left, Vael fleet on the right, Earth's curve below.` |
| `cover_vertical.png` | 1200 × 1800 (scale to 600 × 900) | `ALTEON ZERO rising with light-feather wings, the cast's faces faint in the sky above, the Silence as a black circle at the top.` |
| `screens_frame.png` | 1920 × 1080 | `A clean dark-navy backdrop with subtle panel lines and soft cyan glow, for framing screenshots.` |

---

## M Music (P1–P2)

**Folder:** `assets/music/` · `<key>.ogg` (Vorbis q6) with optional `<key>.mp3` fallback · 44.1 kHz stereo · seamless loop (start and end at the same musical point) for loops · normalize to about **−16 LUFS integrated** (stingers about −14 LUFS) · instrumental unless noted · original melodies only.

**Prompt template** (for a music generator):
```
Instrumental, original composition, anime mecha tactics RPG soundtrack, high production quality, seamless loop, no vocals, no resemblance to existing songs. [TITLE]: [DESCRIPTION]. [BPM] BPM, [LENGTH].
```

**Existing keys** (already synthesized; recorded versions wanted): the 12 keys in `assets/prompts/MUSIC.md` (`title`, `calm`, `tense`, `sad`, `hope`, `player`, `enemy`, `concord`, `free_states`, `ourobor`, `vael`, `final_boss`). Use the descriptions there; 2–3 minute loops.

**Character themes** (play during that pilot's battle exchanges; 1:30–2:00 loops):

| key | Title and description |
|---|---|
| `theme_rei` | **Resonance**, 148 BPM. Heroic, bright minor-to-major lift, soaring lead over driving strings and rock drums, a bell motif echoing the core's "song". |
| `theme_mira` | **Fly, Kiddo**, 160 BPM. Fast, light and defiant; agile synth lead, syncopated guitar, a wistful bridge for her father. |
| `theme_gunnar` | **Old Bear**, 110 BPM. Swaggering blues-rock with brass stabs, heavy and warm. |
| `theme_ilse` | **Broadside**, 100 BPM. Stately naval march, low brass and timpani, a restrained melody carrying guilt and resolve. |
| `theme_brann` | **Gaia, Rise!**, 150 BPM. Classic hot-blooded super-robot anthem, big brass hits, choir-free, triumphant key change. |
| `theme_odessa` | **One Shot**, 96 BPM. Cool and sparse: muted trumpet, brushed drums, long silences, a single ringing piano note. |
| `theme_jin` | **Three Hearts**, 140 BPM. Industrial rock with a three-note motif passed between instruments. |
| `theme_yuna` | **Lullaby for the Stars**, 120 BPM. Ethereal, music-box motif growing into a full orchestral swell. |
| `theme_lucien` | **Crimson Hound**, 156 BPM. Rival theme: aggressive minor-key strings, dramatic piano runs, noble and tragic. |
| `theme_sera` | **Starborn**, 132 BPM. Alien elegance: harp and synth choir pads over taiko-like drums. |
| `theme_aux_relief` | **Shelter Line**, 128 BPM. Shared theme for Anika, Corin, Leda, Hugo: determined, hopeful, rescue-team energy. |
| `theme_aux_outriders` | **Outriders**, 144 BPM. Shared theme for Noor, Emi, Orran, Vale: road-movie rock, fast and scrappy. |

**Boss themes:** `boss_draike` (**Orders Are Orders**, 128 BPM, cold militaristic electronica), `boss_vasse` (**Hammerfall**, 136 BPM, furious industrial), `boss_kroll` (**Necessary Sacrifice**, 112 BPM, grand dark orchestral with organ), `boss_ixion` (**The Herald Speaks Once**, 120 BPM, choir-like synths and glass percussion), `boss_aurelion` (**Ten Thousand Quiet Worlds**, 104 BPM, majestic and sorrowful, solo violin over orchestra).

**Story and system:** `talk_warm` (**Coffee Still Terrible**, 84 BPM, cozy acoustic guitar and light percussion, for Halcyon talks), `talk_light` (**Off Duty**, 96 BPM, playful), `briefing` (**Mission Briefing**, 100 BPM, pulsing tension under a steady melody), `ending_normal` (**The Song Continues**, 70 BPM, bittersweet piano and strings, 3:00, no loop), `ending_true` (**Fourth Dawn — Finale**, 90 BPM, full orchestral reprise of `hope` and `theme_rei`, 3:30, no loop), `credits` (4:00, a medley of the main themes).

**Stingers** (no loop, 2–6 s): `st_victory` (triumphant brass flourish), `st_defeat` (low falling strings), `st_levelup` (bright ascending arpeggio), `st_item` (short sparkle chime), `st_choice` (a single resonant bell), `st_chapter` (dramatic hit and swell for chapter title cards).

**Optional vocal ending song** (`ending_vocal`, original lyrics; credit the singer): a hopeful anime-style ballad. Chorus seed: *"Sing it louder than the dark, / every name a burning spark, / we were never meant to fall in silence — / this is the fourth dawn."*

That is 41 tracks: 12 recorded versions of existing themes, 12 character themes, 5 boss themes, 6 story/system tracks and 6 stingers (the vocal song is extra).

---

## S Sound effects (P2)

**Folder:** `assets/sfx/` · `<key>.ogg` (+ optional `.mp3`) · 44.1 kHz · mono unless noted · trimmed with no leading silence · peaks around −3 dBFS, perceived loudness matched within each group. Prompt template for a sound generator: `Video game sound effect, anime mecha, crisp and punchy, no music: [DESCRIPTION], [LENGTH].`

| Group | key — description |
|---|---|
| Weapons | `beam_rifle` (sharp sci-fi laser shot with a short tail, 0.5 s) · `beam_heavy` (charging hum into a massive beam roar, 2.5 s) · `rifle_kinetic` (heavy autocannon shot, 0.4 s) · `vulcan` (rapid chain-gun burst, 1 s) · `cannon_shell` (big artillery boom with echo, 1.5 s) · `railgun` (electric charge whine then a crack, 1.5 s) · `missile_launch` (whoosh and ignition, 0.8 s) · `missile_salvo` (many launches in sequence, 2 s) · `plasma_orb` (bubbling energy, release burst, 1.2 s) · `gravity_well` (deep implosion, warped low-frequency suck, 2 s) · `funnel_bits` (several small zips and pew bursts, 1.5 s) · `breath_fire` (roaring stream of flame, 2 s) · `lightning` (electric crack and buzz, 1 s) · `sonic_shriek` (organic screech, 1 s) |
| Melee | `saber_ignite` (energy blade hum on, 0.6 s) · `slash_light` (fast metallic swish, 0.3 s) · `slash_heavy` (massive blade whoosh and clang, 0.7 s) · `rocket_punch` (rocket ignition and whoosh, 1 s) · `drill` (high-torque drill grinding into metal, 2 s) · `claw` (organic slash and tear, 0.5 s) |
| Impacts | `hit_metal_small` · `hit_metal_big` · `hit_organic` · `hit_crystal` (glassy ring) · `barrier_block` (energy shield deflect) · `critical` (impact with a bright ring) · `miss_whoosh` · `explosion_small` · `explosion_big` (stereo) · `destroy_chain` (several explosions into a big boom, stereo, 3 s) |
| Movement | `step_heavy` (giant mech footstep) · `step_light` · `treads` (tank tread loop, 2 s, loopable) · `jet_thrust` (burst of thrusters) · `hover_loop` (soft hover hum, loopable) · `flap_wings` (large mechanical wing beat) |
| Story & UI | `ui_hover` · `ui_select` · `ui_confirm` · `ui_cancel` · `ui_error` · `menu_open` · `menu_close` · `text_blip` (soft, 30 ms) · `spirit_cast` (shimmering activation) · `cutin_sting` (whoosh and flash for cut-ins) · `phase_change` (deep alert tone) · `secret_found` (sparkle and chime) |

That is 48 effects. Faction vocalizations (Ourobor screeches, Vael choir tones) can come later.

---

## V Voice barks (optional, P3)

**Folder:** `assets/voice/` · `<pilot_id>_<context>_<n>.ogg` · mono, 44.1 kHz, about −16 LUFS, trimmed. Contexts: `attack`, `finisher`, `hit`, `dodge`, `kill`, `lowhp`. 2–3 takes per context per main pilot. Lines come from task N3 (`js/data/battle-lines.js`). Use human voice actors or properly licensed synthetic voices with consent; do not clone real people's voices. Subtitles always show, so voice is purely additive.
