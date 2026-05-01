# Phase 3 Prompt — Real Calendar Days (24-Hour Day Cycle)

Copy-paste this for the session:

WORKFLOW: Phase 3 — Real Calendar Days
Follow all stages below. Present the PLAN to the user for approval before building.

━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW: Phase 3 — Real Calendar Days
[ ] PLAN — Pre-built below, present to user for approval
[ ] ANALYZE — Read current tick system in App.jsx, map all time-dependent logic
[ ] BUILD — Replace tick timer with real timestamp-based calculations
[ ] DRIFT — Implement catch-up drift (stat decay while kid was away)
[ ] EVENTS — Time-based random events (weather, pests, fungus)
[ ] INTEGRATE — Wire new time system into tree state, day counter, ring history
[ ] TEST — Start dev server, open browser, click through every UI path in TEST SCRIPT below. Manipulate Supabase timestamps to simulate multi-day journeys
[ ] DEBUG — Simulate time gaps (mock timestamps), verify drift math, check for NaN/Infinity
[ ] REVIEW — Security review: time manipulation prevention, drift cap validation, no negative stats
[ ] AUDIT — Verify no demo/test timer code left, grep for TICK_MS/30000/90000, all time math uses real timestamps
[ ] PROD-READY — Simulate 7-day journey with manipulated timestamps, verify day counter, ring history, pass-on trigger
[ ] PUSH — Commit and push
━━━━━━━━━━━━━━━━━━━━━━

## Project Context

The app currently uses a 30-second setInterval tick to simulate days (1 day ≈ 90 seconds). This needs to become real 24-hour calendar days. A kid's 7-day care period = 7 real days.

**Tech stack:** Vite + React (JSX) · Supabase
**Repo:** `/Users/vedangvaidya/Desktop/Omega Life/Legacy Grove`

## What Exists (Current Time System)

┌────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐
│ Component │ Status │ Notes │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ TICK_MS = 30000 │ EXISTS │ 30-second interval timer. Each tick applies natural drift. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Day advance logic │ EXISTS │ day += growthIncrement per tick. 3 ticks ≈ 1 day. │
│ │ │ Thriving: 0.66/tick, Normal: 0.33/tick, Stressed: 0.165/tick. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ applyNaturalDrift() │ EXISTS │ Decays h2o, light, soil, bio, clean by small amounts per tick.│
│ │ │ Species-specific tolerances affect rate. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Random events │ EXISTS │ 8% chance per tick of heatwave/storm. 15% chance of clearing. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Ring history │ EXISTS │ Adds ring color when Math.floor(day) increments. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Badge checks │ EXISTS │ waterWiseDays, cleanCount, feedCount tracked per tick. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ trees.assigned_at │ EXISTS │ Timestamp in DB. Not used in frontend yet. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ trees.updated_at │ EXISTS │ Auto-updated by trigger. Can be used for drift calculation. │
└────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘

## New Time Model

### Day Calculation

```
currentDay = floor((now - assigned_at) / 86400000) + 1
```

- Day 1 = first 24 hours from assignment
- Day 7 = hours 144–168
- Day 7 complete (pass-on eligible) = `now - assigned_at >= 7 * 86400000`

### Stat Drift (while kid is away)

When the kid opens the app, calculate how much time has elapsed since `updated_at`:

```
hoursAway = (now - updated_at) / 3600000
```

Apply proportional drift for each hour away:

- h2o: -2/hour (trees get thirsty)
- light: ±0 (natural cycle averages out)
- soil: -0.5/hour (slow nutrient drain)
- bio: -0.3/hour (biodiversity slowly fades)
- clean: -1/hour (litter accumulates)
- mood: -0.5/hour

Cap all values at 0–100. Apply species-specific tolerances as multipliers.

### Live Tick (while kid is using the app)

Keep a lightweight tick (every 60 seconds) for:

- Visual responsiveness (stat bars updating)
- Random event generation (weather)
- Saving progress to database periodically
- But DO NOT advance the day — day is purely timestamp-based

### Random Events

- Check on each app open: roll for heatwave/storm based on hours since last visit
- While app is open: 2% chance per minute of new event
- Events last 2–4 hours (real time), then clear automatically
- Event start/end times stored in tree state

### Ring History

- On each app open: check if a new calendar day has started since last visit
- If yes: add a ring for each completed day (with appropriate color based on tree state at the time)
- Store `last_ring_day` (integer) to know which days have been recorded

## Implementation Details

### New fields needed on trees table (or in tree state)

```
last_visit_at    timestamptz    -- when kid last opened the app
event_started_at timestamptz    -- when current weather event began
event_type       varchar(20)    -- 'heatwave', 'storm', or null
last_ring_day    int            -- last day number for which a ring was recorded
```

### Modified applyNaturalDrift()

```javascript
function applyCatchUpDrift(tree, species, hoursAway) {
  const sp = SPECIES[species];
  const h = Math.min(hoursAway, 48); // Cap at 48 hours of drift (don't punish too hard)
  return {
    h2o: Math.max(0, tree.h2o - 2 * h * (1 / sp.waterTol)),
    light: tree.light, // no drift
    soil: Math.max(0, tree.soil - 0.5 * h),
    bio: Math.max(0, tree.bio - 0.3 * h),
    clean: Math.max(0, tree.clean - 1 * h),
    mood: Math.max(0, (tree.mood || 70) - 0.5 * h),
  };
}
```

### Modified live tick

```javascript
const TICK_MS = 60000; // 1 minute real time

useEffect(() => {
  if (!tree || screen !== home - like) return;
  const interval = setInterval(() => {
    setTree((prev) => {
      // Small live drift (very gentle — 1/60th of hourly rate)
      const liveDrift = {
        h2o: Math.max(0, prev.h2o - 0.033),
        soil: Math.max(0, prev.soil - 0.008),
        bio: Math.max(0, prev.bio - 0.005),
        clean: Math.max(0, prev.clean - 0.017),
      };

      // Random event check (2% per minute)
      let event = prev.currentEvent;
      if (!event && Math.random() < 0.02) {
        event = Math.random() < 0.5 ? "heatwave" : "storm";
      }

      // Auto-clear events after duration
      if (
        prev.eventStartedAt &&
        Date.now() - prev.eventStartedAt > 3 * 3600000
      ) {
        event = null;
      }

      return { ...prev, ...liveDrift, currentEvent: event };
    });
  }, TICK_MS);
  return () => clearInterval(interval);
}, [tree, screen]);
```

### Day counter in UI

Replace all `Math.floor(tree.day)` with:

```javascript
const currentDay =
  Math.floor((Date.now() - new Date(tree.assignedAt).getTime()) / 86400000) + 1;
const isDay7 = currentDay >= 8; // day 7 completed
```

## Files to Modify

| File                  | Action | Description                                                     |
| --------------------- | ------ | --------------------------------------------------------------- |
| `src/App.jsx`         | MODIFY | Replace tick system, day calculation, drift logic, event timing |
| `src/db.js`           | MODIFY | Add last_visit_at tracking, catch-up drift on load              |
| `supabase/schema.sql` | MODIFY | Add last_visit_at, event_started_at, last_ring_day columns      |

## Edge Cases to Handle

1. **Kid doesn't open app for 3 days** → catch-up drift applies 48h cap, tree is stressed but not dead
2. **Kid opens app at 11:59 PM** → day should not flip to next until midnight (use assigned_at anchor)
3. **Multiple ring days missed** → add all missed rings at once (all green, since we can't know if tree was thriving while kid was away)
4. **Tree dies while kid is away** → show death state on return, don't let it happen silently (show a message)
5. **Event timing across visits** → event_started_at persists; if kid returns and event has expired, clear it
6. **Kid's 7 days end while app is closed** → on next open, show "Day 7 — Time to Pass On!"

## TEST SCRIPT — Click-Through Every UI Path

**Start the dev server, open browser. For time-based testing, you will manipulate `assigned_at` and `updated_at` directly in the Supabase dashboard to simulate elapsed time. Do NOT mark TEST as complete until every item passes.**

### Prerequisite: Ensure alex has a tree

Before testing, ensure alex has a tree. Either create an available tree via the admin panel and login as alex (auto-assignment will pick it up), or manually insert via Supabase SQL editor:

```sql
-- Create a tree and assign to alex (run in Supabase SQL Editor)
INSERT INTO trees (school_id, species, current_kid_id, status, assigned_at)
SELECT s.id, 'apple', k.id, 'assigned', now()
FROM schools s, kids k WHERE s.code = 'OMEGA2026' AND k.username = 'alex';

UPDATE kids SET assigned_tree_id = (SELECT id FROM trees WHERE species = 'apple' LIMIT 1)
WHERE username = 'alex';

INSERT INTO care_sessions (tree_id, kid_id, status)
SELECT t.id, k.id, 'active'
FROM trees t, kids k WHERE t.species = 'apple' AND k.username = 'alex';
```

### Path 1: Day 1 — Fresh Assignment

1. Set tree's `assigned_at` to `now()` and `updated_at` to `now()`
2. Login as alex → dashboard loads
3. **Verify visually:**
   - [ ] Day counter shows "Day 1 of 7"
   - [ ] "5d left" or "6d left" indicator visible
   - [ ] Stats at starting values (h2o ~60, light ~65, soil ~60, bio ~45, clean ~70)
   - [ ] No rings in ring history (or 0 rings displayed)
   - [ ] No "Pass On" button visible (it's only Day 1)
   - [ ] State banner shows "Okay" or "Healthy"

### Path 2: Live Tick — Stats Move While Watching

1. Stay on the dashboard for 2-3 minutes
2. **Verify:**
   - [ ] Water stat slowly decreases (visible in stat bar moving down slightly)
   - [ ] Clean stat slowly decreases
   - [ ] Light stat stays roughly stable
   - [ ] Numbers on stat gauges update periodically
   - [ ] No sudden jumps (smooth, gentle decline)
3. Click "Water" action → apply
   - [ ] Water stat jumps up immediately
   - [ ] Toast message appears
   - [ ] Stat bar animates upward

### Path 3: Day 3 — Simulated Multi-Day Progress

1. In Supabase, update the tree:
   ```sql
   UPDATE trees SET assigned_at = now() - interval '2 days', updated_at = now() - interval '4 hours'
   WHERE current_kid_id = (SELECT id FROM kids WHERE username = 'alex');
   ```
2. Refresh the app
3. **Verify visually:**
   - [ ] Day counter shows "Day 3 of 7"
   - [ ] "4d left" indicator
   - [ ] Stats show moderate drift (h2o dropped, clean dropped — from 4h absence)
   - [ ] Stats are NOT at zero (drift cap prevents total depletion)
   - [ ] Ring history shows 2 rings (Day 1 + Day 2 completed)
   - [ ] Navigate to Chain tab → tree rings visualization shows 2 rings
   - [ ] State may show "Okay" or "Stressed" depending on drift

### Path 4: Day 7 — Pass On Appears

1. In Supabase, update the tree:
   ```sql
   UPDATE trees SET assigned_at = now() - interval '7 days', updated_at = now() - interval '1 hour'
   WHERE current_kid_id = (SELECT id FROM kids WHERE username = 'alex');
   ```
2. Refresh the app
3. **Verify visually:**
   - [ ] Day counter shows "Day 7" or "Day 8"
   - [ ] "0d left" indicator
   - [ ] "Day 7 — Time to Pass It On!" card visible on home screen
   - [ ] "Pass On My Tree" button inside the card is clickable
   - [ ] "Pass On" tab appears in the bottom navigation bar
   - [ ] Ring history shows 6-7 rings
4. Click "Pass On My Tree" button
   - [ ] Pass On screen opens with tree visual, initials field, message field

### Path 5: Weather Events

1. While on dashboard, watch for weather events (or wait a few minutes)
2. **If a heatwave appears:**
   - [ ] Toast: "Heat wave! Add shade and mulch!"
   - [ ] Weather card appears below stats: "Heat Wave Warning!"
   - [ ] Heatwave tag appears on tree: "🌡️ Heat Wave"
   - [ ] Sun visual effect on tree illustration
3. **If a storm appears:**
   - [ ] Toast: "Storm incoming! Stake your tree!"
   - [ ] Weather card: "Storm Alert!"
   - [ ] Storm tag: "⚡ Storm"
4. **After ~3 hours (simulate by updating event_started_at):**
   - [ ] Event clears automatically
   - [ ] Weather card disappears
   - [ ] Tags removed

### Path 6: Heavy Absence — 48h Cap

1. In Supabase, simulate 5 days of absence:
   ```sql
   UPDATE trees SET updated_at = now() - interval '5 days'
   WHERE current_kid_id = (SELECT id FROM kids WHERE username = 'alex');
   ```
2. Refresh the app
3. **Verify:**
   - [ ] Stats are low but NOT all zero (48h drift cap)
   - [ ] Tree is "Stressed" or "Withering" — NOT "Dead" (from drift alone)
   - [ ] Water action still works (can recover the tree)
   - [ ] After several actions: tree recovers to "Okay" or "Healthy"

### Path 7: All Stat Gauges Update Correctly

1. On dashboard, verify each stat gauge:
   - [ ] Water (💧) — bar height matches percentage, color changes (green/yellow/red)
   - [ ] Light (☀️) — same
   - [ ] Soil (🌱) — same
   - [ ] Bio (🦋) — same
   - [ ] Clean (✨) — same
2. Apply actions that affect each stat:
   - [ ] Water → h2o bar goes up
   - [ ] Move to Light → light bar goes up
   - [ ] Feed Soil → soil bar goes up
   - [ ] Birdhouse → bio bar goes up
   - [ ] Clean Litter → clean bar goes up
3. **Verify:** bars animate smoothly, numbers update, colors change at thresholds (60+ green, 40-60 yellow, <40 red)

### Path 8: Navigation Tabs Still Work

1. Click through all bottom nav tabs:
   - [ ] Home (🌳) → tree visual, stats, suggestions, chain card
   - [ ] Care (🌿) → action buttons grid
   - [ ] Missions (🌍) → mission list with "I did it!" buttons
   - [ ] Chain (🔗) → care chain history, "You (current keeper)"
2. **Verify:** each tab loads without errors, content is relevant, back to Home works

### Path 9: Build Check

```bash
npm run build    # Must succeed with 0 errors, 0 warnings about time/tick
```

## Security Review (REVIEW stage)

### Time Manipulation Prevention

- [ ] Kid cannot advance day by changing device clock (day is calculated from `assigned_at` stored server-side in Supabase — device clock doesn't affect it)
- [ ] Verify `assigned_at` is set by the server (`default now()`) not by the client
- [ ] If client sends a future `updated_at`, server trigger overwrites it with `now()`
- [ ] Negative time gaps handled gracefully (if `updated_at` is somehow in the future, treat as 0 drift)

### Drift Validation

- [ ] No stat can go below 0 — verify `Math.max(0, ...)` on every drift calculation
- [ ] No stat can exceed 100 — verify `Math.min(100, ...)` on every boost
- [ ] Drift cap at 48 hours — verify a kid gone for 2 weeks gets same drift as 2 days (prevents total death from neglect)
- [ ] No NaN or Infinity — test with: `hoursAway = 0`, `hoursAway = NaN`, `assigned_at = null`
- [ ] Species tolerance multipliers never produce negative values

### Old Timer Code Removal

- [ ] No remaining references to the 30-second demo tick
- [ ] `TICK_MS = 30000` replaced or removed
- [ ] Comments about "TEMP TESTING" and "EASY TO REVERSE" removed
- [ ] No `growthIncrement` based on tick count (day is timestamp-based now)

## Audit (AUDIT stage)

```bash
# Leftover demo timer code
grep -rn "30000\|90000\|TICK_MS\|TEMP TESTING\|EASY TO REVERSE\|halved\|doubled" src/
# Should return 0 results

# All time calculations use timestamps
grep -rn "Date\.now\|new Date\|getTime\|assigned_at\|updated_at\|last_visit" src/ --include="*.jsx" --include="*.js"
# Review each hit — should be real timestamps, not artificial counters

# Day calculation consistency
grep -rn "Math\.floor.*day\|tree\.day\|prev\.day" src/ --include="*.jsx"
# Verify all day references use the timestamp-based calculation, not the old counter

# Verify no division by zero
grep -rn "/ 0\|/ hoursAway\|/ elapsed" src/
# Review each hit for potential divide-by-zero
```

## Production Readiness (PROD-READY stage)

### Simulated 7-Day Journey

To test without waiting 7 real days, temporarily modify `assigned_at` in Supabase:

**Day 1 test:**

1. Ensure alex has a tree with `assigned_at = now()`
2. Open app → should show "Day 1 of 7"
3. Stats should be fresh (h2o: 60, light: 65, etc.)

**Day 3 test:**

1. Update alex's tree: `assigned_at = now() - interval '2 days'`
2. Update `updated_at = now() - interval '6 hours'` (simulate 6h away)
3. Open app → should show "Day 3 of 7"
4. Stats should show moderate drift from 6h absence
5. 2 rings in ring history (Day 1 + Day 2)

**Day 7 test:**

1. Update: `assigned_at = now() - interval '7 days'`
2. Open app → should show "Day 7" or "Time to Pass On!"
3. "Pass On" button should be visible
4. 6-7 rings in ring history

**Extreme absence test:**

1. Update: `updated_at = now() - interval '5 days'`
2. Open app → stats heavily drifted but NOT all zero (48h cap)
3. Tree should be "Stressed" or "Withering" but NOT "Dead" (from drift alone)

**Edge case: Just assigned:**

1. Set `assigned_at = now()`, `updated_at = now()`
2. Open app → Day 1, no drift, no rings yet
3. Wait 2 minutes → very small drift visible in stats

### Math Verification

```
For each species, verify:
- applyCatchUpDrift(freshTree('apple'), 'apple', 0) → no change
- applyCatchUpDrift(freshTree('apple'), 'apple', 1) → h2o: 58, clean: 69
- applyCatchUpDrift(freshTree('apple'), 'apple', 48) → h2o: 0, clean: 0 (capped)
- applyCatchUpDrift(freshTree('apple'), 'apple', 100) → same as 48 (cap works)
```

### Build Verification

```bash
npm run build           # 0 errors
npx vite preview        # App loads, day counter shows Day 1
```

## What This Phase Does NOT Do

- No admin dashboard (Phase 4)
- No tree auto-assignment flow (Phase 5)
- No GDPR compliance UI (Phase 6)
- No Vercel deployment (Phase 7)

## Dependencies

- Phase 1 MUST be complete (database)
- Phase 2 MUST be complete (kid auth — need kid sessions to test)
