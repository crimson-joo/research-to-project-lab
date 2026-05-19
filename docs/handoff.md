# Handoff: research-to-project-lab

This handoff compresses the current MVP state and the C-03 planning package for the next owner.

## Product decision

Research-to-Project Lab is a human-in-the-loop research-to-experiment planning app. It is not a generic AI research assistant. The wedge is evidence-backed selection of the next experiment.

## Current repo state

- Static HTML/CSS/JS app.
- No external runtime or build dependencies.
- Local fixture data in `data/candidates.json`.
- Python stdlib unittest gate.
- `package.json` exists only for script conventions.

## Key concepts

| Concept | Meaning |
|---|---|
| Source | A paper, repository, article, or manual note that may contain an experiment signal. |
| Candidate | A normalized experiment option derived from source evidence. |
| Score | Five visible rubric dimensions plus a total. |
| Shortlist | A small ranked set for human review. |
| ExperimentBrief | Future output that should turn a selected candidate into an implementation-ready plan. |
| Research backlog | Ideas needing more source review or validation. |
| Implementation backlog | Approved, scoped work ready for engineering. |

## Next implementation sequence

1. Extract deterministic scoring/ranking domain logic from the static UI.
2. Add candidate validation around required fields and score totals.
3. Introduce source records for provenance and duplicate handling.
4. Add experiment brief output after candidate review.
5. Update docs after behavior ships.

## QA gates to preserve

- Traceability from source to candidate.
- Deterministic scoring totals and ordering.
- Separation between research backlog and implementation backlog.
- Accessibility and browser smoke checks.
- Safe rendering before any untrusted live/manual content ships.

## Approval boundaries

Do not add these without orchestrator approval:

- live APIs or crawlers;
- paid services or secrets;
- automatic PR, issue, or implementation-ticket creation;
- framework, database, auth, or deployment dependencies.

## Source artifacts

Local planning artifacts used for this handoff:

- `/Users/crimson/.gstack/projects/research-to-project-lab/product-intake-c01.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/product-brief-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/design-flow-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/candidate-card-shortlist-ux-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/engineering-plan-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/qa-plan-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/docs-plan-c03.md`
- `/Users/crimson/.gstack/projects/research-to-project-lab/source-intake-protocol-c04.md`

## Repo docs

- [User guide](user-guide.md)
- [Scoring rubric](scoring-rubric.md)
- [Known issues](known-issues.md)
- [Release notes](release-notes.md)
