"""FastAPI service for AI Cyclone Prediction.

This service deliberately refuses to fabricate ML results or live cyclone data.
Set IMD_PROXY_URL to an approved server-side IMD proxy if browser CORS prevents direct access.
Set DATABASE_URL for PostgreSQL search/history.
"""
import io, os
from datetime import datetime, timezone
from typing import Any
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app=FastAPI(title="AI Cyclone Prediction API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

IMD_TRACK=os.getenv("IMD_PROXY_URL", "https://api.imd.gov.in/api/v1/cyclone_track")
REQUIRED_COLUMNS={"timestamp","latitude","longitude"}

@app.get("/api/health")
def health():
    return {"status":"ok","service":"cyclone-intelligence-api","time":datetime.now(timezone.utc).isoformat()}

@app.get("/api/cyclones/search")
def search_cyclones(q:str=""):
    """PostgreSQL-backed search hook. Replace the sample response by wiring your cyclone table.
    No external search engine is used. Empty DB returns an honest empty list.
    """
    q=q.strip()
    database_url=os.getenv("DATABASE_URL")
    if not database_url:
        return []
    from sqlalchemy import create_engine, text
    engine=create_engine(database_url, pool_pre_ping=True)
    sql=text("""SELECT id,name,year,region,category,latitude AS lat,longitude AS lon
               FROM cyclones
               WHERE name ILIKE :q OR region ILIKE :q OR category ILIKE :q OR CAST(year AS TEXT) ILIKE :q
               ORDER BY year DESC NULLS LAST LIMIT 50""")
    with engine.connect() as c:
        rows=c.execute(sql,{"q":f"%{q}%"}).mappings().all()
    return [dict(r) for r in rows]

@app.get("/api/cyclones/active")
def active_cyclones():
    # Live operational data should be proxied/validated server-side in production.
    return {"source":"IMD","status":"configure_server_side_proxy","systems":[]}

@app.post("/api/ml/analyze-image")
async def analyze_image(file:UploadFile=File(...)):
    if file.content_type not in {"image/jpeg","image/png","image/webp","image/tiff"}:
        raise HTTPException(400,"Unsupported image type. Use JPG, PNG, WEBP or TIFF.")
    raw=await file.read()
    if len(raw)>15*1024*1024: raise HTTPException(413,"Image exceeds 15 MB limit.")
    try:
        image=Image.open(io.BytesIO(raw)); image.verify()
    except Exception as e:
        raise HTTPException(400,"Invalid image file.") from e
    model_path=os.getenv("CYCLONE_MODEL_PATH")
    if not model_path or not os.path.exists(model_path):
        return {"model_status":"MODEL_NOT_TRAINED","classification":None,"confidence":None,"demo":False,
                "message":"Image validated successfully. No trained cyclone model is installed, so no prediction was fabricated."}
    # Integration point: load the versioned PyTorch/TensorFlow model and return validated inference.
    return {"model_status":"MODEL_INTEGRATION_REQUIRED","classification":None,"confidence":None,"demo":False,
            "message":"Model artifact detected; connect its inference adapter before exposing predictions."}

@app.post("/api/data/validate")
async def validate_data(file:UploadFile=File(...)):
    raw=(await file.read()).decode("utf-8",errors="replace")
    if file.filename.lower().endswith(".json"):
        import json
        try: data=json.loads(raw)
        except Exception as e: raise HTTPException(400,"Invalid JSON") from e
        rows=data if isinstance(data,list) else data.get("data",[]) if isinstance(data,dict) else []
        cols=set(rows[0].keys()) if rows and isinstance(rows[0],dict) else set()
    else:
        import csv
        rows=list(csv.DictReader(io.StringIO(raw))); cols=set(rows[0].keys()) if rows else set()
    missing=sorted(REQUIRED_COLUMNS-cols)
    return {"valid":not missing,"records":len(rows),"missing_columns":missing}
