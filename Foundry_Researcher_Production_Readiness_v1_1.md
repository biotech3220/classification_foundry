Production Readiness Gap Analysis
Beyond the runbook's 5 tasks, here's what the codebase actually needs — organized by severity.

CRITICAL (blocks production deployment)
1. Secrets committed to Git The .env file with all production API keys (OpenRouter, OpenAI, Cohere, Langfuse, Neo4j, Qdrant, Supabase, Scopus, ORCID, SerpAPI) is tracked in the repository. Every key needs rotation and .env needs adding to .gitignore. History should be cleaned with bfg-repo-cleaner.

2. Zero test coverage for Foundry 62 pure-logic unit tests exist for GOVERN math functions. That's it. Zero tests for:

All 5 OBJECT engines (O1–O5)
All 7 adapters (ORCID, Scopus, OpenAlex, Scholar, Patents, University, Brave)
All 11 CRE constraints
Feedback processor
API routes (13 endpoints)
Core infrastructure (database, signals, config, LLM)
For comparison, BMS has 292 tests across 13 files with comprehensive mocking infrastructure. Foundry has no conftest.py, no async test fixtures, no mock factories.

3. Health endpoint only checks Supabasehealth.py:18-27 pings Supabase and returns "ok". Neo4j and Qdrant are not checked. A production deployment could report healthy while the graph database is down.

HIGH (significant risk in production)
4. No rate limiting on API Zero rate limiting on any endpoint. The curator approve/reject endpoints are unprotected against brute-force or accidental rapid-fire calls.

5. Ingestion engine CLI doesn't accept a limit The runbook says python -m foundry.object.researchers.ingestion_engine ingest 191 but O1 has no ingest <N> subcommand — it always processes the full CSV. Every other engine (O2–O5) supports limits.

6. No retry logic on 4 of 7 adapters Only Scopus has proper exponential backoff with 429 handling. ORCID has basic timeout. Scholar, Patents, OpenAlex, and Brave have single-attempt calls — one transient failure and the adapter returns nothing.

7. No LLM call timeouts in O2 Fabrication engine LLM calls via pydantic-ai have no asyncio.wait_for() wrapper. A hanging OpenRouter request blocks a semaphore slot indefinitely. O3's constraint assessment has a 5s timeout (good), but O2 doesn't.

8. PostgreSQL writes have no retry or exception handling Supabase upserts in O1, O2, and O4 are bare — no try/except, no retry. A transient Supabase network error aborts the entire pipeline run.

9. Untyped adapter outputSourceResult.data is Dict[str, Any] — completely unvalidated. Publications from 4 sources (ORCID, Scopus, OpenAlex, Scholar) merge with different shapes and no Pydantic model enforcing consistent fields.

10. Silent duplicate overwrite in O1 If the CSV has two rows with the same email, the second silently overwrites the first in both Neo4j (MERGE) and Supabase (upsert). No warning logged.

MEDIUM (operational risk over time)
11. No cross-database drift detection No mechanism to detect that a researcher is active in Neo4j but pending_review in Supabase, or present in Qdrant but deleted from Neo4j. Three stores, zero consistency checks.

12. No deployment artifacts No Dockerfile, no docker-compose, no pyproject.toml for Foundry. No lock file for deterministic dependency resolution. Python version requirement (3.12, not 3.14) is undeclared.

13. No database migration infrastructure One manual SQL file exists (scripts/migrations/001_govern_tables.sql). No Alembic, no migration runner, no tracking of which migrations have been applied.

14. No SQL CHECK constraintsvalidation_queue.status is VARCHAR(50) — no enum. confidence is DECIMAL(5,4) — no range check. correct_codes is VARCHAR(10)[] — no validation against ANZSRC standards.

15. No Neo4j uniqueness constraints Indexes exist on asset_id, but no CONSTRAINT ... IS UNIQUE. MERGE prevents duplicates at the application level, but the database doesn't enforce it.

16. Logging is plain-text, hardcoded to INFO No structured/JSON logging. No configurable log level. No log rotation. Each CLI entry point re-configures logging.basicConfig() independently.

17. No external alert delivery GOVERN-4 generates alerts and stores them in PostgreSQL, but doesn't notify anyone. No Slack webhook, no email, no PagerDuty. Alerts require manual API polling.

18. No audit query API Signals are persisted to Neo4j but there's no /api/v1/audit/{asset_id} or /api/v1/signals endpoint. Tracing a classification decision requires manual Cypher queries + Langfuse SDK access.

LOW (nice-to-have for production maturity)
19. Stale docstrings — O1/O2/O3 engine files reference old module paths (foundry.object.ingestion_engine instead of foundry.object.researchers.ingestion_engine).

20. No input validation on researcher CSV — No email format check, no ORCID URL regex, no lat/lng bounds, no dedup at parse time. Blank emails produce colliding asset_ids.

21. No Pydantic range validators — final_confidence has no ge=0, le=1 constraint. status fields have no enum.

22. Auth optional in dev mode — If API_KEY env var is unset, all protected endpoints are publicly accessible. Intentional for dev, dangerous if accidentally deployed without it.

Recommended Prioritization


Priority

Items

Effort

Week 1

Rotate secrets + .gitignore (#1), health check (#3), rate limiting (#4), O1 CLI limit (#5)

~1 day

Week 2

Test infrastructure + first 50 tests (#2), adapter retries (#6), LLM timeouts (#7), PG retries (#8)

~3 days

Week 3

SQL constraints (#14), Neo4j constraints (#15), typed adapter output (#9), duplicate detection (#10)

~2 days

Week 4

Audit API (#18), alert webhooks (#17), cross-DB drift check (#11), structured logging (#16)

~2 days

Later

Deployment artifacts (#12), migration infra (#13), Pydantic validators (#20-21)

~2 days



The runbook tasks (GOVERN dry-run, feedback validation, full re-run, MEMORY update) are still necessary — but they validate the functional pipeline. This list covers the operational infrastructure that separates "it runs" from "it runs reliably in production".