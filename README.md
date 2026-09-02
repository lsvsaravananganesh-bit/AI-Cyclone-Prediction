# 🌪️ AI Cyclone Prediction

<p align="center"><strong>AI-powered cyclone monitoring, forecasting and risk-intelligence frontend</strong><br><sub>Phase 1 • SIH-style prototype • ML/API ready</sub></p>

<p align="center"><a href="https://lsvsaravananganesh-bit.github.io/AI-Cyclone-Prediction/">🚀 Live Demo</a> • <a href="https://github.com/lsvsaravananganesh-bit/AI-Cyclone-Prediction">💻 Repository</a></p>

---

## 1. Project Vision

AI Cyclone Prediction is being developed as an intelligent cyclone command center that brings together satellite observations, environmental inputs, machine-learning predictions, GIS visualization, risk assessment and decision support in one interface.

The development strategy is intentionally split into phases:

```text
PHASE 1                         PHASE 2                    PHASE 3
Frontend foundation      →      ML + Backend           →    Real integration
      │                              │                         │
      ├─ Dashboard                   ├─ Detection              ├─ Live data
      ├─ Map                         ├─ Classification         ├─ Real predictions
      ├─ Satellite UI                ├─ Track prediction       ├─ Validation
      ├─ Charts                      ├─ Intensity model        └─ Deployment
      ├─ Risk UI                     └─ REST API
      └─ API contract
```

> ⚠️ **Prototype status:** Phase 1 uses clearly labelled illustrative/demo values. It is not an official cyclone warning service and must not be used for emergency decisions.

---

## 2. Phase 1 Frontend Architecture

The frontend is deliberately kept in three main files so the six-member team can work without mixing UI and ML responsibilities.

```text
AI-Cyclone-Prediction/
├── index.html      # Complete dashboard structure
├── style.css       # Complete responsive command-center design
├── script.js       # Frontend behavior, map, charts and API adapters
└── README.md       # Project and team documentation
```

### `index.html`
Contains the complete user interface:

- Command Center header and navigation
- System/prototype status
- Cyclone overview metrics
- Interactive GIS map
- AI predicted track and uncertainty corridor
- IMD observed/forecast/cone/wind-warning layer containers
- Satellite visualization
- Environmental input cards
- Wind and pressure chart
- Cyclone risk visualization
- Forecast timeline/table
- AI assessment and advisory UI
- Coastal impact watch
- AI vs IMD validation panel
- End-to-end AI pipeline
- Responsive/mobile layout structure

### `style.css`
Contains the complete visual system:

- Dark SIH-style command-center theme
- Black/blue/lime dashboard palette
- Cards, panels and status badges
- Map overlays
- Risk gauge
- Charts/table styling
- Satellite presentation
- Pipeline visualization
- Responsive breakpoints for tablets and phones

### `script.js`
Contains frontend logic only:

- Demo data adapter
- `/api/prediction` integration point
- Leaflet map
- AI track rendering
- Uncertainty corridor
- IMD API adapters
- IMD track/cone/wind-warning layers
- NASA GIBS satellite tile
- Chart.js forecast chart
- Forecast table rendering
- Risk visualization
- AI vs IMD geographic comparison
- IST clock
- Refresh handling
- API fallback/error states

---

## 3. Complete Phase 1 Feature Set

### 🖥️ Command Center
Central dashboard for cyclone monitoring.

### 🗺️ Interactive GIS Map
Separate visualization layers for:

```text
Base Map
├── Current cyclone position
├── AI predicted track
├── AI uncertainty corridor
├── IMD observed track
├── IMD forecast track
├── IMD cone of uncertainty
├── IMD wind-warning geometry
└── Coastal watch zones
```

### 🛰️ Satellite Visualization
Public NASA GIBS/MODIS imagery is used as a Phase 1 visual data layer. INSAT-specific integration remains a future data-pipeline task.

### 🌡️ Environmental Intelligence
The UI is prepared for model inputs such as:

- Sea-surface temperature
- Cloud-top temperature
- Humidity
- Vertical wind shear
- Atmospheric instability
- Tropical heat potential

Current Phase 1 values are demo inputs.

### 📈 Intensity Forecast
Wind speed and central pressure are visualized through Chart.js and can later consume model output.

### ⚠️ Risk Intelligence
Threat score, risk factors and coastal exposure are presented as a visualization layer. The production risk engine will be connected later.

### 🔮 Forecast Timeline
The table is designed around time, latitude, longitude, wind, pressure, category and confidence.

### 🌊 Coastal Impact Watch
Provides a structured UI for location-specific wind, rainfall, storm-surge and risk information.

### 🧠 AI Assessment
Prepared for an explainable summary of model output. It does not claim real AI predictions while the ML service is disconnected.

### 🔬 AI vs IMD Validation
The frontend calculates geographic track differences when both AI and IMD forecast tracks are available:

- Mean track error
- Endpoint error
- Track agreement indicator
- Validation status

This is a comparison aid, **not an AI accuracy claim**.

---

## 4. Final System Architecture

```text
                 DATA SOURCES
                      │
       ┌──────────────┼───────────────┐
       ↓              ↓               ↓
   Satellite      Environment     Historical Data
       │              │               │
       └──────────────┼───────────────┘
                      ↓
              DATA PREPROCESSING
                      ↓
               FEATURE EXTRACTION
                      ↓
              ┌───────────────┐
              │    ML LAYER   │
              ├───────────────┤
              │ Detection     │
              │ Classification│
              │ Track forecast│
              │ Intensity     │
              └───────┬───────┘
                      ↓
                 BACKEND API
                      ↓
              `/api/prediction`
                      ↓
              FRONTEND ADAPTER
                      ↓
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
       MAP          CHARTS        RISK UI
        │             │             │
        └─────────────┼─────────────┘
                      ↓
              DECISION SUPPORT
```

---

## 5. Frontend → ML API Contract

The frontend is prepared to consume a response similar to:

```json
{
  "cyclone_detected": true,
  "cyclone_name": "Cyclone XYZ",
  "confidence": 0.94,
  "category": "Severe Cyclonic Storm",
  "latitude": 15.82,
  "longitude": 82.15,
  "wind_speed": 120,
  "pressure": 970,
  "movement": "NW",
  "forecast": [
    {
      "latitude": 16.20,
      "longitude": 81.70,
      "time": "2026-09-03T06:00:00"
    },
    {
      "latitude": 16.80,
      "longitude": 81.20,
      "time": "2026-09-03T12:00:00"
    }
  ]
}
```

The important design goal is:

```text
DEMO JSON  →  same UI  →  REAL ML JSON
```

The frontend should not need a redesign when the model becomes available.

---

## 6. IMD Integration

The frontend contains adapters for the official IMD API structure:

```text
Cyclone Track       → observed + forecast track
Cyclone Wind        → wind-warning geometry
Cyclone COU         → cone of uncertainty
```

Browser access can be restricted by authentication or CORS. When that happens, the dashboard explicitly reports IMD as unavailable instead of pretending demo data is official.

---

## 7. Six-Member Development Split

| Member | Primary responsibility |
|---|---|
| 1 — Frontend Lead | Command Center, HTML/CSS/JS integration |
| 2 — GIS/Data Viz | Map layers, satellite and visualization support |
| 3 — Data Engineer | Datasets, cleaning and preprocessing |
| 4 — ML Detection | Cyclone detection and intensity classification |
| 5 — Forecast ML | Track and intensity forecasting |
| 6 — Backend/Integration | REST API, ML serving and frontend integration |

The frontend can progress independently while Members 3–6 develop the ML/backend stack.

---

## 8. Phase 1 Completion Checklist

### Frontend foundation
- [x] Command-center layout
- [x] Navigation and sections
- [x] Responsive design
- [x] Prototype/live status separation

### Visualization
- [x] Interactive map
- [x] AI track
- [x] Uncertainty corridor
- [x] IMD layer containers
- [x] Satellite panel
- [x] Wind/pressure chart
- [x] Forecast table
- [x] Risk gauge
- [x] Coastal impact table
- [x] AI vs IMD comparison UI
- [x] Pipeline visualization

### Integration readiness
- [x] `/api/prediction` adapter
- [x] Demo fallback
- [x] Loading/refresh state
- [x] Error handling
- [x] Clear mock-data labelling
- [ ] Real ML service
- [ ] Production backend
- [ ] Validated real-time data pipeline

---

## 9. Development Rule

**Do not mix ML training code into the frontend files.**

Frontend:

```text
index.html + style.css + script.js
```

ML/backend:

```text
dataset → preprocessing → model → API
```

Integration:

```text
API JSON → script.js → map/charts/cards/alerts
```

This separation allows the six members to work simultaneously with minimal conflicts.

---

## ⚠️ Disclaimer

This is an evolving research/prototype system. Demo values are illustrative and are not real-time meteorological observations. The platform is not an official warning authority. For operational cyclone forecasts, warnings, evacuation instructions and emergency decisions, follow the relevant official meteorological and disaster-management authorities.

<p align="center"><strong>🌪️ Observe → Detect → Predict → Assess Risk → Visualize → Support Decisions</strong></p>
