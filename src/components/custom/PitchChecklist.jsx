import { useEffect, useMemo, useState } from "react";

const AUDIENCE_TEMPLATES = {
  angel: {
    label: "Angel",
    sections: [
      {
        id: "problem",
        label: "Problem",
        timeBudgetSec: 45,
        items: [
          { id: "problem-pain", label: "Pain is specific and frequent", dependsOn: [] },
          { id: "problem-user", label: "Target user is tightly defined", dependsOn: [] },
        ],
      },
      {
        id: "solution",
        label: "Solution",
        timeBudgetSec: 60,
        items: [
          { id: "solution-demo", label: "Demo is stable and simple", dependsOn: [] },
          { id: "solution-diff", label: "Differentiation is obvious", dependsOn: ["problem-pain"] },
        ],
      },
      {
        id: "gtm",
        label: "GTM",
        timeBudgetSec: 50,
        items: [
          { id: "gtm-channel", label: "Primary channel is named", dependsOn: [] },
          { id: "gtm-cost", label: "Acquisition cost assumptions are stated", dependsOn: ["gtm-channel"] },
        ],
      },
      {
        id: "financials",
        label: "Financials",
        timeBudgetSec: 45,
        items: [
          { id: "fin-revenue", label: "Revenue model is clear", dependsOn: [] },
          { id: "fin-runway", label: "Runway scenario is quantified", dependsOn: [] },
        ],
      },
      {
        id: "ask",
        label: "Ask",
        timeBudgetSec: 40,
        items: [
          { id: "ask-use", label: "Use of funds is line-item specific", dependsOn: ["fin-runway"] },
          { id: "ask-amount", label: "Ask amount and milestone plan are clear", dependsOn: ["ask-use"] },
        ],
      },
    ],
  },
  seed_vc: {
    label: "Seed VC",
    sections: [
      {
        id: "problem",
        label: "Problem",
        timeBudgetSec: 40,
        items: [
          { id: "svc-problem-pain", label: "Pain is urgent and expensive", dependsOn: [] },
          { id: "svc-problem-segment", label: "Initial wedge segment is defensible", dependsOn: [] },
        ],
      },
      {
        id: "solution",
        label: "Solution",
        timeBudgetSec: 55,
        items: [
          { id: "svc-solution-demo", label: "Demo proves key workflow", dependsOn: [] },
          { id: "svc-solution-moat", label: "Moat thesis is explicit", dependsOn: ["svc-solution-demo"] },
        ],
      },
      {
        id: "gtm",
        label: "GTM",
        timeBudgetSec: 55,
        items: [
          { id: "svc-gtm-motion", label: "Distribution motion is chosen", dependsOn: [] },
          { id: "svc-gtm-loop", label: "Repeatable growth loop is defined", dependsOn: ["svc-gtm-motion"] },
        ],
      },
      {
        id: "financials",
        label: "Financials",
        timeBudgetSec: 45,
        items: [
          { id: "svc-fin-cohort", label: "Cohort or retention proof is shown", dependsOn: [] },
          { id: "svc-fin-runway", label: "18-month runway plan is modeled", dependsOn: [] },
        ],
      },
      {
        id: "ask",
        label: "Ask",
        timeBudgetSec: 45,
        items: [
          { id: "svc-ask-usage", label: "Capital allocation by function is clear", dependsOn: ["svc-fin-runway"] },
          { id: "svc-ask-milestones", label: "Milestones map to next raise", dependsOn: ["svc-ask-usage"] },
        ],
      },
    ],
  },
  enterprise_buyer: {
    label: "Enterprise Buyer",
    sections: [
      {
        id: "problem",
        label: "Problem",
        timeBudgetSec: 40,
        items: [
          { id: "eb-problem-cost", label: "Current process cost is quantified", dependsOn: [] },
          { id: "eb-problem-owner", label: "Economic buyer is identified", dependsOn: [] },
        ],
      },
      {
        id: "solution",
        label: "Solution",
        timeBudgetSec: 65,
        items: [
          { id: "eb-solution-roi", label: "Time-to-value is measurable", dependsOn: [] },
          { id: "eb-solution-integrations", label: "Integration plan is realistic", dependsOn: ["eb-solution-roi"] },
        ],
      },
      {
        id: "gtm",
        label: "GTM",
        timeBudgetSec: 45,
        items: [
          { id: "eb-gtm-sales", label: "Sales cycle map is clear", dependsOn: [] },
          { id: "eb-gtm-pilot", label: "Pilot-to-rollout path is defined", dependsOn: ["eb-gtm-sales"] },
        ],
      },
      {
        id: "financials",
        label: "Financials",
        timeBudgetSec: 40,
        items: [
          { id: "eb-fin-pricing", label: "Pricing model is defensible", dependsOn: [] },
          { id: "eb-fin-support", label: "Delivery/support costs are covered", dependsOn: [] },
        ],
      },
      {
        id: "ask",
        label: "Ask",
        timeBudgetSec: 35,
        items: [
          { id: "eb-ask-next", label: "Decision request is explicit", dependsOn: ["eb-solution-integrations"] },
          { id: "eb-ask-procurement", label: "Procurement blockers are preempted", dependsOn: ["eb-ask-next"] },
        ],
      },
    ],
  },
  accelerator_demo_day: {
    label: "Accelerator Demo Day",
    sections: [
      {
        id: "problem",
        label: "Problem",
        timeBudgetSec: 35,
        items: [
          { id: "ad-problem-hook", label: "Opening hook lands in 10 seconds", dependsOn: [] },
          { id: "ad-problem-stakes", label: "Stakes are memorable", dependsOn: [] },
        ],
      },
      {
        id: "solution",
        label: "Solution",
        timeBudgetSec: 55,
        items: [
          { id: "ad-solution-demo", label: "Live or recorded demo is crisp", dependsOn: [] },
          { id: "ad-solution-proof", label: "Proof point follows the demo", dependsOn: ["ad-solution-demo"] },
        ],
      },
      {
        id: "gtm",
        label: "GTM",
        timeBudgetSec: 40,
        items: [
          { id: "ad-gtm-now", label: "Why-now narrative is sharp", dependsOn: [] },
          { id: "ad-gtm-channel", label: "Main growth channel is specific", dependsOn: [] },
        ],
      },
      {
        id: "financials",
        label: "Financials",
        timeBudgetSec: 35,
        items: [
          { id: "ad-fin-traction", label: "Traction headline has numbers", dependsOn: [] },
          { id: "ad-fin-runway", label: "Burn and runway are investor-ready", dependsOn: [] },
        ],
      },
      {
        id: "ask",
        label: "Ask",
        timeBudgetSec: 35,
        items: [
          { id: "ad-ask-amount", label: "Raise amount is stated confidently", dependsOn: ["ad-fin-runway"] },
          { id: "ad-ask-cta", label: "Clear post-pitch CTA is included", dependsOn: ["ad-ask-amount"] },
        ],
      },
    ],
  },
};

const DEFAULT_AUDIENCE = "seed_vc";

function cloneTemplate(audienceKey) {
  const template = AUDIENCE_TEMPLATES[audienceKey] ?? AUDIENCE_TEMPLATES[DEFAULT_AUDIENCE];
  return template.sections.map((section) => ({
    id: section.id,
    label: section.label,
    timeBudgetSec: section.timeBudgetSec,
    gatePassed: false,
    items: section.items.map((item) => ({
      id: item.id,
      label: item.label,
      checked: false,
      required: true,
      dependsOn: item.dependsOn ?? [],
      evidence: "",
      redTeamRisk: "",
    })),
  }));
}

function normalizeFlatItems(items) {
  return [
    {
      id: "general",
      label: "General",
      timeBudgetSec: 120,
      gatePassed: false,
      items: items.map((item, index) => ({
        id: `legacy-${index}`,
        label: item.label,
        checked: Boolean(item.checked),
        required: true,
        dependsOn: [],
        evidence: "",
        redTeamRisk: "",
      })),
    },
  ];
}

function formatSeconds(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function resolveDependentIds(sections, sourceId) {
  const dependents = [];
  const queue = [sourceId];

  while (queue.length) {
    const current = queue.shift();
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.dependsOn.includes(current) && !dependents.includes(item.id)) {
          dependents.push(item.id);
          queue.push(item.id);
        }
      });
    });
  }

  return dependents;
}

export function PitchChecklist({
  items,
  storageKey = "pitchops_pitch_checklist_v2",
  targetDurationMin = 5,
}) {
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE);
  const [sections, setSections] = useState(() => {
    if (Array.isArray(items) && items.length) return normalizeFlatItems(items);
    return cloneTemplate(DEFAULT_AUDIENCE);
  });
  const [newPointBySection, setNewPointBySection] = useState({});
  const [targetMinutes, setTargetMinutes] = useState(targetDurationMin);
  const [isRehearsing, setIsRehearsing] = useState(false);
  const [runStartedAt, setRunStartedAt] = useState(null);
  const [rehearsalLog, setRehearsalLog] = useState([]);

  useEffect(() => {
    if (Array.isArray(items) && items.length) {
      setSections(normalizeFlatItems(items));
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.audience && AUDIENCE_TEMPLATES[parsed.audience]) setAudience(parsed.audience);
      if (Array.isArray(parsed.sections) && parsed.sections.length) setSections(parsed.sections);
      if (Array.isArray(parsed.rehearsalLog)) setRehearsalLog(parsed.rehearsalLog);
      if (parsed.targetMinutes) setTargetMinutes(parsed.targetMinutes);
    } catch {
      // ignore invalid storage
    }
  }, [items, storageKey]);

  useEffect(() => {
    if (Array.isArray(items) && items.length) return;

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ audience, sections, rehearsalLog, targetMinutes }),
      );
    } catch {
      // ignore storage failures
    }
  }, [audience, sections, rehearsalLog, storageKey, targetMinutes, items]);

  const itemMap = useMemo(() => {
    const map = new Map();
    sections.forEach((section) => {
      section.items.forEach((item) => map.set(item.id, item));
    });
    return map;
  }, [sections]);

  const totals = useMemo(() => {
    const allItems = sections.flatMap((section) => section.items);
    const checkedItems = allItems.filter((item) => item.checked);
    const evidenceCovered = checkedItems.filter((item) => item.evidence.trim()).length;
    const riskCovered = checkedItems.filter((item) => item.redTeamRisk.trim()).length;
    const totalSections = sections.length || 1;
    const gatePassed = sections.filter((section) => section.gatePassed).length;
    const completionPct = allItems.length
      ? Math.round((checkedItems.length / allItems.length) * 100)
      : 0;

    const completionScore = allItems.length ? (checkedItems.length / allItems.length) * 45 : 0;
    const evidenceScore = checkedItems.length ? (evidenceCovered / checkedItems.length) * 20 : 0;
    const riskScore = checkedItems.length ? (riskCovered / checkedItems.length) * 20 : 0;
    const gateScore = (gatePassed / totalSections) * 15;
    const readinessScore = Math.round(completionScore + evidenceScore + riskScore + gateScore);

    return {
      allItems,
      checkedItems,
      evidenceCovered,
      riskCovered,
      gatePassed,
      completionPct,
      readinessScore,
    };
  }, [sections]);

  const totalBudgetSec = useMemo(
    () => sections.reduce((sum, section) => sum + Number(section.timeBudgetSec || 0), 0),
    [sections],
  );

  const blockers = useMemo(() => {
    const list = [];

    sections.forEach((section) => {
      const incompleteRequired = section.items.filter((item) => item.required && !item.checked);
      if (incompleteRequired.length) {
        list.push(`${section.label}: ${incompleteRequired.length} required items incomplete`);
      }
      if (!section.gatePassed) {
        list.push(`${section.label}: readiness gate not passed`);
      }
    });

    const checkedWithoutEvidence = totals.checkedItems.filter((item) => !item.evidence.trim());
    if (checkedWithoutEvidence.length) {
      list.push(`${checkedWithoutEvidence.length} completed points are missing evidence links`);
    }

    const checkedWithoutRisk = totals.checkedItems.filter((item) => !item.redTeamRisk.trim());
    if (checkedWithoutRisk.length) {
      list.push(`${checkedWithoutRisk.length} completed points are missing red-team risks`);
    }

    const targetSeconds = Number(targetMinutes) * 60;
    if (totalBudgetSec > targetSeconds) {
      list.push(`Time budget exceeds target by ${formatSeconds(totalBudgetSec - targetSeconds)}`);
    }

    return list;
  }, [sections, totals.checkedItems, totalBudgetSec, targetMinutes]);

  const rehearsalTrend = useMemo(() => {
    if (rehearsalLog.length < 2) return "Need at least 2 runs to show trend";
    const latest = rehearsalLog[0].completionPct;
    const previousAverage =
      rehearsalLog.slice(1).reduce((sum, run) => sum + run.completionPct, 0) /
      (rehearsalLog.length - 1);
    const delta = Math.round(latest - previousAverage);

    if (delta >= 5) return `Improving (+${delta} points vs prior average)`;
    if (delta <= -5) return `Declining (${delta} points vs prior average)`;
    return "Stable (within +/-4 points of prior average)";
  }, [rehearsalLog]);

  const onAudienceChange = (event) => {
    const nextAudience = event.target.value;
    setAudience(nextAudience);
    setSections(cloneTemplate(nextAudience));
    setNewPointBySection({});
  };

  const updateSection = (sectionId, updater) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const nextSection = updater(section);
        const allRequiredDone = nextSection.items.every((item) => !item.required || item.checked);
        return {
          ...nextSection,
          gatePassed: allRequiredDone ? nextSection.gatePassed : false,
        };
      }),
    );
  };

  const onToggleItem = (sectionId, itemId) => {
    setSections((prev) => {
      const sourceItem = prev.flatMap((section) => section.items).find((item) => item.id === itemId);
      if (!sourceItem) return prev;

      if (!sourceItem.checked) {
        const blocked = sourceItem.dependsOn.some((dependencyId) => !itemMap.get(dependencyId)?.checked);
        if (blocked) return prev;
      }

      const shouldUncheckDependents = sourceItem.checked;
      const dependentIds = shouldUncheckDependents ? resolveDependentIds(prev, itemId) : [];

      return prev.map((section) => {
        const nextItems = section.items.map((item) => {
          if (item.id === itemId) return { ...item, checked: !item.checked };
          if (dependentIds.includes(item.id)) return { ...item, checked: false };
          return item;
        });

        const allRequiredDone = nextItems.every((item) => !item.required || item.checked);
        return {
          ...section,
          items: nextItems,
          gatePassed: allRequiredDone ? section.gatePassed : false,
        };
      });
    });
  };

  const onDeletePoint = (sectionId, itemId) => {
    updateSection(sectionId, (section) => ({
      ...section,
      items: section.items.filter((item) => item.id !== itemId),
    }));
  };

  const onAddPoint = (sectionId) => {
    const label = (newPointBySection[sectionId] ?? "").trim();
    if (!label) return;

    updateSection(sectionId, (section) => ({
      ...section,
      items: [
        ...section.items,
        {
          id: `${sectionId}-${Date.now()}`,
          label,
          checked: false,
          required: true,
          dependsOn: [],
          evidence: "",
          redTeamRisk: "",
        },
      ],
    }));

    setNewPointBySection((prev) => ({ ...prev, [sectionId]: "" }));
  };

  const onUpdateItemField = (sectionId, itemId, key, value) => {
    updateSection(sectionId, (section) => ({
      ...section,
      items: section.items.map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
    }));
  };

  const onUpdateSectionTime = (sectionId, value) => {
    const seconds = Math.max(0, Number(value) || 0);
    updateSection(sectionId, (section) => ({ ...section, timeBudgetSec: seconds }));
  };

  const onToggleGate = (sectionId) => {
    updateSection(sectionId, (section) => {
      const allRequiredDone = section.items.every((item) => !item.required || item.checked);
      if (!allRequiredDone) return section;
      return { ...section, gatePassed: !section.gatePassed };
    });
  };

  const onStartRun = () => {
    setIsRehearsing(true);
    setRunStartedAt(Date.now());
  };

  const onStopRun = () => {
    if (!runStartedAt) return;
    const durationSec = Math.max(1, Math.round((Date.now() - runStartedAt) / 1000));
    const missedSections = sections.filter((section) => !section.gatePassed).map((section) => section.label);

    const run = {
      id: `run-${Date.now()}`,
      date: new Date().toISOString(),
      durationSec,
      missedSections,
      completionPct: totals.completionPct,
    };

    setRehearsalLog((prev) => [run, ...prev].slice(0, 12));
    setIsRehearsing(false);
    setRunStartedAt(null);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-card-foreground">Pitch Checklist</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Audience</span>
          <select
            value={audience}
            onChange={onAudienceChange}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            {Object.entries(AUDIENCE_TEMPLATES).map(([key, entry]) => (
              <option key={key} value={key}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground md:grid-cols-4">
        <p>Ready items: {totals.checkedItems.length}/{totals.allItems.length}</p>
        <p>Gates passed: {totals.gatePassed}/{sections.length}</p>
        <p>Evidence coverage: {totals.evidenceCovered}/{totals.checkedItems.length || 0}</p>
        <p>Red-team coverage: {totals.riskCovered}/{totals.checkedItems.length || 0}</p>
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Time Budget Tracker</p>
          <label className="text-xs text-muted-foreground">
            Target minutes
            <input
              type="number"
              min="1"
              value={targetMinutes}
              onChange={(event) => setTargetMinutes(Math.max(1, Number(event.target.value) || 1))}
              className="ml-2 h-8 w-16 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            />
          </label>
        </div>
        <p className="mt-2 text-sm text-foreground">
          Planned duration {formatSeconds(totalBudgetSec)} / Target {formatSeconds(Number(targetMinutes) * 60)}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {sections.map((section) => {
          const allRequiredDone = section.items.every((item) => !item.required || item.checked);
          return (
            <div key={section.id} className="rounded-lg border border-border/70 bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{section.label}</p>
                  <p className="text-xs text-muted-foreground">
                    Gate: {section.gatePassed ? "Passed" : "Not passed"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">
                    Section sec
                    <input
                      type="number"
                      min="0"
                      value={section.timeBudgetSec}
                      onChange={(event) => onUpdateSectionTime(section.id, event.target.value)}
                      className="ml-2 h-8 w-20 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!allRequiredDone}
                    onClick={() => onToggleGate(section.id)}
                    className="h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
                  >
                    {section.gatePassed ? "Mark Fail" : "Mark Pass"}
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {section.items.map((item) => {
                  const isBlocked = item.dependsOn.some((dependencyId) => !itemMap.get(dependencyId)?.checked);
                  return (
                    <div key={item.id} className="rounded-md border border-border/60 p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="checkbox"
                          checked={Boolean(item.checked)}
                          disabled={!item.checked && isBlocked}
                          onChange={() => onToggleItem(section.id, item.id)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="flex-1 text-sm text-foreground">{item.label}</span>
                        {isBlocked && (
                          <span className="text-[11px] text-amber-600">Dependency required</span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeletePoint(section.id, item.id)}
                          className="rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        <input
                          type="text"
                          value={item.evidence}
                          onChange={(event) =>
                            onUpdateItemField(section.id, item.id, "evidence", event.target.value)
                          }
                          placeholder="Evidence link, slide, or source"
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                        />
                        <input
                          type="text"
                          value={item.redTeamRisk}
                          onChange={(event) =>
                            onUpdateItemField(section.id, item.id, "redTeamRisk", event.target.value)
                          }
                          placeholder="Red-team risk: what would investors challenge?"
                          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newPointBySection[section.id] ?? ""}
                  onChange={(event) =>
                    setNewPointBySection((prev) => ({ ...prev, [section.id]: event.target.value }))
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onAddPoint(section.id);
                  }}
                  placeholder={`Add point to ${section.label}...`}
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
                />
                <button
                  type="button"
                  onClick={() => onAddPoint(section.id)}
                  className="h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground hover:bg-muted"
                >
                  Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Rehearsal Run Log</p>
          <button
            type="button"
            onClick={isRehearsing ? onStopRun : onStartRun}
            className="h-8 rounded-md border border-border bg-background px-3 text-xs text-foreground hover:bg-muted"
          >
            {isRehearsing ? "Stop Run" : "Start Run"}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Consistency trend: {rehearsalTrend}</p>
        <div className="mt-2 space-y-1">
          {rehearsalLog.length ? (
            rehearsalLog.map((run) => (
              <div key={run.id} className="rounded-md border border-border/60 px-2 py-1 text-xs text-foreground">
                {new Date(run.date).toLocaleString()} | {formatSeconds(run.durationSec)} | Completion {run.completionPct}% | Missed: {run.missedSections.join(", ") || "None"}
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No rehearsal runs logged yet.</p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Go/No-Go Score</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{totals.readinessScore}% readiness</p>
        <p className="text-xs text-muted-foreground">
          {totals.readinessScore >= 80 ? "Go" : "No-Go"} threshold at 80%
        </p>
        <div className="mt-2 space-y-1">
          {blockers.length ? (
            blockers.slice(0, 4).map((blocker, index) => (
              <p key={`${blocker}-${index}`} className="text-xs text-amber-700">
                {blocker}
              </p>
            ))
          ) : (
            <p className="text-xs text-emerald-700">No critical blockers.</p>
          )}
        </div>
      </div>
    </div>
  );
}
