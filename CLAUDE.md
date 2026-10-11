# CardioView — Project Context for Claude Code

You are working on a 24–30h hackathon submission (Multimodal AI Hackathon 2026,
Track A). This file gives you everything you need to build, run, and ship this
project **autonomously**. The user is studying and wants minimal interruptions:
only stop for things that genuinely require them (see "When to pause the user").

## What this project is
An educational cardiac decision-support web app:
- Predicts overall CAD + per-vessel stenosis (LAD, LCX, RCA) from clinical/ECG/echo
  features in the Z-Alizadeh Sani *Extension* dataset (303 rows).
- Maps predictions onto an interactive 3D heart (React Three Fiber): three
  recolorable vessel tubes whose color = predicted stenosis probability.
- Explains every prediction with SHAP feature attributions.

## Hard rules (do not break)
1. **No target leakage.** The columns Cath, LAD, LCX, RCA are NEVER model inputs.
   (`ml/train.py` already enforces this — keep it that way.)
2. **Honest evaluation.** Report 5-fold cross-validation metrics as *CV* results,
   not test performance. Always show class balance (n_pos / n). Do not inflate.
3. **Framing.** The UI says "estimated stenosis probability", never "confirmed
   blockage/lesion". Keep the clinical disclaimer visible.

## Stack
Python (scikit-learn + SHAP) · FastAPI backend · Vite + React + React Three Fiber frontend.

## Layout
```
ml/train.py     leakage-safe training -> models/*.joblib + metrics.json + SHAP
backend/app.py  FastAPI /predict -> per-vessel probability + SHAP contributions
frontend/       Vite + React + R3F 3D heart + dashboard (Mock mode + Live mode)
data/           dataset file goes here (see SHIP.md)
docs/           6-page report + demo video script
```

## When to pause the user (only these)
- GitHub login the first time (`gh auth login`).
- If the dataset file is missing and you cannot download it.
- Final demo recording and Devpost submission (these are theirs to do).

Everything else — installing tools, venv, pip/npm install, training, running
servers, fixing runtime errors, committing, pushing — do on your own.

## Current status
Done: requirements.txt, ml/train.py, README.md, this file, SHIP.md, setup.ps1.
Pending (build these): backend/app.py (may already exist), frontend app, docs.
Follow SHIP.md top to bottom.
