import React, { useEffect, useState } from "react";

const SOURCE_URL =
  "https://raw.githubusercontent.com/beyonderbliss/antithesis/phase-0.5/canvas-antithesis-loader/antithesis_project1.jsx";

const BABEL_URL =
  "https://unpkg.com/@babel/standalone@7.28.4/babel.min.js";

const LUCIDE_URL =
  "https://unpkg.com/lucide-react@0.472.0/dist/umd/lucide-react.min.js?v=phase05-" + Date.now();

function loadScript(src, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) {
      resolve(window[globalName]);
      return;
    }

    const existing = document.querySelector('script[data-phase05-src="' + src + '"]');
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
    script.dataset.phase05Src = src;
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

  // Final guard: no ES-module imports may reach new Function.
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

export default function App() {
  const [state, setState] = useState({
    status: "loading",
    message: "Loading Antithesis from GitHub…",
    component: null
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // lucide-react's UMD build expects React on the global object.
        // Canvas provides React to this entry as an ES module, so bridge only
        // during Lucide initialization and restore the previous global after.
        // lucide-react UMD resolves its React dependency from the lowercase
        // global `react`, while Canvas exposes React through this entry module.
        // Bridge both names temporarily so Lucide captures the exact same React
        // instance that renders Antithesis. The cache-busted URL also prevents
        // reuse of a Lucide instance initialized during an earlier failed load.
        const previousGlobalReact = window.React;
        const previousGlobalReactLower = window.react;
        window.React = React;
        window.react = React;

        let sourceResponse;
        try {
          [sourceResponse] = await Promise.all([
            fetch(SOURCE_URL + "?v=" + Date.now(), { cache: "no-store" }),
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

        if (alive) {
          setState({
            status: "success",
            message: "Antithesis loaded from GitHub.",
            component: LoadedApp
          });
        }
      } catch (error) {
        console.error("[Phase 0.5]", error);
        if (alive) {
          setState({
            status: "error",
            message: String(error?.message || error),
            component: null
          });
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (state.component) {
    const LoadedApp = state.component;
    return <LoadedApp />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      padding: 24,
      fontFamily: "sans-serif",
      background: "#111",
      color: "#fff"
    }}>
      <h2>Antithesis — Phase 0.5</h2>
      <p><b>Status:</b> {state.status}</p>
      <p>{state.message}</p>
      {state.status === "loading" && (
        <p style={{ color: "#999" }}>
          Fetching the current Antithesis source from GitHub…
        </p>
      )}
    </div>
  );
}
