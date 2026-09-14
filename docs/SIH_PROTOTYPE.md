# AI Cyclone Prediction — SIH 2026 Prototype Specification

## 1. Exact problem statement

> To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data.

## 2. Prototype objective

The prototype is a research and decision-support layer that converts satellite imagery and cyclone/environmental information into:

1. cyclone identification;
2. learned pattern classification;
3. short-step movement/intensity regression output;
4. confidence and model-status information;
5. GIS visualization;
6. official-source context from IMD/RSMC.

It does not replace official IMD/RSMC warnings.

## 3. Exact currently deployed ML flow

```text
Satellite image(s)
      |
      v
Preprocessing
- RGB -> grayscale
- centre crop (75% square)
- optional inversion
- autocontrast
- resize 128 x 128
- 4-channel tensor construction
      |
      +-----------------------------+
      |                             |
      v                             v
Stage 1                       Stage 2
Identification               Classification
CNN/Keras model              temporal Keras model
      |                             |
cyclone / no cyclone         Weak / Moderate / Strong
      |                             |
      +-------------+---------------+
                    |
                    v
                 Stage 3
            temporal Keras regression
                    |
        +-----------+-----------+-----------+
        |                       |           |
 latitude drift          longitude drift  wind change  MSLP change
        |
        v
Optional current lat/lon supplied by user
        |
        v
Next-position calculation
        |
        v
GIS / dashboard visualization
```

### Stage 1 — Identification

Input: latest preprocessed frame with shape `128 x 128 x 4`.

Output:
- `detected`: boolean
- `probability`: detection probability

If Stage 1 is negative, Stage 2 and Stage 3 are intentionally gated and no map marker is invented.

### Stage 2 — Pattern classification

Input: a three-frame tensor with shape equivalent to `3 x 128 x 128 x 4`.

A single uploaded frame is repeated three times as a documented fallback. Three genuine consecutive frames activate temporal inference mode.

Output classes currently implemented by the deployed model:
- Category 0 (Weak)
- Category 1 (Moderate)
- Category 2 (Strong)

These are **model classes**, not an automatic claim that the result is an official IMD category.

Calibrated class weights are applied before selecting the final class.

### Stage 3 — Prediction regression

The deployed regression model returns four normalized targets that are converted using the stored target statistics:
- latitude drift in degrees;
- longitude drift in degrees;
- wind change in knots;
- MSLP change in hPa.

If current latitude and longitude are supplied, the backend calculates a next position. If coordinates are not supplied, the frontend must not fabricate a location.

## 4. Model artifacts

The deployed backend model directory contains:

- `identification_model.keras`
- `classification_model.keras`
- `prediction_model.keras`
- `calibrated_weights.npy`
- `target_stats.pkl`

The frontend only calls the existing inference endpoint. These artifacts are not downloaded into the browser.

## 5. API contract used by the prototype

### Health

`GET /api/health`

Used to show:
- API status;
- three-stage ML readiness;
- IMD credential configuration;
- database configuration.

### Image inference

`POST /api/ml/analyze-image`

Multipart fields:
- `file` — 1 to 3 images;
- `latitude` — optional current latitude;
- `longitude` — optional current longitude;
- `invert` — optional preprocessing flag.

Supported images:
- JPG/JPEG
- PNG
- WEBP
- TIFF

### Official active cyclone proxy

`GET /api/cyclones/active`

The backend only reports official IMD data when the required backend credential is configured. No active cyclone is invented when the feed is unavailable.

### Historical search

`GET /api/cyclones/search?q=`

Requires the configured project database.

### Historical track

`GET /api/cyclones/{id}/track`

Requires the configured project database.

### Environmental data validation

`POST /api/data/validate`

The prototype expects at minimum:

```text
timestamp, latitude, longitude
```

The project workflow can additionally carry wind, pressure, SST, humidity and shear fields.

## 6. Multi-source data design

The complete research architecture can combine:

- IR imagery;
- visible imagery;
- water-vapour imagery;
- cloud-top brightness temperature;
- sea-surface temperature;
- wind;
- pressure;
- humidity;
- vertical wind shear;
- historical cyclone tracks.

The current deployed image endpoint accepts image files and the current model's preprocessing constructs the four-channel tensor expected by the trained artifacts. Environmental variables and historical tracks are represented in the overall prototype architecture and can be expanded into the training/inference pipeline without changing the dashboard contract.

## 7. Dashboard modules

1. **Command** — system status and risk context.
2. **Live Track** — official observed/forecast separation.
3. **Environment** — SST, cloud-top temperature, humidity and shear context.
4. **Forecast** — model status and prediction outputs.
5. **Satellite AI** — direct image upload.
6. **AI Model Control Centre** — exact Stage 1/2/3 inference, 1–3 frame upload and optional coordinates.
7. **History** — historical cyclone search and track context.
8. **IMD Sources** — official reference links.

## 8. Prototype demo sequence

### Demo A — single satellite frame

1. Open the dashboard.
2. Scroll to Satellite AI.
3. Upload a supported satellite image.
4. Wait for the Render API response.
5. Show Stage 1 detection, Stage 2 class and Stage 3 regression values.
6. Explain that a single frame is repeated three times only as the documented fallback.

### Demo B — temporal model

1. Open the AI Model Control Centre.
2. Upload three genuine consecutive satellite frames.
3. Add current latitude and longitude if available from a trusted source.
4. Run the model.
5. Show `three-frame-sequence` mode.
6. Show movement deltas and next position.
7. Let the map layer visualize the AI result separately from official observations.

### Demo C — environmental data

Upload a CSV/JSON containing timestamp, latitude and longitude plus optional environmental variables. Validate the structure before using it for a training or future inference pipeline.

## 9. What must not be claimed

Do not claim:

- a fake live cyclone;
- an official IMD forecast from the AI model;
- model accuracy unless measured on a held-out test set;
- Grad-CAM/XAI unless an actual explanation artifact is returned;
- precise future track points when coordinates or model outputs are unavailable;
- that the three-channel/single-frame fallback is equivalent to genuine temporal input.

## 10. Required evaluation before operational-style claims

For a research-quality final model, evaluate on storms/time periods not used for training.

### Detection
- accuracy;
- precision;
- recall;
- F1;
- confusion matrix;
- ROC-AUC where appropriate.

### Classification
- per-class precision/recall/F1;
- macro-F1;
- confusion matrix;
- calibration quality.

### Intensity/regression
- MAE;
- RMSE;
- bias;
- correlation/R² where appropriate.

### Track
- mean positional error;
- error at fixed forecast horizons;
- along-track and cross-track error where implemented.

Never put invented percentages into the dashboard.

## 11. SIH judge explanation

### What makes this different from existing cyclone warning systems?

Existing meteorological agencies already provide authoritative observations, forecasts and warnings. This project does not try to replace them. The differentiator is an integrated AI intelligence layer that brings satellite-image analysis, learned pattern classification, movement/intensity regression, historical search, environmental context and GIS visualization into one research workflow.

A concise answer:

> "We are not building another warning website. We are building an AI-assisted analysis layer over the existing warning ecosystem. It automatically analyses satellite patterns, classifies the observed system, estimates short-step movement and intensity changes, and visualizes AI output separately from authoritative IMD observations. This makes the system useful for research, analyst support and rapid multi-source interpretation while keeping official warnings authoritative."

## 12. Technology stack

- Frontend: static HTML/CSS/JavaScript + Leaflet
- Backend: FastAPI
- ML: TensorFlow/Keras
- Numerical processing: NumPy
- Image processing: Pillow
- Database interface: SQLAlchemy/PostgreSQL when configured
- Deployment: GitHub Pages frontend + Render API

## 13. Data-source direction

Official Indian context should prioritize IMD/RSMC satellite and cyclone products. Historical research can use validated best-track datasets such as IBTrACS. Any external dataset used for final training must be documented with its version, source, time coverage and licensing/usage conditions.

## 14. Deployment rule

The SIH frontend is allowed to evolve independently. The deployed Render backend and model artifacts are treated as a stable API contract. Frontend improvements must call the existing endpoints rather than modifying the Render service unless a genuine backend capability is missing.
