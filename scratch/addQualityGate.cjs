const fs = require('fs');

let code = fs.readFileSync('src/features/vision/ColorimetryEngine.ts', 'utf8');

const additional = `
export interface ImageQualityReport {
  isSufficient: boolean;
  brightness: number;
  contrast: number;
  reason?: string;
}

/**
 * Validates the image quality of a given ImageData buffer.
 * Calculates approximate brightness and contrast (standard deviation of luma).
 * Rejects images that are too dark, too bright, or lack contrast.
 */
export function validateImageQuality(imageData: ImageData): ImageQualityReport {
  const data = imageData.data;
  const len = data.length;
  
  let sumLuma = 0;
  let count = 0;

  // Calculate mean brightness (luma)
  // Sampling every 16th pixel to save time since we just need a global estimate
  for (let i = 0; i < len; i += 64) { 
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Perceived brightness (Luma)
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    sumLuma += luma;
    count++;
  }

  const meanBrightness = sumLuma / count;

  // Calculate contrast (standard deviation of luma)
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

  // Quality thresholds
  // 0-255 scale
  if (meanBrightness < 40) {
    return { isSufficient: false, brightness: meanBrightness, contrast, reason: 'Image is too dark. Please move to a well-lit area.' };
  }
  if (meanBrightness > 230) {
    return { isSufficient: false, brightness: meanBrightness, contrast, reason: 'Image is overexposed (too bright). Avoid direct glare.' };
  }
  if (contrast < 15) {
    return { isSufficient: false, brightness: meanBrightness, contrast, reason: 'Image contrast is too low. Ensure proper lighting and focus.' };
  }

  return { isSufficient: true, brightness: meanBrightness, contrast };
}
`;

fs.writeFileSync('src/features/vision/ColorimetryEngine.ts', code + additional);
console.log('done');
