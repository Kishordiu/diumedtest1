import numpy as np
from scipy.signal import butter, lfilter, welch
from typing import Dict, Any, Tuple, Optional

# Match the TypeScript constraints
MIN_BPM = 42
MAX_BPM = 180
MIN_FREQ_HZ = MIN_BPM / 60.0
MAX_FREQ_HZ = MAX_BPM / 60.0
MIN_FRAMES_REQUIRED = 90
MIN_QUALITY_THRESHOLD = 0.05

def detrend_signal(signal: np.ndarray) -> np.ndarray:
    """Linear detrending."""
    n = len(signal)
    if n < 2:
        return signal
    x = np.arange(n)
    coeffs = np.polyfit(x, signal, 1)
    trend = np.polyval(coeffs, x)
    return signal - trend

def bandpass_filter(signal: np.ndarray, fs: float) -> np.ndarray:
    """Butterworth bandpass filter matching TS moving average approximation or better."""
    nyq = 0.5 * fs
    low = MIN_FREQ_HZ / nyq
    high = MAX_FREQ_HZ / nyq
    if low <= 0 or high >= 1:
        return signal
    b, a = butter(4, [low, high], btype='band')
    return lfilter(b, a, signal)

def compute_welch_psd(signal: np.ndarray, fs: float) -> Tuple[np.ndarray, np.ndarray]:
    """Welch PSD."""
    n = len(signal)
    nperseg = 2 ** int(np.log2(n))
    if nperseg < 64:
        nperseg = n
    f, pxx = welch(signal, fs, nperseg=nperseg, window='hamming')
    
    valid_idx = (f >= MIN_FREQ_HZ) & (f <= MAX_FREQ_HZ)
    return f[valid_idx], np.sqrt(pxx[valid_idx])

def compute_pos(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Plane-Orthogonal-to-Skin (POS) algorithm."""
    mean_r = np.mean(r)
    mean_g = np.mean(g)
    mean_b = np.mean(b)
    
    rn = r / (mean_r + 1e-10)
    gn = g / (mean_g + 1e-10)
    bn = b / (mean_b + 1e-10)
    
    x = gn - bn
    y = gn + bn - 2 * rn
    
    std_x = np.std(x)
    std_y = np.std(y)
    alpha = std_x / (std_y + 1e-10)
    
    return x + alpha * y

def compute_chrom(r: np.ndarray, g: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Chrominance (CHROM) algorithm."""
    mean_r = np.mean(r)
    mean_g = np.mean(g)
    mean_b = np.mean(b)
    
    rn = r / (mean_r + 1e-10)
    gn = g / (mean_g + 1e-10)
    bn = b / (mean_b + 1e-10)
    
    x = 3*rn - 2*gn
    y = 1.5*rn + gn - 1.5*bn
    
    std_x = np.std(x)
    std_y = np.std(y)
    alpha = std_x / (std_y + 1e-10)
    
    return x - alpha * y

def process_patch(r: np.ndarray, g: np.ndarray, b: np.ndarray, fs: float, algo: str) -> Dict[str, Any]:
    if algo == 'POS':
        raw = compute_pos(r, g, b)
    else:
        raw = compute_chrom(r, g, b)
        
    detrended = detrend_signal(raw)
    filtered = bandpass_filter(detrended, fs)
    
    f, mags = compute_welch_psd(filtered, fs)
    
    if len(mags) == 0:
        return {'bpm': None, 'quality': 0, 'waveform': filtered}
        
    peak_idx = np.argmax(mags)
    peak_mag = mags[peak_idx]
    
    total_energy = np.mean(mags**2)
    quality = min(1.0, (peak_mag**2) / (total_energy + 1e-10) / 10.0)
    
    return {
        'bpm': f[peak_idx] * 60.0,
        'quality': quality,
        'waveform': filtered
    }

def process_rppg_python(r_signals: Dict[str, np.ndarray], g_signals: Dict[str, np.ndarray], b_signals: Dict[str, np.ndarray], fs: float) -> Dict[str, Any]:
    """
    Python equivalent of processRppgBuffer.
    """
    n_frames = len(next(iter(r_signals.values())))
    if n_frames < MIN_FRAMES_REQUIRED:
        return {'bpm': None, 'quality': 0, 'reason': 'insufficient_frames'}
        
    best_quality = 0
    best_bpm = None
    
    for patch_id in r_signals.keys():
        r = r_signals[patch_id]
        g = g_signals[patch_id]
        b = b_signals[patch_id]
        
        for algo in ['POS', 'CHROM']:
            res = process_patch(r, g, b, fs, algo)
            if res['quality'] > best_quality:
                best_quality = res['quality']
                best_bpm = res['bpm']
                
    if best_quality < MIN_QUALITY_THRESHOLD:
        return {'bpm': None, 'quality': best_quality, 'reason': 'low_quality'}
        
    return {
        'bpm': best_bpm,
        'quality': best_quality,
        'reason': None
    }
