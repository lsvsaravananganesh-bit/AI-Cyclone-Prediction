# STRIDE — SIH Production Mode

## 1. Fail-closed analysis

The production analysis path never fabricates a cyclone result when the ML service is unavailable or when the uploaded input fails satellite verification.

`Upload → Validate → Satellite Gate → Preprocess → Identify → Classify → Predict → Risk`

## 2. Stage rules

- **Identification:** cyclone / no-cyclone only from the connected trained model.
- **Classification:** only meaningful after a positive identification result.
- **Current intensity:** displayed only when supplied by the model or an explicitly labelled observation source.
- **Track and movement:** require multiple timestamped, geolocated observations. A single image is not used to invent movement speed.
- **Risk:** AI decision-support output, not an official warning.

## 3. Provenance labels

| Label | Meaning |
|---|---|
| TRAINED MODEL OUTPUT | Returned by the connected trained ML service |
| VERIFIED SOURCE | Observation supplied with source and timestamp |
| HISTORICAL | Archived cyclone/best-track information |
| DEMONSTRATION | Controlled SIH scenario; not live data |
| UNAVAILABLE | No trustworthy value is available |

## 4. Satellite source layer

The UI provides navigation to recognised source portals such as MOSDAC/ISRO, IMD and NOAA/NESDIS. Source navigation is deliberately kept separate from STRIDE's own AI result.

## 5. Judge-safe positioning

STRIDE is an AI-assisted decision-support layer. It does not replace official meteorological agencies or issue authoritative warnings. The strongest technical claim is the transparent integration of satellite validation, multi-stage AI analysis, temporal prediction, environmental context, historical analogs and uncertainty into one workflow.
