import React, { useEffect, useState } from "react";

const SOURCE_URL =
  "https://raw.githubusercontent.com/beyonderbliss/antithesis/phase-0.5/canvas-antithesis-loader/antithesis_project1.jsx";

const BABEL_URL =
  "https://unpkg.com/@babel/standalone@7.28.4/babel.min.js";

const LUCIDE_URL =
  "https://unpkg.com/lucide-react@0.472.0/dist/umd/lucide-react.min.js";

function loadScript(src, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) {
      resolve(window[globalName]);
      return;
    }

    const existing = document.querySelector('script[data-phase05-src="' + src + '"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(globalName ? window[globalName] : true), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load " + src)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.phase05Src = src;
    script.onload = () => resolve(globalName ? window[globalName] : true);
    script.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}

function prepareSource(source) {
  let code = source;

  code = code.replace(
    /import React,\s*\{([\\s\\S]*?)\}\s*from\s*["']react["'];?/,
    (_, hooks) => "const {" + hooks + "} = React;"
  );

  code = code.replace(
    /import\s*\{([\\s\\S]*?)\}\s*from\s*["']lucide-react["'];?/,
    (_, icons) => "const {" + icons + "} = LucideReact;"
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
        const [sourceResponse] = await Promise.all([
          fetch(SOURCE_URL + "?v=" + Date.now(), { cache: "no-store" }),
          loadScript(BABEL_URL, "Babel"),
          loadScript(LUCIDE_URL, "LucideReact")
        ]);

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
