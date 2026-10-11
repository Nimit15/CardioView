"""
CardioView FastAPI backend.

Loads the four trained models and serves predictions + per-input SHAP
explanations. Run:  uvicorn backend.app:app --port 8000
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parent.parent
MODELS = ROOT / "models"
TARGETS = ["CAD", "LAD", "LCX", "RCA"]

app = FastAPI(title="CardioView API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"],
                   allow_headers=["*"])

_models, _schema, _metrics = {}, {}, {}


def _load():
    global _schema, _metrics
    for t in TARGETS:
        p = MODELS / f"{t}_model.joblib"
        if p.exists():
            _models[t] = joblib.load(p)
    sp = MODELS / "feature_schema.json"
    if sp.exists():
        _schema = json.load(open(sp)).get("features", {})
    mp = MODELS / "metrics.json"
    if mp.exists():
        _metrics = json.load(open(mp))


_load()


class PredictRequest(BaseModel):
    features: dict          # {feature_name: value}


def _row_from(features: dict) -> pd.DataFrame:
    """Build a one-row frame matching the training schema (missing -> NaN)."""
    row = {col: features.get(col, np.nan) for col in _schema}
    return pd.DataFrame([row])
def _shap_for(model, X):
    """Top feature contributions for this one input row.

    RandomForest -> TreeExplainer; LogisticRegression -> coefficient * value.
    Returns [{feature, contribution}] sorted by |value|.
    """
    pre = model.named_steps["pre"]
    clf = model.named_steps["clf"]
    names = list(pre.get_feature_names_out())
    Xt = pre.transform(X)
    Xt = Xt.toarray() if hasattr(Xt, "toarray") else np.asarray(Xt)
    try:
        import shap
        if clf.__class__.__name__ == "RandomForestClassifier":
            vals = shap.TreeExplainer(clf).shap_values(Xt)
            vals = vals[1] if isinstance(vals, list) else vals
            contrib = np.asarray(vals)[0].ravel()
        else:
            contrib = clf.coef_.ravel() * Xt[0]
    except Exception:
        coef = getattr(clf, "coef_", None)
        contrib = (coef.ravel() * Xt[0]) if coef is not None else np.zeros(len(names))
    pairs = sorted(zip(names, contrib), key=lambda t: -abs(t[1]))[:8]
    return [{"feature": n, "contribution": round(float(v), 4)} for n, v in pairs]


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": list(_models.keys())}


@app.get("/metrics")
def metrics():
    return _metrics


@app.post("/predict")
def predict(req: PredictRequest):
    X = _row_from(req.features)
    out = {}
    for t, model in _models.items():
        proba = float(model.predict_proba(X)[0, 1])
        out[t] = {
            "probability": round(proba, 4),
            "label": "Positive" if proba >= 0.5 else "Negative",
            "top_factors": _shap_for(model, X),
            "cv_metrics": _metrics.get(t, {}),
        }
    return {"predictions": out,
            "disclaimer": "Educational decision-support estimate only. "
                          "Not a diagnosis or a localized lesion."}
