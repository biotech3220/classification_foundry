# Equipment Instance: Developer Handoff Checklist

**Date:** 30/01/2026  
**Developer:** Nanven  
**Target:** All 13 workflows operational for Equipment instance

---

## Pre-Meeting Checklist

### Files to Provide

| File | Workflow | Status | Notes |
|------|----------|--------|-------|
| `equipment_instance_spec_v1_3.md` | Reference | ✓ READY | Instance specification |
| `FATEquipment_Schema_v1_3.md` | Reference | ✓ READY | Neo4j/Qdrant/PostgreSQL schema |
| `equipment_workflow_reuse_analysis.md` | Reference | ✓ READY | Implementation guide |
| `unspsc_filtered_marine_bioproducts.csv` | INSTANCE-1, INSTANCE-2 | ✓ READY | 948 codes with hierarchy + unit_operations + oecd_fos |
| `equipment_mapping_deakin_biofactory.csv` | OBJECT-3 validation | ✓ READY | Expected classification outputs (33 items) |
| `equipment_seed_input.csv` | OBJECT-1 | **NEEDS CREATION** | Raw equipment data for ingestion |

### Files Already in System (from Researcher)

| File | Workflow | Notes |
|------|----------|-------|
| OECD FOS standards | SYSTEM-1 | Already fabricated, reuse |
| CRE constraint definitions | SYSTEM-2 | Already deployed, reuse |

---

## equipment_seed_input.csv Structure (OBJECT-1 Input)

This file needs to be created from your BioFactory asset register. Structure:

```csv
equipment_id,equipment_name,manufacturer,model,serial_number,location,facility_id,operational_status,notes
EQ-001,Iatroscan,Iatron Laboratories,MK-6s,,Waurn Ponds,facility:deakin-biofactory,operational,TLC-FID for lipid analysis
EQ-002,Macfuge 260 - Centrifuge Separator,Pieralisi,Macfuge 260,,Waurn Ponds,facility:deakin-biofactory,operational,Pilot-scale centrifugal separator
...
```

**Required fields:**
- `equipment_id` - Internal asset tag (EQ-001, EQ-002, etc.)
- `equipment_name` - Human-readable name
- `manufacturer` - Equipment manufacturer (may need lookup)
- `model` - Model number (may need lookup)
- `location` - Physical location (Waurn Ponds for all)
- `facility_id` - FAT Facility reference (facility:deakin-biofactory for all)
- `operational_status` - operational | under_maintenance | decommissioned

**Optional fields:**
- `serial_number` - If available from asset register
- `notes` - Any additional context (can pull from mapping CSV)

**Source:** Your BioFactory asset register + manufacturer lookups

---

## Facility Reference Data

For OBJECT-2 to create [:HOSTED_BY] relationships:

```
Facility ID: facility:deakin-biofactory
Display Name: Deakin BioFactory
Organisation: Deakin University
Location: Waurn Ponds, Victoria, Australia
```

**Question:** Does a FAT Facility node already exist, or does Nanven need to create a stub?

---

## Workflow Execution Order

```
Day 1: INSTANCE Layer
  □ INSTANCE-1: Fabricate UNSPSC standards (all 4 levels)
    Input: unspsc_filtered_marine_bioproducts.csv
    Output: 948 Standard:UNSPSC nodes with unit_operation + oecd_fos
    
  □ INSTANCE-2: Create crosswalks (UNSPSC -> OECD)
    Input: Same CSV (derive from oecd_fos column)
    Output: [:MAPS_TO] relationships to existing OECD FOS nodes

Day 2: OBJECT Layer (NEW BUILDS)
  □ OBJECT-1: Build equipment ingestion workflow
    Input: equipment_seed_input.csv (NEEDS CREATION)
    Output: ThinObject nodes for 33 equipment items
    
  □ OBJECT-2: Build equipment fabrication workflow
    Input: ThinObjects from OBJECT-1
    Output: FATObject:Equipment nodes with dense_text

Day 3: OBJECT Layer (PARAMETER UPDATES)
  □ OBJECT-3: Clone researcher workflow, update parameters
    - Change standard to UNSPSC
    - Change thresholds (0.60/0.65)
    - Change classification count (1-3)
    - Change enabled CFs (CF1, CF2, CF4, CF5, CF6)
    - Update classification prompt
    
  □ OBJECT-4: Clone researcher workflow, update thresholds
    - auto_approve: 0.80
    - human_review: 0.55-0.80
    - reject: < 0.55
    
  □ OBJECT-5: Clone researcher workflow, update filters
    - asset_type: "equipment"
    - Qdrant collection: objects_equipment_v1

Day 4: GOVERN Layer + Testing
  □ GOVERN-1: Clone researcher workflow, update parameters
    - scan_interval: 180 days
    - change_signals: calibration_due, maintenance_status, operational_status_change
    
  □ GOVERN-2: Clone researcher workflow, update field weights
    - operational_status: 0.9
    - calibration_status: 0.7
    - specifications: 0.5
    - location: 0.4

  □ End-to-end test with seed dataset
    - Run 5 equipment items through full pipeline
    - Validate against equipment_mapping_deakin_biofactory.csv
    - Target: 85%+ classification accuracy
```

---

## INSTANCE-1 Implementation Notes

The `unspsc_filtered_marine_bioproducts.csv` has all 4 hierarchy levels in columns:

| Column | Level | Example |
|--------|-------|---------|
| Segment | 1 | 40000000 |
| Family | 2 | 40160000 |
| Class | 3 | 40161700 |
| Commodity | 4 | 40161701 |

**Implementation options:**

**Option A: Create nodes at all 4 levels with [:BELONGS_TO] hierarchy**
```cypher
(commodity:Standard:UNSPSC {code: "40161701", level: "commodity"})
  -[:BELONGS_TO]->
(class:Standard:UNSPSC {code: "40161700", level: "class"})
  -[:BELONGS_TO]->
(family:Standard:UNSPSC {code: "40160000", level: "family"})
  -[:BELONGS_TO]->
(segment:Standard:UNSPSC {code: "40000000", level: "segment"})
```

**Option B: Create commodity nodes only, store hierarchy as properties**
```cypher
(:Standard:UNSPSC {
  code: "40161701",
  level: "commodity",
  segment: "40000000",
  family: "40160000",
  class: "40161700"
})
```

**Recommendation:** Option A (full hierarchy nodes) -- enables:
- Queries at any level ("find all equipment in segment 41")
- Enrichment at family/class level (future)
- Cleaner graph structure

**Node counts (approximate):**
- Segments: 4
- Families: 13
- Classes: ~50-80
- Commodities: 948
- **Total: ~1,000-1,050 nodes**

---

## INSTANCE-2 Implementation Notes

**Crosswalk derivation (no separate file needed):**

```python
# Pseudocode for INSTANCE-2
for each row in unspsc_filtered_marine_bioproducts.csv:
    unspsc_code = row['Commodity']
    oecd_fos = row['OECD_FOS']
    
    # Find nodes
    unspsc_node = MATCH (s:Standard:UNSPSC {code: unspsc_code})
    oecd_node = MATCH (o:Standard:OECD_FOS {code: oecd_fos})
    
    # Create crosswalk
    CREATE (unspsc_node)-[:MAPS_TO {
        confidence: 0.95,  # High confidence - derived from vocabulary
        mapping_type: "primary",
        source: "unit_operations_vocabulary",
        created_by: "INSTANCE-2"
    }]->(oecd_node)
```

**Result:** 948 [:MAPS_TO] relationships (one per commodity)

---

## Questions to Resolve Before Starting

### 1. equipment_seed_input.csv
Do you have the BioFactory asset register with manufacturer/model data? If not, options:
- **Option A:** Start with minimal data (equipment_id, equipment_name, notes) and let OBJECT-2 infer/scrape the rest
- **Option B:** Delay OBJECT-1 until asset register is available

### 2. Facility Node
Does `facility:deakin-biofactory` exist in Neo4j? If not:
- **Option A:** Nanven creates a stub Facility node first
- **Option B:** OBJECT-2 creates it on-demand when processing first equipment

### 3. OECD FOS Nodes
Confirm OECD FOS Standard nodes exist from SYSTEM-1 (researcher instance). Specifically need:
- 1.4 (Chemical Sciences)
- 1.6 (Biological Sciences)
- 2.4 (Chemical Engineering)
- 2.9 (Industrial Biotechnology)

### 4. Qdrant Collections
Confirm Nanven will create new collection `objects_equipment_v1` (don't reuse researcher collection).

---

## Success Criteria

| Metric | Target |
|--------|--------|
| INSTANCE-1 nodes created | ~1,000-1,050 UNSPSC Standard nodes |
| INSTANCE-2 crosswalks created | 948 [:MAPS_TO] relationships |
| Equipment processed | 33 items through full pipeline |
| Classification accuracy | >= 85% match with expected mappings |
| Auto-approve rate | >= 70% of items route to auto_approve_queue |

---

## Contact Points

- **Architecture questions:** Wes
- **n8n implementation:** Nanven
- **Data/CSV questions:** Wes

---

**END OF CHECKLIST**
