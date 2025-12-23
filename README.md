# Classification Foundry

Workflow definitions and configuration for the Classification Foundry system.

## Repository Structure

```
classification-foundry/
├── workflows/
│   ├── OBJECT/          # Object-level workflows
│   ├── INSTANCE/        # Instance-level workflows
│   ├── SYSTEM/          # System-level workflows
│   └── GOVERN/          # Governance workflows
├── definition-cards/    # Definition card documentation (.md)
├── CHANGELOG.md
└── README.md
```

## Workflows

### OBJECT Workflows
| Workflow | Description |
|----------|-------------|
| OBJECT-1_Data_Acquisition | Data acquisition pipeline |
| OBJECT-2_Fabrication | Object fabrication and re-fabrication |
| OBJECT-3_Classification | Classification, assessment, and constraints |
| OBJECT-4_CRE_Routing | CRE routing logic |
| OBJECT-5_Validation_Sync | Validation and synchronization |

### INSTANCE Workflows
| Workflow | Description |
|----------|-------------|
| INSTANCE-1_Researcher | Researcher workflow |
| INSTANCE-2_Crosswalk | Crosswalk fabrication |

### SYSTEM Workflows
| Workflow | Description |
|----------|-------------|
| SYSTEM-1 | Main system workflow |
| SYSTEM-2_CRE | CRE assessment workflow |
| SYSTEM-2_CRE_Sub-Workflow | CRE assessment sub-workflow |

### GOVERN Workflows
| Workflow | Description |
|----------|-------------|
| GOVERN-1_Health_Scanning | Asset health scanning |
| GOVERN-2_Severity_Classification | Change severity classification |
| GOVERN-3_Re-Fabrication | Re-fabrication orchestration |
| GOVERN-4_Registry_Health | Registry health governance |

## Versioning

Workflow versions are tracked via Git. Each workflow file includes version metadata in its JSON structure.

## Contributing

1. Create a feature branch for your changes
2. Update the relevant workflow JSON files
3. Update definition cards if applicable
4. Document changes in CHANGELOG.md
5. Submit a pull request for review
