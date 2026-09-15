import os
import requests
import zipfile

def download_zenodo_record(record_id: str, target_dir: str):
    print(f"Fetching metadata for Zenodo record {record_id}...")
    api_url = f"https://zenodo.org/api/records/{record_id}"
    
    response = requests.get(api_url)
    if response.status_code != 200:
        print(f"Failed to fetch metadata. Status code: {response.status_code}")
        return
        
    data = response.json()
    files = data.get("files", [])
    
    if not files:
        print("No files found in this Zenodo record.")
        return
        
    os.makedirs(target_dir, exist_ok=True)
    
    for f in files:
        filename = f["key"]
        download_url = f["links"]["self"]
        file_path = os.path.join(target_dir, filename)
        
        print(f"Downloading {filename}...")
        with requests.get(download_url, stream=True) as r:
            r.raise_for_status()
            with open(file_path, 'wb') as out_file:
                for chunk in r.iter_content(chunk_size=8192):
                    out_file.write(chunk)
                    
        if filename.endswith(".zip"):
            print(f"Extracting {filename}...")
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
            
    print("Zenodo download complete!")

if __name__ == "__main__":
    download_zenodo_record("8277462", "research/datasets/raw/zenodo_8277462")
