# Foundry Researcher Instance — Production Readiness Runbook v1.1

**Purpose:** Execute these tasks — in order — to take the FAT Researcher instance from "functionally complete" to "production-grade validated". Every task has a gate. Do not skip ahead.
**Authored:** 2026-02-24
**Revised:** 2026-02-25 (v1.1 — code review corrections)
**Execute:** Tasks 1-3 are a single session (~half day). Task 4 is a full pipeline re-run + production baseline (~half day). Task 5 updates project memory.
**Convention:** All code follows `CLAUDE.md` hard rules. No `print()`, async everywhere, signals via `SignalEmitter`.

---

## Changes from v1.0

| Item | v1.0 Claim | Actual State | Impact |
|------|-----------|--------------|--------|
| CRE Constraints | "Only CF1 + CF5 implemented, 9 deferred" | **All 11 fully implemented** — `_DEFERRED` list is empty, all registered in `__init__.py` | Task 5 (1 week) deleted, Task 6 merged into Task 4 |
| Pipeline orchestrator | `python -m scripts.run_pipeline --full` | `--full` flag does not exist — use `--object --govern` | Option A command corrected |
| Scopus line numbers | `scopus.py:182-225` | `scopus.py:231-273` (shifted ~50 lines) | Documentation only |
| OpenAlex line count | 214 lines | 213 lines | Documentation only |
| CSV names | CF2 "Temporal Relevance", CF3 "Geographic Context", etc. | CF2 "Scale", CF3 "Equipment", CF4 "Temporal", etc. | Constraint names corrected in context table |

---

## Context: What's Already Done

The researcher instance has code written for all 13 workflows. The code review (2026-02-25) confirmed:

| Layer | Workflows | Code Status | Data Status |
|-------|-----------|-------------|-------------|
| SYSTEM 1-2 | Domain Hub, Constraints | Production-grade | Run, verified |
| INSTANCE 1-2 | Standards, Crosswalk | Production-grade | Run, verified (2203 standards, 1032+2321 crosswalks) |
| OBJECT 1-5 | Ingest → Sync | Production-grade | Run, verified (191 researchers, 164 active, 27 pending) |
| GOVERN 1-4 | Scan, Severity, Refab, Registry | Production-grade (2,843 LOC) | **Written, never tested against live DBs** |
| Feedback | Processor, Aggregation, Exemplars, Disambiguation, Evaluation | Production-grade | **Written, never tested against live DBs** |
| API | Health, Curator, Governance (13 endpoints) | Production-grade | **Untested end-to-end** |
| CRE | **All 11 families** (CF1-CF10, CF12) | Production-grade | All evaluators active in OBJECT-3 Pass 6 |

### Adapter improvements — already implemented

MEMORY.md lists these as "planned" but the code review confirmed they are **done**:

- Scopus `_fetch_publications()` — done (`foundry/object/researchers/adapters/scopus.py:231-273`, fetches top 50 pubs)
- ORCID pub cap raised to 200 — done (`orcid.py:23`, `MAX_ORCID_PUBLICATIONS = 200`)
- ORCID group-level DOI extraction + normalization — done (`orcid.py:139`, `orcid.py:92-101`)
- OpenAlex adapter — done (`openalex.py`, 213 lines, full implementation with author lookup, works, topics, affiliations, abstract reconstruction)
- All 7 adapters registered in `foundry/object/researchers/adapters/__init__.py` (ORCID, Scopus, Scholar, Patents, University, OpenAlex, BraveProfile)

### CRE Constraints — all 11 active

v1.0 incorrectly stated only CF1 and CF5 were implemented. All 11 are live:

| Family | File | Gate Mode | Status |
|--------|------|-----------|--------|
| CF1 | `cf1_trl.py` | block | Implemented |
| CF2 | `cf2_scale.py` | penalise | Implemented |
| CF3 | `cf3_equipment.py` | penalise | Implemented |
| CF4 | `cf4_temporal.py` | penalise | Implemented |
| CF5 | `cf5_regulatory.py` | block | Implemented |
| CF6 | `cf6_geographic.py` | penalise | Implemented |
| CF7 | `cf7_ip.py` | penalise | Implemented |
| CF8 | `cf8_readiness.py` | penalise | Implemented |
| CF9 | `cf9_team.py` | penalise | Implemented |
| CF10 | `cf10_output.py` | penalise | Implemented |
| CF12 | `cf12_inference.py` | penalise | Implemented |

OBJECT-3 Pass 6 (`classification_engine.py:861-905`) calls `assess_entity()` which evaluates all 11. `_DEFERRED` list in `__init__.py` is empty.

### Entity-type namespace refactor

The codebase was refactored into entity-type namespaces. Correct paths:
- `foundry/object/researchers/` — O1, O2, O3 engines + adapters + models
- `foundry/object/` — O4 (routing_engine.py), O5 (sync_engine.py) remain here (domain-agnostic)
- `foundry/instance/researchers/` — standard_fabrication.py
- `foundry/instance/` — crosswalk_engine.py remains here (reusable)
- Adapters at `foundry/object/researchers/adapters/`
- Backward-compatible re-exports in `foundry/object/__init__.py` and `foundry/instance/__init__.py`

---

## Task 1: Validate GOVERN Engines (Dry-Run)

**Goal:** Confirm all 4 GOVERN engines execute without errors against live databases in dry-run mode.
**Time:** 1-2 hours
**Depends on:** Active venv, live Neo4j/Supabase/Qdrant connections

```bash
cd "/Users/wes.ward/Desktop/antigravity/Foundry 3"
source .venv/bin/activate
```

### 1a: GOVERN-1 Scan Engine

```bash
python -m foundry.govern.scan_engine dry-run
```

**Expected:** Summary showing scan candidates found (active FATObjects where `next_source_scan <= NOW()`), no DB writes. If no entities have `next_source_scan` set, the dry-run may return 0 candidates — that's OK for now (the field gets set on first real scan).

**Verify:** No errors, clean exit, signal emission logged.

### 1b: GOVERN-2 Severity Engine

```bash
python -m foundry.govern.severity_engine dry-run
```

**Expected:** Summary showing `change_detection_queue` depth. If Task 1a was dry-run only, the queue will be empty — expected. Confirm the engine starts, queries the queue, and exits cleanly.

### 1c: GOVERN-3 Refabrication Engine

```bash
python -m foundry.govern.refabrication_engine dry-run
```

**Expected:** Summary showing `refabrication_queue` depth (likely 0). Confirm clean start, query, exit.

### 1d: GOVERN-4 Registry Health

```bash
python -m foundry.govern.registry_engine dry-run
```

**Expected:** Full health snapshot printed to logs — freshness distribution, queue depths, pipeline metrics, threshold evaluations. This is the most informative dry-run because it reads from Neo4j and all queue tables. **Save this output** — it's the pre-re-run baseline.

### 1e: API Endpoints

```bash
# Start API in background
uvicorn foundry.api.app:app --host 0.0.0.0 --port 8000 &

# Test governance endpoints
curl -s http://localhost:8000/api/v1/governance/freshness | python -m json.tool
curl -s http://localhost:8000/api/v1/governance/queues | python -m json.tool
curl -s http://localhost:8000/api/v1/governance/sla | python -m json.tool
curl -s http://localhost:8000/api/v1/governance/alerts | python -m json.tool
curl -s http://localhost:8000/api/v1/governance/snapshot/latest | python -m json.tool

# Also test health + curator queue
curl -s http://localhost:8000/api/v1/health | python -m json.tool
curl -s http://localhost:8000/api/v1/health/queue-stats | python -m json.tool
curl -s http://localhost:8000/api/v1/health/classification-quality | python -m json.tool
curl -s "http://localhost:8000/api/v1/curator/queue?status=pending_review" | python -m json.tool

# Kill background uvicorn
kill %1
```

**Expected:** All endpoints return JSON without 500 errors. Some may return empty results if governance hasn't run in write mode yet — that's fine.

**Gate:** All 4 engines dry-run clean. All API endpoints return valid responses. Fix any errors before proceeding.

---

## Task 2: Run GOVERN-1 Live (Small Batch)

**Goal:** Execute a real GOVERN-1 scan against 5 active researchers to populate the change detection pipeline.
**Time:** 30-60 min (depends on adapter response times)
**Depends on:** Task 1 passed

```bash
python -m foundry.govern.scan_engine scan 5
```

**Expected:**
- 5 active FATObjects scanned via OBJECT-1 `maintenance_scan()`
- Neo4j ALM fields updated: `last_scanned_at`, `next_source_scan`, `source_freshness_score`
- Any detected changes queued to `change_detection_queue`
- Summary with scan counts and timing

### Then cascade through GOVERN-2 and GOVERN-3

```bash
# Classify severity of any detected changes
python -m foundry.govern.severity_engine run 10

# If any changes routed to refabrication queue
python -m foundry.govern.refabrication_engine run 5
```

**Note:** GOVERN-3 will call OBJECT-2 in refabrication mode and wait for the new version to reach `status='active'` (which requires OBJECT-3->4->5 to run). For this validation, if GOVERN-3 times out waiting, that's acceptable — it confirms the orchestration logic works. The timeout is 30 minutes.

### Capture health snapshot

```bash
python -m foundry.govern.registry_engine run
```

**Gate:** GOVERN-1 successfully scanned live entities. GOVERN-2 processed any detected changes. GOVERN-4 produced a health snapshot with real data. Fix any failures before proceeding.

---

## Task 3: Validate Feedback Loop

**Goal:** Confirm the feedback processor runs against existing curator decisions (if any) and writes downstream aggregations.
**Time:** 30 min
**Depends on:** Task 1 passed (can run in parallel with Task 2)

### 3a: Check for existing curator decisions

```bash
python -c "
from foundry.core.database import get_supabase
sb = get_supabase()
result = sb.table('validation_queue').select('status', count='exact').in_('status', ['curator_approved', 'curator_rejected']).execute()
print(f'Curator decisions: {result.count}')
result2 = sb.table('validation_queue').select('status', count='exact').eq('status', 'auto_approved').execute()
print(f'Auto-approved: {result2.count}')
"
```

If there are 0 curator decisions, the feedback processor will have nothing to process — that's expected. The 164 auto-approved items don't flow through the feedback loop (only curator decisions do).

### 3b: Run feedback processor (dry-run first)

```bash
python -m foundry.feedback.processor dry-run
python -m foundry.feedback.processor run
```

**Expected:** Processor reports watermark position, number of new decisions processed, aggregation writes (code_stats, calibration bands, adapter_quality). If 0 curator decisions exist, it will process 0 and exit cleanly.

**Gate:** Feedback processor runs without errors. If curator decisions exist, aggregations are written to Supabase and exemplars/disambiguation to Qdrant/Neo4j.

---

## Task 4: Full Pipeline Re-Run + Production Baseline (O1 -> O5)

**Goal:** Re-run the entire OBJECT pipeline for all 191 researchers with the improved adapters (Scopus publications, ORCID 200-cap, OpenAlex, group-level DOIs) and all 11 CRE constraints active. Capture the production baseline.
**Time:** 2-4 hours (191 researchers x 7 adapters + LLM calls)
**Depends on:** Tasks 1-3 passed

### Important: Both adapters AND constraints are already improved

The code already has:
- `scopus.py` — `_fetch_publications()` fetching top 50 publications with titles, DOIs, dates, citation counts
- `orcid.py` — 200-pub cap, group-level DOI extraction, DOI normalization
- `openalex.py` — full adapter with author lookup, works, topics, affiliations, abstract reconstruction
- All 11 CRE constraint evaluators active in OBJECT-3 Pass 6

These improvements have never been run against the full 191-researcher dataset. This re-run will produce richer ThinObjects -> richer FATObjects -> higher classification confidence with the full constraint battery.

### Execute

```bash
# Option A: Use the pipeline orchestrator
python scripts/run_pipeline.py --object --limit 191

# Option B: Run each stage manually for visibility (RECOMMENDED)
python -m foundry.object.researchers.ingestion_engine ingest 191
python -m foundry.object.researchers.fabrication_engine fabricate 191
python -m foundry.object.researchers.classification_engine classify 191
python -m foundry.object.routing_engine route 191
python -m foundry.object.sync_engine sync 200
```

**Note:** Option B is recommended for the first re-run — it gives visibility into each stage and lets you stop if something goes wrong.

### Measure results + capture production baseline

After the re-run, capture the production baseline:

```bash
python -c "
from foundry.core.database import get_supabase
sb = get_supabase()

# Auto-approve rate
total = sb.table('validation_queue').select('*', count='exact').execute()
auto = sb.table('validation_queue').select('*', count='exact').eq('status', 'auto_approved').execute()
pending = sb.table('validation_queue').select('*', count='exact').eq('status', 'pending_review').execute()
print(f'Total: {total.count}')
print(f'Auto-approved: {auto.count} ({auto.count/total.count*100:.1f}%)')
print(f'Pending review: {pending.count}')

# Confidence stats
from statistics import mean
rows = sb.table('object_classifications').select('final_confidence').execute()
confs = [r['final_confidence'] for r in rows.data]
print(f'Avg confidence: {mean(confs):.4f}')
print(f'Min: {min(confs):.4f}, Max: {max(confs):.4f}')
"
```

### Capture GOVERN-4 health snapshot + feedback baseline

```bash
# Run GOVERN-4 for definitive health snapshot
python -m foundry.govern.registry_engine run

# Run feedback processor
python -m foundry.feedback.processor run
```

### Record these metrics (the production baseline):

- Total researchers: ___
- Auto-approved: ___ (___%)
- Pending review: ___
- Avg confidence: ___
- Min/Max confidence: ___/___
- Constraints evaluated: 11/11
- GOVERN-4 health status: ___

**Target:** >90% auto-approve rate (was 85.9% with metrics-only Scopus, 50-cap ORCID, and only 2 active constraints).

**Gate:** Pipeline completes without errors for all 191 researchers. Auto-approve rate measured and recorded. GOVERN-4 health snapshot captured. If rate is still <90%, investigate which researchers are below threshold and why.

---

## Task 5: Update MEMORY.md

**Goal:** Bring the project memory up to date so future sessions start from accurate state.
**Time:** 30 min
**Depends on:** Task 4 passed

Update these sections in `/Users/wes.ward/.claude/projects/-Users-wes-ward-Desktop-antigravity-Foundry-3/memory/MEMORY.md`:

1. **File Structure** — update paths to reflect entity-type namespace refactor (`foundry/object/researchers/`, etc.)
2. **Current Data State** — update metrics from Task 4 production baseline
3. **PLANNED: Phase 1 Adapter Improvements** — mark as DONE (Scopus pubs, ORCID 200-cap, OpenAlex all implemented)
4. **Observability Implementation Phases** — update to reflect that GOVERN, feedback, and observability are implemented
5. **Constraint Families** — update to reflect all 11 are active (not just CF1 + CF5)
6. **Add section:** "GOVERN Layer — Validated" with dry-run and live-run results
7. **Remove stale entries** that reference old paths or planned work that's now complete

---

## Completion Criteria

All 5 tasks done means:

- [ ] GOVERN 1-4 validated (dry-run + small live batch)
- [ ] Feedback processor validated
- [ ] API endpoints returning valid responses
- [ ] Full pipeline re-run with improved adapters + all 11 constraints (production baseline)
- [ ] Auto-approve rate measured (target: >90%)
- [ ] GOVERN-4 health snapshot captured
- [ ] MEMORY.md updated to reflect current state

**After completion:** The FAT Researcher instance is production-grade. Next workstreams:
- Curator reviews of pending items (trace links available via API)
- Equipment instance (OBJECT-2/3 stubs need implementation)
- BMS Phase 1 (separate silo, independent workstream)
