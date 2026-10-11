# CardioView

An interactive tool that estimates coronary artery disease risk from a patient's clinical data and shows it on a 3D heart, with a plain explanation of what drove each prediction.

Built for the Multimodal AI Hackathon 2026 (Track A).

> This is an educational prototype. The numbers are probability estimates meant for learning and decision support, not a diagnosis. A highlighted artery shows predicted risk, not a confirmed blockage.

## What it does

You enter a patient's details, things like age, blood pressure, cholesterol, and ECG findings. CardioView then estimates whether coronary artery disease is likely overall, and the stenosis risk for each of the three main arteries: the LAD, LCX, and RCA.

Each artery lights up on a 3D heart, from green for low risk to red for high. You can rotate and zoom the heart, and click any artery to see which of the patient's measurements pushed its score up or down.

## Screenshots

Add two or three images here once you have them: the 3D heart with the arteries coloured, a single artery selected with its contributing factors, and the full dashboard.

## Getting started

You will need two free programs first: Python (version 3.10 or newer) and Node.js (version 18 or newer). If you do not have them, get Python from python.org/downloads and Node.js from nodejs.org.

The project runs in two parts at the same time: a Python backend that holds the model, and a web app that shows the 3D heart.

### Step 1: train the model (about a minute, done once)

In the project folder, run:

```
pip install -r requirements.txt
python ml/train.py --data "data/extention of Z-Alizadeh sani dataset.xlsx" --out models/
```

This prints the accuracy figures and saves the trained models into the `models` folder.

### Step 2: start the backend

```
uvicorn backend.app:app --port 8000
```

Leave this window open. To check it is running, open http://localhost:8000/health in your browser.

### Step 3: start the web app

Open a second terminal and run:

```
cd frontend
npm install
npm run dev
```

Open the link it prints, usually http://localhost:5173.

A quick tip: the app has a Mock mode that works on its own if you just want to look at the interface, and a Live mode that calls the real model from Step 2.
## Results

Measured with repeated five-fold cross-validation, so these are averaged, honest numbers rather than a single lucky split:

| What we predict | ROC-AUC |
|---|---|
| Overall coronary artery disease | about 0.92 |
| LAD artery | about 0.85 |
| LCX artery | about 0.72 |
| RCA artery | about 0.71 |

The LCX and RCA scores are lower because far fewer patients in the data have disease in those two arteries, so there is less for the model to learn from. We show that openly instead of hiding it. We also keep the diagnostic result columns (Cath, LAD, LCX, RCA) out of the model's inputs, so it cannot simply read the answer off the data.

## How the project is organised

```
ml/train.py     trains the models and saves the results
backend/app.py  serves predictions and explanations (FastAPI)
frontend/       the 3D heart and dashboard (React + React Three Fiber)
data/           the patient dataset
docs/           the full technical report and the demo video script
```

## The data

Z-Alizadeh Sani Extension dataset, 303 patients, from the UCI Machine Learning Repository.

## A note on safety

CardioView is a learning and decision-support demo. It does not diagnose anyone and is not a replacement for proper medical imaging or a doctor's judgement. The disclaimer stays on screen while you use it.
