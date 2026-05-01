# Phase 7 Prompt — Vercel Deployment & Production Readiness

Copy-paste this for the session:

---

WORKFLOW: Phase 7 — Vercel Deployment
Follow all stages below. Present the PLAN to the user for approval before building.

━━━━━━━━━━━━━━━━━━━━━━
WORKFLOW: Phase 7 — Vercel Deployment
[ ] PLAN — Pre-built below, present to user for approval
[ ] CONFIGURE — Update vite.config.js, remove GitHub Pages config, fix asset paths
[ ] VERCEL-SETUP — Connect repo to Vercel, set environment variables
[ ] ENV-VARS — Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel
[ ] BUILD-TEST — Run production build locally, verify no errors
[ ] DEPLOY — Deploy to Vercel, verify preview URL works
[ ] ROUTING — Verify SPA routing works (/admin, /privacy, deep links, refresh on any page)
[ ] REMOVE-GHPAGES — Remove GitHub Pages workflow
[ ] TEST — Kid login, admin login, tree care actions, care chain display on live URL
[ ] DEBUG — Check Vercel function logs, Supabase connection from Vercel domain, CORS
[ ] REVIEW — Security: env vars not exposed in source, headers applied, no mixed content, HTTPS only
[ ] AUDIT — Lighthouse audit (performance, accessibility, best practices), final grep sweep
[ ] PROD-READY — Full end-to-end smoke test on production URL: kid + admin + privacy + pass-on
[ ] PRODUCTION — Promote to production, share URL with user
[ ] PUSH — Final commit and push
━━━━━━━━━━━━━━━━━━━━━━

## Project Context

The app is currently deployed on GitHub Pages at `omegalifeuk.github.io/Legacy-Grove/`. We're moving to Vercel for proper SPA routing support (React Router), environment variable management, and faster builds. The domain will be a Vercel default URL for now, with a custom domain later.

**Tech stack:** Vite + React (JSX) · Supabase · react-router-dom · Vercel
**Repo:** `github.com/OmegaLifeUK/Legacy-Grove`
**Current base:** `/Legacy-Grove/` (GitHub Pages subdirectory)
**Target base:** `/` (Vercel root domain)

## What Exists After Phase 1-6

┌────────────────────────────────┬──────────┬───────────────────────────────────────────────────────────────┐
│ Component                      │ Status   │ Notes                                                         │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ vite.config.js                 │ EXISTS   │ base: "/Legacy-Grove/" — MUST change to "/" for Vercel.       │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ .github/workflows/deploy.yml  │ EXISTS   │ GitHub Pages deploy workflow. MUST be removed.                │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ index.html                     │ EXISTS   │ Favicon href uses "/Legacy-Grove/logo.png" — MUST update.    │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ React Router                   │ EXISTS   │ Routes: /, /admin/*, /privacy. Need SPA fallback on Vercel.  │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ .env                           │ EXISTS   │ Local env file with Supabase credentials. NOT committed.      │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ .env.example                   │ EXISTS   │ Template showing required variables.                          │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ .nojekyll                      │ EXISTS   │ GitHub Pages artifact. Can keep or remove (harmless).         │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ public/logo.png                │ EXISTS   │ Logo with transparent background.                             │
├────────────────────────────────┼──────────┼───────────────────────────────────────────────────────────────┤
│ package.json                   │ EXISTS   │ Vite build script. No changes needed.                         │
└────────────────────────────────┴──────────┴───────────────────────────────────────────────────────────────┘

## Step-by-Step Implementation

### Step 1: Update vite.config.js

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",  // Changed from "/Legacy-Grove/"
});
```

### Step 2: Fix Asset Paths

Update `index.html`:
```html
<!-- Change from -->
<link rel="icon" type="image/png" href="/Legacy-Grove/logo.png" />
<!-- Change to -->
<link rel="icon" type="image/png" href="/logo.png" />
```

The logo import in App.jsx (`import logoImg from "/logo.png"`) should work fine with Vite — it resolves relative to base.

### Step 3: Add Vercel SPA Rewrite

Create `vercel.json` in project root:
```json
{
  "rewrites": [
    { "source": "/((?!assets|logo\\.png|favicon\\.ico).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "no-referrer" }
      ]
    }
  ]
}
```

This ensures:
- All non-asset routes fall through to `index.html` (SPA routing)
- Security headers from Phase 6 are set at the edge
- Static assets (JS, CSS, images) are served directly

### Step 4: Connect to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel@latest

# Link repo to Vercel
vercel link

# Set environment variables
vercel env add VITE_SUPABASE_URL        # paste your Supabase URL
vercel env add VITE_SUPABASE_ANON_KEY   # paste your anon key
```

Or via Vercel dashboard:
1. Go to vercel.com → New Project
2. Import `OmegaLifeUK/Legacy-Grove` from GitHub
3. Framework Preset: Vite
4. Build Command: `npm run build` (auto-detected)
5. Output Directory: `dist` (auto-detected)
6. Environment Variables → Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
7. Deploy

### Step 5: Remove GitHub Pages Workflow

Delete `.github/workflows/deploy.yml` — no longer needed.

Optionally delete `.nojekyll` — it's a GitHub Pages artifact.

### Step 6: Verify Build

```bash
# Local production build
npm run build

# Preview locally
npx vite preview

# Verify:
# - App loads at http://localhost:4173/
# - Logo shows correctly
# - Login works
# - /admin route works
# - /privacy route works
# - Refresh on /admin doesn't 404 (SPA routing)
```

### Step 7: Deploy & Smoke Test

After Vercel deploys, test on the preview URL:

**Kid flow:**
- [ ] Visit root URL → login screen
- [ ] Login as alex / tree123 / OMEGA2026 → success
- [ ] See waiting screen or tree dashboard
- [ ] If tree auto-assigned: stats display correctly, actions work
- [ ] Logo displays in header and start screen
- [ ] Favicon shows in browser tab

**Admin flow:**
- [ ] Visit /admin → admin login screen
- [ ] Login as admin@omegalife.uk / admin123 → dashboard
- [ ] Kids list loads correctly
- [ ] Trees list loads correctly (shows pool status: Available/Assigned/Dead)

**Routing:**
- [ ] Direct link to /admin → admin login (not 404)
- [ ] Direct link to /privacy → privacy page (not 404)
- [ ] Browser refresh on any page → stays on that page (not 404)
- [ ] Browser back/forward buttons work

**Security:**
- [ ] Response headers include X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- [ ] No Supabase credentials visible in page source (they're in env vars, bundled at build time — this is expected for anon key, but verify no service_role key is exposed)
- [ ] Console has no errors

### Step 8: Production Deployment

```bash
vercel --prod
```

Or promote the preview deployment to production via Vercel dashboard.

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `vite.config.js` | MODIFY | Change base from "/Legacy-Grove/" to "/" |
| `index.html` | MODIFY | Fix favicon path to "/logo.png" |
| `vercel.json` | CREATE | SPA rewrites + security headers |
| `.github/workflows/deploy.yml` | DELETE | Remove GitHub Pages deployment |

## Environment Variables in Vercel

| Variable | Environment | Description |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | Production, Preview, Development | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Production, Preview, Development | Supabase anonymous/public key |

**NOTE:** `VITE_` prefix is required for Vite to expose these to the frontend bundle. The anon key is safe to expose (it's a public key). The service_role key must NEVER be in frontend code.

## Domain Setup (Later)

When ready to connect a custom domain:
1. Go to Vercel dashboard → Project → Settings → Domains
2. Add domain (e.g., `legacygrove.omegalife.uk`)
3. Update DNS records as Vercel instructs (CNAME or A record)
4. Vercel auto-provisions SSL certificate
5. Update Supabase → Auth → URL Configuration if using Supabase Auth (not currently)

## Rollback Plan

If Vercel deployment has issues:
- GitHub Pages deployment is still configured (workflow still in `.github/workflows/`)
- Revert vite.config.js base back to "/Legacy-Grove/"
- Push → GitHub Pages deploys automatically
- Only delete the workflow AFTER verifying Vercel works perfectly

## TEST SCRIPT (TEST stage)

Open the Vercel **preview URL** in a fresh browser (incognito). Every checkbox must pass before moving to REVIEW.

### Path 1 — Kid Login & Tree Dashboard on Vercel (3 min)

1. [ ] Open the preview URL → login screen renders, logo is visible at top
2. [ ] Favicon displays in the browser tab (Legacy Grove tree icon)
3. [ ] Enter school code `OMEGA2026`, username `alex`, password `tree123` → click **Login**
4. [ ] Login succeeds → either tree auto-assigned (dashboard) or "No Trees Available" waiting screen
5. [ ] If waiting screen: confirm message says something like "A tree will be ready for you soon!" and no console errors
6. [ ] If tree dashboard: confirm tree visual renders, stat bars (water, nutrients, sunlight, health) display with values
7. [ ] Tap **Water** → stat bar moves up, toast/feedback appears
8. [ ] Tap **Feed**, **Prune** → each action registers (stat changes, no errors)
9. [ ] Navigate between all bottom tabs (Home / Care / Missions / Chain) → each screen renders without blank pages
10. [ ] Click **Logout** → returns to login screen, localStorage cleared

### Path 2 — Admin Dashboard on Vercel (3 min)

11. [ ] Navigate to `<preview-url>/admin` → admin login form appears
12. [ ] Enter `admin@omegalife.uk` / `admin123` → click **Login** → dashboard loads
13. [ ] Dashboard shows summary stats (total kids, total trees, active sessions)
14. [ ] Click **Kids** tab → list of kids loads from Supabase (at least seed data visible)
15. [ ] Click **Trees** tab → list of trees loads with status column (Available / Active / Dead)
16. [ ] Create a new tree → appears in pool with status Available
17. [ ] Verify trees show correct status (Available / Assigned / Dead) — no manual assign/unassign buttons
18. [ ] Click **Logout** → returns to admin login screen

### Path 3 — SPA Routing & Deep Links (2 min)

19. [ ] Type `<preview-url>/admin` directly in the address bar → admin login screen loads (NOT a 404 or blank page)
20. [ ] Type `<preview-url>/privacy` directly in the address bar → privacy page loads with full text
21. [ ] Login to admin dashboard → navigate to Kids page → press **F5** (browser refresh) → stays on Kids page, does not 404
22. [ ] Login to kid app → press **F5** on tree dashboard → stays on dashboard, session restored
23. [ ] Press browser **Back** button → navigates to previous screen correctly
24. [ ] Press browser **Forward** button → returns to where you were
25. [ ] Type `<preview-url>/nonexistent-route` → shows kid login (fallback) or a custom 404, does NOT show Vercel's default error

### Path 4 — Privacy Page & Consent Flow (2 min)

26. [ ] Navigate to `<preview-url>/privacy` → privacy notice loads with all sections (what we collect, why, how long, your rights)
27. [ ] Open DevTools → Application → Local Storage → clear all `lg_*` keys
28. [ ] Navigate to root URL → login → after login, consent screen appears before the app
29. [ ] Read consent text → click **I Agree** → proceeds to the app
30. [ ] Refresh → consent is NOT asked again (stored in localStorage)

### Path 5 — Mobile Responsiveness (2 min)

31. [ ] Open preview URL on a real phone OR DevTools → Toggle Device Toolbar → select iPhone 12
32. [ ] Login screen: inputs are large enough to tap, keyboard doesn't cover the login button
33. [ ] Tree dashboard: tree visual, stat bars, and action buttons fit within 420px width without horizontal scroll
34. [ ] Bottom navigation tabs are large enough to tap without misclicks
35. [ ] Admin dashboard: table renders at tablet width (768px) — columns may shrink but data is readable
36. [ ] Admin dashboard on phone (375px): acceptable if it shows a "use a tablet or desktop" message, OR renders with scrollable table

### Path 6 — Cross-Browser Spot Check (2 min)

37. [ ] **Chrome**: login → tree dashboard → one action → logout → confirm works
38. [ ] **Safari**: login → tree dashboard → one action → logout → confirm works
39. [ ] **Firefox** (if available): login → tree dashboard → one action → logout → confirm works

### Path 7 — Network & Console Health (2 min)

40. [ ] Open DevTools → Console → reload page → **zero errors** (warnings acceptable if from third-party)
41. [ ] Open DevTools → Network → filter by "Error" → **zero failed requests**
42. [ ] Perform a kid login → watch Network tab → Supabase requests succeed (200/201 status codes)
43. [ ] Perform an admin login → watch Network tab → Supabase requests succeed
44. [ ] Throttle to "Slow 3G" → app still loads (may be slow but no crashes or blank screens)

**All 44 checks must pass. If any fail, fix and re-test that path before proceeding to REVIEW.**

---

## Security Review (REVIEW stage)

### Environment Variable Security
- [ ] View page source on live URL → search for Supabase URL → present (expected, it's in the bundle)
- [ ] View page source → search for `service_role` → NOT present (CRITICAL)
- [ ] View page source → search for any other API keys → none found
- [ ] Vercel dashboard → Environment Variables → verify only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set
- [ ] No `.env` file deployed (Vercel uses its own env var system)

### HTTPS & Headers
- [ ] Site loads on HTTPS only (HTTP redirects to HTTPS — Vercel does this automatically)
- [ ] No mixed content warnings (all resources loaded over HTTPS)
- [ ] Check response headers (DevTools → Network → click request → Headers):
  - `X-Content-Type-Options: nosniff` ✓
  - `X-Frame-Options: DENY` ✓
  - `Referrer-Policy: no-referrer` ✓
  - `Strict-Transport-Security` present (Vercel adds this automatically) ✓

### CORS / Supabase Connection
- [ ] Supabase calls work from Vercel domain (no CORS errors in console)
- [ ] If CORS errors: add Vercel domain to Supabase → Settings → API → Additional Redirect URLs
- [ ] No failed network requests in console (check Network tab filtered by "Error")

### Source Map Exposure
- [ ] Source maps NOT deployed to production (Vite default: no source maps in production build)
- [ ] Verify: no `.map` files accessible at `/assets/*.js.map` (should 404)

## Audit (AUDIT stage)

### Lighthouse Audit
Run Lighthouse in Chrome DevTools (Performance, Accessibility, Best Practices, SEO):

```
Target scores (mobile):
  Performance:    > 80
  Accessibility:  > 90
  Best Practices: > 90
  SEO:            > 80
```

Fix any critical findings:
- [ ] Accessibility: all images have alt text
- [ ] Accessibility: color contrast ratios meet WCAG AA (important for kids' app)
- [ ] Accessibility: form inputs have labels
- [ ] Best Practices: no console errors in production
- [ ] Performance: bundle size reasonable (< 500KB gzipped)

### Final Grep Sweep
```bash
# Any TODO/FIXME/HACK left in code
grep -rn "TODO\|FIXME\|HACK\|TEMP\|XXX\|WORKAROUND" src/ --include="*.jsx" --include="*.js"
# Review each — remove or document

# Any demo/test code left
grep -rn "demo\|test.*mode\|mock\|fake\|dummy\|localhost" src/ --include="*.jsx" --include="*.js"
# Remove any test/demo code

# Any console.log left (should be 0 in production code)
grep -rn "console\.\(log\|warn\|info\|debug\)" src/ --include="*.jsx" --include="*.js"
# Remove all except console.error for genuine error handling

# Hardcoded URLs
grep -rn "http://\|localhost\|127\.0\.0\.1\|github\.io" src/ --include="*.jsx" --include="*.js"
# Should return 0 results (all URLs from env vars)

# Check vercel.json is valid
cat vercel.json | python3 -m json.tool
# Should parse without errors
```

## Production Readiness (PROD-READY stage)

### Full End-to-End Smoke Test on Production URL

Run ALL of these on the actual production Vercel URL (not localhost):

**1. Kid App — Login & Tree Care (5 min)**
- [ ] Open production URL → login screen loads with logo
- [ ] Login as alex / tree123 / OMEGA2026 → success
- [ ] See tree dashboard or waiting screen
- [ ] If tree auto-assigned: water → stat bar moves up → toast appears
- [ ] Feed, prune, add birdhouse → all actions work
- [ ] Navigate: Home → Care → Missions → Chain → all tabs render
- [ ] Complete a mission → stat boost applies
- [ ] Logo in header and favicon in browser tab display correctly

**2. Admin Dashboard (5 min)**
- [ ] Navigate to /admin → admin login screen
- [ ] Login as admin@omegalife.uk / admin123 → dashboard
- [ ] Dashboard stats display correctly
- [ ] Kids page: list loads, can see all kids
- [ ] Trees page: list loads, statuses correct
- [ ] Create a new tree → appears in list
- [ ] Create a new tree → appears in pool as "Available"
- [ ] Trees show which kid they're assigned to (auto-assigned, not manual)

**3. Privacy & Consent (2 min)**
- [ ] Navigate to /privacy → privacy page loads with full text
- [ ] Clear localStorage → login → consent screen appears first
- [ ] Accept consent → proceeds to app

**4. Routing (2 min)**
- [ ] Navigate to /admin/kids directly → login screen (if not logged in) or kids page
- [ ] Refresh browser on /admin → stays on admin (doesn't 404)
- [ ] Refresh browser on /privacy → stays on privacy page
- [ ] Browser back/forward buttons work correctly
- [ ] Navigate to /nonexistent → shows kid app (fallback route) or 404 page

**5. Mobile Test (2 min)**
- [ ] Open production URL on phone (or DevTools mobile emulation)
- [ ] Login screen is usable (inputs large enough, button tappable)
- [ ] Dashboard renders correctly at mobile width (420px max)
- [ ] Navigation tabs are tappable
- [ ] Admin dashboard usable on tablet (may not work perfectly on phone — acceptable)

**6. Cross-Browser (2 min)**
- [ ] Test on Chrome → works
- [ ] Test on Safari → works
- [ ] Test on Firefox → works (if available)

### Post-Deployment Checklist

- [ ] Vercel production URL loads the app
- [ ] All routes work (/, /admin, /privacy)
- [ ] SPA routing works (refresh doesn't 404 on any page)
- [ ] Supabase connection works from Vercel domain (login succeeds)
- [ ] Logo and favicon display correctly
- [ ] Security headers present in response
- [ ] No console errors in production
- [ ] No source maps exposed
- [ ] GitHub Pages workflow deleted
- [ ] Lighthouse scores meet targets
- [ ] Mobile rendering acceptable
- [ ] Production URL ready to share with teacher

## What This Phase Completes

This is the final phase. After this:
- App is live on Vercel at a production URL
- Kids can log in and care for trees (real 24-hour days)
- Teachers can manage kids and create trees via admin dashboard (assignment is automatic)
- Data is stored in Supabase with proper RLS
- GDPR-compliant privacy notice and data management tools are in place
- Security headers and best practices applied
- Ready for the teacher to distribute the link/QR to students

## Dependencies

- ALL previous phases (1-6) MUST be complete
- User must have a Vercel account (free tier is fine)
- GitHub repo must be accessible to Vercel for auto-deploy
