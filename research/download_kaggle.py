import os
import subprocess
import sys

def check_kaggle_installed():
    try:
        import kaggle
        return True
    except ImportError:
        return False
    except OSError:
        # kaggle.json not found
        return True

def download_dataset(dataset_name: str, target_dir: str):
    print(f"Downloading {dataset_name} into {target_dir}...")
    
    os.makedirs(target_dir, exist_ok=True)
    
    cmd = [
        sys.executable, "-m", "kaggle", "datasets", "download", 
        "-d", dataset_name, 
        "-p", target_dir, 
        "--unzip"
    ]
    
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print("\nError: Failed to download dataset. Ensure you have the Kaggle API configured.")
        print("Steps:")
        print("1. Go to Kaggle.com -> Account -> Create New API Token")
        print(r"2. Place kaggle.json in C:\Users\<Username>\.kaggle\kaggle.json")
        print(r"3. Run `pip install kaggle` if you haven't already.")
    else:
        print("Download and extraction complete!")

if __name__ == "__main__":
    if not check_kaggle_installed():
        print("Installing kaggle module...")
        subprocess.run([sys.executable, "-m", "pip", "install", "kaggle"])
        
    # Example dataset
    dataset_name = "harshwardhanfartale/eyes-defy-anemia"
    target_dir = "research/datasets/raw/eyes-defy-anemia"
    
    download_dataset(dataset_name, target_dir)
