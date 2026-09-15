/**
 * DiuMed Colorimetry Engine
 * 
 * Mathematical utilities for processing optical signals in the CIELAB color space 
 * and calculating specialized indices like the Erythema Index (EI).
 * 
 * Reference: 
 * CIELAB (L*a*b*) color space is perceptually uniform.
 * a* represents the Red-Green axis (positive = red, negative = green).
 * b* represents the Yellow-Blue axis (positive = yellow, negative = blue).
 */

export interface LabColor {
  L: number;
  a: number;
  b: number;
}

export interface ColorimetryResult {
  averageRGB: { r: number, g: number, b: number };
  averageLab: LabColor;
  erythemaIndex: number;
  yellownessIndex: number;
}

/**
 * Converts sRGB (0-255) to CIELAB (L*a*b*)
 * Uses D65 standard illuminant.
 */
export function rgbToLab(r: number, g: number, b: number): LabColor {
  // 1. Convert sRGB to linear RGB
  let rL = r / 255;
  let gL = g / 255;
  let bL = b / 255;

  rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92;
  gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92;
  bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92;

  // 2. Convert linear RGB to XYZ (D65)
  // Observer. = 2°, Illuminant = D65
  const x = (rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375) * 100;
  const y = (rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750) * 100;
  const z = (rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041) * 100;

  // 3. Convert XYZ to CIELAB
  const ref_X = 95.047;
  const ref_Y = 100.000;
  const ref_Z = 108.883;

  let xN = x / ref_X;
  let yN = y / ref_Y;
  let zN = z / ref_Z;

  xN = xN > 0.008856 ? Math.pow(xN, 1 / 3) : (7.787 * xN) + (16 / 116);
  yN = yN > 0.008856 ? Math.pow(yN, 1 / 3) : (7.787 * yN) + (16 / 116);
  zN = zN > 0.008856 ? Math.pow(zN, 1 / 3) : (7.787 * zN) + (16 / 116);

  const L = (116 * yN) - 16;
  const a = 500 * (xN - yN);
  const b_lab = 200 * (yN - zN);

  return { L, a, b: b_lab };
}

/**
 * Erythema Index (EI)
 * Correlates with redness/hemoglobin presence.
 * EI = log10(R) - log10(G)
 */
export function calculateErythemaIndex(r: number, g: number): number {
  const safeR = Math.max(r, 1); // Avoid log(0)
  const safeG = Math.max(g, 1);
  return Math.log10(safeR) - Math.log10(safeG);
}

/**
 * Analyzes an ImageData pixel buffer (from a Canvas) within a target circular ROI.
 * Extends the buffer into CIELAB and returns averaged diagnostic indices.
 */
export function analyzeROI(
  imageData: ImageData, 
  roiCenterX: number, 
  roiCenterY: number, 
  roiRadius: number
): ColorimetryResult {
  const data = imageData.data;
  const width = imageData.width;

  let sumR = 0, sumG = 0, sumB = 0;
  let count = 0;

  const rSq = roiRadius * roiRadius;

  for (let y = Math.max(0, Math.floor(roiCenterY - roiRadius)); y <= Math.min(imageData.height - 1, Math.ceil(roiCenterY + roiRadius)); y++) {
    for (let x = Math.max(0, Math.floor(roiCenterX - roiRadius)); x <= Math.min(width - 1, Math.ceil(roiCenterX + roiRadius)); x++) {
      const dx = x - roiCenterX;
      const dy = y - roiCenterY;
      
      // Check if pixel is inside the circular ROI
      if ((dx * dx + dy * dy) <= rSq) {
        const i = (y * width + x) * 4;
        sumR += data[i];
        sumG += data[i + 1];
        sumB += data[i + 2];
        count++;
      }
    }
  }

  if (count === 0) {
    return {
      averageRGB: { r: 0, g: 0, b: 0 },
      averageLab: { L: 0, a: 0, b: 0 },
      erythemaIndex: 0,
      yellownessIndex: 0
    };
  }

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;

  const lab = rgbToLab(avgR, avgG, avgB);
  const ei = calculateErythemaIndex(avgR, avgG);

  // b* axis is our proxy for yellowness (jaundice)
  return {
    averageRGB: { r: avgR, g: avgG, b: avgB },
    averageLab: lab,
    erythemaIndex: ei,
    yellownessIndex: lab.b
  };
}

export interface ImageQualityReport {
  isSufficient: boolean;
  brightness: number;
  contrast: number;
  reason?: string;
}

export function validateImageQuality(imageData: ImageData): ImageQualityReport {
  const data = imageData.data;
  const len = data.length;
  
  let sumLuma = 0;
  let count = 0;
  let clippedPixels = 0;

  for (let i = 0; i < len; i += 64) { 
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    if (r >= 250 && g >= 250 && b >= 250) {
      clippedPixels++;
    }

    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    sumLuma += luma;
    count++;
  }

  const meanBrightness = sumLuma / count;
  const clippedRatio = clippedPixels / count;

  let sumVariance = 0;
  for (let i = 0; i < len; i += 64) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    const diff = luma - meanBrightness;
    sumVariance += diff * diff;
  }

  const contrast = Math.sqrt(sumVariance / count);

  if (clippedRatio > 0.05) {
    return { isSufficient: false, brightness: meanBrightness, contrast, reason: 'Too much glare (specular reflection). Please adjust lighting.' };
  }
  if (meanBrightness < 60) {
    return { isSufficient: false, brightness: meanBrightness, contrast, reason: 'Image is too dark. Please move to a well-lit area.' };
  }
  if (meanBrightness > 200) {
    return { isSufficient: false, brightness: meanBrightness, contrast, reason: 'Image is overexposed (too bright). Avoid direct glare.' };
  }
  if (contrast < 25) {
    return { isSufficient: false, brightness: meanBrightness, contrast, reason: 'Image contrast/focus is too low. Ensure proper lighting and focus.' };
  }

  return { isSufficient: true, brightness: meanBrightness, contrast };
}
