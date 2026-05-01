# Phase 4 Prompt — Admin Dashboard (Teacher Panel — Tree Pool & Kid Management)

Copy-paste this for the session:

---

WORKFLOW: Phase 4 — Admin Dashboard
Follow all stages below. Present the PLAN to the user for approval before building.

━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW: Phase 4 — Admin Dashboard
[ ] PLAN — Pre-built below, present to user for approval
[ ] SCAFFOLD — Create admin route, layout, components, auth guard
[ ] BUILD-AUTH — Admin login page, session management, protected routes
[ ] BUILD-KIDS — Kid management: list, add, edit, reset password, deactivate
[ ] BUILD-TREES — Tree pool: list all trees, status, current keeper, create new trees, care chain
[ ] BUILD-OVERVIEW — Dashboard home: school stats, active trees, active kids
[ ] TEST — Start dev server, open browser to /admin, click through every button/form/table in TEST SCRIPT below
[ ] DEBUG — Multi-session test (admin + kid in separate tabs), check Supabase logs
[ ] REVIEW — Adversarial attacks: XSS in kid names, IDOR on school_id, admin session tampering
[ ] AUDIT — Grep for hardcoded admin credentials, verify admin-only functions, check input validation
[ ] PROD-READY — Full admin journey: login → add kid → create tree (pool) → view chain → logout
[ ] PUSH — Commit and push
━━━━━━━━━━━━━━━━━━━━━━

## Project Context

Teachers need a web dashboard to manage kids, create accounts, add trees to the pool, and monitor progress. Trees are assigned to kids randomly by the system (not manually by the teacher). This is a separate section of the same Vite React app, accessible at `/admin`.

**Tech stack:** Vite + React (JSX) · Supabase · react-router-dom (to be added)
**Repo:** `/Users/vedangvaidya/Desktop/Omega Life/Legacy Grove`
**Current routing:** None — the app is a single-page component with screen state. We need to add React Router to support `/admin` vs `/` (kid app).

## What Exists After Phase 1-3

┌────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐
│ Component                      │ Status   │ Notes                                                         │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ admins table                   │ EXISTS   │ id, school_id, email, password_hash, display_name, role.      │
│                                │          │ Seed admin: admin@omegalife.uk / admin123.                    │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ kids table                     │ EXISTS   │ With auth fields. Seed: alex, bella, charlie.                 │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ trees table                    │ EXISTS   │ With all stats, status, current_kid_id.                       │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ care_chain table               │ EXISTS   │ Messages from kids when passing on trees.                     │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ care_sessions table            │ EXISTS   │ Links kids to trees for 7-day periods.                        │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ db.js                          │ EXISTS   │ Has authenticateAdmin() stub. Needs admin CRUD functions.      │
│                                │          │ No manual tree assignment — trees auto-assigned to kids.       │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ React Router                   │ MISSING  │ Need to install and set up. Current app uses screen state.    │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ Admin components               │ MISSING  │ No admin UI exists.                                           │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ main.jsx                       │ EXISTS   │ Renders <LegacyGrove />. Needs router wrapping.               │
└────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘

## Architecture

```
src/
├── main.jsx                    ← Add BrowserRouter + Routes
├── App.jsx                     ← Kid app (route: /*)
├── supabaseClient.js           ← Shared
├── db.js                       ← Shared (add admin CRUD)
└── admin/
    ├── AdminApp.jsx            ← Admin shell: sidebar + content area
    ├── AdminLogin.jsx          ← Admin login page
    ├── Dashboard.jsx           ← Overview: stats, recent activity
    ├── KidsManager.jsx         ← CRUD kids: list, add, edit, reset pw, deactivate
    ├── TreesManager.jsx        ← Tree pool: view all trees, create new, view status/chain
    └── AdminGuard.jsx          ← Auth guard component (redirects to login if not admin)
```

## Routing Setup

Install react-router-dom, then update main.jsx:

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LegacyGrove from "./App";
import AdminApp from "./admin/AdminApp";

<BrowserRouter>
  <Routes>
    <Route path="/admin/*" element={<AdminApp />} />
    <Route path="/*" element={<LegacyGrove />} />
  </Routes>
</BrowserRouter>
```

**IMPORTANT:** The current app uses `base: "/Legacy-Grove/"` in vite.config.js for GitHub Pages. This will change in Phase 7 (Vercel) where base becomes `/`. Plan for both.

## Admin Login Flow

```
Admin visits /admin
    ↓
Check localStorage for lg_admin_id
    ↓
├── Found → Verify admin still exists/active → Show dashboard
│
└── Not found → Show Admin Login
                    ↓
                Admin enters:
                  • Email
                  • Password
                    ↓
                Call db.authenticateAdmin(email, password)
                    ↓
                ├── Success → Store admin_id + school_id in localStorage → Dashboard
                └── Failure → Error message
```

## Admin Dashboard Pages

### 1. Dashboard Home (`/admin`)
- School name and code displayed at top
- Stat cards:
  - Total Kids (active)
  - Total Trees in Pool
  - Trees In Care (currently assigned to kids)
  - Trees Available (in pool, waiting to be auto-assigned)
  - Trees Passed On (total care chain entries)
- Recent activity feed (last 10 actions across all kids)

### 2. Kids Manager (`/admin/kids`)
- **Table/list view** of all kids in the school:
  - Name, Username, Status (active/inactive), Assigned Tree (species or "—"), Last Login
- **Add Kid button** → modal/form:
  - Name (required)
  - Username (required, unique within school)
  - Password (required, min 4 chars — kid-friendly)
  - → Creates kid in Supabase with hashed password
- **Edit Kid** → click row → edit name, username
- **Reset Password** → button → prompt for new password → update hash
- **Deactivate/Activate** → toggle is_active
- **Delete Kid** → confirmation modal → hard delete (GDPR compliance — Phase 6 adds proper data export before delete)

### 3. Trees Manager (`/admin/trees`)
- **Table/list view** of all trees:
  - Species (emoji + name), Status (Available/Assigned/Dead), Current Keeper (kid name or "—"), Day, Health State, Care Chain Length
- **View Tree** → click row → detailed view:
  - All stats (h2o, light, soil, bio, clean)
  - Ring history visualization
  - Full care chain with messages
  - Session history (who cared for it, when)
- **Create Tree** → pick species → creates new tree in "available" status (added to the pool for random auto-assignment to kids)
- **Mark as Dead** → status = "dead" (for cleanup)
- **NOTE:** No manual assign/unassign. Trees are randomly assigned to kids by the system when a kid needs one.

## db.js — Admin Functions Needed

```javascript
// Admin auth
async function authenticateAdmin(email, password)
async function getAdmin(adminId)

// Kid management
async function listKids(schoolId)
async function createKid(schoolId, name, username, password)
async function updateKid(kidId, { name, username })
async function resetKidPassword(kidId, newPassword)
async function toggleKidActive(kidId, isActive)
async function deleteKid(kidId)

// Tree pool management (no manual assignment — trees auto-assigned to kids by the system)
async function listTrees(schoolId)
async function getTreeDetails(treeId)           // includes care chain + session history
async function createTreeForSchool(schoolId, species)   // adds tree to available pool
async function deleteTree(treeId)

// Stats
async function getSchoolStats(schoolId)         // aggregate counts
async function getRecentActivity(schoolId, limit)
```

## Admin UI Design

**Color scheme:** Darker, more professional than the kid app
- Background: `#F8FAFB`
- Sidebar: `#1A3C2A` (dark green)
- Accent: `#2D6A4F`
- Cards: white with subtle shadow
- Text: `#333` primary, `#888` secondary

**Layout:**
```
┌──────────┬───────────────────────────────────────┐
│          │  Header: School Name · Admin Name      │
│  Logo    ├───────────────────────────────────────┤
│          │                                       │
│ Dashboard│  [Content area — changes per page]    │
│ Kids     │                                       │
│ Trees    │                                       │
│          │                                       │
│          │                                       │
│          │                                       │
│ ──────── │                                       │
│ Logout   │                                       │
└──────────┴───────────────────────────────────────┘
```

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/admin/AdminApp.jsx` | CREATE | Admin shell: sidebar nav, route nesting, auth guard |
| `src/admin/AdminLogin.jsx` | CREATE | Email + password login form |
| `src/admin/Dashboard.jsx` | CREATE | School stats overview |
| `src/admin/KidsManager.jsx` | CREATE | Kid CRUD table + forms |
| `src/admin/TreesManager.jsx` | CREATE | Tree pool: list, create, view details/chain (no manual assignment) |
| `src/admin/AdminGuard.jsx` | CREATE | Auth check wrapper component |
| `src/main.jsx` | MODIFY | Add React Router, admin routes |
| `src/db.js` | MODIFY | Add all admin CRUD functions |
| `package.json` | MODIFY | Add react-router-dom dependency |

## Security Considerations

- Admin session stored in localStorage as `lg_admin_id` + `lg_admin_school_id`
- Admin functions in db.js should verify the caller is an admin (check admin table)
- Kid-facing routes (`/`) must NOT check for or expose admin data
- Admin routes (`/admin/*`) must NOT be accessible to kids
- All inputs validated and sanitized before database writes
- Delete operations require confirmation dialog
- Password fields always type="password", never logged or displayed
- Admin cannot see kids' passwords (only reset them)
- Admin does NOT manually assign trees — assignment is automatic/random by the system

## TEST SCRIPT — Click-Through Every UI Path

**Start dev server, open browser to `/admin`. Click every button, fill every form, verify every table. Do NOT mark TEST complete until all items pass.**

### Path 1: Admin Login Screen
1. Navigate to `http://localhost:5173/admin`
2. **Verify visually:**
   - [ ] Login form with Email and Password fields
   - [ ] Professional/clean design (distinct from kid app)
   - [ ] "Log In" button visible
   - [ ] No access to admin dashboard without logging in

### Path 2: Admin Login — Success
1. Enter: admin@omegalife.uk / admin123
2. Click "Log In"
3. **Verify:**
   - [ ] Dashboard loads with sidebar navigation
   - [ ] Sidebar shows: Dashboard, Kids, Trees
   - [ ] Header shows school name ("Omega Life School") and admin name ("Mr. Carter")
   - [ ] Logout button visible

### Path 3: Admin Login — Failure
1. Logout, then try: admin@omegalife.uk / wrongpassword
2. **Verify:**
   - [ ] Error message shown (no crash)
   - [ ] Can retry immediately

### Path 4: Dashboard Overview
1. Click "Dashboard" in sidebar
2. **Verify visually:**
   - [ ] Stat cards showing: Total Kids, Total Trees, Trees In Care, Trees Available
   - [ ] Numbers are correct (e.g., 3 kids from seed data, 0 trees if none created yet)
   - [ ] No broken layouts, no NaN values, no loading spinners stuck

### Path 5: Kids Manager — List View
1. Click "Kids" in sidebar
2. **Verify:**
   - [ ] Table/list shows all kids: Alex Johnson, Bella Khan, Charlie Davis
   - [ ] Each row shows: Name, Username, Status (Active), Assigned Tree (— if none), Last Login
   - [ ] "Add Kid" button visible
   - [ ] Table is readable, columns aligned

### Path 6: Kids Manager — Add Kid
1. Click "Add Kid"
2. **Verify form has:** Name, Username, Password fields (all required)
3. Fill: Name = "Diana Evans", Username = "diana", Password = "tree123"
4. Click Save/Create
5. **Verify:**
   - [ ] Diana appears in the kids list
   - [ ] Success message/toast
   - [ ] Diana shows as Active, no tree assigned
6. **Try adding duplicate:** Username = "alex"
   - [ ] Error: "Username already taken" or similar
7. **Try adding empty name:**
   - [ ] Validation error (form doesn't submit)
8. **Try password < 4 chars:** Password = "ab"
   - [ ] Validation error

### Path 7: Kids Manager — Edit Kid
1. Click on Diana's row (or edit button)
2. **Verify:** edit form appears with current name + username
3. Change name to "Diana E."
4. Save
5. **Verify:**
   - [ ] List updates to show "Diana E."
   - [ ] Username unchanged
   - [ ] No errors

### Path 8: Kids Manager — Reset Password
1. Click "Reset Password" for Diana
2. **Verify:** prompt/modal for new password
3. Enter new password: "newpass123"
4. Confirm
5. **Verify:**
   - [ ] Success message
   - [ ] (Optional: open new tab, try logging in as diana with new password → works)

### Path 9: Kids Manager — Deactivate/Activate
1. Click "Deactivate" for Diana
2. **Verify:**
   - [ ] Diana's status changes to "Inactive" (visually distinct — greyed out, different badge)
   - [ ] Confirmation dialog appeared before deactivating
3. Click "Activate" for Diana
4. **Verify:**
   - [ ] Status returns to "Active"

### Path 10: Trees Manager — Empty State
1. Click "Trees" in sidebar
2. If no trees exist yet:
   - [ ] Empty state message: "No trees yet" or similar (not a blank page)
   - [ ] "Create Tree" button visible

### Path 11: Trees Manager — Create Tree
1. Click "Create Tree"
2. **Verify:** species selector appears (10 species with emojis)
3. Select "Apple (🍎)"
4. Confirm
5. **Verify:**
   - [ ] Tree appears in list: Apple, Status = Available, Keeper = —
   - [ ] Success message
6. Create 2 more trees: Rowan and Hazel
7. **Verify:** 3 trees in list, all "Available"

### Path 12: Trees Manager — View Tree Details
1. Click on the Apple tree row
2. **Verify detail view shows:**
   - [ ] Species name + emoji
   - [ ] All stats (h2o, light, soil, bio, clean) with values
   - [ ] Status: Available
   - [ ] Current Keeper: None
   - [ ] Care Chain: Empty (or "No keepers yet")
   - [ ] Ring History visualization (if applicable)
   - [ ] Back button to return to list

### Path 13: Admin Sidebar Navigation
1. Click through every sidebar link:
   - [ ] Dashboard → dashboard loads, no errors
   - [ ] Kids → kids list loads, no errors
   - [ ] Trees → trees list loads, no errors
2. **Verify:** active sidebar item is highlighted (visually distinct)
3. **Verify:** no dead links, no 404 pages

### Path 14: Admin Logout
1. Click Logout
2. **Verify:**
   - [ ] Returns to admin login screen
   - [ ] Navigate to `/admin/kids` → redirected to login (not dashboard)
   - [ ] localStorage admin keys cleared

### Path 15: Cross-Route Isolation
1. While NOT logged in as admin, navigate to `/admin/kids` directly
   - [ ] Redirected to admin login (not kids page)
2. Login as a kid at `/`
3. Navigate to `/admin`
   - [ ] See admin login screen (not admin dashboard — kid session doesn't grant admin access)
4. Login as admin at `/admin`
5. Navigate to `/`
   - [ ] See kid login screen (not kid dashboard — admin session doesn't grant kid access)

### Path 16: Build Check
```bash
npm run build    # 0 errors
```

## Security Review (REVIEW stage)

### Adversarial XSS Testing
Inject these payloads via the "Add Kid" form:
```
Kid name: <script>alert('xss')</script>
  → Should render as text, NOT execute

Kid name: <img src=x onerror=alert(1)>
  → Should render as text in kids list

Username: "><script>alert(1)</script>
  → Should be rejected or sanitized

Password: "><script>alert(1)</script>
  → Should be hashed normally, no execution on display

Tree species (if free text anywhere): '; DROP TABLE trees; --
  → Should fail silently or show error (species is from a fixed list, so shouldn't be possible)
```

### IDOR (Insecure Direct Object Reference) Testing
- [ ] Admin from School A cannot see kids from School B
  → All queries must filter by `school_id` from admin's session, not from URL/request
- [ ] Modify `lg_admin_school_id` in localStorage to School B's UUID
  → Should either fail (school B doesn't exist) or show empty data (no kids/trees for that school)
  → Should NOT show School B's real data (since admin isn't linked to that school in DB)
- [ ] Call `db.listKids(otherSchoolId)` directly in console
  → Should return data (RLS allows anon read) — acceptable for MVP, but document as a known limitation
  → Future: use Supabase Auth + RLS scoped to authenticated user's school

### Admin Session Security
- [ ] Navigate to `/admin/kids` without logging in → redirected to `/admin` login
- [ ] Log in as admin → open kid app at `/` in same browser → should NOT auto-login as a kid
- [ ] Log in as kid at `/` → navigate to `/admin` → should see admin login, NOT admin dashboard
- [ ] Admin session in localStorage: `lg_admin_id` → set to random UUID → should fail gracefully
- [ ] Admin logout → all admin localStorage keys cleared → `/admin` shows login

### Authorization Testing
- [ ] Only admins can create/edit/delete kids (verify no kid-facing code calls these functions)
- [ ] Only admins can create trees (add to pool)
- [ ] Only admins can reset passwords
- [ ] Kid's `db.js` functions cannot access admin-only data (admins table)
- [ ] Deleting a kid doesn't orphan their assigned tree (tree should be released to pool first)
- [ ] No manual tree assignment functions exist in admin UI (assignment is random/automatic)

### Input Validation on All Forms
```
Add Kid form:
  - Empty name → error
  - Empty username → error
  - Password < 4 chars → error
  - Username with spaces → error or stripped
  - Duplicate username (same school) → error "Username already taken"

Reset Password form:
  - Empty password → error
  - Password < 4 chars → error
```

## Audit (AUDIT stage)

```bash
# Admin credentials in code
grep -rn "admin123\|admin@omegalife\|Mr\. Carter" src/ --include="*.jsx" --include="*.js"
# Should return 0 results (credentials only in seed.sql)

# Admin-only functions exposed to kid app
grep -rn "deleteKid\|resetKidPassword\|createKid\|toggleKidActive\|createTreeForSchool" src/App.jsx
# Should return 0 results (these should only be called from admin/ components)

# Input validation present on all forms
grep -rn "\.trim()\|\.length\|required\|validate" src/admin/ --include="*.jsx"
# Should have validation on every form submission

# School ID scoping on all admin queries
grep -rn "school_id\|schoolId" src/db.js
# Every admin function that reads kids/trees MUST filter by school_id

# Console.log in admin code
grep -rn "console\.\(log\|warn\|error\)" src/admin/ --include="*.jsx"
# Review each — none should contain PII (kid names, passwords, etc.)
```

## Production Readiness (PROD-READY stage)

### Full Admin Journey — Test in Browser

**Journey 1: Admin Login & Dashboard**
1. Navigate to `/admin` → login screen
2. Login: admin@omegalife.uk / admin123
3. Dashboard loads with school stats
4. Stats show: 3 kids, 0 trees (no trees created yet)

**Journey 2: Create Kids**
1. Navigate to Kids page
2. See alex, bella, charlie listed
3. Click "Add Kid" → enter: name="Diana Evans", username="diana", password="tree123"
4. Submit → diana appears in list
5. Try adding duplicate username "alex" → error "Username already taken"
6. Try adding empty name → error

**Journey 3: Manage Kids**
1. Click on diana → edit form
2. Change name to "Diana E." → save → list updates
3. Click "Reset Password" → enter "newpass" → confirm → success message
4. Click "Deactivate" → diana shows as inactive
5. Click "Activate" → diana shows as active again

**Journey 4: Create Trees (Add to Pool)**
1. Navigate to Trees page
2. Click "Create Tree" → select "Apple" → tree appears in list with status "Available"
3. Create 2 more trees (Rowan, Hazel)
4. All 3 show status "Available" (in pool, ready for random auto-assignment to kids)
5. Note: no "Assign" button — trees are automatically assigned to kids by the system when they log in

**Journey 5: Cross-Tab Verification**
1. Stay logged in as admin in Tab 1
2. Open Tab 2 → navigate to `/` (kid app)
3. Login as alex in Tab 2 → see kid app (NOT admin panel)
4. Back to Tab 1 → still admin dashboard (sessions don't interfere)

**Journey 6: Admin Logout**
1. Click Logout in admin panel
2. Redirected to admin login
3. Refresh → still on login (not auto-restored)
4. Navigate to `/admin/kids` directly → redirected to login (guard works)

### Build Verification
```bash
npm run build           # 0 errors
npx vite preview        # Both / and /admin routes work
```

## What This Phase Does NOT Do

- No tree auto-assignment logic from kid's perspective (Phase 5)
- No manual tree assignment (by design — assignment is random/automatic)
- No GDPR data export before deletion (Phase 6)
- No Vercel deployment (Phase 7)

## Dependencies

- Phase 1 MUST be complete (database with admins table)
- Phase 2 MUST be complete (kid auth — so we can verify kid/admin separation)
- Phase 3 SHOULD be complete (real calendar days — so tree stats are meaningful)
