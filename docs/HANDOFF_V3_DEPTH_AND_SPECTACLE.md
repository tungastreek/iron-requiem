# Iron Requiem — Handoff V3: Depth and Spectacle

This handoff covers four requests:

1. **Campaign difficulty:** a curve that climbs gradually, then levels off. Never an impossible mode after a few chapters.
2. **Presentation overhaul:** a big step up for the tactical map, VFX, UI and text. Robot art stays.
3. **Skill system:** many machine classes, each with its own tree, balanced. Fix cooperation (Support Attack), which is currently overpowered.
4. **Progression pacing:** after map 1 a player can already buy half a tree. Slow mastery down and make choices matter.

It builds on [HANDOFF_COMMERCIAL.md](HANDOFF_COMMERCIAL.md); use that file's **shared brief** (section 3) before any task here. Where tasks overlap, this file **supersedes** these earlier ones: G2 (difficulty part), G3 (progression), A2 (map polish) and A3 (battle polish). New asset requests are in [ASSET_REQUESTS_V3.md](ASSET_REQUESTS_V3.md).

---

## 1. Findings (repo at commit `94e0e0b`)

**Skill trees are cheap and identical.**
- Every pilot has the same 3 branches × 5 nodes. Only the mastery type, two spirit unlocks and the capstone differ.
- A full tree costs 48 points; the first two tiers of all three branches cost **9**.
- Points come from +3 per level, **+1 per kill**, +2 to everyone per bonus objective, and +2 per Aurora Shard secret. In testing, Rei left chapter 1 at level 2 with 11 points, enough for all six tier-1 and tier-2 nodes.
- Experience is flat (100 per level) and catches up fast, so levels track the enemy and points keep flowing.

**Cooperation is overpowered.**
- Support Attack is a tier-2, 2-point node in the shared third branch.
- It triggers on **every** attack by an adjacent ally, with **no per-phase limit**, and the helper still earns experience.
- Once the whole squad has it, every attack is two attacks, and the enemy never gets the same benefit.

**Damage bonuses compound.** `CB.damage` applies 19 multiplicative factors: type ×0.6–2.0, mastery 1.15, Prevail up to 1.3, capstones 1.15–1.25, Fury up to 1.3, positioning up to 1.3, critical 1.5, Valor 2, and more. Stacked, they reach ×10 and beyond, which makes balancing impossible.

**The difficulty curve is jagged, then inverts.** Enemy count stays at 7–12 per map while deployment grows from 2 to 10 story units plus up to 4 auxiliaries.

| Order | Mission | Enemies | Enemy level (avg) | Deployed |
|---|---|---|---|---|
| 1 | c1 | 10 | 1.4 | 2 |
| 4 | i2 | 8 | 4.0 | 5 |
| 9 | c5a | 9 | 8.4 | 7 |
| 13 | i5 | 9 | **15.0** | 8 |
| 14 | c7 | 8 | 13.9 | 8 |
| 18 | i8 | 11 | **23.0** | 10 |
| 19 | c9 | 11 | 20.5 | 10 |
| 20 | c10 | 9 | 25.1 | 10 |

Interludes spike above the story missions that follow them, and late maps put 10–14 player units against about 10 enemies. Simulated clears take 2–5 turns from start to finish.

**Presentation.**
- **Map:** flat square tiles with visible repetition and seams, small sprites, empty black bands, minimal telegraphing.
- **VFX:** 2D primitives (flat beam bands, grey-dot smoke, small soft explosions). They look thin next to the painted art; finishers barely register.
- **HUD and dialogue:** clean but generic. Text has no emphasis, rhythm or staging.

---

## 2. Design direction

### 2.1 Difficulty: "ramp, then plateau with a sawtooth"

**Pressure Index (PI)** is a single number per map: the enemy force's effective power divided by the deployed player force's effective power. Effective power folds in levels, upgrades, parts, skills, terrain and objective constraints, and is computed by a tool (task C1). PI = 1.0 means a fair fight for a well-built squad played competently.

**Target curve (Normal):**

| Act | Missions (play order) | PI target | Feel |
|---|---|---|---|
| I · Learn | 1–6 (c1, i1, c2, i2, c3, i3) | 0.55 → 0.85 | Teach one new system per map; losing is rare. |
| II · Test | 7–12 (c4, i4, c5a/c5b, c6a/c6b, i5) | 0.85 → 1.00 | Systems combine; enemy roles start working together. |
| III · Master | 13–20 (c7, i6, c8, i7, i8, c9, c10) | **1.00 ± 0.08 plateau**; boss maps +0.12, the map after a boss −0.10; final map ≤ 1.15 | Challenge comes from **complexity, not inflation**. |

**Plateau guarantees** (the "no impossible mode" rules):

- **Level governor.** Enemy level = clamp(chapter base, party median − 3, party median + 2). Grinding helps a little; under-levelling never walls you.
- **Stat growth parity.** Enemy per-level growth matches the player's average (the current 3.0 per level outpaces most pilots' ~2.0). Late enemies are dangerous through roles, spirits and objectives, not raw numbers.
- **Damage caps on Normal.** No single non-telegraphed enemy attack deals more than 60% of a target's max HP. Boss super-moves that exceed it must be telegraphed one phase ahead and avoidable.
- **Hit-rate floor and ceiling.** Displayed hit chance is clamped to 5–95% except under Strike or Alert. Evasion builds stay strong but never untouchable.
- **Deployment-aware maps.** Enemy count and waves scale with the map's deploy limit. Each map sets its deploy limit (typically 6–9 late, not "everyone"), so roster choice matters.
- **Complexity budget instead of stat budget.** Each Act III map draws 1–2 twists from a catalog:
  - multi-objective (defend + destroy)
  - split deployment
  - telegraphed waves
  - enemy aces using spirit commands
  - fog of war (new)
  - terrain hazards
  - an escort under fire
  - boss phases
  - a timed objective
- **Recovery valleys.** After every boss map, the next map is −0.10 PI with a generous bonus objective.
- **Assist on retry (opt-in, Easy and Normal):** after 2 defeats on a map, offer +10% damage dealt and −1 enemy level. It's labelled clearly and never applied silently.
- **Difficulty modes move the plateau height, not the slope:** Easy 0.80, Normal 1.00, Hard 1.20, "Requiem" 1.20 with no retries.

**Measured success:** in simulation with a competent bot, Act III maps take 8–12 turns, the bot loses at most 1 unit, and spends 40–70% of the squad's spirit points. No Act III map's success rate falls below 85% across seeds on Normal. The curve chart is regenerated by a tool on every balance change.

### 2.2 Machine classes and class trees

The **machine's class** sets the main tree; the **pilot** adds a short personal track. Builds come from the pairing.

| Class | Fantasy | Frames now | Base passive |
|---|---|---|---|
| **Aurora** (unique) | The prototype that evolves | Alteon → Alteon Zero (Real path) | Resonance meter: fills with Will; at full, the next attack ignores barriers. Evolves its tree at Zero. |
| **Titan** | Super robot: unstoppable melee, Will-fuelled finishers | Gaia Kaiser, Trinity Arc, Cinder, Alteon Gigas/Zero Gigas | +1 Will per tile moved toward an enemy before attacking. |
| **Interceptor** | Fast flyer, hit-and-run | Sylph, Kestrel | Can move again after attacking if it moved 3 or fewer tiles (once per phase). |
| **Duelist** | Melee ace, counters and parries | Carmine Hound, Orpheus | First counterattack each enemy phase is a guaranteed hit. |
| **Artillery** | Long-range siege, area suppression | Bastion, Mastodon, Palisade | Cannot attack after moving more than 2 tiles; +20% damage when stationary. |
| **Sniper** | Precision, overwatch | Talos | Overwatch: if it didn't move, it shoots the first enemy that enters its range. |
| **Bulwark** | Tank, protector, zone control | Aegis | Adjacent allies take −15% damage. |
| **Engineer** | Repair, resupply, buffs | Nautilus | Can repair or resupply an adjacent ally instead of attacking. |
| **Resonant** | Psy: status, control, SP economy | Noctis, Vesper | Spirit commands cost −10% SP. |
| **Command** | Flagship auras and map abilities | Halcyon | Allies within 3 tiles gain +5 hit and evasion; one Command Order per turn. |
| **Starborn** (unique) | Vael gravity knight | Seraphyne | Regenerates; gravity attacks pull or push targets one tile. |

**Tree structure (every class):**

- **3 paths × 5 tiers = 15 nodes.** Tiers cost 2 / 4 / 7 / 10 / 15 points, so one path is 38 and a whole tree is 114.
- **Keystones at tier 3 and tier 5 are pick-one-of-two.** For example, a Sniper chooses *Patient Shot* or *Snap Shot*. That's 4 build-defining choices per tree.
- **Mastery nodes need deeds as well as points.** A Sniper's tier-5 nodes require 15 kills at range 5+. Mastery comes from playing the role.
- **Pilot track:** 4 nodes (2 / 4 / 7 / 10) plus the pilot's existing capstone at 15 points, about 38 total. Personal flavour: Brann's Burning Soul, Odessa's Dead Eye and so on.
- **Frame transfers** (from G3): a pilot keeps proficiency per class and starts a new class tree at zero.

**Fully worked examples** (the other classes follow this shape; task K2 designs them):

**Interceptor**
| Path | T1 (2) | T2 (4) | T3 keystone (7) | T4 (10) | T5 keystone (15) |
|---|---|---|---|---|---|
| Wing | +1 move | Mobility +10 | **Slipstream** (allies moving through tiles you passed this turn gain +1 move) / **Lone Wolf** (+15% evasion with no ally within 2) | Afterburn (+10% damage per 2 tiles moved, max +30%) | **Ace of Skies** (one extra hit-and-run move per phase) / **Dogfighter** (counters against flyers can't miss) |
| Strafe | Post-move weapons +1 range | Vulcans/pistols +15% | **Strafing Run** (attack a target, then a second enemy adjacent to your path at 50%) / **Pin Down** (hits apply Slow) | Ammo +50% | **Gale Mastery** (finisher Will −15) / **Harrier** (enemies you hit this phase lose −10 evasion) |
| Wingman | Formation bonus doubled for you | **Support Attack I** (1 charge per phase, 50% power) | **Escort** (an ally you start adjacent to gets +15 evasion) / **Bait** (enemy AI prioritises you; +20 evasion) | Support Attack II (2 charges, 65%) | **Wingman Ace** (support attacks can crit) / **Cover Fire** (supporting gives the attacker +15 hit) |

**Bulwark**
| Path | T1 | T2 | T3 keystone | T4 | T5 keystone |
|---|---|---|---|---|---|
| Wall | Armor +150 | HP +800 | **Immovable** (immune to knockback and pull; +10% damage reduction) / **Rampart** (allies behind you, relative to the attacker, take −25%) | Status resistance 50% | **Last Stand** (once per map, survive a lethal hit at 1 HP) / **Bastion Field** (an aura of −10% damage taken within 2) |
| Guardian | **Support Defend I** (1 per enemy phase) | Defending also counters at 50% | **Interpose** (Support Defend range 2) / **Riposte** (after defending, counter at 100%) | Support Defend II (2 per phase) | **Aegis** (Support Defend takes 50% less damage) / **Martyr** (each defend gives all allies +3 Will) |
| Control | Hits apply Slow 20% | Zone of control: enemies stop when entering an adjacent tile | **Taunt** (an enemy in range must target you next phase) / **Shield Bash** (melee knockback with collision) | Knockback +1 tile | **Fortress Line** (zone of control range 2) / **Breakwater** (enemies adjacent to you lose −15 hit) |

**Resonant**
| Path | T1 | T2 | T3 keystone | T4 | T5 keystone |
|---|---|---|---|---|---|
| Choir | SP +15 | +3 SP each phase | **Echo** (your single-target spirits also apply to one adjacent ally) / **Solo** (your spirits cost −25%) | Learn Rally | **Resonance Cascade** (when you cast a spirit, adjacent allies gain +5 Will) / **Overflow** (SP cap +40) |
| Lunar | Status chance +15% | Spirit-type attacks +10% | **Hex** (statuses last +1 phase) / **Purge** (hitting a buffed enemy removes its buffs) | Bits +1 range | **Lunar Requiem Mastery** (finisher applies Jam and Break) / **Eclipse** (the first hit each phase can't be evaded) |
| Veil | Evasion +8 | Alert costs −5 SP | **Phase Veil** (once per phase, negate a hit while above 50% HP) / **Mirror** (dodging reflects 30% damage) | Cleanse on self each phase | **Unreachable** (+20 evasion vs ranged) / **Sanctuary** (adjacent allies are immune to statuses) |

### 2.3 Cooperation rework (fixing "everyone support-attacks")

- **Support Attack lives only in trees that fit it:** Interceptor (Wingman), Artillery (Barrage), Sniper (Overwatch Support), Command. Titans, Duelists and Bulwarks don't get it.
- **Charges:** 1 per player phase at rank I, 2 at rank II. Power 50% at rank I, 65% at rank II. Supports can't crit unless a keystone allows it, don't chain, and don't trigger on support or counter attacks.
- **Cost:** spends the supporter's EN or ammo, gives no Will, and gives 50% of normal experience.
- **Support Defend** is limited the same way and lives in Bulwark, Titan (rank I only) and Command.
- **Enemies cooperate too:** commanders and named aces get Support Attack and Defend, telegraphed on the map, from Act II onward.
- **Combination attacks** need a Bond level from N4 (pairs at Bond 2+), cost both units' actions, and get one charge per map at Bond 2 and two at Bond 3.

### 2.4 Combat math: bonus buckets and caps

Rework `CB.damage` into buckets:

```
damage = base(power, stats, will, armor)
       × typeMultiplier                  (0.6 – 1.75; Exploit adds +0.15 additively, not +0.25)
       × (1 + Σ offense bonuses)          capped at +60%   [mastery, Prevail, capstones, Fury, positioning, class nodes]
       × criticalMultiplier               (1.5; class nodes may raise to 1.75)
       × spiritMultiplier                 (Valor 2.0)
       × (1 − Σ defense reductions)       capped at 60%    [Iron Wall excluded; ironwall applies separately as 0.25]
       − flat barrier
```

- Positioning (flank, pincer, high ground) moves into the offense bucket.
- **Node power budget:** each point is worth roughly +1.2% effective damage or survival. A node's marginal value should sit within ±30% of its cost × 1.2%, measured in the simulator.
- **Spirits:** Resolve (Focus + Strike + Valor + Accel for 70 SP) goes up to 85 SP and is available only from a tier-5 keystone or a story unlock. Guardian becomes 50% status resistance instead of immunity. Overdrive becomes a keystone choice.

### 2.5 Progression pacing

- **Skill points come from levels only:** 2 per level, plus 3 at every 5th level. **No points per kill.** Aces earn titles and Will bonuses instead (G3).
- **Bonus objectives award Merits,** a squad currency for the **Halcyon refit tree**: deploy slots, part slots, repair bay, a refit discount, a respec token. Merits feed the squad, not the individual.
- **Experience curve:** cost to level = 100 + 12 × (level − 1). Keep a gentler catch-up (×1.5 for pilots 3+ levels below the party median, ×0.75 above).
- **Pacing targets:**
  - After map 1: 1–2 nodes per pilot.
  - Mid-campaign (map 10): one path to tier 3 with the first keystone chosen.
  - End: about 60–70% of the class tree and the full pilot track.
  - A full class tree is reachable only on New Game+.
- **Respec:** free until mission 3, then credits rising per respec; free with a Merit-bought token.
- **Migration:** convert existing nodes to points (refund everything with a +10% bonus) and show a one-time "your pilots have been retrained" screen.

### 2.6 Map: "living diorama"

Move the tactical map from flat squares to a **tilted three.js diorama** (55–60° camera, perspective), keeping a 2D board for Low quality.

- **Terrain:**
  - a heightfield from tile types (mountain +2, hill +1, water −0.3) with flattened plateaus so the grid stays readable
  - **texture splatting** with 6–8 seamless biome materials, macro noise and soft transitions instead of square tiles
  - roads and rivers as spline decals
- **Props:** instanced billboards or low-poly props (buildings with painted facades, trees, rocks, wrecks, crystals, hive growths) from asset atlases; props occlude nothing important (they fade near units and the cursor).
- **Light and atmosphere:** time of day per mission (dusk Kestrel, night Shelter Line, white Antarctic glare), dynamic lights from bases, fires and Vael glows, fog, weather particles (snow, ash, spores, star drift), a sky dome or horizon panorama around the board.
- **Units:** painted idle frames as billboards standing on the terrain with contact shadows, team ring decals, screen-space name/HP plates, a 2-frame idle animation, lean while moving, dust on landing.
- **Overlays:** animated range decals (movement as a soft glowing fill with an edge pulse, attack ranges as red hatching), a path ribbon, enemy intent icons (target lines, boss charge-ups, next-phase reinforcement entry points), hover damage previews.
- **Camera:** smooth pan and zoom, optional 90° rotation, follow during the enemy phase, and **cinematic event cameras** (letterbox, focus pull to the speaker's unit, slow push-in).
- **Picking:** raycast to board tiles. The input layer stays the same; only the coordinate source changes.

### 2.7 Battle VFX: from primitives to spectacle

- **Render battles entirely in WebGL:** painted sprites become textured quads, which enables rim-light tinting from effects, hit-flash shaders, dissolve on destruction, heat distortion and color grading per backdrop.
- **GPU particle system** (instanced quads, additive and alpha, curl noise, collision with the ground plane) driven by **data-defined effect timelines.** Each weapon anim gets a timeline JSON of emitters, ribbons, lights, decals, camera cues and time scale.
- **Effect layers for every attack:**
  - anticipation: charge glow, energy gathering, sprite crouch
  - release: muzzle flare, recoil, camera kick
  - travel: ribbons and trails, shaped projectile sprites
  - impact: an impact frame (two-tone flash for 2 frames), shockwave refraction ring, spark burst with motion blur, debris with gravity, ground crack decal, dust kick
  - aftermath: smoke volumes lit by fire, embers, heat haze
- **Scale tiers by power:** weapons under 3000 power get a light kit, 3000–4500 medium, finishers and combos the full kit with unique choreography and camera language.
- **Light coupling:** effects brighten the backdrop locally (an additive light pass with a radial mask), so a beam lights the ground and the target's rim.
- **Sprite acting:** squash and stretch via mesh warp, smear frames on dashes, damage states (sparks and smoke attached below 30% HP), destruction by fracturing the sprite into 6–12 shards with an explosion sequence.
- **Backdrop parallax:** use the depth-layer backdrops when available (asset request L-03); otherwise slow zoom and pan for 2.5D depth.
- **VFX Lab page** (`tools/vfx-lab.html`): pick an attacker, target, backdrop and weapon; scrub the timeline; edit the JSON live.
- **Low quality:** halve particle counts and disable refraction and distortion.

### 2.8 UI and text: immersive and dramatic

- **Art direction:** the UI is the **Halcyon's tactical OS.** It uses angled frames, thin structural lines, data ticks and an amber/cyan palette for the player. Concord windows are cold white and gold, the Free States rust and olive, the Vael violet glass, and the Ourobor organic and pulsing. The forecast and battle HUD skin to the opposing faction.
- **Typography:** a display face for names, attack titles and chapter cards; a highly legible UI face; a slightly warmer face for dialogue; and a monospace for comms and data. Set a type scale and keep to it.
- **Motion design:** panels open with mechanical easing (fast in, settle with a small overshoot), stagger lists, damage numbers with weight, and short UI sounds for every transition (from M2).
- **Dialogue staging:**
  - inline markup in scripts: `{shout}…{/shout}` (bigger, shaking), `{whisper}` (smaller, slower, dimmed), `{em}` (accent color), `{beat}` (a pause), `{glitch}` (Vael/Hollow corruption), `{comm}` (radio static frame)
  - per-character text blips and speed
  - portraits that breathe, blink and lip-flap (asset request L-08) and cross-fade between expressions
  - camera punch-in on shouts; screen tint pulses for alarms
  - comm windows (small framed portrait with scanlines) for remote speakers
  - letterboxing for key beats
  - choices presented with weight: a short silence, a heartbeat SFX, then the options slide in
- **Mission framing:**
  - a cinematic **title card** per mission (number, title, location, Concord year, objective)
  - "MISSION START" and "MISSION COMPLETE" stamps
  - a **results screen with a rank** (S/A/B/C from turns, damage taken, units downed, secondary objective)
  - a pre-boss "WARNING" sequence for bosses
- **Battle text:**
  - attack-name title cards with motion and per-attack-type styling
  - quotes typed with emphasis markup
  - an "EFFECTIVE!" / "RESISTED" callout with a short sound
  - a critical hit flashes a stamp
- **Intermission as a place:** replace the tab bar with a **Halcyon hub**, a painted bridge or deck scene with hotspots (Hangar, Briefing, Crew Quarters for talks, Archive, Systems). The tabs remain as a quick menu.
- **Writing for the UI:** every node and item gets a mechanical line plus a short in-world flavor line (one sentence, the crew's voice). Example: *"Slipstream: allies moving through your path gain +1 move. — 'Ride my wake, I'll clear the air.' — Mira"*.
- **Accessibility:** a reduce-motion setting disables shakes, flashes and glitches; text effects stay readable at every text size.

---

## 3. Task prompts

Paste the **shared brief** from [HANDOFF_COMMERCIAL.md](HANDOFF_COMMERCIAL.md) section 3, then one task.

| ID | Task | Depends on | Size |
|---|---|---|---|
| C1 | Pressure Index tool and difficulty governor | — | M |
| C2 | Apply the curve: per-map pressure, deploy limits, complexity twists, enemy spirits | C1, ideally G1 | L |
| K1 | Combat math buckets, caps and node power budget | — | M |
| K2 | Machine classes and class trees (data, UI, migration) | K1 | XL |
| K3 | Cooperation rework (Support Attack/Defend charges, enemy cooperation, combo bonds) | K2 | M |
| K4 | Progression economy (points, experience curve, Merits, Halcyon refit tree, respec) | K2 | M |
| V1 | Map diorama renderer (three.js) with 2D fallback | — | XL |
| V2 | Map overlays, telegraphing and cinematic event camera | V1 | L |
| V3 | WebGL battle renderer and GPU VFX engine with VFX Lab | — | XL |
| V4 | Per-weapon choreography, sprite acting and destruction | V3 | L |
| U1 | UI art direction and component kit (tactical OS, faction skins, motion) | — | L |
| U2 | Dramatic text and staging (markup, comms, title cards, ranks, Halcyon hub) | U1 | L |

**Order:** K1 → C1 → K2 → K3 → K4 → C2 for gameplay; V1 → V2 and V3 → V4 for visuals; U1 → U2 for UI. The three tracks can run in parallel. Run C2 last among the gameplay tasks because it tunes against the new skill economy.

---

### C1 — Pressure Index tool and difficulty governor (M)

```
TASK: Build the measuring stick for difficulty, then the plateau guarantees.

1. tools/pressure.cjs: for every mission in play order, compute the Pressure Index (PI) as defined in docs/HANDOFF_V3_DEPTH_AND_SPECTACLE.md section 2.1. Define "effective power" from simulated duels: e.g., the expected damage per phase each side deals to the other, using CB.forecast with the expected party build for that chapter (take levels/upgrades/parts from tests/campaign.js fixtures, or derive a canonical party progression and document it). Include deploy limits, terrain and objective modifiers you can quantify. Output docs/difficulty/CURVE.md (table) and an SVG chart of PI vs mission with the target band.
2. Governor in js/map/tactics.js / makeUnit: enemy level = clamp(chapter base, partyMedian − 3, partyMedian + 2); enemy per-level stat growth aligned with the player average (currently 3.0 vs ~2.0; propose numbers and justify).
3. Normal-mode guards: max non-telegraphed damage per hit ≤ 60% of target max HP (clip and log when clipped), hit chance clamp 5–95% except Strike/Alert.
4. Assist-on-retry (opt-in prompt after 2 defeats on Easy/Normal): +10% damage dealt, −1 enemy level; record in SAVE (migration) and never apply silently.
5. Difficulty modes (Easy/Normal/Hard/Requiem) as plateau multipliers in one config table; if G2 from the earlier handoff already added modes, unify them here.

ACCEPTANCE: CURVE.md + chart for current data (before) and after the governor; unit tests for the clamps; campaign simulation still wins; e2e passes.
```

### C2 — Apply the curve (L)

```
TASK: Retune all 20 missions to the PI targets in section 2.1 using tools/pressure.cjs.

- Set a deploy limit per map (late maps typically 6–9) and adjust enemy counts, roles, waves and levels so PI lands in the target band; Act III maps use complexity twists from the catalog (multi-objective, split deployment, telegraphed waves, enemy aces with spirits, fog of war, terrain hazards, escort, boss phases, timers), 1–2 per map, never the same pair twice in a row.
- Add enemy spirit commands for named aces and bosses (Focus, Alert, Iron Wall, Valor), used by AI rules and announced with a cut-in.
- Implement fog of war as an optional map flag (vision radius per unit class; Sniper and Command see further).
- Insert recovery valleys after each boss map.
- Fix interlude spikes (i5 and i8 are above the following story mission today).

ACCEPTANCE: CURVE.md after tuning with every mission inside its band; simulation (Normal) Act III clears 8–12 turns, ≤1 unit lost on average, ≥85% success per map across seeds; Easy and Hard runs reported; e2e passes.
```

### K1 — Combat math buckets and power budget (M)

```
TASK: Rebuild CB.damage around bonus buckets with caps (section 2.4) and create a node power budget.

- Refactor the 19 multiplicative factors into: type × (1 + Σoffense, cap +60%) × crit × spirit × (1 − Σdefense, cap 60%) − barrier, with Iron Wall separate. Exploit becomes +0.15 additive to the type multiplier.
- Keep forecast and roll consistent (one code path).
- tools/node-value.cjs: for each skill node, simulate representative duels with and without it and report marginal value vs cost; flag nodes outside ±30% of budget (1.2% per point).
- Rebalance spirits: Resolve 85 SP and gated; Guardian 50% status resistance; Overdrive becomes a choice node (K2 places it).
- Update tests (combos, enemies) for new numbers; document formulas in docs/difficulty/COMBAT_MATH.md with worked examples.

ACCEPTANCE: node-value report; no node > +25% DPS alone; campaign simulation still wins every map; tests pass.
```

### K2 — Machine classes and class trees (XL)

```
TASK: Replace the identical 3×5 tree with class trees + pilot tracks (section 2.2).

DATA
- js/data/classes.js: the 11 classes, their base passives, and 15-node trees (3 paths × 5 tiers, costs 2/4/7/10/15, keystone choice pairs at tiers 3 and 5, deed requirements for tier-5 nodes). Use the three worked examples in section 2.2 as written (tune numbers if K1's tool says so); design the other eight to the same quality, each with a distinct play pattern.
- Map every playable frame to a class (table in 2.2), and every future frame by default rule (role → class).
- Pilot tracks: 4 nodes + existing capstone per pilot (5 total), personal flavor, no overlap with class nodes.
- Implement all base passives and node effects generically (effect types, not pilot-id checks). Reuse existing systems: overwatch hooks into enemy movement; zone of control into pathfinding; taunt into AI targeting; repair into the action menu.
UI
- A class-tree screen that reads like a real build planner: three paths, keystone pairs shown side by side with "choose one", deed progress bars, hover previews of stat changes, total spent / available, respec button (K4 sets costs).
- Class emblem on unit panels, forecast and roster (icons from ASSET_REQUESTS_V3 L-05; keystone icons too). Publish the final keystone list so L-05's keystone sheets can be generated.
MIGRATION
- Refund old nodes as points (+10%), clear nodes, show a one-time "retrained" notice; extend tests/saves.cjs.

ACCEPTANCE: screenshots of three class trees; each class's passive and one keystone demonstrated in a battle screenshot or test; node-value report within budget; tests and simulation pass.
```

### K3 — Cooperation rework (M)

```
TASK: Make cooperation a deliberate tactic, not a default (section 2.3).

- Support Attack only from class nodes that grant it; charges per player phase (rank I: 1 at 50%, rank II: 2 at 65%); no crit/chain/trigger on supports or counters; spends supporter EN/ammo; no Will; 50% EXP. Show remaining charges on unit plates and in the forecast ("Support: Mira (1)").
- Support Defend: same charge model, from Bulwark/Titan/Command nodes; defense prompt lists available guards with charges.
- Enemy cooperation from Act II: commanders and named aces get support attack/defend; telegraph (a dotted line between enemy pair when an attack would trigger it).
- Combination attacks gated by Bond level (N4) with per-map charges; if N4 isn't done, add a minimal bond counter and document it.
- Remove the old universal 'support' node.

ACCEPTANCE: tests/combos.cjs extended for charges and gating; a simulation comparing damage per turn before/after (expect a large drop in early-mid game); screenshots of the forecast showing support charges; tests pass.
```

### K4 — Progression economy (M)

```
TASK: Slow mastery down and make choices stick (section 2.5).

- Points from levels only: 2 per level, +3 every 5th level; remove +1 per kill and per-pilot bonus-objective points.
- Experience curve: cost = 100 + 12 × (level − 1); catch-up ×1.5 for pilots 3+ below party median, ×0.75 for 3+ above.
- Merits: bonus objectives and certain secrets award Merits; Halcyon refit tree (deploy slots, part slots, repair bay, refit discounts, respec tokens) with its own screen.
- Respec: free until mission 3; then rising credit cost; free with a token.
- Pacing check: tools/pacing.cjs projects points per pilot by mission from the simulation; targets: 1–2 nodes after map 1, first keystone around map 10, ~60–70% of a class tree at the end; full tree only in New Game+ (add NG+ carry-over rules: points, refits and Merits carry; story flags reset).
- Save migration and tests.

ACCEPTANCE: pacing table vs targets; screenshots of refit tree and respec; tests pass.
```

### V1 — Map diorama renderer (XL)

```
TASK: Render the tactical map as a tilted three.js diorama (section 2.6), keeping the current 2D board as the Low-quality fallback.

- New module js/render/board3d.js: heightfield from tile types with flattened tile plateaus; texture splatting shader over 6–8 biome materials (ASSET_REQUESTS_V3 L-01; procedural noise textures until art arrives), macro variation, soft transitions; road/river spline decals; props from atlases (L-02) as instanced billboards or simple meshes, fading near units and the cursor.
- Lighting per mission (time of day, ambient color, key light angle, dynamic point lights at bases/fires/glows), fog, weather particles (snow, ash, spores, star drift), horizon panorama or sky dome around the board (L-03).
- Units as billboard sprites from painted idle frames (2-frame idle), contact shadows, team ring decals; screen-space plates for name/HP/status/charges.
- Camera: perspective 55–60° tilt, smooth pan/zoom, optional 90° rotation, auto-follow during enemy phase.
- Picking by raycast to tiles; the input code (MAP.onClick/onHover) keeps working with the new coordinate source; touch gestures still work.
- Performance: one draw call per material where possible, instancing for props; target 60 fps at 1080p on a mid laptop (High), graceful Low fallback.

ACCEPTANCE: screenshots of 4 different biomes at desktop and phone; Low mode identical to today's board; e2e passes in High and Low; frame timings reported honestly (SwiftShader numbers are not representative).
```

### V2 — Map overlays, telegraphing and event camera (L)

```
TASK: Make the diorama tell the player everything they need, beautifully.

- Movement range as animated glowing fill with edge pulse; attack range hatching; path ribbon with arrowhead; attack preview from the hovered destination.
- Enemy intent: target lines for enemies that will attack next phase (where the AI is deterministic enough), boss charge-up markers, reinforcement entry markers one phase ahead, support/defend pair links (K3).
- Damage previews on hover (expected damage and kill chance floating over enemies).
- Cinematic event camera for story events: letterbox, move to speaker's unit or event location, focus pull (depth-of-field fake via blur outside a radius), slow push-in; resume player control smoothly.
- Phase transitions with a sweeping light across the board and the phase banner.

ACCEPTANCE: screenshots of each overlay; a recorded sequence (frames) of one event camera; tests pass.
```

### V3 — WebGL battle renderer and VFX engine (XL)

```
TASK: Move battle rendering fully into WebGL and build a data-driven VFX engine (section 2.7).

- Sprites as textured quads with shaders: hit flash, effect rim lighting, dissolve, color grading per backdrop.
- GPU particles (instanced quads, additive/alpha, curl noise, ground collision), ribbons/trails, decals on the battle ground, light pass that brightens the backdrop locally. Use the VFX element textures from ASSET_REQUESTS_V3 L-04 when present; generate procedural soft shapes until then.
- Post: bloom, heat distortion/refraction rings, chromatic aberration pulses, radial blur, two-tone impact frames; all disabled or reduced on Low.
- Effect timelines as JSON in js/data/vfx/*.json (emitters, ribbons, lights, decals, camera cues, time-scale events); the current anim names (rifle, beam, missile, slash, multislash, punch, drill, funnel, plasma, gravity, spirit, breath, railgun, lightning, wave, megabeam, finisher seq) each get a timeline.
- tools/vfx-lab.html: choose attacker/target/backdrop/weapon, play/scrub/loop, edit JSON live, export.
- Keep SCENE.play's API and the battle event model so tactics.js needs no changes; keep skip/fast-forward behavior.

ACCEPTANCE: VFX Lab working; side-by-side before/after frames for 6 weapon types; tools/verify_animation.cjs updated; tests pass.
```

### V4 — Choreography, sprite acting and destruction (L)

```
TASK: Author the spectacle with the V3 engine.

- Power tiers: light / medium / full kits by weapon power; every finisher and combo gets unique choreography (camera language, slow-mo, multi-stage effects) using the splash art from ASSET_REQUESTS_V2 R-04 when present.
- Sprite acting: squash-and-stretch mesh warp, smear frames on dashes, recoil, damage states (sparks/smoke below 30% HP), destruction by fracturing the sprite into 6–12 shards plus explosion sequence and ground scorch.
- Defender reactions: dodge with afterimage ribbons, block with shield flare, barrier with hex-refraction shader.
- Faction signatures: Concord clean cyan-white beams with hard edges; Free States dirty kinetic smoke and sparks; Ourobor organic acid splashes and spores; Vael prismatic refraction and choir light; Hollow inverted-color "unwriting".
- Sound cues aligned to timeline events (M2 keys).

ACCEPTANCE: a frame sheet (start/impact/aftermath) for every weapon anim and every finisher; tests pass.
```

### U1 — UI art direction and component kit (L)

```
TASK: Give the UI an identity: the Halcyon's tactical OS, with faction skins (section 2.8).

- Write docs/ui/STYLE.md: palette tokens per faction, type scale, spacing, frame shapes (angled corners, structural lines, data ticks), motion curves, sound mapping.
- Build reusable components (CSS + small JS helpers): window frame (9-slice from UI art in ASSET_REQUESTS_V3 L-06 or pure CSS until then), tabs, buttons (primary/secondary/danger), stat bars, chips, tooltips, toasts, modals, list rows; faction skin classes (.skin-concord, .skin-freestates, .skin-ourobor, .skin-vael, .skin-halcyon).
- Re-skin: title, setup, map HUD, side panel, action menu, forecast (opponent's skin on their side), defense prompt, intermission, archive, settings, save/load.
- Motion: mechanical open/close, list stagger, number roll-ups; reduce-motion respected.
- Typography: choose and bundle fonts locally (licenses checked), apply the scale everywhere.

ACCEPTANCE: before/after screenshots of every screen at desktop and phone; no regressions in e2e (desktop high/low, phone, tablet).
```

### U2 — Dramatic text and staging (L)

```
TASK: Make words land (section 2.8).

- Script markup: {shout}, {whisper}, {em}, {beat}, {glitch}, {comm} parsed in UI.runScript and battle banners; per-character text speed and blip sounds; update the story-script docs.
- Portrait life: breathing bob, blink and lip-flap when L-08 sheets exist; expression cross-fades.
- Staging: camera punch-in on shouts, alarm tint pulses, comm windows for remote speakers, letterbox for key beats, weighted choice presentation.
- Mission framing: cinematic title card per mission, MISSION START/COMPLETE stamps, boss WARNING sequence, results screen with rank (S/A/B/C) from turns, damage taken, units lost and secondary objective; ranks shown in the mission list.
- Battle text: attack-name title cards with per-type styling, emphasized quotes, EFFECTIVE/RESISTED callouts, CRITICAL stamp.
- Halcyon hub: a painted hub scene (L-07) with hotspots replacing the tab bar (tabs remain as a quick menu).
- Flavor lines: add a one-line in-world flavor text to every skill node, part and spirit (crew voices, per CAST.md if N1 exists).

ACCEPTANCE: screenshots of a shouted line, a whisper, a comm window, a title card, the results screen and the hub; tests pass.
```
