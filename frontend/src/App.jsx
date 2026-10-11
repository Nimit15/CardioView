import React, { useState } from "react";
import Heart from "./Heart.jsx";
import Dashboard from "./Dashboard.jsx";
import { FIELDS, PRESETS, VESSELS } from "./data.js";

const MOCK_FACTORS = [
  { feature: "Typical Chest Pain", contribution: 0.21 },
  { feature: "Age", contribution: 0.14 },
  { feature: "St Elevation", contribution: 0.11 },
  { feature: "EF-TTE", contribution: -0.09 },
  { feature: "DM", contribution: 0.07 },
];

function mockResult(features) {
  // Lightweight heuristic so the UI is fully demoable without the backend.
  const score = (w) => Math.max(0.02, Math.min(0.98,
    0.15 + 0.012 * ((features.Age || 50) - 40) + (features.HTN ? 0.12 : 0) +
    (features["Current Smoker"] ? 0.12 : 0) + (features.DM ? 0.1 : 0) +
    (features["Typical Chest Pain"] ? 0.18 : 0) + (features["St Elevation"] ? 0.15 : 0) +
    (features.FH ? 0.06 : 0) - ((features["EF-TTE"] || 55) - 55) * 0.006 + w));
  const mk = (p) => ({
    probability: Math.round(p * 1000) / 1000,
    label: p >= 0.5 ? "Positive" : "Negative",
    top_factors: MOCK_FACTORS,
    cv_metrics: { model: "mock", roc_auc: "—", f1: "—", n_pos: "—", n: 303 },
  });
  return {
    predictions: {
      CAD: mk(score(0.1)), LAD: mk(score(0.05)),
      LCX: mk(score(-0.12)), RCA: mk(score(-0.05)),
    },
    disclaimer: "MOCK MODE — heuristic values for UI demo, not model output.",
  };
}

export default function App() {
  const [mode, setMode] = useState("mock");
  const [features, setFeatures] = useState(PRESETS["Single-vessel"]);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setFeatures((f) => ({ ...f, [k]: v }));
  const loadPreset = (name) => { setFeatures(PRESETS[name]); setResult(null); };

  async function run() {
    setErr(null);
    if (mode === "mock") { setResult(mockResult(features)); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });
      if (!r.ok) throw new Error(`Backend ${r.status}`);
      setResult(await r.json());
    } catch (e) {
      setErr(`${e.message}. Is the backend running on :8000? Falling back to mock.`);
      setResult(mockResult(features));
    } finally { setBusy(false); }
  }
  const probs = result ? Object.fromEntries(
    VESSELS.map((v) => [v, result.predictions?.[v]?.probability ?? 0])
  ) : {};

  return (
    <div className="app">
      <div className="col left">
        <h1>CardioView</h1>
        <p className="sub">Cardiac risk & 3D vessel visualization</p>

        <div className="toggle">
          <button className={mode === "mock" ? "on" : ""} onClick={() => setMode("mock")}>Mock mode</button>
          <button className={mode === "live" ? "on" : ""} onClick={() => setMode("live")}>Live mode</button>
        </div>

        <h2>Sample patients</h2>
        <div className="row">
          {Object.keys(PRESETS).map((n) => (
            <button key={n} className="btn ghost" style={{ fontSize: 11, padding: 6 }}
              onClick={() => loadPreset(n)}>{n}</button>
          ))}
        </div>

        <h2>Patient features</h2>
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label>{f.label}</label>
            {f.type === "select" ? (
              <select value={features[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)}>
                {f.options.map((o) => {
                  const val = typeof o === "object" ? o.value : o;
                  const lbl = typeof o === "object" ? o.label : o;
                  return <option key={val} value={val}>{lbl}</option>;
                })}
              </select>
            ) : f.type === "binary" ? (
              <select value={features[f.key] ?? 0} onChange={(e) => set(f.key, Number(e.target.value))}>
                <option value={0}>No</option><option value={1}>Yes</option>
              </select>
            ) : (
              <input type="number" step={f.step || 1} value={features[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value === "" ? "" : Number(e.target.value))} />
            )}
          </div>
        ))}

        <button className="btn" onClick={run} disabled={busy}>
          {busy ? "Predicting…" : mode === "mock" ? "Run (mock)" : "Predict risk"}
        </button>
        {err && <p className="sub" style={{ color: "#ffb4a8" }}>{err}</p>}
      </div>

      <div className="col center" style={{ padding: 0 }}>
        <Heart probs={probs} selected={selected} onSelect={setSelected} />
        <div className="legend">
          Predicted stenosis risk
          <div className="scale" />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>low</span><span>high</span>
          </div>
        </div>
      </div>

      <Dashboard result={result} selected={selected} onSelect={setSelected} />
    </div>
  );
}
