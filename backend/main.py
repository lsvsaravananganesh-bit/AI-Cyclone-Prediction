"""FastAPI service for AI Cyclone Prediction.

Integrates the user's TensorFlow/Keras 3-stage cyclone ML project with the
existing SIH frontend. Official IMD observations are never replaced by ML.
"""
import io, os, csv, json, urllib.request, urllib.error, pickle
from datetime import datetime, timezone
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

app=FastAPI(title="AI Cyclone Prediction API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
REQUIRED_COLUMNS={"timestamp","latitude","longitude"}
IMD_TRACK_URL="https://api.imd.gov.in/api/v1/cyclone_track"
MODEL_DIR=os.getenv("ML_MODEL_DIR", os.path.join(os.path.dirname(__file__), "models"))

@app.get("/api/health")
def health():
    return {"status":"ok","service":"cyclone-intelligence-api","time":datetime.now(timezone.utc).isoformat(),
            "imd_configured":bool(os.getenv("IMD_API_KEY")),"database_configured":bool(os.getenv("DATABASE_URL")),
            "three_stage_ml": all(os.path.exists(os.path.join(MODEL_DIR,p)) for p in ["identification_model.keras","classification_model.keras","prediction_model.keras"])}

def _imd_get():
    headers={"Accept":"application/json","User-Agent":"AI-Cyclone-Prediction/2.0"}
    key=os.getenv("IMD_API_KEY")
    if key:
        headers["Authorization"]=f"Bearer {key}"; headers["x-api-key"]=key
    req=urllib.request.Request(IMD_TRACK_URL,headers=headers,method="GET")
    with urllib.request.urlopen(req,timeout=15) as response: return json.loads(response.read().decode("utf-8"))

def _num(v):
    try: return float(str(v).replace("°"," ").replace("N","").replace("E","").strip())
    except Exception: return None

def _point(x):
    if not isinstance(x,dict): return None
    def pick(keys):
        for k in keys:
            if x.get(k) not in (None,""): return x[k]
        return None
    lat=_num(pick(["lat","LAT","latitude","Latitude"])); lon=_num(pick(["lon","LONG","longitude","Longitude","long"]))
    if lat is None or lon is None: return None
    return {"lat":lat,"lon":lon,"wind":_num(pick(["Mean MSW (kmph)","MSW range (kmph)","MSW (kmph)","MSW","wind"])),"pressure":_num(pick(["pressure","MSLP","MSLP (hPa)"])),"time":pick(["Date/Time","datetime","date_time","time","Time"]),"name":pick(["CYCLONE_NAME","cyclone_name","name","Name"]) or "Cyclonic System","category":pick(["Category","category"]),"raw":x}

def _parse_imd(payload):
    data=payload.get("data",payload) if isinstance(payload,dict) else payload; observed=[]; forecast=[]
    if isinstance(data,dict): observed=data.get("observed",data.get("observations",[])) or []; forecast=data.get("forecast",data.get("forecasts",[])) or []
    if isinstance(data,list): observed=data
    obs=[p for p in (_point(x) for x in observed) if p]; fc=[p for p in (_point(x) for x in forecast) if p]; allp=obs+fc
    if not allp: return None
    names={}
    for p in allp: names.setdefault(p["name"],[]).append(p)
    name=max(names,key=lambda n:len(names[n])); obs=[p for p in obs if p["name"]==name]; fc=[p for p in fc if p["name"]==name]
    return {"name":name,"observed":obs,"forecast":fc,"latest":obs[-1] if obs else fc[0]}

@app.get("/api/cyclones/active")
def active_cyclones():
    if not os.getenv("IMD_API_KEY"): return {"source":"IMD","status":"API_KEY_REQUIRED","systems":[],"message":"Configure IMD_API_KEY on the backend to access the official IMD API."}
    try:
        result=_parse_imd(_imd_get())
        if not result: return {"source":"IMD","status":"NO_ACTIVE_SYSTEM","systems":[]}
        return {"source":"IMD","status":"LIVE","systems":[result],"latest":result["latest"]}
    except urllib.error.HTTPError as e: return {"source":"IMD","status":"IMD_HTTP_ERROR","systems":[],"http_status":e.code}
    except Exception as e: return {"source":"IMD","status":"IMD_UNAVAILABLE","systems":[],"error":type(e).__name__}

@app.get("/api/cyclones/search")
def search_cyclones(q:str=""):
    q=q.strip(); database_url=os.getenv("DATABASE_URL")
    if not database_url: return []
    from sqlalchemy import create_engine, text
    engine=create_engine(database_url,pool_pre_ping=True)
    sql=text("SELECT id,name,year,region,category,latitude AS lat,longitude AS lon FROM cyclones WHERE name ILIKE :q OR region ILIKE :q OR category ILIKE :q OR CAST(year AS TEXT) ILIKE :q ORDER BY year DESC NULLS LAST LIMIT 50")
    with engine.connect() as c: rows=c.execute(sql,{"q":f"%{q}%"}).mappings().all()
    return [dict(r) for r in rows]

@app.get("/api/cyclones/{cyclone_id}/track")
def cyclone_track(cyclone_id:int):
    database_url=os.getenv("DATABASE_URL")
    if not database_url: return {"source":"DATABASE","status":"DATABASE_NOT_CONFIGURED","points":[]}
    from sqlalchemy import create_engine, text
    engine=create_engine(database_url,pool_pre_ping=True)
    sql=text("SELECT timestamp,latitude AS lat,longitude AS lon,wind,pressure,source FROM cyclone_track_points WHERE cyclone_id=:id ORDER BY timestamp")
    with engine.connect() as c: rows=c.execute(sql,{"id":cyclone_id}).mappings().all()
    return {"source":"DATABASE","status":"OK","points":[dict(r) for r in rows]}

# -------------------- REAL 3-STAGE KERAS ML --------------------
_CACHED=None

def _load_models():
    global _CACHED
    if _CACHED is not None: return _CACHED
    required=["identification_model.keras","classification_model.keras","prediction_model.keras","calibrated_weights.npy","target_stats.pkl"]
    missing=[p for p in required if not os.path.exists(os.path.join(MODEL_DIR,p))]
    if missing: raise FileNotFoundError("Missing ML artifacts: "+", ".join(missing))
    import tensorflow as tf
    s1=tf.keras.models.load_model(os.path.join(MODEL_DIR,"identification_model.keras"),compile=False)
    s2=tf.keras.models.load_model(os.path.join(MODEL_DIR,"classification_model.keras"),compile=False)
    s3=tf.keras.models.load_model(os.path.join(MODEL_DIR,"prediction_model.keras"),compile=False)
    weights=__import__('numpy').load(os.path.join(MODEL_DIR,"calibrated_weights.npy"))
    with open(os.path.join(MODEL_DIR,"target_stats.pkl"),"rb") as f: stats=pickle.load(f)
    _CACHED=(s1,s2,s3,weights,stats)
    return _CACHED

def _preprocess_bytes(raw,invert=False):
    import numpy as np
    img=Image.open(io.BytesIO(raw)).convert("RGB")
    width,height=img.size; crop_size=int(min(width,height)*0.75)
    left=(width-crop_size)//2; top=(height-crop_size)//2
    img=img.crop((left,top,left+crop_size,top+crop_size))
    gray=img.convert("L")
    if invert: gray=ImageOps.invert(gray)
    gray=ImageOps.autocontrast(gray,cutoff=2).resize((128,128))
    norm=np.asarray(gray,dtype=np.float32)/255.0
    return np.stack([norm,norm*0.85,np.zeros_like(norm),norm],axis=-1)

def _deltas(raw,stats):
    vals=[]
    for i,col in enumerate(("lat","lon","Vmax","MSLP")):
        mean,std=stats[col]; vals.append(float(raw[i])*float(std)+float(mean))
    return vals

@app.post("/api/ml/analyze-image")
async def analyze_image(file:list[UploadFile]=File(...), latitude:float|None=Form(None), longitude:float|None=Form(None), invert:bool=Form(False)):
    allowed={"image/jpeg","image/png","image/webp","image/tiff"}
    if not file: raise HTTPException(400,"Upload at least one satellite image.")
    files=file[:3]; raws=[]
    for item in files:
        if item.content_type not in allowed: raise HTTPException(400,"Use JPG, PNG, WEBP or TIFF.")
        raw=await item.read()
        if len(raw)>15*1024*1024: raise HTTPException(413,"Image exceeds 15 MB.")
        try: Image.open(io.BytesIO(raw)).verify()
        except Exception as e: raise HTTPException(400,"Invalid image file.") from e
        raws.append(raw)
    try:
        s1,s2,s3,weights,stats=_load_models()
        import numpy as np
        frames=[_preprocess_bytes(raw,invert) for raw in raws]; latest=np.expand_dims(frames[-1],0)
        if len(frames)==1: frames=frames*3; input_mode="repeated-single-frame"
        else:
            while len(frames)<3: frames.insert(0,frames[0])
            input_mode="three-frame-sequence"
        seq=np.expand_dims(np.stack(frames,axis=0),0)
        detection=float(s1.predict(latest,verbose=0)[0][0]); detected=detection>0.5
        result={"model_status":"MODEL_OUTPUT","model_version":"3-stage Keras ML project","frames_received":len(raws),"stage1":{"detected":detected,"probability":round(detection*100,2)},"source":"AI MODEL OUTPUT","demo":False,"location":{"latitude":latitude,"longitude":longitude} if latitude is not None and longitude is not None else None}
        if not detected:
            result["stage2"]={"class_index":None,"classification":"NO CYCLONE DETECTED","probabilities":None}; result["stage3"]={"available":False,"reason":"Stage 1 detection gate was negative."}; result["classification"]="NO CYCLONE DETECTED"; result["confidence"]=round((1-detection)*100,2); result["message"]="Stage 1 detection model did not identify a cyclone. No map detection marker was placed."; return result
        raw_probs=s2.predict(seq,verbose=0)[0]; calibrated=raw_probs*weights; idx=int(np.argmax(calibrated)); cats=["Category 0 (Weak)","Category 1 (Moderate)","Category 2 (Strong)"]; forecast=s3.predict(seq,verbose=0)[0]; real=_deltas(forecast,stats)
        result["stage2"]={"class_index":idx,"classification":cats[idx],"raw_probabilities":[round(float(x)*100,2) for x in raw_probs],"calibrated_probabilities":[round(float(x)*100,2) for x in calibrated]}; result["classification"]=cats[idx]; result["confidence"]=round(float(calibrated[idx])/max(float(calibrated.sum()),1e-9)*100,2)
        result["stage3"]={"available":True,"input_mode":input_mode,"latitude_drift_deg":round(real[0],3),"longitude_drift_deg":round(real[1],3),"wind_change_kt":round(real[2],3),"mslp_change_hpa":round(real[3],3),"caution":"Use three genuine consecutive frames for meaningful temporal forecasting. A single frame is repeated only as the documented fallback."}; result["message"]="Real trained 3-stage ML output. Stage 1/2 are model inference; Stage 3 is the project's regression output."
        if latitude is not None and longitude is not None: result["stage3"]["next_position"]={"latitude":round(latitude+real[0],5),"longitude":round(longitude+real[1],5)}
        else: result["message"]+=" Coordinates were not supplied, so the frontend must not invent a map position."
        return result
    except FileNotFoundError as e: return {"model_status":"MODEL_NOT_READY","classification":None,"confidence":None,"demo":False,"message":str(e)}
    except Exception as e: return {"model_status":"MODEL_ERROR","classification":None,"confidence":None,"demo":False,"message":f"3-stage ML inference failed: {type(e).__name__}: {e}"}

@app.post("/api/data/validate")
async def validate_data(file:UploadFile=File(...)):
    raw=(await file.read()).decode("utf-8",errors="replace")
    if file.filename.lower().endswith(".json"):
        try: data=json.loads(raw)
        except Exception as e: raise HTTPException(400,"Invalid JSON") from e
        rows=data if isinstance(data,list) else data.get("data",[]) if isinstance(data,dict) else []
    else: rows=list(csv.DictReader(io.StringIO(raw)))
    cols=set(rows[0].keys()) if rows and isinstance(rows[0],dict) else set()
    return {"valid":bool(rows) and not (REQUIRED_COLUMNS-cols),"records":len(rows),"missing_columns":sorted(REQUIRED_COLUMNS-cols)}
