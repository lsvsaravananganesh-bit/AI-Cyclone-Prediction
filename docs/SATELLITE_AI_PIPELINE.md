# Satellite AI Pipeline — Source of Truth from the AI Studio ZIP

This document records the satellite-analysis design extracted from the uploaded AI Studio project archive.

## 1. Supported satellite inputs

The UI is designed for JPG, JPEG, PNG, WEBP and GeoTIFF/TIFF imagery. The intended channels are:

- **IR-1** — infrared imagery / brightness-temperature style input
- **VISIBLE** — visible-band imagery
- **WATER VAPOUR** — water-vapour channel
- **CLOUD-TOP BT** — cloud-top brightness-temperature analysis

The ZIP's upload pipeline standardizes the spatial input to **512 × 512** and identifies the selected spectral channel before model inference.

## 2. Processing pipeline

```text
Satellite image
      ↓
Header / file validation
      ↓
Decode image matrix
      ↓
512 × 512 spatial standardization
      ↓
Radiometric normalization
      ↓
IR / VIS / WV channel alignment
      ↓
ResNet-50 feature extractor
      ↓
Dvorak-style cyclone classification
      ↓
Wind + minimum-pressure regression
      ↓
Cyclone result + IR heatmap/Grad-CAM metadata
```

The original ZIP explicitly implements these preprocessing stages:

1. Header verification for JPEG/PNG/GeoTIFF.
2. Spatial resampling to 512 × 512.
3. IR-1 brightness-temperature normalization using `(matrix - 250) / 45` followed by clipping to `[-1, 1]`.
4. Z-score normalization for non-IR channels.
5. Channel alignment for IR-1, visible, water-vapour and cloud-top products.

## 3. Model architecture in the ZIP

`ml/models/cyclone_cnn.py` defines a **ResNet-50 backbone** with:

- a classifier head for **5 cyclone classes**;
- a regression head with **2 outputs** for maximum sustained wind and minimum pressure;
- ReLU activation and dropout in the heads.

Conceptually:

```text
512×512 satellite tensor
        ↓
     ResNet-50
        ↓
  shared deep features
     ↙       ↘
classifier   regressor
  5 classes  wind + pressure
```

## 4. Important implementation truth

The uploaded ZIP contains the model architecture and inference/preprocessing code, but **does not contain a trained `.pt`, `.pth`, `.ckpt`, `.keras`, `.h5`, or `.safetensors` checkpoint**. Therefore the repository must not claim that the ZIP itself contains trained production weights.

The `predict.py` file in the ZIP contains a documented baseline/demo output when weights are absent. That output should be clearly labelled as demo/baseline rather than presented as a live trained prediction.

## 5. Satellite library / observation UI

The ZIP contains dedicated UI components for:

- `SatelliteLibraryView` — channel switching and satellite-library selection;
- `SatelliteFeedStatusIndicator` — feed status presentation;
- `IrAnalysisViewer` — IR analysis/visualization;
- `EnvironmentalDataSection` — environmental variables such as SST, humidity and wind shear;
- `ImageUploadSection` — upload, preprocessing progress and result handling;
- `MosdacScorpioMap` — satellite/map presentation;
- `HistoricalAnalogOverlay` — historical analog comparison.

## 6. API contract used by the ZIP UI

The AI Studio upload component sends a JSON request to:

`POST /api/ml/analyze-image`

with fields equivalent to:

```json
{
  "image": "data:image/png;base64,...",
  "filename": "satellite.png",
  "fileSize": "384.2 KB",
  "width": 512,
  "height": 512,
  "userCoordinates": {
    "latitude": 15.2,
    "longitude": 84.1
  }
}
```

The GitHub backend historically accepted multipart `FormData` instead. The repository bridge now adapts the AI Studio JSON contract into the backend's multipart contract so the original UI can remain unchanged.

## 7. Data-source rule

Demo/placeholder imagery must never be labelled as official INSAT, IMD or MOSDAC imagery. Real satellite feeds require a verified source URL/API and, where required, authentication. The UI may display source status separately from AI model status.

## 8. Result states

The satellite AI should expose these states clearly:

- **MODEL_OUTPUT** — trained model artifacts were loaded and inference completed.
- **MODEL_NOT_READY** — required trained model artifacts are absent.
- **MODEL_ERROR** — model loading/inference failed.
- **NO_CYCLONE_DETECTED** — Stage 1 or detector rejected the frame.
- **DEMO/BASELINE** — only when an explicitly non-production fallback is being shown.

This prevents synthetic demonstration numbers from being mistaken for an operational cyclone warning.
