"""
Data preprocessing module for FireSight.
Maps X/Y grid coordinates to real lat/lon, encodes features, and creates risk labels.
"""
import pandas as pd
import numpy as np
import os
import json

# Montesinho Natural Park, Portugal
# Approximate bounding box: Lat 41.72-41.92, Lon -6.78 to -6.48
LAT_MIN, LAT_MAX = 41.72, 41.92
LON_MIN, LON_MAX = -6.78, -6.48

MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
}

DAY_MAP = {
    'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 7
}


def map_grid_to_coords(x: int, y: int) -> tuple:
    """Map X (1-9) and Y (1-9) grid to real lat/lon."""
    lon = LON_MIN + (x - 1) * (LON_MAX - LON_MIN) / 8
    lat = LAT_MIN + (y - 1) * (LAT_MAX - LAT_MIN) / 8
    return round(lat, 4), round(lon, 4)


def classify_risk(area: float) -> int:
    """Classify fire risk based on burned area (ha).
    0 = Low, 1 = Medium, 2 = High, 3 = Critical
    """
    if area == 0:
        return 0  # Low - no fire
    elif area < 5:
        return 1  # Medium
    elif area < 50:
        return 2  # High
    else:
        return 3  # Critical


def preprocess_data(csv_path: str = None):
    """Load and preprocess the forestfires.csv dataset."""
    if csv_path is None:
        csv_path = os.path.join(os.path.dirname(__file__), '..', 'forestfires.csv')

    df = pd.read_csv(csv_path)

    # Map grid coordinates to real lat/lon
    coords = df.apply(lambda row: map_grid_to_coords(row['X'], row['Y']), axis=1)
    df['latitude'] = coords.apply(lambda c: c[0])
    df['longitude'] = coords.apply(lambda c: c[1])

    # Encode month and day
    df['month_num'] = df['month'].str.lower().map(MONTH_MAP)
    df['day_num'] = df['day'].str.lower().map(DAY_MAP)

    # Create risk labels from area
    df['risk_level'] = df['area'].apply(classify_risk)

    # Weather features for the model
    feature_cols = ['temp', 'RH', 'wind', 'rain']
    X = df[feature_cols].values
    y = df['risk_level'].values

    return df, X, y, feature_cols


def get_historical_averages(csv_path: str = None):
    """Compute historical weather averages grouped by grid cell for fallback."""
    df, _, _, _ = preprocess_data(csv_path)

    averages = df.groupby(['latitude', 'longitude']).agg({
        'temp': 'mean',
        'RH': 'mean',
        'wind': 'mean',
        'rain': 'mean'
    }).reset_index()

    global_avg = {
        'temp': float(df['temp'].mean()),
        'RH': float(df['RH'].mean()),
        'wind': float(df['wind'].mean()),
        'rain': float(df['rain'].mean())
    }

    return averages, global_avg


def get_heatmap_data(csv_path: str = None):
    """Get location + risk data for heatmap visualization."""
    df, _, _, _ = preprocess_data(csv_path)

    # Aggregate by location - use the most common risk level and average area
    heatmap = df.groupby(['latitude', 'longitude']).agg({
        'risk_level': lambda x: x.mode()[0] if len(x.mode()) > 0 else 0,
        'area': 'mean',
        'temp': 'mean',
        'RH': 'mean',
        'wind': 'mean',
        'rain': 'mean'
    }).reset_index()

    risk_labels = {0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical'}
    heatmap['risk_label'] = heatmap['risk_level'].map(risk_labels)

    return heatmap.to_dict(orient='records')


if __name__ == '__main__':
    df, X, y, cols = preprocess_data()
    print(f"Dataset shape: {df.shape}")
    print(f"Features shape: {X.shape}")
    print(f"Risk distribution: {pd.Series(y).value_counts().sort_index().to_dict()}")
    print(f"\nSample coordinates:")
    print(df[['X', 'Y', 'latitude', 'longitude']].drop_duplicates().head(10))
