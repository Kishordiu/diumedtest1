import pandas as pd
import json

df = pd.read_excel('scratch/eMoglobin_data.xlsx')
print(json.dumps(df.columns.tolist(), indent=2))
