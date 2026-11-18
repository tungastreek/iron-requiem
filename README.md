# Iron Requiem — The Unbroken Chorus

Open **index.html** to play locally, or double-click **Play Iron Requiem.bat** on Windows. No installer, server or game account is needed. Keep the entire folder together, including `assets/offline/` and `vendor/`. Browser sound starts after a click. Settings control sound, music, animation speed and automatic counterattacks.

This extends the supplied Iron Requiem game. The tactical map, cutscenes, combat rules, original chapters, route split, endings and existing artwork remain the foundation.

## What was added

- Eight playable machines and pilots: Aegis, Nautilus, Vesper, Mastodon, Kestrel, Cinder, Orpheus and Palisade. Each has a different silhouette, loadout, role, four sprite poses, pilot expressions, battle dialogue and a fifteen-node skill tree.
- Eight enemies: Mantle, Leech, Chrysalis, Bellwether, Bailiff, Marauder, Cantor and Nullmaw. They enter the original campaign as well as the interludes.
- 53 weapon definitions for the new machines, with five new animation families: tethered harpoons, harmonic sonar, shield discharges, spore volleys and entropic rings. Finishers combine these with the existing sequences, cut-ins, sound and particles.
- Eight connected interludes between the original chapters. There are now 20 chapter definitions across both routes: 17 missions on a normal-ending playthrough, or 18 with the true finale. These numbers include the original missions; this is not a fifty-mission release.
- Decisions about the civilian archive and the brood nursery affect later dialogue, resonance and allied reinforcements.
- An auxiliary wing: choose up to four recruited pilots on the Sortie tab. They deploy beside the main story squadron. Upgrades, parts, spirits and pilot skills use the existing intermission screens.
- A **Frame Archive** on the title screen. Inspect allies and enemies on several backdrops and preview each weapon without changing your campaign save.

## Sprite and black battlefield correction

The original importer reads image pixels to remove the charcoal sprite matte. Browsers can block that access for images loaded from `file://`; the same restriction prevents uploading painted backdrops to WebGL. `assets/offline/` packages the original PNG bytes as local scripts and decodes them as safe data images. The importer also adapts to the textured charcoal border. Painted battles now draw the actors and their environment on the same canvas; 3D remains a fallback for exchanges without painted actors.

This approach works without asking the player to run a local server or change browser security settings. Do not remove the offline folder from a portable copy.

## Assets and generation prompts

All new image files are under `assets/units/` and `assets/portraits/`. The six exact generation prompts and their row definitions are under **assets/prompts/**. They were generated with the built-in image tool. Actual output dimensions and hashes are recorded in **assets/manifest.json**; the generated atlases are 1254 × 1254, irrespective of the requested prompt dimensions.

The original prompt collection remains in `assets/ART_PROMPTS_revised.md` and `assets/generation_prompts.json`. New unit atlases use four rows of machines and four columns of poses: idle A, idle B, attack, hit. Portrait atlases use four rows of people and four columns of expressions: neutral, angry, smiling, shocked. Atlas mappings live in `js/data/expansion.js`.

After replacing PNG files, run `python3 tools/build_offline.py` to refresh their portable wrappers and manifest. This is a development step; players need no Python installation.

## Saves and checks

Existing saves in the same browser and folder keep their chapter and unlocks. Starting a new campaign includes every interlude; a save already beyond an interlude will not automatically replay it. Progress is stored by the browser, so moving to a different browser or folder can require starting again.

The automated data checks cover chapter routes, unit deployment, weapon forecasts, skill trees, asset references, sprite processing and offline-wrapper contents. `tools/verify.cjs` runs with Node and has no package dependencies. `tools/verify_animation.cjs` also confirms that all 53 new attack timelines finish on a simulated drawing surface. See `CHECKS.json` and `ANIMATION_CHECKS.json` for the recorded results and limits. Browser playback and Windows execution still require a playtest; they were not verified in this environment.
