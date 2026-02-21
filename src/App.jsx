import { useEffect, useMemo, useState } from "react";
import { MessageThreadFull } from "./components/tambo/message-thread-full";
import { components as registeredTamboComponents } from "./lib/tambo";
import "./App.css";

const PAGES = {
  landing: "landing",
  workspace: "workspace",
  gallery: "gallery",
};

const MOBILE_BREAKPOINT = 900;
const WORKSPACE_LAYOUT_KEY = "pitchops_workspace_layout_v1";

const WORKSPACE_PRESETS = {
  balanced: { label: "Balanced", ratio: 52 },
  canvas: { label: "Canvas Focus", ratio: 100 },
  chat: { label: "Chat Focus", ratio: 0 },
};

const PREVIEW_PROPS_BY_COMPONENT = {
  KPIDashboard: {
    company: "PitchOps Demo",
    monthlyRevenue: 58000,
    monthlyGrowthPercent: 14,
    activeUsers: 9600,
    churnRate: 2.9,
    burnRate: 41000,
    runwayMonths: 15,
    showSliders: true,
  },
  PitchChecklist: {
    storageKey: "pitchops_pitch_checklist_gallery",
  },
  QASimulator: {
    storageKey: "pitchops_qa_simulator_gallery",
  },
  NotesEditor: {
    title: "Founder Notes Editor",
    storageKey: "pitchops_notes_editor_gallery",
  },
};

const APP_FEATURES = [
  {
    title: "Generative UI",
    description: "Convert founder prompts into ready-to-use pitch components.",
  },
  {
    title: "Render Canvas",
    description: "Move generated UI from chat directly into a focused workspace.",
  },
  {
    title: "Investor Prep",
    description: "Practice Q&A, track readiness, and refine your narrative fast.",
  },
  {
    title: "Founder Notes",
    description: "Capture story, risks, and talking points with local persistence.",
  },
];

export default function App() {
  const [activePage, setActivePage] = useState(PAGES.landing);
  const [canvasItems, setCanvasItems] = useState([]);
  const [activeCanvasId, setActiveCanvasId] = useState(null);
  const [isMobileWorkspace, setIsMobileWorkspace] = useState(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );
  const [mobileWorkspaceView, setMobileWorkspaceView] = useState("canvas");
  const [workspaceRatio, setWorkspaceRatio] = useState(
    WORKSPACE_PRESETS.balanced.ratio,
  );
  const [workspacePreset, setWorkspacePreset] = useState("balanced");
  const [isResizingWorkspace, setIsResizingWorkspace] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobileWorkspace(window.innerWidth < MOBILE_BREAKPOINT);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WORKSPACE_LAYOUT_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const safeRatio = Number(parsed.ratio);
      if (safeRatio >= 30 && safeRatio <= 70) setWorkspaceRatio(safeRatio);
      if (WORKSPACE_PRESETS[parsed.preset]) setWorkspacePreset(parsed.preset);
    } catch {
      // ignore invalid storage
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        WORKSPACE_LAYOUT_KEY,
        JSON.stringify({ ratio: workspaceRatio, preset: workspacePreset }),
      );
    } catch {
      // ignore storage issues
    }
  }, [workspaceRatio, workspacePreset]);

  useEffect(() => {
    const onShowComponent = (event) => {
      const { messageId, component, componentName, componentProps } =
        event.detail ?? {};
      if (!messageId || !component) return;

      const matchedComponent = registeredTamboComponents.find(
        (item) => item.name === componentName,
      )?.component;
      const ResolvedComponent = matchedComponent;
      const resolvedComponent = matchedComponent ? (
        <ResolvedComponent {...(componentProps ?? {})} />
      ) : (
        component
      );

      setCanvasItems((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== messageId);
        const resolvedLabel =
          componentName ??
          matchedComponent?.displayName ??
          matchedComponent?.name ??
          "Generated UI";
        const next = [
          { id: messageId, component: resolvedComponent, label: resolvedLabel },
          ...withoutCurrent,
        ];
        return next.slice(0, 8);
      });
      setActiveCanvasId(messageId);
    };

    window.addEventListener("tambo:showComponent", onShowComponent);
    return () => window.removeEventListener("tambo:showComponent", onShowComponent);
  }, []);

  useEffect(() => {
    if (!isResizingWorkspace) return undefined;

    const onMouseMove = (event) => {
      const nextRatio = Math.max(30, Math.min(70, (event.clientX / window.innerWidth) * 100));
      setWorkspaceRatio(nextRatio);
      setWorkspacePreset("custom");
    };

    const onMouseUp = () => setIsResizingWorkspace(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp, { once: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizingWorkspace]);

  const clearCanvas = () => {
    setCanvasItems([]);
    setActiveCanvasId(null);
  };

  const isCanvasMaximized = !isMobileWorkspace && workspacePreset === "canvas";
  const isChatMaximized = !isMobileWorkspace && workspacePreset === "chat";

  const applyWorkspacePreset = (presetKey) => {
    const preset = WORKSPACE_PRESETS[presetKey];
    if (!preset) return;
    setWorkspacePreset(presetKey);
    setWorkspaceRatio(preset.ratio);
  };

  const activeCanvasComponent = useMemo(() => {
    if (!canvasItems.length) return null;
    return (
      canvasItems.find((item) => item.id === activeCanvasId) ?? canvasItems[0]
    );
  }, [activeCanvasId, canvasItems]);

  const galleryComponents = useMemo(() => {
    return registeredTamboComponents.map((entry) => {
      const Component = entry.component;
      const previewProps = PREVIEW_PROPS_BY_COMPONENT[entry.name] ?? {};
      return {
        name: entry.name,
        description: entry.description,
        content: <Component {...previewProps} />,
      };
    });
  }, []);

  if (activePage === PAGES.landing) {
    return (
      <div className="page">
        <div className="app-shell">
          <section className="landing">
            <p className="landing-kicker">PitchOps AI</p>
            <h1>Founder Workflow For Investor Readiness</h1>
            <p className="landing-subtitle">
              A minimalist AI workspace for building pitch assets, practicing tough
              investor questions, and organizing your fundraise narrative.
            </p>
            <button
              type="button"
              className="landing-cta"
              onClick={() => setActivePage(PAGES.workspace)}
            >
              Enter Workspace
            </button>
            <div className="feature-grid">
              {APP_FEATURES.map((feature) => (
                <article key={feature.title} className="feature-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (activePage === PAGES.gallery) {
    return (
      <div className="page">
        <div className="app-shell workspace-shell">
          <header className="workspace-brand">
            <div className="brand-logo" aria-hidden="true">
              PO
            </div>
            <div>
              <p className="brand-name">PitchOps AI</p>
              <p className="brand-sub">All Components Playground</p>
            </div>
          </header>

          <section className="gallery-stage">
            <div className="panel-head panel-head-actions">
              <div>
                <h2>Component Gallery</h2>
                <p>
                  All registered components are shown below with live editing and
                  interaction enabled.
                </p>
              </div>
              <button
                type="button"
                className="canvas-tab"
                onClick={() => setActivePage(PAGES.workspace)}
              >
                Back To Workspace
              </button>
            </div>

            <div className="gallery-grid">
              {galleryComponents.map((entry) => (
                <article key={entry.name} className="gallery-card">
                  <div className="gallery-card-head">
                    <h3>{entry.name}</h3>
                    <p>{entry.description}</p>
                  </div>
                  <div className="gallery-card-body">{entry.content}</div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="app-shell workspace-shell">
        <header className="workspace-brand">
          <div className="brand-logo" aria-hidden="true">
            PO
          </div>
          <div>
            <p className="brand-name">PitchOps AI</p>
            <p className="brand-sub">Investor Prep Workspace</p>
          </div>
          <button
            type="button"
            className="canvas-tab workspace-nav-button"
            onClick={() => setActivePage(PAGES.gallery)}
          >
            View All Components
          </button>
        </header>
        <div
          className="workspace-layout"
          style={
            isMobileWorkspace
              ? undefined
              : isCanvasMaximized || isChatMaximized
                ? { gridTemplateColumns: "1fr" }
                : { gridTemplateColumns: `${workspaceRatio}% 8px ${100 - workspaceRatio}%` }
          }
        >
          {isMobileWorkspace && (
            <div className="mobile-stage-switcher">
              <button
                type="button"
                className={`canvas-tab ${mobileWorkspaceView === "canvas" ? "is-active" : ""}`}
                onClick={() => setMobileWorkspaceView("canvas")}
              >
                Canvas
              </button>
              <button
                type="button"
                className={`canvas-tab ${mobileWorkspaceView === "chat" ? "is-active" : ""}`}
                onClick={() => setMobileWorkspaceView("chat")}
              >
                Chat
              </button>
            </div>
          )}

          {!isMobileWorkspace && (
            <div className="workspace-layout-toolbar">
              {Object.entries(WORKSPACE_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  className={`canvas-tab ${workspacePreset === key ? "is-active" : ""}`}
                  onClick={() => applyWorkspacePreset(key)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          <section
            className={`render-stage ${isMobileWorkspace && mobileWorkspaceView !== "canvas" ? "is-hidden-mobile" : ""} ${isChatMaximized ? "is-hidden-desktop" : ""}`}
          >
            <div className="panel-head">
              <h2>Render Canvas</h2>
              <p>
                Move generated UI components here from chat using the canvas button.
              </p>
            </div>
            <div
              id="tambo-render-stage"
              data-canvas-space="true"
              className="render-stage-body"
            >
              <div className="canvas-toolbar">
                <div className="canvas-tabs">
                  {canvasItems.map((item, index) => (
                    <button
                      key={item.id}
                      className={`canvas-tab ${item.id === activeCanvasComponent?.id ? "is-active" : ""}`}
                      onClick={() => setActiveCanvasId(item.id)}
                      title={item.label ?? item.id}
                      type="button"
                    >
                      {item.label ?? `UI ${canvasItems.length - index}`}
                    </button>
                  ))}
                </div>
                {canvasItems.length > 0 && (
                  <button type="button" className="canvas-clear" onClick={clearCanvas}>
                    Clear
                  </button>
                )}
              </div>

              {activeCanvasComponent ? (
                <div
                  className="render-canvas-content"
                  key={activeCanvasComponent.id}
                >
                  {activeCanvasComponent.component}
                </div>
              ) : (
                <div className="render-stage-placeholder">
                  Ask chat to generate UI components like KPIDashboard, PitchChecklist,
                  QASimulator, or NotesEditor. Then click "view in canvas".
                </div>
              )}
            </div>
          </section>

          {!isMobileWorkspace && (
            <button
              type="button"
              className={`workspace-divider ${isCanvasMaximized || isChatMaximized ? "is-hidden-desktop" : ""}`}
              aria-label="Resize workspace panels"
              onMouseDown={() => setIsResizingWorkspace(true)}
            />
          )}

          <section
            className={`chat-stage tambo-sandbox ${isMobileWorkspace && mobileWorkspaceView !== "chat" ? "is-hidden-mobile" : ""} ${isCanvasMaximized ? "is-hidden-desktop" : ""}`}
          >
            <div className="panel-head">
              <h2>Chat + Interaction</h2>
              <p>
                Request UI components by name: KPIDashboard, PitchChecklist,
                QASimulator, NotesEditor.
              </p>
            </div>
            <div className="chat-shell">
              <MessageThreadFull />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
