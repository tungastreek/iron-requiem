# Iron Requiem — Handoff: From Playable to Commercial

This handoff turns a complete, playable game into one that holds up next to commercial tactics RPGs. It has four parts:

1. **Audit:** where the game stands today, with evidence.
2. **Commercial bar:** measurable targets each workstream works toward.
3. **Shared brief:** paste this before any task prompt.
4. **Task prompts:** 18 self-contained tasks in six workstreams, with priority and order.

New art, music and sound requests are in [ASSET_REQUESTS_V2.md](ASSET_REQUESTS_V2.md). Agents integrate them; a person generates them.

---

## 1. Audit (repo at commit `94e0e0b`)

**Strong already**

- Painted art covers title, story backgrounds, battle backdrops, portraits with four expressions, 62 machines, tiles, icons and 8 event scenes. Title, story, pilot select, battle and the Frame Archive read as a commercial product.
- Systems breadth is there: 20 missions on two routes with a true ending, 18 playable pilots, combination attacks, Support Defend, enemy variants and 16 specialist enemies, parts, upgrades, skill trees, save slots, graphics quality modes, touch input, procedural score.
- Automated checks pass: end-to-end smoke test, a 114-run campaign simulation (113 wins), combo, enemy, save and presentation unit checks.

**Gaps that separate it from a commercial release**

| Area | Evidence | Why it matters |
|---|---|---|
| Story volume | ~6,100 words of dialogue and 9 choices across 20 missions. The 8 interludes have **no** in-mission events and ~11 lines each. The 8 auxiliary pilots have almost no arcs. | Story is half of this genre's appeal. Commercial games in the genre carry many times this, with dense in-battle dialogue. |
| Battle dialogue | One generic line pool per pilot; no rival or boss pairings. | Special pairing lines are a signature of the genre. |
| Tactical depth | 15 of 20 maps are "defeat all enemies". Most maps field 7–12 enemies with few reinforcements. Simulated wins take 2–5 turns against targets of 5–7 early and 8–12 late. Story maps are procedurally generated. | Without varied objectives, authored terrain and pressure, every map plays the same. |
| Difficulty | One difficulty, no tutorial. | New players need onboarding; veterans need challenge. |
| Art consistency | The painted `hangar.png` shows a **V-fin, Gundam-style mech**: an IP risk. The Sortie mission card still uses procedural art. No cockpit cut-ins or finisher splash art. | Lookalikes can block a release; cut-ins and splashes are what genre players expect. |
| Map presentation | Repeating tiles with hard seams, small unit sprites, unused black bands above and below the map, a "Codex updated" toast overlapping the zoom controls, and a phase banner that captures as a faint, widely spaced smear (confirm in a real browser). | The map is where players spend most of their time. |
| Audio | All music and effects are synthesized. No character themes, stingers or voice. | Recorded score and character themes are a genre hallmark. |
| Bugs seen | Frame Archive "New machines" lists enemies while the detail panel shows an allied unit. The Mechs tab weapon table misaligns columns on rows with extra fields. The title tagline shows a debug-style "112 art files loaded". | Small, but visible. |
| Release readiness | 488 MB repo, of which `assets/offline` is 278 MB of duplicated image data. No real-browser QA, frame timings or audio listening ever recorded (`tests/BROWSER_QA.md`). No credits screen, no packaging. | Size, stability and polish gates for shipping. |

---

## 2. The commercial bar

Each workstream aims for these targets. Report progress against them.

| Area | Target |
|---|---|
| Story | 35,000–50,000 words. Every mission has 3+ in-map story events. Every playable pilot has an arc of 3+ scenes. 25+ choices or flags that change something visible. Four endings plus per-pilot epilogue cards. |
| Battle dialogue | Lines for every pilot by context (attack, finisher, hit, dodge, kill, low HP, first meeting), plus 120+ special pairings (rivals, bosses, faction matchups). |
| Tactics | At most 40% of maps are "defeat all". Every story map is hand-authored. Typical clear time 8–14 turns. Each map has a secondary objective. Three difficulty modes. Bosses have phases. |
| Progression | Deploy selection, pilot training, full-upgrade bonuses, an ace system, and a meaningful credit and part economy. |
| Art | No fallback art in normal play. No franchise lookalikes. Cockpit cut-ins for the main cast, splash art for every finisher and combo, 24+ event scenes, ending art. |
| Audio | 30+ recorded or generated tracks including character themes. Sampled sound effects. Separate music, effects and voice volumes. Dialogue ducking. |
| UX | A tutorial that teaches the first two maps' systems. A glossary. Readable map. Keyboard, mouse, touch and controller. Text size and colourblind options. A credits screen. |
| Release | Real-browser QA matrix passed. 60 fps on a mid laptop in High. Download under 200 MB. No console errors. Saves stay compatible. A web build ready for itch.io, with an optional desktop wrapper. |

---

## 3. Shared brief (paste before every task)

```
You are working on IRON REQUIEM, an original browser tactical mecha RPG inspired by Super Robot Wars 4th. Plain HTML/CSS/JavaScript, no build step, no framework. Repo: tungastreek/iron-requiem.

LOADING
- index.html lists every game script as <script type="application/x-iron-requiem" data-game-src="..."> in dependency order; js/launch.js loads them in sequence (with retries over HTTP). A new script needs a new tag in the right place. Keep artifact.html in step if it mirrors index.html.
- Scripts are classic globals (const at top level is NOT a window property; use `typeof X !== 'undefined'` in tests).

KEY FILES (read before editing)
- js/data/: types.js (attack types, armor, chart, status, terrain, spirits, variants), mechs.js, pilots.js (+ skill trees), story.js (CODEX, CHAPTERS c1–c10 with scripts/events/maps), expansion.js (interludes i1–i8, auxiliary pilots and machines, atlas mappings), combos.js, enemy-deployments.js.
- js/battle/: combat.js (formulas, positioning, parts, upgrades), scene.js (battle animation; sprite actors from ASSETS, 3D rigs as fallback).
- js/map/: tactics.js (map, input, AI, phases, events, win/lose), enemy-systems.js (specialist enemy rules).
- js/render/: assets.js (art importer), art-metadata via assets/art-metadata.js, mechart.js (2D fallback), r3d.js (three.js fallback rigs and stages), audio.js (procedural score + SFX, optional recordings), quality.js (graphics modes).
- js/ui/: ui.js (story player, HUD, menus, intermission), saves.js, touch.js. js/main.js: SAVE, GAME controller.
- Story script commands and chapter/event schema: see the comments at the top of js/data/story.js.

ART AND AUDIO PIPELINE
- Art lives in assets/ (units, portraits, backgrounds, battle, events, tiles, icons, key). Formats: ART_PROMPTS.md and assets/ART_PROMPTS_revised.md. Optional per-unit/per-portrait JSON metadata is described in ART_PROMPTS.md.
- Music overrides: assets/music/<key>.ogg|mp3 (keys in assets/prompts/MUSIC.md).
- After adding or changing ANY image, metadata or music file: run `python3 tools/build_offline.py` (rebuilds assets/offline and the manifest so the game also loads from disk).
- Every asset stays optional: missing files must fall back gracefully.
- New asset requests and their file names are in docs/ASSET_REQUESTS_V2.md. If you need a new asset type, add it there in the same format and build the integration with a fallback first.

TESTS (run all that apply before finishing)
- `python3 -m http.server 8000` in the repo root, then `node tests/e2e.js http://localhost:8000/index.html /tmp/shots run desktop high` (also `desktop low`, `phone low`, `tablet auto` for UI work). Must print PASS.
- `node tests/combos.cjs`, `node tests/enemies.cjs`, `node tests/saves.cjs`, `node tests/presentation.cjs`, `node tests/launch.cjs`, `node tools/verify.cjs`, `node tools/verify_animation.cjs`. Read each file's header for arguments.
- Campaign simulation: tests/campaign.js (see tests/CAMPAIGN_REPORT.md for how results were produced). Re-run it after any gameplay change.
- Look at screenshots of anything a player sees. Headless Chromium uses SwiftShader; judge visuals, not frame rates, there.

RULES
- Original content only. No names, designs, logos or music that imitate existing franchises (watch for Gundam-style V-fins and faces, recognisable melodies).
- Keep existing saves loadable; add migrations in js/ui/saves.js or main.js when the SAVE shape changes, and extend tests/saves.cjs.
- Keep the no-build, script-global structure. No new runtime network dependencies; vendor anything you need.
- Work on a git branch named for the task, commit with clear messages, and do not push unless asked.
- Report honestly: what changed, what you tested (with commands and results), what you could not test, and anything left unfinished. Never present untested behaviour as working.
```

---

## 4. Task prompts

### Priority and order

| Tier | Tasks | Notes |
|---|---|---|
| 1 — must ship | S1, N1, N2, G1, G2, A2, U1, R1 | Release blockers, story spine, authored maps, AI and difficulty, map polish, onboarding, QA |
| 2 — genre expectations | N3, N4, G3, A1, A3, M1 | Battle dialogue, bonds and epilogues, progression depth, cut-ins and splashes, score |
| 3 — premium polish | M2, U2, R2, R3 | Sampled SFX and voice, accessibility and controller, packaging, IP review |

Suggested order: **S1 → N1 → (G1 ∥ A2) → G2 → N2 → U1 → G3 → N3 → N4 → A1/A3 (as art arrives) → M1 → M2 → U2 → R1 → R2 → R3**. N1 produces the beat sheet that N2, N3, N4 and G1 depend on.

---

### S1 — Release blockers from the audit (Tier 1, S)

```
TASK: Fix the visible defects found in the commercial audit.

1. IP risk: assets/backgrounds/hangar.png shows a V-fin, Gundam-style mech. Until the replacement from docs/ASSET_REQUESTS_V2.md (request R-01) arrives, stop using it: map the 'hangar' background key to a safe fallback (e.g. 'bridge' or the procedural hangar without a mech). When the replacement lands, re-enable it. Search all other painted art for lookalikes (V-fins on a twin-eyed face, recognisable logos) and list any you find.
2. Sortie tab: the next-mission card uses procedural art. Use the mission's painted battle backdrop or story background.
3. Frame Archive: "New machines" lists enemies while the detail panel shows an allied unit (Aegis). Make the detail panel follow the selected list and its first entry.
4. Mechs & Parts tab: the weapon table misaligns on rows with Will requirements or status chips. Use a fixed column grid.
5. Map: the "Codex updated" toast overlaps the zoom controls; move map toasts to a lane that never covers controls. Check the phase banner in a real or headless browser mid-animation and at rest; fix it if it renders as a faint, widely spaced smear.
6. Title: replace "112 art files loaded" in the tagline with nothing in normal play (keep it under ?debug).
7. The map leaves unused black bands above and below. Fill them with a subtle painted frame or the chapter backdrop, darkened, without hurting readability.

ACCEPTANCE: before/after screenshots for each item; all tests in the shared brief pass.
```

---

### N1 — Narrative bible and beat sheet (Tier 1, M; mostly writing)

```
TASK: Write the narrative foundation the other story tasks build on. Produce docs/narrative/ with:

1. BIBLE.md: setting, factions and their goals, the core theme (song vs silence, survival vs becoming less), tone rules (earnest, hopeful, grief taken seriously, humour from character), and a style guide for dialogue (sentence length, how each faction speaks, no exposition dumps, how choices are phrased).
2. CAST.md: every playable pilot (10 main + 8 auxiliary: Anika, Corin, Leda, Hugo, Noor, Emi, Orran, Vale) and every named antagonist (Draike, Vasse, Kroll, Ixion, Aurelion, Lucien as rival). For each: want vs need, wound, voice sample lines, an arc in 3–5 beats across the campaign, relationships, and how they end in each ending.
3. BEATS.md: a mission-by-mission beat sheet for all 20 missions on both routes (c1–c10, c5a/c6a, c5b/c6b, i1–i8): purpose, what changes, which arcs advance, the in-map events (3+ per mission, tied to objectives), the choice(s) and flags, and target word count. Total target 35–50k words.
4. FLAGS.md: every story flag (existing ones in story.js/expansion.js plus new ones), where it is set, and every place it changes content. Plan 25+ meaningful choices, a bond system for N4, and four endings (normal, true, plus two you design, e.g. a costly victory and a Vael-alliance ending) with conditions.
5. Keep everything consistent with what's already in the game unless a change clearly improves it; list every retcon you propose in a "Changes to existing story" section.

No code changes in this task except fixing factual errors you find. ACCEPTANCE: the four documents, reviewed for continuity against story.js and expansion.js; a summary of proposed changes.
```

---

### N2 — Mission scripting pass (Tier 1, L)

```
TASK: Implement docs/narrative/BEATS.md (from N1) in the game.

- Rewrite pre- and post-mission scripts for all 20 missions to the beat sheet, with the bible's style guide.
- Add 3+ in-map events per mission, tied to play: turn timers, boss HP thresholds, a unit reaching a tile, a specific pilot attacking a specific enemy (add new event triggers to tactics.js runEvents if needed: e.g. at:{reach:{tag,x,y,r}}, at:{attacker:{pilot,target}}).
- Give every interlude (i1–i8) real in-mission events and the auxiliary pilots' arc beats.
- Boss encounters: mid-battle exchanges at HP thresholds, and different lines depending on which pilot fights them.
- Implement the new flags and choices from FLAGS.md, including the new ending conditions (endings themselves can be placeholders until N4).
- Use portraits' four expressions deliberately; request extra expressions or event scenes in docs/ASSET_REQUESTS_V2.md if a beat needs them.
- Report the new word count (script commands' text) per mission and in total.

ACCEPTANCE: campaign simulation still wins every mission on both routes; e2e passes; a word-count table; a list of beats from BEATS.md you could not implement and why.
```

---

### N3 — Battle dialogue system (Tier 2, M)

```
TASK: Replace the single generic battle-line pool per pilot with a context-aware battle dialogue system, then write the lines.

SYSTEM
- New data file js/data/battle-lines.js. Line selection by priority: (1) exact pairing (pilot vs specific enemy pilot or unit, e.g. lucien vs rei), (2) pilot vs faction, (3) context (attack, finisher, combo, hit, big hit, dodge, kill, low HP, counter, support attack, support defend, first meeting with a boss, ally defeated nearby), (4) generic fallback.
- Pairings can be one-way or exchanges (attacker line then defender reply). Lines can depend on story flags (e.g. spared_lucien) and chapter ranges.
- Avoid repeating the same line twice in a row for a unit; keep a short recent-history.
- Hook into SCENE.play where lines are chosen today (say()).
WRITING
- Every playable pilot: 4+ lines per context. Every named antagonist: 4+ per context.
- 120+ special pairings: protagonist vs every boss; each rival relationship (Rei/Lucien, Mira/Draike, Ilse/Kroll, Brann/the Ourobor, Sera/Ixion and Aurelion, Odessa/Lucien, Yuna/Vasse); each auxiliary pilot vs the faction tied to their arc. Follow docs/narrative/CAST.md voices.

ACCEPTANCE: a test that every pilot has every context covered and every pairing references valid ids; screenshots of three pairings in battle; e2e passes.
```

---

### N4 — Halcyon talks, bonds and epilogues (Tier 2, M)

```
TASK: Add between-mission character scenes, a bond system and ending epilogues.

- New intermission tab "Halcyon": 2–4 optional conversation scenes per intermission, chosen by story progress, route, flags and bond levels. Each is a short story script (reuse UI.runScript). Mark new and unseen scenes.
- Bonds: pairs of pilots gain bond points from talks, combo attacks, support attacks/defends and adjacency in battle. Bond levels (1–3) grant small combat bonuses for adjacent pairs (hit/evasion or Support counts) and unlock talk scenes and epilogue variants. Show bonds in the Pilots tab.
- Endings: implement the four endings from docs/narrative/FLAGS.md with ending art (request in ASSET_REQUESTS_V2 if missing) and per-pilot epilogue cards (a portrait or epilogue image plus 2–4 sentences that vary by flags and bonds).
- A credits sequence after any ending (names, roles, asset credits, three.js licence), skippable.
- Save migration for the new fields; extend tests/saves.cjs.

ACCEPTANCE: screenshots of the Halcyon tab, a talk scene, the bonds display, an epilogue card and the credits; tests pass.
```

---

### G1 — Hand-authored maps and objective variety (Tier 1, L)

```
TASK: Replace procedural story maps with authored ones and diversify objectives.

MAPS
- Author every story map (20) as explicit tile rows in data (map.rows already bypasses generation in tactics.js). Design each around its beats (docs/narrative/BEATS.md if present): chokepoints, high ground, flanking lanes, cover, water or debris hazards, secret locations that make sense, and reinforcement entry points.
- Keep map sizes in the current 16×11 to 24×16 range unless a beat needs more.
OBJECTIVES (implement as data-driven win/lose types in tactics.js; show them clearly in the objective card and HUD)
- defend: keep a target (unit or tile) alive for N turns;
- escort: get an NPC or ally unit to an exit zone;
- escape: get key units to an extraction zone by turn N;
- survive: hold until turn N, then a reinforcement or event resolves the map;
- capture: hold beacon tiles at the end of an enemy phase;
- timed destroy: destroy targets before a turn limit;
- boss phases: bosses change weapons, AI and dialogue at HP thresholds, possibly relocating or summoning.
- At most 40% of maps may remain "defeat all".
- Every map gets a secondary objective worth a skill-point bonus (the existing bonus field), visible from the start, in the spirit of the genre's skill points.
- Reinforcements in 1–3 waves with telegraphing (a warning event or map marker one turn ahead).

ACCEPTANCE: a table of maps with objective, secondary objective, size and design notes; screenshots of each map; campaign simulation wins every map with typical clears of 8–14 turns on Normal (adjust the harness for new objectives); e2e passes.
```

---

### G2 — Enemy AI roles and difficulty modes (Tier 1, M)

```
TASK: Make enemies play with intent, and add difficulty modes.

AI (js/map/tactics.js aiAct and helpers)
- Roles set per spawn or per unit type: aggressor (closes and attacks the best expected-value target), sniper (keeps max range, prefers high ground), guardian (stays near a target or commander), skirmisher (hit-and-run to cover), support (stays behind allies, uses heals/buffs), holder (waits until triggered by distance or turn), boss (scripted phases).
- Better targeting: prefer kills and focus fire, account for the counterattack it will receive, avoid ending adjacent to multiple player units unless it can kill, respect terrain bonuses, use spirits-like bonuses for bosses.
- Retreat behaviour for named enemies at low HP when the story allows.
- Telegraph intent where it helps: the threat overlay shows boss charge-ups and next-turn reinforcement entry points.
DIFFICULTY
- Easy / Normal / Hard (+ optional "Requiem": Hard with no retries). Chosen at New Game, changeable on Easy/Normal only. Scale enemy stats, levels, AI aggression, reinforcement counts and rewards. Store in SAVE with migration.
- Hard should require spirits, positioning and type advantage; Easy should be winnable by a newcomer.

ACCEPTANCE: campaign simulation on all three difficulties with a summary table (wins, turns, units lost); screenshots of the difficulty choice and the improved threat overlay; tests pass.
```

---

### G3 — Progression depth (Tier 2, M)

```
TASK: Add the long-term progression players expect from the genre.

- Deploy selection: before each mission, choose which units sortie up to a per-map limit (some story units forced). Show recommended types for the map's enemies.
- Pilot training: spend PP (or a new resource) on base stats with rising costs, alongside the skill trees.
- Full-upgrade bonuses: when every upgrade line on a machine is maxed, the player picks one custom bonus for that machine (e.g. +1 move, +20% EN, weapon range +1, terrain rating to S).
- Ace system: pilots with 30+ kills become Aces (title, start-of-map Will bonus); 60+ kills unlock a unique ace bonus per pilot.
- Economy: a part shop in intermission with stock that grows by chapter; secrets yield crafting materials; parts can be combined into better versions. Rebalance credit income so upgrades feel deliberate.
- Mid-game frame transfers where the story allows (e.g. auxiliary pilots into spare frames) with clear restrictions.
- Save migration for all new fields; extend tests/saves.cjs.

ACCEPTANCE: screenshots of each new screen; a short economy table (credits earned vs upgrade costs by chapter); tests and campaign simulation pass.
```

---

### A1 — Integrate new art types (Tier 2, M; starts before art arrives)

```
TASK: Build importer and presentation support for the new art types in docs/ASSET_REQUESTS_V2.md, with fallbacks, so art can be dropped in as it is generated.

- Cockpit cut-ins (R-03): shown in battle when a pilot attacks (short panel slide) and full-screen before finishers and combos; expressions by context (calm, shout, hurt, finisher). Fallback: today's portrait banner.
- Finisher and combo splash art (R-04): a 1–1.5 s full-screen splash with the attack name, before the existing VFX sequence. Fallback: today's cut-in.
- Extra portrait expressions (R-05): load <id>_b sheets and expose sad, confident, shout, thoughtful in story scripts (e: 'sad' etc.).
- Event scenes (R-06), ending art and epilogue cards (R-07): wire into story scripts (cg) and the ending/epilogue flow from N4.
- Faction emblems and UI marks (R-08): faction badges on unit panels, mission cards and the forecast.
- Map tokens (R-09, optional) and tile transitions (R-10, optional): use when present.
- Run `python3 tools/build_offline.py` support for any new folders (extend the tool if needed).

ACCEPTANCE: placeholder-art screenshots for every new type (generate placeholders like tests/make_placeholder_art.py does, in a copy of the repo); with no new art present, the game looks exactly as before; tests pass.
```

---

### A2 — Map presentation polish (Tier 1, M)

```
TASK: Make the tactical map look and read like a commercial tactics game.

- Tiles: remove hard seams and visible repetition: variant mixing, edge blending between terrain types (autotile-style transitions; use R-10 art when available, procedural blending until then), subtle animated water and lights.
- Units: larger, readable tokens with a team-coloured plate, HP bar, status icons and a clear "acted" state; hover and selection highlights; facing toward the nearest enemy.
- Movement and targeting: path preview with arrows, attack-range preview from the destination tile before moving, a line from attacker to target in forecast, threat overlay that shows boss charge-ups and reinforcement markers.
- Camera: smooth pan to the acting unit during enemy phase; optional "follow enemy actions" setting.
- Phase banner, toasts and objective tracker: clean animations, a fixed non-overlapping lane, and a compact objective panel that's always visible.
- Fill the empty bands around the map (see S1) and add an ambient layer per theme (embers, snow, spores, star drift) that respects Low quality.

ACCEPTANCE: before/after screenshots of three different themes at desktop and phone sizes; Low mode stays fast; tests pass.
```

---

### A3 — Battle presentation polish (Tier 2, M)

```
TASK: Raise battle scenes to genre standard.

- Camera work: push-ins on attack start, follow on dashes, shake tuned per weapon weight, slow-motion on criticals and kills, a hit-stop on heavy hits.
- Impact: impact frames (brief white or inverted flash), radial speed lines on finishers, a damage-number style with weight (bigger for crits, tinted by effectiveness).
- Per-weapon VFX pass: review all weapon anims (rifle, beam, missile, slash, punch, drill, funnel, gravity, spirit, breath, railgun, lightning, wave, megabeam, finisher) with painted sprites; make each read clearly and match its attack type colour.
- Cut-ins and splashes from A1 timed into the sequence.
- Battle start and end flourishes (side wipes, HP drain with the number counting down, "DESTROYED" stamp, EXP/credit summary panel after the exchange).
- Battle speed setting respected everywhere; a one-press skip that still shows the result summary.

ACCEPTANCE: a short series of screenshots per anim type (start, impact, result); tools/verify_animation.cjs updated and passing; tests pass.
```

---

### M1 — Score integration and character themes (Tier 2, M)

```
TASK: Integrate recorded music and the genre's signature character themes.

- Character themes: when a pilot with a theme attacks in battle, that theme plays for the exchange (setting: "Pilot themes: on/off"). Bosses have their own themes; boss themes override pilot themes except for the protagonist's finisher (configurable).
- Use the track keys and file names in docs/ASSET_REQUESTS_V2.md (music section); extend assets/prompts/MUSIC.md and audio.js track tables; keep procedural music as fallback per key.
- Stingers: victory, defeat, level up, item get, choice made, chapter title. Jingles must not cut the current track; duck it.
- Mixing: dialogue ducking during story scenes, crossfades between map and battle, loudness consistency (normalize guidance in the brief), separate Music/SFX/Voice volume sliders.
- A Sound Test screen (unlocked after clearing the game, or always on in debug) with track names.

ACCEPTANCE: list of tracks wired with fallbacks; presentation tests extended; a note of what was actually listened to (or that listening wasn't possible).
```

---

### M2 — Sampled sound effects and voice barks (Tier 3, M)

```
TASK: Replace synthesized effects with sampled ones and add optional voice barks.

- Load optional files from assets/sfx/<key>.ogg|mp3 (keys in docs/ASSET_REQUESTS_V2.md SFX table); keep the WebAudio synth as fallback per key. Add pitch/volume variation to avoid repetition.
- Map every existing SFX.play call and battle event to the new keys; add missing ones (UI hover, menu open/close, footsteps per unit class, treads, jets, barrier hits).
- Optional voice barks from assets/voice/<pilot>_<context>_<n>.ogg with subtitles always shown; Voice volume slider; a "voices: on/off" setting.
- Build-time: extend tools/build_offline.py for the new folders.

ACCEPTANCE: a table of every SFX key and where it's used; tests pass; mention exactly which sounds were heard (if any).
```

---

### U1 — Onboarding, tutorial and glossary (Tier 1, M)

```
TASK: Teach the game without a manual.

- Chapter 1 and the Shelter Line interlude become an interactive tutorial (skippable for returning players): movement, attack, forecast and type chart, counter/evade/defend, spirits, Will, terrain and secrets; chapter 2 introduces flanking, knockback and support attacks. Use short contextual prompts with highlights on the relevant UI, not walls of text.
- Contextual first-time tips for later systems (combos, Support Defend, variants, parts, skill trees, bonds, difficulty).
- A Glossary/Help screen reachable from every menu, with the type chart, status effects, spirits and positioning rules.
- Tooltips on every stat and icon in the unit panel, forecast and intermission.

ACCEPTANCE: screenshots of each tutorial step; a fresh-save run of chapter 1 with tips on and off; tests pass.
```

---

### U2 — Accessibility, controller and settings (Tier 3, M)

```
TASK: Make the game comfortable for more players.

- Text size (3 steps) and dialogue speed; high-contrast UI option; colourblind-safe palettes for teams and attack types (shape/icon redundancy, not colour alone).
- Full keyboard play (cursor on map, menu navigation, shortcuts listed in Help) and gamepad support via the Gamepad API (map cursor, confirm/cancel, cycle units, end turn, fast-forward).
- Reduce-motion option (no screen shake, fewer flashes); respect prefers-reduced-motion by default.
- Settings screen reorganised into Gameplay, Display, Audio, Controls, Accessibility.

ACCEPTANCE: a keyboard-only and a gamepad-emulated playthrough of chapter 1 in Playwright (or a documented manual test); screenshots of the settings; tests pass.
```

---

### R1 — Real-browser QA and performance (Tier 1, M)

```
TASK: Run the QA that has never been done in a real browser, and fix what it finds.

- Matrix: Chrome, Firefox, Safari (or WebKit via Playwright), Edge; desktop 1920×1080 and 1366×768; phone 844×390; tablet 1024×768; served over HTTP and opened from disk.
- For each: title → new game → chapter 1 → intermission → chapter 2 start; Frame Archive; save/load/export/import; settings in all three graphics modes; touch flow on phone/tablet.
- Record frame intervals with ?debug on map and battle in High and Low on real hardware if available (state clearly when only SwiftShader was available).
- Fix every console error, layout break, clipped text, overlapping control and slow path you find.
- Update tests/BROWSER_QA.md with a pass/fail matrix and evidence (screenshot paths, timings).

ACCEPTANCE: the matrix filled honestly; fixes committed; tests pass.
```

---

### R2 — Release build and packaging (Tier 3, M)

```
TASK: Prepare a shippable build.

- Size: the repo is ~488 MB; assets/offline holds ~278 MB of duplicated image data. Convert PNGs to high-quality WebP (keep alpha), resize oversized sources to their maximum display size, and make the offline wrapper reference the compressed files. Target under 200 MB total (under 150 MB preferred) with no visible quality loss; show before/after crops.
- A loading screen with progress for the first load; lazy-load chapter-specific art.
- tools/build_release.py: produces dist/web (itch.io-ready zip, index.html at root) and documents an optional desktop wrapper (Electron or Tauri) without adding network dependencies to the game itself.
- Versioning: a VERSION string shown in the title footer and saves; a changelog file.
- An in-game error overlay that captures uncaught errors with a copyable report.

ACCEPTANCE: dist/web builds and runs from a static server and from disk; size table before/after; tests pass on the dist build.
```

---

### R3 — IP, credits and content review (Tier 3, S)

```
TASK: Clear the game for public release.

- Review every name, mech design, logo-like mark and music brief for resemblance to existing franchises (check painted art especially: V-fins on twin-eyed faces, recognisable insignia, existing attack names). List findings with file paths and propose replacements; file art replacements as requests in docs/ASSET_REQUESTS_V2.md.
- Credits: a complete credits file and in-game credits (team roles, AI-generated asset disclosure as appropriate for storefronts, three.js MIT licence, fonts' licences).
- Content notes: violence level, themes (death, grief, war crimes) for a storefront rating questionnaire.
- Check fonts are licensed for distribution and bundle them locally if the release must work offline.

ACCEPTANCE: docs/RELEASE_REVIEW.md with findings and status; credits screen screenshot.
```
