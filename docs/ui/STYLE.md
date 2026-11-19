# Halcyon interface

| Surface | Accent | Panel |
|---|---|---|
| Halcyon | Ice cyan `#85f3ff` and amber `#ffc17d` | Deep naval blue `#0b1729` |
| Concord | Pale gold `#f4db98` | Charcoal bronze `#252119` |
| Free States | Oxide orange `#ffab81` | Warm iron `#301a18` |
| Ourobor | Acid green `#d2ff84` | Dark chitin `#292238` |
| Vael | Lavender `#d9b3ff` | Violet glass `#22183e` |

`css/halcyon.css` sets the faction variables. Each window uses one high-contrast accent rail, a dark inset and a clipped or rounded lower-right corner. HP and status colors remain semantic. Keep controls large enough to tap. Use an 8–12 px spacing step inside cards and 12–24 px between groups.

Names, attack cards and mission titles use the game's condensed display stack. Readouts use system monospace, controls use the legible system UI stack, and dialogue uses Trebuchet MS with system fallbacks. Keep the existing 16 px control size and approximately 19–30 px dialogue scale on desktop. Use at least 44 px for primary touch targets.

The bridge hotspots mirror the quick tabs. The same navy frame, highlight and focus outline carry over to hangar, refit, forecast and system cards. Use the existing confirm sound for opening a station, cut-in for phase and mission transitions, and level-up for buying a node. Reduce motion follows the OS unless overridden by the player. It pauses decorative CSS motion and suppresses battle shakes, full-screen flashes, bloom and GPU sparks.

## Script cues

Put inline cues in a story command's `t` or `n` field. They can nest and the parser keeps ordinary braces literal. The existing `{P}` name token still works.

- `{shout}…{/shout}` enlarges and highlights a line.
- `{whisper}…{/whisper}` slows the text and softens the color.
- `{em}…{/em}` accents an important phrase.
- `{beat}` pauses the typewriter for about a quarter of a second.
- `{glitch}…{/glitch}` uses a violet signal treatment.
- `{comm}…{/comm}` puts the dialogue window in radio mode.

The dialogue log uses plain text so it stays scannable. Pair a mission event with its actual unit tag when a map focus is useful. Use existing event art for longer full-screen scenes.
