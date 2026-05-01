# Phase 2 Prompt — Kid Authentication (Name + Password Login)

WORKFLOW: Phase 2 — Kid Authentication
Follow all stages below. Present the PLAN to the user for approval before building.

━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW: Phase 2 — Kid Authentication
[ ] PLAN — Pre-built below, present to user for approval
[ ] SCAFFOLD — Create auth service, login screen component, session manager
[ ] BUILD — Login UI, password verification, session persistence, logout
[ ] INTEGRATE — Wire auth into App.jsx flow (replace join screen)
[ ] TEST — Start dev server, open browser, click through every UI path listed in TEST SCRIPT below
[ ] DEBUG — Check Supabase logs, verify password hashing works, test rapid login/logout cycles
[ ] REVIEW — Adversarial security testing: XSS in inputs, localStorage tampering, session hijack attempts
[ ] AUDIT — Grep for password exposure, verify no PII in console, check input sanitization
[ ] PROD-READY — Full login journey (success + failure + restore + logout), manual checklist
[ ] PUSH — Commit and push
━━━━━━━━━━━━━━━━━━━━━━

## Project Context

**Legacy Grove** is a children's educational app (ages 7–11). Phase 1 set up the Supabase database with schools, kids, admins, and trees tables. This phase adds the kid-facing login flow.

**Tech stack:** Vite + React (JSX, no TypeScript) · Supabase (PostgreSQL)
**Repo:** `/Users/vedangvaidya/Desktop/Omega Life/Legacy Grove`
**Existing auth state in App.jsx:** There's a partial "join" screen that creates a keeper with just initials. This needs to be replaced with proper name + password login.

## What Exists After Phase 1

┌────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐
│ Component │ Status │ Notes │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Supabase tables │ EXISTS │ schools, kids, admins, trees, care_sessions, care_chain, │
│ │ │ action_log — all created with RLS policies. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Password functions │ EXISTS │ hash_password() and verify_password() in Supabase (pgcrypto). │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Seed data │ EXISTS │ School "Omega Life School" (code: OMEGA2026), │
│ │ │ Admin "Mr. Carter", Kids: alex/bella/charlie (pw: tree123). │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ src/db.js │ EXISTS │ CRUD operations for new schema. Has authenticateKid(). │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ src/supabaseClient.js │ EXISTS │ Supabase client initialized. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ App.jsx — "join" screen │ EXISTS │ OLD flow: kid enters initials + optional name → creates │
│ │ │ keeper. MUST BE REPLACED with login screen. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ App.jsx — "loading" screen │ EXISTS │ Shows while checking for existing session. Keep this. │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ App.jsx — localStorage IDs │ EXISTS │ Stores lg_keeper_id, lg_tree_id, lg_session_id. │
│ │ │ Rename to lg_kid_id. Add lg_school_id. │
└────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘

## Auth Flow Design

```
Kid opens app
    ↓
Check localStorage for lg_kid_id
    ↓
├── Found → Load session from Supabase → Dashboard (or onboard if no active session)
│
└── Not found → Show Login Screen
                    ↓
                Kid enters:
                  • School code (e.g., OMEGA2026)
                  • Username (e.g., alex)
                  • Password (e.g., tree123)
                    ↓
                Call db.authenticateKid(schoolCode, username, password)
                    ↓
                ├── Success → Store kid ID + school ID in localStorage
                │             → Check for assigned tree
                │             ├── Has tree → Load tree → Dashboard
                │             └── No tree → "Waiting for tree" screen (auto-assigned later in Phase 5)
                │
                └── Failure → Show error ("Wrong username or password")
```

## Login Screen Design (Kid-Friendly)

The login screen must be:

- Large, clear text (kids aged 7-11)
- Big input fields with clear labels
- Friendly error messages (no technical jargon)
- Same green gradient background as the rest of the app
- Logo at top
- Three fields: School Code, Your Name, Password
- One big "Log In" button
- No "forgot password" (teacher resets via admin dashboard)

**Layout:**

```
┌────────────────────────────┐
│      [Legacy Grove Logo]   │
│       Legacy Grove         │
│   7-Day Tree Keeper        │
│                            │
│  ┌──────────────────────┐  │
│  │    Log In to Your    │  │
│  │       Grove          │  │
│  │                      │  │
│  │  School Code         │  │
│  │  ┌────────────────┐  │  │
│  │  │ OMEGA2026      │  │  │
│  │  └────────────────┘  │  │
│  │                      │  │
│  │  Your Username       │  │
│  │  ┌────────────────┐  │  │
│  │  │ alex           │  │  │
│  │  └────────────────┘  │  │
│  │                      │  │
│  │  Password            │  │
│  │  ┌────────────────┐  │  │
│  │  │ ••••••         │  │  │
│  │  └────────────────┘  │  │
│  │                      │  │
│  │  [  Log In  🌿  ]   │  │
│  │                      │  │
│  └──────────────────────┘  │
│                            │
│  No ads · Safe by design   │
└────────────────────────────┘
```

## db.js — Auth Functions Needed

```javascript
// Authenticate kid: verify school code, username, password
// Returns: { kid, school } on success, null on failure
async function authenticateKid(schoolCode, username, password)

// Get kid by ID (for session restore)
async function getKid(kidId)

// Update last_login timestamp
async function updateLastLogin(kidId)

// Get school by code
async function getSchoolByCode(code)
```

**authenticateKid implementation:**

1. Query `schools` table by `code` → get school_id
2. Query `kids` table by `school_id` + `username` → get kid record + password_hash
3. Call Supabase RPC `verify_password(password, password_hash)` → boolean
4. If true → return kid + school objects
5. If false → return null

## App.jsx Changes

### State changes:

- Rename `keeperId` → `kidId` everywhere
- Rename `lg_keeper_id` → `lg_kid_id` in localStorage
- Add `schoolId` state + `lg_school_id` in localStorage
- Remove `joinInitials` and `joinName` states
- Add `loginSchoolCode`, `loginUsername`, `loginPassword` states
- Add `loginError` state for error messages
- Add `loginLoading` state

### Screen flow changes:

- Remove the "join" screen entirely
- Replace with "login" screen
- "loading" screen stays (checks for existing session)
- After successful login: check if kid has an assigned tree
  - If assigned → load tree → go to "home"
  - If not assigned → go to "waiting" screen ("A tree will be ready for you soon!")

### New "waiting" screen:

- Friendly message: "Waiting for Your Tree 🌱"
- "A tree will be ready for you soon! Check back later!"
- "Log Out" button at bottom
- Auto-refresh every 30 seconds to check for assignment (Phase 5 adds auto-assignment from pool)

### Logout:

- Clear localStorage (lg_kid_id, lg_school_id, lg_tree_id, lg_session_id)
- Reset all state
- Go to "login" screen
- Add logout button in the app header (small, unobtrusive)

## Files to Create / Modify

| File          | Action | Description                                                                       |
| ------------- | ------ | --------------------------------------------------------------------------------- |
| `src/db.js`   | MODIFY | Add authenticateKid(), getKid(), updateLastLogin(), getSchoolByCode()             |
| `src/App.jsx` | MODIFY | Replace join screen with login, add waiting screen, add logout, rename keeper→kid |

## Security Considerations

- Passwords are NEVER stored in localStorage — only the kid's UUID
- Password verification happens server-side via Supabase RPC (pgcrypto)
- School code adds a second factor (kid needs both school code AND credentials)
- No "remember me" checkbox — session is always persistent via localStorage
- Logout clears ALL stored data
- Failed login shows generic "Wrong username or password" (no username enumeration)
- Rate limiting handled by Supabase's built-in throttling
- No password recovery for kids — teacher resets via admin panel (Phase 4)

## TEST SCRIPT — Click-Through Every UI Path

**Start the dev server (`npm run dev`), open browser, and walk through every path below. Do NOT mark TEST as complete until every item passes.**

### Path 1: Login Screen Renders Correctly

1. Open `http://localhost:5173/`
2. **Verify visually:**
   - [ ] Green gradient background matches the app theme
   - [ ] Legacy Grove logo displays at top (not broken image)
   - [ ] Title "Legacy Grove" and subtitle "7-Day Tree Keeper · Ages 7–11" visible
   - [ ] White card with "Log In to Your Grove" heading
   - [ ] Three input fields visible: "School Code", "Your Username", "Password"
   - [ ] Password field is type="password" (shows dots, not plain text)
   - [ ] "Log In" button is large, green, tappable
   - [ ] "No ads · Safe by design" text at bottom
3. **Resize to mobile width (375px):**
   - [ ] All fields still visible, not overflowing
   - [ ] Button still fully visible and tappable
   - [ ] No horizontal scroll

### Path 2: Successful Login

1. Enter: School Code = `OMEGA2026`, Username = `alex`, Password = `tree123`
2. Click "Log In" button
3. **Verify:**
   - [ ] Button shows "Logging in..." or loading state (not stuck on "Log In")
   - [ ] After 1-2 seconds: screen transitions away from login
   - [ ] If no tree assigned: "Waiting for Your Tree" screen appears
   - [ ] If tree assigned: dashboard with tree stats appears
   - [ ] No error messages shown
   - [ ] Open DevTools → Application → localStorage:
     - [ ] `lg_kid_id` exists and is a UUID
     - [ ] `lg_school_id` exists and is a UUID
   - [ ] Open DevTools → Console: no errors, no password values logged

### Path 3: Failed Login — Wrong Password

1. Clear any session (delete localStorage keys or open incognito)
2. Enter: School Code = `OMEGA2026`, Username = `alex`, Password = `wrongpassword`
3. Click "Log In"
4. **Verify:**
   - [ ] Error message appears: "Wrong username or password" (NOT "incorrect password")
   - [ ] Error message is visible, readable, kid-friendly (no technical jargon)
   - [ ] Error text is red or orange (not green — not confused with success)
   - [ ] Password field is cleared (or highlighted for re-entry)
   - [ ] Username field retains its value (kid doesn't retype everything)
   - [ ] School code field retains its value
   - [ ] Can immediately try again (no lockout after 1 attempt)
   - [ ] Login button is enabled (not permanently disabled)

### Path 4: Failed Login — Wrong School Code

1. Enter: School Code = `WRONG123`, Username = `alex`, Password = `tree123`
2. Click "Log In"
3. **Verify:**
   - [ ] Error message appears: "School not found" or similar
   - [ ] No crash, no blank screen, no console errors

### Path 5: Failed Login — Empty Fields

1. Leave all fields empty, click "Log In"
   - [ ] Error message or field validation appears (not a blank error)
2. Fill school code only, leave others empty, click "Log In"
   - [ ] Error about missing username/password
3. Fill school code + username, leave password empty
   - [ ] Error about missing password

### Path 6: Session Persistence (Page Refresh)

1. Successfully log in as alex
2. Verify you see the waiting screen or dashboard
3. **Press F5 (hard refresh)**
4. **Verify:**
   - [ ] App shows loading screen briefly, then returns to the same screen (NOT login)
   - [ ] Kid's data is restored (tree stats, day counter, etc.)
   - [ ] No flash of login screen before restoring
5. **Close the tab entirely**
6. **Open new tab, navigate to the app URL**
7. **Verify:**
   - [ ] Session is restored again (still logged in)

### Path 7: Logout

1. While logged in, find the logout button (in header or settings)
2. **Verify logout button:**
   - [ ] Button is visible but not too prominent (kids shouldn't accidentally log out)
   - [ ] Button has clear label ("Log Out" or logout icon)
3. Click logout
4. **Verify:**
   - [ ] Returns to login screen immediately
   - [ ] No error messages
   - [ ] Open DevTools → localStorage: `lg_kid_id`, `lg_school_id` are GONE
   - [ ] Refresh page → still on login screen (session not restored)
   - [ ] Browser back button does NOT return to the dashboard (or if it does, it should redirect to login)

### Path 8: Waiting Screen (No Tree Assigned)

1. Log in as a kid who has NO assigned tree
2. **Verify visually:**
   - [ ] Friendly message: "Waiting for Your Tree" or similar
   - [ ] Illustration or emoji (not a blank screen)
   - [ ] Text explains: "A tree will be ready for you soon!" (no mention of teacher assigning)
   - [ ] Logout button is available on this screen
   - [ ] No broken UI, no console errors
3. **Wait 30+ seconds:**
   - [ ] Polling happens in background (check Network tab for Supabase requests every ~30s)
   - [ ] If a tree becomes available during this time: screen should auto-update to show the tree

### Path 9: Login with Different Kids

1. Logout
2. Login as `bella` / `tree123` / `OMEGA2026`
   - [ ] Success — sees bella's session (not alex's)
3. Logout
4. Login as `charlie` / `tree123` / `OMEGA2026`
   - [ ] Success — sees charlie's session
5. **Verify:** each kid's session is independent (no data leaking between kids)

### Path 10: Keyboard & Accessibility

1. On login screen, press Tab key:
   - [ ] Focus moves through: School Code → Username → Password → Log In button (logical order)
2. Fill in all fields, press Enter:
   - [ ] Form submits (same as clicking Log In button)
3. **Verify:** no focus traps, no unreachable elements

## Security Review (REVIEW stage)

### Adversarial Input Testing

Test each input field with malicious payloads:

```
School Code field:
  - XSS: <script>alert(1)</script>
  - SQL-like: ' OR 1=1 --
  - Long string: 'A'.repeat(10000)
  → Expected: no execution, no crash, error message "School not found"

Username field:
  - XSS: <img src=x onerror=alert(1)>
  - SQL-like: admin'; DROP TABLE kids; --
  - Unicode: 👾🎮
  - Empty: ""
  → Expected: no execution, generic "Wrong username or password"

Password field:
  - XSS: <script>document.cookie</script>
  - Long: 'A'.repeat(10000)
  → Expected: no execution, generic error, no hang
```

### Session Security Testing

- [ ] Open DevTools → Application → localStorage → manually change `lg_kid_id` to a random UUID
      → Expected: app should fail gracefully (show login, not crash)
- [ ] Set `lg_kid_id` to another real kid's ID
      → Expected: loads that kid's session (this is acceptable since there's no server-side session — localStorage is trust-based. Acceptable risk for a kids' educational app without sensitive data)
- [ ] Clear localStorage while on dashboard
      → Expected: next action or refresh → login screen
- [ ] Open app in two tabs, log out in one
      → Expected: other tab should detect on next action (acceptable if it doesn't — low risk)

### Password Handling Verification

- [ ] Type password → inspect DOM → input type="password" (not type="text")
- [ ] Submit login → Network tab → verify password is sent in POST body to Supabase (HTTPS encrypted)
- [ ] Check browser autofill doesn't expose password in localStorage
- [ ] Verify password is NEVER stored in React state after successful login (only kid ID is kept)
- [ ] `console.log` search: no password values logged anywhere

### Error Message Security

- [ ] Wrong password → "Wrong username or password" (NOT "password incorrect" — prevents username enumeration)
- [ ] Wrong username → same message: "Wrong username or password"
- [ ] Wrong school code → "School not found" (acceptable — school codes aren't secret)
- [ ] Deactivated kid → "Account is not active. Ask your teacher!" (acceptable — admin created the account)

## Audit (AUDIT stage)

### Grep Patterns — Run All, Fix Any Hits

```bash
# Password in state or logs
grep -rn "password" src/ --include="*.jsx" --include="*.js" | grep -v "password_hash\|passwordField\|type.*password\|placeholder.*password\|Password\"\|label.*password"

# PII in console output
grep -rn "console\.\(log\|warn\|error\)" src/ --include="*.jsx" --include="*.js"
# Review each hit — none should contain: password, name, username, school code

# localStorage keys — verify only expected keys
grep -rn "localStorage\.\(set\|get\|remove\)Item" src/ --include="*.jsx" --include="*.js"
# Expected: lg_kid_id, lg_school_id, lg_tree_id, lg_session_id — nothing else

# Input fields without proper type
grep -rn "<input" src/ --include="*.jsx" | grep -v "type="
# All inputs should have explicit type (text, password, etc.)

# dangerouslySetInnerHTML or eval
grep -rn "dangerouslySetInnerHTML\|eval(" src/
# Should return 0 results
```

## Production Readiness (PROD-READY stage)

### Full Login Journey — Test in Browser

**Journey 1: Successful Login**

1. Open app → see login screen with logo
2. Enter: OMEGA2026 / alex / tree123
3. Click "Log In"
4. → Loading indicator appears
5. → Either "Waiting for Your Tree" screen OR dashboard (depending on assignment)
6. Verify: `lg_kid_id` in localStorage matches alex's UUID in Supabase

**Journey 2: Failed Login — Wrong Password**

1. Enter: OMEGA2026 / alex / wrongpassword
2. Click "Log In"
3. → Error: "Wrong username or password"
4. → Password field cleared, focus returns to password field
5. → Can try again immediately

**Journey 3: Failed Login — Wrong School**

1. Enter: WRONGCODE / alex / tree123
2. Click "Log In"
3. → Error: "School not found"

**Journey 4: Session Restore**

1. Log in successfully as alex
2. Close browser tab completely
3. Open new tab → navigate to app
4. → Should auto-restore session (loading screen → dashboard or waiting)
5. → Should NOT show login screen

**Journey 5: Logout**

1. While logged in, click logout button
2. → Returns to login screen
3. → localStorage cleared (verify in DevTools)
4. → Refresh page → still on login screen (not auto-restored)

**Journey 6: Deactivated Account**

1. In Supabase dashboard: set alex's `is_active` to false
2. Try to login as alex
3. → Error: "Account is not active. Ask your teacher!"
4. Reset `is_active` to true after test

### Build Verification

```bash
npm run build           # 0 errors
npx vite preview        # Login screen renders, no console errors
```

## What This Phase Does NOT Do

- No admin login (Phase 4)
- No admin creating/managing kid accounts (Phase 4)
- No tree auto-assignment from pool (Phase 5 — random assignment)
- No real calendar day logic (Phase 3)
- No Vercel deployment (Phase 7)

## Dependencies

- Phase 1 MUST be complete (database schema + seed data)
- Supabase project must be running with credentials in .env
