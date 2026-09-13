"""FastAPI service for AI Cyclone Prediction.

The API never fabricates official observations or ML predictions. Configure
IMD_API_KEY for the official IMD API, DATABASE_URL for historical search, and
CYCLONE_MODEL_PATH for trained image classification.
"""
import io, os, csv, json, urllib.request, urllib.error
from datetime import datetime, timezone
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app=FastAPI(title="AI Cyclone Prediction API", version="1.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
REQUIRED_COLUMNS={"timestamp","latitude","longitude"}
IMD_TRACK_URL="https://api.imd.gov.in/api/v1/cyclone_track"

@app.get("/api/health")
def health():
    return {"status":"ok","service":"cyclone-intelligence-api","time":datetime.now(timezone.utc).isoformat(),
            "imd_configured":bool(os.getenv("IMD_API_KEY")),"database_configured":bool(os.getenv("DATABASE_URL")),
            "ml_artifact":bool(os.getenv("CYCLONE_MODEL_PATH"))}

def _imd_get():
    headers={"Accept":"application/json","User-Agent":"AI-Cyclone-Prediction/1.2"}
    key=os.getenv("IMD_API_KEY")
    if key:
        headers["Authorization"]=f"Bearer {key}"
        headers["x-api-key"]=key
    req=urllib.request.Request(IMD_TRACK_URL,headers=headers,method="GET")
    with urllib.request.urlopen(req,timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))

def _num(v):
    try:
        return float(str(v).replace("°"," ").replace("N","").replace("E","").strip())
    except Exception:
        return None

def _point(x):
    if not isinstance(x,dict): return None
    def pick(keys):
        for k in keys:
            if x.get(k) not in (None,""): return x[k]
        return None
    lat=_num(pick(["lat","LAT","latitude","Latitude"]))
    lon=_num(pick(["lon","LONG","longitude","Longitude","long"]))
    if lat is None or lon is None: return None
    wind=_num(pick(["Mean MSW (kmph)","MSW range (kmph)","MSW (kmph)","MSW","wind"]))
    pressure=_num(pick(["pressure","MSLP","MSLP (hPa)"]))
    return {"lat":lat,"lon":lon,"wind":wind,"pressure":pressure,
            "time":pick(["Date/Time","datetime","date_time","time","Time"]),
            "name":pick(["CYCLONE_NAME","cyclone_name","name","Name"]) or "Cyclonic System",
            "category":pick(["Category","category"]),"raw":x}

def _parse_imd(payload):
    data=payload.get("data",payload) if isinstance(payload,dict) else payload
    observed=[]; forecast=[]
    if isinstance(data,dict):
        observed=data.get("observed",data.get("observations",[])) or []
        forecast=data.get("forecast",data.get("forecasts",[])) or []
    if isinstance(data,list): observed=data
    obs=[p for p in (_point(x) for x in observed) if p]
    fc=[p for p in (_point(x) for x in forecast) if p]
    allp=obs+fc
    if not allp: return None
    names={}
    for p in allp: names.setdefault(p["name"],[]).append(p)
    name=max(names,key=lambda n:len(names[n]))
    obs=[p for p in obs if p["name"]==name]; fc=[p for p in fc if p["name"]==name]
    latest=obs[-1] if obs else fc[0]
    return {"name":name,"observed":obs,"forecast":fc,"latest":latest}

@app.get("/api/cyclones/active")
def active_cyclones():
    if not os.getenv("IMD_API_KEY"):
        return {"source":"IMD","status":"API_KEY_REQUIRED","systems":[],"message":"Configure IMD_API_KEY on the backend to access the official IMD API."}
    try:
        result=_parse_imd(_imd_get())
        if not result: return {"source":"IMD","status":"NO_ACTIVE_SYSTEM","systems":[]}
        latest=result["latest"]
        return {"source":"IMD","status":"LIVE","systems":[result],"latest":latest}
    except urllib.error.HTTPError as e:
        return {"source":"IMD","status":"IMD_HTTP_ERROR","systems":[],"http_status":e.code}
    except Exception as e:
        return {"source":"IMD","status":"IMD_UNAVAILABLE","systems":[],"error":type(e).__name__}

@app.get("/api/cyclones/search")
def search_cyclones(q:str=""):
    q=q.strip()
    database_url=os.getenv("DATABASE_URL")
    if not database_url: return []
    from sqlalchemy import create_engine, text
    engine=create_engine(database_url,pool_pre_ping=True)
    sql=text("""SELECT id,name,year,region,category,latitude AS lat,longitude AS lon
               FROM cyclones WHERE name ILIKE :q OR region ILIKE :q OR category ILIKE :q
               OR CAST(year AS TEXT) ILIKE :q ORDER BY year DESC NULLS LAST LIMIT 50""")
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

@app.post("/api/ml/analyze-image")
async def analyze_image(file:UploadFile=File(...)):
    allowed={"image/jpeg","image/png","image/webp","image/tiff"}
    if file.content_type not in allowed: raise HTTPException(400,"Use JPG, PNG, WEBP or TIFF.")
    raw=await file.read()
    if len(raw)>15*1024*1024: raise HTTPException(413,"Image exceeds 15 MB.")
    try: image=Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e: raise HTTPException(400,"Invalid image file.") from e
    model_path=os.getenv("CYCLONE_MODEL_PATH")
    if not model_path or not os.path.exists(model_path):
        return {"model_status":"MODEL_NOT_TRAINED","classification":None,"confidence":None,"demo":False,
                "message":"Image validated. Install a trained model artifact before requesting a prediction."}
    try:
        import torch
        from torchvision import models, transforms
        checkpoint=torch.load(model_path,map_location="cpu",weights_only=False)
        classes=checkpoint["classes"]
        model=models.resnet18(weights=None); model.fc=torch.nn.Linear(model.fc.in_features,len(classes)); model.load_state_dict(checkpoint["state_dict"]); model.eval()
        tfm=transforms.Compose([transforms.Resize((224,224)),transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
        with torch.no_grad(): probs=torch.softmax(model(tfm(image).unsqueeze(0)),dim=1)[0]; idx=int(probs.argmax())
        return {"model_status":"MODEL_OUTPUT","model_version":os.path.basename(model_path),"classification":classes[idx],"confidence":round(float(probs[idx])*100,2),"demo":False,"message":"Prediction generated by the installed trained image classifier."}
    except Exception as e:
        return {"model_status":"MODEL_ERROR","classification":None,"confidence":None,"demo":False,"message":f"Model could not be loaded: {type(e).__name__}"}

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
