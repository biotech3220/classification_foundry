# Equipment Instance: Workflow Reuse Analysis for Nanven

**Date:** 30/01/2026  
**Purpose:** Implementation guide for Equipment instance n8n workflows  
**Context:** Researcher instance complete (all 13 workflows working)

---

## Executive Summary

Of 13 workflows, **4 need new builds** and **9 can reuse existing** (with parameter changes only).

| Category | Count | Workflows |
|----------|-------|-----------|
| NEW BUILD required | 4 | INSTANCE-1, INSTANCE-2, OBJECT-1, OBJECT-2 |
| REUSE with parameters | 5 | OBJECT-3, OBJECT-4, OBJECT-5, GOVERN-1, GOVERN-2 |
| REUSE unchanged | 4 | SYSTEM-1, SYSTEM-2, GOVERN-3, GOVERN-4 |

---

## SYSTEM Layer: REUSE UNCHANGED

### SYSTEM-1: Domain Hub Standard Fabrication
**Status:** REUSE UNCHANGED  
**Reason:** OECD FOS already fabricated for researcher instance. Equipment shares the same Domain Hub.

**Action:** None. Already deployed.

---

### SYSTEM-2: Constraint Reasoning Engine
**Status:** REUSE UNCHANGED  
**Reason:** CRE already deployed. Equipment uses different CF subset but CRE handles this via configuration.

**Action:** None. Already deployed.

---

## INSTANCE Layer: NEW BUILD REQUIRED

### INSTANCE-1: Primary Standard Fabrication
**Status:** NEW BUILD REQUIRED  
**Reason:** New standard (UNSPSC) with different structure than ANZSRC.

**Key Differences from Researcher:**

| Aspect | Researcher (ANZSRC) | Equipment (UNSPSC) |
|--------|--------------------|--------------------|
| Standard | ANZSRC FoR 2020 | UNSPSC (curated subset) |
| Hierarchy | 2/4/6-digit | Segment/Family/Class/Commodity |
| Code count | 1,238 | 948 |
| Source file | anzsrc_for_2020.csv | unspsc_filtered_marine_bioproducts.csv |
| Enrichment | Definition text | **unit_operation + oecd_fos** |

**Input File:** `unspsc_filtered_marine_bioproducts.csv` (948 codes)

**Critical Implementation Notes:**
1. Standard nodes need `unit_operation` property (vocabulary ID)
2. Standard nodes need `oecd_fos` property (derived from unit operation)
3. Both properties come from the filtered CSV -- no LLM enrichment needed

**Node Schema:**
```cypher
(:Standard:UNSPSC {
  code: "40161701",
  name: "Centrifuges",
  taxonomy: "unspsc",
  level: "commodity",
  segment: "40000000",
  family: "40160000",
  class: "40161700",
  commodity: "40161701",
  unit_operation: "solid_liquid_separation",
  oecd_fos: "2.4"
})
```

**Estimated Effort:** 4-6 hours (similar structure to researcher, different source)

---

### INSTANCE-2: Crosswalk Fabrication
**Status:** NEW BUILD REQUIRED  
**Reason:** New crosswalk direction (UNSPSC -> OECD FOS).

**Key Differences from Researcher:**

| Aspect | Researcher | Equipment |
|--------|------------|-----------|
| Source | ANZSRC | UNSPSC |
| Target | OECD FOS | OECD FOS (same) |
| Mapping source | Manual crosswalk CSV | **Derived from unit_operation.oecd_fos_primary** |
| Cardinality | Many-to-many | Many-to-one (simpler) |

**Critical Implementation Note:**
Equipment crosswalk is **simpler** than researcher because OECD FOS is already embedded in the UNSPSC filtered output. The crosswalk can be derived programmatically:

```
For each UNSPSC code:
  oecd_fos = code.oecd_fos (from CSV)
  Create [:MAPS_TO] relationship to OECD FOS standard node
```

**Estimated Effort:** 2-3 hours (simpler than researcher crosswalk)

---

## OBJECT Layer: MIXED

### OBJECT-1: Data Ingestion
**Status:** NEW BUILD REQUIRED  
**Reason:** Completely different data sources and scraping logic.

**Key Differences from Researcher:**

| Aspect | Researcher | Equipment |
|--------|------------|-----------|
| Sources | ORCID, Scopus, Google Scholar, Patents, University Web | Asset Register (CSV), Manufacturer Website |
| Source count | 5 | 2-3 |
| Data richness | HIGH | LOW |
| Scraping complexity | API + Web | CSV + Web scraping |
| Identity | ORCID ID | equipment_id (internal) |

**Input Files:**
- `equipment_mapping_deakin_biofactory.csv` (seed dataset, 33 items)
- Future: Asset Register API or CSV export

**ThinObject Fields:**
```json
{
  "equipment_id": "EQ-001",
  "equipment_name": "Iatroscan",
  "manufacturer": "TBD (scrape)",
  "model": "TBD (scrape)",
  "specifications": "TBD (scrape)",
  "location": "Deakin BioFactory",
  "operational_status": "operational"
}
```

**Estimated Effort:** 6-8 hours (new scraping logic, simpler than researcher)

---

### OBJECT-2: Object Fabrication
**Status:** NEW BUILD REQUIRED  
**Reason:** Different enrichment prompt and dense_view structure.

**Key Differences from Researcher:**

| Aspect | Researcher | Equipment |
|--------|------------|-----------|
| Enrichment focus | Research themes, methodologies, career stage | Capabilities, applications, scale |
| dense_view fields | publications, grants, biography, keywords | specs, capabilities, applications, parameters |
| Token target | 800-1500 | 800-1500 (same) |
| Complexity assessment | career_stage | equipment_complexity |

**Enrichment Prompt:** See equipment_instance_spec_v1_3.md Section 11

**Estimated Effort:** 4-5 hours (similar structure, different prompt)

---

### OBJECT-3: Classification & Assessment
**Status:** REUSE WITH PARAMETERS  
**Reason:** Same classification architecture, different standard and thresholds.

**Parameter Changes:**

| Parameter | Researcher | Equipment |
|-----------|------------|-----------|
| Primary Standard | ANZSRC FoR 2020 | UNSPSC |
| Classification count | 3-10 | 1-3 |
| Min code confidence | 0.70 | 0.60 |
| Min average confidence | 0.75 | 0.65 |
| Enabled CFs | CF1, CF4, CF7, CF9, CF12 | CF1, CF2, CF4, CF5, CF6 |
| Qdrant collection | standards_anzsrc_v1 | standards_unspsc_v1 |

**Classification Prompt:** See equipment_instance_spec_v1_3.md Section 10

**Action:** 
1. Clone researcher OBJECT-3 workflow
2. Update parameters in configuration node
3. Replace classification prompt
4. Update Qdrant collection reference

**Estimated Effort:** 2-3 hours (parameter updates + prompt swap)

---

### OBJECT-4: Confidence-Based Routing
**Status:** REUSE WITH PARAMETERS  
**Reason:** Same routing logic, different thresholds.

**Parameter Changes:**

| Parameter | Researcher | Equipment |
|-----------|------------|-----------|
| Auto-approve | >= 0.85 | >= 0.80 |
| Human review | 0.65-0.85 | 0.55-0.80 |
| Rejection | < 0.65 | < 0.55 |

**Action:**
1. Clone researcher OBJECT-4 workflow
2. Update threshold values in configuration node

**Estimated Effort:** 30 minutes (threshold change only)

---

### OBJECT-5: Human Validation Sync
**Status:** REUSE WITH PARAMETERS  
**Reason:** Entity-agnostic sync logic.

**Parameter Changes:**

| Parameter | Researcher | Equipment |
|-----------|------------|-----------|
| asset_type filter | "researcher" | "equipment" |
| Qdrant collection | objects_researcher_v1 | objects_equipment_v1 |

**Action:**
1. Clone researcher OBJECT-5 workflow
2. Update asset_type filter
3. Update Qdrant collection reference

**Estimated Effort:** 30 minutes (filter change only)

---

## GOVERN Layer: MOSTLY REUSE

### GOVERN-1: Asset Health Scanning
**Status:** REUSE WITH PARAMETERS  
**Reason:** Same scanning logic, different interval and signals.

**Parameter Changes:**

| Parameter | Researcher | Equipment |
|-----------|------------|-----------|
| scan_interval_days | 90 | 180 |
| change_signals | new_publications, affiliation_change, grant_updates | calibration_due, maintenance_status, operational_status_change |
| priority_rules | High-value researchers | Critical equipment |

**Action:**
1. Clone researcher GOVERN-1 workflow
2. Update scan interval
3. Update change signal detection logic

**Estimated Effort:** 1-2 hours (signal detection logic)

---

### GOVERN-2: Change Severity Classification
**Status:** REUSE WITH PARAMETERS  
**Reason:** Same severity calculation, different field weights.

**Parameter Changes:**

| Field | Researcher Weight | Equipment Weight |
|-------|-------------------|------------------|
| Primary field | affiliation: 0.8 | operational_status: 0.9 |
| Secondary field | grants: 0.5 | calibration_status: 0.7 |
| Tertiary field | publications: 0.3 | specifications: 0.5 |
| Minor field | contact_email: 0.1 | location: 0.4 |

**Action:**
1. Clone researcher GOVERN-2 workflow
2. Update field weight configuration

**Estimated Effort:** 30 minutes (weight configuration only)

---

### GOVERN-3: Re-Fabrication Orchestration
**Status:** REUSE UNCHANGED  
**Reason:** Entity-agnostic orchestration logic.

**Action:** None. Workflow routes to OBJECT pipeline which handles entity type.

---

### GOVERN-4: Registry Health Governance
**Status:** REUSE UNCHANGED  
**Reason:** Entity-agnostic monitoring logic.

**Action:** None. Metrics aggregation works across entity types.

---

## Implementation Sequence

**Recommended order:**

```
Week 1:
  1. INSTANCE-1 (UNSPSC standard) - 4-6 hours
  2. INSTANCE-2 (Crosswalks) - 2-3 hours
  3. OBJECT-1 (Data Ingestion) - 6-8 hours

Week 2:
  4. OBJECT-2 (Fabrication) - 4-5 hours
  5. OBJECT-3 (Classification) - 2-3 hours
  6. OBJECT-4 (Routing) - 30 min
  7. OBJECT-5 (Validation) - 30 min

Week 3:
  8. GOVERN-1 (Health Scanning) - 1-2 hours
  9. GOVERN-2 (Severity) - 30 min
  10. End-to-end testing with seed dataset (33 items)
```

**Total Estimated Effort:** 22-30 hours

---

## Test Fixtures

**Seed Dataset:** 33 equipment items from Deakin BioFactory

**Test Cases:**

| Equipment | Expected UNSPSC | Unit Operation | Complexity |
|-----------|-----------------|----------------|------------|
| Iatroscan (EQ-001) | 41115701 | lipid_analysis; chromatography | multi-function |
| Macfuge 260 (EQ-002) | 40161701 | solid_liquid_separation | single-purpose |
| FD80GP Freeze Dry (EQ-010) | 24131604 | freeze_drying | single-purpose |
| Ethanol Extraction Unit (EQ-017) | 41104018 | extraction; solid_liquid_separation | multi-function |
| 10L Hydrothermal Reactor (EQ-029) | 41103505 | chemical_reaction; pretreatment | multi-function |

**Validation Criteria:**
- Classification accuracy: Target >= 85% match with seed dataset mappings
- Confidence distribution: Majority should route to auto-approve (>= 0.80)
- Unit operation inheritance: All classified equipment should have unit_operation via Standard node

---

## Files to Provide

1. **equipment_instance_spec_v1_3.md** -- Instance specification
2. **FATEquipment_Schema_v1_3.md** -- Neo4j/Qdrant/PostgreSQL schema
3. **unspsc_filtered_marine_bioproducts.csv** -- INSTANCE-1 input (948 codes)
4. **equipment_mapping_deakin_biofactory.csv** -- OBJECT-1 seed dataset (33 items)

---

## Questions for Nanven

1. **OBJECT-1 Scraping:** Do we have manufacturer website patterns to target, or should we start with CSV-only ingestion?

2. **INSTANCE-1 Hierarchy:** UNSPSC has 4 levels (segment/family/class/commodity). Do we create nodes at all levels or commodity-only?

3. **Crosswalk Generation:** Should INSTANCE-2 generate crosswalks dynamically from the oecd_fos column, or do you want a separate crosswalk CSV?

4. **Facility Linkage:** The seed dataset doesn't include facility_id. Should OBJECT-2 default to "facility:deakin-biofactory" for all items?

---

**END OF ANALYSIS**
