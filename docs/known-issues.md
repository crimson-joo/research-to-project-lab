# Known Issues and Limitations

This project is still a dependency-free static MVP scaffold. Keep these limitations visible until implementation and QA evidence prove they are fixed.

## Fixture-only source data

- Current behavior: candidate cards load from `data/candidates.json`.
- Impact: the app cannot ingest arbitrary papers, repositories, or notes yet.
- Next owner: cto-engineering.

## No SourceRecord contract yet

- Current behavior: candidates have direct source URLs, but there is no separate `SourceRecord` model.
- Impact: multi-source traceability, provenance, duplicate handling, and source review status are limited.
- Next owner: cto-engineering + qa-release.

## Scoring is static fixture data

- Current behavior: totals come from stored component scores.
- Impact: there is no score editing, override reason, confidence model, or reviewer history yet.
- Next owner: cto-engineering + design-engineer.

## Research backlog vs implementation backlog is conceptual

- Current behavior: product/design/QA artifacts describe the separation, but the data model and UI lanes are not complete yet.
- Impact: users may not see a clear separation between "research next" and "build next" until implementation expands.
- Next owner: design-engineer + cto-engineering.

## Browser QA is manual

- Current behavior: Python tests check static files and candidate data contracts. Browser smoke is not automated.
- Impact: UI regressions can slip if manual browser checks are skipped.
- Next owner: qa-release.

## Untrusted content rendering needs hardening before live intake

- Current behavior: current fixtures are trusted local sample data and are rendered into the page.
- Impact: future fetched or user-supplied source text must not be rendered as executable HTML.
- Next owner: cto-engineering + qa-release.

## Not implemented yet

The current repo does not include:

- live arXiv or GitHub crawling;
- authenticated APIs;
- LLM scoring;
- persistence or database storage;
- automatic implementation tickets or PRs;
- deployment pipeline.

## Related docs

- [Release notes](release-notes.md)
- [Handoff](handoff.md)
