# NotesEditor Feature Upgrade Summary

This update adds eight note-taking and execution features to `src/components/custom/NotesEditor.jsx`:

1. Tagging + Filtering
- Added note-level tagging (`add/remove`) and a history tag filter.
- Added unified known-tag list derived from current note and historical snapshots.

2. Decision Log
- Added structured decision capture with:
  - `Decision`
  - `Why`
  - `Date` (auto timestamp)
  - `Owner`
  - `Revisit by`
- Added delete support for decision records.

3. Action Item Extractor
- Added manual action creation (`title`, `owner`, `due date`, `status`).
- Added one-click extraction from selected note text into action items.
- Added open/done state toggle and delete support.

4. Meeting Note Template Mode
- Added template selector with one-click apply:
  - `Investor Call`
  - `Partner Meeting`
  - `Weekly Review`
- Each template pre-fills `notes`, `story`, `risks`, and `talkingPoints`.

5. Pin / Highlight Critical Notes
- Added pinning from selected note text.
- Added manual highlight input.
- Added capped “Top 5” pinned highlights panel with remove actions.

6. Search Across Historical Entries
- Added snapshot history for timestamped note versions (manual + timed auto snapshot).
- Added full-text history search across note fields, pinned highlights, decisions, and actions.
- Added one-click snapshot restore.

7. Export Options
- Added Markdown export for full note package.
- Added CSV export for action items.
- Added copy-to-clipboard structured summary.

8. Prompt-to-Refine
- Added quick transformations on notes:
  - `Make Concise`
  - `Investor Bullets`
  - `Extract Risks and Questions`

Additional implementation details
- Preserved backward compatibility with the previous storage shape by still writing legacy top-level keys (`notes`, `story`, `risks`, `talkingPoints`) while storing the richer new schema.
- Added persistent local storage for all new entities (`tags`, `pins`, `decisions`, `actions`, `history`) under `pitchops_notes_editor`.

# QASimulator Feature Upgrade Summary

This update adds eight Q&A-specific capabilities to `src/components/custom/QASimulator.jsx`:

1. Investor Persona Mode
- Added persona selector with behavior profiles:
  - `Balanced Investor`
  - `Skeptical VC`
  - `Friendly Angel`
  - `Enterprise CFO`
- Persona selection now changes scoring strictness and coaching tone.

2. Adaptive Follow-Up Questions
- Added dynamic follow-up generation after each answer.
- Follow-ups adapt to detected weaknesses such as unsupported claims, weak specificity, missing metrics, and evasive phrasing.

3. Live Timing + Brevity Coach
- Added live response timer for each question.
- Added timing and brevity coaching messages (too short, too long, or balanced).

4. Claim-Proof Detector
- Added claim extraction and proof-signal matching.
- Added unsupported claim detection and coaching feedback when claims are not backed by evidence.

5. Evasion and Jargon Penalties
- Added detection for evasive phrases and buzzwords.
- Added explicit score penalties and corrective guidance for non-answers and jargon-heavy responses.

6. Objection Rebuttal Drill
- Added generated investor objection after answer scoring.
- Added rebuttal input and a dedicated rebuttal scoring flow with targeted feedback.

7. Question Heatmap and Weakness Trends
- Added historical attempt tracking by question category.
- Added heatmap-style category summary with average score, attempt count, and top recurring weakness.
- Added weakest-category highlight.

8. Answer Version Compare
- Added per-question attempt history.
- Added latest-vs-previous comparison including score delta and word-count delta.

Additional implementation details
- Added question normalization to support both string and object question formats.
- Added local persistence for persona and attempt history via `localStorage` (`pitchops_qa_simulator_v2`).
- Added richer score-analysis metadata to support coaching, follow-ups, heatmap, and rebuttal workflows.

# KPIDashboard Feature Upgrade Summary

This update adds eight KPI-specific capabilities to `src/components/custom/KPIDashboard.jsx`:

1. Historical trend views (7d / 30d / 90d)
- Added selectable trend windows (`7d`, `30d`, `90d`) for core KPIs.
- Added mini-sparklines for revenue, active users, churn rate, and burn rate.
- Added period-over-period delta percentages for each trend series.

2. Target and variance tracking
- Added per-metric target values for key KPIs (revenue, growth, users, churn, burn, runway).
- Added variance display (`actual - target`) with directional status color logic.
- Added target adjustment sliders in the control panel.

3. Unit economics panel
- Added derived investor metrics:
  - ARPU
  - LTV
  - LTV:CAC
  - CAC payback period
  - Magic Number
- Added supporting controls for CAC, gross margin, and sales/marketing spend.

4. Runway scenario modeling
- Added scenario simulation for `Base`, `Best`, and `Worst` cases.
- Scenario runway projections are calculated from cash, revenue, growth, churn, and burn assumptions.
- Displays modeled runway months per scenario.

5. Revenue concentration and risk indicators
- Added top-customer concentration metric.
- Added concentration risk tier (`Low`, `Medium`, `High`) evaluation.
- Added single-point-failure detection messages for concentration, weak pipeline, and NDR underperformance.

6. Leading indicators panel
- Added leading metrics:
  - Activation rate
  - Expansion revenue %
  - Pipeline coverage
  - Net dollar retention
- Added target/threshold-aware status coloring for key leading indicators.

7. Alert rules and watchlist
- Added configurable alert rules for:
  - Max churn rate
  - Min runway months
  - Min NDR
  - Min pipeline coverage
  - Max top-customer concentration
- Added computed watchlist states (`HEALTHY`, `WARNING`, `AT RISK`) based on current KPI values.

8. Data quality and metric confidence states
- Added metric-level confidence badges (`verified`, `partial`, `estimated`) for core KPI cards.
- Added global last-updated timestamp display and manual timestamp refresh action.
- Metric updates now refresh last-updated state automatically.

# PitchChecklist Feature Upgrade Summary (Update)

This update adds eight pitch-specific capabilities to `src/components/custom/PitchChecklist.jsx`:

1. Section readiness gates
- Added `Problem`, `Solution`, `GTM`, `Financials`, and `Ask` sections.
- Added per-section pass/fail gates that require required checklist items to be completed before passing.

2. Dependency logic between checklist items
- Added item-level dependency support with `dependsOn`.
- Blocked dependent items until prerequisite items are completed.
- Unchecking prerequisite items cascades and unchecks dependents.

3. Audience mode templates
- Added audience templates:
  - `Angel`
  - `Seed VC`
  - `Enterprise Buyer`
  - `Accelerator Demo Day`
- Switching audience regenerates an audience-specific checklist structure.

4. Time-budget tracker per section
- Added per-section time budget controls (seconds).
- Added global target duration control (minutes).
- Added total planned time vs target display and blocker when over target.

5. Evidence/link attachment per checklist item
- Added per-item evidence field for slide references, URLs, or source notes.

6. Risk flags and red-team prompts
- Added per-item red-team risk field to capture likely investor objections.

7. Rehearsal run log
- Added rehearsal start/stop tracking.
- Logged run timestamp, duration, completion percentage, and missed sections.
- Added consistency trend summary based on recent runs.

8. Go/No-Go score
- Added weighted readiness score from completion, evidence coverage, risk coverage, and gate coverage.
- Added blocker list for missing required work and timing/readiness gaps.

Additional implementation details
- Added local persistence for checklist state (`audience`, `sections`, `rehearsalLog`, `targetMinutes`) using `localStorage`.
- Preserved compatibility by normalizing legacy flat `items` input into a single `General` section.
