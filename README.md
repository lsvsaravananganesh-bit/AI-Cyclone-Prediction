# AI Cyclone Prediction & Intelligence System

**Smart India Hackathon (SIH) research prototype** for AI-assisted tropical cyclone identification, classification, intensity estimation and track analysis using satellite and environmental data.

## Current status

The repository now has a **deployment-safe standalone entry page** at the repository root. It does not require npm, React, a backend server, API keys, or external image assets to load on GitHub Pages.

The repaired entry page includes:
- Cyclone intelligence dashboard
- Clearly labelled DEMO / SIMULATION data
- Satellite-image upload and local preview
- Historical cyclone reference data
- ML integration status
- End-to-end architecture
- Safety disclaimer separating prototype data from official IMD/RSMC warnings

## Important data disclaimer

Records such as **VAAYU** in the prototype are demonstration data. They must **not** be presented as current official cyclone observations or forecasts. For an operational system, connect verified IMD/RSMC, MOSDAC/INSAT and other authorised datasets and display their timestamps/source metadata.

## ML architecture

```text
Satellite / environmental data
        ↓
Preprocessing + quality validation
        ↓
CNN / Transformer model
        ↓
Pattern classification + intensity estimation
        ↓
Track prediction + explainability
        ↓
Decision-support dashboard
```

The `ml/` and `backend/` directories remain as integration scaffolding for the team's trained model and Python API. Do not claim a trained model is connected until the validated checkpoint and evaluation metrics are actually integrated.

## Local development of the original React prototype

The uploaded React/Vite source can be developed separately with Node.js 20+ after installing its dependencies. The standalone root page is intentionally dependency-free so the GitHub repository itself always has a working landing page.

## SIH positioning

This project is positioned as an **AI-assisted decision-support layer**, not a replacement for official warning authorities. Its proposed differentiator is the unified workflow combining satellite pattern analysis, environmental-data validation, historical analog comparison, track/intensity modelling and explainable presentation.

**Emergency warning decisions must always use official meteorological advisories.**
