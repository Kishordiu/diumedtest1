import os
import subprocess
from dotenv import load_dotenv
import sys

# Load the Kaggle API token and other env vars from .env.local
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

DATASETS = [
    "harshwardhanfartale/eyes-defy-anemia",
    "aiolapo/jaundice-image-data"
]

def main():
    target_dir = os.path.join(os.path.dirname(__file__), "datasets", "raw")
    os.makedirs(target_dir, exist_ok=True)
    
    print("DiuMed - Clinical Dataset Downloader")
    print("====================================")
    
    for dataset in DATASETS:
        print(f"\nDownloading dataset: {dataset}...")
        try:
            subprocess.run([
                sys.executable, "-m", "kaggle", "datasets", "download", 
                "-d", dataset, 
                "-p", target_dir, 
                "--unzip"
            ], check=True)
            print(f"Successfully downloaded and extracted {dataset}.")
        except subprocess.CalledProcessError as e:
            print(f"Error downloading {dataset}. Ensure kaggle.json is configured correctly.")
            print(f"Details: {e}")

if __name__ == "__main__":
    main()
