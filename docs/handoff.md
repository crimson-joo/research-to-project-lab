# Handoff: research-to-project-lab

This handoff compresses the current shipped MVP state and the C-03/C-04 planning package for the next owner.

## Product decision

Research-to-Project Lab is a human-in-the-loop research-to-experiment planning app. It is not a generic AI research assistant. The wedge is evidence-backed selection of the next experiment.

## Current repo state

- Static HTML/CSS/JS app.
- No external runtime or build dependencies.
- Local fixture data in `data/sources.json` and `data/candidates.json`.
- Browser source intake draft form backed by `localStorage` only.
- Candidate cards with source traceability, state labels, risks, actions, score reasons, and evidence warnings.
- Search, source filter, priority/title/source sorting, priority backlog, shortlist placeholder, Markdown export, and JSON export.
- Python stdlib unittest gate, including data contract and documentation checks.
- `package.json` exists for script conventions.
- GitHub Actions CI and GitHub Pages workflow are configured.
- Public static demo: `https://crimson-joo.github.io/research-to-project-lab/`.

## Key concepts

- Source: a paper, repository, article, or manual note that may contain an experiment signal.
- SourceRecord: fixture-level source object with source type, URL, summary/note, evidence notes, risks, duplicate marker, and review metadata.
- Candidate: a normalized experiment option derived from source evidence.
- Score: five visible rubric dimensions plus a total.
- Priority score: deterministic UI ranking signal derived from rubric total, evidence confidence, and estimated effort.
- Shortlist: a small ranked set for human review.
- ExperimentBrief: future output that should turn a selected candidate into an implementation-ready plan.
- Research backlog: ideas needing more source review or validation.
- Implementation backlog: approved, scoped work ready for engineering.

## Next implementation sequence

1. Extract deterministic scoring/ranking/domain validation from the static UI into testable modules.
2. Replace local-only intake drafts with a real source-review workflow and persisted SourceRecord store.
3. Add duplicate handling and source merge decisions around the SourceRecord contract.
4. Add reviewer-owned score editing, override rationale, confidence model, and history.
5. Add experiment brief output after candidate review.
6. Add automated browser QA for the integrated flow.
7. Update docs after behavior ships, then run the release documentation gate.

## QA gates to preserve

- Traceability from source to candidate.
- Deterministic scoring totals and ordering.
- Separation between research backlog and implementation backlog.
- Accessibility and browser smoke checks.
- Safe rendering before any untrusted live/manual content ships.
- Documentation freshness: README, user guide, known issues, release notes, handoff, release checklist, and Korean docs must match shipped behavior.
- i18n docs link check: Korean entry points must be reachable from README when maintained.

## Release blocker policy

Release is not complete at merge + CI + deploy + canary + cleanup. Future release owners must include:

1. `document-release` or equivalent docs diff audit.
2. Docs freshness QA against the app, diff, CI, deploy, and canary evidence.
3. i18n link check for Korean docs.
4. Markdown relative-link check.
5. Stale-claim check so shipped features are not still described as planned or absent.

See [Release checklist](release-checklist.md).

## Approval boundaries

Do not add these without orchestrator approval:

- live APIs or crawlers;
- paid services or secrets;
- automatic PR, issue, or implementation-ticket creation;
- framework, database, auth, or deployment dependencies beyond the existing static GitHub Pages workflow.

## Source artifacts

Local planning and release artifacts used for this handoff:

- `/Users/crimson/.gstack/projects/research-to-project-lab/product-intake-c01.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/product-brief-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/design-flow-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/candidate-card-shortlist-ux-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/engineering-plan-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/qa-plan-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/docs-plan-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/source-intake-protocol-c04.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/option-c-release-evidence.md`

## Repo docs

- [User guide](user-guide.md)
- [Scoring rubric](scoring-rubric.md)
- [Known issues](known-issues.md)
- [Release checklist](release-checklist.md)
- [Release notes](release-notes.md)
- [한국어 README](ko/README.md)
- [한국어 사용자 가이드](ko/user-guide.md)
