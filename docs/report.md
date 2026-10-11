# CardioView — Technical Report

**Multimodal AI Hackathon 2026 · Track A: Cardiovascular Risk Visualization & Prediction**

> Educational decision-support prototype. Predictions are probability estimates,
> not a diagnosis and not a localized lesion map.

## 1. Overview
CardioView predicts overall Coronary Artery Disease (CAD) status and
vessel-specific stenosis risk for the three major coronary vessels — LAD, LCX,
and RCA — from routine clinical, ECG, laboratory, and echocardiographic features.
It maps those predictions onto an interactive 3D heart and explains each
prediction with SHAP feature attributions, inside a single web dashboard.

The design goal was a submission that is **honestly evaluated, works live, and is
clearly explained** — not a single impressive accuracy number. Every number in
the UI is a cross-validated estimate shown with its class balance.

## 2. Dataset & Preprocessing
We use the **Z-Alizadeh Sani Extension** dataset (UCI ML Repository): 303 patient
records with 59 columns, including demographics, vitals, ECG findings
(ST-elevation, T-inversion, LVH), labs, and echo measures (EF, Region with RWMA).
Labels are overall CAD (`Cath`: CAD/Normal) and per-vessel stenosis
(`LAD`/`LCX`/`RCA`: Stenotic/Normal).

**Leakage control (required).** The columns `Cath`, `LAD`, `LCX`, and `RCA` are
removed from the feature matrix for *all* prediction tasks. These are diagnostic
outputs; leaving any of them in would let a model "cheat" and report near-perfect
scores. After exclusion, 55 features remain as inputs.

**Encoding & imputation.** A scikit-learn `ColumnTransformer` applies median
imputation + standardization to numeric columns and most-frequent imputation +
one-hot encoding to categoricals. All preprocessing is fit **inside each
cross-validation fold** (via a `Pipeline`), so no information leaks from
validation data into training.

## 3. Modeling
For each of the four targets we train two baselines — **logistic regression**
(class-weighted) and a **random forest** (400 trees, class-weighted) — and keep
the one with the higher cross-validated ROC-AUC. Random forests for 303 rows are
intentional: no deep nets, which would overfit this sample.

**Validation.** We use **repeated stratified 5-fold cross-validation (5 folds ×
5 repeats = 25 fits)** and report the mean of each metric with its standard
deviation. Repeated CV is deliberately chosen over a single held-out split: with
only 303 rows, one tiny test set would be noisy, whereas the repeated-CV mean is
stable and its std honestly exposes variability. We report accuracy, precision,
recall, F1, ROC-AUC, and the **Brier score** (probability calibration — important
because the UI colors vessels by probability), alongside the positive-class count.
## 4. Results (repeated stratified 5-fold CV ×5, mean)

| Target | Model | ROC-AUC | F1 | Precision | Recall | Accuracy | Brier | Positives |
|---|---|---|---|---|---|---|---|---|
| Overall CAD | Random Forest | 0.923 ± 0.038 | 0.910 | 0.913 | 0.907 | 0.872 | 0.113 | 216/303 |
| LAD | Random Forest | 0.852 ± 0.047 | 0.829 | 0.807 | 0.857 | 0.794 | 0.165 | 177/303 |
| LCX | Random Forest | 0.720 ± 0.062 | 0.586 | 0.598 | 0.581 | 0.682 | 0.210 | 119/303 |
| RCA | Random Forest | 0.712 ± 0.050 | 0.524 | 0.565 | 0.502 | 0.666 | 0.210 | 114/303 |

**Reading the results honestly.** Overall CAD and LAD are strong and consistent
with the literature. LCX and RCA are meaningfully weaker — these vessels have the
fewest positive cases (119 and 114 of 303), so their estimates are more variable
and the features carry less signal for them. We present this gap deliberately: a
leakage-free pipeline that is honest about where it is uncertain is more
trustworthy than one quoting a uniform 90%+. These are cross-validation results,
not held-out test performance.

## 5. Explainability
The backend returns per-input SHAP contributions for every prediction. For
random-forest targets we use `TreeExplainer`; for logistic regression we use the
standardized coefficient × feature value. The dashboard lists the top drivers for
the selected vessel (e.g., typical chest pain, age, ST-elevation pushing risk up;
high ejection fraction pulling it down), turning a probability into a reason.

## 6. 3D Visualization & System Architecture
- **Frontend:** React + React Three Fiber. The myocardium is a stylized
  semi-transparent mesh; the LAD, LCX, and RCA are drawn as **independent 3D tube
  geometries** so each recolors on a green→amber→red scale directly from its
  predicted probability. Users rotate, zoom, and click a vessel (in the 3D view or
  the list) to inspect its risk and SHAP drivers. Drawing vessels independently
  guarantees a consistent, controllable mapping between model output and anatomy.
- **Mock mode / Live mode:** Mock mode renders the full experience from a
  heuristic (no backend needed) for a reliable demo; Live mode calls the backend
  for real predictions and falls back gracefully if it is unavailable.
- **Backend:** FastAPI loads the four saved models and exposes `/predict`
  (probability + SHAP per vessel), `/metrics`, and `/health`.
- **Pipeline:** `ml/train.py` produces the model files, `metrics.json`, the
  feature schema, and SHAP importances in one reproducible run.

## 7. Clinical Safety & Limitations
- Predictions are **probability estimates for decision support and education
  only** — not a diagnosis and not a substitute for diagnostic imaging.
- A highlighted vessel indicates **predicted risk, not a confirmed lesion
  location**. The dataset provides risk-associated features, not anatomical
  coordinates (e.g., Region with RWMA is not a pixel-level lesion map).
- 303 patients is a small sample; per-vessel metrics (especially LCX/RCA) are
  variable and should not be read as validated clinical performance.
- The disclaimer is visible throughout the UI.

## 8. Reproducibility
```bash
pip install -r requirements.txt
python ml/train.py --data "data/extention of Z-Alizadeh sani dataset.xlsx" --out models/
uvicorn backend.app:app --port 8000
cd frontend && npm install && npm run dev
```

## 9. Attribution
Z-Alizadeh Sani Extension dataset, UCI Machine Learning Repository. SHAP
(Lundberg & Lee, 2017). Three.js / React Three Fiber for rendering.
