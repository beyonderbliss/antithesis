import React, { useEffect, useState } from "react";

const SOURCE_URL =
  "https://raw.githubusercontent.com/beyonderbliss/antithesis/main/antithesis_project1.jsx";

const COMMITS_URL =
  "https://api.github.com/repos/beyonderbliss/antithesis/commits?path=antithesis_project1.jsx&per_page=1";

const BABEL_URL =
  "https://unpkg.com/@babel/standalone@7.28.4/babel.min.js";

const LUCIDE_URL =
  "https://unpkg.com/lucide-react@0.472.0/dist/umd/lucide-react.min.js";

const POLL_INTERVAL = 30000;

function loadScript(src, globalName) {
  return new Promise((resolve, reject) => {
    if (globalName && window[globalName]) {
      resolve(window[globalName]);
      return;
    }

    const existing = document.querySelector(
      'script[data-antithesis-runtime="' + src + '"]'
    );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(globalName ? window[globalName] : true),
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load " + src)),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.antithesisRuntime = src;
    script.onload = () =>
      resolve(globalName ? window[globalName] : true);
    script.onerror = () =>
      reject(new Error("Failed to load " + src));
    document.head.appendChild(script);
  });
}

function prepareSource(source) {
  let code = source;

  code = code.replace(
    ,
    (_, hooks) => "const {" + hooks + "} = React;"
  );

  code = code.replace(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']lucide-react["'];?/,
    (_, icons) => "const {" + icons + "} = LucideReact;"
  );

  code = code.replace(/export\s+default\s+/g, "");

  return code;
}

async function fetchLatestCommit() {
  const response = await fetch(COMMITS_URL, {
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json" }
  });

  if (!response.ok) {
    throw new Error("GitHub commit check HTTP " + response.status);
  }

  const commits = await response.json();

  if (!Array.isArray(commits) || !commits[0]?.sha) {
    throw new Error("GitHub tidak mengembalikan commit Antithesis.");
  }

  return commits[0].sha;
}

async function loadAntithesis(commitSha) {
  const sourceResponse = await fetch(
    SOURCE_URL + "?v=" + encodeURIComponent(commitSha),
    { cache: "no-store" }
  );

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
    transformed +
      "\nreturn typeof App !== 'undefined' ? App : null;"
  )(React, window.LucideReact);

  if (typeof LoadedApp !== "function") {
    throw new Error(
      "Antithesis App component was not found after loading."
    );
  }

  return LoadedApp;
}

export default function App() {
  const [state, setState] = useState({
    status: "loading",
    message: "Loading Antithesis from GitHub…",
    component: null,
    commit: null
  });

  useEffect(() => {
    let alive = true;
    let timer = null;

    const boot = async () => {
      try {
        await Promise.all([
          loadScript(BABEL_URL, "Babel"),
          loadScript(LUCIDE_URL, "LucideReact")
        ]);

        const commit = await fetchLatestCommit();
        const component = await loadAntithesis(commit);

        if (!alive) return;

        setState({
          status: "success",
          message: "Antithesis loaded from GitHub.",
          component,
          commit
        });

        const poll = async () => {
          if (!alive) return;

          try {
            const latestCommit = await fetchLatestCommit();

            if (latestCommit !== commitRef.current) {
              const latestComponent = await loadAntithesis(latestCommit);

              if (!alive) return;

              commitRef.current = latestCommit;

              setState({
                status: "success",
                message: "Antithesis updated from GitHub.",
                component: latestComponent,
                commit: latestCommit
              });
            }
          } catch (error) {
            console.warn("[Antithesis Runtime]", error);
          } finally {
            if (alive) {
              timer = setTimeout(poll, POLL_INTERVAL);
            }
          }
        };

        commitRef.current = commit;
        timer = setTimeout(poll, POLL_INTERVAL);
      } catch (error) {
        console.error("[Antithesis Runtime]", error);

        if (alive) {
          setState({
            status: "error",
            message: String(error?.message || error),
            component: null,
            commit: null
          });
        }
      }
    };

    const commitRef = { current: null };

    boot();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (state.component) {
    const LoadedApp = state.component;
    return <LoadedApp />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "sans-serif",
        background: "#111",
        color: "#fff"
      }}
    >
      <h2>Antithesis — GitHub Runtime</h2>
      <p>
        <b>Status:</b> {state.status}
      </p>
      <p>{state.message}</p>
      {state.commit && (
        <p style={{ color: "#777", fontSize: 12 }}>
          Commit: {state.commit.slice(0, 7)}
        </p>
      )}
      {state.status === "loading" && (
        <p style={{ color: "#999" }}>
          Fetching the current Antithesis source from GitHub…
        </p>
      )}
    </div>
  );
}
