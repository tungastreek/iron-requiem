# Campaign beat sheet

Each heading is an authored mission in the existing campaign. Numbers are budgets for **unique scripted words**, including in-map dialogue, conditional replies and unlocked talks. The budget across both routes and all endings is **42,350 words**. A single route sees fewer. Briefing and debrief decisions refer to [FLAGS.md](FLAGS.md).

**Route order** c1 → i1 → c2 → i2 → c3 → i3 → c4 → i4. Earth goes through c5a → c6a. Space goes through c5b → c6b. Both continue i5 → c7 → i6 → c8 → i7 → i8 → c9. Fourth Dawn also plays c10. Keep the original turn events required for plot continuity and check the required events before resolving a new objective.

## c1 · Ashfall — 2,300 words

Mira and the protagonist want a test flight. The breach turns that into a rescue. Make the choice between Alteon and Gigas legible by giving the beam frame a long firing lane and the heavy frame an adjacent shelter choke.
- **In map 1** · Anika's radio directs the first ground crossing. Approaching the ramp reveals movement costs and terrain cover.
- **In map 2** · Hal dies as the tower falls on enemy turn 2. On turn 3 Halcyon and Bastion open a recovery lane. The player assigns Mira to a distress signal or the ridge picket.
- **In map 3** · Give one turn of warning for the flyers. The departure waits for the shelters to report in, with a fallback forced departure once the line has held the required turns. Bonus for arriving with all three relays transmitting.
- **Debrief** · Mira learns there are survivors below the base instead of receiving a generic congratulations. Keep her father's recording in Anika's custody. Sets `kestrel_priority`.

## i1 · The Shelter Line — 2,050 words

Defend moving shelter buses from a Concord blockade and Ourobor around the pumps. Show both dangers without giving either a shared command channel.
- **In map 1** · Corin flags a flooded bypass. First bus queues where the player cleared a lane, limited to one safe advance per allied phase.
- **In map 2** · Aegis takes the line when the first bus leaves. Concord threatens the checkpoint, a Brood creature protects a substation; warn where Valkyr reinforcements arrive.
- **In map 3** · Anika opens the gate on escort or engineers the bypass. The second bus follows the chosen route. Bonus for escorting both without a hit.
- **Debrief** · Anika offers Mira the recording, no pressure to play it. Shelter crews vote whether to file with names or numbers. Sets `shelter_route` and `shelter_consent`.

## c2 · Wings of the Halcyon — 1,850 words

Escape over the coast under Draike's seizure order. Hills and coastal pads create two viable corridors. The rear guard teaches flanking and counter risk.
- **In map 1** · Draike reads the order and reveals the patrol's fire arcs. Gunnar offers a shot corridor or a masked coast route.
- **In map 2** · Odessa joins on player turn 2, adapting the route when a defender holds the high ground. A Valkyr pair enters from the marked north approach.
- **In map 3** · Draike retreats at the existing half-HP threshold or warns the cruiser exiting the map that his fleet will follow. Bonus for withdrawing all initial units with no downed wingmen.
- **Debrief** · Odessa insists the firing log identify the escape lane, not the kill total. Sets `coast_route`.

## i2 · A Record of the Missing — 1,950 words

Capture both relay tiles and transmit the archive during the enemy phase. The closest tile is exposed. Mastodon opens a slower approach via ruined survey works.
- **In map 1** · Leda separates the missing people from the people listed under a different category. A wrecked survey terminal makes Hugo's old map relevant.
- **In map 2** · Seizure engineers warn before opening their north approach. Leda can prioritize testimony or a full checksum. Each changes the relay protection needed.
- **In map 3** · Holding the signal until the allied acknowledgment changes what Ilse is willing to put on record. Bonus for recovering a secondary relay module before it is isolated.
- **Debrief** · Keep the existing public or sealed archive choice. Put Ilse's order alongside the names in either version. Sets `archive_focus` and `archive_public`.

## c3 · The Kaiser Awakens — 2,200 words

The Behemoth hits the lab while it tracks the seed. Brann mistakes the target for the attackers' entire purpose. Teach heavy frames to brace on repair pads rather than chase flyers.
- **In map 1** · Ade orders Brann to make room for technicians. Lift the first gantry or have Kaiser absorb the wave while crews leave.
- **In map 2** · Mark the north ridge emergence a turn ahead. The Behemoth changes from charging defenders to knocking openings in the lab wall after a damage threshold.
- **In map 3** · On defeat, retain the broken plea for return. Nearby brood units scatter. Bonus for clearing the technicians' siding before the ridge wave arrives.
- **Debrief** · Ade gives Brann the first explanation of the strain the seed puts on a brood. Sets `kaiser_order`.

## i3 · The Second Shift — 1,900 words

Escort the workers' first train as a siege line clamps down on the industrial junction. Have Noor demonstrate flying over broken terrain and Emi demonstrate its cost to heavy frames.
- **In map 1** · Workers tell the gunner they voted to move together. Noor asks whom the Halcyon can carry if the engine fails.
- **In map 2** · A warning marks the northern rail battery. Emi can spend boiler reserve holding the line or opening the siding. Marshaling yard cover offers a second path.
- **In map 3** · The train turns onto the live track or the repaired siding. Bonus for protecting its engineer and the tools wagon.
- **Debrief** · Noor has Ade's overdue packet. Emi hands the workshop keys back to its elected keeper. Sets `foundry_plan`.

## c4 · Crimson Hound — 2,400 words

Confront Lucien on the elevator. A narrow gantry and outer supports give him two ways out, each visible from the start. Rifles can cross open air that treaded frames cannot.
- **In map 1** · Lucien names Lethe and reframes the fight. Odessa calls out civilians in his firing arc.
- **In map 2** · Free States commandos arrive at the announced service hatch when elevator control changes hands. The commander's call makes clear that Lucien did not authorize shooting transport crews.
- **In map 3** · At 40% HP, keep the spare/fire exchange and retreat. Bonus for capturing the control platform without disabling emergency power.
- **Debrief** · Make the existing Earth/Space decision. The Halcyon escorts the convoy in i4 before committing to either crisis. Sets `spared_lucien` or `scarred_lucien`, and `route`.

## i4 · Names Above the Clouds — 1,750 words

Escort refugee lifts along the exterior gantry. Crossing one gun line clears the safer stretch of the other. The public channel makes civilian lives harder to hide but easier to target.
- **In map 1** · Vale is still a distant convoy identifier. Noor can broadcast names with consent or transmit protected identifiers.
- **In map 2** · The first lift slows near the crosswind sensor. Gunnar orders cover. Odessa leaves the better firing perch to protect the lift; mark and release a light patrol.
- **In map 3** · The last lift reaches the lane merge. Bonus for securing a return passage across both platforms before convoy departure.
- **Debrief** · Mira hears that one passenger declined the broadcast and no one overrode them. Sets `convoy_broadcast`.

## c5a · Under the Crust — 2,100 words

Rescue Jin, Tessa and Dash in the Deep Fault. Defeat the Hive Mother after the rescue and face what her death means. Squeeze points change as the brood walls flex.
- **In map 1** · Corin marks the pressure warning at a side gallery. Trinity's crew votes to combine, with the choice of joining at the sealed lock or in a protected hollow.
- **In map 2** · The Mother opens spawning vents. Keep her repeat wave and telegraph which tiles receive it; seal one vent to shorten the next wave.
- **In map 3** · The crew crosses the join point, breaks the last barrier and can face the Mother. Her dying line preserves the cost of the route. Bonus for extracting all three survey beacons.
- **Debrief** · Give Tessa a private record of what they saw. Sets `trinity_link`.

## c6a · The Song Below — 2,400 words

Separate Concord and the Prime before Ironhaven is lost. Alternate capture lanes control whether a peaceful response can be transmitted. Show Draike's evacuation plan on map before its defects are exposed.
- **In map 1** · Local buildings report different stories about where the first damage occurred. Player can route defenders toward neighborhood refuge or Concord's water gate.
- **In map 2** · At the Prime's half-HP mark, preserve the existing answer/finish choice, including withdraw/unprotect behavior. Draw its bodily change visibly.
- **In map 3** · Draike leaves when pressured. Ade uses the remaining bridge to save the recovery teams and cannot leave it in time. Bonus for keeping both civilian corridors open through the last attack.
- **Debrief** · Brann prepares the flight-deck memorial. The route's record differs depending on whom the Halcyon heard first. Sets `ironhaven_corridor` and one of `ourobor_peace` or `prime_dead`.

## c5b · Colony Requiem — 2,400 words

Stop Vasse dropping Cradle-4 by disabling his flagship and interrupting its tug command. The colony curve blocks the short firing lane until the fleet detaches.
- **In map 1** · Vasse gives Yuna a hostage ultimatum. Reveal an emergency channel the player can protect. The first salvage skiff marks launchers.
- **In map 2** · At Yuna's threshold or Vasse's defeat, retain the resonance versus physical-ejection choice and recruitment on each path. Give the spacecraft route a real cost and reward.
- **In map 3** · The turn-4 Hound arrives as ally or rival depending on c4. Show Vasse losing a flagship layer when crews release the tugs. Bonus for stalling the drop without sacrificing a tug.
- **Debrief** · Yuna asks to tell her mother about the rescue herself. Sets `yuna_saved` and `yuna_release`.

## c6b · Lethe's Shadow — 2,100 words

Stop both cruisers before they fire on Aster-9. Keep the existing deadline, and add distinct routes behind their forward batteries.
- **In map 1** · Possible Hound assistance on turn 2. Ilse identifies the old doctrinal pattern and warns that it assumes the colony will obey.
- **In map 2** · At turn 5 enemy phase show the charge marks and let the protagonists choose whether to broadcast the gun drill or quietly jam it.
- **In map 3** · Draike withdraws or takes another firing position by condition. A disabled cruiser can yield a capsule with evidence. Bonus for rescuing it before the second cruiser falls.
- **Debrief** · Set Ilse's closed-door Lethe scene against a relieved voice from Aster-9. Earth hears the broad outcome through Noor. Sets `lethe_signal`.

## i5 · A Voice Outside the Choir — 2,000 words

Escort Palisade into the colony docks as conductors jam its civilian helms. A slower civilian channel is safer than replying in the Choir's own pattern.
- **In map 1** · Orran cuts the first false rescue signal. Vale asks the families to authorize a docking site.
- **In map 2** · Three forces approach from announced lanes. Player can move through the civilian docks or cut the conductor station. Point the false acoustic beacon away from the convoy.
- **In map 3** · Once the second ship reaches home, Orran chooses whether to share his friend's name with Leda or remember in private. Bonus for extracting both ships without live conductor links.
- **Debrief** · On the route that missed her, introduce Yuna as a remote contact if the transmission is accepted. Reflect the other rescue in a short dispatch. Sets `colony_dock` and `orran_permission`.

## c7 · The Vael Herald — 2,400 words

Survive Ixion's orbital assault until the core changes, then drive him off. High resonance tiles offer a powerful position that also exposes targets to Choir attacks.
- **In map 1** · Preserve Sera's question on turn 2 and its reply choices. A marked encirclement launches in the next phase.
- **In map 2** · Sera defects on turn 3. Protect her ship or split to save a relay she directs you to. Reward the action she asks for without changing her decision to join.
- **In map 3** · Alteon Zero wakes on turn 4. Preserve that entire reveal before allowing victory, then change Ixion's threats and movement at half HP. Bonus for sheltering the relay when the upgrade completes.
- **Debrief** · Soren answers one question plainly and cannot answer another. Sera and Orran meet as two people who both left. Sets `sera_answer`, `herald_guard`, and `zero`.

## i6 · The Molting Choir — 1,850 words

Open a marked corridor to a wounded brood. Avoid treating the protected nursery as a kill target. Show grounded hazard costs and why a mobile relief team matters.
- **In map 1** · Corin proves the call is rhythmic but not an attack. Player chooses a visual shield line or passive sonar with shorter sensor reach.
- **In map 2** · A recovering Bellwether guards the wrong choke. Its distress shifts the reinforcement lane. Give one turn of warning before emergence.
- **In map 3** · A brood carrier follows the cleared track. Hold it until it crosses the far passage. Bonus for keeping crews and brood adults above half HP.
- **Debrief** · Keep the open-receiver decision. The first reply consists of a small mistake in pitch and a deliberate correction. Sets `brood_navigation` and `nursery_channel`.

## c8 · Sovereign — 2,300 words

Break the Sovereign siege and expose the evacuation list. Water and segmented city cover favor different units on each approach.
- **In map 1** · The commander's escort lanes go live. Kroll demands the Heart; Leda starts recording the cost of the agreement.
- **In map 2** · Draike learns his family is off the list. Offer a surrender corridor or suppress his fire first. The threshold event and Kroll's attempt to stop the broadcast must still occur.
- **In map 3** · Sovereign deploys exposed stabilizers after the chosen HP threshold. Warn the next barrage line, then make knocking it out time-sensitive. Bonus for getting a witness to safety during the collapse.
- **Debrief** · Keep the existing four night talks. Offer an extra optional talk for the second combatant most involved. Sets `draike_terms` and `night`.

## i7 · The Weight of an Order — 1,750 words

Hold two tug berths until the tug crews choose to depart. Lucien speaks as an ally if recruited or as a remote caller otherwise. A relief escort appears for the public archive, protected witnesses arrive later for the sealed archive.
- **In map 1** · The seizure officer cuts the civilian channel. Halcyon can name the independence guarantee or negotiate emergency use of a berth.
- **In map 2** · Contest the marked tug approach. Put a choice of restoring channels or suppressing the heavy squadron before the next gun line moves.
- **In map 3** · The tug captains refuse the order being imposed. Bonus for holding both berths through their vote without their support ships taking damage.
- **Debrief** · Lucien acknowledges the surrender belonged to the pilots. Ilse records the names of those who chose to speak. Sets `tug_terms`.

## i8 · What the Dark Repeats — 1,850 words

Capture or disable the counterfeit beacons before the fleet moves south. Make noise and cover matter. An authentic distress call varies in cadence when acknowledged.
- **In map 1** · Noor finds Hal's forged call. On-board Yuna or Orran identifies the timing fault. The player can triangulate the echo or isolate it from the human set.
- **In map 2** · Seizing the first beacon triggers an announced decoy wave. Its imitation fails when Vale changes the route after they answer.
- **In map 3** · The safe beacon reveals the true approach. Bonus for verifying it before disabling both false transmitters.
- **Debrief** · Mira chooses when to hear the real record, with Anika present if that relationship has grown. Sets `echo_method` and `solenne_recording`.

## c9 · Requiem for Iron — 2,500 words

Reach the Antarctic Heart, defeat Ixion and oppose Aurelion. The ice has a stable route for transports and a shorter high-ground flank for machines. Relief and brood support should be visible if earned.
- **In map 1** · Axial stations turn on, marked one phase ahead. Player chooses which Gate anchors the convoy helps stabilize.
- **In map 2** · Ixion falls and Aurelion arrives while the actual positions of the transports still matter. Borrowed pattern attacks threaten paired units and force them to use different cover.
- **In map 3** · At low HP decide whether to destroy the anchor, seal at once, or reach out if resonance is sufficient. A truce and a decision to stay determine whether c10 opens. Bonus for completing the chosen objective with the lifeboats still in service.
- **Debrief** · Resolve Song, Cost or Accord here if selected. Dawn continues with a live breach and an explicit agreement to hold it. Sets `gate_anchor`, `gate_answer`, `true_route`, and `ending_plan`.

## c10 · Fourth Dawn — 2,300 words

The Hollow consumes repeating signals. Hold the joined fleets until the core becomes vulnerable, then defeat it. Late reinforcements spawn around marked pockets of silence.
- **In map 1** · Three independent relays must agree to a tempo. Yuna or a remote operator and Sera propose alternating transmissions. Set a rotating or sustained relay schedule.
- **In map 2** · The Hollow answers with a pattern already heard at i8. Telegraph which relay it will erase and change the safe movement lane. Uncouple one station to protect its people.
- **In map 3** · At half HP it stops copying commands and directly threatens the Heart. Eliminate its vulnerable shell once the coalition holds the route. Bonus for all relays acknowledging the final turn with one active operator each.
- **Debrief** · Resolve Fourth Dawn and roster-aware epilogues. Crew describe what they want to build while somebody they helped asks for a say. Sets `final_cadence`.
