# Phase 6 Prompt — GDPR / AADC / UK Data Privacy Compliance

Copy-paste this for the session:

---

WORKFLOW: Phase 6 — GDPR / AADC Compliance
Follow all stages below. Present the PLAN to the user for approval before building.

━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW: Phase 6 — GDPR / AADC Compliance
[ ] PLAN — Pre-built below, present to user for approval
[ ] AUDIT-DATA — Catalog all personal data: what's stored, where, who accesses it, how long
[ ] BUILD-PRIVACY — Privacy notice page (kid-friendly language, AADC compliant)
[ ] BUILD-CONSENT — First-login consent/awareness acceptance flow
[ ] BUILD-EXPORT — Admin can export a kid's complete data as downloadable JSON
[ ] BUILD-DELETE — Admin can fully delete a kid's data with anonymized care chain
[ ] BUILD-RETENTION — Manual retention cleanup action for inactive accounts (365+ days)
[ ] BUILD-SECURITY — Security headers, console.log audit, remove any PII leaks
[ ] TEST — Start dev server, open browser, click through every privacy UI path in TEST SCRIPT below. Test consent screen, export download, delete flow, anonymized chain display
[ ] DEBUG — Verify deleted kid can't log in, exported JSON matches DB, anonymized chain displays correctly
[ ] REVIEW — Full GDPR/AADC audit against 16-point checklist, adversarial privacy testing
[ ] AUDIT-CODE — Grep every file for PII exposure, third-party requests, tracking, cookies
[ ] PROD-READY — Full privacy journey: consent → use app → export data → delete data → verify erasure
[ ] PUSH — Commit and push
━━━━━━━━━━━━━━━━━━━━━━

## Project Context

Legacy Grove is used by children aged 7–11 in UK schools. Under UK GDPR and the Age Appropriate Design Code (AADC / Children's Code), there are specific requirements for processing children's data. The school/teacher acts as the data controller; Legacy Grove is the data processor.

**Tech stack:** Vite + React (JSX) · Supabase
**Repo:** `/Users/vedangvaidya/Desktop/Omega Life/Legacy Grove`

## Regulatory Framework

### UK GDPR (applies because users are in the UK)
- Lawful basis: **Legitimate interests** (educational tool provided by school) or **consent** (obtained from school/parent)
- Data minimization: only collect what's needed
- Right to access: data subject can request their data
- Right to erasure: data subject can request deletion
- Data protection by design and default

### AADC / Children's Code (applies because users are under 18)
- **Best interests of the child** must be primary consideration
- **Data minimization**: collect bare minimum
- **No profiling**: don't use children's data for profiling or marketing
- **Transparency**: privacy info in age-appropriate language
- **High privacy by default**: most protective settings as default
- **No nudge techniques**: don't encourage children to give more data
- **No detrimental use**: don't use data in ways that harm children

## Data Inventory — What We Store

┌────────────────────┬─────────────────────┬──────────┬───────────────────────────────────────┐
│ Data               │ Table               │ Personal?│ Purpose                               │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Kid's name         │ kids.name           │ YES      │ Display in app, identify in admin      │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Kid's username     │ kids.username       │ MAYBE    │ Login credential                       │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Kid's password     │ kids.password_hash  │ NO       │ Stored as bcrypt hash, not reversible  │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Last login time    │ kids.last_login     │ YES      │ Admin monitoring                       │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Kid's messages     │ care_chain.message  │ MAYBE    │ Core feature: pass-on messages         │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Kid's name in chain│ care_chain.name     │ YES      │ Shows who wrote the message            │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Actions performed  │ action_log          │ NO       │ Gameplay actions (water, feed, etc.)    │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Badges earned      │ care_sessions       │ NO       │ Gameplay achievements                  │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Admin email        │ admins.email        │ YES      │ Admin login credential                 │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ Admin name         │ admins.display_name │ YES      │ Display in admin panel                 │
├────────────────────┼─────────────────────┼──────────┼───────────────────────────────────────┤
│ School name        │ schools.name        │ NO       │ Organizational identifier              │
└────────────────────┴─────────────────────┴──────────┴───────────────────────────────────────┘

**What we DON'T store (by design):**
- No email addresses for kids
- No photos
- No location data
- No device identifiers
- No analytics or tracking cookies
- No third-party scripts (no Google Analytics, no ads, no social media)
- No biometric data
- No IP address logging (Supabase may log IPs in its own logs — check and disable if possible)

## Implementation Plan

### 1. Privacy Notice Page (`/privacy`)

Create a dedicated privacy page accessible from:
- Login screen (link: "How we protect your data")
- App footer/settings
- Admin dashboard

**Content must be in child-friendly language (ages 7–11):**

```
How We Look After Your Information 🛡️

What we save:
• Your name and username (so you can log in)
• Your password (we scramble it so nobody can read it — not even us!)
• The things you do in the game (watering, feeding, caring for your tree)
• The kind messages you write when you pass on your tree

What we NEVER do:
• We never share your information with anyone outside your school
• We never show ads
• We never track where you are
• We never send you emails

Who can see your information:
• You can see your own tree and messages
• Your teacher can see everyone's trees and messages
• Nobody else can see anything

Want your information deleted?
• Ask your teacher — they can remove everything about you from Legacy Grove

Questions?
• Ask your teacher or a grown-up you trust
```

### 2. First-Login Consent Flow

On first login, before the kid sees anything:
```
┌──────────────────────────────────┐
│                                  │
│  Before You Start 🌿             │
│                                  │
│  Legacy Grove saves your name    │
│  and the things you do in the    │
│  game so your teacher can see    │
│  how you're doing.               │
│                                  │
│  We never share your info        │
│  with anyone outside school.     │
│                                  │
│  [Read more about privacy]       │
│                                  │
│  [ I Understand — Let's Go! ]    │
│                                  │
└──────────────────────────────────┘
```

- Store consent timestamp: `kids.privacy_accepted_at` (new column)
- If null → show consent screen before anything else
- If set → proceed normally
- This is NOT "consent" in the GDPR legal sense (kids can't consent; the school provides the legal basis). This is a transparency/awareness step required by AADC.

### 3. Admin: Export Kid Data

In KidsManager.jsx, add "Export Data" button per kid:

```
Admin clicks "Export Data" for kid "Alex"
    ↓
Backend collects:
  - Kid record (name, username, created_at, last_login)
  - All care_sessions for this kid
  - All care_chain entries by this kid
  - All action_log entries from this kid's sessions
  - All badges earned
    ↓
Download as JSON file: alex_data_export_2026-05-01.json
```

**JSON structure:**
```json
{
  "export_date": "2026-05-01T10:00:00Z",
  "kid": {
    "name": "Alex Johnson",
    "username": "alex",
    "created_at": "...",
    "last_login": "..."
  },
  "care_sessions": [...],
  "care_chain_messages": [...],
  "action_log": [...],
  "badges": [...]
}
```

### 4. Admin: Delete Kid Data (Right to Erasure)

In KidsManager.jsx, add "Delete All Data" button per kid:

```
Admin clicks "Delete All Data" for kid "Alex"
    ↓
Confirmation dialog:
  "This will permanently delete Alex's account and all their data.
   This cannot be undone.
   
   Data to be deleted:
   • Account (name, username, login history)
   • 3 care sessions
   • 2 care chain messages
   • 47 action log entries
   
   Note: Care chain messages will be anonymized (name replaced with 'Anonymous')
   rather than deleted, to preserve the tree's story for other children.
   
   [Cancel]  [Delete Everything]"
    ↓
Backend:
  1. action_log: DELETE all entries from this kid's sessions
  2. care_chain: UPDATE set name = 'A former keeper', kid_id = null (anonymize, don't delete)
  3. care_sessions: DELETE all entries for this kid
  4. If kid has an assigned tree: unassign it (tree.current_kid_id = null, status = 'available')
  5. kids: DELETE the kid record
```

**IMPORTANT:** Care chain messages are anonymized, not deleted. This preserves the tree's story for future keepers while removing all personally identifiable information. The message content is kept (it's a kind note about a tree, not personal data). The kid's name is replaced with "A former keeper."

### 5. Data Retention Policy

Add a database function or admin action for:
- Kids who haven't logged in for 365 days → auto-anonymize their care chain entries, delete their kid record
- Admin can set retention period in school settings (default: 1 year)
- Run as a manual admin action ("Clean Up Old Data") rather than automatic cron

### 6. Security Measures

**Already in place:**
- Passwords hashed with bcrypt (pgcrypto)
- No third-party tracking scripts
- No ads
- .env credentials not in git

**Add in this phase:**
- Supabase RLS policies reviewed and tightened (verify no data leaks between schools)
- Add `X-Content-Type-Options: nosniff` header
- Add `X-Frame-Options: DENY` header (no iframe embedding)
- Add `Referrer-Policy: no-referrer` header
- Remove any console.log that might expose sensitive data
- Ensure no PII in error messages shown to users

## Database Changes

```sql
-- Add privacy consent tracking
ALTER TABLE kids ADD COLUMN privacy_accepted_at timestamptz;

-- Add data retention tracking
ALTER TABLE kids ADD COLUMN data_anonymized_at timestamptz;
```

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `src/Privacy.jsx` | CREATE | Privacy notice page (kid-friendly) |
| `src/admin/KidsManager.jsx` | MODIFY | Add Export Data + Delete All Data buttons |
| `src/App.jsx` | MODIFY | Add first-login consent screen, link to privacy page |
| `src/db.js` | MODIFY | Add exportKidData(), deleteKidData(), checkConsent() |
| `src/main.jsx` | MODIFY | Add /privacy route |
| `index.html` | MODIFY | Add security meta headers |
| `supabase/schema.sql` | MODIFY | Add privacy_accepted_at column |

## TEST SCRIPT — Click-Through Every Privacy UI Path

**Start dev server, open browser. Test every privacy-related screen, button, and download. Do NOT mark TEST complete until all items pass.**

### Path 1: Privacy Page
1. Navigate to `http://localhost:5173/privacy`
2. **Verify visually:**
   - [ ] Page loads (not 404, not blank)
   - [ ] Heading visible: "How We Look After Your Information" or similar
   - [ ] Section: "What we save" — lists name, username, gameplay data
   - [ ] Section: "What we NEVER do" — lists no sharing, no ads, no tracking, no emails
   - [ ] Section: "Who can see your information" — you, your teacher, nobody else
   - [ ] Section: "Want your information deleted?" — ask your teacher
   - [ ] Language is simple, kid-friendly (age 7–11), no legal jargon
   - [ ] No broken images, no placeholder text like "[TODO]"
3. **Resize to mobile width (375px):**
   - [ ] Text is readable, no overflow, no horizontal scroll

### Path 2: Privacy Link from Login Screen
1. Navigate to `/` (kid login screen)
2. **Verify:**
   - [ ] Link to privacy page visible (e.g., "How we protect your data" or privacy icon)
   - [ ] Click the link → navigates to `/privacy`
   - [ ] Back button returns to login screen

### Path 3: First-Login Consent Screen
1. Clear all localStorage (DevTools → Application → localStorage → Clear)
2. Login as alex / tree123 / OMEGA2026
3. **Verify consent screen appears BEFORE dashboard:**
   - [ ] Screen title: "Before You Start" or similar
   - [ ] Text explains what data is saved and why
   - [ ] Text mentions teacher can see progress
   - [ ] "Read more about privacy" link present → opens /privacy
   - [ ] "I Understand — Let's Go!" button (large, clear)
   - [ ] No way to dismiss without clicking the button (can't skip)
4. Click "I Understand — Let's Go!"
   - [ ] Screen transitions to waiting screen or dashboard
   - [ ] Check Supabase: `kids.privacy_accepted_at` is now set (not null) for Alex
5. Logout → login again as alex
   - [ ] Consent screen does NOT appear again (already accepted)
   - [ ] Goes directly to waiting/dashboard

### Path 4: Admin — Export Kid Data
1. Login as admin at `/admin`
2. Navigate to Kids page
3. Find Alex in the list
4. Click "Export Data" button for Alex
5. **Verify:**
   - [ ] File download starts (JSON file)
   - [ ] Filename includes kid name and date: e.g., `alex_data_export_2026-05-01.json`
6. Open the downloaded JSON file
7. **Verify JSON content:**
   - [ ] `kid.name`: "Alex Johnson"
   - [ ] `kid.username`: "alex"
   - [ ] `kid.created_at`: valid timestamp
   - [ ] `kid.last_login`: valid timestamp (or null)
   - [ ] `care_sessions`: array (may be empty or have entries)
   - [ ] `care_chain_messages`: array of messages Alex wrote
   - [ ] `action_log`: array of actions Alex performed
   - [ ] `badges`: array of badges earned
8. **Verify JSON does NOT contain:**
   - [ ] `password_hash` — CRITICAL, must NOT be in export
   - [ ] Other kids' data — only Alex's data
   - [ ] Admin data
   - [ ] School credentials
9. **Verify JSON is well-formed:**
   - [ ] Opens in a JSON viewer without errors
   - [ ] All dates are readable ISO format

### Path 5: Admin — Delete Kid Data
1. First, create a test kid to delete (so we don't lose seed data):
   - Add Kid: name = "Test Delete", username = "testdel", password = "test123"
2. Login as testdel (system auto-assigns a tree), do some actions, pass on with a message
   (Or simulate by inserting test data in Supabase)
3. Click "Delete All Data" for testdel
4. **Verify confirmation dialog:**
   - [ ] Warning text is clear and specific
   - [ ] Shows count of data to be deleted (sessions, actions, etc.)
   - [ ] Mentions care chain will be anonymized
   - [ ] "Cancel" button returns to kids list without deleting
   - [ ] "Delete Everything" button is red/destructive-styled
5. Click "Delete Everything"
6. **Verify:**
   - [ ] testdel disappears from kids list
   - [ ] Success message: "All data deleted" or similar
   - [ ] No errors in console
7. **Verify in Supabase (check each table):**
   - [ ] `kids`: no row with username = "testdel"
   - [ ] `care_sessions`: no sessions with testdel's UUID
   - [ ] `action_log`: no entries from testdel's sessions
   - [ ] `care_chain`: entries by testdel show `name = "A former keeper"` and `kid_id = null`
   - [ ] Tree that testdel cared for: chain still has the message text, just anonymized name
8. **Try to login as testdel:**
   - [ ] Login fails: "Wrong username or password"
   - [ ] No crash, no error about missing user

### Path 6: Anonymized Care Chain Displays Correctly
1. Find the tree that testdel previously cared for
2. Login as another kid (e.g., Alex) — system auto-assigns the tree
3. Login as Alex, go to Chain tab
4. **Verify:**
   - [ ] Anonymous entry shows: "A former keeper" (not "testdel" or "Test Delete")
   - [ ] Message text is still visible (the kind note)
   - [ ] Chain order is correct (anonymous entry in correct position)
   - [ ] No visual glitches (avatar/initials area shows "?" or generic icon)

### Path 7: Admin — Data Retention Cleanup
1. In admin panel, find "Clean Up Old Data" action (if implemented)
2. **Verify:**
   - [ ] Shows list of kids inactive for 365+ days (or configurable period)
   - [ ] Can select and anonymize/delete in bulk
   - [ ] Confirmation before action
   - [ ] Results displayed after completion

### Build Check
```bash
npm run build    # 0 errors
```

## GDPR/AADC Compliance Checklist

- [ ] **Lawful basis documented** — school provides legal basis (educational tool), documented in privacy notice
- [ ] **Data minimization** — only name, username, password hash, gameplay data stored. No email, phone, location, device ID
- [ ] **Privacy notice** — kid-friendly language, accessible from login and in-app
- [ ] **Transparency** — first-login notice explains what's stored and who can see it
- [ ] **Right to access** — admin can export all kid data as JSON
- [ ] **Right to erasure** — admin can delete all kid data, care chain anonymized
- [ ] **No profiling** — no analytics, no behavior tracking, no recommendations based on personal data
- [ ] **No nudge techniques** — no "are you sure?" when kid wants to stop, no guilt messages
- [ ] **High privacy by default** — minimal data collected, no optional data fields
- [ ] **No third-party data sharing** — no external scripts, no API calls except Supabase
- [ ] **Security headers** — nosniff, frame deny, no-referrer
- [ ] **Bcrypt passwords** — never stored in plain text
- [ ] **School-scoped data** — RLS ensures schools can't see each other's data
- [ ] **No IP logging** — check Supabase settings, disable if possible
- [ ] **Data retention** — admin can clean up old data, anonymization available
- [ ] **No console.log with PII** — audit all console statements

## Security Review (REVIEW stage)

### Full GDPR/AADC 16-Point Audit

Run through every point. Each must PASS:

```
 1. LAWFUL BASIS        — School provides legal basis. Documented in privacy notice?     [ ] PASS / FAIL
 2. DATA MINIMIZATION   — Only name, username, password hash, gameplay data.             [ ] PASS / FAIL
                          No email, phone, DOB, location, device ID, IP logged?
 3. PRIVACY NOTICE      — Kid-friendly language (age 7–11). Accessible from login?       [ ] PASS / FAIL
 4. TRANSPARENCY        — First-login awareness screen. Explains what & who?              [ ] PASS / FAIL
 5. RIGHT TO ACCESS     — Admin can export all kid data as JSON?                          [ ] PASS / FAIL
 6. RIGHT TO ERASURE    — Admin can delete kid, care chain anonymized?                    [ ] PASS / FAIL
 7. NO PROFILING        — No analytics, no behavior scoring, no recommendations?          [ ] PASS / FAIL
 8. NO NUDGE            — No "are you sure?" guilt, no dark patterns?                     [ ] PASS / FAIL
 9. HIGH PRIVACY DEFAULT— Minimal data, no optional tracking, no extras?                  [ ] PASS / FAIL
10. NO THIRD-PARTY      — No external scripts, ads, analytics, social media?              [ ] PASS / FAIL
11. SECURITY HEADERS    — X-Content-Type-Options, X-Frame-Options, Referrer-Policy?       [ ] PASS / FAIL
12. BCRYPT PASSWORDS    — Never stored plain. Hash starts with $2b$ or $2a$?              [ ] PASS / FAIL
13. SCHOOL SCOPING      — RLS prevents cross-school data access?                          [ ] PASS / FAIL
14. NO IP LOGGING       — Supabase request logs checked/disabled?                         [ ] PASS / FAIL
15. DATA RETENTION      — Admin can cleanup old data. Anonymization available?             [ ] PASS / FAIL
16. NO PII IN LOGS      — console.log audited. No names, passwords, IDs in output?        [ ] PASS / FAIL
```

### Adversarial Privacy Testing
- [ ] Delete kid Alex → try to login as Alex → fails ("Wrong username or password")
- [ ] Delete kid Alex → check care chain for Alex's tree → shows "A former keeper" (not "Alex Johnson")
- [ ] Delete kid Alex → check `care_sessions` → no sessions with Alex's kid_id remain
- [ ] Delete kid Alex → check `action_log` → no action logs from Alex's sessions remain
- [ ] Delete kid Alex → check `kids` table → no record with Alex's UUID exists
- [ ] Export kid data → verify JSON includes: kid profile, all sessions, all chain messages, all actions
- [ ] Export kid data → verify JSON does NOT include: password hash, other kids' data, admin data

### Third-Party Request Audit
Open browser DevTools → Network tab → reload app:
- [ ] Only requests to: your domain + Supabase (`*.supabase.co`) — nothing else
- [ ] No requests to: Google, Facebook, analytics services, CDNs (except Supabase)
- [ ] No cookies set (verify in Application → Cookies — should be empty)
- [ ] Only localStorage keys: `lg_kid_id`, `lg_school_id`, `lg_tree_id`, `lg_session_id` (and admin equivalents)

## Audit (AUDIT-CODE stage)

```bash
# PII in console output — EVERY hit must be reviewed and fixed
grep -rn "console\.\(log\|warn\|error\|info\|debug\)" src/ --include="*.jsx" --include="*.js"

# Third-party domains in code
grep -rn "google\|facebook\|analytics\|tracking\|pixel\|hotjar\|segment\|mixpanel\|amplitude" src/
# Should return 0 results

# Cookies
grep -rn "document\.cookie\|setCookie\|getCookie\|js-cookie\|cookie" src/
# Should return 0 results

# External script loading
grep -rn "<script.*src=\|import.*http\|fetch.*http\|axios.*http" src/ index.html
# Only allowed: Supabase SDK import (local node_modules)

# PII in error messages shown to users
grep -rn "showToast\|setToast\|setError\|setLoginError" src/ --include="*.jsx"
# Review each — no kid names, passwords, or internal IDs in user-facing messages

# localStorage — verify only expected keys
grep -rn "localStorage" src/ --include="*.jsx" --include="*.js"
# Expected keys only: lg_kid_id, lg_school_id, lg_tree_id, lg_session_id, lg_admin_id, lg_admin_school_id

# Supabase queries that might leak password hashes
grep -rn "select.*\*\|select()" src/db.js
# Review each — no select('*') that could return password_hash columns
# All queries should use explicit column lists: .select('id, name, username, ...')
```

## Production Readiness (PROD-READY stage)

### Full Privacy Journey — Test in Browser

**Journey 1: First-Time Consent**
1. Clear localStorage completely
2. Login as alex → first-login consent screen appears
3. Read privacy text — age-appropriate language?
4. Click "Read more about privacy" → opens `/privacy` page
5. Return to consent → click "I Understand — Let's Go!"
6. → Proceeds to app normally
7. Verify: `kids.privacy_accepted_at` is now set in Supabase
8. Logout → login again → consent screen does NOT appear (already accepted)

**Journey 2: Data Export**
1. Login as admin
2. Navigate to Kids → click "Export Data" for Alex
3. JSON file downloads
4. Open JSON → verify it contains:
   - `kid.name`: "Alex Johnson"
   - `kid.username`: "alex"
   - `kid.created_at`: timestamp
   - `care_sessions`: array of Alex's sessions
   - `care_chain_messages`: array of Alex's pass-on messages
   - `action_log`: array of all actions
5. Verify it does NOT contain:
   - `password_hash` (CRITICAL — must be excluded)
   - Other kids' data
   - Admin data

**Journey 3: Data Deletion**
1. Login as admin
2. Navigate to Kids → click "Delete All Data" for test kid "Diana"
3. Confirmation dialog shows:
   - Data to be deleted (account, sessions, actions)
   - Note about anonymization of care chain
4. Click "Delete Everything"
5. Diana disappears from kids list
6. Check in Supabase:
   - `kids`: no record for Diana
   - `care_sessions`: no sessions for Diana's UUID
   - `action_log`: no entries from Diana's sessions
   - `care_chain`: any entries by Diana now show name="A former keeper", kid_id=null
7. Try to login as Diana → "Wrong username or password"

**Journey 4: Privacy Page**
1. Navigate to `/privacy` directly
2. Page renders with kid-friendly text
3. All sections present: what we save, what we never do, who can see, how to delete
4. No broken links, no placeholder text

### Build Verification
```bash
npm run build           # 0 errors
npx vite preview        # Privacy page loads, consent flow works
```

## What This Phase Does NOT Do

- No automated data retention cron (manual admin action only)
- No cookie consent banner (we don't use cookies — localStorage only)
- No DPA (Data Processing Agreement) document (legal team responsibility, not code)
- No Vercel deployment (Phase 7)

## Dependencies

- Phase 1-5 MUST be complete (all data flows established before auditing them)
