import pandas as pd
import numpy as np
from sklearn.linear_model import HuberRegressor
from sklearn.model_selection import KFold
from sklearn.metrics import mean_absolute_error, mean_squared_error
import json
import os

def train_model():
    print("Initializing Professional Robust Hemoglobin Model Pipeline...")
    # Load dataset
    df = pd.read_excel('scratch/eMoglobin_data.xlsx')
    
    # We want to predict 'Actual Hgb (HBl) g/dL' from 'Average hhr' (High Hue Ratio)
    # Drop any rows with missing values
    df = df.dropna(subset=['Actual Hgb (HBl) g/dL', 'Average hhr'])
    
    X = df[['Average hhr']].values
    y = df['Actual Hgb (HBl) g/dL'].values
    
    print(f"Dataset loaded: {len(X)} valid optical samples.")

    # 5-Fold Cross Validation for robust evaluation
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    maes, rmses = [], []
    
    # We use HuberRegressor for robust outlier handling, which is critical for clinical data
    model = HuberRegressor(epsilon=1.35)
    
    for train_index, test_index in kf.split(X):
        X_train, X_test = X[train_index], X[test_index]
        y_train, y_test = y[train_index], y[test_index]
        
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        
        maes.append(mean_absolute_error(y_test, preds))
        rmses.append(np.sqrt(mean_squared_error(y_test, preds)))
        
    print(f"Cross-Validation MAE:  {np.mean(maes):.2f} g/dL (±{np.std(maes):.2f})")
    print(f"Cross-Validation RMSE: {np.mean(rmses):.2f} g/dL")

    # Retrain on the entire dataset for production
    model.fit(X, y)
    beta_0 = float(model.intercept_)
    beta_1 = float(model.coef_[0])
    
    print(f"\nFinal Production Weights (Huber Regressor):")
    print(f"Bias (Intercept): {beta_0:.4f}")
    print(f"Weight (HHR):     {beta_1:.4f}")
    
    # Export weights to model_weights.json
    weights_path = os.path.join('src', 'shared', 'ml', 'model_weights.json')
    with open(weights_path, 'r') as f:
        weights_data = json.load(f)
        
    weights_data['hb_estimator'] = {
        "name": "hb_estimator",
        "type": "linear",
        "weights": [beta_1],
        "bias": beta_0
    }
    
    with open(weights_path, 'w') as f:
        json.dump(weights_data, f, indent=2)
        
    print(f"Successfully exported production weights to {weights_path}")

if __name__ == '__main__':
    train_model()
