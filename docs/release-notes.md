# Release Notes

These notes record user-visible repo behavior and planning milestones. They are not a production SaaS deployment log.

## Option C release validation

Date: 2026-05-20

### User-visible changes

- Integrated the agent-team validation feature set into `main`.
- Added source intake draft UI for GitHub, arXiv, article/blog, and manual notes.
- Added fixture-backed `SourceRecord` data and source-to-candidate traceability.
- Added candidate search, source filters, priority sorting, and no-match empty state.
- Added priority backlog based on rubric score, evidence confidence, and estimated effort.
- Added Markdown clipboard export and JSON download for the current filtered candidate view.
- Added GitHub Actions CI and GitHub Pages deployment workflow.
- Published the static demo at `https://crimson-joo.github.io/research-to-project-lab/`.
- Added this documentation freshness update and release checklist gate after stale README/release-note drift was found.

### Branches, commits, and remote evidence

- Repo: `https://github.com/crimson-joo/research-to-project-lab`
- Default branch: `main`
- Integration branch merged: `integration/agent-team-validation` → `main`
- Main merge commit: `5ce2225 merge: integrate agent team validation release`
- CI/Pages commit: `c2be1e2 ci: add GitHub Actions and Pages deployment`
- CI run: `https://github.com/crimson-joo/research-to-project-lab/actions/runs/26143177974`
- Pages deploy run: `https://github.com/crimson-joo/research-to-project-lab/actions/runs/26143177957`
- Deploy URL: `https://crimson-joo.github.io/research-to-project-lab/`

### Verification

- `python3 -m unittest discover -s tests -v` → pass, 25 tests during Option C evidence capture.
- `npm test` → pass, 25 tests during Option C evidence capture.
- `node --check src/app.js` → pass during Option C evidence capture.
- Local browser QA at `http://localhost:5173/`:
  - initial render: 11 candidates;
  - search `harness`: one matching candidate, `Code as Agent Harness`;
  - no-match query: empty state shown;
  - manual source intake draft: pass;
  - export controls: present/clickable.
- Deployed canary at `https://crimson-joo.github.io/research-to-project-lab/`:
  - page title loaded;
  - search `harness`: pass;
  - no-match empty state: pass;
  - manual source intake draft: pass;
  - export control present/clickable: pass.

### Known limitations

- Static fixture data remains the canonical app data.
- Source intake creates local browser drafts only; no live crawler/fetcher is implemented.
- No LLM scoring, server persistence, auth, multi-user sync, or automatic implementation handoff.
- Browser QA is manual, although canary evidence was recorded.
- GitHub Actions emitted a non-blocking Node.js 20 hosted-action deprecation annotation; CI/deploy conclusions were `success`.

### Release decision

Shipped as a public static MVP demo through GitHub Pages. Future release signoff must include the document-release + docs freshness QA + i18n docs link-check gate in [Release checklist](release-checklist.md).

## Unreleased / MVP docs handoff

Date: 2026-05-20

### User-visible changes

- Added the MVP documentation set:
  - user guide;
  - scoring rubric reference;
  - known issues and limitations;
  - handoff for future owners;
  - release notes.
- Updated README to point readers to current static behavior, run/test commands, deeper docs, and limitations.

### Verification

- `python3 -m unittest discover -s tests`
- `npm test`
- Markdown link check for README/docs relative links.

### Known limitations

- Static fixture data only.
- No live source crawler, LLM scoring, persistence, auth, or automatic implementation handoff.
- Browser QA remains manual.

### Release decision

Local docs handoff only. No push, merge, deploy, or production release in that earlier phase.

## C-03 planning package

### Planning outputs

- Product brief defines the wedge: evidence-backed experiment candidate selection.
- Design flow defines intake, candidate cards, scoring, shortlist, and backlog separation.
- Candidate/shortlist UX extension defines card states, empty/loading/error states, accessibility criteria, and handoff notes.
- Engineering plan recommends a static-first layered architecture and domain contracts.
- QA plan defines gates for traceability, scoring, accessibility, browser smoke, and untrusted content safety.
- Docs plan defines the README/user guide/rubric/release/known-issues/handoff set.
- Source intake protocol defines source types, source records, duplicate/merge rules, readiness checks, and acceptance criteria.

### Limitations

Planning artifacts do not mean the behavior has shipped. See the latest release entry above for current shipped behavior.

## C-02 static scaffold

### Shipped behavior

- Dependency-free static HTML/CSS/JS app.
- JSON fixture-backed candidate cards.
- Five-dimension scoring rubric and total score display.
- Shortlist placeholder from fixture candidate status.
- Python stdlib unittest gate.
- npm scripts as command aliases only.

### Verification

- `python3 -m unittest discover -s tests`
- `npm test`

## Required fields for future entries

Future release entries should include:

- date;
- branch, commit, or PR if available;
- user-visible changes;
- verification commands and results;
- CI/deploy/canary evidence when release reaches a hosted target;
- documentation freshness and i18n link-check result;
- known limitations;
- release or hold decision.

## Related docs

- [Known issues](known-issues.md)
- [Release checklist](release-checklist.md)
- [Handoff](handoff.md)
