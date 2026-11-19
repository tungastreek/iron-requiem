# Campaign simulation report

The harness recorded **113 victories in 114 runs**. Every chapter and route case reached victory with at least one of seeds 17, 29 and 71. One Route B finale run ended when Ilse was shot down.

Each case loads a prepared chapter state. The harness uses the actual map, enemy AI, combat, recruitment, and event code. It answers dialogue choices programmatically and uses player spirits, defensive responses, a reserve position for key units, and movement to clear an escort lane when needed. Chapter levels, skills, upgrades, and parts are set by the fixture. The Shelter Line uses authored terrain. An uninterrupted campaign starting with an empty save remains pending.

| Chapter | Route | Climax choice | Wins | Victory turns |
| --- | --- | --- | --- | --- |
| c1 | A | — | 3/3 | 3, 3, 3 |
| i1 | A | Checkpoint | 3/3 | 9, 9, 9 |
| c2 | A | — | 3/3 | 3, 3, 3 |
| i2 | A | — | 3/3 | 2, 2, 2 |
| c3 | A | — | 3/3 | 2, 2, 2 |
| i3 | A | — | 3/3 | 3, 3, 3 |
| c4 | A | — | 3/3 | 3, 3, 3 |
| i4 | A | — | 3/3 | 2, 2, 2 |
| c5a | A | — | 3/3 | 2, 2, 2 |
| c6a | A | — | 3/3 | 2, 2, 2 |
| i5 | A | — | 3/3 | 3, 3, 3 |
| c7 | A | — | 3/3 | 4, 4, 4 |
| i6 | A | — | 3/3 | 3, 3, 3 |
| c8 | A | — | 3/3 | 3, 4, 4 |
| i7 | A | — | 3/3 | 3, 3, 3 |
| i8 | A | — | 3/3 | 3, 3, 3 |
| c9 | A | Reach out | 3/3 | 4, 5, 5 |
| c10 | A | — | 3/3 | 5, 4, 5 |
| c1 | B | — | 3/3 | 3, 3, 3 |
| i1 | B | Checkpoint | 3/3 | 9, 9, 9 |
| c2 | B | — | 3/3 | 3, 3, 3 |
| i2 | B | — | 3/3 | 2, 2, 2 |
| c3 | B | — | 3/3 | 2, 2, 2 |
| i3 | B | — | 3/3 | 3, 3, 3 |
| c4 | B | — | 3/3 | 3, 3, 3 |
| i4 | B | — | 3/3 | 2, 2, 2 |
| c5b | B | — | 3/3 | 2, 3, 3 |
| c6b | B | — | 3/3 | 3, 3, 3 |
| i5 | B | — | 3/3 | 3, 3, 3 |
| c7 | B | — | 3/3 | 4, 4, 4 |
| i6 | B | — | 3/3 | 4, 3, 4 |
| c8 | B | — | 3/3 | 4, 4, 4 |
| i7 | B | — | 3/3 | 3, 3, 3 |
| i8 | B | — | 3/3 | 2, 2, 3 |
| c9 | B | Reach out | 3/3 | 4, 5, 4 |
| c10 | B | — | 2/3 | 4, 5 |
| c9 | A | Fight | 3/3 | 5, 5, 4 |
| c9 | B | Fight | 3/3 | 5, 7, 6 |

The checks include both Chapter 4 branches and both Chapter 9 paths. The early evacuation and Chapter 7 transformation must now finish before victory, and Aurelion survives long enough to present his route choice. Route B can recruit Yuna if the player disables Vasse first. The story command evaluator now checks conditions before jumping to their labels.

An extra run of The Shelter Line on the pump road won at turn 10 with seeds 17, 29 and 71. Both roads fired all four in-map events.

See [the raw results](campaign-results.json) for losses, recruited pilots and fired events. The browser checklist is in [BROWSER_QA.md](BROWSER_QA.md).
