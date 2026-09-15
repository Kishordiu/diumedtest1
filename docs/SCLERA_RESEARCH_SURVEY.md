# DiuMed — Sclera/Jaundice Research Survey

## Status: NO VALIDATED MODEL EXISTS

> [!WARNING]
> DiuMed does not currently have a jaundice/bilirubin prediction model. The sclera screening page provides color analysis only (CIELAB yellownessIndex). No clinical prediction is made.

## Research Question

Can smartphone camera images of the sclera (white of the eye) be used to estimate serum bilirubin levels for jaundice screening?

## Literature Review

### Published Approaches

1. **BiliScreen** (Wang et al., 2017, UbiComp)
   - Smartphone + color reference card
   - Custom color calibration pipeline
   - Reported correlation with serum bilirubin
   - Limitation: Requires custom 3D-printed calibration accessory
   - Dataset: **Not publicly available**

2. **BiliCam** (Taylor et al., 2017, PNAS)
   - Neonatal jaundice screening from skin photos
   - Uses color card for reference
   - Dataset: **Not publicly available**

3. **Sclera Image Analysis** (Various)
   - Several publications explore scleral yellowing correlation with bilirubin
   - Most use controlled imaging setups
   - Datasets: **Typically not released**

### Key Challenges

| Challenge | Impact |
|-----------|--------|
| No public dataset with sclera images + bilirubin ground truth | Cannot train or validate |
| Camera ISP variability | White balance, gamma, color science differ per phone |
| Ambient lighting | Scleral color appearance changes dramatically with lighting |
| Melanin/race interaction | Scleral pigmentation varies by ethnicity |
| Specular reflection | Tear film creates specular highlights that corrupt color analysis |
| Small ROI | Sclera is a small region; noise is amplified |

## Available Datasets (Investigated)

| Dataset | Contains Sclera Images? | Has Bilirubin Ground Truth? | Public? | Usable? |
|---------|----------------------|---------------------------|---------|---------|
| Zenodo 8277462 | Conjunctiva (not sclera) | Hemoglobin (not bilirubin) | Yes | No (wrong target) |
| Jaundice Image Data (Kaggle) | Yes | Unknown/Classification | Yes | Possibly (Needs investigation) |
| Bilirubin Quantification (GitHub)| Yes | Yes | Yes | Yes (Methodology + Data) |
| BiliScreen | Unknown (custom) | Presumably | No | No |
| BiliCam | Skin (not sclera) | Yes | No | No |
| EyeDx | Unknown | Unknown | Unknown | Unknown |

## Conclusion

**Recent discoveries have identified potential public datasets** that contain:
1. Scleral images
2. Corresponding serum bilirubin measurements or classifications
3. A usable license for research/development

Specifically, the "Jaundice Image Data" on Kaggle and "Bilirubin Quantification" repository on GitHub present viable starting points for model development.

### Recommendation

1. **Do not create a bilirubin prediction model** until a suitable dataset is identified
2. **Continue providing color analysis** (CIELAB b* yellownessIndex) as informational only
3. **Clearly label** the sclera page as "experimental color analysis — not a clinical measurement"
4. **Monitor literature** for new public datasets
5. **Consider data collection protocol** if clinical partnership becomes available

## Action Items

- [ ] Search OpenAlex/PubMed for post-2023 sclera + bilirubin datasets
- [ ] Investigate Kaggle and Zenodo for relevant datasets
- [ ] Review if any clinical collaborator can provide paired data
- [ ] Until resolved: maintain color-analysis-only status with explicit disclaimers
