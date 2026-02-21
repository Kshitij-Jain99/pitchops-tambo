import { useEffect, useMemo, useRef, useState } from "react";
const NOTES_TABS = ["write", "ops", "history", "exports"];

export function NotesEditor({
  title = "Founder Brain Dump",
  notes = "",
  story = "",
  risks = "",
  talkingPoints = "",
  showSections = true,
  storageKey = "pitchops_notes_editor",
}) {
  const [activeTab, setActiveTab] = useState("write");
  const NOTE_TEMPLATES = {
    investor_call: {
      label: "Investor Call",
      notes: "Meeting objective:\nKey updates:\nInvestor concerns:\nNext-step ask:",
      story: "Narrative arc: problem -> traction -> why now -> moat.",
      risks: "Fundraising risk:\nExecution risk:\nMitigation this week:",
      talkingPoints: "Top 3 proof points:\n1.\n2.\n3.",
    },
    partner_meeting: {
      label: "Partner Meeting",
      notes: "Partner profile:\nStrategic fit:\nDeal blockers:\nFollow-up owners:",
      story: "Joint story: customer value, integration path, distribution leverage.",
      risks: "Commercial risk:\nTechnical risk:\nLegal or procurement risk:",
      talkingPoints: "Partnership outcomes:\n- Pilot terms\n- Timeline\n- Commitments",
    },
    weekly_review: {
      label: "Weekly Review",
      notes: "Wins:\nMisses:\nDecisions needed:\nTop priorities for next week:",
      story: "Progress narrative and what changed this week.",
      risks: "What can break next sprint and prevention plan.",
      talkingPoints: "Team update script:\n- Metric movement\n- Risks\n- Next asks",
    },
  };

  const initialState = useMemo(
    () => ({
      notes,
      story,
      risks,
      talkingPoints,
    }),
    [notes, story, risks, talkingPoints],
  );

  const [draft, setDraft] = useState(initialState);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("investor_call");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [pins, setPins] = useState([]);
  const [pinInput, setPinInput] = useState("");
  const [decisions, setDecisions] = useState([]);
  const [actions, setActions] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [decisionDraft, setDecisionDraft] = useState({
    decision: "",
    why: "",
    owner: "",
    revisitBy: "",
  });
  const [actionDraft, setActionDraft] = useState({
    title: "",
    owner: "",
    dueDate: "",
  });
  const notesRef = useRef(null);
  const autoSnapshotRef = useRef({ signature: "", timestamp: 0 });

  const trimToMax = (list, max = 5) => list.slice(0, max);

  const buildSnapshot = () => ({
    id: `snapshot-${Date.now()}`,
    createdAt: new Date().toISOString(),
    draft,
    tags,
    pins: trimToMax(pins, 5),
    decisions,
    actions,
  });

  const normalizeTag = (value) => value.trim().toLowerCase().replace(/\s+/g, "-");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const restoredDraft = {
          notes: parsed.notes ?? initialState.notes,
          story: parsed.story ?? initialState.story,
          risks: parsed.risks ?? initialState.risks,
          talkingPoints: parsed.talkingPoints ?? initialState.talkingPoints,
        };
        const nestedDraft = parsed.draft && typeof parsed.draft === "object" ? parsed.draft : null;
        setDraft(nestedDraft ?? restoredDraft);
        if (Array.isArray(parsed.tags)) setTags(parsed.tags);
        if (Array.isArray(parsed.pins)) setPins(trimToMax(parsed.pins, 5));
        if (Array.isArray(parsed.decisions)) setDecisions(parsed.decisions);
        if (Array.isArray(parsed.actions)) setActions(parsed.actions);
        if (Array.isArray(parsed.history)) setHistory(parsed.history.slice(0, 60));
      }
    } catch {
      // Ignore invalid localStorage values.
    }
  }, [initialState, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          draft,
          tags,
          pins: trimToMax(pins, 5),
          decisions,
          actions,
          history,
          // Backward compatibility with previous NotesEditor schema:
          notes: draft.notes,
          story: draft.story,
          risks: draft.risks,
          talkingPoints: draft.talkingPoints,
        }),
      );
      setIsSaved(true);
      const timeoutId = setTimeout(() => setIsSaved(false), 900);
      return () => clearTimeout(timeoutId);
    } catch {
      // Ignore localStorage failures.
    }
  }, [draft, storageKey, tags, pins, decisions, actions, history]);

  useEffect(() => {
    const signature = JSON.stringify({ draft, tags, pins, decisions, actions });
    const now = Date.now();
    const isChanged = signature !== autoSnapshotRef.current.signature;
    const isDue = now - autoSnapshotRef.current.timestamp > 120000;

    if (isChanged && isDue) {
      const nextSnapshot = buildSnapshot();
      autoSnapshotRef.current = { signature, timestamp: now };
      setHistory((prev) => [nextSnapshot, ...prev].slice(0, 60));
    }
  }, [draft, tags, pins, decisions, actions]);

  const onChange = (key) => (event) => {
    setDraft((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onApplyTemplate = () => {
    const template = NOTE_TEMPLATES[selectedTemplate];
    if (!template) return;
    setDraft({
      notes: template.notes,
      story: template.story,
      risks: template.risks,
      talkingPoints: template.talkingPoints,
    });
  };

  const onAddTag = () => {
    const normalized = normalizeTag(tagInput);
    if (!normalized || tags.includes(normalized)) return;
    setTags((prev) => [...prev, normalized]);
    setTagInput("");
  };

  const onDeleteTag = (tag) => {
    setTags((prev) => prev.filter((item) => item !== tag));
    if (tagFilter === tag) setTagFilter("all");
  };

  const onAddPin = () => {
    const candidate = pinInput.trim();
    if (!candidate || pins.includes(candidate)) return;
    setPins((prev) => trimToMax([candidate, ...prev], 5));
    setPinInput("");
  };

  const onDeletePin = (pin) => {
    setPins((prev) => prev.filter((item) => item !== pin));
  };

  const onPinSelectedNoteText = () => {
    const textarea = notesRef.current;
    if (!textarea) return;
    const selected = textarea.value
      .slice(textarea.selectionStart, textarea.selectionEnd)
      .trim();
    if (!selected) return;
    setPins((prev) => trimToMax([selected, ...prev.filter((item) => item !== selected)], 5));
  };

  const onAddDecision = () => {
    const decisionText = decisionDraft.decision.trim();
    if (!decisionText) return;
    const nextDecision = {
      id: `decision-${Date.now()}`,
      decision: decisionText,
      why: decisionDraft.why.trim(),
      date: new Date().toISOString(),
      owner: decisionDraft.owner.trim(),
      revisitBy: decisionDraft.revisitBy,
    };
    setDecisions((prev) => [nextDecision, ...prev].slice(0, 40));
    setDecisionDraft({ decision: "", why: "", owner: "", revisitBy: "" });
  };

  const onDeleteDecision = (id) => {
    setDecisions((prev) => prev.filter((item) => item.id !== id));
  };

  const onAddAction = (overrideTitle = "") => {
    const titleText = (overrideTitle || actionDraft.title).trim();
    if (!titleText) return;
    const nextAction = {
      id: `action-${Date.now()}`,
      title: titleText,
      owner: actionDraft.owner.trim(),
      dueDate: actionDraft.dueDate,
      status: "open",
      createdAt: new Date().toISOString(),
    };
    setActions((prev) => [nextAction, ...prev].slice(0, 80));
    setActionDraft({ title: "", owner: "", dueDate: "" });
  };

  const onExtractActionFromSelection = () => {
    const textarea = notesRef.current;
    if (!textarea) return;
    const selected = textarea.value
      .slice(textarea.selectionStart, textarea.selectionEnd)
      .trim();
    if (!selected) return;
    const titleText = selected.split(/\n+/)[0].slice(0, 120);
    onAddAction(titleText);
  };

  const onToggleActionStatus = (id) => {
    setActions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === "done" ? "open" : "done" }
          : item,
      ),
    );
  };

  const onDeleteAction = (id) => {
    setActions((prev) => prev.filter((item) => item.id !== id));
  };

  const onManualSnapshot = () => {
    setHistory((prev) => [buildSnapshot(), ...prev].slice(0, 60));
    autoSnapshotRef.current = { signature: JSON.stringify({ draft, tags, pins, decisions, actions }), timestamp: Date.now() };
  };

  const onRestoreSnapshot = (entry) => {
    if (!entry) return;
    setDraft(entry.draft ?? initialState);
    setTags(Array.isArray(entry.tags) ? entry.tags : []);
    setPins(Array.isArray(entry.pins) ? trimToMax(entry.pins, 5) : []);
    setDecisions(Array.isArray(entry.decisions) ? entry.decisions : []);
    setActions(Array.isArray(entry.actions) ? entry.actions : []);
  };

  const toConcise = (text) => {
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
    return sentences.slice(0, 5).join(" ");
  };

  const toInvestorBullets = (text) => {
    const chunks = text
      .split(/\n|(?<=[.!?])\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
    return chunks.map((item) => `- ${item}`).join("\n");
  };

  const toRiskQuestionView = (text) => {
    const lines = text
      .split(/\n|(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean);
    const riskSignals = ["risk", "blocker", "concern", "dependency", "churn", "burn", "runway"];
    const risksOnly = lines.filter((line) =>
      riskSignals.some((signal) => line.toLowerCase().includes(signal)),
    );
    const questionsOnly = lines.filter((line) => line.includes("?"));
    return [
      "Risks:",
      ...(risksOnly.length ? risksOnly.map((line) => `- ${line}`) : ["- None explicitly stated"]),
      "",
      "Questions:",
      ...(questionsOnly.length ? questionsOnly.map((line) => `- ${line}`) : ["- None explicitly stated"]),
    ].join("\n");
  };

  const onRefineNotes = (mode) => {
    const current = draft.notes || "";
    if (!current.trim()) return;
    let next = current;
    if (mode === "concise") next = toConcise(current);
    if (mode === "investor") next = toInvestorBullets(current);
    if (mode === "risk_question") next = toRiskQuestionView(current);
    setDraft((prev) => ({ ...prev, notes: next }));
  };

  const downloadText = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const onExportMarkdown = () => {
    const md = [
      `# ${title}`,
      "",
      `Saved: ${new Date().toISOString()}`,
      "",
      `Tags: ${tags.join(", ") || "none"}`,
      "",
      "## Notes",
      draft.notes || "",
      "",
      "## Story",
      draft.story || "",
      "",
      "## Risks",
      draft.risks || "",
      "",
      "## Talking Points",
      draft.talkingPoints || "",
      "",
      "## Pinned Highlights",
      ...(pins.length ? pins.map((item) => `- ${item}`) : ["- none"]),
      "",
      "## Decision Log",
      ...(decisions.length
        ? decisions.map(
            (item) =>
              `- ${item.decision} | why: ${item.why || "n/a"} | owner: ${item.owner || "n/a"} | revisit: ${item.revisitBy || "n/a"}`,
          )
        : ["- none"]),
      "",
      "## Action Items",
      ...(actions.length
        ? actions.map(
            (item) =>
              `- [${item.status === "done" ? "x" : " "}] ${item.title} | owner: ${item.owner || "n/a"} | due: ${item.dueDate || "n/a"}`,
          )
        : ["- none"]),
    ].join("\n");
    downloadText("notes-editor-export.md", md, "text/markdown;charset=utf-8");
  };

  const onExportActionsCsv = () => {
    const header = "title,owner,due_date,status,created_at";
    const rows = actions.map((item) =>
      [item.title, item.owner, item.dueDate, item.status, item.createdAt]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
    downloadText(
      "notes-editor-actions.csv",
      [header, ...rows].join("\n"),
      "text/csv;charset=utf-8",
    );
  };

  const onCopyStructuredSummary = async () => {
    const openActions = actions.filter((item) => item.status !== "done").length;
    const summary = [
      `${title}`,
      `Tags: ${tags.join(", ") || "none"}`,
      `Pins: ${pins.length}`,
      `Decisions: ${decisions.length}`,
      `Open actions: ${openActions}`,
      "",
      "Top highlights:",
      ...(pins.length ? pins.map((item) => `- ${item}`) : ["- none"]),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(summary);
    } catch {
      // Clipboard API may be blocked in some contexts.
    }
  };

  const allKnownTags = useMemo(() => {
    const set = new Set(tags);
    history.forEach((entry) => {
      (entry.tags || []).forEach((tag) => set.add(tag));
    });
    return Array.from(set).sort();
  }, [tags, history]);

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    return history.filter((entry) => {
      const byTag = tagFilter === "all" || (entry.tags || []).includes(tagFilter);
      if (!byTag) return false;
      if (!query) return true;

      const combined = [
        entry.draft?.notes,
        entry.draft?.story,
        entry.draft?.risks,
        entry.draft?.talkingPoints,
        ...(entry.pins || []),
        ...(entry.decisions || []).map((item) => `${item.decision} ${item.why}`),
        ...(entry.actions || []).map((item) => item.title),
      ]
        .join(" ")
        .toLowerCase();
      return combined.includes(query);
    });
  }, [history, historyQuery, tagFilter]);

  const openActionCount = actions.filter((item) => item.status !== "done").length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {isSaved ? "Saved locally" : "Editing"}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {NOTES_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "po-primary-btn capitalize" : "po-secondary-btn capitalize"}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="sticky top-0 z-10 mt-3 grid gap-2 rounded-md border border-border/70 bg-background p-3 text-xs text-muted-foreground md:grid-cols-4">
        <p>Status: {isSaved ? "Saved locally" : "Editing"}</p>
        <p>Tags: {tags.length}</p>
        <p>Pins: {pins.length}</p>
        <p>Open actions: {openActionCount}</p>
      </div>

      {activeTab === "write" && (
        <>
      <div className="mt-3 rounded-md border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Meeting Note Templates</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={selectedTemplate}
            onChange={(event) => setSelectedTemplate(event.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            {Object.entries(NOTE_TEMPLATES).map(([key, entry]) => (
              <option key={key} value={key}>
                {entry.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onApplyTemplate}
            className="po-primary-btn h-8 px-3"
          >
            Apply Template
          </button>
          <button
            type="button"
            onClick={onManualSnapshot}
            className="h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground hover:bg-muted"
          >
            Save Snapshot
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Tags and Filter</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onAddTag();
            }}
            placeholder="Add tag (e.g. investor, deck, todo)"
            className="h-8 min-w-[220px] rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
          <button
            type="button"
            onClick={onAddTag}
            className="po-primary-btn h-8 px-3"
          >
            Add Tag
          </button>
          <select
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            <option value="all">Filter: all tags</option>
            {allKnownTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.length ? (
            tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onDeleteTag(tag)}
                className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-foreground hover:bg-muted"
              >
                #{tag} x
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No tags added yet.</p>
          )}
        </div>
      </div>

      <label className="mt-3 block text-xs text-muted-foreground">
        Notes
        <textarea
          ref={notesRef}
          value={draft.notes}
          onChange={onChange("notes")}
          placeholder="Jot thoughts, feedback, and next actions..."
          className="mt-1 h-28 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
        />
      </label>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onPinSelectedNoteText}
          className="po-primary-btn"
        >
          Pin Selected Text
        </button>
        <button
          type="button"
          onClick={onExtractActionFromSelection}
          className="po-primary-btn"
        >
          Extract Action
        </button>
        <button
          type="button"
          onClick={() => onRefineNotes("concise")}
          className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
        >
          Make Concise
        </button>
        <button
          type="button"
          onClick={() => onRefineNotes("investor")}
          className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
        >
          Investor Bullets
        </button>
        <button
          type="button"
          onClick={() => onRefineNotes("risk_question")}
          className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
        >
          Extract Risks and Questions
        </button>
      </div>

      {showSections && (
        <div className="mt-3 space-y-3">
          <label className="block text-xs text-muted-foreground">
            Story
            <textarea
              value={draft.story}
              onChange={onChange("story")}
              placeholder="Narrative: problem, insight, and why now..."
              className="mt-1 h-20 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
            />
          </label>

          <label className="block text-xs text-muted-foreground">
            Risks
            <textarea
              value={draft.risks}
              onChange={onChange("risks")}
              placeholder="List key risks and mitigation strategies..."
              className="mt-1 h-20 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
            />
          </label>

          <label className="block text-xs text-muted-foreground">
            Talking Points
            <textarea
              value={draft.talkingPoints}
              onChange={onChange("talkingPoints")}
              placeholder="Important points for investor conversations..."
              className="mt-1 h-20 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
            />
          </label>
        </div>
      )}
        </>
      )}

      {activeTab === "ops" && (
        <>
      <div className="mt-4 rounded-md border border-border/70 bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Pinned Highlights (Top 5)</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={pinInput}
              onChange={(event) => setPinInput(event.target.value)}
              placeholder="Add highlight manually"
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            />
            <button
              type="button"
              onClick={onAddPin}
              className="po-primary-btn h-8 px-3"
            >
              Add Highlight
            </button>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          {pins.length ? (
            pins.map((pin) => (
              <div key={pin} className="flex items-start justify-between gap-2 rounded-md border border-border/60 p-2">
                <p className="text-xs text-foreground">{pin}</p>
                <button
                  type="button"
                  onClick={() => onDeletePin(pin)}
                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No highlights pinned yet.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Decision Log</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input
            type="text"
            value={decisionDraft.decision}
            onChange={(event) =>
              setDecisionDraft((prev) => ({ ...prev, decision: event.target.value }))
            }
            placeholder="Decision"
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
          <input
            type="text"
            value={decisionDraft.why}
            onChange={(event) => setDecisionDraft((prev) => ({ ...prev, why: event.target.value }))}
            placeholder="Why"
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
          <input
            type="text"
            value={decisionDraft.owner}
            onChange={(event) => setDecisionDraft((prev) => ({ ...prev, owner: event.target.value }))}
            placeholder="Owner"
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
          <input
            type="date"
            value={decisionDraft.revisitBy}
            onChange={(event) =>
              setDecisionDraft((prev) => ({ ...prev, revisitBy: event.target.value }))
            }
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
        </div>
        <button
          type="button"
          onClick={onAddDecision}
          className="mt-2 po-primary-btn h-8 px-3"
        >
          Add Decision
        </button>
        <div className="mt-2 space-y-1">
          {decisions.length ? (
            decisions.map((item) => (
              <div key={item.id} className="rounded-md border border-border/60 px-2 py-1 text-xs text-foreground">
                <p>{item.decision}</p>
                <p className="text-muted-foreground">
                  Why: {item.why || "n/a"} | Owner: {item.owner || "n/a"} | Date: {new Date(item.date).toLocaleDateString()} | Revisit: {item.revisitBy || "n/a"}
                </p>
                <button
                  type="button"
                  onClick={() => onDeleteDecision(item.id)}
                  className="mt-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  Delete
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No decisions logged yet.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-border/70 bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Action Items ({openActionCount} open)</p>
          <button
            type="button"
            onClick={onExportActionsCsv}
            className="h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground hover:bg-muted"
          >
            Export Actions CSV
          </button>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <input
            type="text"
            value={actionDraft.title}
            onChange={(event) => setActionDraft((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Action title"
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
          <input
            type="text"
            value={actionDraft.owner}
            onChange={(event) => setActionDraft((prev) => ({ ...prev, owner: event.target.value }))}
            placeholder="Owner"
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
          <input
            type="date"
            value={actionDraft.dueDate}
            onChange={(event) => setActionDraft((prev) => ({ ...prev, dueDate: event.target.value }))}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          />
        </div>
        <button
          type="button"
          onClick={() => onAddAction()}
          className="mt-2 po-primary-btn h-8 px-3"
        >
          Add Action
        </button>
        <div className="mt-2 space-y-1">
          {actions.length ? (
            actions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-2 py-1 text-xs text-foreground">
                <p>
                  [{item.status === "done" ? "DONE" : "OPEN"}] {item.title} | Owner: {item.owner || "n/a"} | Due: {item.dueDate || "n/a"}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleActionStatus(item.id)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    {item.status === "done" ? "Reopen" : "Mark Done"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteAction(item.id)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No action items yet.</p>
          )}
        </div>
      </div>
        </>
      )}

      {activeTab === "history" && (
        <div className="mt-4 rounded-md border border-border/70 bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">History and Search</p>
          <p className="text-xs text-muted-foreground">Snapshots: {history.length}</p>
        </div>
        <input
          type="text"
          value={historyQuery}
          onChange={(event) => setHistoryQuery(event.target.value)}
          placeholder="Search historical notes, decisions, actions..."
          className="mt-2 h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
        />
        <div className="mt-2 space-y-1">
          {filteredHistory.length ? (
            filteredHistory.slice(0, 10).map((entry) => (
              <div key={entry.id} className="rounded-md border border-border/60 p-2 text-xs text-foreground">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p>{new Date(entry.createdAt).toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => onRestoreSnapshot(entry)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                  >
                    Restore
                  </button>
                </div>
                <p className="text-muted-foreground">
                  {(entry.draft?.notes || "").slice(0, 120) || "No notes text"}...
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No snapshots match your filter.</p>
          )}
        </div>
        </div>
      )}

      {activeTab === "exports" && (
        <div className="mt-4 rounded-md border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Exports</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportMarkdown}
            className="po-primary-btn h-8 px-3"
          >
            Export Markdown
          </button>
          <button
            type="button"
            onClick={onCopyStructuredSummary}
            className="po-secondary-btn h-8 px-3"
          >
            Copy Structured Summary
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
