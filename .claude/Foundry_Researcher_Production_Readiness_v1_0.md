# Foundry Researcher Instance — Production Readiness Runbook v1.0

**Purpose:** Execute these tasks — in order — to take the FAT Researcher instance from "functionally complete" to "production-grade validated". Every task has a gate. Do not skip ahead.
**Authored:** 2026-02-24
**Execute:** Tasks 1-3 are a single session (~half day). Task 4 is a full pipeline re-run (~half day). Task 5 is parallelizable constraint work (~1 week). Task 6 is the final re-run + baseline.
**Convention:** All code follows `CLAUDE.md` hard rules. No `print()`, async everywhere, signals via `SignalEmitter`.

---

## Context: What's Already Done

The researcher instance has code written for all 13 workflows. The explore audit (2026-02-24) confirmed:

| Layer | Workflows | Code Status | Data Status |
|-------|-----------|-------------|-------------|
| SYSTEM 1-2 | Domain Hub, Constraints | Production-grade | Run, verified |
| INSTANCE 1-2 | Standards, Crosswalk | Production-grade | Run, verified (2203 standards, 1032+2321 crosswalks) |
| OBJECT 1-5 | Ingest → Sync | Production-grade | Run, verified (191 researchers, 164 active, 27 pending) |
| GOVERN 1-4 | Scan, Severity, Refab, Registry | Production-grade | **Written, never tested against live DBs** |
| Feedback | Processor, Aggregation, Exemplars, Disambiguation, Evaluation | Production-grade | **Written, never tested against live DBs** |
| API | Health, Curator, Governance | Production-grade | **Untested end-to-end** |
| CRE | CF1 (TRL), CF5 (Regulatory) | Production-grade | 9 remaining constraints deferred (CF2-4, CF6-10, CF12) |

**Important correction:** MEMORY.md lists several adapter improvements as "planned". The audit found these are **already implemented**:
- Scopus `_fetch_publications()` — done (scopus.py:182-225)
- ORCID pub cap raised to 200 — done (orcid.py:23, `MAX_ORCID_PUBLICATIONS = 200`)
- ORCID group-level DOI extraction + normalization — done (orcid.py:139, orcid.py:99-101)
- OpenAlex adapter — done (openalex.py, 214 lines, full implementation)

**Also note:** The codebase was refactored into entity-type namespaces. Correct paths are now:
- `foundry/object/researchers/` (not `foundry/object/`)
- `foundry/instance/researchers/` (not `foundry/instance/`)
- Adapters at `foundry/object/researchers/adapters/`

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

### 1e: GOVERN-4 API Endpoints

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

**Note:** GOVERN-3 will call OBJECT-2 in refabrication mode and wait for the new version to reach `status='active'` (which requires OBJECT-3→4→5 to run). For this validation, if GOVERN-3 times out waiting, that's acceptable — it confirms the orchestration logic works. The timeout is 30 minutes.

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

## Task 4: Full Pipeline Re-Run (O1 → O5)

**Goal:** Re-run the entire OBJECT pipeline for all 191 researchers with the improved adapters (Scopus publications, ORCID 200-cap, OpenAlex, group-level DOIs). Compare auto-approve rate against the 85.9% baseline.
**Time:** 2-4 hours (191 researchers × 7 adapters + LLM calls)
**Depends on:** Tasks 1-3 passed

### Important: The adapters are already improved

The code already has:
- `scopus.py` — `_fetch_publications()` fetching top 50 publications with titles, DOIs, dates, citation counts
- `orcid.py` — 200-pub cap, group-level DOI extraction, DOI normalization
- `openalex.py` — full adapter with author lookup, works, topics, affiliations, abstract reconstruction

These improvements have never been run against the full 191-researcher dataset. This re-run will produce richer ThinObjects → richer FATObjects → higher classification confidence.

### Execute

```bash
# Option A: Use the pipeline orchestrator
python -m scripts.run_pipeline --full

# Option B: Run each stage manually for visibility
python -m foundry.object.researchers.ingestion_engine ingest 191
python -m foundry.object.researchers.fabrication_engine fabricate 191
python -m foundry.object.researchers.classification_engine classify 191
python -m foundry.object.routing_engine route 191
python -m foundry.object.sync_engine sync 200
```

**Note:** Option B is recommended for the first re-run — it gives visibility into each stage and lets you stop if something goes wrong.

### Measure results

After the re-run, capture the new baseline:

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

**Target:** >90% auto-approve rate (was 85.9% with metrics-only Scopus and 50-cap ORCID).

**Gate:** Pipeline completes without errors for all 191 researchers. Auto-approve rate measured and recorded. If rate is still <90%, investigate which researchers are below threshold and why.

---

## Task 5: Implement Remaining CRE Constraints

**Goal:** Build the 9 deferred constraint evaluators so OBJECT-3 uses the full constraint battery.
**Time:** ~1 week (parallelizable — each constraint is independent)
**Depends on:** Task 4 passed (so you have a baseline to measure improvement against)

The 9 deferred constraints are registered in `foundry/cre/constraints/__init__.py` but have no Python evaluators. OBJECT-3 currently skips them gracefully.

### Constraints to implement

Each constraint follows the pattern established by `cf1_trl.py` (115 lines) and `cf5_regulatory.py` (220 lines):

| Family | Name | Type | Reference CSV |
|--------|------|------|---------------|
| CF2 | Temporal Relevance | Penalising (×0.85) | `data/references/constraints/CF2_temporal_relevance_foundry3.csv` |
| CF3 | Geographic Context | Penalising (×0.85) | `data/references/constraints/CF3_geographic_context_foundry3.csv` |
| CF4 | Methodological Rigour | Penalising (×0.85) | `data/references/constraints/CF4_methodological_rigour_foundry3.csv` |
| CF6 | Institutional Context | Penalising (×0.85) | `data/references/constraints/CF6_institutional_context_foundry3.csv` |
| CF7 | Industry Alignment | Penalising (×0.85) | `data/references/constraints/CF7_industry_alignment_foundry3.csv` |
| CF8 | Cross-Disciplinary | Penalising (×0.85) | `data/references/constraints/CF8_cross_disciplinary_foundry3.csv` |
| CF9 | Data Provenance | Penalising (×0.85) | `data/references/constraints/CF9_data_provenance_foundry3.csv` |
| CF10 | Ethical Compliance | Penalising (×0.85) | `data/references/constraints/CF10_ethical_compliance_foundry3.csv` |
| CF12 | Scalability | Penalising (×0.85) | `data/references/constraints/CF12_scalability_foundry3.csv` |

### For each constraint:

1. Read the CSV to understand the vocabulary, rules, and expected signals
2. Read the enriched data in Neo4j (`ConstraintFamily`, `ConstraintVocabulary`, `ConstraintRule` nodes) for the family
3. Create `foundry/cre/constraints/cf{N}_{name}.py` following the `BaseConstraint` pattern
4. Register it in `foundry/cre/constraints/__init__.py` (replace the `None` entry)
5. Test: `python -c "from foundry.cre.constraints import get_constraint; c = get_constraint('CF{N}'); print(c)"`

### Pattern to follow

```python
# See foundry/cre/constraints/cf1_trl.py for the canonical pattern:
# - Inherit from BaseConstraint
# - Implement async evaluate(entity_data, context) -> ConstraintResult
# - Use _make_pass() / _make_fail() helpers
# - Return confidence_modifier (0.85 for penalising, 0.0 for blocking)
```

**Gate:** All 9 constraints implemented and registered. Import test passes for each. OBJECT-3 now evaluates all 11 constraint families instead of 2.

---

## Task 6: Final Re-Run + Production Baseline

**Goal:** Re-run OBJECT-3 → OBJECT-5 with all 11 constraints active. Capture the production baseline.
**Time:** 1-2 hours
**Depends on:** Task 5 passed

### Re-classify with full constraint battery

```bash
# Only need O3-O5 — the FATObjects from Task 4 are still valid
python -m foundry.object.researchers.classification_engine classify 191
python -m foundry.object.routing_engine route 191
python -m foundry.object.sync_engine sync 200
```

### Capture production baseline

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

**Gate:** Full pipeline executed with all 11 constraints. Metrics recorded. This is the production baseline for the researcher instance.

---

## Task 7: Update MEMORY.md

**Goal:** Bring the project memory up to date so future sessions start from accurate state.
**Time:** 30 min
**Depends on:** Task 6 passed

Update these sections in `/Users/wes.ward/.claude/projects/-Users-wes-ward-Desktop-antigravity-Foundry-3/memory/MEMORY.md`:

1. **File Structure** — update paths to reflect entity-type namespace refactor (`foundry/object/researchers/`, etc.)
2. **Current Data State** — update metrics from Task 6 baseline
3. **PLANNED: Phase 1 Adapter Improvements** — mark as DONE (Scopus pubs, ORCID 200-cap, OpenAlex all implemented)
4. **Observability Implementation Phases** — update to reflect that GOVERN, feedback, and observability are implemented
5. **Add section:** "GOVERN Layer — Validated" with dry-run and live-run results
6. **Add section:** "CRE Constraints — All 11 Active" with implementation status
7. **Remove stale entries** that reference old paths or planned work that's now complete

---

## Completion Criteria

All 7 tasks done means:

- [ ] GOVERN 1-4 validated (dry-run + small live batch)
- [ ] Feedback processor validated
- [ ] API endpoints returning valid responses
- [ ] Full pipeline re-run with improved adapters (Task 4 baseline)
- [ ] All 11 CRE constraints implemented and active
- [ ] Final re-run with full constraint battery (Task 6 production baseline)
- [ ] Auto-approve rate measured (target: >90%)
- [ ] GOVERN-4 health snapshot captured
- [ ] MEMORY.md updated to reflect current state

**After completion:** The FAT Researcher instance is production-grade. Next workstreams:
- Curator reviews of 27+ pending items (trace links available via API)
- Equipment instance (OBJECT-2/3 stubs need implementation)
- BMS Phase 1 (separate silo, independent workstream)
