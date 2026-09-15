# AI Cyclone Prediction & Intelligence System

**Smart India Hackathon (SIH) research prototype** for AI-assisted tropical cyclone identification, classification, intensity estimation and track analysis using satellite and environmental data.

## ZIP integration status

This repository has been repaired using the supplied **ai-cyclone-prediction-&-intelligence-system (1).zip** as the source of truth for the ML architecture, preprocessing pipeline, environment configuration, and project details. The original project concepts are being preserved rather than replaced by a simplified demo.

Integrated from the archive:
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

The archive contains an **environment-variable placeholder** for `GEMINI_API_KEY`; it does not contain a usable secret API key. Real API keys must not be committed to GitHub. Use `.env.local`/deployment secrets and the `.env.example` template. The application can read `GEMINI_API_KEY` at runtime without exposing it in client-side source.

## ML status

The supplied archive contains the **model architecture and inference adapter**, but no verified trained checkpoint/weights were present. Therefore the repository must not claim that a trained model is connected merely because the architecture exists. The inference adapter keeps the supplied demonstration baseline explicitly marked as demo data and provides the integration point for the team's actual checkpoint.

## Architecture

```text
INSAT / other satellite imagery + environmental observations
                         ↓
             Format & quality validation
                         ↓
             512×512 preprocessing
                         ↓
        Radiometric/channel normalization
                         ↓
        ResNet50 / future CNN-Transformer
                 ↙                     ↘
       Pattern classification      Intensity regression
                 ↘                     ↙
              Track + intensity fusion
                         ↓
        Historical analog / environmental context
                         ↓
             Explainable dashboard
```

## Important data disclaimer

Records such as **VAAYU** supplied in the prototype are demonstration records unless connected to a verified official feed. They must not be represented as current official IMD/RSMC warnings. Satellite image URLs in the supplied archive should likewise be replaced with authenticated official products before operational claims are made.

**Emergency warning decisions must always use official meteorological advisories.**

## Local development

Frontend prototype: install Node.js 20+ dependencies and run the Vite/React application from the supplied source tree.

Python ML service: create a virtual environment, install `backend/requirements.txt`, then expose the FastAPI service used by the frontend.

Keep secrets outside Git and configure `GEMINI_API_KEY`, database credentials and model-weight paths through the environment.

## SIH positioning

The differentiator is not replacing IMD. It is an AI-assisted decision-support layer that unifies multi-source satellite analysis, environmental validation, historical analog comparison, intensity/track modelling and explainable presentation in one workflow.
