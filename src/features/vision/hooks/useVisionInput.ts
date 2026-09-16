import { useState, useRef, useCallback, useEffect } from 'react';
import { log } from '../../../core/logger';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export type VisionInputMode = 'LIVE' | 'UPLOAD';

export interface VisionInputState {
  mode: VisionInputMode;
  status: 'IDLE' | 'PREPARING' | 'PERMISSION' | 'CAMERA_READY' | 'IMAGE_LOADED' | 'ERROR';
  errorMessage: string | null;
  imageElement: HTMLImageElement | HTMLVideoElement | null;
  imageReady: boolean;
}

export function useVisionInput(defaultMode: VisionInputMode = 'LIVE') {
  const [state, setState] = useState<VisionInputState>({
    mode: defaultMode,
    status: 'IDLE',
    errorMessage: null,
    imageElement: null,
    imageReady: false,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setMode = useCallback((mode: VisionInputMode) => {
    cleanup();
    setState({
      mode,
      status: 'IDLE',
      errorMessage: null,
      imageElement: null,
      imageReady: false,
    });
  }, [cleanup]);

  const startLiveScan = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    cleanup();
    setState(s => ({ ...s, mode: 'LIVE', status: 'PREPARING', errorMessage: null, imageReady: false, imageElement: null }));

    try {
      setState(s => ({ ...s, status: 'PERMISSION' }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState(s => ({ ...s, status: 'CAMERA_READY', imageElement: videoRef.current, imageReady: true }));
      }
    } catch (err: any) {
      log.error('Camera error in useVisionInput', err);
      setState(s => ({ 
        ...s, 
        status: 'ERROR', 
        errorMessage: err.name === 'NotAllowedError' ? 'Camera permission denied.' : 'Camera unavailable.' 
      }));
    }
  }, [cleanup]);

  const captureLiveFrame = useCallback((): HTMLCanvasElement | null => {
    if (state.mode === 'LIVE' && state.status === 'CAMERA_READY' && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas;
      }
    }
    return null;
  }, [state]);

  const handleFileUpload = useCallback((file: File) => {
    cleanup();
    setState(s => ({ ...s, mode: 'UPLOAD', status: 'PREPARING', errorMessage: null, imageReady: false, imageElement: null }));

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setState(s => ({ ...s, status: 'IMAGE_LOADED', imageElement: img, imageReady: true }));
      URL.revokeObjectURL(url); // Clean up
    };
    img.onerror = () => {
      setState(s => ({ ...s, status: 'ERROR', errorMessage: 'Failed to load image file.' }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [cleanup]);

  const triggerFilePicker = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos
        });
        
        if (image.webPath) {
          cleanup();
          setState(s => ({ ...s, mode: 'UPLOAD', status: 'PREPARING', errorMessage: null, imageReady: false, imageElement: null }));
          
          const img = new Image();
          img.onload = () => {
            setState(s => ({ ...s, status: 'IMAGE_LOADED', imageElement: img, imageReady: true }));
          };
          img.onerror = () => {
            setState(s => ({ ...s, status: 'ERROR', errorMessage: 'Failed to load image file.' }));
          };
          img.src = image.webPath; // Capacitor automatically handles local file URIs via webPath
        }
      } catch (error: any) {
         log.error('Camera', 'Failed to pick photo', error);
         if (error.message !== 'User cancelled photos app') {
           setState(s => ({ ...s, status: 'ERROR', errorMessage: 'Failed to open photo picker.' }));
         }
      }
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }, [cleanup]);

  return {
    state,
    setMode,
    startLiveScan,
    captureLiveFrame,
    handleFileUpload,
    triggerFilePicker,
    videoRef,
    fileInputRef,
    cleanup
  };
}
