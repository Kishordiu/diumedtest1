import os
import numpy as np
import pandas as pd
from typing import Tuple

def generate_synthetic_ppg(bpm: float, fs: float, duration: float, noise_level: float = 0.1) -> np.ndarray:
    """
    Generates a synthetic PPG-like waveform.
    Uses a fundamental frequency and harmonics to approximate the systolic peak and dicrotic notch.
    """
    t = np.linspace(0, duration, int(fs * duration), endpoint=False)
    f0 = bpm / 60.0
    
    # Fundamental (systolic)
    signal = 1.0 * np.sin(2 * np.pi * f0 * t)
    # Second harmonic (diastolic/dicrotic notch approximation)
    signal += 0.5 * np.sin(2 * np.pi * 2 * f0 * t + np.pi/4)
    # Third harmonic
    signal += 0.2 * np.sin(2 * np.pi * 3 * f0 * t + np.pi/2)
    
    # Add noise
    noise = np.random.normal(0, noise_level, len(t))
    signal += noise
    
    return signal

def create_synthetic_dataset(output_dir: str, num_samples: int = 10):
    """
    Creates a small synthetic dataset for pipeline validation.
    """
    os.makedirs(output_dir, exist_ok=True)
    
    fs = 30.0
    duration = 10.0
    
    metadata = []
    
    for i in range(num_samples):
        # Generate random BPM between 50 and 120
        true_bpm = np.random.uniform(50, 120)
        noise = np.random.uniform(0.05, 0.5)
        
        # Simulate R, G, B channels (Green has strongest AC signal in contact PPG)
        # Add realistic DC offsets (0-255 scale)
        dc_r = np.random.uniform(150, 240)
        dc_g = np.random.uniform(20, 80)
        dc_b = np.random.uniform(20, 80)
        
        g_signal = dc_g + generate_synthetic_ppg(true_bpm, fs, duration, noise_level=noise)
        r_signal = dc_r + generate_synthetic_ppg(true_bpm, fs, duration, noise_level=noise * 2) * 0.5
        b_signal = dc_b + generate_synthetic_ppg(true_bpm, fs, duration, noise_level=noise * 3) * 0.2
        
        df = pd.DataFrame({
            'R': r_signal,
            'G': g_signal,
            'B': b_signal
        })
        
        filename = f"synthetic_subject_{i:03d}.csv"
        df.to_csv(os.path.join(output_dir, filename), index=False)
        
        metadata.append({
            'filename': filename,
            'true_bpm': true_bpm,
            'noise_level': noise,
            'fs': fs
        })
        
    pd.DataFrame(metadata).to_csv(os.path.join(output_dir, "ground_truth.csv"), index=False)
    print(f"Generated {num_samples} synthetic samples in {output_dir}")

if __name__ == "__main__":
    create_synthetic_dataset("research/datasets/raw/synthetic_ppg", num_samples=20)
