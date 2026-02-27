# Session 2 Handoff — Frontend Testing & CDC Implementation

> Date: 2026-02-27 | Branch: `feature/frontend-curator-ui`

---

## What Was Done This Session

### 1. Built Pipeline Execution UI + Researcher Search (Phase 2 features)

**New pages:**
- `/pipeline` — CSV upload + "Run Full Pipeline" (OBJECT-1→5) + stage selector dropdown
- `/researchers` — Searchable, paginated researcher table (20/page, debounced search)
- `/researchers/[assetId]` — Detail view with primary/secondary ANZSRC codes, OECD crosswalk, constraints, timeline

**New backend route:**
- `foundry_3/foundry/api/routes/pipeline.py` — POST `/run`, POST `/run-with-upload`, GET `/status/{job_id}`

**New frontend files:**
- `src/lib/api/pipeline.ts` — Pipeline API client
- `src/lib/hooks/use-pipeline.ts` — Polling hook (2s interval)
- `src/lib/hooks/use-researchers.ts` — Supabase researcher queries
- `src/lib/hooks/use-debounce.ts` — 300ms debounce utility
- `src/lib/data/anzsrc-codes.ts` — 1,967 ANZSRC FoR codes (auto-generated from CSV)
- `src/components/pipeline/pipeline-stepper.tsx` — Animated stage progress
- `src/components/pipeline/stage-selector.tsx` — Stage checkbox dropdown

**Modified files:**
- `src/components/layout/sidebar.tsx` — Added Pipeline + Researchers nav items
- `src/lib/types/index.ts` — Added pipeline + researcher types
- Deleted `src/app/(app)/upload/page.tsx` (replaced by Pipeline page)

### 2. Fixed Multiple Bugs Found During Testing

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `LoadingSkeleton` import error | Export name was `TableSkeleton` | Changed import |
| Confidence chart empty | API returns `calibration` field, chart read `confidence_bands` | Read both fields in `confidence-chart.tsx` |
| Duplicate key React warning | `CodeList` used `key={code}`, codes can repeat | Changed to `key={${code}-${i}}` |
| **Objects as React child crash** | `standard_b_codes` stores OECD objects `{oecd_code, oecd_name, ...}` not strings | Added `extractCodeAndName()` in `code-list.tsx` |
| Missing ANZSRC/OECD code names | Only raw codes shown, no descriptions | Added lookup from `anzsrc-codes.ts` + OECD `oecd_name` field |
| Only 3 primary codes in Supabase | `classification_engine.py` line 1349 filtered `tier == "primary"` only | Fixed to `tier in ("primary", "secondary")` |

### 3. Backfilled Supabase from Neo4j

All 191 researchers updated with full 8 codes (3 primary + 5 secondary) in Supabase's `object_classifications.primary_codes` column. Verified: `researcher:a_baldelli_at_uq_edu_au` has 8 codes.

### 4. Implemented CDC (Change Data Capture)

**New file:** `foundry_3/foundry/core/projections.py`
- `sync_classification_projection()` — reads current state from Neo4j (source of truth) and upserts to Supabase
- Queries both ANZSRC (primary + secondary) and OECD crosswalk from graph
- Batched Supabase upserts (100 rows) via thread pool
- Emits `cdc_projection_synced` signal for observability

**Modified:** `foundry_3/foundry/object/researchers/classification_engine.py` (Pass 8)
- Replaced direct `_store_postgres(results, ...)` with CDC-based `sync_classification_projection(asset_ids, ...)`
- Supabase is now always derived from Neo4j, never from stale in-memory state
- GOVERN-3 refabrication flows through same OBJECT-3 pipeline, so automatically covered

---

## Current Testing Status

### Testing Against `Frontend_Architecture_Handoff.md`

**How to start services:**
```bash
# Terminal 1 — Backend
cd "/Users/Apple/Documents/Saltbush/Clasification Foundry/foundry_3"
source .venv/bin/activate
uvicorn foundry.api.app:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd "/Users/Apple/Documents/Saltbush/Clasification Foundry/frontend"
npm run dev
# Open http://localhost:3000
```

### PASSED Tests

| # | Test | Status |
|---|------|--------|
| 1 | Frontend builds (`npm run build`) | PASSED |
| 2 | Backend starts (uvicorn, use `.venv` not system Python) | PASSED |
| 3 | Dashboard loads — queue distribution chart | PASSED |
| 4 | Dashboard loads — confidence distribution chart | PASSED (after fix) |
| 5 | Queue page — tabs (All, Pending, Auto-approved, Rejected) | PASSED |
| 6 | Queue page — click row in Auto-approved tab | PASSED (after object rendering fix) |
| 7 | Researcher detail — ANZSRC codes with names display | PASSED |
| 8 | Researcher detail — OECD crosswalk codes with names display | PASSED |
| 9 | Researcher detail — all 8 codes showing (3 primary + 5 secondary) | PASSED (after backfill) |
| 10 | Researchers page — search + pagination loads | PASSED |

### REMAINING Tests (Where to Resume)

| # | Test | Page | What to Check |
|---|------|------|---------------|
| 11 | **Queue: Pending tab** | `/queue` → Pending tab | Click a pending researcher, verify review detail loads with codes, confidence, assessment flags |
| 12 | **Queue: Approve action** | `/queue/[assetId]` | Click Approve on a pending item → should POST to FastAPI → status changes to `curator_approved` |
| 13 | **Queue: Reject action** | `/queue/[assetId]` | Click Reject → rejection modal opens → fill in type + notes → confirm → status changes to `rejected` |
| 14 | **Queue: Rejection modal fields** | `/queue/[assetId]` | Verify rejection type radio (reclassify/refabricate/reingest), required notes field, optional correct codes input, quality scores |
| 15 | **Researcher detail page** | `/researchers/[assetId]` | Click any researcher from list → verify all sections: primary codes, secondary codes, OECD crosswalk, constraint flags, assessment flags, timeline, Langfuse trace link |
| 16 | **Pipeline: CSV upload** | `/pipeline` | Drag-drop or select a CSV → preview table shows → click "Run Full Pipeline" → stepper animates through stages |
| 17 | **Pipeline: Run without upload** | `/pipeline` | Use the "Run Stages Without Upload" card → select stages → click Run → stepper shows progress |
| 18 | **Pipeline: Stage selector** | `/pipeline` | Open stage dropdown → check/uncheck individual stages → verify correct stages are sent to API |
| 19 | **Governance: Alerts page** | `/governance` | Verify alerts load, severity badges display, acknowledge button works |
| 20 | **Governance: SLA page** | `/governance/sla` | Verify SLA metrics load and display |
| 21 | **Dashboard: Queue stats match API** | `/dashboard` | Compare numbers on dashboard with `GET /api/v1/health/queue-stats` response |
| 22 | **Auth: Login flow** | `/login` | Test Supabase email/password login (if auth is configured) |
| 23 | **Sidebar navigation** | All pages | Verify all nav items work: Dashboard, Queue, Researchers, Pipeline, Governance, Quality |

### Priority for Next Session

**Start with tests 11-14** (curator approve/reject workflow) — this is the core MVP functionality per the handoff doc. The 2 pending researchers need to be reviewable.

Then test 15-18 (researcher detail + pipeline), then 19-23 (governance + misc).

---

## Key Files Reference

### Frontend (in `frontend/src/`)
```
app/(app)/pipeline/page.tsx          — Pipeline execution page
app/(app)/researchers/page.tsx       — Researcher list/search
app/(app)/researchers/[assetId]/page.tsx — Researcher detail
app/(app)/queue/[assetId]/page.tsx   — Queue review detail (approve/reject)
components/review/code-list.tsx      — Renders ANZSRC + OECD code badges
components/dashboard/confidence-chart.tsx — Confidence distribution chart
components/pipeline/pipeline-stepper.tsx — Stage progress animation
components/pipeline/stage-selector.tsx   — Stage checkbox dropdown
lib/data/anzsrc-codes.ts            — 1,967 ANZSRC FoR codes
lib/hooks/use-researchers.ts        — Supabase researcher queries
lib/hooks/use-pipeline.ts           — Pipeline polling hook
lib/api/pipeline.ts                 — Pipeline API client
```

### Backend (in `foundry_3/foundry/`)
```
core/projections.py                  — CDC: Neo4j → Supabase projection sync (NEW)
api/routes/pipeline.py               — Pipeline orchestration endpoint (NEW)
object/researchers/classification_engine.py — Fixed: writes all 8 codes + uses CDC
```

---

## Known Issues / Gotchas

1. **Use `.venv` not `venv`** for the backend virtualenv
2. **System Python 3.14 breaks Langfuse** — always activate `.venv` first
3. **`standard_b_codes` contains objects** — any component rendering OECD codes must handle `{oecd_code, oecd_name, ...}` objects, not plain strings
4. **`_store_postgres` is now CDC-based** — the old direct in-memory projection function still exists in classification_engine.py but is no longer called. Can be cleaned up.
