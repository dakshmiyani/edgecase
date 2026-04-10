import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '../components/shared/AppLayout';
import { Network, Info, Upload, Loader2, CheckCircle2, AlertTriangle, FileText, Braces, Globe } from 'lucide-react';

/**
 * Builds a per-feature comparison between local model weights
 * and the new global model weights after aggregation.
 *
 * localCoef:  number[][]  — trainingResult.delta.coef  (shape [[...]])
 * localNames: string[]    — trainingResult.delta.feature_names
 * globalCoef: number[][]  — globalWeightsAfter.coef
 * globalNames:string[]    — globalWeightsAfter.feature_names
 *
 * Returns array of:
 * { feature, localWeight, globalWeight, absPctChange, direction }
 */
function computeParamDiff(localCoef, localNames, globalCoef, globalNames) {
  const localFlat  = localCoef[0]   // unwrap [[...]] → [...]
  const globalFlat = globalCoef[0]

  // Build lookup: feature_name → global weight
  const globalMap = {}
  globalNames.forEach((name, i) => {
    globalMap[name] = globalFlat[i]
  })

  return localNames.map((name, i) => {
    const localW  = localFlat[i]
    const globalW = globalMap[name] ?? null

    let absPctChange = null
    let direction    = "unchanged"

    if (globalW !== null && localW !== 0) {
      const pct = ((globalW - localW) / Math.abs(localW)) * 100
      absPctChange = Math.abs(pct)
      direction    = pct > 0.01 ? "up" : pct < -0.01 ? "down" : "unchanged"
    }

    return {
      feature:      name,
      localWeight:  localW,
      globalWeight: globalW,
      absPctChange,
      direction
    }
  })
  .sort((a, b) => (b.absPctChange ?? 0) - (a.absPctChange ?? 0)) // biggest changes first
}

export default function FederatedLearningPage() {
    const [file, setFile] = useState(null);
    const [trainingResult, setTrainingResult] = useState(null);
    const [isTraining, setIsTraining] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateResult, setUpdateResult] = useState(null);
    const [error, setError] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const [globalModelBefore, setGlobalModelBefore] = useState(null);
    const [globalModelAfter, setGlobalModelAfter] = useState(null);

    const [globalWeightsBefore, setGlobalWeightsBefore] = useState(null);
    const [globalWeightsAfter,  setGlobalWeightsAfter]  = useState(null);
    const [paramPage,           setParamPage]           = useState(0);
    const PARAMS_PER_PAGE = 10;

    useEffect(() => {
        fetch("http://localhost:8000/model/stats")
            .then(r => r.json())
            .then(data => setGlobalModelBefore(data))
            .catch(() => setGlobalModelBefore(null));
            
        fetch("http://localhost:8000/model/weights")
            .then(r => r.json())
            .then(data => setGlobalWeightsBefore(data))
            .catch(() => setGlobalWeightsBefore(null));
    }, []);

    const handleFileUpload = async (selectedFile) => {
        setFile(selectedFile);
        setIsTraining(true);
        setError(null);
        setTrainingResult(null);
        setUpdateResult(null);

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const res = await fetch("http://localhost:8000/train_local", {
                method: "POST",
                body: formData
            });
            if (!res.ok) throw new Error(`Training failed: ${res.statusText}`);
            const data = await res.json();
            setTrainingResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsTraining(false);
        }
    };

    const handleUpdateGlobal = async () => {
        setIsUpdating(true);
        setError(null);

        try {
            const res = await fetch("http://127.0.0.1:8000/upload_delta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bank_id: "bank_ui_client",
                    delta: trainingResult.delta,
                    n_samples: trainingResult.n_samples,
                    auc: trainingResult.auc
                })
            });
            if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
            const data = await res.json();

            // Re-fetch fresh global stats after the delta was stored
            let statsData = {};
            try {
                const statsRes = await fetch("http://localhost:8000/model/stats");
                if (statsRes.ok) statsData = await statsRes.json();
            } catch (_) {}

            setGlobalModelAfter({
                version:   statsData.version   ?? "—",
                round_auc: trainingResult.auc   ?? statsData.round_auc ?? null,
                n_banks:   data.round_submissions ?? statsData.n_banks ?? null
            });

            const weightsRes  = await fetch("http://localhost:8000/model/weights");
            const weightsData = await weightsRes.json();
            setGlobalWeightsAfter(weightsData);
            setParamPage(0);

            setUpdateResult({
                ...data,
                round_auc: trainingResult.auc
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const onFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) handleFileUpload(f);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f && f.name.endsWith('.csv')) handleFileUpload(f);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const onDragLeave = () => setIsDragOver(false);

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Network className="w-8 h-8 text-violet-400" />
                            Collaborative Intelligence
                        </h1>
                        <p className="text-white/40 mt-1 max-w-xl text-sm">
                            Layer 4 — Federated learning orchestration. Train locally on your institution's data, then contribute model deltas to improve the global fraud model — no raw data ever leaves your environment.
                        </p>
                    </div>

                    <div className="px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                            <Info className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-white/30 uppercase font-mono">Privacy Protocol</p>
                            <p className="text-xs font-bold text-white uppercase tracking-tighter">Zero-Knowledge Aggregation</p>
                        </div>
                    </div>
                </div>

                {/* Section 1 — Upload Zone */}
                <div
                    id="upload-zone"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center
                        transition-all duration-300 ease-out group
                        ${isDragOver
                            ? 'border-violet-400 bg-violet-500/10 scale-[1.01]'
                            : 'border-white/[0.08] bg-white/[0.02] hover:border-violet-400/40 hover:bg-white/[0.04]'
                        }
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={onFileChange}
                        className="hidden"
                        id="csv-file-input"
                    />

                    {isTraining ? (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-12 h-12 text-violet-400 animate-spin" />
                            <p className="text-lg font-semibold text-white">Training model...</p>
                            <p className="text-xs text-white/30 font-mono">{file?.name}</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                <Upload className="w-8 h-8 text-violet-400" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">Upload weekly transaction CSV</p>
                                <p className="text-xs text-white/30 mt-1">
                                    {file ? (
                                        <span className="text-emerald-400 font-mono">Last: {file.name}</span>
                                    ) : (
                                        'Drag & drop or click to select • .csv files only'
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div id="error-banner" className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300">{error}</p>
                    </div>
                )}

                {/* Success Banner */}
                {updateResult && (
                    <div id="success-banner" className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <p className="text-sm text-emerald-300">
                            Global model updated successfully. Round AUC: <span className="font-mono font-bold">{updateResult.round_auc ?? 'N/A'}</span>
                        </p>
                    </div>
                )}

                {/* Section 2 — Training Results */}
                {trainingResult && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left — Training Results */}
                        <div id="training-results-panel" className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                                <FileText className="w-4 h-4 text-cyan-400" />
                                <h3 className="text-sm font-semibold text-white">Training Results</h3>
                            </div>
                            <div className="p-4">
                                <pre
                                    className="w-full text-xs font-mono text-white/70 bg-white/[0.02] rounded-xl p-4 overflow-auto whitespace-pre-wrap"
                                    style={{ maxHeight: '400px' }}
                                >{`AUC Score: ${trainingResult.auc}\nSamples trained on: ${trainingResult.n_samples}\n\nClassification Report:\n${trainingResult.classification_report}`}</pre>
                            </div>
                        </div>

                        {/* Right — Model Delta */}
                        <div id="model-delta-panel" className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                            <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
                                <Braces className="w-4 h-4 text-violet-400" />
                                <h3 className="text-sm font-semibold text-white">Model Delta (Coefficients)</h3>
                            </div>
                            <div className="p-4">
                                <pre
                                    className="w-full text-xs font-mono text-white/70 bg-white/[0.02] rounded-xl p-4 overflow-auto whitespace-pre-wrap"
                                    style={{ maxHeight: '400px' }}
                                >{JSON.stringify(trainingResult.delta, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 3 — Update Global Model */}
                <div className="flex justify-center">
                    <button
                        id="update-global-btn"
                        onClick={handleUpdateGlobal}
                        disabled={!trainingResult || isUpdating}
                        className={`
                            mag-btn relative flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-sm
                            transition-all duration-300
                            ${trainingResult && !isUpdating
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 cursor-pointer'
                                : 'bg-white/[0.04] text-white/20 border border-white/[0.06] cursor-not-allowed'
                            }
                        `}
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Globe className="w-5 h-5" />
                                Update Global Model
                            </>
                        )}
                    </button>
                </div>



                {/* Section 5 — Parameter Evaluation */}
                {trainingResult && globalWeightsAfter && (() => {
                    const diff   = computeParamDiff(
                        trainingResult.delta.coef,
                        trainingResult.delta.feature_names,
                        globalWeightsAfter.coef,
                        globalWeightsAfter.feature_names
                    );
                    const totalPages  = Math.ceil(diff.length / PARAMS_PER_PAGE);
                    const visibleDiff = diff.slice(
                        paramPage * PARAMS_PER_PAGE,
                        (paramPage + 1) * PARAMS_PER_PAGE
                    );

                    return (
                        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden mt-8 p-6">
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 className="text-sm font-semibold text-white">Parameter evaluation — local vs global</h3>
                                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                                    {diff.length} features · sorted by largest change
                                </span>
                            </div>

                            {/* Summary pills */}
                            <div style={{ display: "flex", gap: 12, margin: "16px 0" }}>
                                {[
                                    {
                                        label: "Increased",
                                        count: diff.filter(d => d.direction === "up").length,
                                        color: "#22c55e"
                                    },
                                    {
                                        label: "Decreased",
                                        count: diff.filter(d => d.direction === "down").length,
                                        color: "#ef4444"
                                    },
                                    {
                                        label: "Unchanged",
                                        count: diff.filter(d => d.direction === "unchanged").length,
                                        color: "rgba(255,255,255,0.4)"
                                    }
                                ].map(({ label, count, color }) => (
                                    <div key={label} style={{
                                        padding: "4px 12px",
                                        borderRadius: 999,
                                        border: `1px solid ${color}`,
                                        color,
                                        fontSize: 12,
                                        fontWeight: 500
                                    }}>
                                        {count} {label}
                                    </div>
                                ))}
                            </div>

                            {/* Table */}
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }} className="text-white/70">
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <th style={{ textAlign: "left",  padding: "8px 0", fontWeight: 500 }} className="text-white/40 uppercase text-xs">Feature</th>
                                        <th style={{ textAlign: "right", padding: "8px 0", fontWeight: 500 }} className="text-white/40 uppercase text-xs">Local weight</th>
                                        <th style={{ textAlign: "right", padding: "8px 0", fontWeight: 500 }} className="text-white/40 uppercase text-xs">Global weight</th>
                                        <th style={{ textAlign: "right", padding: "8px 0", fontWeight: 500 }} className="text-white/40 uppercase text-xs">Change</th>
                                        <th style={{ textAlign: "left",  padding: "8px 12px", fontWeight: 500 }} className="text-white/40 uppercase text-xs">Magnitude</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleDiff.map((row, i) => (
                                        <tr
                                            key={row.feature}
                                            style={{
                                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)"
                                            }}
                                            className="hover:bg-white/[0.04] transition-colors"
                                        >
                                            {/* Feature name */}
                                            <td style={{ padding: "10px 0", fontFamily: "monospace", fontSize: 12 }} className="text-white">
                                                {row.feature}
                                            </td>

                                            {/* Local weight */}
                                            <td style={{ textAlign: "right", padding: "10px 0", fontFamily: "monospace" }}>
                                                {row.localWeight?.toFixed(6)}
                                            </td>

                                            {/* Global weight */}
                                            <td style={{ textAlign: "right", padding: "10px 0", fontFamily: "monospace" }}>
                                                {row.globalWeight !== null ? row.globalWeight.toFixed(6) : "—"}
                                            </td>

                                            {/* % change */}
                                            <td style={{
                                                textAlign: "right",
                                                padding: "10px 0",
                                                fontWeight: 500,
                                                color: row.direction === "up"        ? "#22c55e"
                                                     : row.direction === "down"       ? "#ef4444"
                                                     : "rgba(255,255,255,0.4)"
                                            }}>
                                                {row.absPctChange !== null
                                                    ? `${row.direction === "up" ? "+" : row.direction === "down" ? "−" : ""}${row.absPctChange.toFixed(2)}%`
                                                    : "—"}
                                            </td>

                                            {/* Bar */}
                                            <td style={{ padding: "10px 12px", minWidth: 120 }}>
                                                {row.absPctChange !== null && (
                                                    <div style={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background: "rgba(255,255,255,0.06)",
                                                        overflow: "hidden"
                                                    }}>
                                                        <div style={{
                                                            height: "100%",
                                                            width: `${Math.min(row.absPctChange, 100)}%`,
                                                            borderRadius: 3,
                                                            background: row.direction === "up"   ? "#22c55e"
                                                                      : row.direction === "down" ? "#ef4444"
                                                                      : "#888"
                                                        }}/>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16 }}>
                                    <button
                                        onClick={() => setParamPage(p => Math.max(0, p - 1))}
                                        disabled={paramPage === 0}
                                        className={`px-3 py-1 rounded text-xs font-medium ${paramPage === 0 ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white hover:bg-white/20'} transition-colors`}
                                    >
                                        Previous
                                    </button>
                                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", alignSelf: "center" }}>
                                        Page {paramPage + 1} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setParamPage(p => Math.min(totalPages - 1, p + 1))}
                                        disabled={paramPage === totalPages - 1}
                                        className={`px-3 py-1 rounded text-xs font-medium ${paramPage === totalPages - 1 ? 'bg-white/5 text-white/20' : 'bg-white/10 text-white hover:bg-white/20'} transition-colors`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}

                        </div>
                    );
                })()}
            </div>
        </AppLayout>
    );
}
