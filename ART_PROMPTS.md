# Iron Requiem art and music prompts

The [original prompt pack](assets/ART_PROMPTS_revised.md) specifies the source sprites, portraits, scenes, tiles, and icons. The [expansion prompt folder](assets/prompts/) contains the exact prompts used to generate the added four-pose machine sheets and portrait sheets. The specialist [unit briefs](assets/prompts/ENEMY_EXPANSION.md) and optional [music briefs](assets/prompts/MUSIC.md) also live there.

Unit sheets use either a two-by-two layout for one machine or a four-by-four atlas with one machine per row. Atlas columns contain two idle poses, attack, and hit. Use genuine alpha transparency, edge clearance, and a consistent scale, facing, and ground line. The importer can remove the flat charcoal matte specified in the original pack.

Portrait atlases use one speaker per row. Human expressions are neutral, angry, smiling, and shocked. Ourobor expressions are neutral, aggressive, alert, and hurt. The atlas row mappings are in `js/data/expansion.js`, `js/data/enemy-deployments.js`, and `js/data/pilots.js`.

## Optional art metadata

Put `<unit-id>.json` in `assets/units/` to override that unit's crop and animation anchors. `anchors.muzzle`, `anchors.core`, and `anchors.head` are normalized `[x,y]` coordinates in the common cropped pose rectangle. Use `ground` to override the normalized foot line, `scale` to adjust battle size, `fly` to override hover, and `facesLeft` for a left-facing source sheet. `keyTolerance` sets the maximum RGB-distance used to remove a flat matte. Preserve dark internal armor in source art and leave anchor coordinates unset when the defaults are suitable.

Optional `assets/portraits/<pilot-id>.json` files provide `face: [x,y,size]` in normalized cell coordinates to guide the crop. Run `python3 tools/build_offline.py` after changing PNGs or metadata. The generated metadata and image scripts let the same assets load from disk and over HTTP.

The Support Defend skill uses a shield symbol with the existing defensive icon. A replacement icon can be drawn as a cyan shield in front of an allied silhouette, centered in a square cell with no lettering.
