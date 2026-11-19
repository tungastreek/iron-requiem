# Iron Requiem · The Unbroken Chorus

Open **index.html** from this folder, or double-click **Play Iron Requiem.bat** on Windows. It runs in a browser with local assets and a procedural soundtrack. Keep the whole folder together. Click once to enable audio.

Start a new campaign to see the eight added interludes in sequence. Existing saves in the same folder still load through Continue or Load Game. Use System to save to one of three manual slots or export a JSON backup before switching folders or browsers.

- **New Game** opens full-size portrait and frame selection screens. Compare Alteon and Alteon Gigas, then choose your opening loadout.
- **The Shelter Line**, right after Ashfall, pits the squad against Ourobor and a Concord robot detachment. Later forces include Free States salvage fighters, Vael knights and living machines, and the Silence. Ourobor types have illustrated portraits for conversations, the map panel, and battle HUD.
- **Frame Archive** shows machines and weapon animations. The expansion adds eight playable pilots and 23 enemy designs, plus three modifier variants. Four combination attacks are available to specific pilot pairs. The Sortie tab shows deployment capacity and lets you prioritize recruited auxiliaries.
- There are **20 mission definitions** across both routes, including 17 missions on the normal route through either branch and 18 with the true finale. Maps span 15 sizes, from 16 × 11 to 24 × 16. The map header shows the current size.
- Settings offer Auto, High and Low graphics, animation speed, music and effects, and automatic counterattacks. The map has zoom and touch movement confirmation. Enemy attacks offer Counter, Evade, Defend and any available Support Defend response.

## Depth and Spectacle

- **11 machine classes** each have three five-tier paths. Tiers 3 and 5 offer exclusive choices, and capstones require field deeds. Each pilot also has a personal discipline.
- Support Attack and Support Defend use per-phase charges. Combination attacks require shared Will, EN, positioning and a pilot bond. Earn mission ranks and Merits to refit the Halcyon.
- Choose Easy, Normal, Hard or Requiem at campaign setup. Easy and Normal offer assisted retries after two defeats. V1 and V2 saves migrate when loaded. Purchased legacy skills refund their points plus 10%, rounded up.
- High graphics uses a raised, perspective terrain board and a GPU spark pass in battle. Low uses the flat board and lighter effects. The combat forecast sits beside or below the map so another enemy can be selected while it is open.
- Use the **Halcyon bridge** to reach briefing, quarters, hangar, engineering, archive and systems. Open the [VFX Lab](tools/vfx-lab.html) to inspect and edit the effect profiles.

## Art and offline play

The original sprite files used charcoal mattes. The offline image scripts allow the importer to read pixels even when opening the game from disk. Painted sprites and backdrops share a canvas in battle. Missing painted art uses the procedural art fallback. The `assets/` folder contains the art, exact generation prompts, optional alignment metadata, and generated offline scripts.

See [ART_PROMPTS.md](ART_PROMPTS.md) for the pose layouts and anchor format. After changing art, run `python3 tools/build_offline.py` to rebuild the image scripts and manifest.

## Verification

See [campaign results](tests/CAMPAIGN_REPORT.md), [balance notes](tests/BALANCE.md), and [browser acceptance](tests/BROWSER_QA.md). Recorded checks cover sprite transparency and offline asset bytes, deployment and routes, combat and support systems, save migration, and simulated animation timelines. The [V3 results](tests/V3_RESULTS.md) cover campaign simulations, desktop and touch-size browser checks, and remaining balance targets. The [pressure chart](docs/difficulty/CURVE.md) can be regenerated with `node tools/pressure.cjs`.

## Roadmap

[docs/HANDOFF_COMMERCIAL.md](docs/HANDOFF_COMMERCIAL.md) audits the game against a commercial bar and contains self-contained task prompts for agents. [docs/ASSET_REQUESTS_V2.md](docs/ASSET_REQUESTS_V2.md) lists the art, music, sound and voice still to be generated. [docs/HANDOFF_V3_DEPTH_AND_SPECTACLE.md](docs/HANDOFF_V3_DEPTH_AND_SPECTACLE.md) redesigns difficulty, skills and presentation (machine classes, cooperation, progression, map diorama, VFX, UI), with art in [docs/ASSET_REQUESTS_V3.md](docs/ASSET_REQUESTS_V3.md).
