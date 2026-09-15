"""Satellite AI API adapter for the supplied cyclone ML project.

The API now has a conservative satellite-input gate before the supplied demo
inference path. It rejects obvious personal/document images and explicitly
returns satellite verification metadata required by the STRIDE frontend.

IMPORTANT: this is an input-quality gate, not a trained satellite classifier.
The supplied project still has no trained production checkpoint, so inference
results remain explicitly marked DEMO.
"""
import io
import os
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from ml.inference.predict import run_cyclone_inference

app = FastAPI(title="AI Cyclone Satellite AI", version="2.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"] ,
)

ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/tiff"}
MAX_BYTES = 15 * 1024 * 1024
SATELLITE_NAME_HINTS = (
    "satellite", "insat", "noaa", "goes", "metsat", "himawari",
    "meteosat", "fy", "ir", "infrared", "vis", "visible", "wv",
    "water_vapor", "water-vapor", "cyclone", "storm"
)


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
    """Conservative content gate for the current demo deployment.

    It is deliberately fail-closed for obvious human/document inputs, while
    accepting imagery with several satellite-like signals such as monochrome
    IR appearance, geographic graticule lines, map-style annotations and
    cloud/temperature contrast. This should eventually be replaced by a
    trained satellite-vs-non-satellite classifier with a negative-image set.
    """
    arr = np.frombuffer(raw, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        return {"verified": False, "confidence": 0.0, "reason": "Image could not be decoded."}

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    height, width = gray.shape[:2]
    area = max(height * width, 1)

    # 1) Hard reject for obvious people. This is the key protection against
    # selfies/portraits before cyclone inference is ever called.
    try:
        cascade = cv2.CascadeClassifier(
            os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
        )
        faces = cascade.detectMultiScale(gray, scaleFactor=1.12, minNeighbors=5, minSize=(48, 48)) if not cascade.empty() else ()
        face_area = sum(int(w * h) for _, _, w, h in faces)
        if len(faces) > 0 and face_area / area >= 0.012:
            return {
                "verified": False,
                "confidence": 0.99,
                "reason": "A human face was detected. Personal photographs are not accepted as satellite imagery."
            }
    except Exception:
        pass

    # HOG catches many full-body photographs. If this optional detector fails,
    # continue to the content checks rather than breaking legitimate uploads.
    try:
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        scale = min(1.0, 900.0 / max(width, 1))
        test = bgr if scale == 1.0 else cv2.resize(bgr, (int(width * scale), int(height * scale)))
        people, _ = hog.detectMultiScale(test, winStride=(8, 8), padding=(8, 8), scale=1.05)
        if len(people) > 0:
            return {
                "verified": False,
                "confidence": 0.98,
                "reason": "A person was detected. Personal photographs are not accepted as satellite imagery."
            }
    except Exception:
        pass

    # Satellite-like visual signals.
    saturation = hsv[:, :, 1]
    low_saturation_ratio = float((saturation < 60).mean())
    yellow_annotation_ratio = float(((hsv[:, :, 0] >= 8) & (hsv[:, :, 0] <= 40) & (saturation > 80) & (hsv[:, :, 2] > 100)).mean())
    bright_ratio = float((gray > 200).mean())
    dark_ratio = float((gray < 70).mean())
    edge_density = float((cv2.Canny(gray, 50, 150) > 0).mean())

    lines = cv2.HoughLinesP(
        cv2.Canny(gray, 50, 150),
        1,
        np.pi / 180,
        threshold=40,
        minLineLength=max(50, int(min(width, height) * 0.18)),
        maxLineGap=12,
    )
    horizontal = 0
    vertical = 0
    if lines is not None:
        for x1, y1, x2, y2 in lines[:, 0]:
            angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
            if abs(angle) <= 5 or abs(abs(angle) - 180) <= 5:
                horizontal += 1
            if abs(abs(angle) - 90) <= 5:
                vertical += 1
    graticule_score = int(horizontal >= 3 and vertical >= 3)

    name_hint = any(token in (filename or "").lower().replace("-", "_") for token in SATELLITE_NAME_HINTS)
    monochrome_score = int(low_saturation_ratio >= 0.72)
    contrast_score = int(bright_ratio >= 0.10 and dark_ratio >= 0.08)
    annotation_score = int(yellow_annotation_ratio >= 0.002)
    texture_score = int(0.02 <= edge_density <= 0.35)
    size_score = int(width >= 320 and height >= 240)

    # Documents often have a mostly white page with dense text edges. Reject
    # that pattern even if the filename happens to contain a satellite keyword.
    document_like = bright_ratio >= 0.58 and edge_density >= 0.05
    if document_like:
        return {
            "verified": False,
            "confidence": 0.93,
            "reason": "The upload looks document-like rather than like satellite imagery."
        }

    signals = [monochrome_score, contrast_score, graticule_score, annotation_score, texture_score, size_score, int(name_hint)]
    score = sum(signals)

    # Require multiple independent satellite-like signals. The supplied Yaas
    # IR image has strong monochrome, contrast, graticule and annotation cues.
    verified = score >= 4 and (graticule_score or annotation_score or name_hint)
    confidence = min(0.99, 0.55 + score * 0.06)
    reason = (
        "Satellite-like imagery verified by the conservative content gate."
        if verified else
        "The image did not contain enough satellite-like signals. Upload genuine IR/VIS/WV imagery from a recognised satellite dataset."
    )
    return {
        "verified": bool(verified),
        "confidence": round(confidence, 3),
        "reason": reason,
        "signals": {
            "monochrome_ir_like": bool(monochrome_score),
            "cloud_temperature_contrast": bool(contrast_score),
            "geographic_graticule": bool(graticule_score),
            "map_annotations": bool(annotation_score),
            "satellite_filename_hint": bool(name_hint),
            "sufficient_image_size": bool(size_score),
        },
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "AI Cyclone Satellite AI",
        "supplied_ml_project": True,
        "inference_mode": "DEMO_BASELINE",
        "trained_weights_available": False,
        "satellite_input_gate": "CONSERVATIVE_CONTENT_GATE_V1",
        "time": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/model/status")
def model_status():
    return {
        "state": "DEMO_BASELINE",
        "modelVersion": "v1.0-resnet50-dvorak-demo",
        "isDemoMode": True,
        "source": "supplied ML project archive",
        "trainedWeightsAvailable": False,
        "satelliteVerification": "CONSERVATIVE_CONTENT_GATE_V1",
        "message": "Satellite verification is performed before the supplied demonstration inference path. A trained production checkpoint is still required for scientific cyclone inference."
    }


@app.post("/api/ml/analyze-image")
async def analyze_image(file: list[UploadFile] = File(...)):
    if not file:
        raise HTTPException(400, "Upload at least one satellite image.")

    # The supplied inference adapter currently accepts one image. For a
    # multi-frame upload, analyze the newest frame while reporting the count.
    item = file[-1]
    if item.content_type not in ALLOWED:
        raise HTTPException(400, "Use JPG, PNG, WEBP or TIFF.")

    raw = await item.read()
    dimensions, image_format = validate_image(raw)
    gate = _satellite_gate(raw, item.filename or "")

    if not gate["verified"]:
        return {
            "model_status": "INPUT_REJECTED",
            "reason": "NON_SATELLITE_IMAGE",
            "message": gate["reason"],
            "cyclone_detected": False,
            "classification": "INPUT REJECTED",
            "confidence": None,
            "demo": False,
            "satellite_verified": False,
            "input_validation": {
                "is_satellite": False,
                "satellite_image": False,
                "confidence": gate["confidence"],
                "reason": gate["reason"],
                "signals": gate.get("signals", {}),
            },
            "stage1": {"status": "SKIPPED", "reason": "Satellite gate rejected the input before cyclone inference."},
            "stage2": {"status": "SKIPPED"},
            "stage3": {"available": False, "status": "SKIPPED"},
            "frames_received": len(file),
            "filename": item.filename,
            "image_format": image_format,
            "dimensions": {"width": dimensions[0], "height": dimensions[1]},
            "pipeline": ["VALIDATE", "SATELLITE INPUT GATE", "REJECT"],
        }

    result = run_cyclone_inference(raw, model_weights_path=None)
    analysis_time = datetime.now(timezone.utc).isoformat()
    result.update({
        "model_status": "DEMO_OUTPUT",
        "source": "SUPPLIED_ML_PROJECT",
        "demo": True,
        "trained_weights_available": False,
        "satellite_verified": True,
        "input_validation": {
            "is_satellite": True,
            "satellite_image": True,
            "confidence": gate["confidence"],
            "method": "CONSERVATIVE_CONTENT_GATE_V1",
            "signals": gate.get("signals", {}),
        },
        "frames_received": len(file),
        "filename": item.filename,
        "image_format": image_format,
        "dimensions": {"width": dimensions[0], "height": dimensions[1]},
        "analysis_time": analysis_time,
        "observation_time": None,
        "movement_speed_kmh": None if len(file) < 2 else "requires_timestamped_track",
        "risk_level": "NOT_ASSESSED_FROM_SINGLE_FRAME",
        "warning": "SATELLITE INPUT VERIFIED, but cyclone values are DEMO BASELINE outputs until a trained production checkpoint and calibrated observation data are supplied.",
        "pipeline": ["VALIDATE", "SATELLITE INPUT GATE", "PREPROCESS", "ML INFERENCE", "RESULT"],
    })
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
