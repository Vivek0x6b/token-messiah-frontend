import { useState, useRef, useCallback } from "react";

const API_URL = "https://token-messiah-backend.onrender.com";

const fmt = (n) => n?.toLocaleString() ?? "0";

const css = `
  @keyframes scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes pulse-border {
    0%, 100% { box-shadow: 0 0 0 0 rgba(200, 241, 53, 0); }
    50% { box-shadow: 0 0 0 4px rgba(200, 241, 53, 0.15); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  .stat-card {
    background: #0f0f0f;
    border: 1px solid #1e1e1e;
    border-radius: 10px;
    padding: 16px 20px;
    flex: 1;
    min-width: 120px;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: #333; }
  .stat-card.accent {
    border-color: #2a3a00;
    background: #0d1200;
  }
  .stat-card.accent:hover { border-color: #c8f135; }
  .tab-btn {
    padding: 7px 18px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s;
    letter-spacing: 0.02em;
  }
  .action-btn {
    padding: 9px 18px;
    border-radius: 8px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 0.02em;
  }
  .action-btn:hover { opacity: 0.85; }
  .convert-btn {
    width: 100%;
    padding: 18px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Space Grotesk', sans-serif;
    cursor: pointer;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .convert-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(200, 241, 53, 0.25);
  }
  .convert-btn:disabled { cursor: not-allowed; }
  .dropzone {
    border: 1px solid #1e1e1e;
    border-radius: 16px;
    padding: 64px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 16px;
    position: relative;
    overflow: hidden;
  }
  .dropzone:hover { border-color: #333; background: #0d0d0d; }
  .output-pane {
    background: #0a0a0a;
    border: 1px solid #1e1e1e;
    border-radius: 14px;
    padding: 28px 32px;
    max-height: 580px;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.75;
    animation: fadeUp 0.3s ease;
  }
`;

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card${accent ? " accent" : ""}`}>
      <div style={{ fontSize: "10px", color: accent ? "#6a8a00" : "#444", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px", fontFamily: "'Space Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: "700", color: accent ? "#c8f135" : "#e8e8e2", fontFamily: "'Space Mono', monospace" }}>{value}</div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block",
      width: "14px", height: "14px",
      border: "2px solid #333",
      borderTop: "2px solid #c8f135",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      marginRight: "10px",
      verticalAlign: "middle",
    }} />
  );
}

function renderMarkdown(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("# "))
      return <h1 key={i} style={{ fontSize: "1.4em", margin: "20px 0 10px", color: "#e8e8e2", fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>{line.slice(2)}</h1>;
    if (line.startsWith("## "))
      return <h2 key={i} style={{ fontSize: "1.1em", margin: "16px 0 8px", color: "#c8f135", fontFamily: "'Space Mono', monospace", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{line.slice(3)}</h2>;
    if (line.startsWith("### "))
      return <h3 key={i} style={{ fontSize: "1em", margin: "12px 0 6px", color: "#aaa" }}>{line.slice(4)}</h3>;
    if (line === "---")
      return <hr key={i} style={{ border: "none", borderTop: "1px solid #1e1e1e", margin: "20px 0" }} />;
    if (line.startsWith("|"))
      return <div key={i} style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", whiteSpace: "pre", color: "#888", overflowX: "auto", lineHeight: "1.8" }}>{line}</div>;
    if (line.trim() === "")
      return <div key={i} style={{ height: "6px" }} />;
    return <p key={i} style={{ margin: "3px 0", color: "#aaa", lineHeight: "1.75" }}>{line}</p>;
  });
}

export default function App() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("preview");
  const inputRef = useRef(null);

  // Fix: handle file validates PDF type case-insensitively
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.match(/\.pdf$/i)) {
      setError("Please upload a valid .pdf file.");
      return;
    }
    setFile(f);
    setError("");
    setMarkdown("");
    setStats(null);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // Fix: onDragLeave fires on child elements — check relatedTarget
  const onDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragging(false);
    }
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${API_URL}/convert`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error." }));
        throw new Error(err.detail || "Conversion failed.");
      }
      const data = await res.json();
      setMarkdown(data.markdown);
      setStats(data.stats);
      setTab("preview");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Fix: use regex to handle .PDF, .Pdf, etc.
    a.download = (file?.name?.replace(/\.pdf$/i, "") || "output") + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fix: clipboard.writeText can throw on HTTP — wrap in try/catch
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access denied. Copy manually from the Raw tab.");
    }
  };

  // Fix: reset file input value so re-uploading same file triggers onChange
  const reset = () => {
    setFile(null);
    setMarkdown("");
    setStats(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const openFilePicker = () => {
    if (inputRef.current) inputRef.current.click();
  };

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: "#080808" }}>

        {/* Scanline overlay */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          pointerEvents: "none", zIndex: 100,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }} />

        {/* Header */}
        <header style={{
          borderBottom: "1px solid #111",
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "58px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(8,8,8,0.95)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "6px",
              background: "#c8f135", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "15px", lineHeight: 1 }}>⚡</span>
            </div>
            <span style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: "800",
              fontSize: "17px",
              letterSpacing: "-0.03em",
              color: "#e8e8e2",
            }}>
              Token<span style={{ color: "#c8f135" }}>Messiah</span>
            </span>
          </div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            color: "#333",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            PDF → Markdown / Token Optimizer
          </div>
        </header>

        <main style={{ maxWidth: "820px", margin: "0 auto", padding: "56px 24px 80px" }}>

          {/* Hero */}
          {!markdown && (
            <div style={{ marginBottom: "56px", animation: "fadeUp 0.5s ease" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#0d1200", border: "1px solid #2a3a00",
                borderRadius: "100px", padding: "6px 14px", marginBottom: "28px",
              }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c8f135", display: "inline-block" }} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "#6a8a00", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Save up to 8× tokens
                </span>
              </div>

              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(2.4rem, 6vw, 4rem)",
                fontWeight: "800",
                letterSpacing: "-0.04em",
                lineHeight: "1.0",
                marginBottom: "20px",
                color: "#e8e8e2",
              }}>
                Strip your PDF.<br />
                <span style={{ color: "#c8f135" }}>Feed Claude less.</span><br />
                <span style={{ color: "#333" }}>Get more done.</span>
              </h1>

              <p style={{ color: "#555", fontSize: "15px", maxWidth: "460px", lineHeight: "1.7", fontWeight: "400" }}>
                Convert text-heavy PDFs to clean Markdown. Drop the image overhead, cut token waste, and feed your LLM exactly what it needs.
              </p>

              {/* Quick stats row */}
              <div style={{ display: "flex", gap: "24px", marginTop: "32px", flexWrap: "wrap" }}>
                {[["~1,700", "tokens/page (PDF)"], ["~300", "tokens/page (MD)"], ["8×", "avg savings"]].map(([val, lbl]) => (
                  <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "18px", fontWeight: "700", color: "#c8f135" }}>{val}</span>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop zone */}
          {!markdown && (
            <div
              className="dropzone"
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={openFilePicker}
              style={{
                background: dragging ? "#0d1200" : file ? "#0a0f00" : "#0a0a0a",
                borderColor: dragging ? "#c8f135" : file ? "#3a5500" : "#1a1a1a",
                animation: dragging ? "pulse-border 1s infinite" : "none",
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
              />

              {/* Corner accents */}
              {["top:0;left:0;border-top:2px solid;border-left:2px solid", "top:0;right:0;border-top:2px solid;border-right:2px solid", "bottom:0;left:0;border-bottom:2px solid;border-left:2px solid", "bottom:0;right:0;border-bottom:2px solid;border-right:2px solid"].map((s, i) => (
                <div key={i} style={{
                  position: "absolute", width: "16px", height: "16px",
                  borderColor: file ? "#3a5500" : "#222",
                  ...(Object.fromEntries(s.split(";").map(p => {
                    const [k, v] = p.split(":");
                    return [k.trim().replace(/-([a-z])/g, (_, l) => l.toUpperCase()), v?.trim()];
                  }).filter(([k, v]) => v !== undefined)))
                }} />
              ))}

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "12px",
                  background: file ? "#1a2a00" : "#111",
                  border: `1px solid ${file ? "#3a5500" : "#1e1e1e"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "22px",
                }}>
                  {file ? "📄" : "📂"}
                </div>

                {file ? (
                  <>
                    <div style={{ fontWeight: "600", fontSize: "15px", color: "#e8e8e2", marginBottom: "6px" }}>{file.name}</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "#3a5500" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontWeight: "600", fontSize: "15px", color: "#555", marginBottom: "6px" }}>Drop your PDF here</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "#333", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      or click to browse · max 50mb
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: "#1a0000", border: "1px solid #3a0000",
              borderRadius: "10px", padding: "14px 18px",
              color: "#ff6b6b", fontSize: "13px", marginBottom: "16px",
              fontFamily: "'Space Mono', monospace",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Convert button */}
          {file && !markdown && (
            <button
              className="convert-btn"
              onClick={convert}
              disabled={loading}
              style={{
                background: loading ? "#111" : "#c8f135",
                color: loading ? "#555" : "#080808",
                border: loading ? "1px solid #222" : "none",
              }}
            >
              {loading ? (
                <><Spinner />Extracting text from PDF…</>
              ) : (
                "⚡ Convert to Markdown"
              )}
            </button>
          )}

          {/* Stats */}
          {stats && (
            <div style={{ marginBottom: "24px", animation: "fadeUp 0.4s ease" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <StatCard label="Pages" value={fmt(stats.pages)} />
                <StatCard label="Words" value={fmt(stats.words)} />
                <StatCard label="MD tokens" value={fmt(stats.tokens_markdown)} />
                <StatCard label="PDF tokens" value={fmt(stats.tokens_pdf)} />
                <StatCard label="Saved" value={`~${fmt(stats.tokens_saved)}`} accent />
                <StatCard label="Reduction" value={`${stats.savings_percent}%`} accent />
              </div>
            </div>
          )}

          {/* Output */}
          {markdown && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              {/* Toolbar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "12px", flexWrap: "wrap", gap: "10px",
              }}>
                <div style={{
                  display: "flex", gap: "3px",
                  background: "#0f0f0f", border: "1px solid #1a1a1a",
                  borderRadius: "8px", padding: "4px",
                }}>
                  {["preview", "raw"].map(t => (
                    <button key={t} className="tab-btn" onClick={() => setTab(t)} style={{
                      background: tab === t ? "#1a1a1a" : "transparent",
                      color: tab === t ? "#e8e8e2" : "#444",
                      border: tab === t ? "1px solid #2a2a2a" : "1px solid transparent",
                    }}>
                      {t === "preview" ? "Preview" : "Raw .md"}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="action-btn" onClick={reset} style={{
                    background: "transparent", border: "1px solid #1e1e1e", color: "#555",
                  }}>← New file</button>

                  <button className="action-btn" onClick={copy} style={{
                    background: copied ? "#0d1200" : "transparent",
                    border: `1px solid ${copied ? "#3a5500" : "#1e1e1e"}`,
                    color: copied ? "#c8f135" : "#555",
                  }}>
                    {copied ? "✓ Copied" : "Copy"}
                  </button>

                  <button className="action-btn" onClick={download} style={{
                    background: "#c8f135", color: "#080808", border: "none",
                  }}>
                    ↓ Download .md
                  </button>
                </div>
              </div>

              {/* Content pane */}
              <div className="output-pane">
                {tab === "raw" ? (
                  <pre style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "12px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "#555",
                    margin: 0,
                    lineHeight: "1.8",
                  }}>
                    {markdown}
                  </pre>
                ) : (
                  <div>{renderMarkdown(markdown)}</div>
                )}
              </div>
            </div>
          )}

          {/* Footer note */}
          {!markdown && (
            <p style={{
              textAlign: "center",
              fontFamily: "'Space Mono', monospace",
              color: "#222",
              fontSize: "11px",
              marginTop: "32px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              Best for text-heavy PDFs — papers, reports, docs · Scanned PDFs require OCR
            </p>
          )}
        </main>
      </div>
    </>
  );
}
