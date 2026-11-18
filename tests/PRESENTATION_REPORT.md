# Presentation systems check

The dependency-free checks in `presentation.cjs` pass. `node --check` also passes for `js/render/audio.js`, `js/render/quality.js` and `js/ui/touch.js`.

| Area | Evidence |
| --- | --- |
| Graphics policy | A simulated SwiftShader renderer selects Low; sustained 34 ms intervals select Low; manual High stays High; Low caps DPR to 1, disables renderer shadows and retains every second particle attempt. |
| Music | Twelve synthesized themes run without requesting any recordings. Music requested before the gesture does not construct an audio context. Gesture activation starts the pending theme. All faction and phase selectors work. A theme with one indexed recording requests only that file. With two indexed recordings, a load error falls back from Ogg to MP3 and then to synthesis. Volume routing and old-track disposal run without exceptions in the mocked graph. |
| Sound effects | All 33 named sound cues execute against the parameter-checking WebAudio mock. |
| Touch | A destination tap previews without moving; a second tap sends exactly one movement command. Long press and pinch issue no tactical command. Pinch changes zoom; coordinate conversion reverses the transformed canvas. |

`PRESENTATION_CHECKS.json` contains the machine-readable result. These checks verify logic and scheduling, not the audible score, actual graphics output or phone usability.

## Acceptance still pending

Native computer control was unavailable and the local-file browser preview was denied. No alternative browser-control path was used. Desktop/844×390/1024×768 screenshots, audible review, end-to-end Playwright runs and real map/battle frame-time measurements therefore remain pending. There are no invented before/after performance numbers in this report.

After the parent integrates the hooks in `docs/PRESENTATION_INTEGRATION.md`, run the game in all three graphics settings and inspect the touch menus, bottom sheet and controls on the requested viewport sizes. Use `?debug` to capture actual frame intervals and `QUALITY.summary()` for the samples. Inspect optional local music files both present and absent.
