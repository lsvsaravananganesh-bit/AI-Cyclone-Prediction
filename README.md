# 🌪️ AI Cyclone Prediction

<p align="center">
  <strong>AI-Powered Cyclone Monitoring, Forecasting & Risk Intelligence</strong><br>
  <sub>Satellite data • GIS visualization • Intensity forecasting • Coastal risk assessment</sub>
</p>

<p align="center">
  <a href="https://lsvsaravananganesh-bit.github.io/AI-Cyclone-Prediction/">🚀 Live Demo</a> •
  <a href="https://github.com/lsvsaravananganesh-bit/AI-Cyclone-Prediction">💻 Repository</a>
</p>

---

## 🛰️ About the Project

**AI Cyclone Prediction** is a cyclone intelligence platform being developed for an SIH-style problem statement. The system is designed to combine satellite observations, environmental parameters, machine-learning predictions and GIS visualization into a single cyclone command center.

The frontend is being completed first so that the ML pipeline can later be connected through a clean prediction API without redesigning the dashboard.

> ⚠️ **Prototype status:** Current dashboard values are illustrative/mock values until the ML model and real-time data pipeline are connected. This project is **not an official warning service**.

---

## 🎯 What the System Provides

| Module | Purpose |
|---|---|
| 🖥️ **Command Center** | Central cyclone monitoring dashboard |
| 🗺️ **Interactive GIS Map** | Current position, forecast track and uncertainty corridor |
| 🛰️ **Satellite Visualization** | Public satellite imagery with cyclone-center overlay |
| 🌡️ **Environmental Intelligence** | SST, cloud-top temperature, humidity and wind-shear indicators |
| 📈 **Intensity Forecast** | Wind-speed and central-pressure visualization |
| ⚠️ **Risk Intelligence** | Threat score and risk-factor visualization |
| 🔮 **Forecast Panel** | Time-based position, intensity and confidence forecast |
| 🌊 **Coastal Impact Watch** | Coastal exposure and potential impact overview |
| 🧠 **AI Assessment** | Explainable decision-support layer |
| 🔌 **ML API Ready** | Designed for future model/API integration |

---

## 🧠 Planned AI/ML Pipeline

```text
Satellite + Environmental Data
            │
            ▼
   Data Preprocessing
            │
            ▼
     Feature Extraction
            │
            ▼
   ┌─────────────────────┐
   │      AI / ML        │
   │                     │
   │ Cyclone Detection   │
   │ Classification      │
   │ Intensity Prediction│
   │ Track Prediction    │
   └──────────┬──────────┘
              │
              ▼
       Prediction API
              │
              ▼
      Cyclone Command Hub
              │
      ┌───────┼────────┐
      ▼       ▼        ▼
    Map    Forecast   Risk
      │       │        │
      └───────┼────────┘
              ▼
       Coastal Decision
          Support
```

---

## 🛠️ Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript
- Leaflet.js
- Chart.js

**Satellite / GIS**
- NASA GIBS / MODIS public imagery
- OpenStreetMap
- Leaflet mapping

**Planned AI/Backend**
- Python-based ML pipeline
- Cyclone detection & classification
- Trajectory prediction
- Intensity forecasting
- REST API integration

---

## 👥 Team Workflow

The project is being developed in parallel:

```text
FRONTEND TEAM                         ML TEAM
     │                                   │
     ▼                                   ▼
Command Center                    Dataset & Preprocessing
     │                                   │
     ▼                                   ▼
Maps / Visualization              Detection / Classification
     │                                   │
     ▼                                   ▼
Forecast / Risk UI                 Track / Intensity Model
     │                                   │
     └──────────────┬────────────────────┘
                    ▼
                ML API
                    │
                    ▼
             Final Dashboard
```

This keeps frontend development independent while the ML model is being trained and tested.

---

## 📁 Current Frontend Structure

```text
AI-Cyclone-Prediction/
├── index.html      # Cyclone command-center interface
├── style.css       # Dashboard styling and responsive UI
├── script.js       # Map, satellite, charts, risk and forecast logic
└── README.md       # Project documentation
```

---

## 🚀 Current Development Status

- [x] Command-center dashboard
- [x] Interactive cyclone map
- [x] Forecast track visualization
- [x] Uncertainty corridor
- [x] Cyclone position marker
- [x] Satellite visualization
- [x] Wind & pressure chart
- [x] Risk visualization
- [x] Environmental intelligence panel
- [x] Better forecast panel
- [x] Coastal impact watch
- [x] AI assessment UI
- [x] ML/API integration structure
- [ ] Real INSAT-3D data pipeline
- [ ] Trained cyclone detection model
- [ ] Real trajectory prediction model
- [ ] Real intensity prediction model
- [ ] Production real-time data integration

---

## 🔮 Future Vision

The final platform aims to provide a unified intelligence layer for cyclone monitoring by combining:

**Observe → Detect → Predict → Assess Risk → Visualize → Support Decisions**

The long-term goal is to turn multiple complex meteorological inputs into a clear, understandable and actionable cyclone intelligence dashboard.

---

## ⚠️ Disclaimer

This repository contains an evolving research/prototype system. Dashboard values marked as mock/demo are not real-time meteorological observations and must not be used for emergency decisions. For operational cyclone warnings and official forecasts, users should rely on the relevant national meteorological authorities.

---

<p align="center">
  <strong>🌪️ AI Cyclone Prediction</strong><br>
  <sub>Building an intelligent cyclone command center for the future.</sub>
</p>
