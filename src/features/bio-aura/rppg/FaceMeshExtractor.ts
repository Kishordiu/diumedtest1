import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { log } from '../../../core/logger';

import { type FacePatch } from './rppgEngine';

export interface FaceExtractionResult {
  patches: FacePatch[];
  motion: number; // Landmark displacement
  faceDetected: boolean;
}

export class FaceMeshExtractor {
  private landmarker: FaceLandmarker | null = null;
  private isInitializing = false;
  private previousLandmarks: NormalizedLandmark[] | null = null;

  async initialize() {
    if (this.landmarker || this.isInitializing) return;
    this.isInitializing = true;
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      this.landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: false,
        runningMode: "VIDEO",
        numFaces: 1
      });
      console.log('FaceLandmarker initialized successfully.');
    } catch (error) {
      log.error('Failed to initialize FaceLandmarker', error);
    } finally {
      this.isInitializing = false;
    }
  }

  isReady(): boolean {
    return this.landmarker !== null;
  }

  extractROIs(video: HTMLVideoElement, canvas: HTMLCanvasElement, timestamp: number): FaceExtractionResult | null {
    if (!this.landmarker) return null;

    let result;
    try {
      result = this.landmarker.detectForVideo(video, timestamp);
    } catch (e) {
      log.error('Face detection failed', e);
      return null;
    }

    if (!result || result.faceLandmarks.length === 0) {
      this.previousLandmarks = null;
      return { patches: [], motion: 0, faceDetected: false };
    }

    const landmarks = result.faceLandmarks[0];
    
    // Calculate motion (average displacement of landmarks)
    let motion = 0;
    if (this.previousLandmarks) {
      let totalDist = 0;
      for (let i = 0; i < landmarks.length; i+=10) { // Sample every 10th landmark for speed
        const dx = landmarks[i].x - this.previousLandmarks[i].x;
        const dy = landmarks[i].y - this.previousLandmarks[i].y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
      }
      motion = totalDist / (landmarks.length / 10);
    }
    this.previousLandmarks = landmarks;

    // Define ROI bounding boxes based on specific landmarks
    // MediaPipe face mesh has 478 landmarks.
    // Forehead roughly: 10 (top center), 109 (left), 338 (right), 9 (bottom center)
    // Left cheek: 234 (leftmost), 127 (top), 132 (bottom), 50 (right)
    // Right cheek: 454 (rightmost), 356 (top), 361 (bottom), 280 (left)

    const w = video.videoWidth;
    const h = video.videoHeight;
    
    if (w === 0 || h === 0) return null;
    
    // Draw frame to canvas for pixel extraction
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);

    const getBox = (indices: number[]) => {
      let minX = w, minY = h, maxX = 0, maxY = 0;
      for (const idx of indices) {
        const pt = landmarks[idx];
        if (!pt) continue;
        const x = pt.x * w;
        const y = pt.y * h;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return { minX: Math.max(0, Math.floor(minX)), minY: Math.max(0, Math.floor(minY)), maxX: Math.min(w, Math.ceil(maxX)), maxY: Math.min(h, Math.ceil(maxY)) };
    };

    const extractPatch = (id: FacePatch['id'], indices: number[]): FacePatch | null => {
      const box = getBox(indices);
      const width = box.maxX - box.minX;
      const height = box.maxY - box.minY;
      if (width <= 0 || height <= 0) return null;

      let rSum = 0, gSum = 0, bSum = 0;
      let rSqSum = 0, gSqSum = 0, bSqSum = 0;
      let count = 0;

      for (let y = box.minY; y < box.maxY; y++) {
        for (let x = box.minX; x < box.maxX; x++) {
          const i = (y * w + x) * 4;
          const r = imageData.data[i];
          const g = imageData.data[i+1];
          const b = imageData.data[i+2];
          
          // Basic skin exclusion (too dark or clipped)
          if (r > 20 && r < 250 && Math.max(r,g,b)-Math.min(r,g,b) > 10) {
             rSum += r;
             gSum += g;
             bSum += b;
             rSqSum += r * r;
             gSqSum += g * g;
             bSqSum += b * b;
             count++;
          }
        }
      }

      if (count < (width * height * 0.1)) return null;

      const rMean = rSum / count;
      const gMean = gSum / count;
      const bMean = bSum / count;

      const rVar = (rSqSum / count) - (rMean * rMean);
      const gVar = (gSqSum / count) - (gMean * gMean);
      const bVar = (bSqSum / count) - (bMean * bMean);
      const variance = (rVar + gVar + bVar) / 3;

      return {
        id,
        r: rMean,
        g: gMean,
        b: bMean,
        validPixels: count,
        variance
      };
    };
    
    // Narrow patches
    const foreheadPatch = extractPatch('forehead', [10, 109, 338, 9]);
    const leftCheekPatch = extractPatch('left_cheek', [234, 127, 132, 50]);
    const rightCheekPatch = extractPatch('right_cheek', [454, 356, 361, 280]);

    const patches: FacePatch[] = [];
    if (foreheadPatch) patches.push(foreheadPatch);
    if (leftCheekPatch) patches.push(leftCheekPatch);
    if (rightCheekPatch) patches.push(rightCheekPatch);

    return { patches, motion, faceDetected: true };
  }
}
