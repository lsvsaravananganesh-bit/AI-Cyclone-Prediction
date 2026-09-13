# 🌪️ AI Cyclone Prediction — SIH 2026

> **SIH Problem Statement:** To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data.

## What is implemented

```text
Satellite + Environmental Data
            ↓
      Preprocessing
            ↓
       AI / ML Engine
      ↙      ↓       ↘
 Identify  Classify   Predict
   ↓         ↓          ↓
formation  pattern   track + intensity
            ↓
      Confidence / XAI
            ↓
       GIS Dashboard
```

### Identification
Satellite-image analysis accepts JPG/PNG/WEBP/TIFF and runs a real ResNet18 classifier when a trained artifact is installed. Include a `no_cyclone` class in the training dataset if the model must perform explicit cyclone/non-cyclone identification.

### Classification
The image model returns the learned class and confidence. IMD category labels are shown separately from model output and are not fabricated.

### Prediction
`ml/train_track_model.py` provides a real Random-Forest baseline that learns next-step latitude/longitude movement and wind change from sequential cyclone/environmental records. The trained artifact is consumed by `POST /api/ml/predict-track`.

## Multi-source inputs

- IR imagery
- Visible imagery
- Water Vapour imagery
- Cloud-Top Brightness Temperature
- SST
- Wind / pressure / humidity / vertical shear
- Historical cyclone tracks

## Live IMD integration

The FastAPI backend now provides a server-side IMD proxy at `GET /api/cyclones/active`. Set `IMD_API_KEY` using credentials obtained through the official IMD API platform. The GitHub Pages dashboard routes its IMD request through this backend when `CYCLONE_API_BASE` is configured. Without verified live data, the dashboard shows **NO ACTIVE SYSTEM / UNAVAILABLE** rather than inventing a track.

## Website

🚀 https://lsvsaravananganesh-bit.github.io/AI-Cyclone-Prediction/

💻 https://github.com/lsvsaravananganesh-bit/AI-Cyclone-Prediction

The dashboard includes a GIS tracker, satellite product viewer, image upload console, environmental-data validation, historical search, model-status indicators and official IMD/RSMC links.

## Backend endpoints

- `GET /api/health`
- `GET /api/cyclones/active`
- `GET /api/cyclones/search?q=`
- `GET /api/cyclones/{id}/track`
- `POST /api/ml/analyze-image`
- `POST /api/ml/predict-track`
- `POST /api/data/validate`

## Train the models

### Image classification

```bash
pip install -r backend/requirements.txt
python ml/train_image_classifier.py --data ml/datasets/classification --epochs 10
```

Expected classes can include:

```text
ml/datasets/classification/
├── no_cyclone/
├── depression/
├── deep_depression/
├── cyclonic_storm/
├── severe_cyclonic_storm/
└── very_severe_cyclonic_storm/
```

Set `CYCLONE_MODEL_PATH` to the generated `.pt` file.

### Track + intensity baseline

Prepare sequential records containing:

```text
timestamp,cyclone_id,latitude,longitude,wind,pressure,sst,humidity,shear
```

Then:

```bash
python ml/train_track_model.py --csv path/to/training.csv
```

Set `CYCLONE_TRACK_MODEL_PATH=ml/artifacts/track_model.joblib` and call `POST /api/ml/predict-track`.

**Do not publish accuracy, confidence or forecast skill until evaluation on held-out storms/time periods is completed.**

## Run backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then in the browser console:

```js
localStorage.setItem('CYCLONE_API_BASE','http://127.0.0.1:8000'); location.reload();
```

For production, deploy FastAPI separately and set the deployed API URL instead.

## SIH differentiator

We are **not replacing IMD or existing warning systems**. We add an AI-assisted intelligence layer that combines multi-source satellite analysis, environmental features, historical cyclone knowledge, ML-based pattern classification, movement/intensity prediction and GIS visualization in one workflow.

> **OBSERVE → ANALYSE → PREDICT → VISUALIZE → DECIDE**

## Scope

Research and decision-support prototype only. Official IMD/RSMC observations and warnings remain authoritative.
