# Phase 5.5: Vision & Lab Intelligence Productization

## Overview
This document outlines the architecture, UX flows, and provenance model for DiuMed's experimental vision screeners (Anemia and Sclera) and the AI-powered Lab Report Scanner. These features have been heavily refined from technical demonstrations into trustworthy, traceable product capabilities.

## 1. Experimental Vision Screeners
DiuMed includes two single-shot colorimetric analysis tools:
1. **Anemia Screening:** Analyzes the redness (Erythema Index, CIELAB a* axis) of the palpebral conjunctiva.
2. **Sclera Screening:** Analyzes the yellowness (CIELAB b* axis) of the sclera as a proxy for bilirubin.

### 1.1 Architecture & Quality Gates
Both screeners utilize the `ColorimetryEngine.ts` to convert raw sRGB pixels into the perceptually uniform CIELAB space. 
To prevent invalid math on poor images, the engine runs a strict `validateImageQuality` check before processing:
- **Brightness Gate:** Rejects images with a mean luma < 40 or > 230.
- **Contrast Gate:** Rejects blurred or washed-out images with luma standard deviation < 15.

### 1.2 UX Flow
The user journey is explicitly designed to reinforce the limitations and experimental nature of the tools:
1. **Intro State:** Clear instructions on lighting, positioning, and data privacy (local processing).
2. **Camera Target:** Overlay guides (eyelid or sclera targets) to ensure precise ROI extraction.
3. **Quality Gate:** Immediate rejection and explanation if the room lighting is insufficient.
4. **Honest Results:** Never claims to diagnose. Displays the exact calculated metrics (e.g. `EI: 1.24`) and labels it as an **Experimental Screening Signal**.

## 2. Lab Report Scanner
DiuMed can securely parse printed blood test reports into structured database records using Google's Gemini Vision AI.

### 2.1 Secure Edge Architecture
To protect API keys and ensure secure parsing, the extraction happens server-side:
1. **Capture:** The user takes a photo of their lab report within the `LabReportScanner.tsx` UI.
2. **Transmission:** The image is converted to a base64 string and sent securely to the authenticated `parse_lab_report` Supabase Edge Function.
3. **Prompt Injection Defense:** The Edge Function strictly instructs the model that the image content is untrusted data and demands a strict JSON schema return.
4. **Data Minimization:** The Edge Function returns the structured JSON and immediately drops the image from memory. We do not persist the raw medical documents in public or private storage buckets to minimize liability.

### 2.2 Provenance & Review
To ensure the user maintains agency over their health records, the scanner enforces a mandatory **Review Step**:
- **Source Text:** The AI extracts the exact substring from the document (e.g. `"Haemoglobin: 12.4 g/dL"`) alongside the parsed value. This provides a provenance trail so the user can verify the extraction.
- **Reference Ranges:** The `status` field (LOW/NORMAL/HIGH) is calculated *strictly* based on the printed reference range on that specific report, rather than relying on global assumptions. If missing, it flags as `UNKNOWN`.
- **Edit & Remove:** The review table allows the user to manually edit misread numbers or completely remove irrelevant biomarkers before hitting 'Save'.

## 3. Data Provenance & Versioning
When saving to the `health_measurements` table, the source and mathematical version are heavily logged in the `metadata` JSON blob:
- `source`: e.g., `camera_vision_anemia` or `lab_report`
- `algorithm_version`: e.g., `vision_ei_v1.1`
- `image_quality`: The exact brightness/contrast metrics at capture time.
- `raw_cielab`: The unmodified color values.
- `source_text`: The OCR string from the lab report.

This rigorous versioning ensures that if the colorimetry math changes in v2.0, historical records are not silently misinterpreted.
