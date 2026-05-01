# Legacy Grove — Implementation Phases

## Overview

7 phases to take Legacy Grove from a static demo to a production app with persistent database, authentication, admin dashboard, and GDPR compliance.

## Phase Order & Dependencies

```
Phase 1: Supabase Setup ──────────────────────────── (no dependencies)
    ↓
Phase 2: Kid Auth ────────────────────────────────── (requires Phase 1)
    ↓
Phase 3: Real Calendar Days ──────────────────────── (requires Phase 1, 2)
    ↓
Phase 4: Admin Dashboard ────────────────────────── (requires Phase 1, 2, 3)
    ↓
Phase 5: Tree Assignment Flow ───────────────────── (requires Phase 1, 2, 3, 4)
    ↓
Phase 6: GDPR / AADC Compliance ─────────────────── (requires Phase 1–5)
    ↓
Phase 7: Vercel Deployment ──────────────────────── (requires Phase 1–6)
```

## Phase Files

| Phase | File | Estimated Time | Description |
|-------|------|----------------|-------------|
| 1 | [phase-1-supabase-setup.md](phase-1-supabase-setup.md) | 2–3 hours | Database schema, RLS policies, seed data, db.js layer |
| 2 | [phase-2-kid-auth.md](phase-2-kid-auth.md) | 2–3 hours | Kid login (school code + username + password), session persistence |
| 3 | [phase-3-real-calendar-days.md](phase-3-real-calendar-days.md) | 2–3 hours | Replace 30s demo tick with real 24-hour day cycle |
| 4 | [phase-4-admin-dashboard.md](phase-4-admin-dashboard.md) | 3–5 hours | Teacher panel: manage kids, tree pool, stats (no manual assignment) |
| 5 | [phase-5-tree-assignment-flow.md](phase-5-tree-assignment-flow.md) | 3–4 hours | Random auto-assignment, kid receives/passes-on, full lifecycle |
| 6 | [phase-6-gdpr-compliance.md](phase-6-gdpr-compliance.md) | 2–3 hours | Privacy notice, consent flow, data export/deletion |
| 7 | [phase-7-vercel-deployment.md](phase-7-vercel-deployment.md) | 1–2 hours | Move from GitHub Pages to Vercel, production deploy |

**Total estimated time: 16–24 hours**

## How to Use

1. Open a new Claude Code session
2. Copy-paste the phase prompt from the relevant file
3. Follow the workflow stages in order
4. Complete all verification checklist items before moving to the next phase

## Prerequisites

Before starting Phase 1:
- Supabase account with a new project created
- Supabase Project URL and anon key ready
- School name confirmed (default: "Omega Life School")
