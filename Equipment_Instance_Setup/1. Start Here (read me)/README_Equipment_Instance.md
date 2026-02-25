# README: Equipment Instance Implementation

**Version:** 1.0  
**Date:** 30/01/2026  
**Developer:** Nanven  
**Architect:** Wes Ward

---

## Quick Start

This is the **second Classification Foundry instance**. The Researcher instance is complete and operational. Equipment shares the Domain Hub (OECD FOS) and Constraint Reasoning Engine, enabling cross-entity capability queries like "find researchers who can operate this equipment."

**Your task:** Implement 9 workflows to classify 33 equipment items from Deakin BioFactory against UNSPSC codes.

**Estimated effort:** 4-5 days (~25-30 hours)

---

## 1. What You're Building

```
EQUIPMENT INSTANCE = FAT5(
  Object:      Equipment (33 items from Deakin BioFactory)
  Standard:    UNSPSC (948 codes, pre-filtered)
  DomainHub:   OECD FOS (inherited from SYSTEM-1)
  Crosswalk:   UNSPSC -> OECD (derived from vocabulary)
  Constraints: CF1, CF2, CF4, CF5, CF6
)
```

**End state:** Equipment items classified against UNSPSC codes, normalised to OECD FOS, with confidence-based routing to validation queues.

---

## 2. Files Provided

| File | Purpose | Workflow |
|------|---------|----------|
| `unspsc_filtered_marine_bioproducts.csv` | 949 UNSPSC codes with unit_operations + oecd_fos | INSTANCE-1, INSTANCE-2 |
| `equipment_seed_input_TEMPLATE.csv` | 33 equipment items (thin data) | OBJECT-1 |
| `equipment_mapping_deakin_biofactory.csv` | Expected classification outputs | Validation |
| `equipment_instance_spec_v1_3.md` | Full instance specification | Reference |
| `FATEquipment_Schema_v1_3.md` | Neo4j/Qdrant/PostgreSQL schemas | Reference |
| `equipment_workflow_reuse_analysis.md` | Build vs clone decisions | Reference |

---

## 3. What's Inherited (No Work Required)

These are already operational from Researcher instance:

| Workflow | Status | Notes |
|----------|--------|-------|
| SYSTEM-1 | COMPLETE | OECD FOS nodes exist in Neo4j |
| SYSTEM-2 | COMPLETE | CRE deployed, handles CF configuration per instance |
| GOVERN-3 | COMPLETE | Entity-agnostic re-fabrication orchestration |
| GOVERN-4 | COMPLETE | Entity-agnostic registry health monitoring |

---

## 4. Pre-Flight Checklist

**Before starting, confirm:**

### 4.1 OECD FOS Nodes Exist

```cypher
MATCH (o:Standard:OECD_FOS) 
WHERE o.code IN ['1.4', '1.6', '2.4', '2.9']
RETURN o.code, o.name
```

**Expected result:** 4 nodes
- 1.4 Chemical Sciences
- 1.6 Biological Sciences  
- 2.4 Chemical Engineering
- 2.9 Industrial Biotechnology

If missing, SYSTEM-1 was not completed for Researcher instance -- resolve before continuing.

### 4.2 Create Qdrant Collections

```
standards_unspsc_v1     -- for UNSPSC Standard embeddings (INSTANCE-1)
objects_equipment_v1    -- for FAT Equipment embeddings (OBJECT-2)
```

Do NOT reuse researcher collections.

### 4.3 Create Facility Stub (if not exists)

```cypher
MERGE (f:Facility {facility_id: "facility:deakin-biofactory"})
SET f.name = "Deakin BioFactory",
    f.organisation = "Deakin University",
    f.location = "Waurn Ponds, Victoria, Australia"
RETURN f
```

---

## 5. Execution Sequence

### Day 1: INSTANCE Layer

#### INSTANCE-1: UNSPSC Standard Fabrication (4-6 hours)

**Input:** `unspsc_filtered_marine_bioproducts.csv`

**Decision:** Create full hierarchy (Option A) -- nodes at all 4 levels with [:BELONGS_TO] relationships.

**CSV Structure:**
```
Segment,Segment_Name,Family,Family_Name,Class,Class_Name,Commodity,Commodity_Name,Unit_Operations,OECD_FOS
23000000,Industrial Manufacturing...,23150000,Industrial process...,23151500,Rubber and plastic...,23151502,Coating machines,encapsulation,2.9
```

**Implementation Steps:**

1. **Extract unique values at each level:**
   - Segments: 4 unique
   - Families: 13 unique
   - Classes: ~50-80 unique
   - Commodities: 948 unique

2. **Create Segment nodes (4):**
```cypher
CREATE (:Standard:UNSPSC {
  code: $segment_code,
  name: $segment_name,
  taxonomy: "unspsc",
  level: "segment"
})
```

3. **Create Family nodes with [:BELONGS_TO] -> Segment (13):**
```cypher
MATCH (seg:Standard:UNSPSC {code: $segment_code, level: "segment"})
CREATE (fam:Standard:UNSPSC {
  code: $family_code,
  name: $family_name,
  taxonomy: "unspsc",
  level: "family"
})-[:BELONGS_TO]->(seg)
```

4. **Create Class nodes with [:BELONGS_TO] -> Family (~50-80):**
```cypher
MATCH (fam:Standard:UNSPSC {code: $family_code, level: "family"})
CREATE (cls:Standard:UNSPSC {
  code: $class_code,
  name: $class_name,
  taxonomy: "unspsc",
  level: "class"
})-[:BELONGS_TO]->(fam)
```

5. **Create Commodity nodes with [:BELONGS_TO] -> Class (948):**
```cypher
MATCH (cls:Standard:UNSPSC {code: $class_code, level: "class"})
CREATE (com:Standard:UNSPSC {
  code: $commodity_code,
  name: $commodity_name,
  taxonomy: "unspsc",
  level: "commodity",
  unit_operation: $unit_operations,
  oecd_fos: $oecd_fos
})-[:BELONGS_TO]->(cls)
```

**Critical:** Only Commodity nodes carry `unit_operation` and `oecd_fos` properties (from CSV columns).

6. **Generate embeddings for Commodity nodes:**
```python
embedding_text = f"{commodity_name} | {unit_operations}"
embedding = openai.embed(embedding_text, model="text-embedding-3-large")
# Store in Qdrant collection: standards_unspsc_v1
```

**Validation:**
```cypher
MATCH (s:Standard:UNSPSC)
RETURN s.level, count(*) as count
ORDER BY count DESC
```

**Expected:**
| level | count |
|-------|-------|
| commodity | 948 |
| class | ~50-80 |
| family | 13 |
| segment | 4 |

---

#### INSTANCE-2: Crosswalk Fabrication (2-3 hours)

**Input:** Commodity nodes from INSTANCE-1 (already have `oecd_fos` property)

**No separate crosswalk file needed** -- derive from existing data.

**Implementation:**
```cypher
// For each commodity node, create [:MAPS_TO] to OECD FOS
MATCH (com:Standard:UNSPSC {level: "commodity"})
WHERE com.oecd_fos IS NOT NULL
MATCH (oecd:Standard:OECD_FOS {code: com.oecd_fos})
MERGE (com)-[r:MAPS_TO]->(oecd)
SET r.confidence = 0.95,
    r.mapping_type = "primary",
    r.source = "unit_operations_vocabulary",
    r.created_by = "INSTANCE-2",
    r.created_at = datetime()
```

**Validation:**
```cypher
MATCH (:Standard:UNSPSC)-[r:MAPS_TO]->(:Standard:OECD_FOS)
RETURN count(r) as crosswalk_count
```

**Expected:** 948 relationships

---

### Day 2: OBJECT Layer (New Builds)

#### OBJECT-1: Data Ingestion (2-3 hours)

**Input:** `equipment_seed_input_TEMPLATE.csv`

**CSV Structure:**
```csv
equipment_id,equipment_name,manufacturer,model,serial_number,location,facility_id,operational_status,notes
EQ-001,Iatroscan,,,,Waurn Ponds,facility:deakin-biofactory,operational,TLC-FID for lipid analysis
```

**ThinObject Schema:**
```json
{
  "equipment_id": "EQ-001",
  "equipment_name": "Iatroscan",
  "manufacturer": null,
  "model": null,
  "serial_number": null,
  "location": "Waurn Ponds",
  "facility_id": "facility:deakin-biofactory",
  "operational_status": "operational",
  "notes": "TLC-FID for lipid analysis",
  "ingestion_timestamp": "2026-01-30T10:00:00Z",
  "source": "asset_register_csv"
}
```

**Neo4j ThinObject Node:**
```cypher
CREATE (t:ThinObject:Equipment {
  equipment_id: $equipment_id,
  equipment_name: $equipment_name,
  manufacturer: $manufacturer,
  model: $model,
  location: $location,
  facility_id: $facility_id,
  operational_status: $operational_status,
  notes: $notes,
  status: "ingested",
  ingested_at: datetime(),
  source: "asset_register_csv"
})
```

**Validation:**
```cypher
MATCH (t:ThinObject:Equipment)
RETURN count(t) as thin_objects
```

**Expected:** 33 nodes

---

#### OBJECT-2: Object Fabrication (4-5 hours)

**Input:** ThinObject nodes from OBJECT-1

**Strategy:** LLM inference from equipment_name + notes (no web scraping for initial implementation)

**Enrichment Prompt:**

```
You are enriching an equipment profile for a capability intelligence system.

INPUT DATA:
- Equipment Name: {equipment_name}
- Manufacturer: {manufacturer}
- Model: {model}
- Location/Facility: {facility}
- Operational Status: {operational_status}
- Notes: {notes}

TASK: Extract and structure equipment capabilities.

Provide:

1. **Equipment Complexity** (critical for classification depth):
   - single-purpose: Dedicated to one function (e.g., pH meter, balance)
   - multi-function: Multiple measurement/processing capabilities (e.g., spectrophotometer)
   - platform: Integrated system with multiple modules (e.g., HPLC, mass spec system)

2. **Primary Capabilities** (3-5 core functions):
   - e.g., "High-speed centrifugation", "UV-Vis absorbance measurement"

3. **Applications** (3-5 typical use cases):
   - e.g., "Cell separation", "Protein purification", "Sample preparation"

4. **Operational Parameters** (key specifications - infer if not provided):
   - e.g., "Max RPM: 15,000", "Temperature range: -20 to 100C"

5. **Scale** (processing capacity):
   - bench: < 1L typical batch
   - pilot: 1-100L typical batch
   - production: > 100L typical batch

6. **Inferred Manufacturer/Model** (if recognisable from equipment name):
   - Only provide if confident, otherwise leave as null

OUTPUT FORMAT (JSON):
{
  "equipment_complexity": "single-purpose | multi-function | platform",
  "capabilities": ["capability1", "capability2", ...],
  "applications": ["application1", "application2", ...],
  "operational_parameters": {"param1": "value1", ...},
  "scale": "bench | pilot | production",
  "inferred_manufacturer": "string or null",
  "inferred_model": "string or null"
}

CRITICAL: Respond ONLY with valid JSON.
```

**FATObject Schema:**
```cypher
CREATE (e:FATObject:Equipment {
  // Identity
  equipment_id: $equipment_id,
  fat_id: "fat:equipment:" + $equipment_id,
  
  // Core properties
  equipment_name: $equipment_name,
  manufacturer: $manufacturer_or_inferred,
  model: $model_or_inferred,
  location: $location,
  facility_id: $facility_id,
  operational_status: $operational_status,
  
  // Enriched properties
  equipment_complexity: $complexity,
  capabilities: $capabilities,
  applications: $applications,
  operational_parameters: $parameters,
  scale: $scale,
  
  // Views
  dense_view: $dense_text,
  
  // Metadata
  status: "fabricated",
  fabricated_at: datetime(),
  version: "1.0",
  
  // ALM properties
  last_scanned_at: datetime(),
  next_source_scan: datetime() + duration({days: 180}),
  source_freshness_score: 1.0,
  scan_status: "current",
  scan_interval: 180,
  creation_mode: "initial_ingest"
})
```

**dense_view Generation:**
```
{equipment_name} | {manufacturer} {model}

CAPABILITIES: {capabilities joined}

APPLICATIONS: {applications joined}

PARAMETERS: {operational_parameters formatted}

SCALE: {scale}

NOTES: {original notes preserved}
```

**Target:** 800-1500 tokens for dense_view

**Create [:HOSTED_BY] Relationship:**
```cypher
MATCH (e:FATObject:Equipment {equipment_id: $equipment_id})
MATCH (f:Facility {facility_id: $facility_id})
MERGE (e)-[:HOSTED_BY]->(f)
```

**Generate and Store Embeddings:**
```python
embedding = openai.embed(dense_view, model="text-embedding-3-large")
# Store in Qdrant collection: objects_equipment_v1
```

**Validation:**
```cypher
MATCH (e:FATObject:Equipment {status: "fabricated"})
RETURN count(e) as fabricated_count
```

**Expected:** 33 nodes

---

### Day 3: OBJECT Layer (Clone + Configure)

#### OBJECT-3: Classification & Assessment (2-3 hours)

**Action:** Clone researcher OBJECT-3 workflow, update parameters.

**Parameter Changes:**

| Parameter | Researcher | Equipment |
|-----------|------------|-----------|
| Primary Standard | ANZSRC FoR 2020 | UNSPSC |
| Qdrant collection | standards_anzsrc_v1 | standards_unspsc_v1 |
| Min classification count | 3 | 1 |
| Max classification count | 10 | 3 |
| Min code confidence | 0.70 | 0.60 |
| Min average confidence | 0.75 | 0.65 |
| Enabled CFs | CF1, CF4, CF7, CF9, CF12 | CF1, CF2, CF4, CF5, CF6 |

**Classification Prompt:**

```
You are an equipment classification specialist. Your task is to classify laboratory and processing equipment against the United Nations Standard Products and Services Code (UNSPSC).

INPUT DATA:
- Equipment Name: {equipment_name}
- Manufacturer: {manufacturer}
- Model: {model}
- Capabilities: {capabilities}
- Applications: {applications}
- Operational Parameters: {operational_parameters}
- Scale: {scale}

CANDIDATE UNSPSC CODES:
{candidate_codes}

CLASSIFICATION RULES:

1. Select the most specific UNSPSC code(s) that match the equipment's PRIMARY function.

2. Classification depth based on equipment complexity:
   - Single-purpose equipment: 1 code (e.g., pH meter, balance)
   - Multi-function equipment: 2 codes (e.g., spectrophotometer with multiple modes)
   - Platform/system: 2-3 codes (e.g., HPLC system, integrated extraction unit)
   - Maximum: 3 codes (prevents over-classification)
   - Only assign codes where confidence >= 60%

3. For each code, provide:
   - Confidence score (0-100)
   - Brief justification referencing specific specifications or capabilities

4. Rank codes by relevance (primary function first)

5. Ensure classifications respect hierarchical constraints:
   - Don't assign both parent and child codes
   - Prefer most specific (Commodity level) codes over broad (Segment level)

OUTPUT FORMAT (JSON):
{
  "equipment_complexity_assessed": "single-purpose | multi-function | platform",
  "classification_depth_rationale": "Brief explanation of why N codes were assigned",
  "classifications": [
    {
      "code": "41121500",
      "name": "Centrifuges",
      "confidence": 92,
      "justification": "Equipment is a high-speed centrifuge for laboratory separation applications",
      "evidence": ["Maximum RPM: 15,000", "Rotor capacity: 6x50mL"]
    }
  ],
  "reasoning": "Overall summary of classification decisions"
}

CRITICAL RULES:
- Respond ONLY with valid JSON. Do not include any text outside the JSON structure.
- Equipment is typically more specific than researchers -- 1-2 codes is normal.
- Every code must have specific evidence from specifications or capabilities.
- Do not assign codes based on inferred or assumed functionality.
```

**Create [:CLASSIFIED_AS] Relationships:**
```cypher
MATCH (e:FATObject:Equipment {equipment_id: $equipment_id})
MATCH (s:Standard:UNSPSC {code: $unspsc_code})
CREATE (e)-[r:CLASSIFIED_AS]->(s)
SET r.confidence = $confidence,
    r.rank = $rank,
    r.tier = "primary",
    r.justification = $justification,
    r.evidence = $evidence,
    r.constraint_flags = $constraint_flags,
    r.classified_at = datetime(),
    r.classified_by = "OBJECT-3"
```

**Update Status:**
```cypher
MATCH (e:FATObject:Equipment {equipment_id: $equipment_id})
SET e.status = "classified",
    e.classified_at = datetime(),
    e.final_confidence = $average_confidence,
    e.assessment_flags = $flags
```

---

#### OBJECT-4: Confidence-Based Routing (30 minutes)

**Action:** Clone researcher OBJECT-4 workflow, update thresholds.

**Threshold Changes:**

| Queue | Researcher | Equipment |
|-------|------------|-----------|
| auto_approve | >= 0.85 | >= 0.80 |
| human_review | 0.65-0.85 | 0.55-0.80 |
| reject | < 0.65 | < 0.55 |

**Routing Logic:**
```javascript
if (final_confidence >= 0.80) {
  queue = "auto_approve_queue";
  status = "pending_auto_approve";
} else if (final_confidence >= 0.55) {
  queue = "human_review_queue";
  status = "pending_review";
} else {
  queue = "reject_queue";
  status = "rejected";
}
```

**PostgreSQL Queue Insert:**
```sql
INSERT INTO validation_queue (
  fat_id, 
  asset_type, 
  queue_name, 
  priority,
  final_confidence,
  assessment_flags,
  created_at
) VALUES (
  $fat_id,
  'equipment',
  $queue,
  CASE WHEN $queue = 'human_review_queue' THEN 1 ELSE 2 END,
  $final_confidence,
  $assessment_flags,
  NOW()
);
```

---

#### OBJECT-5: Human Validation Sync (30 minutes)

**Action:** Clone researcher OBJECT-5 workflow, update filters.

**Filter Changes:**

| Parameter | Researcher | Equipment |
|-----------|------------|-----------|
| asset_type filter | "researcher" | "equipment" |
| Qdrant collection | objects_researcher_v1 | objects_equipment_v1 |

**Validation Decision Processing:**
```cypher
// On approval
MATCH (e:FATObject:Equipment {fat_id: $fat_id})
SET e.status = "active",
    e.validated_at = datetime(),
    e.validated_by = $reviewer_id

// On correction
MATCH (e:FATObject:Equipment {fat_id: $fat_id})
MATCH (e)-[r:CLASSIFIED_AS]->(:Standard:UNSPSC)
DELETE r
// Then create new [:CLASSIFIED_AS] with corrected codes
```

---

### Day 4: GOVERN Layer + Testing

#### GOVERN-1: Asset Health Scanning (1-2 hours)

**Action:** Clone researcher GOVERN-1 workflow, update parameters.

**Parameter Changes:**

| Parameter | Researcher | Equipment |
|-----------|------------|-----------|
| scan_interval | 90 days | 180 days |
| change_signals | new_publications, affiliation_change, grant_updates | calibration_due, maintenance_status, operational_status_change |

**Change Signal Detection:**
```javascript
const changeSignals = [];

// Check calibration due (equipment-specific)
if (equipment.last_calibration_date) {
  const daysSinceCalibration = daysBetween(equipment.last_calibration_date, now());
  if (daysSinceCalibration > 365) {
    changeSignals.push({
      type: "calibration_due",
      severity: "moderate",
      days_overdue: daysSinceCalibration - 365
    });
  }
}

// Check maintenance status
if (equipment.operational_status !== previousScan.operational_status) {
  changeSignals.push({
    type: "operational_status_change",
    severity: "critical",
    previous: previousScan.operational_status,
    current: equipment.operational_status
  });
}
```

---

#### GOVERN-2: Change Severity Classification (30 minutes)

**Action:** Clone researcher GOVERN-2 workflow, update field weights.

**Weight Changes:**

| Field | Researcher Weight | Equipment Weight |
|-------|-------------------|------------------|
| Primary field | affiliation: 0.8 | operational_status: 0.9 |
| Secondary field | grants: 0.5 | calibration_status: 0.7 |
| Tertiary field | publications: 0.3 | specifications: 0.5 |
| Minor field | contact_email: 0.1 | location: 0.4 |

---

#### End-to-End Testing

**Test Sequence:**
1. Select 5 equipment items from seed dataset
2. Run through OBJECT-1 -> OBJECT-2 -> OBJECT-3 -> OBJECT-4
3. Compare OBJECT-3 output to `equipment_mapping_deakin_biofactory.csv`

**Test Items (recommended):**

| equipment_id | equipment_name | Expected UNSPSC | Complexity |
|--------------|----------------|-----------------|------------|
| EQ-001 | Iatroscan | 41115701 | multi-function |
| EQ-002 | Macfuge 260 | 40161701 | single-purpose |
| EQ-010 | FD80GP Freeze Dry | 24131604 | single-purpose |
| EQ-017 | Ethanol Extraction Unit | 41104018 | multi-function |
| EQ-029 | 10L Hydrothermal Reactor | 41103505 | multi-function |

**Validation Query:**
```cypher
MATCH (e:FATObject:Equipment)-[r:CLASSIFIED_AS]->(s:Standard:UNSPSC)
WHERE e.equipment_id IN ['EQ-001', 'EQ-002', 'EQ-010', 'EQ-017', 'EQ-029']
RETURN e.equipment_id, e.equipment_name, s.code, s.name, r.confidence
ORDER BY e.equipment_id, r.rank
```

---

## 6. Success Criteria

| Metric | Target |
|--------|--------|
| INSTANCE-1 nodes | ~1,020-1,050 Standard:UNSPSC nodes |
| INSTANCE-2 crosswalks | 948 [:MAPS_TO] relationships |
| OBJECT-1 thin objects | 33 ThinObject:Equipment nodes |
| OBJECT-2 FAT objects | 33 FATObject:Equipment nodes |
| Classification accuracy | >= 85% match with mapping CSV |
| Auto-approve rate | >= 70% route to auto_approve_queue |

---

## 7. Constraint Families Reference

Equipment uses these constraint families (CF):

| CF | Name | Equipment Application |
|----|------|----------------------|
| CF1 | Technology Readiness Level | Equipment maturity assessment |
| CF2 | Scale Constraints | bench/pilot/production alignment |
| CF4 | Temporal Constraints | Calibration currency, maintenance status |
| CF5 | Regulatory Compliance | GMP, ISO, NATA certification requirements |
| CF6 | Geographic Constraints | Inherited from hosting facility |

**Note:** CF3, CF7, CF8, CF9, CF10, CF12 are NOT enabled for equipment.

---

## 8. Reference Documents

For deeper detail, consult:

| Document | Purpose |
|----------|---------|
| equipment_instance_spec_v1_3.md | Full instance specification |
| FATEquipment_Schema_v1_3.md | Complete Neo4j/Qdrant/PostgreSQL schemas |
| equipment_workflow_reuse_analysis.md | Detailed build vs clone analysis |
| INSTANCE-1_Definition_Card_v3_5.md | Primary Standard workflow spec |
| INSTANCE-2_Definition_Card_v3_7.md | Crosswalk workflow spec |
| OBJECT-3_Definition_Card_v3_9.md | Classification workflow spec |

---

## 9. Contact

- **Architecture questions:** Wes
- **n8n implementation:** Nanven
- **Data/CSV questions:** Wes

---

## 10. Troubleshooting

### OECD FOS nodes not found
SYSTEM-1 was not completed. Run researcher instance SYSTEM-1 first, or manually create:
```cypher
CREATE (:Standard:OECD_FOS {code: "1.4", name: "Chemical Sciences", taxonomy: "oecd_fos"})
CREATE (:Standard:OECD_FOS {code: "1.6", name: "Biological Sciences", taxonomy: "oecd_fos"})
CREATE (:Standard:OECD_FOS {code: "2.4", name: "Chemical Engineering", taxonomy: "oecd_fos"})
CREATE (:Standard:OECD_FOS {code: "2.9", name: "Industrial Biotechnology", taxonomy: "oecd_fos"})
```

### Crosswalks not creating
Check that commodity nodes have `oecd_fos` property populated:
```cypher
MATCH (s:Standard:UNSPSC {level: "commodity"})
WHERE s.oecd_fos IS NULL
RETURN count(s)
```
Should return 0. If not, INSTANCE-1 didn't populate the property from CSV.

### Low classification confidence
Check dense_view quality. If LLM enrichment is producing thin outputs, the `notes` field may not have enough signal. Consider adding web scraping for manufacturer specs in OBJECT-2 enhancement phase.

---

**END OF README**
