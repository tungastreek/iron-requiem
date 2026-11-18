# Enemy systems integration

`js/data/enemy-deployments.js` must load after `expansion.js`. `js/map/enemy-systems.js` must load before `combat.js`. The original Cantor is reused and receives `abil.cantor`; the Concord drone uses `aegisdrone` to preserve the playable Aegis.

## Combat hooks

- In `makeUnit`, call `ENEMIES.init(u,o)` before computing its initial HP. This initializes variants, their name and extra skills, first-strike state, movement distance and brood ownership.
- `CB.mstats`: final return `ENEMIES.mechStats(u,o)`.
- `CB.pstats`: final return `ENEMIES.pilotStats(u,o)`.
- `CB.hitChance`: add `ENEMIES.accuracy(a) + ENEMIES.aura(a,G.map) - ENEMIES.aura(d,G.map)` before clamping.
- `CB.damage`: multiply by `ENEMIES.damageMultiplier(a,w) * ENEMIES.reduction(d,G.map)` before barrier subtraction.
- `CB.roll`: add `ENEMIES.statusBonus(a)` to a weapon's status chance. If `ENEMIES.phantom(d)` succeeds, return a miss with `phantom:true`, without consuming the defender's normal accuracy check. Show PHANTOM in the battle reaction.
- `CB.applyResult`: call `ENEMIES.spent(a)` once after the attack is resolved. Do not call it for a forecast or during resource spending, which occurs before the accuracy roll and would consume the first-strike bonus too early.
- Multiply both EXP and credits from the unit by `ENEMIES.reward(def)`.

## Map and phase hooks

- Preserve `u.moveDistance` while moving, adding the number of tiles in the movement path. Reset it at the start of its next phase. A charge requires four or more tiles and a melee weapon.
- `moveCost`: after flying/amphibious handling, return `ENEMIES.moveCost(u,tile,normalCost)`.
- AI candidate score: add `ENEMIES.supportScore(e,x,y,st)` to favor nearby allies for healers, conductors, carriers and shield drones. Existing flank/pincer scoring handles Gale packs; Monolith has movement zero.
- On a successful pulling attack, use `ENEMIES.pullTile(st,a,d,w)` and animate the returned one-tile destination instead of normal knockback. It rejects walls, occupied tiles, ships and XL targets.
- After phase status and regeneration, call `ENEMIES.phase(st,team,hooks)` once. `team` is player/enemy/ally. Hooks: `maxHP:u=>CB.mstats(u).hp`; `spawn:(spec,team)=>{const u=makeUnit(spec,team);st.units.push(u);return u;}`; `effect:event=>...` for floaters and sound. Events contain `kind`, `source`, `target`; heal adds `amount`, choir adds `cleansed`. Brood spawns track their parent UID and cap at three living children per parent.
- New Free States units have `MECHS[id].faction==='free_states'`; use this in `makeUnit`'s enemy portrait/line-set choice.
- `ENEMIES.badge(ctx,u,cx,cy,tileSize)` draws the variant ring and badge. Coordinates are the unit's map center.

## Presentation hooks

- `ENEMIES.label(u)` returns its display name and description for the status panel and forecast.
- `ENEMIES.paint(u)` returns filter/color/glow/aura. Wrap painted-sprite drawing in a saved context with that filter; the commander gets a gold glow, the corrupted variant dark violet aura particles.
- `R3D` already handles variant emissive color and glow through `rig.setVariant(a.u.variant)` in its battle frame. All 16 requested specialist roles have a distinct geometric rig using bespoke builders or humanoid kits.

## Checks

Run `node tests/enemies.cjs`. It checks variant modifiers and restrictions, status chances, first strike, commander aura, shield aura, charge threshold, burrowing, pull, repair, choir, brood limits, placement coverage and all 16 real three.js rig constructors/pose applications. Output is in `tests/ENEMY_REPORT.json`.

No browser renderer, screenshot, end-to-end test or campaign balance run was performed here. A geometry constructor check cannot establish visual quality. Every new type is placed in two or three chapters except the reused Cantor, which already appears in four; the specialist replacement pass changes at most one third of unprotected repeated grunts per chapter. Original chapters 1 and 2 have no variants.
