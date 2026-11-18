# Browser acceptance

This session completed the data and simulation checks. The user asked to deliver with browser checks pending. No browser screenshots, Windows launch, actual frame timings, or audio listening tests were run.

With Playwright and Chromium available, serve the project with `python3 -m http.server 8000`. Run `node tests/e2e.js http://localhost:8000/index.html /tmp/iron-shots run desktop high`. Repeat with `desktop low`, `phone low`, and `tablet auto`. The smoke check exercises the real setup screens, chapter 1, an attack forecast and battle playback. It sets up one adjacent encounter directly so positioning does not depend on combat RNG.

Review the captured images for portrait crop, text contrast, button bounds, feet/ground alignment, and visible painted backdrops. Use the Frame Archive to inspect both old and new machines and watch weapon previews. Then play the first mission through the Shelter Line and chapter 2, exercise save slots and touch commands, and compare frame intervals with `?debug` in High and Low. Repeat a direct local file launch on Safari and Windows Edge.
