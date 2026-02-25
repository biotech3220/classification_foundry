# Equipment Classification Instance Specification v1.3

**Version:** 1.3  
**Date:** 30/01/2026  
**Status:** AUTHORITATIVE  
**Owner:** Wes Ward (Classification Foundry Architect)  
**Modelled After:** researcher_instance_spec_v2_3.md

**Alignment:**
- Classification_Foundry_Architecture_v1_3_1.md
- FATObject_Core_Schema_v1_5_1.md
- Constraint_Reasoning_Engine_Specification_v4_0_3.md

---

## 1. Purpose

This document defines the **Equipment Classification Instance**, the second full implementation of the FAT5 framework. It describes how the SYSTEM layer (Domain Standard + Constraints) combines with the INSTANCE layer (Primary Standard + Crosswalks) to classify **equipment** using the OBJECT workflow pipeline.

Equipment classification enables the Physical capability component of the Capability Triad (Human + Physical + Intellectual), supporting cross-entity capability assembly with researchers, methods, and facilities.

**Key differences from Researcher instance:**
- Lower confidence thresholds (0.80/0.55 vs 0.85/0.65) due to thin source data
- Fewer classifications per entity (1-3 vs 3-10) given equipment specificity
- Unit Operation and Process Stage stored on Standard nodes, not Equipment nodes
- Different constraint families (CF1, CF2, CF4, CF5, CF6 vs CF1, CF4, CF7, CF9, CF12)

---

## 2. Instance Definition

A Classification Instance is defined as:

```
INSTANCE = FAT5(Object, Standard, DomainStandard, Crosswalk, Constraints)
```

For equipment:

- **FAT Object:** Equipment (thin -> enriched)
- **FAT Standard (Primary):** UNSPSC (curated subset, 948 codes from 4 segments)
- **FAT Domain Standard:** OECD Fields of Science 2007
- **FAT Crosswalk:** UNSPSC <-> OECD mappings (validated set)
- **FAT Constraints:** CRE Families (CF1, CF2, CF4, CF5, CF6)

---

## 3. SYSTEM Layer (Inherited)

### 3.1 Domain Standard

- **OECD Fields of Science 2007**
- Acts as the *ecosystem hub* for all entity types (researchers, equipment, methods, grants).
- Enables cross-entity reasoning (Human + Physical + Intellectual capability triads).
- Equipment inherits domain context via crosswalk mappings.

### 3.2 Constraints

- CRE v4.0.3 governs global constraint rules.
- Relevant CFs for equipment include:
  - **CF1:** Technology Readiness Level (TRL) -- equipment maturity assessment
  - **CF2:** Scale Constraints -- bench/pilot/production alignment
  - **CF4:** Temporal Constraints -- calibration currency, maintenance status
  - **CF5:** Regulatory Compliance -- GMP, ISO, NATA certification requirements
  - **CF6:** Geographic Constraints -- inherited from hosting facility

These constraints prevent invalid capability assembly and ensure operational readiness verification.

---

## 4. INSTANCE Layer (Equipment-Specific)

### 4.1 Primary Standard: UNSPSC (Curated Subset)

- **United Nations Standard Products and Services Code**
- Hierarchical (Segment -> Family -> Class -> Commodity)
- Curated subset of **948 codes** from **4 segments**, filtered via UNSPSC Domain Filter Skill v1.1:

| Segment | Segment Name | Codes | Rationale |
|---------|--------------|-------|-----------|
| 23 | Industrial Manufacturing and Processing Machinery | 64 | Processing equipment for extraction, separation, drying |
| 24 | Material Handling and Conditioning and Storage | 92 | Storage, refrigeration, material handling for biomass |
| 40 | Distribution and Conditioning Systems | 136 | Pumps, filtration, fluid handling systems |
| 41 | Laboratory and Measuring Equipment | 656 | Lab-scale equipment, analytical instruments, QC |

**Families Selected (13 total):**

| Family | Family Name | Codes | Unit Operations Served |
|--------|-------------|-------|------------------------|
| 23150000 | Industrial process machinery | 35 | size_reduction, mixing, drying, extraction |
| 23180000 | Industrial food and beverage equipment | 11 | fermentation, pasteurisation, homogenisation |
| 23190000 | Mixers and their parts | 9 | mixing |
| 23200000 | Mass transfer equipment | 9 | distillation, evaporation, crystallisation |
| 24100000 | Material handling machinery | 42 | conveying, storage |
| 24110000 | Containers and storage | 25 | storage |
| 24130000 | Industrial refrigeration | 25 | cooling, freeze_drying |
| 40140000 | Fluid and gas distribution | 12 | pumping, gas_compression |
| 40150000 | Industrial pumps and compressors | 118 | pumping, gas_compression, aeration |
| 40160000 | Industrial filtering and purification | 5 | solid_liquid_separation, membrane_separation |
| 41100000 | Laboratory and scientific equipment | 230 | All analytical, reaction, separation operations |
| 41110000 | Measuring and testing instruments | 395 | composition_analysis, structural_analysis, process_monitoring |
| 41120000 | Laboratory supplies and fixtures | 31 | Various support operations |

### 4.2 Unit Operations Vocabulary

Unit Operations are assigned using vocabulary IDs from `unit_operations_vocabulary.yaml`. This provides semantic connective tissue between equipment categories, research fields, and transformation functions.

**Vocabulary Discipline:**

| Correct (vocabulary ID) | Incorrect (ad-hoc term) |
|-------------------------|-------------------------|
| `solid_liquid_separation` | `centrifuge`, `filter` |
| `chromatography` | `chromatograph`, `hplc` |
| `freeze_drying` | `freeze dryer`, `lyophiliser` |
| `homogenisation` | `homogenizer` |
| `fibre_analysis` | `analyser` |
| `size_reduction` | `mill`, `grinder` |

**OECD FOS Derivation:**

OECD FOS codes are derived from the vocabulary's `oecd_fos_primary` field for each unit operation, not defaulted to 2.4:

| Unit Operation | OECD FOS | Field |
|----------------|----------|-------|
| chromatography | 1.4 | Chemical Sciences |
| composition_analysis | 1.4 | Chemical Sciences |
| lipid_analysis | 1.4 | Chemical Sciences |
| structural_analysis | 1.4 | Chemical Sciences |
| microbial_analysis | 1.6 | Biological Sciences |
| cell_culture | 1.6 | Biological Sciences |
| fermentation | 2.9 | Industrial Biotechnology |
| freeze_drying | 2.9 | Industrial Biotechnology |
| encapsulation | 2.9 | Industrial Biotechnology |
| formulation | 2.9 | Industrial Biotechnology |
| solid_liquid_separation | 2.4 | Chemical Engineering |
| drying | 2.4 | Chemical Engineering |
| pumping | 2.4 | Chemical Engineering |
| (most processing operations) | 2.4 | Chemical Engineering |

**OECD FOS Distribution in Filtered Set:**

| OECD FOS | Field | Count | Percentage |
|----------|-------|-------|------------|
| 1.4 | Chemical Sciences | 268 | 28.3% |
| 1.6 | Biological Sciences | 48 | 5.1% |
| 2.4 | Chemical Engineering | 607 | 64.0% |
| 2.9 | Industrial Biotechnology | 25 | 2.6% |

### 4.3 Enrichment on Standard Nodes

- `unit_operation`: Process function (e.g., "solid_liquid_separation", "drying", "extraction")
- `process_stage`: Biorefinery position (e.g., "pre-treatment", "extraction", "purification")

**Critical:** Unit Operation and Process Stage are properties of the FAT Standard (UNSPSC) node, NOT the FAT Equipment node. Equipment inherits these attributes via the [:CLASSIFIED_AS] relationship.

### 4.4 Crosswalks: UNSPSC <-> OECD

- Crosswalk entries include:
  - UNSPSC code <-> OECD discipline
  - Confidence score
  - Provenance metadata
  - Assessment status (draft, proposed, validated)
- These crosswalks enable **dual-standard classification**, connecting equipment to research domains.
- Example: UNSPSC 41121500 (Centrifuges) -> OECD 2.4 (Chemical Engineering)

### 4.5 Instance Behaviour

- Equipment typically maps to **1-3 UNSPSC codes** (most equipment is specific-purpose).
- Classification count is based on equipment complexity:

| Equipment Complexity | Expected Code Count | Rationale |
|---------------------|---------------------|-----------|
| Single-purpose | 1 code | Dedicated function (e.g., pH meter) |
| Multi-function | 2 codes | Multiple capabilities (e.g., spectrophotometer) |
| Platform/System | 2-3 codes | Integrated capabilities (e.g., HPLC system) |

- Only codes with confidence >= 0.60 are assigned.
- Crosswalk normalisation always produces **at least one OECD code**.
- Constraints assess operational readiness (TRL, scale, regulatory compliance).

---

## 5. OBJECT Layer (Operational Workflows)

Equipment is processed through the **five workflow pipeline**.

### 5.1 OBJECT-1: Data Ingestion

- **Sources:**
  - Asset Register (CSV/API) -- primary source for institutional equipment
  - Manufacturer Website (web scraping) -- specifications, capabilities
  - Equipment Databases (if available) -- aggregated equipment information
- **Data Richness:** LOW (typically 1-2 sources per item)
- **Enrichment Strategy:** Web scraping + LLM inference
- Produces a **ThinObject** containing identifiers and raw data.

**Expected Fields:**
- equipment_id (internal asset tag)
- equipment_name
- manufacturer
- model
- serial_number (if available)
- location / facility
- specifications (raw)
- operational_status

### 5.2 OBJECT-2: Object Fabrication

- Transforms ThinObject into enriched FATObject via 4-pass enrichment:
  - **Pass 1 (Structural):** Normalise specifications, extract key parameters
  - **Pass 2 (Contextual):** LLM-generated capabilities, applications, domain alignment
  - **Pass 3 (Relational):** Link to facility, operators, methods
  - **Pass 4 (Canonical):** Generate dense, embedding, and graph views
- Produces a **FAT Object** representing the equipment.
- Uses enrichment prompt (see Section 11).
- **Critical:** Raw specifications MUST be preserved in dense_view alongside LLM-enriched context.

### 5.3 OBJECT-3: Classification & Assessment

- **Hybrid Retrieval:** Vector search + graph traversal + keyword matching against UNSPSC.
- **LLM Classification:** Maps enriched signals -> candidate UNSPSC codes using classification prompt (see Section 10).
- **Crosswalk Assessment:** UNSPSC -> OECD mapping.
- **Constraint Assessment:** CRE applies CF1, CF2, CF4, CF5, CF6.

**Outputs:**
- Ranked UNSPSC list (1-3 codes)
- Normalised OECD codes
- Constraint assessment report
- Final confidence score

### 5.4 OBJECT-4: Confidence-Based Routing

- **High confidence (>= 0.80)** -> auto-approve queue
- **Medium confidence (0.55 - 0.80)** -> human-review queue
- **Low confidence (< 0.55)** -> rejection queue

**Note:** Lower thresholds than Researcher instance acknowledge thin source data reality.

### 5.5 OBJECT-5: Human Validation

- Reviewer confirms or corrects classifications.
- Produces **validated FAT Object**.
- Validated outputs feed Crosswalk and CRE improvements.

---

## 6. GOVERN Layer (Lifecycle Management)

Equipment requires ongoing lifecycle management to maintain classification accuracy.

### 6.1 GOVERN-1: Asset Health Scanning

- **Scan Interval:** 180 days (default for equipment)
- **Change Signals:**
  - calibration_due
  - maintenance_status
  - operational_status_change
- **Priority Rules:** Critical equipment scanned more frequently

### 6.2 GOVERN-2: Change Severity Classification

- **Field Weights:**
  - operational_status: 0.9 (critical change)
  - calibration_status: 0.7 (major change)
  - specifications: 0.5 (moderate change)
  - location: 0.4 (moderate change)

### 6.3 GOVERN-3: Re-Fabrication Orchestration

- Orchestrates new FATObject versions through OBJECT pipeline.
- Entity-agnostic -- uses same orchestration logic as Researcher instance.

### 6.4 GOVERN-4: Registry Health Governance

- Monitors equipment freshness distribution.
- Tracks calibration compliance rates.
- Entity-agnostic monitoring logic.

---

## 7. Data Structures

This instance uses:
- FAT Object schema (equipment-specific extensions)
- FAT Standard (UNSPSC) schema with unit operation enrichment
- Crosswalk record schema (UNSPSC <-> OECD)
- Constraint evaluation schema (CF output bundle)

---

## 8. Instance Outputs

Each validated equipment item produces:
- FAT Object (validated)
- Primary classification (UNSPSC codes) with ranking and tier
- Domain classification (OECD) normalised via crosswalk
- Constraint evaluation summary
- Unit operation inheritance via [:CLASSIFIED_AS] relationship

These feed into:
- Capability mapping (Physical assets)
- Cross-entity capability assembly (H+P+I)
- Method-Equipment linkage via shared unit operations
- Facility capability aggregation

---

## 9. Configuration Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Primary Standard | UNSPSC (curated subset) | 948 codes from 4 segments, 13 families |
| Domain Standard | OECD FOS 2007 | 4 FOS codes via unit operation derivation |
| Min Classification Count | 1 | Equipment typically single-purpose |
| Max Classification Count | 3 | Prevents over-classification |
| Min Code Confidence | 0.60 | Individual code threshold |
| Min Average Confidence | 0.65 | Overall classification quality |
| Auto-Approve Threshold | 0.80 | Routes to auto_approve_queue |
| Human Review Range | 0.55-0.80 | Routes to human_review_queue |
| Rejection Threshold | < 0.55 | Routes to reject_queue |
| Constraint Families | CF1, CF2, CF4, CF5, CF6 | Equipment-specific subset |
| Scan Interval | 180 days | Equipment freshness cycle |

---

## 10. Classification Prompt (OBJECT-3)

This prompt is used by OBJECT-3 to classify equipment against UNSPSC codes.

**Reference:** OBJECT-3_Definition_Card_v3_9.md

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

---

## 11. Enrichment Prompt (OBJECT-2)

This prompt is used by OBJECT-2 to enrich equipment profiles during FAT Object fabrication.

**Reference:** OBJECT-2_Definition_Card_v3_2.md

```
You are enriching an equipment profile for a capability intelligence system.

INPUT DATA:
- Equipment Name: {equipment_name}
- Manufacturer: {manufacturer}
- Model: {model}
- Specifications: {specifications}
- Location/Facility: {facility}
- Operational Status: {operational_status}

TASK: Extract and structure equipment capabilities.

Provide:

1. **Equipment Complexity** (critical for classification depth):
   - single-purpose: Dedicated to one function (e.g., pH meter, balance)
   - multi-function: Multiple measurement/processing capabilities (e.g., spectrophotometer)
   - platform: Integrated system with multiple modules (e.g., HPLC, mass spec system)

2. **Primary Capabilities** (3-5 core functions):
   - e.g., "High-speed centrifugation", "UV-Vis absorbance measurement", "Temperature-controlled mixing"

3. **Applications** (3-5 typical use cases):
   - e.g., "Cell separation", "Protein purification", "Sample preparation"

4. **Operational Parameters** (key specifications):
   - e.g., "Max RPM: 15,000", "Wavelength range: 190-1100nm", "Temperature range: -20 to 100C"

5. **Scale Indicators**:
   - bench: Laboratory bench-top equipment
   - pilot: Pilot-scale processing equipment
   - production: Production/commercial-scale equipment

6. **Regulatory Context** (if identifiable):
   - GMP compliance status
   - ISO certifications
   - Calibration requirements

7. **Raw Specification Preservation** (CRITICAL):
   - Preserve the original specifications text
   - Extract all numerical parameters with units
   - Preserve manufacturer documentation references

OUTPUT FORMAT: JSON

The output MUST include both raw_specifications (preserved from input) AND enriched_context (LLM-generated).

{
  "raw_specifications": {
    "equipment_name": "Original equipment name",
    "manufacturer": "Manufacturer name",
    "model": "Model number",
    "specifications": "Original specifications text"
  },
  "enriched_context": {
    "equipment_complexity": "single-purpose | multi-function | platform",
    "complexity_evidence": "Brief explanation of complexity assessment",
    "capabilities": ["Capability 1", "Capability 2", ...],
    "applications": ["Application 1", "Application 2", ...],
    "operational_parameters": {
      "parameter_1": "value with units",
      "parameter_2": "value with units"
    },
    "scale": "bench | pilot | production",
    "scale_evidence": "Brief explanation of scale assessment"
  },
  "regulatory_context": {
    "gmp_status": "compliant | non-compliant | unknown",
    "certifications": ["ISO 17025", ...],
    "calibration_requirements": "Description of calibration needs"
  }
}

CRITICAL:
- The raw_specifications section MUST preserve input data, not summarise it.
- Respond ONLY with valid JSON. Do not include any text outside the JSON structure.
- If information is not available, use "unknown" rather than omitting fields.
```

---

## 12. Seed Dataset: Deakin BioFactory Equipment

The following 33 equipment items from Deakin University's BioFactory serve as the seed dataset for Equipment instance validation. This dataset was validated against the UNSPSC filtered set with 100% coverage.

| ID | Equipment Name | UNSPSC | UNSPSC Name | Unit Operations | OECD FOS |
|----|----------------|--------|-------------|-----------------|----------|
| EQ-001 | Iatroscan | 41115701 | Gas chromatograph | lipid_analysis; chromatography | 1.4 |
| EQ-002 | Macfuge 260 - Centrifuge Separator | 40161701 | Centrifuges | solid_liquid_separation | 2.4 |
| EQ-003 | Filter Press | 41104910 | Laboratory multi sheet or press filters | solid_liquid_separation | 2.4 |
| EQ-004 | Sieve Shakers | 41105002 | Sieve shakers | sieving | 2.4 |
| EQ-005 | Dehydrator shipping container | 41104507 | Drying cabinets or ovens | drying | 2.4 |
| EQ-006 | PSS Combi-Unit/Mill head | 41101702 | Laboratory mills | size_reduction | 2.4 |
| EQ-007 | Decanter centrifuge | 40161701 | Centrifuges | solid_liquid_separation | 2.4 |
| EQ-008 | IOPAK Basket Centrifuge | 40161701 | Centrifuges | solid_liquid_separation | 2.4 |
| EQ-009 | Frozen Block Flaker | 41101707 | Laboratory crushers or pulverizers | size_reduction | 2.4 |
| EQ-010 | FD80GP Freeze Dry | 24131604 | Freeze drying equipment | freeze_drying | 2.9 |
| EQ-011 | FD30 Extraction System F-Series | 41104018 | Solid phase extraction preparations | extraction | 2.4 |
| EQ-012 | Membrane Filtration - Hybrid Skid | 40161507 | Filter membranes | membrane_separation | 2.4 |
| EQ-013 | 20L continuous Rotavap | 41104803 | Laboratory evaporators | evaporation | 2.4 |
| EQ-014 | Lyovapor | 41104707 | Lyophilizers or freeze dryers | freeze_drying | 2.9 |
| EQ-015 | -80 Freezer | 41104302 | Ultra low and cryogenic freezers | cooling; storage | 2.4 |
| EQ-016 | 50L Rotavap | 41104803 | Laboratory evaporators | evaporation | 2.4 |
| EQ-017 | Ethanol Extraction Unit (CES-300) | 41104018 | Solid phase extraction preparations | extraction; solid_liquid_separation | 2.4 |
| EQ-018 | Environmental Recycling System | 41103211 | Laboratory wastewater treatment equipment | waste_treatment | 2.4 |
| EQ-019 | Shipping container with sliding doors for Drying | 41104507 | Drying cabinets or ovens | drying | 2.4 |
| EQ-020 | Jacketed Kettle | 41103808 | Laboratory heating mantles | heating; mixing | 2.4 |
| EQ-021 | Peristaltic pump and silicone tubing | 41105102 | Peristaltic pumps | pumping | 2.4 |
| EQ-022 | Fibre Analyser | 41104808 | Crude fiber extractors | fibre_analysis | 1.4 |
| EQ-023 | Lab scale supercritical (SCF) | 41115723 | Supercritical fluid chromatograph | extraction | 2.4 |
| EQ-024 | Wastemaster | 41103211 | Laboratory wastewater treatment equipment | waste_treatment | 2.4 |
| EQ-025 | Pilot Scale Homogenizer | 41101504 | Homogenizers | homogenisation | 2.4 |
| EQ-026 | Freeze Dryer (KA), Vacuum oven and drying ovens | 41104707 | Lyophilizers or freeze dryers | freeze_drying; drying | 2.9 |
| EQ-027 | Vacuum Ovens | 41104509 | Vacuum ovens | drying | 2.4 |
| EQ-028 | Convection Ovens | 41104501 | Laboratory mechanical convection ovens | drying | 2.4 |
| EQ-029 | 10L Hydrothermal Reactor | 41103505 | Reactors | chemical_reaction; pretreatment | 2.4 |
| EQ-030 | Paper making machine | 23151815 | Sheet or pulp mold systems | formulation | 2.9 |
| EQ-031 | Forklift | 24101601 | Forklifts | conveying | 2.4 |
| EQ-032 | Packaging equipment | 23152903 | Packaging vacuum | packaging | 2.4 |
| EQ-035 | Mixquip series - drum mixing units | 23191001 | Continuous mixers | mixing | 2.4 |

**Exclusions (OUT_OF_SCOPE):**
- EQ-033: UTE with Refrigeration Box (vehicle, not equipment)
- EQ-034: GATOR (utility vehicle, not equipment)

**Coverage Statistics:**
- Total equipment: 35
- Covered: 33 (94.3%)
- Out of scope: 2 (5.7%)
- Equipment coverage: 100% (33/33 in-scope items)

---

## 13. Unit Operation and Process Stage Pattern

**Critical Implementation Note:**

Unit Operation and Process Stage are properties of the **FAT Standard (UNSPSC) node**, not the FAT Equipment node.

**Graph Pattern:**

```cypher
// UNSPSC Standard node with enriched properties
(s:Standard:UNSPSC {
  code: "41121509",
  name: "Ultracentrifuges",
  unit_operation: "solid_liquid_separation",
  process_stage: "purification"
})

// Equipment classified against Standard
(e:Equipment:FATObject {
  asset_id: "equipment:ultracentrifuge-001"
})-[:CLASSIFIED_AS {confidence: 0.94}]->(s)
```

**Rationale:**
- Unit operations are intrinsic to equipment categories, not individual items
- Multiple equipment items of the same type share unit operation semantics
- Enables capability queries at the Standard level without equipment enumeration
- Supports Method-Equipment linkage via shared unit operation vocabulary

**Query Pattern:**

```cypher
// Find equipment capable of solid_liquid_separation
MATCH (e:Equipment:FATObject)-[:CLASSIFIED_AS]->(s:Standard:UNSPSC)
WHERE s.unit_operation = 'solid_liquid_separation'
RETURN e.display_name, s.code, s.name
```

---

## 14. Versioning

| Version | Date | Summary |
|---------|------|---------|
| v1.3 | 30/01/2026 | Updated UNSPSC counts (948 codes, 4 segments, 13 families) per UNSPSC Domain Filter v1.1 output; added unit operations vocabulary reference; added OECD FOS derivation documentation; added seed dataset (33 Deakin BioFactory equipment items); enhanced Section 4 with families and OECD FOS distribution |
| v1.2 | 29/01/2026 | Generated via Instance Factory skill; validated against reference_index.yaml v1.1; aligned with workflow_architecture per_entity_config; added GOVERN layer section; updated all document references to current versions |
| v1.1 | 15/01/2026 | Added Unit Operation and Process Stage pattern (Section 13); clarified Standard node enrichment; updated CF list |
| v1.0 | 10/01/2026 | Initial equipment instance specification |

---

## 15. Related Documents

- OBJECT-1_Definition_Card_v3_2.md -- Data ingestion workflow
- OBJECT-2_Definition_Card_v3_2.md -- Fabrication workflow
- OBJECT-3_Definition_Card_v3_9.md -- Classification workflow (references this prompt)
- OBJECT-4_Definition_Card_v3_5.md -- Confidence routing workflow
- OBJECT-5_Definition_Card_v3_6.md -- Human validation workflow
- INSTANCE-1_Definition_Card_v3_5.md -- Primary Standard fabrication (UNSPSC)
- INSTANCE-2_Definition_Card_v3_7.md -- Crosswalk fabrication (UNSPSC <-> OECD)
- GOVERN-1_Definition_Card_v3_8.md -- Asset health scanning
- GOVERN-2_Definition_Card_v3_4.md -- Change severity classification
- FATEquipment_Schema_v1_3.md -- Equipment schema specification
- Assessment_vs_Validation_Terminology_Framework_v1_1.md -- Terminology standards
- Constraint_Reasoning_Engine_Specification_v4_0_3.md -- Constraint families
- unspsc_filtered_marine_bioproducts.csv -- Filtered UNSPSC codes (948)
- equipment_mapping_deakin_biofactory.csv -- Seed dataset mapping
- selection_rationale_marine_bioproducts.md -- UNSPSC filtering methodology

---

**END OF SPECIFICATION**
