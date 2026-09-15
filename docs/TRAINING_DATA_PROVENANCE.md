# DiuMed — Training Data Provenance

## Purpose

Every dataset used in DiuMed research or production must have its provenance, license, and access status documented here.

## Currently Used Datasets

### Zenodo 8277462 — Conjunctival Hb

| Field | Value |
|-------|-------|
| **Name** | Prediction of Severe Anemia — Conjunctival Images |
| **Authors** | Zhao L, Jay G |
| **Year** | 2023 |
| **DOI** | 10.5281/zenodo.8277462 |
| **Associated Publication** | PLOS ONE (2024) |
| **License** | Open access (Creative Commons) |
| **Access Type** | Direct download |
| **Used In** | `HemoglobinEstimator.ts` — production model |
| **Subjects** | 426 valid rows |
| **Ground Truth** | Laboratory hemoglobin (HBl) g/dL |
| **Features Used** | High Hue Ratio (HHR) |
| **Status** | ✅ Downloaded and used |

## Planned Datasets — Access Status

### Open Access (Direct Download)

| Dataset | Modality | Status |
|---------|----------|--------|
| UBFC-rPPG | Face rPPG | ⬜ Not downloaded |
| PURE | Face rPPG | ⬜ Not downloaded |
| UBFC-Phys | Face rPPG | ⬜ Not downloaded |
| COHFACE | Face rPPG | ⬜ Not downloaded |
| MMPD | Mobile face rPPG | ⬜ Not downloaded |
| SCAMPS | Synthetic rPPG | ⬜ Not downloaded |
| Welltory PPG | Smartphone finger PPG | ⬜ Not downloaded |
| Wrist PPG Exercise | Wrist PPG | ⬜ Not downloaded |

### Restricted Access (Application Required)

| Dataset | Modality | Access Procedure | Status |
|---------|----------|-----------------|--------|
| VIPL-HR | Face rPPG | IIIT research application | ⬜ Not applied |
| VIPL-HR-V2 | Face rPPG | IIIT research application | ⬜ Not applied |
| MMSE-HR | Face rPPG | Author request | ⬜ Not applied |
| BP4D+ | Facial variability | Institutional agreement | ⬜ Not applied |
| MAHNOB-HCI | Face rPPG | Author request | ⬜ Not applied |
| AFRL | Face rPPG | Government/institutional | ⬜ Not applied |
| iBVP | BVP research | Author request | ⬜ Not applied |

### PhysioNet (Credentialed Account Required)

| Dataset | Modality | Status |
|---------|----------|--------|
| BUT PPG | Smartphone PPG + ECG | ⬜ Not downloaded |
| MIMIC-III Waveform | Clinical PPG/ECG | ⬜ Not downloaded |
| MIMIC-III-Ext-PPG | Quality-assessed PPG | ⬜ Not downloaded |
| MIMIC-IV Waveform | Clinical PPG/ECG | ⬜ Not downloaded |
| BIDMC PPG | PPG + respiration | ⬜ Not downloaded |

## License Compliance Rules

1. **Never redistribute restricted-access datasets** in the DiuMed repository
2. **Never include raw dataset files** in `src/` or `dist/`
3. **Research code** in `research/` may reference dataset paths but must not embed data
4. **Model weights** derived from open datasets may be included in production
5. **Model weights** derived from restricted datasets require license review before inclusion
6. **All derived models** must cite their training data sources
