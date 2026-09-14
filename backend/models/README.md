# 3-Stage ML model artifacts

Copy the trained artifacts from the supplied `cyclone_project 2/models/` directory into this folder when deploying the FastAPI backend:

- `identification_model.keras`
- `classification_model.keras`
- `prediction_model.keras`
- `calibrated_weights.npy`
- `target_stats.pkl`

The backend reads this directory by default. You can instead set `ML_MODEL_DIR` to the absolute path of the model directory.

The model architecture and preprocessing are the same as `predict_real_image.py` from the supplied ML project: 128x128 4-channel preprocessing, Stage 1 latest-frame detection, Stage 2 three-frame classification, and Stage 3 regression.

**Important:** the uploaded project contains model binaries, but GitHub text-file editing does not automatically transfer those binaries into this repository. Copy them to the backend host (or use Git LFS/object storage) before expecting `MODEL_OUTPUT`.
