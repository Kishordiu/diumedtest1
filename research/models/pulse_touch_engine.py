import numpy as np
from typing import Dict, Any, Tuple
from research.models.rppg_engine import bandpass_filter, compute_welch_psd, MIN_FRAMES_REQUIRED, MIN_QUALITY_THRESHOLD

def normalize(signal: np.ndarray) -> np.ndarray:
    mean = np.mean(signal)
    std = np.std(signal)
    if std == 0:
        return np.zeros_like(signal)
    return (signal - mean) / std

def detrend_moving_average(signal: np.ndarray, window_size: int) -> np.ndarray:
    n = len(signal)
    detrended = np.zeros_like(signal)
    half = window_size // 2
    for i in range(n):
        start = max(0, i - half)
        end = min(n, i + half)
        detrended[i] = signal[i] - np.mean(signal[start:end])
    return detrended

def process_pulse_touch_python(r_signal: np.ndarray, g_signal: np.ndarray, fs: float) -> Dict[str, Any]:
    """
    Python equivalent of processPulseTouchBuffer.
    """
    n_frames = len(r_signal)
    if n_frames < MIN_FRAMES_REQUIRED:
        return {'bpm': None, 'quality': 0, 'reason': 'insufficient_frames'}
        
    mean_r = np.mean(r_signal)
    mean_g = np.mean(g_signal)
    
    if mean_r < 40:
        return {'bpm': None, 'quality': 0, 'reason': 'too_dark'}
        
    var_r = np.var(r_signal)
    var_g = np.var(g_signal)
    
    # Dynamic channel selection
    if var_g > var_r * 1.5:
        raw_signal = g_signal
    else:
        raw_signal = r_signal
        
    amplitude = np.max(raw_signal) - np.min(raw_signal)
    if amplitude < 0.1:
        return {'bpm': None, 'quality': 0, 'reason': 'low_amplitude'}
        
    # cPPG uses moving average detrending explicitly before bandpass
    detrended = detrend_moving_average(raw_signal, int(fs))
    normalized = normalize(detrended)
    filtered = bandpass_filter(normalized, fs)
    
    f, mags = compute_welch_psd(filtered, fs)
    
    if len(mags) == 0:
        return {'bpm': None, 'quality': 0, 'reason': 'no_frequency'}
        
    peak_idx = np.argmax(mags)
    peak_mag = mags[peak_idx]
    
    total_mag = np.sum(mags)
    quality_score = (peak_mag / (total_mag / len(mags))) * 0.1
    
    if quality_score < MIN_QUALITY_THRESHOLD:
        return {'bpm': None, 'quality': quality_score, 'reason': 'low_quality'}
        
    return {
        'bpm': f[peak_idx] * 60.0,
        'quality': quality_score,
        'reason': None
    }
