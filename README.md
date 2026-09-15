# STRIDE

**Satellite-based Tropical Risk & Intelligence for Disaster Early-warning**

> **See the Storm. Predict the Risk. Protect the Future.**

**STRIDE** is a Smart India Hackathon (SIH) research prototype for AI-assisted tropical cyclone identification, classification, intensity estimation and track analysis using satellite and environmental data.

## What STRIDE does

- 🛰️ Multi-source satellite imagery analysis
- 🌪️ Tropical cyclone identification and pattern classification
- 📈 Intensity estimation and prediction support
- 🗺️ Track-analysis and visualization concepts
- 🌊 Environmental and coastal-risk context
- 🔎 Historical cyclone / analog comparison
- 💡 Explainable analysis for decision support
- 🛡️ Satellite-image validation to reduce non-satellite inputs

## Production/SIH hardening

The current production path is **fail-closed**: if the trained ML service is unavailable, STRIDE does not invent a cyclone result, confidence, wind, pressure, track or risk value.

The analysis flow is:

```text
Upload
  ↓
File validation
  ↓
Satellite-input verification
  ↓
Preprocessing
  ↓
Stage 1 — Identification
  ↓
Stage 2 — Classification
  ↓
Stage 3 — Temporal prediction (time-series input)
  ↓
Risk / decision support
```

Data provenance is explicitly separated into **TRAINED MODEL OUTPUT**, **HISTORICAL**, **DEMONSTRATION**, and **UNAVAILABLE** states. Stock imagery is not presented as satellite observation data.

Track/movement prediction is treated as a temporal problem: a single satellite frame does not fabricate movement speed or a future track.

## ZIP integration status

This repository preserves the supplied **AI Cyclone Prediction & Intelligence System** source concepts rather than replacing them with a simplified demo.

Integrated project concepts include:
- ResNet50 dual-head cyclone classifier/regressor architecture
- 512×512 satellite preprocessing pipeline
- IR-1 radiance normalization and channel alignment
- Historical cyclone / analog data model
- Satellite-library metadata and channel concepts (INSAT-3D / INSAT-3DR / IR / VIS / WV / cloud-top BT)
- Environmental-data validation and analysis concepts
- Track and intensity prediction concepts
- Gemini API integration hook
- FastAPI/ML backend dependency set
- SIH dashboard, alerts, historical analog, coastal vulnerability, map, TTS, PDF-export and analysis concepts from the supplied source tree

## API key handling

The project uses an environment-variable placeholder for `GEMINI_API_KEY`; it does not contain a usable secret API key. Real API keys must never be committed to GitHub. Use deployment secrets or a local environment file.

## ML status

The production API expects trained model artifacts and exposes identification, classification and prediction as separate stages. A verified trained checkpoint/weights package is required for genuine model predictions. Demonstration outputs must never be presented as trained-model results.

## Satellite source registry

STRIDE can link users to recognised source portals such as:
- MOSDAC / ISRO
- India Meteorological Department (IMD)
- NOAA / NESDIS
- Zoom Earth as a visual storm-monitoring reference

These links are source navigation, not STRIDE-generated observations.

## Architecture

```text
INSAT / other satellite imagery + environmental observations
                         ↓
             Format & quality validation
                         ↓
             Satellite-input verification
                         ↓
             512×512 preprocessing
                         ↓
        Radiometric/channel normalization
                         ↓
                  STRIDE AI CORE
             ↙          ↓          ↘
       Identification Classification Prediction
             ↘          ↓          ↙
          Track + intensity fusion
                         ↓
        Historical analog / environmental context
                         ↓
                  STRIDE dashboard
```

## Important data disclaimer

Prototype records and imagery must be connected to verified official sources before operational claims are made. STRIDE is intended as an AI-assisted decision-support layer and does **not** replace official meteorological warnings or advisories.

**Emergency warning decisions must always use official meteorological advisories.**

## SIH positioning

STRIDE does not aim to replace existing meteorological warning agencies. Its role is to provide an AI-assisted decision-support workflow that brings multi-source satellite analysis, environmental validation, historical analog comparison, intensity/track modelling and explainable presentation together in one platform.
