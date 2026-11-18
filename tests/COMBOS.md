# Combination attacks and Support Defend checks

Run `node tests/combos.cjs`.

The suite checks all four defined pairs from either initiating pilot. It covers exact Will and EN thresholds, adjacency, diagonal exclusion, missing or disabled partners, spent actions, stale selections, and both units' distance to the target. Falcon Gale is checked with all four protagonist frames.

The EN test verifies both machines pay the listed amount and that the partner's action is consumed. MAP's ordinary attack completion consumes the initiator's action. Combos are excluded from counterfire and cannot be repeated with a spent partner.

Damage checks compare combination damage with an ordinary attack using a controlled average stat. They also shift stats between the two pilots while retaining the mean, and verify that damage differs from the initiator-only value. Both ranged and melee stat paths are exercised.

Support Defend checks cover Gunnar, Ilse, Jin and Brann's learned b2 node, required orthogonal adjacency, living friendly guards, and the once-per-phase eligibility flag. A player guard cannot defend an enemy. Using a player-phase action does not prevent a separate defensive interception. Clearing the phase flag restores eligibility; scheduler behavior is outside this state test.

These checks do not verify browser menus, combined cut-ins, guard slide-ins, or other rendered effects. Those screenshot requirements remain pending browser access.
