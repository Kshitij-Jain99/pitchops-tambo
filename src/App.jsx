import { useEffect, useMemo, useState } from "react";
import { MessageThreadFull } from "./components/tambo/message-thread-full";
import { components as registeredTamboComponents } from "./lib/tambo";
import "./App.css";

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
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [canvasItems, setCanvasItems] = useState([]);
  const [activeCanvasId, setActiveCanvasId] = useState(null);

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
        const next = [
          { id: messageId, component: resolvedComponent },
          ...withoutCurrent,
        ];
        return next.slice(0, 8);
      });
      setActiveCanvasId(messageId);
    };

    window.addEventListener("tambo:showComponent", onShowComponent);
    return () => window.removeEventListener("tambo:showComponent", onShowComponent);
  }, []);

  const activeCanvasComponent = useMemo(() => {
    if (!canvasItems.length) return null;
    return (
      canvasItems.find((item) => item.id === activeCanvasId) ?? canvasItems[0]
    );
  }, [activeCanvasId, canvasItems]);

  const clearCanvas = () => {
    setCanvasItems([]);
    setActiveCanvasId(null);
  };

  if (!isWorkspaceOpen) {
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
              onClick={() => setIsWorkspaceOpen(true)}
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
        </header>
        <div className="workspace-layout">
          <section className="render-stage">
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
                      title={item.id}
                      type="button"
                    >
                      UI {canvasItems.length - index}
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
                <div className="render-canvas-content">{activeCanvasComponent.component}</div>
              ) : (
                <div className="render-stage-placeholder">
                  Ask chat to generate UI components like KPIDashboard, PitchChecklist,
                  QASimulator, or NotesEditor. Then click "view in canvas".
                </div>
              )}
            </div>
          </section>

          <section className="chat-stage tambo-sandbox">
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
