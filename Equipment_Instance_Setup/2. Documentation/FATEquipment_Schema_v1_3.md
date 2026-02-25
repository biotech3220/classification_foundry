# FAT Equipment Schema

**Version:** 1.3  
**Date:** 30/01/2026  
**Status:** AUTHORITATIVE  
**Entity Type:** Equipment  
**Extends:** FATObject_Core_Schema_v1_5_1.md

**Alignment:**
- Classification_Foundry_Architecture_v1_3_1.md
- FATObject_Core_Schema_v1_5_1.md
- Constraint_Reasoning_Engine_Specification_v4_0_3.md
- equipment_instance_spec_v1_3.md

---

## 1. Purpose

This document defines the canonical schema for FAT Equipment objects in Neo4j, Qdrant, and PostgreSQL. Use this to verify implementation correctness.

**All properties cite their authoritative source.**

**Key Differences from FATResearcher_Schema:**
- Different relationships ([:HOSTED_BY], [:OPERATED_BY], [:ENABLES_METHOD])
- No name decomposition (equipment uses display_name only)
- Lower confidence thresholds (0.80/0.55 vs 0.85/0.65)
- Unit Operation and Process Stage on Standard nodes, not Equipment nodes
- Fewer classifications per entity (1-3 vs 3-10)

---

## 2. Data Sources

Data for FAT Equipment objects is acquired from three primary sources during OBJECT-1.

**Source:** equipment_instance_spec_v1_3.md Section 5.1

| Source | Data Provided | Priority |
|--------|---------------|----------|
| **Asset Register** | Equipment ID, name, location, operational status, facility assignment | Primary |
| **Manufacturer Website** | Specifications, capabilities, technical parameters, model details | Primary |
| **Equipment Databases** | Aggregated equipment information, comparisons | Secondary |

**Source:** OBJECT-1_Definition_Card_v3_2.md per_entity_config.equipment

| Field | Primary Source | Fallback Source |
|-------|----------------|-----------------|
| `equipment_name` | Asset Register | Manufacturer Website |
| `manufacturer` | Asset Register | Manufacturer Website |
| `model` | Asset Register | Manufacturer Website |
| `serial_number` | Asset Register | -- |
| `specifications` | Manufacturer Website | Asset Register |
| `operational_status` | Asset Register | -- |
| `location` | Asset Register | -- |
| `facility_id` | Asset Register | -- |

**Data Richness:** LOW (typically 1-2 sources per equipment item)

---

## 3. Neo4j Node Schema

### 3.1 Node Labels

```cypher
(:FATObject:Equipment)
```

**Source:** FATObject_Core_Schema_v1_5_1.md Section 2.1

### 3.2 Core Properties (all FATObjects)

**Source:** FATObject_Core_Schema_v1_5_1.md Section 2.2, OBJECT-2_Definition_Card_v3_2.md Section 4

| Property | Type | Required | Set By | Description |
|----------|------|----------|--------|-------------|
| `asset_id` | String | Yes | OBJECT-2 | Unique identifier, format: `equipment:{slug}` |
| `asset_type` | String | Yes | OBJECT-2 | Entity type: "equipment" |
| `display_name` | String | Yes | OBJECT-2 | Human-readable label (e.g., "Beckman Optima XPN-100") |
| `status` | String | Yes | OBJECT-5 | Lifecycle status: "active" |
| `version` | String | Yes | OBJECT-2 | Version identifier, e.g., "v1.0" |
| `dense_text` | String | Yes | OBJECT-2 | ICF dense view content (800-1500 tokens) |
| `lifecycle_status` | String | Yes | OBJECT-5 | Mirror of status for queries |
| `validated_at` | DateTime | Yes | OBJECT-5 | Timestamp of validation |
| `final_confidence` | Float | Yes | OBJECT-3 | Overall classification confidence (0.0-1.0) |
| `assessment_flags` | Object | Yes | OBJECT-3 | Crosswalk alignment, constraint results, warnings |
| `metadata.classified_by` | String | Yes | OBJECT-3 | Classification agent identifier |
| `metadata.classification_timestamp` | DateTime | Yes | OBJECT-3 | Timestamp when classification completed |

### 3.3 Equipment-Specific Properties

| Property | Type | Required | Set By | Description |
|----------|------|----------|--------|-------------|
| `equipment_id` | String | Recommended | OBJECT-1 | Internal asset tag / inventory ID |
| `manufacturer` | String | Yes | OBJECT-2 | Equipment manufacturer name |
| `model` | String | Yes | OBJECT-2 | Model number / designation |
| `serial_number` | String | Optional | OBJECT-1 | Serial number if available |
| `operational_status` | String | Yes | OBJECT-2 | "operational", "under_maintenance", "decommissioned" |
| `scale` | String | Yes | OBJECT-2 | "bench", "pilot", "production" |

**Note on facility:** Equipment's hosting facility is represented by the `[:HOSTED_BY]` relationship to a Facility node, not as a property on the Equipment node.

**Note on operators:** Equipment operators are represented by `[:OPERATED_BY]` relationships to Researcher nodes.

### 3.4 ALM Properties (Freshness Tracking)

**Source:** FATObject_Core_Schema_v1_5_1.md Section 3, GOVERN-1_Definition_Card_v3_8.md

| Property | Type | Required | Set By | Description |
|----------|------|----------|--------|-------------|
| `last_scanned_at` | DateTime | Yes | GOVERN-1 | Last source scan timestamp |
| `next_source_scan` | DateTime | Yes | GOVERN-1 | Scheduled next scan |
| `scan_interval` | Integer | Yes | OBJECT-5 | Days between scans (default: 180 for equipment) |
| `source_freshness_score` | Float | Yes | GOVERN-1 | 0.0-1.0 freshness indicator |
| `scan_status` | String | Yes | GOVERN-1 | "pending", "in_progress", "verified_unchanged", "changes_detected" |
| `scan_attempt_count` | Integer | Yes | GOVERN-1 | Failed scan counter |
| `creation_mode` | String | Yes | OBJECT-2 | "initial_ingest" or "refabrication" |

### 3.5 Version Management Properties

**Source:** FATObject_Core_Schema_v1_5_1.md Section 4, GOVERN-3_Definition_Card_v3_3.md

| Property | Type | Required | Set By | Description |
|----------|------|----------|--------|-------------|
| `previous_version` | String | Conditional | GOVERN-3 | Prior version ID (v2.0+) |
| `version_chain_length` | Integer | Yes | GOVERN-3 | Total versions in lineage |

### 3.6 Provenance Properties

**Source:** OBJECT-2_Definition_Card_v3_2.md Section 4

| Property | Type | Required | Set By |
|----------|------|----------|--------|
| `provenance.enriched_by` | String | Yes | OBJECT-2 |
| `provenance.enrichment_timestamp` | DateTime | Yes | OBJECT-2 |
| `provenance.source_thin_object` | String | Yes | OBJECT-2 |
| `provenance.checksum` | String | Yes | OBJECT-2 |

### 3.7 Three-View Architecture

#### 3.7.1 Dense View (Neo4j `dense_text`)

**Source:** OBJECT-2_Definition_Card_v3_2.md Section 5, equipment_instance_spec_v1_3.md Section 11

**Token Target:** 800-1500 tokens

**Required Fields (from OBJECT-2 per_entity_config.equipment):**

| Field Category | Fields | Source |
|----------------|--------|--------|
| Raw Required | equipment_name, manufacturer, model, specifications | OBJECT-1 via OBJECT-2 |
| Enriched Required | capabilities, applications, operational_parameters | OBJECT-2 enrichment |
| Enriched Recommended | maintenance_history, calibration_status | OBJECT-2 enrichment |

**dense_text Structure:**

```
EQUIPMENT: {display_name}
MANUFACTURER: {manufacturer}
MODEL: {model}

SPECIFICATIONS:
{raw_specifications_preserved}

CAPABILITIES:
{capabilities_list}

APPLICATIONS:
{applications_list}

OPERATIONAL PARAMETERS:
{operational_parameters}

SCALE: {scale}
OPERATIONAL STATUS: {operational_status}
```

**Critical:** Pass 2 enrichment ADDS context; it does NOT replace source data.

#### 3.7.2 Embedding View (Qdrant)

**Source:** OBJECT-2_Definition_Card_v3_2.md Section 5

Stored in Qdrant collection: `objects_equipment_v1`

| Component | Type | Value | Source |
|-----------|------|-------|--------|
| Vector | Float[768] | -- | OBJECT-2 |
| `asset_id` | String | -- | OBJECT-2 |
| `status` | String | "active" | OBJECT-2 |
| `entity_type` | String | "equipment" | OBJECT-2 |
| `classifications` | Array | UNSPSC codes | OBJECT-3 |
| `standard_b_codes` | Array | OECD codes | OBJECT-3 |
| `scale` | String | bench/pilot/production | OBJECT-2 |
| `operational_status` | String | -- | OBJECT-2 |

**Token target:** 300-600 tokens (condensed from dense view)

#### 3.7.3 Graph View (Neo4j)

**Source:** OBJECT-2_Definition_Card_v3_2.md Section 5

Stored as relationships from the FATObject node.

| Relationship | Target | Set By | Description |
|--------------|--------|--------|-------------|
| `[:CLASSIFIED_AS]` | Standard:UNSPSC node | OBJECT-3, OBJECT-5 | Classification assignments |
| `[:FABRICATED_FROM]` | ThinObject node | OBJECT-2 | Audit trail to source |
| `[:HOSTED_BY]` | Facility node | OBJECT-2 | Hosting facility |
| `[:OPERATED_BY]` | Researcher node | OBJECT-2 | Equipment operators |
| `[:ENABLES_METHOD]` | Method node | OBJECT-2 | Methods this equipment supports |
| `[:HAS_SIGNAL]` | Signal node | All workflows | Audit event trail |
| `[:SUPERSEDES]` | Prior FATObject version | GOVERN-3 | Version lineage chain |

**Facility relationship pattern:**

```cypher
(e:Equipment:FATObject {asset_id: "equipment:centrifuge-001", display_name: "Beckman Optima XPN-100"})
  -[:HOSTED_BY]->
(f:Facility:FATObject {asset_id: "facility:deakin-geelong-lab", display_name: "Deakin Geelong Laboratory"})
```

---

## 4. [:CLASSIFIED_AS] Relationship Schema

Each FATObject has multiple [:CLASSIFIED_AS] relationships to Standard nodes.

**Source:** OBJECT-3_Definition_Card_v3_9.md Section 4, OBJECT-5_Definition_Card_v3_6.md Section 4

| Property | Type | Required | Set By | Description |
|----------|------|----------|--------|-------------|
| `confidence` | Float | Yes | OBJECT-3 | Classification confidence (0.0-1.0) |
| `tier` | String | Yes | OBJECT-3 | "primary" only for equipment (1-3 codes) |
| `evidence` | Array | Yes | OBJECT-3 | Supporting evidence strings |
| `reasoning` | String | Yes | OBJECT-3 | LLM reasoning for classification |
| `constraint_flags` | Array | Yes | OBJECT-3 | Constraint assessments applied |
| `validation_state` | String | Yes | OBJECT-5 | "PENDING", "VALIDATED", "REJECTED" |
| `validated_at` | DateTime | Yes | OBJECT-5 | Validation timestamp |
| `validated_by` | String | Yes | OBJECT-5 | "human" or "auto" |

**Values:**
- `confidence`: 0.0-1.0
- `tier`: "primary" (equipment typically has 1-3 primary codes only)
- `validation_state`: "VALIDATED"
- `validated_by`: "auto" or curator_id

**Confidence Thresholds (Equipment-Specific):**

| Threshold | Value | Routing Destination |
|-----------|-------|---------------------|
| Auto-approve | >= 0.80 | auto_approve_queue |
| Human review | 0.55-0.80 | human_review_queue |
| Rejection | < 0.55 | reject_queue |

---

## 5. Standard Node Schema (UNSPSC)

Standard nodes represent classification codes that FATObjects are classified against.

**Source:** INSTANCE-1_Definition_Card_v3_5.md per_entity_config.equipment, equipment_instance_spec_v1_3.md Section 4

### 5.1 Node Labels

```cypher
(:Standard:UNSPSC)
```

### 5.2 Standard Node Properties

| Property | Type | Required | Set By | Description |
|----------|------|----------|--------|-------------|
| `code` | String | Yes | INSTANCE-1 | UNSPSC code (e.g., "41121509") |
| `name` | String | Yes | INSTANCE-1 | Code name (e.g., "Ultracentrifuges") |
| `taxonomy` | String | Yes | INSTANCE-1 | "unspsc" |
| `level` | String | Yes | INSTANCE-1 | "segment", "family", "class", "commodity" |
| `segment` | String | Yes | INSTANCE-1 | Top-level category |
| `family` | String | Yes | INSTANCE-1 | Second-level category |
| `class` | String | Optional | INSTANCE-1 | Third-level category |
| `commodity` | String | Optional | INSTANCE-1 | Fourth-level category |
| `unit_operation` | String | Yes | INSTANCE-1 | Process function using vocabulary ID |
| `oecd_fos` | String | Yes | INSTANCE-1 | OECD FOS code derived from unit operation |

### 5.3 Unit Operation Values (Vocabulary IDs)

**Source:** equipment_instance_spec_v1_3.md Section 4.2, unit_operations_vocabulary.yaml

Unit operations use exact vocabulary IDs, not ad-hoc terms:

| Unit Operation (Vocabulary ID) | Description | Example Equipment | OECD FOS |
|-------------------------------|-------------|-------------------|----------|
| `solid_liquid_separation` | Physical separation of solids from liquids | Centrifuges, filters | 2.4 |
| `membrane_separation` | Membrane-based separation | Membrane filters, UF/MF | 2.4 |
| `chromatography` | Chromatographic separation | HPLC, GC | 1.4 |
| `mixing` | Combining materials | Mixers, homogenisers | 2.4 |
| `homogenisation` | High-shear mixing | Homogenisers | 2.4 |
| `heating` | Thermal processing | Ovens, autoclaves | 2.4 |
| `cooling` | Temperature reduction | Refrigerators, freezers | 2.4 |
| `drying` | Moisture removal | Ovens, spray dryers | 2.4 |
| `freeze_drying` | Lyophilisation | Freeze dryers | 2.9 |
| `size_reduction` | Particle size reduction | Mills, grinders | 2.4 |
| `composition_analysis` | Chemical composition measurement | Spectrophotometers | 1.4 |
| `structural_analysis` | Structural characterisation | Mass spectrometers | 1.4 |
| `lipid_analysis` | Lipid profiling | TLC-FID, GC | 1.4 |
| `fibre_analysis` | Fibre characterisation | Fibre analysers | 1.4 |
| `microbial_analysis` | Microbiological analysis | Incubators, counters | 1.6 |
| `cell_culture` | Cell cultivation | Bioreactors, incubators | 1.6 |
| `fermentation` | Microbial fermentation | Fermenters | 2.9 |
| `chemical_reaction` | Chemical transformation | Reactors | 2.4 |
| `extraction` | Compound extraction | Extractors, SPE | 2.4 |
| `evaporation` | Solvent evaporation | Rotary evaporators | 2.4 |
| `pumping` | Fluid transfer | Pumps | 2.4 |
| `storage` | Material storage | Storage units | 2.4 |
| `conveying` | Material handling | Conveyors, forklifts | 2.4 |
| `packaging` | Product packaging | Packaging equipment | 2.4 |
| `waste_treatment` | Waste processing | Waste treatment systems | 2.4 |
| `formulation` | Product formulation | Forming equipment | 2.9 |
| `sieving` | Particle size separation | Sieve shakers | 2.4 |
| `pretreatment` | Biomass pretreatment | Hydrothermal reactors | 2.4 |

### 5.4 OECD FOS Derivation

**Source:** equipment_instance_spec_v1_3.md Section 4.2

OECD FOS is derived from the unit operation's `oecd_fos_primary` field in the vocabulary:

| OECD FOS | Field | Unit Operations |
|----------|-------|-----------------|
| 1.4 | Chemical Sciences | chromatography, composition_analysis, lipid_analysis, structural_analysis, fibre_analysis |
| 1.6 | Biological Sciences | microbial_analysis, cell_culture |
| 2.4 | Chemical Engineering | solid_liquid_separation, drying, pumping, heating, cooling, mixing, evaporation, extraction, (most processing) |
| 2.9 | Industrial Biotechnology | fermentation, freeze_drying, encapsulation, formulation |

**Distribution in Filtered Set (948 codes):**

| OECD FOS | Count | Percentage |
|----------|-------|------------|
| 1.4 | 268 | 28.3% |
| 1.6 | 48 | 5.1% |
| 2.4 | 607 | 64.0% |
| 2.9 | 25 | 2.6% |

### 5.5 Process Stage Values

| Process Stage | Description |
|---------------|-------------|
| `pre-treatment` | Biomass preparation, cleaning |
| `extraction` | Active compound extraction |
| `purification` | Compound isolation and purification |
| `formulation` | Final product formulation |
| `analysis` | Quality control and characterisation |
| `storage` | Material storage and preservation |

**Critical:** Unit Operation and Process Stage are properties of the Standard node, NOT the Equipment node. Equipment inherits these via the [:CLASSIFIED_AS] relationship.

---

## 6. PostgreSQL Schema

### 6.1 validation_queue

**Source:** Validation_Queue_Specification_v1_5.md Section 3

Key fields for equipment verification:

| Field | Type | Set By | Description |
|-------|------|--------|-------------|
| `asset_id` | VARCHAR(255) | OBJECT-4 | Equipment asset ID |
| `asset_type` | VARCHAR(50) | OBJECT-4 | "equipment" |
| `confidence` | DECIMAL(5,4) | OBJECT-3 (copied by OBJECT-4) | Final confidence score |
| `assessment_flags` | JSONB | OBJECT-4 | Constraint results, warnings |
| `queue_type` | VARCHAR(50) | OBJECT-4 | "auto_approve", "human_review", "reject" |
| `synced` | BOOLEAN | OBJECT-5 | Sync completion flag |
| `created_at` | TIMESTAMP | OBJECT-4 | Queue entry timestamp |
| `synced_at` | TIMESTAMP | OBJECT-5 | Sync completion timestamp |

### 6.2 Equipment-Specific PostgreSQL Fields

| Field | Type | Set By | Description |
|-------|------|--------|-------------|
| `operational_status` | VARCHAR(50) | OBJECT-2 | Current operational state |
| `calibration_due_date` | DATE | OBJECT-2 | Next calibration date |
| `last_maintenance_date` | DATE | OBJECT-2 | Last maintenance timestamp |
| `facility_id` | VARCHAR(255) | OBJECT-2 | Hosting facility reference |

---

## 7. Verification Queries

### 7.1 Verify FATObject Node

```cypher
MATCH (e:FATObject:Equipment {asset_id: $asset_id})
RETURN e.asset_id, e.display_name, e.status, e.manufacturer, e.model, e.scale
```

### 7.2 Verify Classifications

```cypher
MATCH (e:FATObject:Equipment {asset_id: $asset_id})-[r:CLASSIFIED_AS]->(s:Standard:UNSPSC)
RETURN s.code, s.name, r.confidence, r.tier, r.validation_state, s.unit_operation, s.oecd_fos
ORDER BY r.confidence DESC
```

### 7.3 Verify Relationships

```cypher
MATCH (e:FATObject:Equipment {asset_id: $asset_id})
OPTIONAL MATCH (e)-[:HOSTED_BY]->(f:Facility)
OPTIONAL MATCH (e)-[:OPERATED_BY]->(r:Researcher)
OPTIONAL MATCH (e)-[:FABRICATED_FROM]->(t:ThinObject)
RETURN e.asset_id, f.display_name as facility, collect(DISTINCT r.display_name) as operators, t.asset_id as thin_object
```

### 7.4 Verify Qdrant Entry

```python
# Python verification
result = qdrant_client.retrieve(
    collection_name="objects_equipment_v1",
    ids=[asset_id],
    with_payload=True
)
assert result[0].payload["entity_type"] == "equipment"
assert result[0].payload["status"] == "active"
assert len(result[0].payload["classifications"]) >= 1
```

### 7.5 Verify ALM Properties

```cypher
MATCH (e:FATObject:Equipment {asset_id: $asset_id})
WHERE e.status = 'active'
RETURN e.asset_id, e.last_scanned_at, e.next_source_scan, e.scan_interval, e.source_freshness_score, e.scan_status
```

### 7.6 Verify Version Chain

```cypher
MATCH (e:FATObject:Equipment {asset_id: $asset_id})-[:SUPERSEDES*]->(prev:FATObject)
RETURN e.version, collect(prev.version) as previous_versions, e.version_chain_length
```

### 7.7 Verify Constraint Assessment

```cypher
MATCH (e:FATObject:Equipment {asset_id: $asset_id})
RETURN e.assessment_flags.constraint_results as constraints,
       e.assessment_flags.blocking_failures as blocking,
       e.assessment_flags.penalising_failures as penalising
```

### 7.8 Verify Unit Operation Inheritance

```cypher
// Find all unit operations available through this equipment
MATCH (e:FATObject:Equipment {asset_id: $asset_id})-[:CLASSIFIED_AS]->(s:Standard:UNSPSC)
RETURN e.display_name, collect(DISTINCT s.unit_operation) as unit_operations
```

### 7.9 Find Equipment by Unit Operation

```cypher
// Find all equipment capable of solid_liquid_separation
MATCH (e:Equipment:FATObject)-[:CLASSIFIED_AS]->(s:Standard:UNSPSC)
WHERE s.unit_operation = 'solid_liquid_separation'
RETURN e.display_name, e.asset_id, s.code, s.name
```

### 7.10 Cross-Domain Equipment Discovery via OECD FOS

```cypher
// Find equipment in Chemical Sciences domain
MATCH (e:Equipment:FATObject)-[:CLASSIFIED_AS]->(s:Standard:UNSPSC)
WHERE s.oecd_fos = '1.4'
RETURN e.display_name, s.code, s.name, s.unit_operation
ORDER BY s.unit_operation
```

---

## 8. Constraint Assessment Schema

**Source:** Constraint_Reasoning_Engine_Specification_v4_0_3.md, equipment_instance_spec_v1_3.md Section 3.2

Equipment uses 5 constraint families:

| CF | Name | Assessment Purpose |
|----|------|-------------------|
| CF1 | Technology Readiness Level (TRL) | Equipment maturity (TRL 1-9) |
| CF2 | Scale Constraints | Bench/pilot/production alignment |
| CF4 | Temporal Constraints | Calibration currency, maintenance status |
| CF5 | Regulatory Compliance | GMP, ISO, NATA certification |
| CF6 | Geographic Constraints | Location-based requirements (inherited from facility) |

**assessment_flags Structure:**

```json
{
  "crosswalk_alignment": 0.87,
  "constraint_results": {
    "CF1": {"status": "pass", "value": "TRL 9", "evidence": "Commercial product"},
    "CF2": {"status": "pass", "value": "bench", "evidence": "Laboratory-scale equipment"},
    "CF4": {"status": "pass", "value": "current", "evidence": "Calibration valid until 2026-06-15"},
    "CF5": {"status": "pass", "value": "compliant", "evidence": "ISO 17025 laboratory"},
    "CF6": {"status": "pass", "value": "Victoria, Australia", "evidence": "Geelong campus"}
  },
  "blocking_failures": [],
  "penalising_failures": [],
  "requires_hitl": false,
  "warnings": []
}
```

---

## 9. Example: Validated Equipment Object

```json
{
  "asset_id": "equipment:ultracentrifuge-001",
  "asset_type": "equipment",
  "display_name": "Beckman Optima XPN-100 Ultracentrifuge",
  "status": "active",
  "version": "v1.0",
  "lifecycle_status": "active",
  "validated_at": "2026-01-30T14:00:00Z",
  
  "manufacturer": "Beckman Coulter",
  "model": "Optima XPN-100",
  "equipment_id": "DEA-LAB-UC-001",
  "serial_number": "XPN10012345",
  "operational_status": "operational",
  "scale": "bench",
  
  "final_confidence": 0.91,
  "assessment_flags": {
    "crosswalk_alignment": 0.87,
    "constraint_results": {
      "CF1": {"status": "pass", "value": "TRL 9"},
      "CF2": {"status": "pass", "value": "bench"},
      "CF4": {"status": "pass", "value": "current"},
      "CF5": {"status": "pass", "value": "compliant"},
      "CF6": {"status": "pass", "value": "Victoria, Australia"}
    },
    "blocking_failures": [],
    "penalising_failures": [],
    "requires_hitl": false,
    "warnings": []
  },
  "metadata": {
    "classified_by": "ClassificationAgent_v1.0",
    "classification_timestamp": "2026-01-30T13:55:00Z"
  },
  
  "last_scanned_at": "2026-01-30T14:00:00Z",
  "next_source_scan": "2026-07-29T14:00:00Z",
  "scan_interval": 180,
  "source_freshness_score": 1.0,
  "scan_status": "verified_unchanged",
  "scan_attempt_count": 0,
  "creation_mode": "initial_ingest",
  
  "dense_text": "EQUIPMENT: Beckman Optima XPN-100 Ultracentrifuge\nMANUFACTURER: Beckman Coulter\nMODEL: Optima XPN-100\n\nSPECIFICATIONS:\nMaximum speed: 100,000 RPM\nMaximum RCF: 802,000 x g\nRotor capacity: Various (fixed angle, swinging bucket)\nTemperature range: 0-40C\nRefrigeration: CFC-free\n\nCAPABILITIES:\n- High-speed centrifugation\n- Ultracentrifugation\n- Density gradient separation\n- Analytical ultracentrifugation\n\nAPPLICATIONS:\n- Protein purification\n- Virus concentration\n- Subcellular fractionation\n- Lipoprotein separation\n\nOPERATIONAL PARAMETERS:\nMax RPM: 100,000\nMax RCF: 802,000 x g\nTemp range: 0-40C\n\nSCALE: bench\nOPERATIONAL STATUS: operational",
  
  "provenance": {
    "enriched_by": "FabricationAgent_v1.0",
    "enrichment_timestamp": "2026-01-30T13:45:00Z",
    "source_thin_object": "equipment:ultracentrifuge-001:thin",
    "checksum": "sha256:abc123..."
  }
}
```

**Graph Structure:**

```cypher
(e:Equipment:FATObject {
  asset_id: "equipment:ultracentrifuge-001",
  display_name: "Beckman Optima XPN-100 Ultracentrifuge",
  asset_type: "equipment",
  status: "active",
  manufacturer: "Beckman Coulter",
  model: "Optima XPN-100"
})

(e)-[:FABRICATED_FROM]->(t:ThinObject {asset_id: "equipment:ultracentrifuge-001:thin"})
(e)-[:CLASSIFIED_AS {confidence: 0.94, tier: "primary"}]->(:Standard:UNSPSC {code: "40161701", name: "Centrifuges", unit_operation: "solid_liquid_separation", oecd_fos: "2.4"})
(e)-[:HOSTED_BY]->(:Facility:FATObject {asset_id: "facility:deakin-geelong-lab"})
(e)-[:HAS_SIGNAL]->(:Signal {signal_type: "FABRICATION_COMPLETE"})
```

---

## 10. Reconciliation Checklist

Use this to compare implementation against this schema:

| Check | Schema Says | Implementation Has | Match? |
|-------|-------------|-------------------|--------|
| Dense view property name | `dense_text` | | |
| Display name property | `display_name` | | |
| Equipment-specific properties | `manufacturer`, `model`, `equipment_id`, `operational_status`, `scale` | | |
| Facility modelling | [:HOSTED_BY] relationship | | |
| Operator modelling | [:OPERATED_BY] relationship | | |
| Method linkage | [:ENABLES_METHOD] relationship | | |
| Core properties | asset_id, asset_type, display_name, status, version, lifecycle_status, validated_at | | |
| Classification properties | `final_confidence`, `assessment_flags` on node | | |
| Classification metadata | `metadata.classified_by`, `metadata.classification_timestamp` | | |
| Provenance nested | provenance.enriched_by, provenance.enrichment_timestamp, etc. | | |
| [:CLASSIFIED_AS] has constraint_flags | Yes | | |
| [:CLASSIFIED_AS] has tier | Yes (all "primary" for equipment) | | |
| Qdrant collection name | objects_equipment_v1 | | |
| ALM: last_scanned_at | Present on active objects | | |
| ALM: next_source_scan | Present on active objects | | |
| ALM: source_freshness_score | Present on active objects | | |
| ALM: scan_status | Present on active objects | | |
| ALM: scan_interval | Present (default 180 for equipment) | | |
| ALM: creation_mode | `initial_ingest` or `refabrication` | | |
| Version: [:SUPERSEDES] | Present for v2.0+ objects | | |
| Version: previous_version | Present for v2.0+ objects | | |
| Unit Operation | On Standard node, NOT Equipment node | | |
| Process Stage | On Standard node, NOT Equipment node | | |
| Unit Operation uses vocabulary ID | e.g., `solid_liquid_separation` not `centrifuge` | | |
| OECD FOS derived from unit operation | e.g., 1.4, 1.6, 2.4, 2.9 | | |
| Confidence thresholds | auto_approve: 0.80, human_review: 0.55 | | |

---

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| FATObject_Core_Schema_v1_5_1.md | Core schema (this extends) |
| equipment_instance_spec_v1_3.md | Instance configuration |
| OBJECT-1_Definition_Card_v3_2.md | Data ingestion workflow |
| OBJECT-2_Definition_Card_v3_2.md | Fabrication workflow |
| OBJECT-3_Definition_Card_v3_9.md | Classification workflow |
| OBJECT-4_Definition_Card_v3_5.md | Routing workflow (consumes final_confidence, assessment_flags) |
| OBJECT-5_Definition_Card_v3_6.md | Validation workflow |
| INSTANCE-1_Definition_Card_v3_5.md | Primary Standard fabrication (UNSPSC) |
| INSTANCE-2_Definition_Card_v3_7.md | Crosswalk fabrication (UNSPSC <-> OECD) |
| GOVERN-1_Definition_Card_v3_8.md | Asset health scanning (sets ALM properties) |
| GOVERN-2_Definition_Card_v3_4.md | Change severity classification |
| GOVERN-3_Definition_Card_v3_3.md | Re-fabrication orchestration (sets version properties) |
| GOVERN-4_Definition_Card_v3_4.md | Registry health governance |
| FAT_Object_Governance_Specification_v1_3.md | Governance layer architecture |
| FAT_Object_Lifecycle_Architecture_v1_6.md | ALM architectural patterns |
| Signal_Specification_v1_3_4.md | Signal types and storage |
| Validation_Queue_Specification_v1_5.md | PostgreSQL queue schema |
| Constraint_Reasoning_Engine_Specification_v4_0_3.md | Constraint families |
| unspsc_filtered_marine_bioproducts.csv | Filtered UNSPSC codes (948) |
| unit_operations_vocabulary.yaml | Unit operation vocabulary definitions |

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.3 | 30/01/2026 | Aligned with UNSPSC Domain Filter v1.1 output (948 codes); expanded Section 5.3 with full unit operations vocabulary; added Section 5.4 with OECD FOS derivation and distribution; added verification queries 7.9-7.10 for unit operation and cross-domain discovery; updated all Standard node examples to include oecd_fos property |
| 1.2 | 29/01/2026 | Generated via Instance Factory skill; validated against reference_index.yaml v1.1; added comprehensive constraint assessment schema (Section 8); expanded Unit Operation and Process Stage values; added verification queries for unit operation inheritance; updated all document references to current versions |
| 1.1 | 15/01/2026 | Added Unit Operation and Process Stage pattern; clarified Standard node enrichment; added constraint families |
| 1.0 | 10/01/2026 | Initial equipment schema specification |

---

**END OF SCHEMA**
