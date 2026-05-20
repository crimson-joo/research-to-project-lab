# Research-to-Project Lab

[한국어 문서](docs/ko/README.md) · [User guide](docs/user-guide.md) · [Live demo](https://crimson-joo.github.io/research-to-project-lab/)

Research-to-Project Lab is a dependency-free static MVP for turning research sources into scored experiment candidates. It helps a solo or small-team builder decide which research-backed experiment deserves attention next.

## Current shipped behavior

- Static HTML/CSS/JS app deployable on GitHub Pages.
- Source intake form for GitHub, arXiv, article/blog, and manual notes.
- Local draft persistence through `localStorage`; this is browser-only draft state, not synced storage.
- Fixture-backed source records in `data/sources.json` and candidate cards in `data/candidates.json`.
- Source-to-candidate traceability through `source_ids`, evidence refs, and review rationale.
- Candidate search, source-type filter, and sorting by priority score, title, or source type.
- Five-dimension scoring rubric: novelty, feasibility, leverage, evidence strength, and user fit.
- Priority backlog computed from rubric total, evidence confidence, and estimated effort.
- Shortlist placeholder for candidates marked `shortlisted`.
- Markdown clipboard export and JSON download for the current filtered candidate view.
- Python unittest gates and GitHub Actions CI.
- GitHub Pages deploy workflow and canary-smoked public demo.

## Still not implemented

- Live arXiv, GitHub, or article crawling/fetching.
- LLM scoring, editable scores, reviewer history, or confidence calibration.
- Server-side persistence, database storage, auth, or multi-user sync.
- Automatic implementation tickets, PRs, or build handoff.
- Automated browser QA; current browser/canary smoke is manual.

## Run locally

```sh
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

You can also use the npm script alias without installing packages:

```sh
npm run serve
```

## Test

```sh
python3 -m unittest discover -s tests
```

Or via npm script scaffold:

```sh
npm test
```

## Release/documentation gate

Release is not complete after merge + CI + deploy + canary + cleanup. Before release signoff, run the `document-release` audit, docs freshness QA, and i18n docs link check in [Release checklist](docs/release-checklist.md):

- README and docs match shipped UI behavior.
- Release notes include merge, CI, deploy, and canary evidence.
- Known issues distinguish current limitations from already-shipped features.
- Korean documentation links exist and pass link checks when relevant.
- Documentation link checks and stale-claim tests pass.

## Documentation

- [User guide](docs/user-guide.md): run the app, create drafts, search candidates, export results, and interpret cards.
- [Scoring rubric](docs/scoring-rubric.md): score dimensions, total-score rule, and current fixture examples.
- [Known issues](docs/known-issues.md): current limitations and next-owner areas.
- [Release checklist](docs/release-checklist.md): mandatory release blockers, including document-release and i18n link checks.
- [Handoff](docs/handoff.md): compact continuation map for product/design/engineering/QA/release owners.
- [Release notes](docs/release-notes.md): shipped behavior, CI/deploy evidence, and limitations.
- [한국어 README](docs/ko/README.md): Korean entry point.
- [한국어 사용자 가이드](docs/ko/user-guide.md): Korean walkthrough.

## Safety note

Current fixture data is trusted local sample content. The app escapes rendered candidate/source text, but any future fetched or user-supplied content must continue to be treated as data, not instructions or executable HTML.

## Project notes

- No external runtime or build dependencies are required.
- `package.json` is present for script conventions.
- Planning artifacts live under the local gstack project directory; repo docs contain only promoted handoff material.
