# AI + ML Architecture — SIH 2026

## 1. System Vision

The project is an **AI-driven tropical cyclone intelligence and decision-support system**. Machine Learning (ML) is the prediction engine inside the broader Artificial Intelligence (AI) layer.

**AI = overall intelligence, data fusion, interpretation and decision support.**  
**ML = learned models for cyclone identification, classification and prediction.**

The system is designed to complement—not replace—authoritative IMD/RSMC observations and warnings.

---

## 2. Complete Architecture

```text
                    MULTI-SOURCE DATA
  ┌────────────────────────────────────────────────────┐
  │ INSAT | IR | Visible | Water Vapour | CTT         │
  │ SST | Wind | Pressure | Humidity | Wind Shear     │
  │ Historical Cyclone Tracks                         │
  └──────────────────────────┬─────────────────────────┘
                             ↓
                    DATA PROCESSING
  ┌────────────────────────────────────────────────────┐
  │ Quality checks | Cleaning | Normalization          │
  │ Image preprocessing | Temporal alignment           │
  └──────────────────────────┬─────────────────────────┘
                             ↓
        ╔══════════════════════════════════════════╗
        ║         AI INTELLIGENCE LAYER            ║
        ║ Multi-source analysis | Context |        ║
        ║ Pattern interpretation | Decision support║
        ╚══════════════════════╤═══════════════════╝
                               ↓
                    ML PREDICTION ENGINE
  ┌────────────────────────────────────────────────────┐
  │                                                    │
  │  STAGE 1 — IDENTIFICATION                         │
  │  Cyclone / Non-Cyclone                            │
  │             ↓                                      │
  │  STAGE 2 — CLASSIFICATION                         │
  │  Weak / Moderate / Strong model classes            │
  │             ↓                                      │
  │  STAGE 3 — PREDICTION                             │
  │  Latitude drift | Longitude drift                  │
  │  Wind change | MSLP change                         │
  │                                                    │
  └──────────────────────────┬─────────────────────────┘
                             ↓
                    AI OUTPUT FUSION
  ┌────────────────────────────────────────────────────┐
  │ Prediction | Model confidence | Trend | Context    │
  │ Historical information | Risk interpretation       │
  └──────────────────────────┬─────────────────────────┘
                             ↓
                 GIS + SATELLITE DASHBOARD
  ┌────────────────────────────────────────────────────┐
  │ Observed track | AI forecast track | Satellite     │
  │ Intensity trend | Environment | Search | Sources   │
  └──────────────────────────┬─────────────────────────┘
                             ↓
                    DECISION SUPPORT
  ┌────────────────────────────────────────────────────┐
  │ Situation awareness | Analyst assistance           │
  │ Rapid multi-source interpretation                  │
  └────────────────────────────────────────────────────┘
```

---

## 3. AI Layer vs ML Layer

| Layer | Responsibility | SIH status |
|---|---|---|
| AI intelligence | Overall cyclone-analysis workflow | Implemented as the system architecture/dashboard workflow |
| Browser visual input gate | Reject obvious human/object/poster inputs before ML upload | Implemented in frontend |
| Data fusion | Bring satellite/environmental/historical context together | Architecture defined; full environmental fusion is future work |
| ML Stage 1 | Cyclone identification | Implemented model endpoint |
| ML Stage 2 | Pattern/intensity-state classification | Implemented model endpoint |
| ML Stage 3 | Movement/intensity-change regression | Implemented model endpoint |
| AI output fusion | Present model outputs with context/status | Implemented in dashboard; deeper fusion can be expanded |
| GIS visualization | Map observations and AI outputs | Implemented frontend |
| Historical intelligence | Search and track context | API/dashboard route available; database population is required |
| Explainability | Grad-CAM/attention explanation | Not yet claimed as implemented |
| Forecast skill evaluation | Held-out-storm metrics | Required before publishing accuracy claims |

---

## 4. ML Pipeline

### Stage 0 — Frontend Input Verification

Before an image reaches the cyclone ML endpoint, the browser performs a visual input-quality check using TensorFlow.js-based general vision models.

Purpose:
- reject obvious human/person content;
- reject obvious posters and common non-meteorological objects;
- reduce accidental uploads of unrelated photographs;
- prevent an unrelated image from being presented as a cyclone prediction.

This is an **input-quality gate**, not a meteorological cyclone classifier. A dedicated cyclone-vs-non-cyclone vision model is a future strengthening step.

### Stage 1 — Identification

Input: preprocessed satellite frame, `128 × 128 × 4`.

Output:
- cyclone detection boolean;
- detection probability.

A negative result gates the downstream classification and prediction stages.

### Stage 2 — Classification

Input: temporal tensor equivalent to `3 × 128 × 128 × 4`.

Output model classes:
- Weak;
- Moderate;
- Strong.

These are current **model classes**, not automatically official IMD categories.

A single image may be repeated three times as a documented fallback. Three genuine consecutive frames provide temporal inference.

### Stage 3 — Prediction

The temporal regression model predicts:
- latitude drift;
- longitude drift;
- wind change;
- mean sea-level pressure change.

When a trusted current latitude/longitude is supplied, the system can derive a next-position estimate. The frontend must never invent a location when coordinates are unavailable.

---

## 5. AI Output Fusion

The AI layer converts separate ML outputs into a single interpretable assessment:

```text
Identification
      +
Pattern classification
      +
Movement/intensity regression
      +
Environmental context
      +
Historical context
      ↓
AI-assisted assessment
      ↓
Dashboard + GIS visualization
```

The system should clearly distinguish:
- **OFFICIAL** — authoritative source such as IMD/RSMC;
- **AI PREDICTION** — output of the project's ML models;
- **DEMO DATA** — demonstration-only data;
- **MODEL NOT READY** — required model artifact unavailable.

AI predictions must not be presented as official warnings.

---

## 6. Input Verification for Human Posters

The intended upload flow is:

```text
User uploads image
       ↓
Browser visual verification
       ↓
Human / poster / object detected?
       ├── YES → INVALID IMAGE → stop
       │
       └── NO
             ↓
      Cyclone ML endpoint
             ↓
        Stage 1 detection
             ↓
        Stage 2 classification
             ↓
        Stage 3 prediction
```

The browser gate reduces obvious false uploads, but it cannot guarantee meteorological correctness because generic pretrained vision models are not trained specifically for tropical cyclone satellite imagery.

For a research-quality final version, train a dedicated **Cyclone Satellite vs Non-Cyclone Satellite** classifier using labelled meteorological images and hard negative examples such as human posters, normal photographs, maps and non-cyclone satellite scenes.

---

## 7. Evaluation Strategy

Do not place an accuracy percentage in the SIH dashboard unless it has been measured on a held-out test set.

### Identification
- Accuracy
- Precision
- Recall
- F1
- ROC-AUC where appropriate
- Confusion matrix

### Classification
- Per-class precision/recall/F1
- Macro-F1
- Confusion matrix
- Calibration quality

### Regression / Intensity
- MAE
- RMSE
- Bias
- Correlation/R² where appropriate

### Track prediction
- Mean positional error
- Fixed forecast-horizon error
- Along-track/cross-track error where implemented

### Input verification
Create a test set containing:
- genuine cyclone satellite images;
- non-cyclone satellite images;
- normal cloud scenes;
- human photographs;
- human posters;
- buildings/roads/landscapes;
- screenshots and charts.

Measure false acceptance and false rejection separately.

---

## 8. Judge Explanation

### What is the AI component?

> “AI is the complete intelligence and decision-support layer. It organizes multi-source observations, uses learned models to understand cyclone patterns, combines prediction outputs with context, and presents an interpretable assessment through the dashboard.”

### What is the ML component?

> “Machine Learning is the predictive engine inside our AI system. Our current pipeline uses three learned stages for cyclone identification, pattern classification, and movement/intensity-change prediction.”

### Are you replacing IMD?

> “No. IMD/RSMC remains the authoritative source for official observations, forecasts and warnings. Our system is an AI-assisted analysis and research layer designed to help interpret multi-source information and visualize model outputs.”

### What is your key differentiator?

> “We are not building another warning website. We are building an integrated AI-assisted analysis layer that connects satellite-image intelligence, learned pattern classification, short-step prediction, environmental and historical context, and GIS visualization in one workflow.”

---

## 9. Technology Architecture

```text
Frontend
  HTML / CSS / JavaScript / Leaflet
          ↓
Browser input verification
          ↓
FastAPI inference API
          ↓
TensorFlow / Keras ML models
          ↓
PostgreSQL / historical data when configured
          ↓
GIS + dashboard visualization
```

Deployment:
- GitHub Pages — frontend;
- Render — existing FastAPI inference service;
- official IMD/RSMC sources — authoritative context.

The frontend can evolve independently while the current Render API remains a stable inference contract.

---

## 10. Implementation Boundary

### Implemented now
- 3-stage Keras ML inference;
- image upload;
- single-frame fallback and three-frame temporal input;
- browser-side visual input gate;
- model-status handling;
- optional coordinate-based next-position calculation;
- GIS visualization;
- official-vs-AI separation;
- historical search interface/API routes.

### Connected but dependent on configuration/data
- official active cyclone feed;
- historical database search/track data;
- environmental data pipeline.

### Future research extensions
- dedicated cyclone-vs-non-cyclone visual verifier;
- full multi-source environmental feature fusion during inference;
- held-out-storm benchmark;
- calibrated uncertainty;
- Grad-CAM/attention visualization;
- stronger track/intensity models;
- operational-scale validation.

This separation keeps the SIH prototype technically honest while providing a clear path from prototype to research-grade system.
