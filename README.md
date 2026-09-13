# 🌪️ AI Cyclone Prediction — SIH 2026

**AI-assisted tropical cyclone identification, classification, intensity/track prediction, satellite intelligence, search and GIS decision support.**

🚀 Live frontend: https://lsvsaravananganesh-bit.github.io/AI-Cyclone-Prediction/
💻 Repository: https://github.com/lsvsaravananganesh-bit/AI-Cyclone-Prediction

## SIH problem statement
> To develop an Artificial Intelligence (AI) / Machine Learning (ML) based system for identification, classification, and prediction of different tropical cyclone patterns using multi-source satellite data.

## What the updated system contains

```text
INSAT / satellite imagery       Environmental data       Historical cyclone records
          │                            │                          │
          └─────────────── Preprocessing & quality checks ───────┘
                                      │
                              AI / ML ENGINE
             ┌────────────────┬───────┼───────────────┐
             ↓                ↓       ↓               ↓
          Detection      Pattern   Intensity       Track
          / location   classification estimation   prediction
             └────────────────┬───────┴───────────────┘
                              ↓
                  Confidence + uncertainty + XAI
                              ↓
                   FastAPI + PostgreSQL API
                              ↓
             SIH Command Center / GIS / Search
```

### Frontend
- SIH command-centre dashboard
- Live cyclone tracker with observed vs forecast separation
- Official IMD/RSMC satellite products: IR, Visible, Water Vapour, Cloud-Top BT
- Satellite image upload console
- CSV/JSON environmental-data validation
- Cyclone search/history console
- Responsive presentation flow for judges
- Explicit OFFICIAL / AI / DEMO / MODEL NOT TRAINED states

### Backend
`backend/main.py` provides:
- `GET /api/health`
- `GET /api/cyclones/search?q=` — PostgreSQL search hook
- `GET /api/cyclones/active`
- `POST /api/ml/analyze-image` — image validation + trained-model integration point
- `POST /api/data/validate` — CSV/JSON validation

`backend/schema.sql` provides PostgreSQL tables for cyclone records, track points and ML analyses, with trigram search indexes.

### ML baseline
`ml/train_image_classifier.py` is a real trainable ResNet18 transfer-learning baseline. Dataset format:

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

The project must not publish fabricated accuracy, confidence or forecast values. Add held-out storm/time-period evaluation before presenting metrics.

## Live data principle
The browser dashboard attempts to read the official IMD public cyclone-track endpoint. Production deployment should use a server-side proxy/cache when browser CORS or rate limits prevent direct access. When no verified live cyclone is available, the dashboard shows **NO ACTIVE SYSTEM** rather than inventing a track.

## SIH differentiator
Existing systems such as IMD already provide operational monitoring and warnings. This project is positioned as an **AI-assisted intelligence layer** that brings together multi-source satellite pattern analysis, environmental feature fusion, historical search, model confidence, uncertainty-aware GIS and explainable research outputs in one workflow.

**OBSERVE → ANALYSE → PREDICT → VISUALIZE → DECIDE**

## Safety / scope
This is a research and decision-support prototype. It does not replace IMD/RSMC, does not issue official warnings, and must not be used as an emergency source. AI predictions require validation against authoritative observations before operational use.
