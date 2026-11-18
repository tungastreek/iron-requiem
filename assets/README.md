# Iron Requiem — Generated Art Pack and Expansion

The original 100-image pack described below is now joined by twelve atlases: **112 PNG files** in total. The additions cover 31 machines, eight pilots, and eight Ourobor faces.

| Atlas | Rows, top to bottom |
| --- | --- |
| units/allied-vanguard.png | Aegis, Nautilus, Vesper, Mastodon |
| units/allied-outriders.png | Kestrel, Cinder, Orpheus, Palisade |
| units/enemy-brood.png | Mantle, Leech, Chrysalis, Bellwether |
| units/enemy-legions.png | Bailiff, Marauder, Cantor, Nullmaw |
| portraits/portraits-relief.png | Anika, Corin, Leda, Hugo |
| portraits/portraits-outriders.png | Noor, Emi, Orran, Vale |
| units/specialist-concord.png | Valkyr, Aegis Drone, Siege Crawler, Shade |
| units/specialist-free-states.png | Rigger, Harpoon, Breaker, Gale |
| units/specialist-legacy-brood.png | Spitter, Burrower, Broodmaw, Skyray |
| units/specialist-vael.png | Seraph Lancer, Monolith, Echo |
| portraits/ourobor-portraits.png | Crawler, Wyrmling, Behemoth, Hive Mother |
| portraits/ourobor-specialists.png | Mantle, Leech, Chrysalis, Bellwether |

The new atlases are 1254 × 1254. Unit columns contain idle A, idle B, attack and hit. Portrait columns contain neutral, angry, smiling and shocked. The exact new generation prompts are in `prompts/`. Atlas mappings are in `js/data/expansion.js`. The new unit sheets contain alpha transparency.

**Keep `offline/` in a portable copy.** It contains byte-preserving data-image wrappers that let the browser process sprites when opening the game directly from a folder. Rebuild after replacing PNG files with `python3 tools/build_offline.py`. The refreshed manifest records actual dimensions and hashes for all 112 PNG files.

## Original pack

100 generated PNG images from ART_PROMPTS_revised.md, including the eight optional event scenes.

- 30 unit sprite sheets: 1536 × 1024, 2 × 2 frames.
- 25 pilot portrait sheets: 1024 × 1024, 2 × 2 expressions.
- 16 story backgrounds: 1536 × 1024.
- 11 battle backdrops: 1536 × 1024.
- 4 terrain sheets: 1024 × 1024, 4 × 4 tiles.
- 5 icon sheets: 1024 × 1024, 4 × 4 badges (80 icons).
- 1 title key art: 1536 × 1024.
- 8 story event paintings: 1536 × 1024.

Copy the assets folder into the game directory, preserving its subfolders and filenames. The black dialogue background is supplied by the game and has no image file.

All artwork was generated with the built-in image-generation tool. Square outputs were resized to the specified export dimensions. No template or placeholder images are included. The supplied revised prompt pack and extracted per-asset prompt blocks are included for reference. Additional generation constraints clarified margins, layouts, and empty space; four aerial/space battle backdrops were regenerated to remove solid platforms. The title uses the generated ALTEON sheet as a design reference.

## Verification and limitations

All 100 expected PNG paths are present, dimensions match the requested sizes, and file hashes are unique. manifest.json records dimensions and SHA-256 hashes. The ZIP has been checked for integrity.

This is generated artwork, not a pixel-perfect production certification. Some unit and portrait backgrounds retain subtle texture instead of exact uniform hex colours. Pose alignment, margins, small mechanical details, limb/wing counts and effects can vary between frames; some attack and hit frames include extra sparks. Tile self-seams and edge blending are not guaranteed. Review these in the actual importer before final production use.
