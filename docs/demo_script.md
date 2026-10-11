# CardioView — Demo Video Script (~5 minutes)

Target length 4–6 min. Record screen + mic. Upload **unlisted** to YouTube with
English audio or subtitles. Speak naturally; the lines below are a guide.

---

**[0:00–0:30] Hook & problem**
"Cardiovascular disease is the world's leading cause of death. Risk scores give
clinicians a number, but a number doesn't show *where* risk sits in the heart.
CardioView predicts coronary artery disease and per-vessel stenosis risk, then
maps it onto an interactive 3D heart — with an explanation for every prediction."

**[0:30–1:15] The data & the honest ML**
"We use the Z-Alizadeh Sani Extension dataset — 303 patients, clinical, ECG and
echo features. Critically, we exclude the Cath, LAD, LCX and RCA columns from the
inputs to prevent target leakage. We train logistic-regression and random-forest
models and report 5-fold cross-validation results — not inflated test numbers."
*(Show the metrics table.)* "Overall CAD reaches 0.92 ROC-AUC; LAD 0.85. LCX and
RCA are lower, around 0.72, because they have far fewer positive cases — and we
show that openly rather than hiding it."

**[1:15–3:00] Live walkthrough**
*(Switch to the app.)*
"Here's the dashboard. I'll load the 'high-risk' sample patient."
*(Click preset → Predict.)*
"The 3D heart updates instantly. Each coronary vessel is colored by its predicted
stenosis probability — green is low, red is high. I can rotate, zoom, and click
any vessel."
*(Rotate; click LAD.)*
"Selecting the LAD shows its probability and the SHAP factors driving it —
typical chest pain, age, ST-elevation. The panel also shows which model was used
and its cross-validated score."

**[3:00–4:00] Architecture**
"Under the hood: a scikit-learn pipeline trains and saves four models with SHAP;
a FastAPI backend serves predictions and per-input explanations; and a React +
React Three Fiber front end renders the heart. The vessels are drawn as
independent 3D tubes, so model output maps cleanly and consistently to anatomy."

**[4:00–4:45] Safety & limitations**
"Important: these are probability estimates for education and decision support —
not a diagnosis, and the colored vessel is *not* a confirmed lesion location. The
dataset gives risk, not anatomical coordinates, and 303 patients is a small
sample, so per-vessel estimates are variable. The disclaimer stays visible
throughout."

**[4:45–5:00] Close**
"CardioView turns a cardiac risk model into something a clinician can see, rotate,
and understand — honestly evaluated and fully explainable. Thanks for watching."

---

**Shots to capture:** metrics table · preset load → predict · heart rotate/zoom ·
click a vessel → SHAP panel · the disclaimer banner · a quick look at the repo.
