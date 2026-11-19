# Story flags, decisions and outcomes

The existing save schema stores freeform campaign fields in `SAVE.flags`. A new choice should be visible at least twice, at selection and on payoff. Each mission script reads its flags with a sensible default when resuming an older campaign. An undefined choice means it has no recorded answer. It should not silently count as the most permissive outcome.

## Existing reader and writer inventory

| Field | Written | Read and effect in the current game |
|---|---|---|
| `res` | Choice `res` commands, events and discoveries | At c9, a minimum of three opens the offer to reach Aurelion. Displayed in intermission and the ending. Keep earned values. |
| `route` | c4 debrief, A or B | i4's continuation selects the Earth or Space pair. Reflected in endings and c10's conditional setup. |
| `spared_lucien` | c4 lower weapon | c5b makes Hound an ally and c6b adds him to the flank. At c8 the spared rival can join. Other saves see the rival version. |
| `scarred_lucien` | c4 fire | Marks the alternate outcome. Rival behavior currently uses the absence of `spared_lucien`. Use the positive scar flag only for a tailored line. |
| `lucien_joined` | c8 recruitment | Currently a record of the join. Treat actual roster membership as authoritative for deployment and epilogues. |
| `ourobor_peace` | c6a listen to Prime | Changes the c6a aftermath, brings Ourobor assistance in c9. |
| `prime_dead` | c6a finish Prime | Recorded independently of peace. Add a memorial variation as payoff. |
| `yuna_saved` | Both c5b options | Records her rescue. Actual roster is written by the defect event. Keep distinct from `yuna_release`. |
| `sera_answer` | c7 first contact | Currently records together/brave/fight. Add a reply variation in the c9 approach and the c7 Halcyon talk. |
| `zero` | c7 mid-mission upgrade | Selects the upgraded protagonist frame and copies base-frame upgrades if required. Preserve both super and real variants. |
| `night` | c8 downtime | Mira, Brann, Sera or Soren. Existing immediate talk branches. Add epilogue call-back when the pilot is recruited. |
| `archive_public` | i2 debrief | i7 dialogue branch and friendly Aegis escort. A sealed archive protects living witnesses and should lead to its own testimony payoff. |
| `nursery_channel` | i6 debrief | Adds a Mantle Guardian in c9. |
| `true_route` | c9 reach choice | Gracefully closes c9 and proceeds to c10. Existing true-route saves remain eligible for Fourth Dawn. |
| `pre_<chapter>` | Controller after each briefing | Skip a briefing already seen when starting a saved chapter. Keep old values on migration. |
| `defeated_<tag>_turn` | Unit destroyed on map | c3 checks the Behemoth's defeat turn for the secondary objective. Replaying a chapter should use current-map records for new checks. |

## Decision register for N2 and G1

The values shown in parentheses give short identifiers for script writers. Resolve choice-dependent banners, tiles and objective text before the player takes an action. Choice 9 is the original route split, made before i4 and applied after i4.

| # | Moment | Choice and fields | Visible consequence |
|---:|---|---|---|
| 1 | c1, rescue call | `kestrel_priority` ward/ridge | Mira helps a trapped relay or spoils the ridge approach. Different ally response and alternate Anika debrief line. |
| 2 | i1, flooded bypass | `shelter_route` checkpoint/pumps | Bus path and next wave use different entrances. Nautilus can mark the pumps in its path. |
| 3 | i1, manifest | `shelter_consent` named/counted | Survivor follows up with Mira by name or gives an anonymous account. Leda presents the opt-in model at i2. |
| 4 | c2, withdrawal | `coast_route` shore/road | Selects extraction edge and changes Odessa's intercept tile. |
| 5 | i2, checksum interruption | `archive_focus` testimony/complete | Protect a transportable witness terminal or keep the two relays held longer and recover their log. |
| 6 | i2, release | `archive_public` true/false | Relief escort joins i7, or living witnesses arrive under Vale's sealed convoy. Preserve current resonance rule. |
| 7 | c3, Ade's gantry | `kaiser_order` lift/brace | Civilians use the forward lift or enter the shielded lane. Brann quotes the decision at i3. |
| 8 | i3, boiler reserve | `foundry_plan` junction/siding | Cinder starts the second leg with different EN and the train takes a different route. |
| 9 | c4, path after i4 | `route` A/B | Play either the Deep Fault/Ironhaven or Cradle-4/Aster-9 arc. |
| 10 | c4, Hound | `spared_lucien` or `scarred_lucien` | Existing ally/rival split, with Odessa and Lucien getting separate reactions. |
| 11 | i4, radio authorization | `convoy_broadcast` consent/quiet | Anonymous dispatch preserves concealment. A consent-based public dispatch brings help from a named tug at i7. |
| 12 | c5a, combine | `trinity_link` lock/hollow | Changes where Trinity deploys after rescue and what cover remains for survey crews. |
| 13 | c6a, safe route | `ironhaven_corridor` refuge/watergate | Determines which relief site holds and where the Concord shelling pressure concentrates. |
| 14 | c6a, Prime | `ourobor_peace` or `prime_dead` | Brood withdraws and later defends the Heart, or Brann presents a memorial after the battle. |
| 15 | c5b, Yuna | `yuna_release` listen/eject, `yuna_saved` | Change her initial recovery position and the line she offers in the i5 bond talk. Preserve existing recruitment. |
| 16 | c6b, gun charge | `lethe_signal` public/jam | Public evidence helps Ilse at i7; jamming diverts a gun at the cost of a shorter safe approach. |
| 17 | i5, dock | `colony_dock` civilian/conductor | Choose the convoy goal and facing. A neutral civilian port later contributes an Ark witness. |
| 18 | i5, Orran's memory | `orran_permission` share/keep | Changes which Orran/Leda talk unlocks. Both options honor his decision. |
| 19 | c7, Sera's question | `sera_answer` together/brave/fight | Unlocks different first-contact replies at c9. Preserve Sera's decision to join regardless. |
| 20 | c7, after defection | `herald_guard` seraphyne/relay | Allocate escort to Sera or her relay. Changes an allied starting position and her after-action dialogue. |
| 21 | i6, navigate | `brood_navigation` visual/passive | Changes which danger tiles can be scouted and whether the next brood arrival goes along the hiveside. |
| 22 | i6, receiver | `nursery_channel` true/false | Nursery Guardian at c9 if open. If closed, play a later small attempt to contact the fleet that goes unanswered. |
| 23 | c8, Draike | `draike_terms` lane/suppress | Names a safe retreat corridor for defectors or weakens the next Concord barrage. Changes Draike's ending dispatch. |
| 24 | c8, night watch | `night` mira/brann/sera/soren | Unlocks the original talk and a line in the ending. Grants a bond only for a recruited human or Vael partner. |
| 25 | i7, seizure lines | `tug_terms` guarantee/emergency | Tugs receive independent transit rights or emergency berths right away. The negotiating crew gives a different report during c9. |
| 26 | i8, forged rescue | `echo_method` trace/isolate | Changes which beacon stays active and the timing of a null wave. |
| 27 | i8, real recording | `solenne_recording` together/later | Mira listens with Anika or keeps the record for the flight-deck memorial. Unlocks a distinct epilogue line. |
| 28 | c9, first Gate anchor | `gate_anchor` boats/heart | Reserves hulls for evacuation or gives the Heart another protection layer. Alters the secondary objective and c9 closing options. |
| 29 | c9, low-HP bargain | `gate_answer` destroy/seal/listen, `ending_plan` | Destroy preserves the old normal ending. Seal sacrifices a defined group of essential anchors. Listen opens a consensual truce if resonance is sufficient. |
| 30 | c9, truce | `ending_plan` alliance/dawn, `true_route` | A supported, jointly agreed withdrawal yields Accord. Remain to fight through the breach for Fourth Dawn. |
| 31 | c10, relay consent | `final_cadence` turn/sustain | The coalition rotates its vulnerable channel or stays to shield a fixed relay. Changes final waves and one epilogue detail. |

## Bonds and saves

Use a separate `SAVE.bonds` object with sorted, distinct recruited pilot IDs as pair keys and nonnegative points. Missing data starts at zero. Keep talk-seen IDs in `SAVE.talks`. Levels at **3, 7 and 12** points. A new mutual talk grants 2. A completed combo, support hit or interception grants 1 per pair per battle. Entering a turn adjacent earns at most 1 per pair per chapter. Award once per logical event, even if a battle animation is skipped or a conversation dismissed. Pilot upgrades and replays should never create points for an unavailable pilot.

Level 1 unlocks an optional talk. Level 2 grants adjacent +5 hit/evasion when both pilots deploy. Level 3 raises it to +8 and adds an ending line when both pilots are recruited. Use the highest applicable adjacent bonus instead of stacking multiple partners. Prioritize Rei–Mira, Brann–Jin, Lucien–Odessa and Yuna–Sera for their combos. Secondary pairs include Ilse–Gunnar, Anika–Mira, Corin–Jin, Leda–Orran, Hugo–Emi, Noor–Vale and Mira–Noor. Never gate the basic campaign or an original recruit behind optional talks.

## Ending resolution

| Ending ID | Title | Condition | Payoff |
|---|---|---|---|
| normal | The Song Continues | Destroy the anchor and defeat Aurelion in c9, or accept the default combat resolution. | Earth survives, the Vael disperse and the Silence knows the system's address. Legacy normal saves still offer replay. |
| costly | Carry the Names | Explicitly seal from within at c9 and complete the evacuation timer. | The crews in the anchor line choose to hold their positions. Their names appear. Every recruited pilot's epilogue addresses the choice, without randomly killing playable pilots. |
| alliance | The Open Gate | At least 3 resonance, listen at c9, and choose a negotiated evacuation with a supported civilian witness and enough stabilized anchors. | The Vael retain an emergency route. Human, Vael and brood representatives share custody of the Heart. The Silence remains a future threat. |
| true | Fourth Dawn | At least 3 resonance, listen at c9, choose to hold the breach, then defeat the Hollow in c10. | The coalition resists the Silence together. Existing saves already on c10 reach this ending by winning it. |

Show the conditions of each offered action in diegetic terms. If the negotiated withdrawal is unavailable, leave the original choices available and describe what is missing before the player acts. Defeat remains a retry screen. Seen ending IDs deduplicate in the existing `endings` record. A c9 retry restores the state at the briefing, with transient ending fields cleared. Put credits and roster epilogues after every ending and keep them skippable.

## Changes to existing story

- New scenes give civilians and auxiliary pilots visible decisions. Keep the events, route crisis and major recruitment beats that already exist. New join scenes and radio calls state plainly whether a speaker is present or remote.
- Establish that the gate was designed for travel. Its use at the climax and the Choir's uniform signals reveal Earth to the Silence. The extra endings vary what the fleet does immediately afterward.
- Keep Ade's death within the established sequence and give the Space branch a later verified dispatch about it. Add space for Brann to respond rather than reusing the Earth debrief where he was absent.
- Keep Soren's arrival and imperfections. In a late Earth-route scene that currently speaks as an unrecruited Yuna, substitute Orran or Pell until a remote Yuna transmission has been introduced.
- Treat Lucien's i7 challenge as a remote call on saves without him. Do not imply a fragile ally is a recruit unless the existing recruitment conditions are met.
