# UNSPSC Domain Filter: Marine Bioproducts Bioprocessing

**Generated:** 30/01/2026
**Skill Version:** UNSPSC Domain Filter v1.1.0
**Domain:** Marine bioproducts bioprocessing

---

## Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Domain | Marine bioproducts bioprocessing (upstream, midstream, downstream) | - | - |
| Total UNSPSC codes in database | 71,502 | - | - |
| Filtered codes | 948 | 800-1,500 | ✓ PASS |
| Codes with unit operation assigned | 948 (100%) | >80% | ✓ PASS |
| Equipment coverage | 33/33 (100%) | >85% | ✓ PASS |
| OECD FOS diversity | 4 codes | >2 | ✓ PASS |

---

## Quality Gate Results

### Filtering Quality

| Metric | Count | Percentage |
|--------|-------|------------|
| Total commodities in filtered set | 948 | 100% |
| Codes WITH unit operation assigned | 948 | 100% |
| Codes WITHOUT unit operation assigned | 0 | 0% |

**Quality Threshold:** <20% empty unit operations
**Result:** ✓ PASSED (0% empty)

### OECD FOS Distribution

| OECD FOS | Field | Count | Percentage |
|----------|-------|-------|------------|
| 1.4 | Chemical Sciences | 268 | 28.3% |
| 1.6 | Biological Sciences | 48 | 5.1% |
| 2.4 | Chemical Engineering | 607 | 64.0% |
| 2.9 | Industrial Biotechnology | 25 | 2.6% |

**FOS Diversity Check:** ✓ PASSED (4 different OECD FOS codes, not all 2.4)

---

## Segments Selected

Four segments were selected as relevant to marine bioproducts bioprocessing:

| Segment | Segment Name | Codes | Rationale |
|---------|--------------|-------|-----------|
| 23 | Industrial Manufacturing and Processing Machinery | 64 | Processing equipment for extraction, separation, drying |
| 24 | Material Handling and Conditioning and Storage | 92 | Storage, refrigeration, material handling for biomass |
| 40 | Distribution and Conditioning Systems | 136 | Pumps, filtration, fluid handling systems |
| 41 | Laboratory and Measuring Equipment | 656 | Lab-scale equipment, analytical instruments, QC |

**Reduction:** 71,502 → 4,049 codes (Level 1 filter: 94.3% reduction)

---

## Families Selected

Thirteen families were selected based on relevance to bioprocessing unit operations:

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

**Reduction:** 4,049 → 2,869 codes (Level 2 filter: 29.1% reduction)

---

## Classes Selected (Unit Operation Matching)

At the class and commodity level, codes were filtered based on unit operation matching. Only commodities whose names matched at least one vocabulary term from the unit operations vocabulary were included.

### Unit Operation Coverage

| Unit Operation | Codes Matched | OECD FOS |
|----------------|---------------|----------|
| process_monitoring | 157 | 2.4 |
| composition_analysis | 157 | 1.4 |
| pumping | 115 | 2.4 |
| structural_analysis | 79 | 1.4 |
| cooling | 53 | 2.4 |
| storage | 50 | 2.4 |
| chromatography | 42 | 1.4 |
| drying | 38 | 2.4 |
| conveying | 37 | 2.4 |
| cell_culture | 31 | 1.6 |
| solid_liquid_separation | 29 | 2.4 |
| gas_compression | 25 | 2.4 |
| mixing | 23 | 2.4 |
| heating | 23 | 2.4 |
| sieving | 20 | 2.4 |
| fermentation | 17 | 2.9 |
| membrane_separation | 15 | 2.4 |
| microbial_analysis | 14 | 1.6 |
| evaporation | 12 | 2.4 |
| freeze_drying | 8 | 2.9 |
| (+ 18 additional operations) | ... | ... |

**Total unique unit operations:** 38 (from 42 in vocabulary)

**Reduction:** 2,869 → 948 codes (Level 3 filter: 67.0% reduction)

---

## Validation Results

### Equipment Coverage Analysis

The Deakin BioFactory equipment list (35 items) was mapped against the filtered UNSPSC set:

| Status | Count | Description |
|--------|-------|-------------|
| COVERED | 33 | Direct match in filtered set |
| PARTIAL | 0 | Related code exists but not exact |
| GAP | 0 | No suitable code (after remediation) |
| OUT_OF_SCOPE | 2 | Not relevant to domain (vehicles) |

**Coverage Calculation:** 33 / (33 + 0 + 0) = **100%**
**Target:** >85%
**Result:** ✓ PASSED

### Equipment Mapping Summary

| Equipment Category | Count | Primary Unit Operations |
|--------------------|-------|------------------------|
| Separation equipment (centrifuges, filters) | 6 | solid_liquid_separation |
| Drying equipment (freeze dryers, ovens) | 7 | drying, freeze_drying |
| Extraction equipment (SCF, solvent) | 3 | extraction |
| Analytical equipment (analysers) | 2 | fibre_analysis, lipid_analysis |
| Size reduction (mills, flakers) | 3 | size_reduction |
| Mixing/Homogenisation | 3 | mixing, homogenisation |
| Evaporation (rotavaps) | 2 | evaporation |
| Thermal processing (reactors, kettles) | 2 | chemical_reaction, heating |
| Pumps and fluid handling | 1 | pumping |
| Storage and refrigeration | 1 | cooling, storage |
| Waste treatment | 2 | waste_treatment |
| Material handling | 1 | conveying |
| Packaging | 1 | packaging |
| Out of scope (vehicles) | 2 | - |

---

## Gap Remediation Log

One equipment item required gap remediation during initial validation:

| GAP Item | Suggested UNSPSC | Source | Decision | Rationale |
|----------|------------------|--------|----------|-----------|
| Filter Press | 41104910 | Similar to EQ-002/007/008 (centrifuges) | ACCEPT | Laboratory press filters perform same solid_liquid_separation function |
| Filter Press | 41104912 | Similar to EQ-002/007/008 | ACCEPT | Fluid press filter - alternative match |
| Filter Press | 40161506 | Industrial filtering family | ACCEPT | General filtering machinery backup |

**Remediation Result:** 3 codes added, Filter Press (EQ-003) now COVERED

---

## Exclusions Report

### Families Excluded

Families within selected segments that were excluded due to irrelevance:

| Family | Family Name | Reason |
|--------|-------------|--------|
| 23100000 | Raw materials processing machinery | Mineral/mining focus |
| 23110000 | Petroleum processing machinery | Petrochemical focus |
| 23120000 | Textile and fabric machinery | Textile manufacturing |
| 23130000 | Lapidary machinery | Gem/stone processing |
| 23140000 | Leatherworking machinery | Leather processing |
| 23160000 | Foundry machines | Metal casting |
| 23210000 | Electronic manufacturing | Electronics focus |
| 23220000 | Chicken processing machinery | Poultry specific |
| 23230000 | Sawmilling machinery | Wood processing |
| 23240000 | Metal cutting machinery | Metalworking |
| 23250000 | Metal forming machinery | Metalworking |
| 23260000 | Rapid prototyping machinery | 3D printing/prototyping |
| 23270000 | Welding and soldering | Metal joining |
| 23280000 | Metal treatment machinery | Surface treatment |
| 23290000 | Industrial machine tools | General machining |
| 23300000 | Wire machinery | Wire production |
| 24120000 | Packaging materials | Consumables, not equipment |
| 24140000 | Packing supplies | Consumables, not equipment |
| 40100000 | Heating and ventilation | HVAC systems |
| 40170000 | Pipe piping and fittings | Plumbing components |
| 40180000 | Tubes tubing and fittings | Plumbing components |

### Commodities Excluded (Sample)

Within selected families, commodities without unit operation matches were excluded. Sample exclusions:

| Commodity | Commodity Name | Reason |
|-----------|----------------|--------|
| 23151501 | Blow molding machines | Plastic manufacturing |
| 23151503 | Extruders | Plastic/food extrusion |
| 23151504 | Injection molding machines | Plastic manufacturing |
| 23151506 | Rubber or plastic presses | Rubber processing |
| 23151507 | Thermo forming machines | Plastic forming |
| 23151508 | Vacuum molding machines | Plastic molding |
| 23151509 | Vulcanizing machines | Rubber processing |

**Total excluded from selected families:** 1,921 commodities (no unit operation match)

---

## v1.1.0 Compliance Verification

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Filtered set 800-1,500 codes | ✓ | 948 codes |
| Every code has Unit_Operations | ✓ | 100% assigned |
| OECD FOS varies by operation | ✓ | 4 different FOS codes |
| Equipment mapping uses vocabulary IDs | ✓ | All mappings use vocabulary terms |
| Gap remediation suggests from similar equipment | ✓ | Filter press matched to centrifuge family |

---

## Integration Points

| Output File | Feeds Into | Purpose |
|-------------|-----------|---------|
| unspsc_filtered_marine_bioproducts.csv | INSTANCE-1 workflow | Primary standard for enrichment |
| equipment_mapping_deakin_biofactory.csv | OBJECT-3 workflow | Test fixtures for classification |
| selection_rationale_marine_bioproducts.md | Audit documentation | Traceability and methodology |

---

## Methodology Notes

### Unit Operations as Connective Tissue

This filtering uses unit operations as the semantic bridge between:
- **UNSPSC codes** (what equipment category)
- **OECD FOS** (what research field)
- **Equipment function** (what transformation performed)

This approach ensures that selected UNSPSC codes are genuinely relevant to bioprocessing operations rather than superficially similar by name only.

### Vocabulary Discipline

All unit operation assignments use exact vocabulary IDs from `unit_operations_vocabulary.yaml`:

| Correct (vocabulary ID) | Incorrect (ad-hoc term) |
|-------------------------|-------------------------|
| `solid_liquid_separation` | `centrifuge`, `filter` |
| `chromatography` | `chromatograph`, `hplc` |
| `freeze_drying` | `freeze dryer`, `lyophiliser` |
| `homogenisation` | `homogenizer` |
| `fibre_analysis` | `analyser` |

### OECD FOS Assignment

OECD FOS codes are derived from the vocabulary's `oecd_fos_primary` field for each unit operation, not defaulted to 2.4:

| Unit Operation | OECD FOS | Field |
|----------------|----------|-------|
| chromatography | 1.4 | Chemical Sciences |
| composition_analysis | 1.4 | Chemical Sciences |
| microbial_analysis | 1.6 | Biological Sciences |
| cell_culture | 1.6 | Biological Sciences |
| fermentation | 2.9 | Industrial Biotechnology |
| freeze_drying | 2.9 | Industrial Biotechnology |
| pumping | 2.4 | Chemical Engineering |
| drying | 2.4 | Chemical Engineering |

---

*Generated by UNSPSC Domain Filter Skill v1.1.0*
