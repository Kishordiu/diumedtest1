# DiuMed — Dataset Training Plan

## Overview

DiuMed sensing modalities are trained and evaluated independently using modality-specific dataset groups. No cross-modality training is performed.

## Dataset Groups

### Group A: Remote Camera rPPG (Bio-Aura)

**Purpose**: Face-video optical pulse extraction for heart rate estimation.

| Dataset | Subjects | Videos | Use | Access |
|---------|----------|--------|-----|--------|
| UBFC-rPPG | 42 | 42 | Primary train/test | Open |
| PURE | 10 | 60 | Algorithm development | Open |
| VIPL-HR | 107 | 2,378 | Cross-condition testing | Restricted |
| VIPL-HR-V2 | 500 | 2,500 | Large-scale validation | Restricted |
| UBFC-Phys | 56 | 168 | Stress/physiology robustness | Open |
| COHFACE | 40 | 160 | Cross-dataset eval | Open |
| MMSE-HR | 40 | 102 | Heterogeneous video | Restricted |
| MMPD | 33 | 660 | **Mobile-device conditions** | Open |
| iBVP | 44 | — | BVP research | Restricted |
| SCAMPS | Synthetic | 2,800 | Pretraining/augmentation | Open |
| BP4D+ | 140 | — | Facial variability (cautious) | Restricted |
| MAHNOB-HCI | 27 | 527 | Independent eval | Restricted |
| AFRL | — | — | Auxiliary benchmark | Restricted |

**Primary training split strategy**:
- TRAIN: UBFC-rPPG + PURE + MMPD + SCAMPS (pretraining)
- VALIDATION: UBFC-Phys + COHFACE
- TEST: VIPL-HR (cross-dataset), real DiuMed phone recordings

### Group B: Smartphone Contact PPG (Pulse Touch)

**Purpose**: Finger-over-rear-camera optical pulse extraction.

| Dataset | Type | Use | Access |
|---------|------|-----|--------|
| BUT PPG | Smartphone PPG + ECG | **Primary** — signal quality + HR | PhysioNet |
| Welltory PPG | Smartphone finger PPG | **Primary** — mobile validation | Open |
| BIDMC PPG | Clinical PPG + respiration | Signal processing validation | PhysioNet |
| Wrist PPG Exercise | Wrist PPG + motion | Motion robustness only | Open |

**Training split**: Subject-independent. Never same subject in train and test.

### Group C: Clinical PPG (Representation Pretraining Only)

| Dataset | Use | Access |
|---------|-----|--------|
| MIMIC-III Waveform | Pulse morphology, noise augmentation | PhysioNet (credentialed) |
| MIMIC-III-Ext-PPG | Quality classifier training | PhysioNet (credentialed) |
| MIMIC-IV Waveform | Additional waveform variation | PhysioNet (credentialed) |

> [!WARNING]
> Clinical PPG waveforms are NOT equivalent to smartphone camera PPG. Use only for representation learning and noise modeling. Never claim clinical-PPG-trained models are validated for phone cameras.

### Group D: Synthetic / Augmented Optical Signals

| Source | Use |
|--------|-----|
| SCAMPS | Large-scale synthetic rPPG pretraining |
| Custom augmentations | Brightness, gamma, compression, motion artifacts |

> [!CAUTION]
> Synthetic performance must never be used as proof of real-world accuracy.

### Group E: Conjunctival Optical Hb (Anemia)

| Dataset | Use | Access |
|---------|-----|--------|
| Zenodo 8277462 (Zhao et al.) | **Primary** — HHR-based Hb estimation | Open |
| Eyes Defy Anemia (Kaggle/IEEE) | Candidate additional training data | Open |
| Palpebral Conjunctiva Anemia (Kaggle) | Candidate additional training data | Open |
| AnemiaDataset (Kaggle) | Candidate additional training data | Open |
| sHEMO | Candidate additional training data | To investigate |
| Hemovision / URP-Hemovision | Candidate additional training data | To investigate |
| DSS-Anemia | Candidate additional training data | To investigate |

### Group F: Sclera / Eye Color (Jaundice)

**Status**: New datasets identified; model creation possible pending evaluation.

| Dataset | Use | Access |
|---------|-----|--------|
| Jaundice Image Data (Kaggle) | Candidate training data | Open |
| Bilirubin Quantification (GitHub) | Candidate training data / methodology | Open |

See `SCLERA_RESEARCH_SURVEY.md` for dataset evaluations.

### Group G: Document / Lab Report

| Resource | Use |
|----------|-----|
| FUNSD | Document layout pretraining |
| SROIE | Receipt/document OCR pretraining |
| Medical NER corpora | Entity extraction |

## Non-Negotiable Rules

1. Every dataset must be documented in `research/datasets/registry.yaml`
2. Every dataset's license must be verified before use
3. Subject-independent splits are mandatory
4. Cross-dataset evaluation is mandatory for any production model
5. Real-device validation is mandatory before deployment
6. No silent dataset mixing across modality boundaries
