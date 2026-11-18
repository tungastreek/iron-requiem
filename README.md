# Iron Requiem · The Unbroken Chorus

Open **index.html** from this folder, or double-click **Play Iron Requiem.bat** on Windows. It runs in a browser with local assets and a procedural soundtrack. Keep the whole folder together. Click once to enable audio.

Start a new campaign to see the eight added interludes in sequence. Existing saves in the same folder still load through Continue or Load Game. Use System to save to one of three manual slots or export a JSON backup before switching folders or browsers.

- **New Game** opens full-size portrait and frame selection screens. Compare Alteon and Alteon Gigas, then choose your opening loadout.
- **The Shelter Line**, right after Ashfall, pits the squad against Ourobor and a Concord robot detachment. Later forces include Free States salvage fighters, Vael knights and living machines, and the Silence. Ourobor types have illustrated portraits for conversations, the map panel, and battle HUD.
- **Frame Archive** shows machines and weapon animations. The expansion adds eight playable pilots and 23 enemy designs, plus three modifier variants. Four combination attacks require adjacent partners with enough EN and Will. Gunnar, Ilse, Jin, and Brann can learn Support Defend. Use the Sortie tab to select up to four recruited auxiliary pilots.
- There are **20 mission definitions** across both routes, including 17 missions on the normal route through either branch and 18 with the true finale. Maps span 15 sizes, from 16 × 11 to 24 × 16. The map header shows the current size.
- Settings offer Auto, High and Low graphics, animation speed, music and effects, and automatic counterattacks. The map has zoom and touch movement confirmation. Enemy attacks offer Counter, Evade, Defend and any available Support Defend response.

## Art and offline play

The original sprite files used charcoal mattes. The offline image scripts allow the importer to read pixels even when opening the game from disk. Painted sprites and backdrops share a canvas in battle. Missing painted art uses the procedural art fallback. The `assets/` folder contains the art, exact generation prompts, optional alignment metadata, and generated offline scripts.

See [ART_PROMPTS.md](ART_PROMPTS.md) for the pose layouts and anchor format. After changing art, run `python3 tools/build_offline.py` to rebuild the image scripts and manifest.

## Verification

See [campaign results](tests/CAMPAIGN_REPORT.md), [balance notes](tests/BALANCE.md), and [browser acceptance](tests/BROWSER_QA.md). Recorded checks cover sprite transparency and offline asset bytes, deployment and routes, combat and support systems, save migration, and simulated animation timelines. Browser screenshots, audible playback, device timings, and Windows launch checks are pending.
