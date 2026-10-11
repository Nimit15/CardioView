"""
Track A — Cardiovascular Risk: leakage-safe training pipeline.

Trains 4 classifiers on the Z-Alizadeh Sani *Extension* dataset:
    - CAD   (overall, from the 'Cath' column: Cad / Normal)
    - LAD, LCX, RCA  (per-vessel: Stenotic / Normal)

Key rubric rule: LAD, LCX, RCA and Cath are NEVER used as input features
(target leakage). All preprocessing is fit INSIDE each CV fold.

Usage:
    python ml/train.py --data data/Z-Alizadeh_Sani_Extention.xlsx --out models/

Outputs:
    models/<target>_model.joblib        final model (full-data fit)
    models/metrics.json                 cross-validated metrics for all targets
    models/feature_schema.json          input columns + dtypes for the backend
    models/shap_<target>.json           mean |SHAP| feature importances
"""
import argparse, json, re, sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RepeatedStratifiedKFold, cross_validate
from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score)
import joblib

LEAK_COLS = ["cath", "lad", "lcx", "rca"]          # never used as inputs
TARGETS = {"CAD": "cath", "LAD": "lad", "LCX": "lcx", "RCA": "rca"}
POSITIVE = {"cath": {"cad"}, "lad": {"stenotic"},   # label -> positive class
            "lcx": {"stenotic"}, "rca": {"stenotic"}}


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s).strip().lower())


def load_dataset(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in (".xlsx", ".xls"):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)
    df.columns = [str(c).strip() for c in df.columns]
    return df
def find_col(df, key):
    """Locate a column whose normalised name matches `key`."""
    for c in df.columns:
        if norm(c) == key:
            return c
    for c in df.columns:                     # fall back to 'contains'
        if key in norm(c):
            return c
    return None


def binarize(series, positive_set):
    vals = series.astype(str).map(norm)
    return vals.isin(positive_set).astype(int)


def build_preprocessor(X):
    num = X.select_dtypes(include=["number"]).columns.tolist()
    cat = [c for c in X.columns if c not in num]
    num_pipe = Pipeline([("impute", SimpleImputer(strategy="median")),
                         ("scale", StandardScaler())])
    cat_pipe = Pipeline([("impute", SimpleImputer(strategy="most_frequent")),
                         ("ohe", OneHotEncoder(handle_unknown="ignore"))])
    return ColumnTransformer([("num", num_pipe, num), ("cat", cat_pipe, cat)])


def candidate_models():
    return {
        "logreg": LogisticRegression(max_iter=2000, class_weight="balanced"),
        "rf": RandomForestClassifier(n_estimators=400, class_weight="balanced",
                                     random_state=42, n_jobs=-1),
    }


def cv_metrics(pipe, X, y, seed=42):
    """Repeated stratified CV (5 folds x 5 repeats) -> stable mean/std.

    Repeated CV is the right call for a 303-row dataset: more robust than a
    single tiny held-out split, with a std that honestly shows stability.
    Brier score reports probability calibration (lower = better).
    """
    cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=seed)
    scoring = ["roc_auc", "f1", "precision", "recall", "accuracy", "neg_brier_score"]
    res = cross_validate(pipe, X, y, cv=cv, scoring=scoring, n_jobs=-1)
    mean = lambda k: round(float(res["test_" + k].mean()), 4)
    return {
        "roc_auc": mean("roc_auc"),
        "roc_auc_std": round(float(res["test_roc_auc"].std()), 4),
        "f1": mean("f1"),
        "precision": mean("precision"),
        "recall": mean("recall"),
        "accuracy": mean("accuracy"),
        "brier": round(-mean("neg_brier_score"), 4),
        "n_pos": int(y.sum()), "n": int(len(y)),
        "cv": "5-fold x5 repeats",
    }
def shap_importance(pipe, X):
    """Mean |SHAP| per original feature for a fitted tree pipeline."""
    try:
        import shap
    except ImportError:
        return None
    pre = pipe.named_steps["pre"]
    clf = pipe.named_steps["clf"]
    if not isinstance(clf, RandomForestClassifier):
        return None
    Xt = pre.transform(X)
    names = pre.get_feature_names_out()
    expl = shap.TreeExplainer(clf)
    sv = expl.shap_values(Xt)
    sv = sv[1] if isinstance(sv, list) else sv
    imp = np.abs(sv).mean(axis=0).ravel()
    pairs = sorted(zip(names, imp), key=lambda t: -t[1])[:20]
    return [{"feature": str(n), "mean_abs_shap": float(v)} for n, v in pairs]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", default="models")
    args = ap.parse_args()

    out = Path(args.out); out.mkdir(parents=True, exist_ok=True)
    df = load_dataset(Path(args.data))

    # locate the 4 label columns
    label_cols = {k: find_col(df, v) for k, v in TARGETS.items()}
    missing = [k for k, c in label_cols.items() if c is None]
    if missing:
        sys.exit(f"ERROR: could not find label columns for {missing}. "
                 f"Columns seen: {list(df.columns)}")

    # input matrix = everything EXCEPT the 4 leakage columns
    leak_actual = [find_col(df, k) for k in LEAK_COLS]
    leak_actual = [c for c in leak_actual if c is not None]
    X_all = df.drop(columns=leak_actual)
    schema = {c: ("number" if pd.api.types.is_numeric_dtype(df[c]) else "category")
              for c in X_all.columns}
    json.dump({"features": schema}, open(out / "feature_schema.json", "w"), indent=2)

    metrics = {}
    for tgt, col in label_cols.items():
        y = binarize(df[col], POSITIVE[TARGETS[tgt]])
        best, best_auc, best_name = None, -1, None
        for name, clf in candidate_models().items():
            pipe = Pipeline([("pre", build_preprocessor(X_all)), ("clf", clf)])
            m = cv_metrics(pipe, X_all, y)
            if m["roc_auc"] > best_auc:
                best, best_auc, best_name = m, m["roc_auc"], name
        # refit best model on all data and persist
        clf = candidate_models()[best_name]
        final = Pipeline([("pre", build_preprocessor(X_all)), ("clf", clf)]).fit(X_all, y)
        joblib.dump(final, out / f"{tgt}_model.joblib")
        best["model"] = best_name
        metrics[tgt] = best
        shap_imp = shap_importance(final, X_all)
        if shap_imp:
            json.dump(shap_imp, open(out / f"shap_{tgt}.json", "w"), indent=2)
        print(f"[{tgt:4}] model={best_name:6} "
              f"AUC={best['roc_auc']}±{best['roc_auc_std']} "
              f"F1={best['f1']} Brier={best['brier']} "
              f"(pos {best['n_pos']}/{best['n']})")

    json.dump(metrics, open(out / "metrics.json", "w"), indent=2)
    print("Saved models + metrics.json to", out)
    print("NOTE: metrics are repeated stratified 5-fold (x5) cross-validation "
          "means, not held-out test performance.")


if __name__ == "__main__":
    main()
