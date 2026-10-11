import React from "react";
import { VESSELS, VESSEL_LABEL, riskColor, prettyFactors, fmtMetrics } from "./data.js";

function pct(p) { return `${Math.round((p ?? 0) * 100)}%`; }

export default function Dashboard({ result, selected, onSelect }) {
  if (!result) {
    return (
      <div className="col right">
        <h1>Risk & Explanation</h1>
        <p className="sub">Enter a patient and run a prediction to see
          vessel-specific risk and the factors behind it.</p>
      </div>
    );
  }
  const preds = result.predictions || {};
  const cad = preds.CAD || {};
  const sel = selected && preds[selected];

  return (
    <div className="col right">
      <h1>Risk & Explanation</h1>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Overall CAD</span>
          <span className="badge" style={{
            background: riskColor(cad.probability ?? 0), color: "#09121b",
          }}>{cad.label === "Positive" ? "CAD likely" : "CAD unlikely"}</span>
        </div>
        <div className="bar"><span style={{
          width: pct(cad.probability), background: riskColor(cad.probability ?? 0),
        }} /></div>
        <div className="sub" style={{ marginTop: 4 }}>
          Estimated probability <span className="pct">{pct(cad.probability)}</span>
        </div>
      </div>

      <h2>Per-vessel stenosis risk</h2>
      {VESSELS.map((v) => {
        const p = preds[v]?.probability ?? 0;
        return (
          <div key={v} className={"vessel-row" + (selected === v ? " sel" : "")}
            onClick={() => onSelect(v)}>
            <div>
              <span className="dot" style={{ background: riskColor(p) }} />
              <strong>{v}</strong>
              <div className="sub" style={{ margin: 0 }}>{VESSEL_LABEL[v]}</div>
            </div>
            <span className="pct">{pct(p)}</span>
          </div>
        );
      })}

      <h2>Why — top factors {selected ? `(${selected})` : "(select a vessel)"}</h2>
      <div className="card">
        {sel ? (
          <>
            <div className="sub" style={{ margin: "0 0 6px" }}>
              <span style={{ color: "var(--red)" }}>▲</span> raises risk ·{" "}
              <span style={{ color: "var(--green)" }}>▼</span> lowers risk
            </div>
            {prettyFactors(sel.top_factors).map((f, i) => (
              <div className="factor" key={i}>
                <span>{f.label}</span>
                <span style={{ color: f.contribution >= 0 ? "var(--red)" : "var(--green)" }}>
                  {f.contribution >= 0 ? "▲" : "▼"} {Math.abs(f.contribution).toFixed(3)}
                </span>
              </div>
            ))}
          </>
        ) : <span className="sub">Click a vessel (list or 3D model) to see its SHAP drivers.</span>}
        {sel?.cv_metrics?.roc_auc != null && (
          <div className="sub" style={{ marginTop: 8 }}>{fmtMetrics(sel.cv_metrics)}</div>
        )}
      </div>

      <div className="disclaimer">
        {result.disclaimer || "Educational decision-support estimate only."} Colors show
        predicted probability, not a confirmed lesion location.
      </div>
    </div>
  );
}
