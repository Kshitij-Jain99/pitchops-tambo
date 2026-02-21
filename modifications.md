# UI Modifications Summary

## 1. Mobile workspace switcher
- Added a mobile-only stage switch (`Canvas` / `Chat`) in `src/App.jsx` to avoid stacked half-height panels.
- Added responsive visibility logic with `MOBILE_BREAKPOINT = 900` so only one workspace panel is shown at a time on smaller screens.
- Added mobile styling hooks in `src/App.css`:
  - `.mobile-stage-switcher`
  - `.is-hidden-mobile`

## 2. Unified visual tokens and reduced hardcoded colors
- Refactored `src/App.css` to use semantic color tokens (`--background`, `--card`, `--border`, `--primary`, etc.) via `color-mix(...)` instead of fixed hex values.
- Updated shell surfaces (landing, workspace, gallery, cards, tabs, controls) to follow token-based styling for better consistency with Tailwind/theme variables.

## 3. Typography system upgrade
- Updated `src/app/globals.css` typography:
  - Body font stack: `IBM Plex Sans`, `Avenir Next`, `Segoe UI`, sans-serif
  - Display/headings font stack: `Space Grotesk`, `IBM Plex Sans`, `Segoe UI`, sans-serif
- Added tighter heading letter spacing and improved body line-height.

## 4. Desktop layout presets + persistent panel sizing
- Added workspace layout presets in `src/App.jsx`:
  - `Balanced`
  - `Canvas Focus`
  - `Chat Focus`
- Added draggable divider between canvas and chat for desktop.
- Added local persistence for layout choice and ratio using `localStorage` (`pitchops_workspace_layout_v1`).
- Wired dynamic desktop grid template columns using live ratio updates.
- Updated maximize behavior:
  - `Canvas Focus` now maximizes canvas and hides chat on desktop.
  - `Chat Focus` now maximizes chat and hides canvas on desktop.

## 5. Sectioned/tabbed flows for dense custom components

### `src/components/custom/KPIDashboard.jsx`
- Added tabs: `overview`, `risk`, `modeling`, `controls`.
- Split dense vertical sections by tab to reduce cognitive load.

### `src/components/custom/PitchChecklist.jsx`
- Added tabs: `checklist`, `rehearsal`, `score`.
- Kept checklist editing separate from run log and go/no-go scoring.

### `src/components/custom/QASimulator.jsx`
- Added tabs: `practice`, `insights`.
- Practice flow now separated from trend/heatmap analysis.

### `src/components/custom/NotesEditor.jsx`
- Added tabs: `write`, `ops`, `history`, `exports`.
- Grouped writing actions, operational logs, history restore, and exports into focused areas.

## 6. Stronger action hierarchy
- Added reusable utility classes in `src/app/globals.css`:
  - `.po-primary-btn`
  - `.po-secondary-btn`
- Applied primary styling to key actions across custom components (e.g., feedback submit, add actions, template apply, run controls).

## 7. Consistent status/feedback coloring
- Added semantic utilities in `src/app/globals.css`:
  - `.po-status-ok`
  - `.po-status-warn`
  - `.po-status-risk`
- Updated status-based text logic in components (notably KPI/QA/checklist) to use semantic classes rather than mixed hardcoded colors.

## 8. Sticky context rails for long interactions
- Added sticky summary strips in:
  - `src/components/custom/PitchChecklist.jsx` (completion/gate/evidence/risk + time budget)
  - `src/components/custom/NotesEditor.jsx` (save state, tags, pins, open actions)

## 9. Domain-specific chat quick intents
- Updated default starter suggestions in:
  - `src/components/tambo/message-thread-full.tsx`
  - `src/components/tambo/message-thread-panel.tsx`
- Replaced generic prompts with investor workflow prompts:
  - Pitch audit
  - KPI risk scan
  - Mock partner Q&A

## 10. Meaningful motion and polish
- Added subtle transitions and hover lift for cards/tabs/buttons in `src/App.css`.
- Added `canvas-in` animation for render-canvas content when active component changes.
- Added hover and active feedback for workspace controls and panels.

## Build validation
- Ran `npm run build` successfully after all UI updates.
- No compile errors were reported.
