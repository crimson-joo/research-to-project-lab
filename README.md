# Research-to-Project Lab

Research-to-Project Lab is a tiny dependency-free static MVP for turning research sources into scored experiment candidates.

The current repo is a C-02/C-03 scaffold: it renders local fixture candidates, shows a five-dimension scoring rubric, and lists a shortlist placeholder. It does not crawl live sources, score with an LLM, persist data, authenticate users, deploy anywhere, or create implementation tickets.

## What works now

- Serve the static app locally.
- Render candidate cards from `data/candidates.json`.
- Show five scoring dimensions: novelty, feasibility, leverage, evidence strength, and user fit.
- Calculate fixture totals that are checked by Python tests.
- Show shortlisted candidates from fixture status.

## What is planned, not implemented

- Live arXiv, GitHub, article, or manual source intake.
- Source records, provenance, duplicate handling, and readiness checks.
- LLM scoring or score editing.
- Persistent database storage.
- Authenticated APIs.
- Automatic implementation tickets, PRs, or deployment.

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

## Documentation

- [User guide](docs/user-guide.md): run the app and interpret candidate cards.
- [Scoring rubric](docs/scoring-rubric.md): score dimensions, total-score rule, and current fixture examples.
- [Known issues](docs/known-issues.md): current limitations and next-owner areas.
- [Handoff](docs/handoff.md): compact continuation map for product/design/engineering/QA/release owners.
- [Release notes](docs/release-notes.md): static scaffold and planning-package release evidence.

## Safety note

Current candidate data is trusted local fixture content. Before live or manual source intake ships, fetched/user-supplied text must be treated as data, not instructions or executable HTML.

## Project notes

- No external dependencies are required.
- `package.json` is present only for script conventions.
- Graphify/gstack hooks are not installed in the repo scaffold; planning artifacts live under the local gstack project directory.
