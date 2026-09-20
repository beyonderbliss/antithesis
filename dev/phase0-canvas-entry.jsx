import React, { useEffect, useState } from "react";

const MODULE_URL = "https://raw.githubusercontent.com/beyonderbliss/antithesis/phase-0/canvas-github-loader/dev/phase0-payload.js";

export default function App() {
  const [state, setState] = useState({ status: "loading", message: "Loading GitHub module…" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(MODULE_URL + "?v=" + Date.now(), { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const source = await res.text();
        const module = new Function("React", source)(React);
        if (alive) setState({ status: "success", message: module?.message || "Module loaded.", payload: module });
      } catch (error) {
        if (alive) setState({ status: "error", message: String(error?.message || error) });
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div style={{ minHeight: "100vh", padding: 24, fontFamily: "sans-serif", background: "#111", color: "#fff" }}>
      <h2>Antithesis — Phase 0</h2>
      <p><b>Status:</b> {state.status}</p>
      <p>{state.message}</p>
      {state.payload && <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(state.payload, null, 2)}</pre>}
      <hr />
      <small>Refresh this Canvas after changing dev/phase0-payload.js on GitHub.</small>
    </div>
  );
}
