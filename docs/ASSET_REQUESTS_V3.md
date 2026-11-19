# Iron Requiem — Asset Requests V3 (map, VFX, UI)

Art for [HANDOFF_V3_DEPTH_AND_SPECTACLE.md](HANDOFF_V3_DEPTH_AND_SPECTACLE.md). A person generates it; agents integrate it. Everything is optional: each task ships a procedural fallback first. Use the style blocks from [ASSET_REQUESTS_V2.md](ASSET_REQUESTS_V2.md) (mech, character, scene) where noted. After adding files, run `python3 tools/build_offline.py`.

| ID | Request | Count | Used by | Folder |
|---|---|---|---|---|
| L-01 | Seamless terrain materials | 14 | V1 | `assets/materials/` |
| L-02 | Map prop atlases | 6 atlases (96 props) | V1 | `assets/props/` |
| L-03 | Horizon panoramas and battle backdrop depth layers | 8 + 11×3 | V1, V3 | `assets/horizon/`, `assets/battle_layers/` |
| L-04 | VFX element textures | 4 atlases | V3, V4 | `assets/vfx/` |
| L-05 | Class emblems and keystone icons | 1 + 6 sheets | K2 | `assets/icons/` |
| L-06 | UI frame kit and faction skins | 6 sheets | U1 | `assets/ui/` |
| L-07 | Halcyon hub scene | 1 + 5 overlays | U2 | `assets/hub/` |
| L-08 | Portrait talk and blink sheets | 13 (+2 atlases) | U2 | `assets/portraits/` |

Generation tips: textures and icons are single-frame and reliable with image models. Exact edge alignment and animation consistency are not, so the requests avoid relying on them. Where seams appear, the engine blends or the agent fixes them with a mirror-and-blend pass.

---

## L-01 Seamless terrain materials

**Folder:** `assets/materials/` · `<key>.png` · 1024 × 1024 · **seamlessly tileable on all four edges** · straight top-down, flat even lighting (the engine lights the board) · no objects that read as individual props.

```
Create a seamless tileable ground texture for a painted tactics-game map, viewed straight from above with flat even lighting, painterly hand-painted anime style matching a high-quality mecha tactics RPG. The texture must tile seamlessly on all four edges, with no visible repeating landmark, no shadows from a single direction, no text.
MATERIAL:
```

| key | Material |
|---|---|
| `grass` | `lush short grass with subtle color variation and tiny wildflowers` |
| `grass_dry` | `dry yellowed grass with patches of dirt` |
| `dirt` | `packed brown dirt with small pebbles and tire ruts` |
| `asphalt` | `cracked dark asphalt with faded paint fragments (no readable markings)` |
| `concrete` | `weathered concrete slabs with expansion joints` |
| `rock` | `grey mountain rock with lichen and cracks` |
| `sand` | `coastal sand with ripples and shell fragments` |
| `snow` | `wind-packed snow with soft drifts` |
| `ice` | `blue glacial ice with trapped bubbles and fracture lines` |
| `scorched` | `burnt ground with ash and glowing embers in cracks` |
| `flesh` | `wet purple-red organic chitin floor with veins and faint yellow-green bioluminescent nodes` |
| `deck` | `starship or colony metal deck plating with panel seams and rivets` |
| `hull` | `space colony outer hull plating, dark grey with lit maintenance strips` |
| `vael_floor` | `translucent violet crystal floor with faint geometric light lines (no letters)` |

## L-02 Map prop atlases

**Folder:** `assets/props/` · `props_<biome>.png` · 2048 × 2048 · 4 × 4 grid, one prop per cell · **camera from above at 55–60°** (the same angle as the map) · lit from the upper left · flat charcoal #2B2B2B background (keyed out) · consistent scale per atlas · no text.

```
Create a 4x4 atlas of map props for a painted tactical RPG diorama. Each cell contains ONE prop seen from above at a 55-60 degree angle, lit from the upper left, painterly anime style matching a high-quality mecha tactics RPG, centered with margin, consistent scale, on a flat solid charcoal #2B2B2B background. No text, no shadows on the background.
PROPS (reading order):
```

| file | Props (16 each) |
|---|---|
| `props_urban.png` | 4 office buildings of different heights, 2 apartment blocks, a ruined building, a burning building, a radar dish, a fuel tank, a wrecked car, a barricade, a streetlight cluster, 2 street trees, a crater |
| `props_base.png` | a hangar, a control tower, a landing pad with lights, a bunker, a crane, crates, an anti-air gun, a fuel depot, a comms mast, a searchlight, sandbags, a mech maintenance gantry, a damaged hangar, a supply truck, a flag pole (no insignia), a heli pad |
| `props_nature.png` | 4 different trees, 2 pine clusters, 2 rocks, a boulder field, a cliff edge, a waterfall top, reeds, a fallen log, a small pond, a shrub cluster, a snowy pine |
| `props_snow.png` | ice crags (3 variants), a research dome, a frozen wreck, a snow-covered antenna, an ice pillar with glowing crystal, a crevasse edge, snow drifts (2), a supply sled, a beacon, a frozen mech wreck, an ice arch, a glowing crystal cluster |
| `props_hive.png` | sinew pillars (3), egg clusters (2), a chitin spire, a glowing node pool, a cocoon, bone ribs, a fleshy wall chunk, spore vents (2), a fossilized machine in flesh, a crystal mural shard, hanging tendrils, a burrow hole |
| `props_space.png` | asteroids (4), a ship wreck section, a solar array, a satellite, a colony docking arm, a beacon buoy, debris clusters (2), a Vael crystal monolith, a Vael light ring fragment, a mine, a gas cloud wisp, a broken mech arm |

## L-03 Horizon panoramas and battle depth layers

**a) Board horizons:** `assets/horizon/<biome>.png` · 4096 × 1024 · seamless left-right · scene style · the lower 30% is a soft haze that blends into the board edge · no foreground objects.

Biomes: `urban_dusk`, `mountain_day`, `coast`, `elevator`, `snowfield`, `hive_cavern`, `orbit`, `vael_space`.

```
Create a wide 4096x1024 horizon panorama that wraps seamlessly left to right, painterly anime background style, matching a high-quality mecha anime. The lower 30% fades into soft atmospheric haze (it blends with a 3D board's edge). No people, no robots, no text.
HORIZON:
```

**b) Battle backdrop depth layers** (optional, for parallax): for each existing battle backdrop key (`city`, `fire`, `ruins`, `sky`, `elevator`, `space`, `colony`, `hive`, `vael`, `ice`, `void`), three files in `assets/battle_layers/<key>_sky.png`, `<key>_mid.png` and `<key>_ground.png`, each 1536 × 1024:

- **sky:** sky and far horizon only, fully opaque.
- **mid:** the landmarks along the horizon line, on transparent or flat charcoal #2B2B2B.
- **ground:** the foreground floor from the horizon down, on transparent or flat charcoal.

Recreate them from the existing backdrop's prompt (in `assets/ART_PROMPTS_revised.md`) so the layers match it. If layers don't line up, the engine falls back to the single backdrop.

## L-04 VFX element textures

**Folder:** `assets/vfx/` · 2048 × 2048 · 4 × 4 atlas · **pure black background** for additive elements, or **flat #2B2B2B** for alpha elements (noted per atlas) · elements centered, soft edges fully inside the cell · **white or greyscale** unless noted (the engine tints by attack type).

```
Create a 4x4 atlas of visual-effect texture elements for a game particle system. Each cell contains ONE isolated element centered with margin and soft edges fully inside its cell. Painterly anime effect style with crisp shapes, high contrast. Background as specified. No text.
ELEMENTS:
```

| file | Background | Elements (16) |
|---|---|---|
| `vfx_energy.png` | black, additive, white/greyscale | soft glow orb, hard core flare, 4-point star flare, 6-point lens flare, ring shockwave, thick ring, energy swirl, spiral, beam core segment (horizontal), beam edge wisps, lightning bolt (horizontal), branching arc, slash crescent (thin), slash crescent (thick), speed-line burst, hex barrier tile |
| `vfx_fire.png` | black, additive, full color | 4 fire tongue shapes, 2 fireball cores, an explosion flash, a fire ring, 2 ember clusters, a plasma blob, a heat shimmer swirl (greyscale), a muzzle flash (front), a muzzle flash (side), a rocket exhaust plume, a spark cluster |
| `vfx_smoke.png` | flat #2B2B2B, alpha | 6 smoke puffs (light to dense), 2 dust kicks, a smoke column, a smoke ring, steam, an ash cloud, 2 debris chunk clusters (metal), a dirt spray |
| `vfx_decals.png` | flat #2B2B2B, alpha, seen from above | 4 ground crack decals, 3 scorch marks, a crater rim, a slash scar on the ground, a skid mark, 2 acid splashes (green), 2 glowing rune-like (no letters) gravity scars, a frost burst |

## L-05 Class emblems and keystone icons

Same badge style as the original icon block (rounded-square metal badge, thin gold-and-steel bezel, flat charcoal #2B2B2B background, no text) · 1024 × 1024 · 4 × 4.

**`icons_classes.png`:**
```
1 Aurora (a crystal core with feather blades, cyan), 2 Titan (a clenched gauntlet with flame, crimson), 3 Interceptor (a swept wing with speed trails, teal), 4 Duelist (crossed blade and lance, scarlet),
5 Artillery (a howitzer arc with impact, amber), 6 Sniper (a scope reticle with one eye, green), 7 Bulwark (a tower shield with a wall, steel blue), 8 Engineer (a wrench and repair cross, orange),
9 Resonant (a moth with waves, violet), 10 Command (a flagship bow with a star, gold), 11 Starborn (a dragon-manta wing around a star, violet-gold), 12 Keystone frame (an empty ornate hexagon),
13 Deed requirement (a laurel with a tally mark), 14 Respec (a circular arrow over a gear), 15 Merit (a medal with wings), 16 Halcyon refit (a starship silhouette with a wrench).
```

**Keystone icons:** `icons_keys_<n>.png`, 6 sheets × 16 = 96 cells covering the 88 keystones (11 classes × 4 pairs × 2 options) plus spares. Task K2 produces the final list. Use the mech style for symbols, the badge frame from the icon style, and the class color for the inner glow.

## L-06 UI frame kit and faction skins

**Folder:** `assets/ui/` · 2048 × 2048 · 4 × 4 grid · flat #2B2B2B background · pieces designed for **9-slice** scaling (corners detailed, edges and center plain and stretchable) · no text.

```
Create a 4x4 sheet of user-interface frame pieces for a sci-fi mecha tactics game, in the visual language of a starship tactical operating system: angled corners, thin structural lines, small data ticks, subtle glass panels, crisp and readable. Each cell contains ONE UI element designed for 9-slice scaling (decorated corners, plain stretchable edges and center). No text, no numbers, no logos.
THEME AND ELEMENTS:
```

One sheet per skin. Elements per sheet: window frame (large), window frame (small), title bar, button (normal), button (hover), button (pressed), tab (active), tab (inactive), bar track, bar fill, tooltip frame, toast frame, portrait frame, nameplate, divider line, corner ornament.

| file | Theme |
|---|---|
| `ui_halcyon.png` | `player UI: dark navy glass, cyan and amber accents, clean engineering lines` |
| `ui_concord.png` | `Concord military: cold white and gunmetal, gold trim, rigid geometry` |
| `ui_freestates.png` | `Free States rebels: olive and rust, welded patches, stencil-like marks (no letters)` |
| `ui_ourobor.png` | `Ourobor: organic chitin and sinew framing, faint yellow-green bioluminescence` |
| `ui_vael.png` | `Vael: violet crystal glass, thin gold filigree, soft inner light` |
| `ui_stamps.png` | `16 emblem frames for stamps and banners: mission start, mission complete, warning, critical, rank frames (4 sizes), objective ribbons, chapter card frame, results panel frame — frames only, no letters` |

## L-07 Halcyon hub scene

**Folder:** `assets/hub/` · scene style.

- `hub_bridge.png`, 2560 × 1440: `The command bridge of the independent cruiser Halcyon seen from the rear, wide angle: the captain's chair in the center, a large front window with Earth and stars, a holographic tactical table to the left, a doorway to the hangar on the right with mech silhouettes, crew quarters corridor at the far left, an archive console at the far right. Warm interior light against cold space. No people, no text.`
- **Hotspot glow overlays** (same framing, 2560 × 1440, transparent, or black for additive): `hub_hangar_glow.png`, `hub_briefing_glow.png`, `hub_quarters_glow.png`, `hub_archive_glow.png`, `hub_systems_glow.png`. Each lights up one region of the scene. If exact alignment fails, the engine draws procedural highlights instead.

## L-08 Portrait talk and blink sheets

**Folder:** `assets/portraits/` · `<pilot_id>_talk.png` · 1024 × 1024 · 2 × 2 · same framing, background and character as the original portrait sheet (flat deep navy #101A33) · character style.

```
Create an animation sheet for the SAME character as the existing portrait (match face, hair, outfit, framing and lighting exactly; only the eyes and mouth change). 1024x1024, 2x2 grid, head and shoulders, three-quarter view facing RIGHT, identical crop. Top-left: neutral, mouth closed, eyes open. Top-right: neutral, mouth open mid-word, eyes open. Bottom-left: neutral, mouth closed, eyes closed (blink). Bottom-right: angry, mouth open shouting. Background: flat solid deep navy #101A33. No text.
CHARACTER: (paste the line from the original portrait prompt)
```

Make sheets for: `rei`, `rina`, `mira`, `gunnar`, `ilse`, `brann`, `odessa`, `jin`, `yuna`, `lucien`, `sera`, `kroll`, `aurelion`. For the auxiliary atlases, use `portraits-relief_talk.png` and `portraits-outriders_talk.png` (4 × 4, columns as above).

Talk frames are the least reliable request: image models drift between cells. The engine should only use a talk sheet whose face matches the base portrait. Task U2 adds a similarity check and falls back to breathing and cross-fades when it fails.
