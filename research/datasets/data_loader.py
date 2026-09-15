import os
import yaml
import numpy as np
import pandas as pd
from typing import Dict, Any, List

class DiuMedDatasetRegistry:
    def __init__(self, registry_path: str = "research/datasets/registry.yaml"):
        self.registry_path = registry_path
        self.datasets = self._load_registry()

    def _load_registry(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.registry_path):
            raise FileNotFoundError(f"Registry not found at {self.registry_path}")
        with open(self.registry_path, 'r') as f:
            # YAML might contain multiple documents or just a list
            data = yaml.safe_load(f)
            return data if isinstance(data, list) else []

    def get_dataset(self, name: str) -> Dict[str, Any]:
        for d in self.datasets:
            if d.get("name") == name:
                return d
        raise ValueError(f"Dataset {name} not found in registry")

    def list_downloaded(self) -> List[str]:
        return [d["name"] for d in self.datasets if d.get("download_status") == "downloaded_and_used"]

class DatasetLoader:
    """
    Base class for modality-specific dataset loaders.
    """
    def __init__(self, data_root: str):
        self.data_root = data_root

    def load_subject(self, subject_id: str):
        raise NotImplementedError("Subclasses must implement load_subject")

class RppgDataLoader(DatasetLoader):
    """
    Stub for loading rPPG datasets (UBFC, PURE, MMPD, etc.)
    """
    def load_subject(self, subject_id: str):
        # TODO: Implement video decoding and ground truth extraction
        pass

class ContactPpgDataLoader(DatasetLoader):
    """
    Stub for loading contact PPG datasets (BUT PPG, Welltory)
    """
    def load_subject(self, subject_id: str):
        # TODO: Implement video/waveform decoding
        pass

class HbDataLoader(DatasetLoader):
    """
    Stub for loading Conjunctival Hb datasets (Zenodo 8277462)
    """
    def load_subject(self, subject_id: str):
        # TODO: Implement image loading and laboratory ground truth pairing
        pass
