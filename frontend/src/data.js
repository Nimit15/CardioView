// Curated subset of input features for the demo form. The backend fills any
// omitted feature with NaN (median-imputed), so this stays manageable.
export const FIELDS = [
  { key: "Age", label: "Age", type: "number" },
  { key: "Sex", label: "Sex", type: "select", options: [
    { value: "Male", label: "Male" }, { value: "Fmale", label: "Female" }] },
  { key: "BMI", label: "BMI", type: "number", step: 0.1 },
  { key: "BP", label: "Systolic BP", type: "number" },
  { key: "PR", label: "Pulse rate", type: "number" },
  { key: "DM", label: "Diabetes", type: "binary" },
  { key: "HTN", label: "Hypertension", type: "binary" },
  { key: "Current Smoker", label: "Current smoker", type: "binary" },
  { key: "FH", label: "Family history", type: "binary" },
  { key: "Typical Chest Pain", label: "Typical chest pain", type: "binary" },
  { key: "St Elevation", label: "ST elevation", type: "binary" },
  { key: "Tinversion", label: "T inversion", type: "binary" },
  { key: "LVH", label: "LVH", type: "binary" },
  { key: "Region RWMA", label: "Region with RWMA", type: "number" },
  { key: "EF-TTE", label: "Ejection fraction (EF)", type: "number" },
  { key: "FBS", label: "Fasting blood sugar", type: "number" },
  { key: "TG", label: "Triglycerides", type: "number" },
  { key: "LDL", label: "LDL", type: "number" },
];

export const PRESETS = {
  "Low risk": {
    Age: 42, Sex: "Fmale", BMI: 23.5, BP: 118, PR: 70, DM: 0, HTN: 0,
    "Current Smoker": 0, FH: 0, "Typical Chest Pain": 0, "St Elevation": 0,
    Tinversion: 0, LVH: 0, "Region RWMA": 0, "EF-TTE": 60, FBS: 92, TG: 110, LDL: 95,
  },
  "Single-vessel": {
    Age: 58, Sex: "Male", BMI: 28.1, BP: 145, PR: 82, DM: 0, HTN: 1,
    "Current Smoker": 1, FH: 1, "Typical Chest Pain": 1, "St Elevation": 0,
    Tinversion: 1, LVH: 0, "Region RWMA": 1, "EF-TTE": 50, FBS: 118, TG: 180, LDL: 140,
  },
  "High risk / triple": {
    Age: 67, Sex: "Male", BMI: 31.0, BP: 165, PR: 95, DM: 1, HTN: 1,
    "Current Smoker": 1, FH: 1, "Typical Chest Pain": 1, "St Elevation": 1,
    Tinversion: 1, LVH: 1, "Region RWMA": 3, "EF-TTE": 35, FBS: 165, TG: 240, LDL: 170,
  },
};

export const VESSELS = ["LAD", "LCX", "RCA"];
export const VESSEL_LABEL = {
  LAD: "Left Anterior Descending",
  LCX: "Left Circumflex",
  RCA: "Right Coronary Artery",
};

// probability -> color on green->amber->red scale
export function riskColor(p) {
  const c1 = [34, 197, 94], c2 = [245, 158, 11], c3 = [239, 68, 68];
  const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = p < 0.5 ? lerp(c1, c2, p / 0.5) : lerp(c2, c3, (p - 0.5) / 0.5);
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

// Turn raw one-hot / prefixed SHAP feature names into plain labels and collapse
// one-hot pairs (e.g. "cat__Dyspnea_Y" + "cat__Dyspnea_N") into one row, keeping
// the larger-magnitude effect. "num__Age" -> "Age"; "cat__LVH_N" -> "LVH: No".
const YES = new Set(["y", "yes", "1", "true"]);
const NO = new Set(["n", "no", "0", "false"]);
export function prettyFactors(raw = []) {
  const byBase = new Map();
  for (const f of raw) {
    const name = String(f.feature).replace(/^num__|^cat__/, "");
    const isCat = /^cat__/.test(f.feature);
    let base = name, label = name;
    if (isCat) {
      const i = name.lastIndexOf("_");
      if (i > 0) {
        base = name.slice(0, i);
        const v = name.slice(i + 1);
        const vl = YES.has(v.toLowerCase()) ? "Yes"
          : NO.has(v.toLowerCase()) ? "No" : v;
        label = `${base}: ${vl}`;
      }
    }
    const prev = byBase.get(base);
    if (!prev || Math.abs(f.contribution) > Math.abs(prev.contribution)) {
      byBase.set(base, { label, contribution: f.contribution });
    }
  }
  return [...byBase.values()].sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
}

// One-line CV metrics summary: "Model: rf · CV ROC-AUC 0.85 ± 0.05 · Brier 0.14 · F1 0.83 (pos 177/303)"
export function fmtMetrics(m = {}) {
  const n = (x, d = 2) => (typeof x === "number" ? x.toFixed(d) : x);
  let s = `Model: ${m.model} · CV ROC-AUC ${n(m.roc_auc)}`;
  if (typeof m.roc_auc_std === "number") s += ` ± ${n(m.roc_auc_std)}`;
  if (typeof m.brier === "number") s += ` · Brier ${n(m.brier)}`;
  if (m.f1 != null) s += ` · F1 ${n(m.f1)}`;
  if (m.n_pos != null && m.n != null) s += ` (pos ${m.n_pos}/${m.n})`;
  return s;
}
