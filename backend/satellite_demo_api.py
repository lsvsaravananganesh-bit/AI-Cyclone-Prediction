"""Satellite AI API adapter for the supplied cyclone ML project.

This adapter accepts the same multipart image upload used by the GitHub Pages
Satellite AI screen and invokes the inference function shipped in the supplied
ML archive. The archive contains a demonstration baseline rather than trained
checkpoint files, so results are explicitly marked DEMO until real weights are
provided.
"""
import io
from datetime import datetime, timezone

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from ml.inference.predict import run_cyclone_inference

app = FastAPI(title="AI Cyclone Satellite AI", version="2.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/tiff"}
MAX_BYTES = 15 * 1024 * 1024


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


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "AI Cyclone Satellite AI",
        "supplied_ml_project": True,
        "inference_mode": "DEMO_BASELINE",
        "trained_weights_available": False,
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
        "message": "The supplied archive contains the inference adapter and model architecture, but no trained checkpoint."
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

    result = run_cyclone_inference(raw, model_weights_path=None)
    result.update({
        "model_status": "DEMO_OUTPUT",
        "source": "SUPPLIED_ML_PROJECT",
        "demo": True,
        "trained_weights_available": False,
        "frames_received": len(file),
        "filename": item.filename,
        "image_format": image_format,
        "dimensions": {"width": dimensions[0], "height": dimensions[1]},
        "warning": "DEMO BASELINE: this output is from the supplied project's demonstration inference path, not a trained production checkpoint.",
        "pipeline": ["VALIDATE", "PREPROCESS", "ML INFERENCE", "RESULT"],
    })
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
