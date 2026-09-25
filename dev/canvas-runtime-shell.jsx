import React, { useEffect, useRef, useState } from "react";

const BASELINE_SOURCE_URL =
  "https://raw.githubusercontent.com/beyonderbliss/antithesis/phase-0.5/canvas-antithesis-loader/antithesis_project1.jsx";

const MAIN_SOURCE_BASE_URL =
  "https://raw.githubusercontent.com/beyonderbliss/antithesis/";

const GITHUB_COMMITS_URL =
  "https://api.github.com/repos/beyonderbliss/antithesis/commits?per_page=1";

const STORAGE_KEY = "antithesis.canvas-runtime.phase06";

const GITHUB_COMMIT_BASE_URL =
  "https://api.github.com/repos/beyonderbliss/antithesis/commits/";

const BABEL_URL =
  "https://unpkg.com/@babel/standalone@7.28.4/babel.min.js";

const LUCIDE_URL =
  "https://unpkg.com/lucide-react@0.472.0/dist/umd/lucide-react.min.js?v=phase06-" + Date.now();

function loadScript(src, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) {
      resolve(window[globalName]);
      return;
    }

    const existing = document.querySelector('script[data-phase06-src="' + src + '"]');
    if (existing) {
      const check = () => {
        if (!globalName || window[globalName]) {
          resolve(globalName ? window[globalName] : true);
        } else {
          reject(new Error("Dependency loaded without global: " + globalName));
        }
      };
      existing.addEventListener("load", check, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load " + src)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.phase06Src = src;
    script.onload = () => {
      if (!globalName || window[globalName]) {
        resolve(globalName ? window[globalName] : true);
      } else {
        reject(new Error("Dependency loaded without global: " + globalName));
      }
    };
    script.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}

function extractAntithesisVersion(source) {
  const match = String(source || "").match(
    /(?:const|let|var)\s+ANTITHESIS_VERSION\s*=\s*["']([^"']+)["']/
  );
  return match?.[1] || null;
}

function prepareSource(source) {
  let code = source;

  code = code.replace(
    /import React,\s*\{([\s\S]*?)\}\s*from\s*["']react["'];?/g,
    (_, hooks) => "const {" + hooks + "} = React;"
  );

  code = code.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];?/g,
    (_, icons) => {
      const normalizedIcons = icons.replace(
        /\b([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)\b/g,
        "$1: $2"
      );
      return "const {" + normalizedIcons + "} = LucideReact;";
    }
  );

  code = code.replace(
    /import\s+[\s\S]*?from\s+["'][^"']+["'];?/g,
    ""
  );
  code = code.replace(
    /import\s+["'][^"']+["'];?/g,
    ""
  );

  code = code.replace(/export\s+default\s+/g, "");

  return code;
}

function readStoredRevision() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.sha || !parsed.sourceUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeRevision(revision) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(revision));
  } catch {
    // localStorage is only an optimization; runtime must continue without it.
  }
}

async function getLatestRevision() {
  const response = await fetch(
    GITHUB_COMMITS_URL + "&t=" + Date.now(),
    {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("GitHub revision check HTTP " + response.status);
  }

  const commits = await response.json();
  const latest = commits && commits[0];

  if (!latest || !latest.sha) {
    throw new Error("GitHub tidak mengembalikan revision terbaru.");
  }

  const latestSourceUrl =
    MAIN_SOURCE_BASE_URL +
    encodeURIComponent(latest.sha) +
    "/antithesis_project1.jsx";

  const sourceResponse = await fetch(
    latestSourceUrl + "?v=" + encodeURIComponent(latest.sha),
    { cache: "no-store" }
  );

  if (!sourceResponse.ok) {
    throw new Error("Antithesis latest source HTTP " + sourceResponse.status);
  }

  const latestSource = await sourceResponse.text();

  return {
    sha: latest.sha,
    shortSha: latest.sha.slice(0, 7),
    version: extractAntithesisVersion(latestSource),
    message: latest.commit?.message?.split("\n")[0] || "GitHub update",
    date: latest.commit?.committer?.date || latest.commit?.author?.date || null
  };
}

async function getRevisionDetails(sha) {
  if (!sha) {
    throw new Error("Revision update tidak tersedia.");
  }

  const response = await fetch(
    GITHUB_COMMIT_BASE_URL + encodeURIComponent(sha) + "?t=" + Date.now(),
    {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("GitHub update info HTTP " + response.status);
  }

  const commit = await response.json();

  return {
    sha: commit.sha || sha,
    shortSha: (commit.sha || sha).slice(0, 7),
    message: commit.commit?.message || "GitHub update",
    date: commit.commit?.committer?.date || commit.commit?.author?.date || null,
    files: Array.isArray(commit.files)
      ? commit.files.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions || 0,
          deletions: file.deletions || 0,
          changes: file.changes || 0
        }))
      : []
  };
}

async function compileAppFromSource(sourceUrl, revisionSha) {
  // lucide-react's UMD build expects React on the global object.
  // Canvas provides React to this entry as an ES module, so bridge only
  // during Lucide initialization and restore the previous global after.
  // This is the same verified React/Lucide bootstrap used by Phase 0.5.
  const previousGlobalReact = window.React;
  const previousGlobalReactLower = window.react;
  window.React = React;
  window.react = React;

  let sourceResponse;
  try {
    [sourceResponse] = await Promise.all([
      fetch(sourceUrl + "?v=" + encodeURIComponent(revisionSha || Date.now()), {
        cache: "no-store"
      }),
      loadScript(BABEL_URL, "Babel"),
      loadScript(LUCIDE_URL, "LucideReact")
    ]);
  } finally {
    if (previousGlobalReact === undefined) {
      try { delete window.React; } catch {}
    } else {
      window.React = previousGlobalReact;
    }

    if (previousGlobalReactLower === undefined) {
      try { delete window.react; } catch {}
    } else {
      window.react = previousGlobalReactLower;
    }
  }

  if (!sourceResponse.ok) {
    throw new Error("Antithesis source HTTP " + sourceResponse.status);
  }

  const source = await sourceResponse.text();
  const antithesisVersion = extractAntithesisVersion(source);
  const prepared = prepareSource(source);

  const transformed = Babel.transform(prepared, {
    presets: ["react"]
  }).code;

  const LoadedApp = new Function(
    "React",
    "LucideReact",
    transformed + "\nreturn typeof App !== 'undefined' ? App : null;"
  )(React, window.LucideReact);

  if (typeof LoadedApp !== "function") {
    throw new Error("Antithesis App component was not found after loading.");
  }

  LoadedApp.ANTITHESIS_VERSION = antithesisVersion;

  return LoadedApp;
}

function LoaderIcon({ children }) {
  return (
    <span style={{
      width: 34,
      height: 34,
      borderRadius: 10,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.09)",
      flexShrink: 0
    }}>
      {children}
    </span>
  );
}

function LoaderButton({ children, onClick, disabled, primary, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: "100%",
        minHeight: 44,
        borderRadius: 12,
        border: primary
          ? "1px solid rgba(244,63,94,0.55)"
          : "1px solid rgba(255,255,255,0.10)",
        background: primary
          ? "rgba(244,63,94,0.12)"
          : "rgba(255,255,255,0.045)",
        color: disabled ? "#666" : primary ? "#fda4af" : "#d4d4d8",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.04em",
        cursor: disabled ? "default" : "pointer",
        transition: "all 150ms ease"
      }}
    >
      {children}
    </button>
  );
}

function UpdateInfoOverlay({
  info,
  loading,
  error,
  onClose
}) {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000000,
      padding: 18,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 520,
        maxHeight: "calc(100vh - 36px)",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.11)",
        background: "#111116",
        boxShadow: "0 30px 100px rgba(0,0,0,0.6)",
        overflow: "hidden"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "15px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.07)"
        }}>
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.14em",
              color: "#e4e4e7"
            }}>
              UPDATE INFORMATION
            </div>
            <div style={{
              marginTop: 4,
              fontSize: 9,
              color: "#71717a",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
            }}>
              {info?.shortSha ? "REVISION " + info.shortSha : "GITHUB REVISION"}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Tutup update info"
            aria-label="Tutup update info"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.045)",
              color: "#d4d4d8",
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          overflowY: "auto",
          padding: 16,
          minHeight: 0,
          WebkitOverflowScrolling: "touch"
        }}>
          {loading && (
            <div style={{
              padding: 18,
              borderRadius: 13,
              background: "rgba(255,255,255,0.035)",
              color: "#a1a1aa",
              fontSize: 11,
              lineHeight: 1.6
            }}>
              Memuat informasi update dari GitHub…
            </div>
          )}

          {error && (
            <div style={{
              padding: 18,
              borderRadius: 13,
              background: "rgba(127,29,29,0.14)",
              border: "1px solid rgba(248,113,113,0.18)",
              color: "#fca5a5",
              fontSize: 11,
              lineHeight: 1.6
            }}>
              {error}
            </div>
          )}

          {info && !loading && !error && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{
                padding: 14,
                borderRadius: 14,
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <div style={{
                  fontSize: 9,
                  color: "#71717a",
                  fontWeight: 800,
                  letterSpacing: "0.12em"
                }}>
                  COMMIT
                </div>
                <div style={{
                  marginTop: 7,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "#e4e4e7",
                  fontWeight: 700
                }}>
                  {info.message.split("\n")[0]}
                </div>
                {info.message.includes("\n") && (
                  <pre style={{
                    margin: "10px 0 0",
                    whiteSpace: "pre-wrap",
                    font: "10px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: "#a1a1aa"
                  }}>
                    {info.message.split("\n").slice(1).join("\n").trim()}
                  </pre>
                )}
              </div>

              <div style={{
                padding: 14,
                borderRadius: 14,
                background: "rgba(255,255,255,0.035)",
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <div style={{
                  fontSize: 9,
                  color: "#71717a",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  marginBottom: 9
                }}>
                  FILES CHANGED · {info.files.length}
                </div>

                {info.files.length === 0 ? (
                  <div style={{ fontSize: 10, color: "#71717a" }}>
                    GitHub tidak menyediakan detail file untuk revision ini.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {info.files.map((file, index) => (
                      <div
                        key={file.filename + "-" + index}
                        style={{
                          padding: "10px 11px",
                          borderRadius: 10,
                          background: "rgba(0,0,0,0.16)",
                          border: "1px solid rgba(255,255,255,0.045)"
                        }}
                      >
                        <div style={{
                          fontSize: 10,
                          color: "#d4d4d8",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                          wordBreak: "break-word"
                        }}>
                          {file.filename}
                        </div>
                        <div style={{
                          marginTop: 5,
                          fontSize: 9,
                          color: "#71717a",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
                        }}>
                          {file.status || "modified"} · +{file.additions} / -{file.deletions}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {info.date && (
                <div style={{
                  fontSize: 9,
                  color: "#52525b",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
                }}>
                  {new Date(info.date).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AntithesisConsolePanel({
  entries,
  filter,
  onFilter,
  onClear,
  expanded,
  onToggleExpand
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const scrollRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);
  const isMobileViewport = typeof window !== "undefined" && window.innerWidth <= 640;

  const icons = window.LucideReact || {};
  const Maximize2 = icons.Maximize2;
  const Minimize2 = icons.Minimize2;
  const Trash = icons.Trash;
  const FileDown = icons.FileDown;
  const Copy = icons.Copy;

  const visibleEntries = filter === "all"
    ? entries
    : entries.filter(entry => entry.level === filter);

  const formatEntry = (entry) => {
    const source = entry.source ? " " + entry.source : "";
    const details = entry.details ? "\n" + entry.details : "";
    return entry.time + " [" + String(entry.level || "info").toUpperCase() + "]" + source + " " + entry.message + details;
  };

  const visibleText = visibleEntries.map(formatEntry).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(visibleText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = visibleText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopyStatus(true);
    window.setTimeout(() => setCopyStatus(false), 1200);
  };

  const handleExport = (mode) => {
    const exportEntries = mode === "all"
      ? entries
      : entries.filter(entry => entry.level === mode);
    const text = exportEntries.map(formatEntry).join("\n");
    const blob = new Blob([text || "No diagnostic entries."], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "antithesis-diagnostics-" + mode + "-" + Date.now() + ".log";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const handleScroll = (event) => {
    const element = event.currentTarget;
    const bottom = element.scrollHeight - element.scrollTop - element.clientHeight < 12;
    setAtBottom(bottom);
  };

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !atBottom) return;
    element.scrollTop = element.scrollHeight;
  }, [visibleEntries.length, filter, expanded, atBottom]);

  useEffect(() => {
    if (!expanded) {
      setExportOpen(false);
      setCopyStatus(false);
    }
  }, [expanded]);

  const buttonStyle = {
    width: 34,
    height: 34,
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.035)",
    color: "#a1a1aa",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0
  };

  const filterButton = (level, label) => {
      const selected = filter === level;
    const opacity = filter === "all" ? 1 : selected ? 1 : 0.30;

    return (
      <button
        type="button"
        onClick={() => onFilter(filter === level ? "all" : level)}
        title={filter === "all" ? "Tampilkan " + label + " saja" : selected ? "Tampilkan semua" : "Tampilkan " + label + " saja"}
        aria-label={filter === "all" ? "Filter " + label : selected ? "Tampilkan semua" : "Filter " + label}
        style={{
          width: 18,
          height: 18,
          padding: 0,
          border: 0,
          borderRadius: "50%",
          background: level === "error"
            ? "rgb(239,68,68)"
            : level === "warn"
              ? "rgb(234,179,8)"
              : "rgb(34,197,94)",
          opacity,
          boxShadow: selected
            ? "0 0 0 3px rgba(255,255,255,0.10), 0 0 12px " + (
                level === "error"
                  ? "rgba(239,68,68,0.45)"
                  : level === "warn"
                    ? "rgba(234,179,8,0.40)"
                    : "rgba(34,197,94,0.40)"
              )
            : "none",
          cursor: "pointer",
          transform: selected ? "scale(1.05)" : "scale(1)",
          transition: "all 120ms ease"
        }}
      />
    );
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000001,
      padding: expanded ? 0 : 14,
      boxSizing: "border-box",
      display: "flex",
      alignItems: expanded ? "stretch" : "flex-end",
      justifyContent: "center",
      background: expanded ? "rgba(0,0,0,0.86)" : "transparent",
      pointerEvents: expanded ? "auto" : "none",
      backdropFilter: expanded ? "blur(8px)" : "none",
      WebkitBackdropFilter: expanded ? "blur(8px)" : "none"
    }}>
      <div style={{
        width: "100%",
        maxWidth: expanded ? "none" : 720,
        height: expanded
          ? "100%"
          : isMobileViewport
            ? "30vh"
            : "min(44vh, 430px)",
        minHeight: expanded ? 0 : isMobileViewport ? 150 : 190,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        borderRadius: expanded ? 0 : 16,
        border: expanded ? "none" : "1px solid rgba(255,255,255,0.10)",
        background: "#09090b",
        pointerEvents: "auto",
        boxShadow: expanded ? "none" : "0 20px 70px rgba(0,0,0,0.60)",
        overflow: "hidden"
      }}>
        <div style={{
          minHeight: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "8px 10px",
          boxSizing: "border-box",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "#0f0f12"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {filterButton("error", "ERROR")}
            {filterButton("warn", "WARN")}
            {filterButton("info", "INFO")}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
            <button type="button" onClick={handleCopy} title={copyStatus ? "Copied" : "Copy visible logs"} aria-label="Copy visible logs" style={buttonStyle}>
              {Copy ? <Copy size={16} strokeWidth={1.9} /> : "⧉"}
            </button>

            <button type="button" onClick={() => setExportOpen(prev => !prev)} title="Export diagnostics" aria-label="Export diagnostics" style={buttonStyle}>
              {FileDown ? <FileDown size={16} strokeWidth={1.9} /> : "⇩"}
            </button>

            <button type="button" onClick={onClear} title="Clear diagnostics" aria-label="Clear diagnostics" style={buttonStyle}>
              {Trash ? <Trash size={16} strokeWidth={1.9} /> : "×"}
            </button>

            <button type="button" onClick={onToggleExpand} title={expanded ? "Collapse console" : "Expand console"} aria-label={expanded ? "Collapse console" : "Expand console"} style={buttonStyle}>
              {expanded
                ? (Minimize2 ? <Minimize2 size={16} strokeWidth={1.9} /> : "↙")
                : (Maximize2 ? <Maximize2 size={16} strokeWidth={1.9} /> : "⛶")}
            </button>

            {exportOpen && (
              <div style={{
                position: "absolute",
                top: 40,
                right: 0,
                zIndex: 2,
                minWidth: 150,
                padding: 5,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "#151519",
                boxShadow: "0 14px 40px rgba(0,0,0,0.55)"
              }}>
                {["all", "error", "warn", "info"].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleExport(mode)}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      border: 0,
                      borderRadius: 7,
                      background: "transparent",
                      color: "#d4d4d8",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      cursor: "pointer"
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: expanded ? "10px 12px 18px" : "8px 10px",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 10,
            lineHeight: 1.55
          }}
        >
          {visibleEntries.length === 0 ? (
            <div style={{ padding: "16px 8px", color: "#52525b" }}>
              No diagnostic entries.
            </div>
          ) : (
            visibleEntries.map((entry, index) => (
              <div key={entry.id || index} style={{
                padding: "3px 2px",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                color: entry.level === "error"
                  ? "#fca5a5"
                  : entry.level === "warn"
                    ? "#fde68a"
                    : "#a7f3d0"
              }}>
                <span style={{ color: "#52525b" }}>{entry.time}</span>{" "}
                <span style={{ color: entry.level === "error" ? "#f87171" : entry.level === "warn" ? "#eab308" : "#22c55e", fontWeight: 800 }}>
                  [{String(entry.level || "info").toUpperCase()}]
                </span>{" "}
                {entry.source ? <span style={{ color: "#71717a" }}>{entry.source} </span> : null}
                {entry.message}
                {entry.details ? (
                  <div style={{ marginLeft: 16, color: "#71717a", whiteSpace: "pre-wrap" }}>
                    {entry.details}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Phase06Loader({
  status,
  statusText,
  currentRevision,
  currentVersion,
  latestRevision,
  latestVersion,
  hasUpdate,
  updateKind,
  onRefresh,
  onUpdate,
  onShowUpdateInfo,
  onLaunch,
  busy,
}) {
  const isError = status === "error";
  const isMobileViewport = typeof window !== "undefined" && window.innerWidth <= 640;

  return (
    <div style={{
      minHeight: "100vh",
      boxSizing: "border-box",
      padding: isMobileViewport ? "14px 14px calc(30vh + 14px)" : 20,
      display: "flex",
      alignItems: isMobileViewport ? "flex-start" : "center",
      overflowY: isMobileViewport ? "auto" : "visible",
      justifyContent: "center",
      background: "#08080b",
      color: "#f4f4f5",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 430,
        maxHeight: isMobileViewport ? "calc(70vh - 28px)" : "none",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 22,
        padding: isMobileViewport ? 18 : 22,
        background: "rgba(18,18,23,0.96)",
        overflowY: isMobileViewport ? "auto" : "visible",
        WebkitOverflowScrolling: "touch",
        boxShadow: "0 24px 80px rgba(0,0,0,0.45)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <LoaderIcon>
            <span style={{ fontSize: 17 }}>A</span>
          </LoaderIcon>
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: "0.18em",
              color: "#e4e4e7"
            }}>
              ANTITHESIS
            </div>
            <div style={{
              marginTop: 3,
              fontSize: 9,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#71717a",
              letterSpacing: "0.08em"
            }}>
              CANVAS RUNTIME SHELL · PHASE 0.6
            </div>
          </div>
        </div>

        <div style={{
          padding: 14,
          borderRadius: 15,
          background: isError
            ? "rgba(127,29,29,0.14)"
            : hasUpdate
              ? "rgba(217,119,6,0.10)"
              : "rgba(255,255,255,0.035)",
          border: "1px solid " + (
            isError
              ? "rgba(248,113,113,0.18)"
              : hasUpdate
                ? "rgba(251,191,36,0.18)"
                : "rgba(255,255,255,0.06)"
          ),
          marginBottom: 14
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            fontWeight: 800
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isError
                ? "#f87171"
                : updateKind === "version"
                  ? "#60a5fa"
                  : updateKind === "revision"
                    ? "#fbbf24"
                    : "#4ade80",
              boxShadow: isError
                ? "0 0 10px rgba(248,113,113,0.55)"
                : updateKind === "version"
                  ? "0 0 10px rgba(96,165,250,0.55)"
                  : updateKind === "revision"
                    ? "0 0 10px rgba(251,191,36,0.55)"
                    : "0 0 10px rgba(74,222,128,0.55)"
            }} />
            {isError
              ? "Loader error"
              : updateKind === "version"
                ? "VERSION UPDATE"
                : updateKind === "revision"
                  ? "REVISION UPDATE"
                  : "LOADER READY"}
          </div>

          <div style={{
            marginTop: 8,
            fontSize: 11,
            lineHeight: 1.55,
            color: "#a1a1aa"
          }}>
            {statusText}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 14
        }}>
          <div style={{
            padding: 11,
            borderRadius: 12,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.055)"
          }}>
            <div style={{ fontSize: 8, color: "#71717a", letterSpacing: "0.12em", fontWeight: 800 }}>
              CURRENT
            </div>
            <div style={{
              marginTop: 5,
              fontSize: 10,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: "#d4d4d8"
            }}>
              {currentRevision || "—"}{currentVersion ? " (" + currentVersion + ")" : ""}
            </div>
          </div>

          <div style={{
            padding: 11,
            borderRadius: 12,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.055)"
          }}>
            <div style={{ fontSize: 8, color: "#71717a", letterSpacing: "0.12em", fontWeight: 800 }}>
              GITHUB
            </div>
            <div style={{
              marginTop: 5,
              fontSize: 10,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              color: hasUpdate ? "#fbbf24" : "#d4d4d8"
            }}>
              {latestRevision || "—"}{latestVersion ? " (" + latestVersion + ")" : ""}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 9 }}>
          <LoaderButton
            onClick={onRefresh}
            disabled={busy}
            title="Check GitHub dan sinkronkan status versi"
          >
            {busy ? "CHECKING GITHUB…" : "↻  REFRESH / CHECK UPDATE"}
          </LoaderButton>

          {hasUpdate && (
            <>
              <LoaderButton
                onClick={onUpdate}
                disabled={busy}
                primary
              >
                {busy ? "LOADING UPDATE…" : "UPDATE SEKARANG"}
              </LoaderButton>

              <LoaderButton
                onClick={onShowUpdateInfo}
                disabled={busy}
                title="Lihat detail update dari GitHub"
              >
                UPDATE INFO
              </LoaderButton>
            </>
          )}

          <LoaderButton
            onClick={onLaunch}
            disabled={status === "loading" || status === "updating"}
            primary={!hasUpdate}
          >
            LAUNCH ANTITHESIS
          </LoaderButton>

       </div>

        <div style={{
          marginTop: 16,
          paddingTop: 13,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          fontSize: 9,
          lineHeight: 1.55,
          color: "#52525b",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
        }}>
          Canvas tetap hidup. Refresh di sini tidak me-reload browser atau membuka ulang percakapan Gemini.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const stored = readStoredRevision();

  const [state, setState] = useState({
    status: "loading",
    statusText: "Memuat Antithesis yang sudah dikenal…",
    component: null,
    currentRevision: stored?.shortSha || "phase-0.5",
    currentVersion: stored?.version || null,
    latestRevision: null,
    latestVersion: null,
    latestFullSha: null,
    updateKind: null,
    updateInfo: null,
    updateInfoLoading: false,
    updateInfoError: null,
    showUpdateInfo: false,
    sourceUrl: stored?.sourceUrl || BASELINE_SOURCE_URL,
    hasUpdate: false,
    busy: true,
    view: "loader",
    runtimeErrors: [],
    diagnosticFilter: "all",
    diagnosticExpanded: false
  });

  const activeComponentRef = useRef(null);
  const currentRevisionRef = useRef(stored?.shortSha || "phase-0.5");

  const recordRuntimeDiagnostic = (entry) => {
    setState(prev => ({
      ...prev,
      runtimeErrors: [...prev.runtimeErrors, entry].slice(-500),
      status: entry.level === "error" && prev.view === "app" ? "error" : prev.status,
      statusText: entry.level === "error" && prev.view === "app"
        ? "Antithesis mengalami runtime error. Buka console untuk detail."
        : prev.statusText
    }));
  };

  useEffect(() => {
    const makeEntry = (level, source, message, details, stack, location) => ({
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      level,
      source: source ? String(source) : "runtime",
      message: String(message || "Unknown diagnostic event"),
      details: details ? String(details) : "",
      stack: stack ? String(stack) : "",
      location: location ? String(location) : "",
      time: new Date().toLocaleTimeString()
    });

    const handleWindowError = (event) => {
      const error = event.error;
      recordRuntimeDiagnostic(makeEntry(
        "error",
        "runtime",
        event.message || error?.message || "Unknown uncaught error",
        "",
        error?.stack,
        event.filename ? event.filename + ":" + event.lineno + ":" + event.colno : ""
      ));
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason;
      recordRuntimeDiagnostic(makeEntry(
        "error",
        "runtime",
        reason?.message || String(reason || "Unknown promise rejection"),
        "Unhandled promise rejection",
        reason?.stack,
        ""
      ));
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    const bridge = {
      report: (level = "info", source = "app", message = "", details = "") => {
        const normalizedLevel = ["error", "warn", "info"].includes(String(level).toLowerCase())
          ? String(level).toLowerCase()
          : "info";
        recordRuntimeDiagnostic(makeEntry(
          normalizedLevel,
          source,
          message,
          details,
          "",
          ""
        ));
      },
      reportError: (error, context = "app") => {
        recordRuntimeDiagnostic(makeEntry(
          "error",
          context,
          error?.message || String(error || "Unknown runtime error"),
          "",
          error?.stack,
          ""
        ));
      }
    };

    window.__ANTITHESIS_RUNTIME__ = bridge;

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      try { delete window.__ANTITHESIS_RUNTIME__; } catch {}
    };
  }, []);


  const applyComponent = (LoadedApp, patch = {}) => {
    activeComponentRef.current = LoadedApp;
    if (patch.currentRevision !== undefined) {
      currentRevisionRef.current = patch.currentRevision;
    }
    setState(prev => ({
      ...prev,
      ...patch,
      component: LoadedApp,
      busy: false
    }));
  };

  const checkForUpdate = async (silent = false) => {
    setState(prev => ({
      ...prev,
      busy: true,
      status: "checking",
      statusText: silent ? "Memeriksa revision GitHub…" : "Memeriksa revision terbaru dari GitHub…"
    }));

    try {
      const latest = await getLatestRevision();
      const current = currentRevisionRef.current;
      const currentVersion = state.currentVersion;
      const sameRevision =
        Boolean(current) &&
        current !== "phase-0.5" &&
        latest.sha.startsWith(current);
      const versionChanged =
        Boolean(currentVersion) &&
        Boolean(latest.version) &&
        currentVersion !== latest.version;

      if (sameRevision) {
        setState(prev => ({
          ...prev,
          status: "success",
          statusText: "Current app and revision is up to date.",
          latestRevision: latest.shortSha,
          latestVersion: latest.version,
          latestFullSha: latest.sha,
          updateKind: null,
          hasUpdate: false,
          busy: false
        }));
        return latest;
      }

      const updateKind = versionChanged ? "version" : "revision";
      const statusText = versionChanged
        ? "A new application version is available [" + latest.version + "]"
        : "A newer revision is available [" + latest.shortSha + "]";

      setState(prev => ({
        ...prev,
        status: "success",
        statusText,
        latestRevision: latest.shortSha,
        latestVersion: latest.version,
        latestFullSha: latest.sha,
        updateKind,
        hasUpdate: true,
        busy: false
      }));

      return latest;

      return latest;
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        statusText: String(error?.message || error),
        busy: false
      }));
      return null;
    }
  };

  const loadAndValidate = async (sourceUrl, revisionSha) => {
    const LoadedApp = await compileAppFromSource(sourceUrl, revisionSha);
    return LoadedApp;
  };

  const showUpdateInfo = async () => {
    const sha = state.latestFullSha;
    if (!sha) return;

    setState(prev => ({
      ...prev,
      showUpdateInfo: true,
      updateInfoLoading: true,
      updateInfoError: null
    }));

    try {
      const info = await getRevisionDetails(sha);
      setState(prev => ({
        ...prev,
        updateInfo: info,
        updateInfoLoading: false,
        updateInfoError: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        updateInfoLoading: false,
        updateInfoError: String(error?.message || error)
      }));
    }
  };

  const closeUpdateInfo = () => {
    setState(prev => ({
      ...prev,
      showUpdateInfo: false
    }));
  };

  const updateToLatest = async () => {
    const latest = state.latestFullSha
      ? {
          sha: state.latestFullSha,
          shortSha: state.latestFullSha.slice(0, 7)
        }
      : await getLatestRevision();

    if (!latest?.sha) return;

    setState(prev => ({
      ...prev,
      busy: true,
      status: "updating",
      statusText: "Mengambil dan memvalidasi Antithesis revision " + latest.sha.slice(0, 7) + "…"
    }));

    try {
      const sourceUrl =
        MAIN_SOURCE_BASE_URL + encodeURIComponent(latest.sha) + "/antithesis_project1.jsx";

      const LoadedApp = await loadAndValidate(
        sourceUrl,
        latest.sha
      );

      const loadedVersion = LoadedApp.ANTITHESIS_VERSION || null;

      storeRevision({
        sha: latest.sha,
        shortSha: latest.sha.slice(0, 7),
        sourceUrl: sourceUrl,
        version: loadedVersion
      });

      applyComponent(LoadedApp, {
        currentVersion: loadedVersion,
        runtimeErrors: [],
        diagnosticFilter: "all",
        diagnosticExpanded: false,
        latestVersion: loadedVersion,
        status: "success",
        statusText: "Update berhasil. Revision baru sudah siap.",
        currentRevision: latest.sha.slice(0, 7),
        latestRevision: latest.sha.slice(0, 7),
        latestFullSha: latest.sha,
        sourceUrl,
        hasUpdate: false
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        status: "error",
        statusText:
          "Update gagal. Versi yang sedang berjalan tetap dipertahankan. " +
          String(error?.message || error),
        busy: false
      }));
    }
  };

  const launchAntithesis = () => {
    if (!activeComponentRef.current) return;
    setState(prev => ({
      ...prev,
      view: "app",
      status: "success",
      statusText: "Antithesis sedang berjalan.",
      busy: false
    }));
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const sourceUrl = stored?.sourceUrl || BASELINE_SOURCE_URL;
        const revisionSha = stored?.sha || "phase-0.5";

        const LoadedApp = await loadAndValidate(sourceUrl, revisionSha);

        if (!alive) return;

        activeComponentRef.current = LoadedApp;

        setState(prev => ({
          ...prev,
          status: "checking",
          statusText: "Memeriksa revision GitHub terbaru…",
          component: LoadedApp,
          busy: true
        }));

        // First loader boot is special:
        // silently check GitHub and, when a newer revision exists,
        // load it immediately. The user should only need to click
        // LAUNCH ANTITHESIS. Update controls remain hidden on this boot.
        const latest = await getLatestRevision();

        if (!alive) return;

        const current = stored?.sha || revisionSha;
        const latestIsNewer =
          !stored ||
          current === "phase-0.5" ||
          !latest.sha.startsWith(current);

        if (latestIsNewer) {
          const latestSourceUrl =
            MAIN_SOURCE_BASE_URL +
            encodeURIComponent(latest.sha) +
            "/antithesis_project1.jsx";

          const LatestApp = await loadAndValidate(
            latestSourceUrl,
            latest.sha
          );

          if (!alive) return;

          const latestVersion = LatestApp.ANTITHESIS_VERSION || null;

          storeRevision({
            sha: latest.sha,
            shortSha: latest.sha.slice(0, 7),
            sourceUrl: latestSourceUrl,
            version: latestVersion
          });

          activeComponentRef.current = LatestApp;

          currentRevisionRef.current = latest.sha.slice(0, 7);

          setState(prev => ({
            ...prev,
            runtimeErrors: [],
            diagnosticFilter: "all",
            diagnosticExpanded: false,
            status: "success",
            statusText: "Antithesis terbaru sudah siap. Silakan launch.",
            component: LatestApp,
            currentRevision: latest.sha.slice(0, 7),
            currentVersion: latestVersion,
            latestRevision: latest.sha.slice(0, 7),
            latestVersion: latestVersion,
            latestFullSha: latest.sha,
            sourceUrl: latestSourceUrl,
            hasUpdate: false,
            busy: false
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          status: "success",
          statusText: "Antithesis sudah menggunakan revision GitHub terbaru. Silakan launch.",
          latestRevision: latest.shortSha,
          latestVersion: latest.version,
          latestFullSha: latest.sha,
          hasUpdate: false,
          busy: false
        }));
      } catch (error) {
        if (!alive) return;

        setState(prev => ({
          ...prev,
          status: "error",
          statusText: String(error?.message || error),
          component: null,
          busy: false
        }));
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const goToLoader = () => {
    setState(prev => ({
      ...prev,
      view: "loader",
      status: "success",
      statusText: prev.hasUpdate
        ? "Versi baru tersedia. Kembali ke loader untuk update."
        : "Antithesis siap. Kamu bisa refresh/check GitHub kapan saja.",
      busy: false
    }));
  };

  const LoadedApp = state.component;
  const stateComponentReady = Boolean(LoadedApp && activeComponentRef.current);

  const clearRuntimeDiagnostics = () => {
    setState(prev => ({ ...prev, runtimeErrors: [] }));
  };

  const setDiagnosticFilter = (filter) => {
    setState(prev => ({ ...prev, diagnosticFilter: filter }));
  };

  const toggleDiagnosticExpand = () => {
    setState(prev => ({ ...prev, diagnosticExpanded: !prev.diagnosticExpanded }));
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <div
        style={{
          display: state.view === "app" ? "block" : "none",
          minHeight: "100vh"
        }}
      >
        {LoadedApp && <LoadedApp />}

        <button
          type="button"
          onClick={goToLoader}
          title="Kembali ke Antithesis Loader"
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 999999,
            minHeight: 34,
            padding: "0 11px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(10,10,14,0.82)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            color: "#d4d4d8",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.07em",
            cursor: "pointer",
            boxShadow: "0 8px 30px rgba(0,0,0,0.28)"
          }}
        >
          ← LOADER
        </button>
      </div>

      <div
        style={{
          display: state.view === "app" ? "none" : "block",
          minHeight: "100vh"
        }}
      >
        <Phase06Loader
          status={state.status}
          statusText={state.statusText}
          currentRevision={state.currentRevision}
          currentVersion={state.currentVersion}
          latestRevision={state.latestRevision}
          latestVersion={state.latestVersion}
          hasUpdate={state.hasUpdate}
          updateKind={state.updateKind}
          busy={state.busy}
          onRefresh={() => checkForUpdate(false)}
          onUpdate={updateToLatest}
          onShowUpdateInfo={showUpdateInfo}
          onLaunch={launchAntithesis}
        />

        {state.showUpdateInfo && (
          <UpdateInfoOverlay
            info={state.updateInfo}
            loading={state.updateInfoLoading}
            error={state.updateInfoError}
            onClose={closeUpdateInfo}
          />
        )}
      </div>

      {state.view === "loader" && (
        <AntithesisConsolePanel
          entries={state.runtimeErrors}
          filter={state.diagnosticFilter}
          onFilter={setDiagnosticFilter}
          onClear={clearRuntimeDiagnostics}
          expanded={state.diagnosticExpanded}
          onToggleExpand={toggleDiagnosticExpand}
        />
      )}
    </div>
  );
}
