# Backend

## Run locally

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then set the frontend API base in the browser console:

```js
localStorage.setItem('CYCLONE_API_BASE','http://127.0.0.1:8000'); location.reload();
```

## PostgreSQL

Create a PostgreSQL database, run `schema.sql`, and set `DATABASE_URL`, for example:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/cyclone
```

Populate `cyclones` and `cyclone_track_points` from a licensed/authoritative historical dataset. Do not use generated records as training truth.

## ML model

After training the image classifier, point `CYCLONE_MODEL_PATH` at the generated `.pt` artifact. The API will then run the actual ResNet18 classifier instead of returning `MODEL_NOT_TRAINED`.

For SIH presentation, show the model version, validation split and held-out evaluation results. Never invent accuracy or confidence values.
