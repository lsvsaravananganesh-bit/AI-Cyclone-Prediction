"""Train a baseline ML cyclone movement/intensity model.

Input CSV columns: latitude, longitude, wind, pressure, sst, humidity, shear.
Rows must be ordered by cyclone and timestamp. Optional columns: cyclone_id, timestamp.
The model learns next-step delta latitude, delta longitude and wind change.
"""
import argparse, json, os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.multioutput import MultiOutputRegressor

FEATURES=["latitude","longitude","wind","pressure","sst","humidity","shear"]
TARGETS=["delta_lat","delta_lon","delta_wind"]

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--csv",required=True); ap.add_argument("--out",default="ml/artifacts/track_model.joblib"); args=ap.parse_args()
    df=pd.read_csv(args.csv)
    missing=[c for c in FEATURES if c not in df.columns]
    if missing: raise SystemExit(f"Missing columns: {', '.join(missing)}")
    group="cyclone_id" if "cyclone_id" in df.columns else None
    if group:
        df=df.sort_values([group,"timestamp"] if "timestamp" in df.columns else [group])
        g=df.groupby(group)
        df["delta_lat"]=g["latitude"].shift(-1)-df["latitude"]
        df["delta_lon"]=g["longitude"].shift(-1)-df["longitude"]
        df["delta_wind"]=g["wind"].shift(-1)-df["wind"]
    else:
        df["delta_lat"]=df["latitude"].shift(-1)-df["latitude"]
        df["delta_lon"]=df["longitude"].shift(-1)-df["longitude"]
        df["delta_wind"]=df["wind"].shift(-1)-df["wind"]
    df=df.replace([np.inf,-np.inf],np.nan).dropna(subset=FEATURES+TARGETS)
    if len(df)<30: raise SystemExit("Need at least 30 valid sequential training rows.")
    model=MultiOutputRegressor(RandomForestRegressor(n_estimators=300,random_state=42,n_jobs=-1,min_samples_leaf=2))
    model.fit(df[FEATURES],df[TARGETS])
    os.makedirs(os.path.dirname(args.out),exist_ok=True)
    joblib.dump({"model":model,"features":FEATURES,"targets":TARGETS},args.out)
    with open(args.out+".json","w") as f: json.dump({"rows":len(df),"features":FEATURES,"targets":TARGETS},f,indent=2)
    print(f"Saved {args.out} using {len(df)} sequential rows")

if __name__=="__main__": main()
