from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app=FastAPI(title='AI Cyclone Prediction API')
app.add_middleware(CORSMiddleware,allow_origins=['*'],allow_methods=['*'],allow_headers=['*'])
@app.get('/api/health')
def health(): return {'status':'ok','ml_connected':False}
@app.get('/api/prediction')
def prediction(): return {'cyclone_detected':True,'confidence':0.92,'wind_speed':95,'pressure':982,'latitude':15.82,'longitude':82.15,'movement':'NW'}
