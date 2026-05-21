# Known Issues and Limitations

This project is still a dependency-free static MVP. Keep these limitations visible until implementation and QA evidence prove they are fixed.

## Static fixture-backed app data

- Current behavior: candidate cards load from `data/candidates.json`; source records load from `data/sources.json`.
- Impact: the app demonstrates the workflow but does not maintain a real research database.
- Next owner: cto-engineering.

## Source intake is local draft capture, not live ingestion

- Current behavior: the browser form validates GitHub, arXiv, article/blog, and manual leads, then creates a draft card saved in `localStorage`.
- Impact: the app does not crawl, fetch, parse, deduplicate, or persist arbitrary papers, repositories, or notes.
- Next owner: cto-engineering + qa-release.

## SourceRecord contract is fixture-level only

- Current behavior: `data/sources.json`, `source_ids`, evidence refs, and review rationale provide deterministic fixture traceability.
- Impact: production-grade provenance, duplicate handling, source review workflow, and multi-source merge decisions still need a real domain layer.
- Next owner: cto-engineering + qa-release.

## Scoring is static fixture data

- Current behavior: totals come from stored component scores; priority score is derived in the browser from visible rubric score, confidence, and effort.
- Impact: there is no score editing, override reason, confidence model, or reviewer history yet.
- Next owner: cto-engineering + design-engineer.

## Experiment Brief workflow is browser-local only

- Current behavior: the UI shows candidate actions, next lanes, priority backlog, and browser-local Experiment Briefs. Research next, Prototype next, Park, and Reject decisions persist in `research-to-project-lab.experimentBriefs.v1` and export through Markdown/JSON.
- Impact: briefs are auditable handoff artifacts, but they do not create implementation tickets, PRs, synced records, or server-side workflow state.
- Next owner: design-engineer + cto-engineering.

## Browser QA is manual

- Current behavior: Python tests check static files, data contracts, scoring, traceability, docs links, and stale documentation claims. Browser smoke/canary checks are still manually executed.
- Impact: UI regressions can slip if manual browser checks are skipped.
- Next owner: qa-release.

## Untrusted content hardening must continue before live ingestion

- Current behavior: fixture and draft text are escaped before rendering; current data is trusted local sample content.
- Impact: future fetched or user-supplied source text must continue to be treated as data, not executable HTML or agent instructions.
- Next owner: cto-engineering + qa-release.

## Not implemented yet

The current repo does not include:

- live arXiv, GitHub, or article crawling/fetching;
- authenticated APIs;
- LLM scoring;
- server-side persistence or database storage;
- multi-user sync;
- automatic implementation tickets or PRs;
- automated browser QA.

## Related docs

- [User guide](user-guide.md)
- [Release checklist](release-checklist.md)
- [Release notes](release-notes.md)
- [Handoff](handoff.md)
