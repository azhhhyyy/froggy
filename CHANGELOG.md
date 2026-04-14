# Wave Platformer Changelog

## [v0.6.0] - 2026-04-01 (Animation & Boss Polish Update)
[User Feedback: Game is extremely difficult, no space to move around, reward not satisfactory]

### Core Mechanics & Navigation
- **Dash Jump:** Introduced a new high-velocity diagonal aerial dash feature when dashing immediately after a jump.
- **Verticality:** Dynamically generated floating platforms are now spawned at jump-dashable heights to increase navigation complexity.
- **Combat Balance:** Removed fireball access from Low-level enemies to rebalance encounters; fireballs are now restricted exclusively to Mid-level enemies and Bosses.
- **Standalone Boss Encounters:** Adjusted Boss battles (e.g., The Abyss) to no longer display "Wave X" in the HUD. The encounter is treated visually and mechanically as a solitary duel.
- **Riff Rewards:** The "Infernal Chord" Special Attack Riff is now permanently unlocked by default across profiles to ensure it can always be used.



### Visual Fidelity & Animation
[Added Chracter Sprites & Visual Elements]

- **Ground Alignment:** Adjusted global `GROUND_Y` coordinate to exactly 74% of the viewport height so sprites align perfectly with the background bridge railing.
- **Dynamic idle:** Integrated `froggy-idle.png` sprite sheet, introducing a proper 11-frame idle animation states while grounded and not moving/attacking.
- **Combat Splicing:** Corrected and realigned the `froggy-atk-heavy.png` (6 frames) and `froggy-atk-light.png` (4 frames) mappings within the player's animation states.
- **Physics Polish:** Refined grounding and collision logic to ensure character sprites do not float unintentionally after leaving platforms.

### Debug Toolkit Updates
- Added an **"Unlock All Levels"** universal checkbox toggle to simply bypass fragment/boss progression checks on the map screen.
- Added a **"Max Resources"** shortcut testing button granting an instant +99 Fragments, +99 Sheet Music, +100k Echoes, and max Boss Defeats to preview endgame conditions.


## [v0.5.0] - 2026-03-31 (The Devil's Bargain Update)
### Core Mechanics
[User Feedback: users need rewards faster, added  devils bargain feature to offer faster reward with hidden progression, also added shop with addons]

- **The Devil's Bargain:** Whenever a Sheet Fragment drops at the end of a wave, the game pauses. The player is presented with a choice: retain the fragment to escape, or trade it for a powerful Dark Power.
- **Damnation Meter:** A persistent 0-8 tracker that measures how many times the player deals with the devil. Carries over between deaths and resets.
- **Sunrise Timer:** An overarching 15-minute real-time clock added to every run. The sky slowly transitions from night to an orange sunrise. Failing to finish the run before sunrise results in an instant Game Over and +1 to the Damnation Meter.
- **Dark Powers System:** Taking a Devil's Bargain grants one of eight unique passive buffs for the remainder of the run: 
  - *Lifesteal:* Heal 1 HP every 3 kills.
  - *Fire Fists:* Light attacks set enemies on fire (DoT damage).
  - *Shadow Dash:* Dashing damages enemies you pass through.
  - *Blood Rage:* Heavy attacks deal 2x damage.
  - *Echo Siphon:* Kills grant 20 Echoes instead of 10.
  - *Bone Armor:* Player takes 1 less damage from all sources (minimum 1).
  - *Hellfire:* Emits a burning aura that slowly melts enemies near the player.
  - *Soul Chain:* Getting a kill heals the player to maximum HP.

### Game Economy & Spawning
- **Echoes:** Added primary currency. Enemies now drop 10 Echoes on death. Echoes persist across runs.
- **Persistent Fragments:** Sheet Fragments now carry over between runs.
- **Drop Rates Updated:** Sheet fragments drop at the end of completed waves based on progress:
  - Waves 1-5: 1% chance
  - Waves 6-10: 10% chance
  - Waves 11+: 50% chance
- **Batch Spawning:** In waves containing more than 15 enemies, units now spawn organically in batches of 10. The next batch drops when 3 or fewer enemies remain in the current batch.

### HUD & Visuals
- HUD updated to display Echoes, Sheet Fragments (♫), Sunrise Timer, and Damnation Meter.
- Dynamic sky visual gradient added to reflect the passing of the Sunrise Timer.

### Removals
- Removed the **Counter Parry** combo mechanic for balancing and thematic changes.

---

## [v0.4.0] - Combo System & Combat Balancing
[User Feedback: combat felt slow & repetitive to users, added combos to learn and chain which do more damage]


### Features
- **Combo System Engine:** Added action tracking to recognize complex input strings natively.
- **New Combos Added:**
  - *Flurry Rush* (Light-Light-Light-Light)
  - *Uppercut Launch* (Light-Light-Heavy)
  - *Dash Strike* (Dash-Light)
  - *Ground Pound* (Airborne Heavy)
  - *Meteor Slash* (Airborne Light-Light-Heavy)
  - *Whirlwind* (Charge Light-Heavy)
  - *Dash Cancel* (Light-Light-Dash-Light)
- **Debug Toolkit:** Added an in-game developer panel (toggle with `` ` ``) providing:
  - Game Speed control
  - Player/Enemy Speed Multipliers
  - God Mode toggle
  - Wave spawner and Kill-All shortcuts
  - Real-time Combo tracking log

### Balancing
- **AoE Restriction:** Heavy-based combo finishers (Uppercut, Ground Pound, Meteor Slash, Whirlwind) restricted to hitting a maximum of 4 targets locally instead of all valid overlapping targets.
- **Shared Cooldown:** All heavy finishers now consume and require the same 4-second heavy attack cooldown.
- **Single Target Heavy:** Raw heavy attacks now properly single out and damage only the 1 closest enemy.
- **Enemy Separation:** Enemies now exert a physical repulsive force on each other, preventing them from fusing into a single blob of overlapping sprites.
- Globally reduced base game speed to favor tactical inputs over frantic button mashing.
- Changed to a fixed-timestep game loop to keep speed/physics multipliers stable regardless of monitor refresh rate.

---
## [v0.3.0] - AI Intellect Update
[User Feedback: Enemies just rush player, need to slow them down, reduce number of enemies at once,]


### Features
- **Melee Attack Overhaul:** Removed default "damage on contact" collisions. Enemies now must stop, wind-up, and execute a dedicated melee swing to deal damage.
- **Ranged Enemies:** Added Fireball projectiles. Enemies at a distance will hold position, charge a fireball, and fire it. Fireballs have slight predictive tracking but can be purely side-stepped with movement or dashes.
- Player tracking algorithms upgraded to make enemies stalk the player's position fluidly across the arena.

---

## [v0.2.0] - Mobility Update
[User Feedback: Dash didn't feel agile, very difficult to control, felt punishing]
### Features
- **Dash Mechanic:** Added a Dash/Dodge ability (Left Shift). 
- Dashing provides full Invincibility Frames (iFrames) for its duration.
- Dashing has a 1.5-second cooldown and leaves a dissipating visual trail/afterimage.
- HUD updated to track dash cooldown.

---

## [v0.1.0] - Initial Prototype
### Features
- Endless wave-based gameplay loop.
- Basic platformer locomotion (A/D movement, Jump, Crouch).
- Light Attack logic (1 damage, fast).
- Heavy Attack logic (3 damage, 4-second cooldown).
- Primitive visual effects (particle explosions on hit/kill).
- HP system setup (5/5 HP) with fundamental Game Over / Restart states.
