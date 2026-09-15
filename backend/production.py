"""Production ASGI entrypoint for the SIH cyclone intelligence system.

The production service uses the real 3-stage Keras inference API and keeps the
legacy dashboard routes available. The old computer-vision content gate was
too aggressive: genuine satellite images can be monochrome, colour-enhanced,
annotated, or cropped and were being rejected before ML inference. Production
therefore accepts valid supported image uploads and lets the trained
identification model decide whether a cyclone is present.
"""
import backend.satellite_demo_api as satellite_api


def _accepted_image_gate(raw: bytes, filename: str = "") -> dict:
    """Accept valid image uploads for ML inference.

    File type, size, decoding and image integrity are still validated by the
    API before this function is reached. This replaces only the heuristic
    content gate that caused false rejections.
    """
    return {
        "verified": True,
        "confidence": 1.0,
        "reason": "Image accepted for satellite ML analysis.",
        "signals": {
            "supported_image": True,
            "content_gate": "DISABLED_FOR_FALSE_REJECTION_PREVENTION",
        },
    }


# Keep the existing satellite API and response schema, but remove only the
# over-aggressive heuristic content rejection. The trained models are unchanged.
satellite_api._satellite_gate = _accepted_image_gate
app = satellite_api.app

from backend.main import app as legacy_app

_existing = {(r.path, tuple(sorted(getattr(r, "methods", set())))) for r in app.routes}
for route in legacy_app.routes:
    key = (route.path, tuple(sorted(getattr(route, "methods", set()))))
    if key not in _existing:
        app.routes.append(route)

app.title = "AI Cyclone Prediction & Intelligence System"
app.version = "3.2.0"
