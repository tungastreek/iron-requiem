# Save slots and portable backups

The legacy `iron-requiem-save-v1` browser-storage key remains the autosave key. Its contents are upgraded to save version 2 on first access. Three manual slots use `iron-requiem-slot-1`, `iron-requiem-slot-2`, and `iron-requiem-slot-3`.

Migration preserves the protagonist, roster, skill progress, upgrades, parts, inventory, campaign flags, chapter, codex, endings, auxiliary wing, and extension fields. Version 2 adds metadata for the last save time and visible-session playtime. Earlier saves have an unknown timestamp and zero recorded playtime. Continue chooses the valid save with the most recent timestamp.

The load screen lists four slots with a leader portrait, chapter, timestamp, and playtime. Loading resumes at the chapter briefing, matching the existing campaign save model. Manual saves and deletion use an in-page confirmation before replacing an occupied slot or removing a saved copy.

The export screen displays JSON with a Copy button. When clipboard access is unavailable, it selects the text for ordinary keyboard copying. Import accepts pasted JSON, validates it before changing the current campaign, migrates version 1, and writes the resulting campaign to autosave. Manual slots remain available.

If browser storage is blocked or full, play continues and saves stay in memory for this page. A message tells the player to export a backup before closing. This fallback cannot survive a page reload.

Run `node tests/saves.cjs` for migration, slot selection, playtime, backup, corrupt import, and storage-failure regression checks. Screenshot, clipboard, and browser end-to-end acceptance still require browser access and are not covered by this test.

Integration hooks: include `css/saves.css`; load `js/ui/saves.js` after `js/ui/ui.js` and before `js/main.js`. Add a title button with `id="btnLoad"` (main wires it). The System tab should call `SAVES.openSave()`, `SAVES.openLoad()`, `SAVES.openExport()`, and `SAVES.openImport()`.
