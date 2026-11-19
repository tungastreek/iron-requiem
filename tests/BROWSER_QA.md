# Browser acceptance

## Commercial polish pass · 19 November 2026

Tests ran in headless Google Chrome on macOS, in a temporary profile, with the local game folder served by Python. The smoke check loads art, selects Rina and the Gigas frame, plays Chapter 1's opening, selects two enemies in sequence, clears the selected target, and plays and skips the resulting battle. Enemy positions are set by the fixture. Selection and confirmation use ordinary mouse clicks or touch taps.

| Mode | Viewport | Graphics | Result |
|---|---:|---|---|
| HTTP desktop | 1440 × 900 | High | Passed |
| HTTP desktop | 1440 × 900 | Low | Passed |
| HTTP phone, landscape | 844 × 390 | Low | Passed |
| HTTP phone, portrait | 390 × 844 | Low | Passed |
| HTTP tablet | 1024 × 768 | Auto | Passed |
| Local file, desktop | 1440 × 900 | Low | Passed |

Tested the archive's four filters, including whether the selected machine is visible and matches the detail panel. Captured the phase banner mid-animation and confirmed the banner was hidden after the phase transition. Checked the Sortie briefing and Mechs & Parts weapon alignment, robot selection with the bridge backdrop, and the separate map notification lane. [Before and after](evidence/commercial-audit.jpg)

The targeting check confirms that hovering keeps the forecast closed, selecting another enemy updates the open forecast, and Clear target keeps the selected weapon. Both the forecast and the Attack button stay within the viewport. [Desktop and both phone orientations](evidence/targeting.jpg)

The Shelter Line browser fixture loads a valid intermission save and selects each route from its real dialogue menu. Both carriers advance during the ally phase. The progress tracker and turn-two reinforcement markers render on the authored board. The rules harness verifies victory and the four in-map events through both routes. [Escort routes](evidence/shelter-line.jpg) · [campaign results](CAMPAIGN_REPORT.md)

## Reproduce

Run `python3 -m http.server 8000` from the game folder. With Playwright and Chromium available, run:

```sh
node tests/e2e.js http://localhost:8000/index.html /tmp/iron-shots run desktop high
```

Repeat with `desktop low`, `phone low`, `portrait low` and `tablet auto`. To use an installed Chrome, set `IRON_BROWSER_EXECUTABLE` to its executable path. Use a file URL for the offline profile.

## Release coverage still pending

Safari/WebKit, Firefox, Edge and Windows launch coverage. Longer unassisted browser sessions through Chapter 1, Shelter Line and Chapter 2. A full real-hardware frame timing matrix and audible playback checks. The smoke results cover the profiles and flows in the table.
