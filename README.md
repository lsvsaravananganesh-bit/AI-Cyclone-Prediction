# 🌪️ AI Cyclone Prediction — SIH 2026

## SIH Problem Statement

> **To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data.**

## Our Solution

**AI Cyclone Prediction** is a simple, functional AI/ML decision-support platform built around the SIH problem statement. It combines multi-source satellite imagery, environmental observations and historical cyclone data to help identify cyclone formations, classify cyclone patterns/stages and predict future cyclone behaviour.

### Core workflow

```text
MULTI-SOURCE SATELLITE + ENVIRONMENTAL DATA
                    ↓
             PREPROCESSING
                    ↓
              AI / ML ENGINE
                    ↓
       ┌────────────┼────────────┐
       ↓            ↓            ↓
   IDENTIFY      CLASSIFY     PREDICT
       ↓            ↓            ↓
  Cyclone       Pattern /    Track +
  Detection      Stage       Intensity
       └────────────┼────────────┘
                    ↓
          CONFIDENCE + XAI
                    ↓
          GIS VISUALIZATION
                    ↓
         SIH DECISION SUPPORT
```

## Three Main AI/ML Functions

### 1. Identification
Detect potential tropical cyclone formations from satellite imagery and related environmental information.

### 2. Classification
Classify the detected system according to its learned cyclone pattern/stage and, where supported by the data, its IMD cyclone category.

### 3. Prediction
Estimate future cyclone movement and intensity using current observations, historical cyclone behaviour and trained ML models. Forecast outputs must include model status and uncertainty where available.

## Multi-Source Data

The architecture supports:

- **IR imagery** — cloud structure and thermal characteristics
- **Visible imagery** — cyclone structure during daylight
- **Water Vapour imagery** — atmospheric moisture structure
- **Cloud-Top Brightness Temperature** — convective activity
- **Sea Surface Temperature (SST)** — oceanic energy/environmental feature
- **Wind and atmospheric variables** — intensity and movement features
- **Historical cyclone tracks** — training, validation and analog comparison

## Website

🚀 Live frontend: https://lsvsaravananganesh-bit.github.io/AI-Cyclone-Prediction/

💻 Repository: https://github.com/lsvsaravananganesh-bit/AI-Cyclone-Prediction

The dashboard provides:

- SIH command-centre interface
- Cyclone tracker with observed/forecast separation
- Official IMD/RSMC satellite product access
- Satellite image upload and AI-analysis endpoint
- Environmental CSV/JSON validation
- Cyclone search and historical intelligence
- Model-status-aware prediction panels
- Official-source verification links
- Explicit **OFFICIAL / AI / DEMO / MODEL NOT TRAINED** states

## Technical Architecture

```text
Frontend Dashboard
      ↓
FastAPI Backend
      ↓
┌──────────────┬──────────────┬──────────────┐
│ Cyclone API  │ ML Inference │ Data Service │
└──────────────┴──────────────┴──────────────┘
      ↓
PostgreSQL + ML Models
```

### Backend
`backend/main.py` provides:

- `GET /api/health`
- `GET /api/cyclones/search?q=`
- `GET /api/cyclones/active`
- `POST /api/ml/analyze-image`
- `POST /api/data/validate`

### Database
`backend/schema.sql` contains tables for:

- cyclone records
- cyclone track points
- AI/ML analyses
- PostgreSQL trigram/fuzzy-search indexes

### ML baseline
`ml/train_image_classifier.py` provides a trainable ResNet18 transfer-learning baseline for satellite-image classification.

Dataset structure:

```text
ml/datasets/classification/
├── cyclonic_storm/
├── severe_cyclonic_storm/
├── very_severe_cyclonic_storm/
└── ...
```

Train with:

```bash
pip install -r backend/requirements.txt
python ml/train_image_classifier.py --data ml/datasets/classification --epochs 10
```

**No fabricated accuracy, confidence or forecast values should be displayed.** Until a trained and evaluated model is connected, the UI explicitly reports that the model is not trained/connected.

## Live Data Principle

Official observations must remain separate from AI predictions. The platform should use verified IMD/RSMC data when available and clearly label the source. If live data cannot be obtained, the system must show an unavailable/no-active-system state instead of inventing a cyclone, coordinate, forecast or warning.

## SIH Differentiator

We are **not replacing IMD or existing warning systems**. We are adding an AI-assisted intelligence layer that brings satellite pattern analysis, environmental feature fusion, cyclone search, historical comparison, ML prediction, uncertainty and GIS visualization into one simple workflow.

> **OBSERVE → ANALYSE → PREDICT → VISUALIZE → DECIDE**

## Scope

This is a research and decision-support prototype. It does not issue official warnings and must not replace IMD/RSMC advisories or emergency information.
