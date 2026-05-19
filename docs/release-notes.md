# Release Notes

These notes record user-visible repo behavior and planning milestones. They are not a production deployment log.

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
- No live source intake, LLM scoring, persistence, auth, deployment, or automatic implementation handoff.
- Browser QA remains manual.

### Release decision

Local docs handoff only. No push, merge, deploy, or production release.

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

Planning artifacts do not mean the behavior has shipped. The repo still represents the static scaffold until implementation work lands.

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
- known limitations;
- release or hold decision.

## Related docs

- [Known issues](known-issues.md)
- [Handoff](handoff.md)
