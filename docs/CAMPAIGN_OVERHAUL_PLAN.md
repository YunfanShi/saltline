# Saltline Campaign Overhaul — Audit, Narrative Redesign & Berth 4 Vertical Slice Plan

## 1. Deep Audit of the Existing Campaign

### 1.1 Map Scale & Environmental Repetition
- **Confined Playable Footprints**: Original Berth 4 (`x: -38..30, z: -30..28`) and Rail Yard (`x: -106.7..30, z: -27.5..27.5`) were designed as compact multiplayer-style container arenas rather than expansive single-player theaters.
- **Visual Sameness Across Chapters**: Chapters 3–8 (`port-campaign-continuation-layout.js`) reuse the same flat concrete slab, corrugated shed boxes, and chain-link fences with minimal verticality, distant landmarks, or distinct architectural silhouettes.
- **Unused Functional Buildings**: In original Berth 4, the largest interior (`ab(t)` Warehouse 1 Shed) and the elevated yard catwalk had zero mission presence, forcing awkward 112m backtracking between East Port Control and West Dispatch.
- **Chapter-Switch Leak Bug Found**: Switching chapters in-page left `createCampaignCrash` (`port-campaign-events.js`) aircraft wreckage attached to `world.scene`, causing floating wreckage to clip into `drydock` and subsequent chapters.

### 1.2 Gameplay Loop & Pacing Weaknesses
- **Over-Reliance on `Move -> Hold E -> Move`**: Most phases across Chapters 1–8 boiled down to walking to a waypoint and holding `E` on a static box, with minimal tactical combat variation, environmental destruction, or dynamic route changes.
- **Static NPCs Instead of Real Companions**: Mara, Harris, and the Nurse either stood stationary at markers or followed rigid waypoint rails without taking cover, calling out hostiles, or interacting with world geometry.
- **Short, Prototype-Style Set Pieces**: Aside from the Rail Yard plane crash, most chapters lacked sustained, multi-beat interactive set pieces that physically reshape the battlefield while the player retains agency.

### 1.3 Narrative & Emotional Stakes
- **Exposition-Heavy / Low-Friction Dialogue**: Characters primarily handed out objective instructions rather than clashing over conflicting loyalties (Ward's official cover-up vs. Mara's distrust of Command vs. Lin's SAR duty).
- **Under-Realized Climax & Consequences**: Decisions like rescuing the drydock mechanics or causeway workers lacked visible world payoff until recently added hooks.

---

## 2. Revised Narrative & Cinematic Thriller Structure (*The Missing List*)

- **Core Premise Preserved**: At 05:37, Saltline Terminal goes dark while the harbor registry marks seventeen night-shift workers as "departed." SAR operator **Lin** is dispatched by **Ward** to reconcile the roster—only to uncover a coordinated cover-up between harbor director **Reed** (who signed the illegal transfer after ignoring structural crack warnings) and private security contractor **Anvil** (who sealed the port and shot down the inquiry transport).
- **Character Arcs & Tension**:
  - **Lin (Player)**: Transitions from following Ward's chain of command to defying an active lockdown to save seventeen real people.
  - **Mara Chen (Harbor Engineer / Companion)**: Begins openly hostile to Command ("You wear Ward's patch"), becomes Lin's tactical partner during the Berth 4 gunship ambush, and anchors the emotional core of the rescue.
  - **Harris (Inquiry Witness) & Old Hawk (Night Foreman)**: Give human weight to the paper trail—each artifact (05:31 receipt, 05:34 handover, Hawk's addendum, Ward's 05:50 recall tape) represents a real betrayal.

---

## 3. Level Diversity Plan (All 9 Chapters — Distinct Visual & Gameplay Identities)

| Chapter | Environment Theme & Visual Identity | Primary Gameplay Focus | Signature Interactive Set Piece |
|---|---|---|---|
| **01. Berth 4 (Vertical Slice)** | Massive storm-swept operational container port with 2F Port Ops Tower, Warehouse 1, North Fuel Farm & active cranes | Multi-route infiltration, companion flanking, environmental sabotage, extraction defense | **Anvil Gunship Sweep & Real-Time Gantry Crane Collapse** reshaping the central yard |
| **02. Rail Yard** | Foggy coastal freight railyard, customs apron, 2F Signal Tower & burning runway | Search & rescue under sweeping spotlights, secondary fuel explosions | **Transport Shootdown, Parachute Ejection & Fuel Cook-Off** |
| **03. Old Drydock** | Deep terraced sunken drydock basin, 2F Pump House & overhead gantry walkways | Vertical stealth/acoustic triangulation & flood escape | **Sluice Gate Breach & Rising Water Rescue** of two mechanics |
| **04. South Tide Gate** | Storm-battered concrete flood barrier, hydraulic bastion & gale-swept causeway | Wind-window traversal, storm survival & lower-chamber bypass | **Runaway Barge Bridge Impact & Lightning Storm Surge** |
| **05. Outer Anchorage** | Listing offshore steel service platform in open dark swell, helideck & davits | Multi-batch (5/6/6) evacuation defense on tilted decks | **Crane Boom Collapse & High-Pressure Line Rupture** |
| **06. Return to Harbor** | Sub-zero misty cold-storage warehouse district & 2F Field Clinic | Silent stealth escort, visibility management & bulkhead breaching | **Cold-Storage Lockdown & Ward 05:50 Tape Revelation** |
| **07. Night Shift Record** | 3-Story Harbor Dispatch Tower, server archives & rooftop ATC deck | Multi-entry vertical tower assault & forensic timeline reconstruction | **Anvil Tower Blackout & Rooftop Transmission Defense** |
| **08. Last Pilot** | Outer coastal headland, elevated pilot bridge & 2F Maritime Chart Hall | Branching high-ground escort vs. worker rescue & 3-part inquiry handoff | **Drifting Freighter Impact Severing the Main Causeway** |
| **09. Open Water** | Golden-hour clear morning harbor, Reopen Lighthouse & welcoming pier arch | Zero-combat playable epilogue reflecting saved survivors & 12 collectibles | **First Morning Departure & Campaign Consequence Resolution** |

---

## 4. Berth 4 Vertical Slice Redesign Specification (Implemented Now)

### 4.1 Expanded Multi-Zone Geography
- **Zone 1 — West Landing & 1 号货仓 (Warehouse 1)**: Rain-soaked arrival zone where Mara Chen meets Lin; interior auxiliary power breaker disables East Quay searchlights.
- **Zone 2 — Expanded North Apron (2F Port Ops Tower & North Fuel Tank Farm)**: Walkable 2-story glass command tower (`y = 3.6m`) with rotating radar, exterior steel staircase, sniper balcony, and fuel tank catwalk streamed via `port-chapter-architecture.js`.
- **Zone 3 — Central Container Yard & Catwalk Overlook**: Elevated vantage point (`y = 2.59m`) for `Q` tactical pulse scanning, barrel detonations, and flanking.
- **Zone 4 — East Port Control & South Extraction Quay**: Dual-approach shutter/waterside infiltration leading into the **Anvil Gunship + Gantry Crane Collapse** climax and extraction boat defense.

### 4.2 Four-Phase Cinematic Pacing Curve
1. **Atmosphere & Friction**: Low-altitude SAR-07 chopper pass + Mara Chen joins as an active navigating companion who challenges Ward's orders during traversal.
2. **Tactical Sabotage & Investigation**: Player chooses stealth (cut Warehouse 1 breaker, flank via waterside) or assault (detonate fuel drums / EMP fuse boxes, climb 2F Ops Tower / Catwalk) to recover the contradictory 05:31 & 05:34 originals.
3. **Turning Point — Interactive Set Piece (`Anvil Gunship Sweep & Gantry Crane Collapse`)**: Driven by the reusable `port-cinematic-sequencer.js` timeline: an armed Anvil Gunship swoops across the harbor with red targeting laser + searchlight, opens heavy tracer fire on the central gantry crane, and triggers a **real-time 3D collapsing crane boom + burning wreckage** that physically alters the yard while Mara calls out cover and flanks with the player.
4. **Climax & Extraction**: Sprint through burning debris under gunship flares to the South Ladder as the extraction cutter races in, hold off pursuing drones, and extract with Mara.

---

## 5. Prioritized Roadmap for Remaining Chapters
1. **Immediate (Completed in this Vertical Slice)**: Reusable `port-cinematic-sequencer.js`, `port-companion-ai.js`, Berth 4 full vertical slice (`port-berth-vertical-slice.js`), sector-streamed multi-story architecture (`port-chapter-architecture.js`), tactical sandbox (`port-tactical-sandbox.js`), and fixing the `drydock` floating aircraft wreck leak.
2. **Next Sprint (Chapters 2–4)**: Port `port-companion-ai.js` onto Harris (Rail Yard) and Mara (Drydock/Tide Gate) so they actively take cover and open doors; add real-time rising-wave foam & barge collision timeline in `port-cinematic-sequencer.js`.
3. **Final Polish Sprint (Chapters 5–9)**: Upgrade Offshore Platform wave pitch, Cold Storage volumetric mist, 3F Dispatch Tower vertical combat encounters, and automated browser E2E performance profiling.
