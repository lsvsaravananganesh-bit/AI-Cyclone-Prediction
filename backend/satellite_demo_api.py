"""Satellite AI API for the SIH cyclone intelligence system.

Pipeline: validate -> satellite input gate -> 3-stage trained Keras ML -> result.
The model artifacts live under backend/models and are loaded at runtime.
"""
import io
import os
import pickle
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

app = FastAPI(title="AI Cyclone Satellite AI", version="3.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

MODEL_DIR = os.getenv("ML_MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))
ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/tiff"}
MAX_BYTES = 15 * 1024 * 1024
MODEL_FILES = ["identification_model.keras", "classification_model.keras", "prediction_model.keras", "calibrated_weights.npy", "target_stats.pkl"]
SATELLITE_NAME_HINTS = ("satellite", "insat", "noaa", "goes", "metsat", "himawari", "meteosat", "ir", "infrared", "vis", "visible", "wv", "water_vapor", "cyclone", "storm")
_CACHED = None


def validate_image(raw: bytes):
    if not raw:
        raise HTTPException(400, "Empty image upload.")
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "Image exceeds 15 MB.")
    try:
        image = Image.open(io.BytesIO(raw))
        image.verify()
        image = Image.open(io.BytesIO(raw))
        return image.size, image.format
    except Exception as exc:
        raise HTTPException(400, "Invalid or unsupported image file.") from exc


def _satellite_gate(raw: bytes, filename: str = "") -> dict:
    arr = np.frombuffer(raw, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        return {"verified": False, "confidence": 0.0, "reason": "Image could not be decoded."}
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h, w = gray.shape[:2]
    area = max(h * w, 1)

    try:
        cascade = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml"))
        faces = cascade.detectMultiScale(gray, scaleFactor=1.12, minNeighbors=5, minSize=(48, 48)) if not cascade.empty() else ()
        face_area = sum(int(fw * fh) for _, _, fw, fh in faces)
        if len(faces) and face_area / area >= 0.012:
            return {"verified": False, "confidence": 0.99, "reason": "A human face was detected. Upload genuine satellite imagery."}
    except Exception:
        pass

    try:
        hog = cv2.HOGDescriptor(); hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        scale = min(1.0, 900.0 / max(w, 1)); test = bgr if scale == 1 else cv2.resize(bgr, (int(w * scale), int(h * scale)))
        people, _ = hog.detectMultiScale(test, winStride=(8, 8), padding=(8, 8), scale=1.05)
        if len(people):
            return {"verified": False, "confidence": 0.98, "reason": "A person was detected. Upload genuine satellite imagery."}
    except Exception:
        pass

    saturation = hsv[:, :, 1]
    low_sat = float((saturation < 60).mean())
    yellow = float(((hsv[:, :, 0] >= 8) & (hsv[:, :, 0] <= 40) & (saturation > 80) & (hsv[:, :, 2] > 100)).mean())
    bright = float((gray > 200).mean()); dark = float((gray < 70).mean())
    edges = cv2.Canny(gray, 50, 150)
    edge_density = float((edges > 0).mean())
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=40, minLineLength=max(50, int(min(w, h) * 0.18)), maxLineGap=12)
    horizontal = vertical = 0
    if lines is not None:
        for x1, y1, x2, y2 in lines[:, 0]:
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            if abs(angle) <= 5 or abs(abs(angle) - 180) <= 5: horizontal += 1
            if abs(abs(angle) - 90) <= 5: vertical += 1
    graticule = int(horizontal >= 3 and vertical >= 3)
    name_hint = any(t in (filename or "").lower().replace("-", "_") for t in SATELLITE_NAME_HINTS)
    signals = {
        "monochrome_ir_like": low_sat >= 0.72,
        "cloud_temperature_contrast": bright >= 0.10 and dark >= 0.08,
        "geographic_graticule": bool(graticule),
        "map_annotations": yellow >= 0.002,
        "satellite_filename_hint": bool(name_hint),
        "sufficient_image_size": w >= 320 and h >= 240,
    }
    if bright >= 0.58 and edge_density >= 0.05:
        return {"verified": False, "confidence": 0.93, "reason": "The upload looks document-like rather than satellite imagery.", "signals": signals}
    score = sum(bool(v) for v in signals.values())
    verified = score >= 4 and (graticule or yellow >= 0.002 or name_hint)
    return {"verified": bool(verified), "confidence": round(min(0.99, 0.55 + score * 0.06), 3), "reason": "Satellite imagery verified." if verified else "Not enough satellite-like signals. Upload genuine IR/VIS/WV imagery.", "signals": signals}


def _load_models():
    global _CACHED
    if _CACHED is not None:
        return _CACHED
    missing = [p for p in MODEL_FILES if not os.path.exists(os.path.join(MODEL_DIR, p))]
    if missing:
        raise FileNotFoundError("Missing ML artifacts: " + ", ".join(missing))
    import tensorflow as tf
    s1 = tf.keras.models.load_model(os.path.join(MODEL_DIR, "identification_model.keras"), compile=False)
    s2 = tf.keras.models.load_model(os.path.join(MODEL_DIR, "classification_model.keras"), compile=False)
    s3 = tf.keras.models.load_model(os.path.join(MODEL_DIR, "prediction_model.keras"), compile=False)
    weights = np.load(os.path.join(MODEL_DIR, "calibrated_weights.npy"))
    with open(os.path.join(MODEL_DIR, "target_stats.pkl"), "rb") as f:
        stats = pickle.load(f)
    _CACHED = (s1, s2, s3, weights, stats)
    return _CACHED


def _preprocess(raw: bytes, invert=False):
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    width, height = img.size
    crop = int(min(width, height) * 0.75)
    left, top = (width - crop) // 2, (height - crop) // 2
    img = img.crop((left, top, left + crop, top + crop)).convert("L")
    if invert:
        img = ImageOps.invert(img)
    gray = ImageOps.autocontrast(img, cutoff=2).resize((128, 128))
    norm = np.asarray(gray, dtype=np.float32) / 255.0
    return np.stack([norm, norm * 0.85, np.zeros_like(norm), norm], axis=-1)


def _denormalize(values, stats):
    return [float(values[i]) * float(stats[key][1]) + float(stats[key][0]) for i, key in enumerate(("lat", "lon", "Vmax", "MSLP"))]


@app.get("/api/health")
def health():
    artifacts = {p: os.path.exists(os.path.join(MODEL_DIR, p)) for p in MODEL_FILES}
    return {"status": "ok", "service": "AI Cyclone Satellite AI", "inference_mode": "3_STAGE_KERAS", "trained_weights_available": all(artifacts.values()), "model_artifacts": artifacts, "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/model/status")
def model_status():
    artifacts = {p: os.path.exists(os.path.join(MODEL_DIR, p)) for p in MODEL_FILES}
    return {"state": "READY" if all(artifacts.values()) else "MODEL_NOT_READY", "modelVersion": "3-stage Keras ML project", "isDemoMode": False, "trainedWeightsAvailable": all(artifacts.values()), "satelliteVerification": "CONSERVATIVE_CONTENT_GATE_V1", "message": "Identification, classification and prediction models are loaded from backend/models."}


@app.post("/api/ml/analyze-image")
async def analyze_image(file: list[UploadFile] = File(...), latitude: float | None = Form(None), longitude: float | None = Form(None), invert: bool = Form(False)):
    if not file:
        raise HTTPException(400, "Upload at least one satellite image.")
    items = file[:3]
    raws = []
    for item in items:
        if item.content_type not in ALLOWED:
            raise HTTPException(400, "Use JPG, PNG, WEBP or TIFF.")
        raw = await item.read(); validate_image(raw); raws.append(raw)

    gate = _satellite_gate(raws[-1], items[-1].filename or "")
    if not gate["verified"]:
        return {"model_status": "INPUT_REJECTED", "reason": "NON_SATELLITE_IMAGE", "cyclone_detected": False, "classification": "NON-SATELLITE IMAGE", "confidence": None, "demo": False, "satellite_verified": False, "message": gate["reason"], "input_validation": {"is_satellite": False, "satellite_image": False, "confidence": gate["confidence"], "reason": gate["reason"], "signals": gate.get("signals", {})}, "stage1": {"status": "SKIPPED"}, "stage2": {"status": "SKIPPED"}, "stage3": {"available": False, "status": "SKIPPED"}, "pipeline": ["VALIDATE", "SATELLITE INPUT GATE", "REJECT"]}

    try:
        s1, s2, s3, weights, stats = _load_models()
        frames = [_preprocess(raw, invert) for raw in raws]
        latest = np.expand_dims(frames[-1], 0)
        if len(frames) == 1:
            frames = frames * 3; input_mode = "repeated-single-frame"
        else:
            while len(frames) < 3: frames.insert(0, frames[0])
            input_mode = "three-frame-sequence"
        seq = np.expand_dims(np.stack(frames, axis=0), 0)

        detection = float(s1.predict(latest, verbose=0)[0][0]); detected = detection > 0.5
        result = {"model_status": "MODEL_OUTPUT", "model_version": "3-stage Keras ML project", "frames_received": len(raws), "satellite_verified": True, "source": "AI MODEL OUTPUT", "demo": False, "trained_weights_available": True, "analysis_time": datetime.now(timezone.utc).isoformat(), "observation_time": None, "input_validation": {"is_satellite": True, "satellite_image": True, "confidence": gate["confidence"], "method": "CONSERVATIVE_CONTENT_GATE_V1", "signals": gate.get("signals", {})}, "stage1": {"detected": detected, "probability": round(detection * 100, 2)}}
        if not detected:
            result.update({"cyclone_detected": False, "classification": "NO CYCLONE DETECTED", "confidence": round((1 - detection) * 100, 2), "stage2": {"status": "SKIPPED"}, "stage3": {"available": False, "status": "SKIPPED", "reason": "Stage 1 detection model was negative."}, "risk_level": "LOW", "message": "Stage 1 ML model did not identify a cyclone. No cyclone result is reported."})
            return result

        raw_probs = s2.predict(seq, verbose=0)[0]
        calibrated = raw_probs * weights
        idx = int(np.argmax(calibrated))
        cats = ["Category 0 (Weak)", "Category 1 (Moderate)", "Category 2 (Strong)"]
        forecast = s3.predict(seq, verbose=0)[0]
        real = _denormalize(forecast, stats)
        class_conf = float(calibrated[idx]) / max(float(calibrated.sum()), 1e-9) * 100
        risk = "HIGH" if idx >= 2 or class_conf >= 85 else ("MEDIUM" if idx == 1 else "LOW")
        result.update({"cyclone_detected": True, "classification": cats[idx], "confidence": round(class_conf, 2), "stage2": {"class_index": idx, "classification": cats[idx], "raw_probabilities": [round(float(x) * 100, 2) for x in raw_probs], "calibrated_probabilities": [round(float(x) * 100, 2) for x in calibrated]}, "stage3": {"available": True, "input_mode": input_mode, "latitude_drift_deg": round(real[0], 3), "longitude_drift_deg": round(real[1], 3), "wind_change_kt": round(real[2], 3), "mslp_change_hpa": round(real[3], 3), "caution": "Use three genuine consecutive timestamped frames for meaningful temporal forecasting."}, "risk_level": risk, "movement_speed_kmh": None, "maximum_wind_kmh": None, "central_pressure_hpa": None, "message": "Real trained 3-stage ML output. Wind and pressure cards are withheld because this model predicts changes, not calibrated absolute observations."})
        if latitude is not None and longitude is not None:
            result["stage3"]["next_position"] = {"latitude": round(latitude + real[0], 5), "longitude": round(longitude + real[1], 5)}
        else:
            result["message"] += " Supply latitude and longitude to project the next position."
        return result
    except FileNotFoundError as exc:
        return {"model_status": "MODEL_NOT_READY", "demo": False, "message": str(exc), "pipeline": ["VALIDATE", "SATELLITE INPUT GATE", "ML ARTIFACT CHECK"]}
    except Exception as exc:
        return {"model_status": "MODEL_ERROR", "demo": False, "message": f"3-stage ML inference failed: {type(exc).__name__}: {exc}", "pipeline": ["VALIDATE", "SATELLITE INPUT GATE", "ML INFERENCE", "ERROR"]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
