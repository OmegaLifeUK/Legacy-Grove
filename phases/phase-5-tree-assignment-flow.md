# Phase 5 Prompt — Tree Assignment Flow (Random Auto-Assignment)

Copy-paste this for the session:

---

WORKFLOW: Phase 5 — Tree Assignment Flow
Follow all stages below. Present the PLAN to the user for approval before building.

━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW: Phase 5 — Tree Assignment Flow
[ ] PLAN — Pre-built below, present to user for approval
[ ] BUILD-AUTOASSIGN — Random auto-assignment: kid login triggers random tree from pool
[ ] BUILD-KID-RECEIVE — Kid receives auto-assigned tree: welcome screen, care chain view
[ ] BUILD-KID-PASSON — Pass-on flow: custom message, save to chain, release tree
[ ] BUILD-KID-WAITING — Waiting screen with auto-refresh when no trees available
[ ] BUILD-KID-NEWTREE — Handle fresh tree (no previous keepers) vs inherited tree
[ ] INTEGRATE — Connect auto-assignment to kid login + waiting screen polling
[ ] TEST — Open browser, click through every step of the full lifecycle in TEST SCRIPT below. Do NOT skip any step
[ ] DEBUG — Race conditions: two kids login at same time with one tree available, concurrent pass-on
[ ] REVIEW — Adversarial: kid modifies tree_id in localStorage, kid passes on before day 7, care chain injection
[ ] AUDIT — Verify no orphaned sessions, no orphaned trees, data consistency after full cycle
[ ] PROD-READY — Full 3-kid chain test: kid A → pass on → kid B auto-receives → pass on → kid C sees both messages
[ ] PUSH — Commit and push
━━━━━━━━━━━━━━━━━━━━━━

## Project Context

Trees are assigned randomly by the system, not by the teacher. The full lifecycle is:
1. Admin creates trees (adds them to the available pool)
2. Kid logs in with no tree → system randomly picks an available tree from the pool
3. Kid receives the tree with its full history
4. Kid cares for 7 real days
5. Kid writes a custom message and passes it on
6. Tree returns to "available" pool
7. Next kid who needs a tree gets one randomly from the pool

**Tech stack:** Vite + React (JSX) · Supabase · react-router-dom
**Repo:** `/Users/vedangvaidya/Desktop/Omega Life/Legacy Grove`

## What Exists After Phase 1-4

┌────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐
│ Component                      │ Status   │ Notes                                                         │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Admin dashboard                │ EXISTS   │ Can list kids, list trees, create trees.                      │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Tree pool                      │ EXISTS   │ Admin creates trees (available pool). No manual assignment.   │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Kid login                      │ EXISTS   │ Kid can log in with school code + username + password.        │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Kid "waiting" screen           │ PARTIAL  │ Shows when no trees available. Needs auto-refresh + auto-     │
│                                │          │ assignment when tree becomes available.                       │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Kid "pass on" screen           │ PARTIAL  │ Has template notes + custom text field. Needs to save to      │
│                                │          │ care_chain, end session, release tree to pool.                │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ db.js pass-on functions        │ PARTIAL  │ passOnTree() exists. Needs verification against new schema.   │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Care chain UI                  │ EXISTS   │ ChainScreen and ChainModal show previous keepers' messages.   │
└────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘

## Assignment Flow — Automatic Random

### When a kid needs a tree (login or after pass-on):
```
Kid logs in → no active care_session, no assigned_tree_id
    ↓
System calls db.assignRandomTree(kidId, schoolId)
    ↓
Backend:
  1. Query trees WHERE school_id = schoolId AND status = 'available' ORDER BY random() LIMIT 1
  2. If found:
     a. trees.status = 'assigned', trees.current_kid_id = kid.id, trees.assigned_at = now()
     b. kids.assigned_tree_id = tree.id
     c. care_sessions INSERT (tree_id, kid_id, status='active', started_at=now())
     d. Return tree
  3. If no trees available → return null
    ↓
├── Tree found → Show "Welcome to Your Tree!" screen
│     - Tree species, emoji, current health
│     - Care chain messages from previous keepers (if any)
│     - "This tree was cared for by [N] keepers before you!" (or "You're the first!")
│     - "Start Caring" button → dashboard
│
└── No trees available → Show "No Trees Available" screen
      - Friendly illustration
      - "All the trees are being cared for right now!"
      - "Check back soon — a tree will be ready for you when someone passes theirs on 🌿"
      - Auto-poll every 30 seconds
      - When tree becomes available → auto-assign + navigate to "Welcome" screen
```

### Race condition handling:
```
Two kids login at the same time, only 1 tree available
    ↓
Use Supabase transaction or optimistic locking:
  - First kid's assignRandomTree succeeds → gets the tree
  - Second kid's query returns no available trees → waiting screen
  - This is acceptable — no data corruption, second kid just waits
```

### Kid completes Day 7 → Pass On:
```
Day 7 reached (7 real calendar days since assigned_at)
    ↓
"Pass On" button appears on home screen
    ↓
Kid taps → Pass On Screen
  - Tree visual + current state
  - Text area: "Write a message for the next keeper" (200 char max)
  - Template suggestions below (clickable to fill text area)
  - "Pass On My Tree 🌿" button
    ↓
Backend:
  1. care_chain INSERT (tree_id, kid_id, care_session_id, name, message)
  2. care_sessions.status = 'completed', ended_at = now()
  3. trees.current_kid_id = null, trees.status = 'available'
  4. kids.assigned_tree_id = null
    ↓
Show "Passed On!" confirmation
  - "Your message will travel with this tree forever 💚"
    ↓
Immediately try db.assignRandomTree(kidId, schoolId)
  ├── Tree available → "Welcome to Your Tree!" screen (new tree)
  └── No tree available → "No Trees Available" waiting screen
```

### Kid's tree dies:
```
Tree state = "Dead" (all stats depleted)
    ↓
Death/Cleanup flow (already exists — 3-step process)
    ↓
After cleanup:
  1. trees.status = 'dead'
  2. care_sessions.status = 'completed', ended_at = now()
  3. kids.assigned_tree_id = null
    ↓
Immediately try db.assignRandomTree(kidId, schoolId)
  ├── Tree available → "Welcome to Your Tree!" screen
  └── No tree available → "No Trees Available" waiting screen
```

## Polling for Waiting Screen

When kid is on the "No Trees Available" waiting screen, poll every 30 seconds and try to auto-assign:
```javascript
useEffect(() => {
  if (screen !== "waiting") return;
  const interval = setInterval(async () => {
    const result = await db.assignRandomTree(kidId, schoolId);
    if (result) {
      // Tree was auto-assigned!
      setTree(result.tree);
      setTreeId(result.treeId);
      setSessionId(result.sessionId);
      setScreen("welcome");
    }
  }, 30000);
  return () => clearInterval(interval);
}, [screen, kidId, schoolId]);
```

This means a kid only waits if ALL trees are currently assigned to other kids. As soon as any tree becomes available (another kid passes on or a dead tree is replaced by admin creating a new one), the waiting kid gets it on the next poll.

## db.js — Functions Needed

```javascript
// Random auto-assignment
async function assignRandomTree(kidId, schoolId)
// Picks a random available tree from the school's pool.
// If found: updates tree (status='assigned', current_kid_id, assigned_at),
//           updates kid (assigned_tree_id), creates care_session.
// Returns { tree, treeId, sessionId } or null if no trees available.

// Kid flow
async function loadSession(kidId)                  // full load: tree + chain + session
async function passOnTree(treeId, sessionId, kidId, treeState, name, message, badges, missions)
async function handleTreeDeath(treeId, sessionId, kidId)

// Care chain
async function getCareChain(treeId)
async function addToCareChain(treeId, kidId, sessionId, name, message)
```

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/App.jsx` | MODIFY | Add "welcome" screen, auto-assign on login, "waiting" screen with polling, update pass-on flow, update death flow |
| `src/db.js` | MODIFY | Add assignRandomTree(), update pass-on and death functions |

## Edge Cases

1. **Kid logs in, no trees available** → shows "No Trees Available" waiting screen, polls every 30s
2. **Two kids login simultaneously, one tree available** → first assignRandomTree call wins, second gets null → waiting screen
3. **Kid tries to pass on before Day 7** → "Pass On" button only appears on Day 7+
4. **Kid passes on, another tree available** → immediately auto-assigned a new tree
5. **Kid passes on, no trees available** → goes to waiting screen
6. **Dead tree in pool** → assignRandomTree filters by status='available' only, dead trees never assigned
7. **Kid logs in on two devices** → same session loads on both; last write wins (acceptable)
8. **All trees are dead** → admin must create new trees in admin panel to replenish the pool

## TEST SCRIPT — Full Lifecycle Click-Through

**Open browser. Admin window at `/admin` to create trees, Kid window at `/` to test the auto-assignment flow. Simulate Day 7 by editing `assigned_at` in Supabase. Do NOT mark TEST complete until every item passes.**

### Setup
- Open `/admin` in one tab, login as admin@omegalife.uk / admin123
- Admin creates 3 trees: Apple, Rowan, Hazel (go to Trees → Create Tree for each)
  - [ ] All 3 appear in trees list with status = Available

### Cycle 1: Alex Logs In → Auto-Assigned Random Tree

**Kid tab:**
1. Login as alex / tree123 / OMEGA2026
2. **Verify auto-assignment happens:**
   - [ ] Brief loading indicator while system assigns tree
   - [ ] "Welcome to Your Tree!" screen appears with one of the 3 trees
   - [ ] Shows tree species emoji + name
   - [ ] Shows current tree health/stats
   - [ ] Care chain section: "You're the first keeper of this tree!" (or empty chain)
   - [ ] "Start Caring" button visible
3. Note which tree Alex got (e.g., Apple)
4. Click "Start Caring"
   - [ ] Dashboard loads with tree visual, stat gauges, state banner
   - [ ] Day counter: "Day 1 of 7"
   - [ ] All stat bars showing starting values

**Admin tab:**
5. Refresh Trees page
   - [ ] The tree Alex got shows status = "Assigned", Keeper = Alex Johnson
   - [ ] Other 2 trees still show "Available"

### Cycle 2: Alex Cares for the Tree

**Kid tab (Alex), still on dashboard:**
6. Click Care tab (bottom nav)
   - [ ] Action grid loads: Water, Move to Light, Feed Soil, Mulch, Prune, etc.
7. Click "Water" → click "Apply"
    - [ ] Toast: "💧 Water applied! +care"
    - [ ] Water stat visibly increases
8. Click "Feed Soil" → "Apply"
    - [ ] Soil stat increases
9. Click "Birdhouse" → "Apply"
    - [ ] Bio stat increases
10. Click Home tab → verify stats reflect all actions
    - [ ] Water higher, soil higher, bio higher
11. Click Missions tab
    - [ ] Mission list visible
    - [ ] Click "I did it!" on one mission → stat boost applies, toast appears
12. Click Chain tab
    - [ ] Shows "You (current keeper)" since no previous keepers
    - [ ] "Chain length: 1" (just Alex)

### Cycle 3: Simulate Day 7 → Alex Passes On

13. **In Supabase SQL Editor, simulate 7 days passing:**
    ```sql
    UPDATE trees SET assigned_at = now() - interval '7 days'
    WHERE current_kid_id = (SELECT id FROM kids WHERE username = 'alex');
    ```

**Kid tab (Alex):**
14. Refresh the page
15. **Verify Day 7 prompt:**
    - [ ] Day counter shows "Day 7" or "Day 8"
    - [ ] Green card on home screen: "Day 7 — Time to Pass It On!"
    - [ ] "Pass On My Tree 🌱" button inside the card
    - [ ] "Pass On" tab appears in bottom navigation
16. Click "Pass On My Tree" (or "Pass On" tab)
17. **Verify Pass On screen:**
    - [ ] Tree visual with current state
    - [ ] "Your initials" input field
    - [ ] "Write your own message" text area (200 char limit)
    - [ ] Character counter (e.g., "0/200")
    - [ ] Template suggestions below the text area (5 templates)
    - [ ] "Pass On My Tree 🌿" submit button
18. Enter initials: "AJ"
19. Type custom message: "I watered you every single day! Stay strong little tree! 🌱💧"
    - [ ] Character counter updates as you type
    - [ ] Message displays correctly (no garbled characters)
20. Click template "You're in good hands now. Keep growing! 🌿"
    - [ ] Text area fills with template text (replaces typed text)
21. Clear and re-type custom message: "I watered you every single day! Stay strong little tree! 🌱💧"
22. Click "Pass On My Tree 🌿"
23. **Verify pass-on confirmation:**
    - [ ] 🎉 animation/emoji appears
    - [ ] "Passed On!" heading
    - [ ] "Your message will travel with this tree forever" or similar
24. **After pass-on, system tries auto-assign:**
    - [ ] If other trees available: Alex immediately gets a new tree → "Welcome to Your Tree!" screen
    - [ ] If no trees available: Alex sees "No Trees Available" waiting screen

**Admin tab:**
25. Refresh Trees page
    - [ ] Alex's old tree status = "Available" (no longer assigned)
    - [ ] Care chain shows 1 entry: "AJ — I watered you every single day!..."

### Cycle 4: Bella Logs In → Gets Alex's Old Tree (or Random Tree)

**Kid tab:**
26. Logout as Alex
27. Login as bella / tree123 / OMEGA2026
28. **Verify auto-assignment:**
    - [ ] System randomly assigns an available tree (could be Alex's old tree or another)
    - [ ] "Welcome to Your Tree!" screen appears
29. If Bella got Alex's old tree:
    - [ ] Care chain shows: "AJ — I watered you every single day!..."
    - [ ] "This tree was cared for by 1 keeper before you!" or chain count
    - [ ] Stats carried forward from Alex's care period (with drift)
30. Click "Start Caring"
    - [ ] Dashboard loads, Day 1 of a NEW 7-day period for Bella
31. Click Chain tab
    - [ ] Previous keeper entries displayed (if inherited tree)
    - [ ] "You (current keeper)" below

### Cycle 5: Simulate Bella's Day 7 → Pass On

32. Simulate Day 7 for Bella in Supabase
33. Bella passes on with message: "Keep growing, little apple tree! 🍎"
34. **Verify:**
    - [ ] Pass on succeeds
    - [ ] System tries auto-assign for Bella (gets new tree or goes to waiting)

### Cycle 6: Charlie Gets Tree with Care Chain

**Kid tab:**
35. Logout → login as charlie / tree123 / OMEGA2026
36. **Verify auto-assignment:**
    - [ ] Charlie gets a random tree
37. If Charlie gets the tree that both Alex and Bella cared for:
    - [ ] Welcome screen shows tree with 2 previous keepers
    - [ ] Care chain shows BOTH messages in order:
      - [ ] #1: "AJ — I watered you every single day!..."
      - [ ] #2: "BK — Keep growing, little apple tree! 🍎"
    - [ ] "This tree was cared for by 2 keepers before you!"
38. Click "Start Caring" → dashboard
39. Click Chain tab
    - [ ] All previous messages displayed in correct order
    - [ ] Charlie shown as "You (current keeper)"
    - [ ] Tree rings: showing rings from all care periods

### Cycle 7: No Trees Available → Waiting Screen

**Setup:** Ensure all available trees are assigned (assign trees to all kids).

**Kid tab:**
40. Logout → create a new kid "Diana" in admin panel first
41. Login as diana
42. **Verify "No Trees Available" screen:**
    - [ ] Friendly message: "All the trees are being cared for right now!" or similar
    - [ ] Logout button available
    - [ ] No crash, no error

**Admin tab:**
43. Create a new Hazel tree (adds to available pool)

**Kid tab (Diana):**
44. Wait up to 30 seconds on the waiting screen
    - [ ] Screen automatically transitions to "Welcome to Your Tree!" with the new Hazel tree
    - [ ] No manual refresh needed
    - [ ] Auto-assignment happened via polling

### Cycle 8: Dead Tree Flow

45. Make sure Alex has a tree (login as Alex, should auto-assign)
46. In Supabase, set all stats to 0:
    ```sql
    UPDATE trees SET h2o = 0, light = 0, soil = 0, bio = 0, clean = 0
    WHERE current_kid_id = (SELECT id FROM kids WHERE username = 'alex');
    ```
47. Refresh Alex's app
    - [ ] Tree shows as "Dead" state
    - [ ] Death/cleanup flow begins (3-step process)
48. Click through all 3 cleanup steps
    - [ ] Step 1: "Say Goodbye" → "Remove Gently"
    - [ ] Step 2: "Return to Earth" → "Compost & Recycle"
    - [ ] Step 3: "Begin Again" → "Plant a New Seed"
49. After cleanup:
    - [ ] System tries auto-assign: if trees available → welcome screen, else → waiting screen
    - [ ] Tree is marked dead in database
    - [ ] Alex's session is ended

**Admin tab:**
50. Trees page shows the dead tree with status = "Dead"
    - [ ] Dead trees are NOT shown as auto-assignable (status != 'available')
    - [ ] Dead trees are visually distinct (greyed out, different badge)

### Build Check
```bash
npm run build    # 0 errors
```

## Security Review (REVIEW stage)

### Kid-Side Manipulation Testing
- [ ] Kid modifies `lg_tree_id` in localStorage to another tree's UUID
  → App should either fail gracefully or load the wrong tree (acceptable: no sensitive data on trees)
  → Verify kid cannot SAVE changes to a tree they're not assigned to (check: does updateTree verify kid ownership?)
  → **Recommended fix**: validate that `tree.current_kid_id === kidId` before allowing saves
- [ ] Kid modifies `lg_session_id` to another session
  → Should fail on save (session doesn't match kid)
- [ ] Kid tries to pass on before Day 7 (by manually calling doPassOn)
  → Frontend should block (button hidden), but also verify backend doesn't allow early pass-on
  → **Check**: does `passOnTree()` verify day >= 7 server-side? If not, add validation

### Care Chain Message Injection
```
Custom message field:
  - XSS: <script>alert('xss')</script>
    → Stored in DB as-is, but rendered with React's auto-escaping (safe)
    → Verify: messages displayed in ChainScreen use {c.note} not dangerouslySetInnerHTML
  
  - Long message: 'A'.repeat(500)
    → Should be truncated at 200 chars (maxLength on textarea)
    → Also verify DB column allows up to 200 (TEXT type — no limit, but app enforces)
  
  - Empty message: ""
    → "Pass On" button should be disabled or show error
  
  - Message with emoji: "I loved caring for you! 🌱💚"
    → Should store and display correctly (UTF-8)
  
  - Message with newlines: "Line 1\nLine 2"
    → Should display correctly (rendered as text, newlines visible or wrapped)
```

### Race Condition Testing
- [ ] Two kids log in simultaneously when only 1 tree is available
  → One should get the tree, the other should see "No Trees Available" waiting screen
  → No double-assignment (tree.current_kid_id should only be one kid)
  → Verify in Supabase: tree has exactly 1 current_kid_id, 1 active session
- [ ] Kid passes on tree → tree goes to pool → another kid's poll picks it up
  → Second kid should get the tree correctly with full care chain
  → No race between pass-on and poll assignment

### Data Consistency After Pass-On
After a complete pass-on cycle, verify in Supabase:
- [ ] `care_sessions`: old session has `status='completed'`, `ended_at` is set
- [ ] `care_chain`: new entry exists with correct `tree_id`, `kid_id`, `message`, `order_index`
- [ ] `trees`: `status='available'`, `current_kid_id=null`
- [ ] `kids`: `assigned_tree_id=null`
- [ ] `action_log`: all entries for the session are preserved (not deleted)
- [ ] No orphaned records (sessions without kids, chain entries without trees)

## Audit (AUDIT stage)

```bash
# Verify day-7 check exists before pass-on
grep -rn "day.*7\|isDay7\|>= 7\|>= 8" src/App.jsx
# Should find the check that gates the "Pass On" button

# Verify kid ownership check on saves
grep -rn "current_kid_id\|currentKid\|kid_id" src/db.js
# Review: does updateTree verify ownership?

# Verify care chain uses React escaping (not innerHTML)
grep -rn "dangerouslySetInnerHTML\|innerHTML\|\.html(" src/App.jsx
# Should return 0 results

# Verify no hardcoded tree IDs or kid IDs
grep -rn "[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}" src/ --include="*.jsx" --include="*.js"
# Should return 0 results (no hardcoded UUIDs)

# Verify polling interval is reasonable
grep -rn "setInterval\|setTimeout.*000" src/App.jsx
# Polling: 30000ms (30s) for waiting screen
# Auto-save: 15000ms (15s) for tree state
# Both acceptable — not too frequent, not too slow

# Orphan check query (run in Supabase SQL editor after testing)
# Sessions without matching kid:
# SELECT * FROM care_sessions WHERE kid_id NOT IN (SELECT id FROM kids);
# Chain entries without matching tree:
# SELECT * FROM care_chain WHERE tree_id NOT IN (SELECT id FROM trees);
```

## Production Readiness (PROD-READY stage)

### Full 3-Kid Care Chain Test

This is the critical end-to-end test. Admin only creates trees — assignment is automatic.

**Setup:**
- Admin logged in at `/admin` → creates 1 Apple tree (available pool)
- Kid login at `/`

**Round 1 — Alex:**
1. Alex logs in → system auto-assigns the Apple tree
2. Alex sees "Welcome to Your Tree!" → Apple tree with empty chain
3. Alex clicks "Start Caring" → dashboard
4. Alex waters, feeds, adds birdhouse (verify actions save to DB)
5. (Simulate Day 7: update `assigned_at` in Supabase to 7 days ago)
6. Alex refreshes → "Day 7 — Time to Pass On!" appears
7. Alex taps "Pass On" → writes: "I gave you lots of water! Stay strong! 💧"
8. Alex taps "Pass On My Tree" → confirmation → auto-assign attempt
9. **Verify in Supabase:**
   - `trees`: Apple tree status='available', current_kid_id=null
   - `care_chain`: 1 entry — name="Alex Johnson", message="I gave you lots of water!..."
   - `care_sessions`: Alex's session status='completed'
   - `kids`: Alex's assigned_tree_id=null

**Round 2 — Bella:**
1. Bella logs in → system auto-assigns the Apple tree (only available tree)
2. Bella sees "Welcome to Your Tree!" → Apple tree with Alex's stats
3. Bella sees care chain: "Alex Johnson: I gave you lots of water! Stay strong! 💧"
4. Bella cares for tree, stats change based on what Alex left behind
5. (Simulate Day 7)
6. Bella passes on: "You're doing amazing, little tree! Keep growing! 🌿"
7. **Verify in Supabase:**
   - `care_chain`: 2 entries — Alex (order_index=0), Bella (order_index=1)
   - Both sessions completed

**Round 3 — Charlie:**
1. Charlie logs in → system auto-assigns the Apple tree
2. Charlie sees tree with BOTH Alex's and Bella's messages in chain
3. Charlie sees: care chain length = 3 (Alex + Bella + Charlie as current)
4. Care chain screen shows Alex's message, then Bella's, then "You (current keeper)"
5. **Verify**: messages display in correct order, no duplicates, no missing entries

### Edge Case: Dead Tree
1. Alex logs in → auto-assigned a tree
2. In Supabase, set all stats to 0 (force death)
3. Alex opens app → tree shows as "Dead"
4. Alex goes through 3-step cleanup → system tries auto-assign
5. Verify: tree status='dead' in DB, session ended, Alex gets new tree or waits

### Build Verification
```bash
npm run build           # 0 errors
npx vite preview        # Full flow works locally
```

## What This Phase Does NOT Do

- No GDPR data export/deletion compliance (Phase 6)
- No Vercel deployment (Phase 7)
- No Supabase Realtime subscriptions (future enhancement)

## Dependencies

- Phase 1 MUST be complete (database)
- Phase 2 MUST be complete (kid auth)
- Phase 3 MUST be complete (real calendar days — assignment uses assigned_at)
- Phase 4 MUST be complete (admin dashboard — admin creates trees for the pool)
