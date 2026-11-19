# Depth and Spectacle verification

Play from the repository's `index.html`, including by opening it directly from disk. The Windows batch launcher still opens that file. Windows and Safari were outside this run's browser coverage.

## Rules and campaign

| Check | Result |
|---|---|
| Asset, route and deployment verification | 62 chassis, 18 pilots, 11 classes, 321 skill options and all 20 mission definitions |
| Animation smoke test | 196 standard and finisher weapon timelines completed with the no-op drawing surface |
| Normal simulation | 114 wins in 114 starts across both branches, including regular and true finale paths |
| Easy simulation | 38 wins in 38 starts on seed 17 |
| Hard simulation | 31 wins in 38 starts on seed 17 |
| Combat and migration | Damage ceiling, hit clamps, level governor, retry assistance, exclusive choices, deed gates, cooperation charges and save migration passed |

The simulation starts each mission with a canonical roster, level and loadout for that stage. It exercises the live turn rules and scripted events. Each start is independent. The Normal seeds were 17, 29 and 71. The set includes both routes of the standard ending.

Late Normal clears ranged from 4 to 14 turns, with six losses at the worst simulated stage. The Vael Herald and the two final interludes were among the shortest clears. The regular finale path and Fourth Dawn carried the highest casualties. Hard failures occurred on selected runs of Wings of the Halcyon, Crimson Hound, Requiem for Iron and Fourth Dawn. A simulation hitting its 35-turn cap counts as a failure.

The pressure index and before-and-after chart are [in the difficulty report](../docs/difficulty/CURVE.md). All 20 estimates lie below the proposed band. The simulations show that the governed Normal route can be completed with the fixture builds. The full 8–12-turn late campaign and casualty targets still need tuning. The V3 model prioritizes deployment limits, an opt-in retry cushion, capped damage, new ace commands and sensor fog on What the Dark Repeats.

## Browser checks

Chrome ran the opening setup and attack flow from disk in High on desktop and tablet sizes and in Low in both phone orientations. The test selects two enemies with the forecast open, clears and reselects a target, starts battle and uses Skip. The desktop High flow was also verified over a loopback HTTP server. The lab played and scrubbed six tested effects and exported the railgun profile as JSON. The bridge and purchase/refund flow were checked separately from the map.

During the HTTP desktop check, on Apple M1 Max with Chrome ANGLE Metal, the recorded means were 19.72 ms per map frame and 17.50 ms per battle frame at a 1440 × 900 viewport. These samples include UI updates and are from a short local session. Phone and tablet sizes are viewport tests on the same computer.

## Rendering coverage

High uses a Three.js terrain mesh with instanced scenery, the keyed painted frames and a GPU spark pass. Battle sprites, the timeline compositor and the HUD still use Canvas. The board supports existing pan and zoom controls, raycast picking, terrain height, weather, contact markers, reinforcement markers and scripted focus shots. The low profile uses the flat board and lighter effects. The asset importer recognizes the optional V3 horizon, battle depth, fire and energy textures, class badges and bridge art. The current art folder supplies the painted fallback scenes.

Material splatting, a full WebGL battle compositor, portrait talk sheets, full before-and-after capture coverage and the remaining V3 raster atlas set are open. The VFX Lab previews its own charge, travel and impact tracks. Its JSON export describes an effect profile. Weapon-specific movement, reactions and event scheduling remain in the game.

## Screenshots

- Diorama biomes [Kestrel](evidence/v3/board-kestrel.jpg), [Hive](evidence/v3/board-hive.jpg), [Antarctic ice](evidence/v3/board-ice.jpg), [Vael](evidence/v3/board-vael.jpg).
- Player surfaces [Halcyon bridge](evidence/v3/halcyon-bridge.jpg), [Aurora tracks](evidence/v3/aurora-trees.jpg), [battle](evidence/v3/desktop-high-battle-effects.jpg).
- Responsive screens [landscape forecast](evidence/v3/phone-low-forecast.jpg), [portrait forecast](evidence/v3/portrait-low-forecast.jpg), [tablet diorama](evidence/v3/tablet-high-map.jpg).
- Lab impact profiles [beam](evidence/v3/lab-beam.jpg), [blade](evidence/v3/lab-slash.jpg), [missile](evidence/v3/lab-missile.jpg), [gravity](evidence/v3/lab-gravity.jpg), [plasma](evidence/v3/lab-plasma.jpg), [railgun](evidence/v3/lab-railgun.jpg).
