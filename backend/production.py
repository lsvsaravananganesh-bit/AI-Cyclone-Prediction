"""Production ASGI entrypoint for the SIH cyclone prototype.

The satellite AI app is registered first so its verified 3-stage inference
routes win over older compatibility routes. Legacy routes are then included
for the rest of the dashboard, so existing functionality is preserved.
"""
from backend.satellite_demo_api import app
from backend.main import app as legacy_app

# Keep existing dashboard/API routes available while using the real satellite
# inference implementation for overlapping endpoints.
_existing = {(r.path, tuple(sorted(getattr(r, "methods", set())))) for r in app.routes}
for route in legacy_app.routes:
    key = (route.path, tuple(sorted(getattr(route, "methods", set()))))
    if key not in _existing:
        app.routes.append(route)

app.title = "AI Cyclone Prediction & Intelligence System"
app.version = "3.0.0"
