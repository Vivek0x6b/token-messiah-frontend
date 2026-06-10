import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";

const API_URL = "https://token-messiah-backend.onrender.com";

const fmt = (n) => n?.toLocaleString() ?? "0";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --acid: #c8f135;
    --acid-dim: #8aab1f;
    --bg: #070708;
    --bg1: #0c0c0e;
    --bg2: #111114;
    --bg3: #18181c;
    --border: #1f1f24;
    --border2: #2a2a30;
    --text: #e2e2e8;
    --text2: #7a7a88;
    --text3: #3a3a44;
    --red: #ff4d4d;
    --yellow: #f5c542;
    --font: 'Outfit', sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --r: 10px;
    --r2: 14px;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font); -webkit-font-smoothing: antialiased; }

  ::selection { background: var(--acid); color: #000; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse {
    0%,100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(200,241,53,0); }
    50% { box-shadow: 0 0 20px 4px rgba(200,241,53,0.08); }
  }
  @keyframes scan {
    0% { top: -2px; }
    100% { top: 100%; }
  }

  .fadeUp { animation: fadeUp 0.4s ease both; }

  /* ── Header ── */
  .hdr {
    position: sticky; top: 0; z-index: 100;
    height: 56px;
    border-bottom: 1px solid var(--border);
    background: rgba(7,7,8,0.85);
    backdrop-filter: blur(16px);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 32px;
  }
  .logo {
    display: flex; align-items: center; gap: 10px;
    font-size: 17px; font-weight: 700; letter-spacing: -0.03em;
  }
  .logo-icon {
    width: 28px; height: 28px; border-radius: 7px;
    background: var(--acid);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
  }
  .logo span { color: var(--acid); }
  .hdr-tag {
    font-family: var(--mono); font-size: 10px; color: var(--text3);
    letter-spacing: 0.1em; text-transform: uppercase;
  }

  /* ── Main ── */
  .main { max-width: 860px; margin: 0 auto; padding: 56px 24px 100px; }

  /* ── Hero ── */
  .hero { margin-bottom: 52px; }
  .badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(200,241,53,0.06);
    border: 1px solid rgba(200,241,53,0.15);
    border-radius: 100px; padding: 5px 14px; margin-bottom: 28px;
  }
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--acid); animation: pulse 2s infinite; }
  .badge-text { font-family: var(--mono); font-size: 10px; color: var(--acid-dim); letter-spacing: 0.1em; text-transform: uppercase; }
  .hero h1 {
    font-size: clamp(2.2rem, 5.5vw, 3.8rem);
    font-weight: 800; letter-spacing: -0.04em; line-height: 1.0;
    margin-bottom: 20px;
  }
  .hero h1 .dim { color: var(--text3); font-weight: 300; }
  .hero h1 .acc { color: var(--acid); }
  .hero p { color: var(--text2); font-size: 15px; line-height: 1.7; max-width: 440px; }
  .benchmarks {
    display: flex; gap: 28px; margin-top: 32px; flex-wrap: wrap;
  }
  .bench { display: flex; flex-direction: column; gap: 3px; }
  .bench-val { font-family: var(--mono); font-size: 20px; font-weight: 600; color: var(--acid); }
  .bench-lbl { font-family: var(--mono); font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.1em; }
  .bench-sep { width: 1px; background: var(--border); align-self: stretch; }

  /* ── Drop zone ── */
  .dropzone {
    position: relative; overflow: hidden;
    border: 1px solid var(--border);
    border-radius: var(--r2);
    padding: 60px 32px;
    text-align: center;
    cursor: pointer;
    background: var(--bg1);
    transition: border-color 0.2s, background 0.2s;
    margin-bottom: 14px;
  }
  .dropzone:hover { border-color: var(--border2); background: var(--bg2); }
  .dropzone.drag { border-color: var(--acid); background: rgba(200,241,53,0.03); animation: glow 1.5s infinite; }
  .dropzone.has-file { border-color: #2a3a00; background: rgba(200,241,53,0.02); }

  .dz-corner {
    position: absolute; width: 14px; height: 14px;
    border-color: var(--border2); border-style: solid;
  }
  .dz-corner.tl { top: 10px; left: 10px; border-width: 1px 0 0 1px; }
  .dz-corner.tr { top: 10px; right: 10px; border-width: 1px 1px 0 0; }
  .dz-corner.bl { bottom: 10px; left: 10px; border-width: 0 0 1px 1px; }
  .dz-corner.br { bottom: 10px; right: 10px; border-width: 0 1px 1px 0; }

  .dz-icon {
    width: 52px; height: 52px; border-radius: 12px;
    background: var(--bg3); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px; font-size: 22px;
    transition: border-color 0.2s;
  }
  .dropzone.has-file .dz-icon { border-color: #3a5500; background: #0d1500; }

  .dz-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 5px; }
  .dz-sub { font-family: var(--mono); font-size: 11px; color: var(--text3); letter-spacing: 0.06em; }
  .dz-file-size { font-family: var(--mono); font-size: 11px; color: #3a5500; margin-top: 4px; }

  /* ── Scanline on dropzone ── */
  .dz-scan {
    position: absolute; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(200,241,53,0.3), transparent);
    animation: scan 3s linear infinite;
    pointer-events: none;
  }

  /* ── Error ── */
  .error-box {
    background: #1a0000; border: 1px solid #3a0000;
    border-radius: var(--r); padding: 12px 16px;
    color: var(--red); font-family: var(--mono); font-size: 12px;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
  }

  /* ── Convert button ── */
  .cvt-btn {
    width: 100%; padding: 17px;
    background: var(--acid); color: #050505;
    border: none; border-radius: var(--r2);
    font-family: var(--font); font-size: 14px; font-weight: 700;
    letter-spacing: 0.06em; text-transform: uppercase;
    cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .cvt-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(200,241,53,0.2); }
  .cvt-btn:disabled { background: var(--bg3); color: var(--text3); cursor: not-allowed; border: 1px solid var(--border); }

  .spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(200,241,53,0.2);
    border-top-color: var(--acid);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* ── Stats ── */
  .stats-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 8px; margin-bottom: 20px;
  }
  .stat {
    background: var(--bg1); border: 1px solid var(--border);
    border-radius: var(--r); padding: 14px 16px;
    transition: border-color 0.2s;
  }
  .stat:hover { border-color: var(--border2); }
  .stat.hi { background: #0a0f00; border-color: #1e2e00; }
  .stat.hi:hover { border-color: var(--acid); }
  .stat-lbl { font-family: var(--mono); font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 7px; }
  .stat-val { font-family: var(--mono); font-size: 18px; font-weight: 600; color: var(--text); }
  .stat.hi .stat-lbl { color: #4a6a00; }
  .stat.hi .stat-val { color: var(--acid); }

  /* ── Toolbar ── */
  .toolbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 10px; flex-wrap: wrap; gap: 10px;
  }
  .tabs {
    display: flex; gap: 2px;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 8px; padding: 3px;
  }
  .tab {
    padding: 6px 16px; border: none; border-radius: 6px;
    font-family: var(--font); font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em;
    background: transparent; color: var(--text3);
  }
  .tab.on { background: var(--bg3); color: var(--text); border: 1px solid var(--border); }
  .actions { display: flex; gap: 6px; }
  .btn {
    padding: 8px 16px; border-radius: 8px;
    font-family: var(--font); font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.15s; letter-spacing: 0.02em;
  }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text3); }
  .btn-ghost:hover { border-color: var(--border2); color: var(--text2); }
  .btn-copy { background: transparent; border: 1px solid var(--border); color: var(--text3); }
  .btn-copy.ok { background: #0a0f00; border-color: #2a3a00; color: var(--acid); }
  .btn-dl { background: var(--acid); border: none; color: #050505; }
  .btn-dl:hover { opacity: 0.88; }

  /* ── Output pane ── */
  .output-pane {
    background: var(--bg1); border: 1px solid var(--border);
    border-radius: var(--r2); padding: 28px 32px;
    max-height: 600px; overflow-y: auto;
    font-size: 14px; line-height: 1.8;
    position: relative;
  }
  .output-pane pre {
    font-family: var(--mono); font-size: 12px;
    white-space: pre-wrap; word-break: break-word;
    color: var(--text3); line-height: 1.9;
  }

  /* ── MD styles inside pane ── */
  .md-body h1 { font-size: 1.35em; font-weight: 700; color: var(--text); margin: 20px 0 8px; letter-spacing: -0.02em; }
  .md-body h2 { font-family: var(--mono); font-size: 11px; font-weight: 500; color: var(--acid-dim); text-transform: uppercase; letter-spacing: 0.1em; margin: 18px 0 6px; }
  .md-body h3 { font-size: 1em; font-weight: 600; color: var(--text2); margin: 12px 0 4px; }
  .md-body p { color: var(--text2); margin: 4px 0; }
  .md-body hr { border: none; border-top: 1px solid var(--border); margin: 18px 0; }
  .md-body table { width: 100%; border-collapse: collapse; font-family: var(--mono); font-size: 12px; }
  .md-body th { color: var(--text3); text-align: left; padding: 6px 12px; border-bottom: 1px solid var(--border); }
  .md-body td { color: var(--text2); padding: 5px 12px; border-bottom: 1px solid var(--border); }
  .md-body ul, .md-body ol { padding-left: 20px; color: var(--text2); }
  .md-body li { margin: 3px 0; }
  .md-body code { font-family: var(--mono); font-size: 12px; background: var(--bg3); padding: 2px 6px; border-radius: 4px; color: var(--acid); }

  /* ── PDF guide ── */
  .guide { margin-top: 48px; }
  .guide-label { font-family: var(--mono); font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.12em; text-align: center; margin-bottom: 16px; }
  .guide-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
  .guide-card { border-radius: var(--r2); padding: 18px 20px; }
  .guide-card.g { background: #080e00; border: 1px solid #1a2a00; }
  .guide-card.y { background: #0e0a00; border: 1px solid #2a1e00; }
  .guide-card.r { background: #0e0404; border: 1px solid #2a0a0a; }
  .guide-head { font-family: var(--mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: flex; align-items: center; gap: 7px; }
  .guide-card.g .guide-head { color: var(--acid); }
  .guide-card.y .guide-head { color: var(--yellow); }
  .guide-card.r .guide-head { color: var(--red); }
  .guide-items { list-style: none; }
  .guide-items li { font-family: var(--mono); font-size: 11px; color: var(--text3); padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; align-items: center; gap: 8px; }
  .guide-items li::before { content: '›'; color: var(--border2); font-size: 13px; }
  .guide-foot { font-family: var(--mono); font-size: 10px; color: var(--text3); text-align: center; margin-top: 18px; letter-spacing: 0.05em; }
`;

export default function App() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [stats, setStats]       = useState(null);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);
  const [tab, setTab]           = useState("preview");
  const inputRef                = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.match(/\.pdf$/i)) { setError("Please upload a valid .pdf file."); return; }
    if (f.size > 50 * 1024 * 1024) { setError("File too large. Max 50MB."); return; }
    setFile(f); setError(""); setMarkdown(""); setStats(null);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const onDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  }, []);

  const convert = async () => {
    if (!file) return;
    setLoading(true); setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API_URL}/convert`, { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Server error." }));
        throw new Error(err.detail || "Conversion failed.");
      }
      const data = await res.json();
      setMarkdown(data.markdown); setStats(data.stats); setTab("preview");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = (file?.name?.replace(/\.pdf$/i, "") || "output") + ".md";
    a.click(); URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(markdown); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { setError("Clipboard blocked. Copy manually from Raw tab."); }
  };

  const reset = () => {
    setFile(null); setMarkdown(""); setStats(null); setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const dzClass = `dropzone${dragging ? " drag" : ""}${file && !dragging ? " has-file" : ""}`;

  return (
    <>
      <style>{css}</style>

      <header className="hdr">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          Token<span>Messiah</span>
        </div>
        <div className="hdr-tag">PDF → Markdown · Token Optimizer</div>
      </header>

      <main className="main">

        {/* Hero */}
        {!markdown && (
          <div className="hero fadeUp">
            <div className="badge">
              <span className="badge-dot" />
              <span className="badge-text">Save up to 8× tokens per document</span>
            </div>
            <h1>
              Strip the PDF.<br />
              <span className="acc">Feed Claude less.</span><br />
              <span className="dim">Get more done.</span>
            </h1>
            <p>Convert text-heavy PDFs to clean Markdown. Cut image overhead, eliminate token waste, and give your LLM exactly what it needs — nothing more.</p>
            <div className="benchmarks">
              <div className="bench">
                <span className="bench-val">~1,700</span>
                <span className="bench-lbl">tokens / page (PDF)</span>
              </div>
              <div className="bench-sep" />
              <div className="bench">
                <span className="bench-val">~300</span>
                <span className="bench-lbl">tokens / page (MD)</span>
              </div>
              <div className="bench-sep" />
              <div className="bench">
                <span className="bench-val">8×</span>
                <span className="bench-lbl">avg savings</span>
              </div>
            </div>
          </div>
        )}

        {/* Drop zone */}
        {!markdown && (
          <div
            className={dzClass}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
          >
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])} />

            <div className="dz-corner tl" />
            <div className="dz-corner tr" />
            <div className="dz-corner bl" />
            <div className="dz-corner br" />
            {dragging && <div className="dz-scan" />}

            <div className="dz-icon">{file ? "📄" : "📂"}</div>

            {file ? (
              <>
                <div className="dz-title">{file.name}</div>
                <div className="dz-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</div>
              </>
            ) : (
              <>
                <div className="dz-title">Drop your PDF here</div>
                <div className="dz-sub">or click to browse · max 50mb</div>
              </>
            )}
          </div>
        )}

        {/* Error */}
        {error && <div className="error-box">⚠ {error}</div>}

        {/* Convert button */}
        {file && !markdown && (
          <button className="cvt-btn" onClick={convert} disabled={loading}>
            {loading ? <><div className="spinner" /> Extracting text from PDF…</> : "⚡ Convert to Markdown"}
          </button>
        )}

        {/* Stats */}
        {stats && (
          <div className="stats-grid fadeUp">
            {[
              { l: "Pages",      v: fmt(stats.pages) },
              { l: "Words",      v: fmt(stats.words) },
              { l: "MD tokens",  v: fmt(stats.tokens_markdown) },
              { l: "PDF tokens", v: fmt(stats.tokens_pdf) },
              { l: "Saved",      v: `~${fmt(stats.tokens_saved)}`, hi: true },
              { l: "Reduction",  v: `${stats.savings_percent}%`,   hi: true },
            ].map(({ l, v, hi }) => (
              <div key={l} className={`stat${hi ? " hi" : ""}`}>
                <div className="stat-lbl">{l}</div>
                <div className="stat-val">{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Output */}
        {markdown && (
          <div className="fadeUp">
            <div className="toolbar">
              <div className="tabs">
                {["preview", "raw"].map(t => (
                  <button key={t} className={`tab${tab === t ? " on" : ""}`} onClick={() => setTab(t)}>
                    {t === "preview" ? "Preview" : "Raw .md"}
                  </button>
                ))}
              </div>
              <div className="actions">
                <button className="btn btn-ghost" onClick={reset}>← New file</button>
                <button className={`btn btn-copy${copied ? " ok" : ""}`} onClick={copy}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
                <button className="btn btn-dl" onClick={download}>↓ Download .md</button>
              </div>
            </div>

            <div className="output-pane">
              {tab === "raw"
                ? <pre>{markdown}</pre>
                : <div className="md-body"><ReactMarkdown>{markdown}</ReactMarkdown></div>
              }
            </div>
          </div>
        )}

        {/* PDF guide */}
        {!markdown && (
          <div className="guide fadeUp">
            <div className="guide-label">What works best</div>
            <div className="guide-grid">
              {[
                { cls: "g", icon: "✓", label: "Best results",    items: ["Academic papers", "Research reports", "Technical docs", "Books & articles", "Legal documents"] },
                { cls: "y", icon: "~", label: "Partial results", items: ["2-column layouts", "Newsletters", "Presentations", "Form-heavy PDFs", "Dense tables"] },
                { cls: "r", icon: "✕", label: "Poor results",    items: ["Scanned / image PDFs", "Brochures & flyers", "Handwritten docs", "Password protected", "Image-only PDFs"] },
              ].map(({ cls, icon, label, items }) => (
                <div key={label} className={`guide-card ${cls}`}>
                  <div className="guide-head"><span>{icon}</span>{label}</div>
                  <ul className="guide-items">
                    {items.map(item => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="guide-foot">Scanned PDFs require OCR — not yet supported · Max 50MB per file</div>
          </div>
        )}

      </main>
    </>
  );
}
