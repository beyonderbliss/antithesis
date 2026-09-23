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

  return {
    sha: latest.sha,
    shortSha: latest.sha.slice(0, 7),
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

function Phase06Loader({
  status,
  statusText,
  currentRevision,
  latestRevision,
  hasUpdate,
  onRefresh,
  onUpdate,
  onShowUpdateInfo,
  busy
}) {
  const isError = status === "error";

  return (
    <div style={{
      minHeight: "100vh",
      boxSizing: "border-box",
      padding: 20,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#08080b",
      color: "#f4f4f5",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        width: "100%",
        maxWidth: 430,
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 22,
        padding: 22,
        background: "rgba(18,18,23,0.96)",
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
              background: isError ? "#f87171" : hasUpdate ? "#fbbf24" : "#4ade80",
              boxShadow: isError
                ? "0 0 10px rgba(248,113,113,0.55)"
                : hasUpdate
                  ? "0 0 10px rgba(251,191,36,0.55)"
                  : "0 0 10px rgba(74,222,128,0.55)"
            }} />
            {isError ? "Loader error" : hasUpdate ? "Update tersedia" : "Loader ready"}
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
              {currentRevision || "—"}
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
              {latestRevision || "—"}
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
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.35fr",
                gap: 9
              }}>
                <LoaderButton
                  onClick={onShowUpdateInfo}
                  disabled={busy}
                  title="Lihat detail update dari GitHub"
                >
                  ⓘ  UPDATE INFO
                </LoaderButton>

                <LoaderButton
                  onClick={onUpdate}
                  disabled={busy}
                  primary
                >
                  {busy ? "LOADING UPDATE…" : "UPDATE SEKARANG"}
                </LoaderButton>
              </div>
            </>
          )}

          <LoaderButton
            onClick={onLaunch}
            disabled={busy || status === "loading"}
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
    latestRevision: null,
    latestFullSha: null,
    updateInfo: null,
    updateInfoLoading: false,
    updateInfoError: null,
    showUpdateInfo: false,
    sourceUrl: stored?.sourceUrl || BASELINE_SOURCE_URL,
    hasUpdate: false,
    busy: true,
    view: "loader"
  });

  const activeComponentRef = useRef(null);
  const currentRevisionRef = useRef(stored?.shortSha || "phase-0.5");

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

      if (current && current !== "phase-0.5" && latest.sha.startsWith(current)) {
        setState(prev => ({
          ...prev,
          status: "success",
          statusText: "Antithesis sudah menggunakan revision GitHub terbaru.",
          latestRevision: latest.shortSha,
          latestFullSha: latest.sha,
          hasUpdate: false,
          busy: false
        }));
        return latest;
      }

      if (current === latest.shortSha || (stored && stored.sha === latest.sha)) {
        setState(prev => ({
          ...prev,
          status: "success",
          statusText: "Tidak ada update baru. Revision aktif sudah terbaru.",
          latestRevision: latest.shortSha,
          latestFullSha: latest.sha,
          hasUpdate: false,
          busy: false
        }));
        return latest;
      }

      setState(prev => ({
        ...prev,
        status: "success",
        statusText: "Versi baru Antithesis tersedia dari GitHub.",
        latestRevision: latest.shortSha,
        latestFullSha: latest.sha,
        hasUpdate: true,
        busy: false
      }));

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

      storeRevision({
        sha: latest.sha,
        shortSha: latest.sha.slice(0, 7),
        sourceUrl: sourceUrl
      });

      applyComponent(LoadedApp, {
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
          status: "success",
          statusText: "Antithesis siap. Silakan cek update atau launch.",
          component: LoadedApp,
          busy: false
        }));

        // Initial detection is intentionally non-blocking:
        // the known-good app can become usable before the GitHub check finishes.
        const latest = await getLatestRevision();

        if (!alive || !latest) return;

        const current = stored?.sha || null;
        const hasUpdate = !current || current !== latest.sha;

        setState(prev => ({
          ...prev,
          latestRevision: latest.shortSha,
          latestFullSha: latest.sha,
          hasUpdate,
          status: hasUpdate ? "success" : prev.status,
          statusText: hasUpdate
            ? "Versi baru Antithesis tersedia dari GitHub."
            : prev.statusText
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
          latestRevision={state.latestRevision}
          hasUpdate={state.hasUpdate}
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
    </div>
  );
}
