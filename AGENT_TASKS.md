# Iron Requiem — Task Prompts for Agents

Each task below is a **self-contained prompt**. Paste the **Shared brief** (section 0) followed by **one task** into a fresh agent session that has this repository. Tasks are sized for one session each.

| # | Task | Depends on | Size |
|---|---|---|---|
| 1 | Elite, Commander and Corrupted enemy variants | — | M |
| 2 | 16 new enemy types (roster expansion) | 1 recommended | L |
| 3 | Combination attacks and Support Defend (SRW systems) | — | M |
| 4 | Per-unit art metadata and importer tuning (after real art arrives) | real art | M |
| 5 | Chapter coverage tests and a full-campaign QA pass | — | L |
| 6 | Balance pass (all 10 missions, both routes) | 5 recommended | M |
| 7 | Performance: quality settings and software-renderer detection | — | S |
| 8 | Save slots, export/import, save migration | — | S |
| 9 | Music: per-chapter themes and boss themes | — | M |
| 10 | Touch / small-screen UX pass | — | M |

Recommended order: 7 → 1 → 2 → 5 → 3 → 6 → 8 → 9 → 10, with 4 whenever real art lands.

---

## 0. Shared brief (paste before every task)

```
You are working on IRON REQUIEM, an original browser tactical mecha RPG in the style of Super Robot Wars 4th. It is plain HTML/CSS/JavaScript with no build step and no framework. All code is classic <script> globals loaded in order from index.html. three.js r147 is vendored in vendor/three/ (legacy examples/js build, globals on THREE).

HOW TO RUN
- Serve the folder: `python3 -m http.server 8000` in the repo root, open http://localhost:8000.
- Opening index.html from disk also works, but imported art can't have its background removed there.

ARCHITECTURE (read the files you touch before editing)
- js/data/types.js   ATK (7 attack types), ARMOR (6 classes), CHART[atk][armor] multipliers, STATUS (BURN/SHOCK/BREAK/SLOW/JAM), TERRAIN + TERRAIN_NOTE, SECRETS, SPIRITS.
- js/data/mechs.js   MECHS: every unit. W(name,type,pow,rmin,rmax,{acc,crit,en,ammo,will,post,anim,status,finisher,seq,cut}) builds weapons. Fields: armor, size (S/M/L/XL), hp, en, arm, mob, move, fly, ship, abil {barrier, regenHP, regenEN}, vis (2D/3D fallback art spec).
- js/data/pilots.js  PORTRAITS (2D fallback faces), NAMES, PILOTS (player pilots: stats, growth, spirits by level, capstone, battle lines), EPILOTS (enemy battle lines), buildTree(pid) (3 branches x 5 nodes).
- js/data/story.js   CODEX and CHAPTERS. A chapter has pre/post scripts, map {w,h,theme,seed,space}, deploy, enemies via E(mechId,x,y,lvl,{boss,tag,pilot,hold,retreat,protect,lineSet,hpMul,name}), events [{at:{turn,phase}|{enemies:n}|{defeated:tag}|{hp:{tag,below}}, cond, repeat, script, add, ally, join, retreat, defect, upgrade}], win ('rout' | {boss} | {bosses}), lose, vital, bonus, reward, next. Script commands: bg, m, n, s/e/t, title, choice, label/go/if, codex, set, res, join, fx, cg, cgEnd, remove, endmap, end.
- js/battle/combat.js  CB: stats (pstats/mstats with upgrades, parts, skills), hit/crit/damage formulas, type chart, positioning (flank, pincer, formation, high ground), knockback flag, roll/applyResult, bestWeapon. PARTS and UPG live here.
- js/battle/scene.js   SCENE.play({left,right,bg,events}): the battle animation. Actors are 3D rigs, or painted sprites when ASSETS has the unit. Attack animations are keyed by weapon.anim (rifle, vulcan, cannon, missile, beam, megabeam, slash, multislash, punch, drill, funnel, plasma, gravity, spirit, breath, railgun, lightning, wave, finisher with seq).
- js/map/tactics.js    MAP: map generation (genMap), terrain render, pathfinding, player input, AI (aiAct), phases, battle() orchestration (counter/evade/defend, support attack, knockback, rewards, EXP), secrets, events (runEvents), win/lose.
- js/render/mechart.js 2D procedural fallback art (ART.drawMech, ART.portrait, ART.drawBG).
- js/render/r3d.js     three.js: R3D.buildRig(vis, mechId) (humanoid KITS table + SPECIAL builders for vehicles/animals), battle stage with bloom and 3D environments, map sprite snapshots, terrain bake.
- js/render/assets.js  ASSETS: optional generated art importer (units, portraits, backgrounds, battle, tiles, icons, key art, events). See ART_PROMPTS.md for formats and names.
- js/ui/ui.js          UI: story player, map HUD, forecast, defense prompt, intermission tabs, modals.
- js/main.js           SAVE (localStorage key 'iron-requiem-save-v1'), GAME controller (title, setup, chapters, endings).
- ART_PROMPTS.md       Prompt pack for generated art. Any new unit, pilot, background or icon needs an entry here in the same format.
- tests/e2e.js         Playwright end-to-end test (chapter 1 through chapter 2 start). tests/make_placeholder_art.py makes fake art in the importer's format.

RULES
- Keep the no-build, script-globals structure. Add new files as <script> tags in index.html in dependency order, and mirror them in artifact.html (the publishable copy without the <html>/<head>/<body> wrapper).
- No new external network dependencies at runtime. Vendor anything you need.
- Every art asset stays optional: missing art must fall back to the 3D/2D art.
- Keep existing saves loadable. If you change the SAVE shape, add a migration in main.js (cont()).
- Original content only. Don't recreate characters, mechs or names from existing franchises.
- Match the existing code style: compact functions, no frameworks, comments only where the why isn't obvious.
- If the folder is not a git repository, run `git init` and commit the current state before you change anything, then commit your work at the end with a clear message.

DEFINITION OF DONE (every task)
1. `node --check` passes for every JS file you touched.
2. The end-to-end test passes:
     python3 -m http.server 8000 &   (from the repo root)
     node tests/e2e.js http://localhost:8000/index.html /tmp/shots run
   It must print "PASS: no page errors". Look at the screenshots it writes.
3. Anything you add that a player sees has been checked in a screenshot, not just in code.
4. Report what you changed, what you tested, and anything left unfinished. Don't claim untested behaviour works.
```

---

## Task 1 — Elite, Commander and Corrupted enemy variants

```
TASK: Add enemy variants so one unit design can appear as several difficulty tiers without new art.

DESIGN
- Variants: 'elite', 'commander', 'corrupted'. A spawn opts in with a new option in story.js enemy specs and event adds, e.g. E('lancer', 11, 3, 6, { variant: 'elite' }).
- Effects (put the table in one place, e.g. a VARIANTS object in js/data/types.js):
  - elite: HP x1.4, armor x1.15, mobility +10, accuracy +10, one extra enemy skill ('prevail'), name prefix "Elite ".
  - commander: HP x1.8, armor x1.2, all stats +15, skills 'prevail' + 'nerves'; gives allied enemies within 2 tiles +10 hit/eva (reuse the aura() idea in combat.js); name prefix "Cmdr. "; counts as boss-lite for rewards.
  - corrupted (Ourobor or Vael only, late game): HP x1.5, every hit has +15% chance to inflict its weapon status, regenerates 5% HP per phase, name prefix "Corrupted ".
- Rewards: EXP and credits x1.5 (elite), x2 (commander), x1.75 (corrupted).
- Visuals, all code-only:
  - Map: a small badge on the unit (silver chevron = elite, gold star = commander, violet thorn = corrupted) and a tinted base ring.
  - Battle, painted sprites: tint via ctx.filter (elite: saturate(1.3) brightness(1.05); commander: a gold rim glow drawn behind the sprite; corrupted: hue-rotate toward violet + dark aura particles).
  - Battle, 3D rigs: emissive tint on rig materials (R3D rig.mats) and an aura sprite.
  - Unit panel and forecast show the variant name and a one-line description.
- Placement: add variants across the campaign so the second half has 20–35% elites, and give each faction's mid/late maps one commander. Keep chapters 1–2 variant-free.

FILES: js/data/types.js, js/map/tactics.js (makeUnit, drawUnit, rewards), js/battle/combat.js (stats, aura), js/battle/scene.js (sprite tint/aura), js/render/r3d.js (rig tint), js/ui/ui.js (showUnit, forecast), js/data/story.js (placements).

ACCEPTANCE
- A screenshot of each variant on the map and in battle (temporarily spawn them in chapter 1 for the screenshot, then revert).
- Unit stats in the side panel reflect the multipliers.
- e2e test passes.
```

---

## Task 2 — 16 new enemy types

```
TASK: Expand the enemy roster from 17 to 33 types so each faction has a light, heavy, flyer, support and specialist unit, and place them in the campaign. Each needs data, a 3D fallback, a battle animation choice, and an art prompt.

NEW UNITS (original designs; ids in brackets)
Ourobor (BIO armor):
 1. Spitter [spitter], artillery bio-beast: squat body, a swollen acid sac and a long spine-cannon. Long-range PLAS, BURN. Slow.
 2. Burrower [burrower], drill-worm: segmented worm with a rotating rock-grinding maw. Ignores terrain cost on hive/ruins tiles; KIN melee with BREAK.
 3. Broodmaw [broodmaw], carrier: bloated beetle with a dorsal egg sac. Every 2 enemy phases spawns 1 crawler adjacent (max 3 alive per broodmaw).
 4. Skyray [skyray], fast bio-manta flyer: wide membrane wings, whip tail. BLADE hit-and-run, high mobility.
Terran Concord (LIGHT/HEAVY/COAT):
 5. Valkyr [valkyr], interceptor jet-mech: variable-wing jet with arms, missiles + vulcans. Fast flyer.
 6. Aegis Drone [aegis], support: floating shield drone. Gives adjacent enemies Iron Wall-like damage reduction (−30%) and has its own small barrier.
 7. Siege Crawler [siegecrawler], tracked artillery tank with a twin railgun turret. Long range KIN, cannot counter at range 1.
 8. Shade [shade], stealth commando: matte-black slim humanoid with an optical-camo cloak. Very high evasion; first attack each map gets +30 hit.
Orbital Free States (COAT/HEAVY):
 9. Rigger [rigger], repair support: industrial work-frame with crane arms and welding torches. Heals an adjacent ally 2500 HP per enemy phase.
10. Harpoon [harpoon], hunter: lean frame with a shoulder harpoon gun on a chain. Attack pulls the target 1 tile toward it (inverse of knockback).
11. Breaker [breaker], demolition heavy: hulking mining frame with explosive charges and a pile driver. EXPL, strong vs HULL.
12. Gale [gale], colony-skiff: small one-pilot space bike-mech, very fast, weak, appears in packs.
Vael (VOID):
13. Cantor [cantor], support: tall robed crystal figure that "sings". Buffs allied Vael +10 Will each phase and cleanses one status.
14. Seraph Lancer [seraphlancer], fast melee: winged light-cavalry knight with a long lance; charges (post-move melee with bonus damage after moving 4+ tiles).
15. Monolith [monolith], immobile turret: floating obelisk with a prism core. Move 0, very long-range BEAM/GRAV, barrier.
16. Echo [echo], decoy: mirror-crystal humanoid. When it is targeted, 30% chance the attack hits a phantom instead (show "PHANTOM").

FOR EACH UNIT
- MECHS entry in js/data/mechs.js (stats in line with existing units of the same tier; 2–3 weapons using existing anim types).
- Special rules implemented generically: add an `abil` flag (e.g. abil.spawner, abil.healer, abil.pull, abil.decoy, abil.guardAura, abil.cantor, abil.charge, abil.firstStrike) and handle it in tactics.js phase processing / battle(). Prefer reusable flags over unit-id checks.
- 3D fallback in js/render/r3d.js: a KITS entry (humanoids) or a SPECIAL builder (vehicles/animals), reusing existing builders where they fit (walker, treads, crab, manta, jelly, wolf, heron, humanoid kit). Each must look recognisably different from existing units in a gallery screenshot.
- An EPILOTS line set if it needs special battle lines.
- A unit block in ART_PROMPTS.md section 5 and its id in the file checklist, following the existing format exactly.
- Placement: put each new type into 1–3 chapters where its faction appears (story.js enemies or event adds). Don't remove existing enemies; replace at most a third of repeated grunts.

ACCEPTANCE
- Gallery screenshot of all 16 new 3D fallbacks (use R3D.snapshot like the existing gallery approach).
- One battle screenshot per special rule showing it working (spawn, heal, pull, decoy, aura, buff, charge, first strike).
- AI handles them sensibly (support units stay near allies; Monolith never moves; Gale packs flank).
- e2e test passes; note any chapter you could not play through.
```

---

## Task 3 — Combination attacks and Support Defend

```
TASK: Add two Super Robot Wars staple systems.

COMBINATION ATTACKS
- Defined pairs (data in js/data/mechs.js or a new js/data/combos.js):
  - Rei + Mira: "Falcon Gale" (Alteon/Alteon Zero + Sylph), SPIR, power 6800, both must be within 2 tiles of the target and adjacent to each other, both Will 120+, both pay EN.
  - Brann + Jin: "Gaia Spiral Crusher" (Kaiser + Trinity Arc), PLAS, 7600.
  - Lucien + Odessa: "Crimson Deadline" (Carmine + Talos), KIN, 6900.
  - Yuna + Sera: "Starlit Requiem" (Noctis + Seraphyne), SPIR, 8200, needs Will 130.
- Appears in the weapon list with a "COMBO" tag only when conditions are met; the forecast lists the partner.
- Uses both pilots' stats (average of the relevant stat), counts as one attack, consumes both units' actions (partner is marked acted).
- Battle scene: both units appear (reuse the support-attack slide-in in scene.js), a split-screen cut-in with both portraits, then a chained sequence of existing anims ending in a shared finisher.

SUPPORT DEFEND
- New pilot skill node 'guard' (add to buildTree for Gunnar, Ilse, Jin and Brann as a replacement for their b2 node, or as an extra pick; explain your choice).
- When an enemy attacks an ally adjacent to a unit with 'guard', the player is offered "Support Defend by <name>" in the defense prompt; the guard unit takes the hit in Defend mode instead. Max once per guard unit per enemy phase.
- Battle scene: the guard unit slides in front of the target.

FILES: js/data/*, js/battle/combat.js, js/map/tactics.js (battle orchestration, defense prompt flow), js/battle/scene.js, js/ui/ui.js.
Add icons for the new skill node to ART_PROMPTS.md (append to an icon sheet's spare slot plan or add a new sheet icons_extra with the same format, and wire it in js/render/assets.js ICON table).

ACCEPTANCE: screenshots of a combo forecast, the combo cut-in, and a support defend battle. e2e passes.
```

---

## Task 4 — Per-unit art metadata and importer tuning (run after real art arrives)

```
TASK: Real generated art now exists in assets/. Make it look right in game.

1. Run the game through the local server and screenshot every unit that has a sheet: map icon, battle idle, attack and hit frames, intermission hangar view. Note problems: leftover background halos, cut-off weapons, wrong ground line, frames that differ in scale, muzzle flashes appearing far from the gun.
2. Add optional per-unit metadata files assets/units/<id>.json, for example:
   { "anchors": { "muzzle": [0.92, 0.38], "core": [0.5, 0.45], "head": [0.55, 0.12] }, "ground": 0.97, "scale": 1.0, "fly": true, "keyTolerance": 40, "facesLeft": false }
   Coordinates are fractions of the cropped frame. Load them in js/render/assets.js next to each sheet, and use them in js/battle/scene.js (sprite anchors for beams, missiles and impact points) instead of the generic fractions.
3. Tune keyCell() in js/render/assets.js if needed: tolerance, edge softening, a despill pass for dark fringes, and protection for dark interior areas connected to the border. Keep it fast (whole roster in under ~3 seconds).
4. Portraits: check the cover-crop on every UI slot (dialogue, battle HUD, banner, cut-in eye band). Add optional assets/portraits/<id>.json { "face": [x, y, size] } to steer crops if needed.
5. Document the metadata format at the end of ART_PROMPTS.md.

ACCEPTANCE: before/after screenshots for at least 6 units; e2e passes with and without the art folder.
```

---

## Task 5 — Chapter coverage tests and full-campaign QA

```
TASK: Prove every mission is completable on both routes, then fix what breaks.

1. Add a test helper (tests/campaign.js) that can start any chapter directly: write a SAVE with the right roster, levels, flags (route A/B, spared_lucien, ourobor_peace, zero, res) to localStorage before load, then drive the map: player attacks with the AI's own targeting (reuse CB.bestWeapon), auto-answers defense prompts, skips story, until victory or a turn cap. Log turns, losses, events fired, and page errors.
2. Run every chapter: c1, c2, c3, c4, c5a, c6a, c5b, c6b, c7, c8, c9 (both with and without the true-route flags), c10. Run c4's and c9's choices both ways.
3. Check story continuity by reading the scripts against the flags: who is in the roster at each chapter on each route, whether every deploy list matches the roster, whether Yuna, Sera, Lucien and Trinity join correctly on both routes, and whether the endings trigger as written (res >= 3 and the choice in c9).
4. Fix every crash, soft-lock and continuity error you find. Note design-level issues you didn't change.
5. Record results in tests/CAMPAIGN_REPORT.md: a table of chapter x route x result, with turns taken and notes.

ACCEPTANCE: every chapter reaches victory in the harness; e2e passes; the report is committed.
```

---

## Task 6 — Balance pass

```
TASK: Tune difficulty so the campaign is fair on a first playthrough and still tense late. Use tests/campaign.js from Task 5 if it exists (build a minimal version if not).

TARGETS
- Chapter 1–2: a new player wins without losing a unit; ~5–7 turns.
- Mid game: one or two units may be shot down without careful play; bosses take 3–5 attacks.
- Late game (c8–c10): bosses need spirit commands and positioning; ~8–12 turns.
- Type chart matters: effective hits feel clearly better; nothing is useless.
- Player levels at chapter start roughly: c1 1–2, c4 8–10, c7 15–18, c10 25–28.

LEVERS (prefer data over formula changes): enemy levels and counts in story.js, enemy HP/armor in mechs.js, EXP curve and credit rewards in tactics.js, upgrade costs (upgCost) and part availability in combat.js, spirit costs in types.js.

METHOD: simulate each chapter several times with the harness, log HP lost, turns, kills by type, damage by attack type. Change values in small steps. Keep a before/after table in tests/BALANCE.md.

ACCEPTANCE: BALANCE.md with numbers per chapter; e2e passes; no chapter regresses to unwinnable in the harness.
```

---

## Task 7 — Performance: quality settings and software-renderer detection

```
TASK: Make the game run smoothly on weak machines and laptops.

1. Add a Graphics setting (Auto / High / Low) in UI.settingsModal and SAVE.settings.
2. Auto: detect software rendering (WEBGL_debug_renderer_info contains "SwiftShader", "llvmpipe" or "Software") or a slow first frame, and pick Low.
3. Low mode: no 3D battle environment (painted backdrop or 2D background instead), bloom off, shadows off, map terrain uses 2D/tiles instead of the 3D bake, devicePixelRatio capped at 1, fewer particles (halve spawn counts in scene.js).
4. High mode: current behaviour.
5. Show the active mode and an FPS counter when ?debug is in the URL.
6. Measure: battle frame time and map frame time before/after in both modes; put the numbers in your report.

ACCEPTANCE: e2e passes in both modes (add a mode argument or URL parameter the test can use); timings reported.
```

---

## Task 8 — Save slots, export/import, migration

```
TASK: Replace the single save with 3 manual slots + 1 autosave, and let players back up saves.

- SAVE gets a version number (SAVE.v). Write a migrate(save) in main.js that upgrades v1 saves (the current shape) without data loss.
- Slots stored under separate localStorage keys; the old key becomes the autosave and is migrated on first load.
- Title "Continue" loads the most recent; a "Load" screen lists slots with chapter, playtime, roster leader portrait and timestamp.
- System tab: Save to slot, Load, Delete (with an in-page confirm, not window.confirm), Export (show the JSON in a textarea with a Copy button), Import (paste JSON, validate, migrate).
- Handle storage errors gracefully (private windows): show a clear message, keep playing.

ACCEPTANCE: screenshots of the load screen and export/import; manual test of migrating a v1 save; e2e passes.
```

---

## Task 9 — Music

```
TASK: Replace the placeholder chord pads in js/render/audio.js with real procedural music (still no audio files, WebAudio only), or support optional audio files.

- Themes: title, intermission (calm), story moods (tense, sad, hope), player phase, enemy phase, and one battle theme per faction (Concord march, Free States rock, Ourobor drone/percussion, Vael choir), plus a final boss theme.
- Optional files: if assets/music/<key>.mp3 or .ogg exists, play it instead (loop, crossfade). Add these keys to ART_PROMPTS.md as a short "Music" section describing each track for a music generator.
- Crossfade between tracks; respect the music volume setting; start only after a user gesture.
- Hook phase changes (MAP phaseStart) and battle start/end (SCENE.play) to switch themes; bosses use the boss theme.

ACCEPTANCE: a short recording or description of each theme; no audio errors in console; e2e passes.
```

---

## Task 10 — Touch and small-screen UX

```
TASK: Make the game fully playable on a phone in landscape and on a tablet.

- Map: tap to select, tap destination, tap again to confirm (show a confirm button), pinch or buttons to zoom, drag to pan when the map is larger than the screen. Hover info must be reachable by long-press.
- Side panel becomes a bottom sheet under 900px wide.
- Action menu, weapon list and forecast: large touch targets (44px+), never covering the selected unit.
- Story: tap anywhere to advance; Log/Auto/Skip reachable with thumbs.
- Battle: tap to fast-forward, a visible Skip button.
- Intermission: tabs scroll horizontally; skill tree stacks; no horizontal page scroll.
- Respect safe-area insets.

ACCEPTANCE: Playwright screenshots at 844x390 (phone landscape) and 1024x768 (tablet) for title, story, map with menus open, forecast, battle, and each intermission tab; e2e passes at desktop size and a phone-size variant you add.
```
