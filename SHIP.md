# SHIP.md — Autonomous build & ship playbook

Run these steps top to bottom **without asking the user** unless a step says
"ASK USER". Fix any errors you hit and retry. Report a short summary at the end.

## 0. Prerequisites (install silently if missing)
Check for Node.js, Python 3.10+, Git, and GitHub CLI. Install missing ones:
```powershell
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements
winget install -e --id Git.Git --accept-source-agreements --accept-package-agreements
winget install -e --id GitHub.cli --accept-source-agreements --accept-package-agreements
```

## 1. Python environment + models
```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
```
Dataset: look for a file in `data/` (any .xlsx or .csv).
- If present, train:
  `.\.venv\Scripts\python ml\train.py --data data\<thefile> --out models\`
- If `data/` is empty, try downloading the Z-Alizadeh Sani **Extension** dataset
  from the UCI ML Repository into `data/`. If that fails:
  **ASK USER** — "Please download the Z-Alizadeh Sani Extension dataset from
  Kaggle and drop the file into the `data` folder, then tell me to continue."
Confirm `models/metrics.json` exists and print the metrics.

## 2. Backend
```powershell
.\.venv\Scripts\python -m uvicorn backend.app:app --port 8000
```
Verify `http://localhost:8000/health` returns ok and `/predict` accepts a POST.
Leave it running in the background.

## 3. Frontend
> NOTE: The frontend source is authored separately (by the Cowork assistant).
> Do NOT scaffold your own React app or overwrite files in `frontend/`.
> Once `frontend/package.json` exists, just install and run it:
```powershell
cd frontend
npm install
npm run dev
```
Open the printed localhost URL. Confirm the 3D heart loads, the three vessels
(LAD/LCX/RCA) are visible and recolor in **Mock mode**, and **Live mode** calls
the backend and recolors from real predictions.

## 4. Ship to GitHub
```powershell
git init
git add -A
git commit -m "CardioView: cardiac risk 3D viz + explainable ML"
gh auth status  # if not logged in, run: gh auth login   <-- ASK USER to approve the browser login
gh repo create cardioview --public --source=. --remote=origin --push
```
Report the repo URL.

## 5. Hand back to the user (ASK USER)
Tell them it's live and remind them of the human-only steps:
- Record the 4–6 min demo video (script in `docs/demo_script.md`), upload
  **unlisted** to YouTube with English audio or subtitles.
- Fill in the Devpost project description and attach all teammates.
- Submit before the deadline.

## Permissions tip
If this interface has an "auto-approve" / "allow all commands" toggle, the user
can enable it so you run steps 0–4 without stopping for each command.
