# CardioView — Explainable Cardiac Risk & 3D Vessel Visualization

**Multimodal AI Hackathon 2026 — Track A.** An educational decision-support
prototype that predicts overall Coronary Artery Disease (CAD) status and
per-vessel stenosis risk (LAD, LCX, RCA) from clinical/ECG/echo features, maps
those predictions onto an interactive 3D heart, and explains every prediction
with SHAP feature attributions.

> ⚠️ **Clinical disclaimer.** Predictions are probability estimates for
> decision support and education only. They are **not** a diagnosis, do **not**
> localize an actual lesion, and are **not** a substitute for formal diagnostic
> imaging or a physician.

## Architecture
```
data/        Z-Alizadeh Sani Extension dataset (user-provided, see below)
ml/train.py  leakage-safe training -> models/*.joblib + metrics.json + SHAP
backend/     FastAPI service: /predict returns per-vessel prob + SHAP
frontend/    Vite + React + React Three Fiber 3D heart + dashboard
docs/        6-page technical report + demo video script
```

## Prerequisites
- Python 3.10+ and Node.js 18+
- The dataset file (not redistributed here — see Dataset).

## Dataset
Z-Alizadeh Sani **Extension** dataset (adds LAD/LCX/RCA vessel labels).
Download from the UCI ML Repository or Kaggle and place the file at
`data/Z-Alizadeh_Sani_Extention.xlsx` (CSV also accepted). The loader
auto-detects column names. Per the Track A rules, the columns
**Cath, LAD, LCX, RCA are excluded from model inputs** to prevent target leakage.

## 1. Train models
```bash
pip install -r requirements.txt
python ml/train.py --data data/Z-Alizadeh_Sani_Extention.xlsx --out models/
```
Prints 5-fold cross-validated metrics (accuracy, precision, recall, F1, ROC-AUC)
for each target and writes `models/metrics.json`, model files, and SHAP importances.

## 2. Run the backend
```bash
uvicorn backend.app:app --reload --port 8000
```

## 3. Run the frontend
```bash
cd frontend && npm install && npm run dev
```
Open the printed localhost URL. Use **Mock mode** to demo the 3D heart without
the backend; switch to **Live mode** to score real patient inputs.

## Evaluation note
All reported numbers are **cross-validation** results on 303 records, not
held-out test performance. The small sample makes per-vessel estimates
variable; we report class balance alongside every metric and treat methodology
(no leakage, in-fold preprocessing) as the headline, not a single accuracy number.

## Attribution
Z-Alizadeh Sani Extension dataset, UCI Machine Learning Repository.
3D heart mesh: <fill in source + license>. SHAP (Lundberg & Lee, 2017).
