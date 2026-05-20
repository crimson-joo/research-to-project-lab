# User Guide: From Research Source to Experiment Candidate

Research-to-Project Lab helps a builder compare research inputs as possible experiments. The current app is a static MVP: it has a working browser UI, fixture-backed source/candidate data, local draft intake, search/filter, backlog ranking, and export controls. It is not a live research crawler or multi-user product yet.

## Who this is for

Use this when you are a solo or small-team AI/product builder choosing the next experiment from papers, repositories, articles, or manual notes.

## Core loop

1. Intake: capture a research source or manual lead.
2. Candidate cards: turn source evidence into a clear experiment candidate.
3. Scoring: rate the candidate on five visible dimensions.
4. Search/filter/sort: narrow the candidate set by source, keyword, or priority.
5. Backlog/shortlist: compare the strongest candidates.
6. Export: copy Markdown or download JSON for review and handoff.
7. Experiment brief: write the next build/test plan after human review.

The current MVP represents steps 1-6 in a static browser scaffold. Experiment brief generation remains future work.

## Current MVP walkthrough

1. Serve the static app:

   ```sh
   python3 -m http.server 5173
   ```

2. Open `http://localhost:5173`, or use the deployed demo at `https://crimson-joo.github.io/research-to-project-lab/`.
3. Review the scoring rubric at the top of the page.
4. Use **Source intake** to capture a GitHub, arXiv, article/blog, or manual lead.
   - GitHub/arXiv/article sources require an `http(s)` URL.
   - Manual notes may omit the URL when the note explains the source.
   - Drafts are saved only in browser `localStorage`.
5. Read candidate cards loaded from `data/candidates.json` and source records in `data/sources.json`.
6. Search candidate text, tags, source metadata, source type, and experiment text.
7. Filter by source type and sort by priority score, title, or source type.
8. Review the **Priority backlog** and **Shortlist placeholder**.
9. Export the current filtered candidate view with **Copy Markdown** or **Download JSON**.

## How to read a candidate card

Each fixture candidate includes:

- title: the candidate name;
- source type, source URL, and source count;
- source trace: `source_ids`, evidence references, extraction method, and review rationale;
- summary: short source interpretation;
- why interesting: why the source might matter;
- implied experiment: what the team could test next;
- required inputs: what a real experiment would need;
- score breakdown: novelty, feasibility, leverage, evidence strength, and user fit;
- priority score: rubric total plus confidence and effort signal;
- risks and warnings: reasons to slow down or research more;
- status: current fixture status such as `shortlisted`, `needs_review`, `parked`, or `fetch_error`.

## How to use search, filters, and exports

- Search covers titles, tags, source metadata, source type, and experiment text.
- Source filters narrow to GitHub, arXiv, or manual fixture candidates.
- Priority sorting favors high rubric score, stronger evidence confidence, and smaller estimated effort.
- Markdown export is useful for a planning note or review thread.
- JSON export is useful for downstream tooling, but it is still a static browser export, not server persistence.

## How to use the backlog and shortlist

The priority backlog ranks visible candidates by the deterministic `priorityScore`. The shortlist shows candidates marked `shortlisted` by fixture status and sorted by total rubric score.

Before promoting a candidate into implementation work:

- verify the source evidence;
- check component scores, not only the total;
- read the risks and warnings;
- confirm whether the next lane is research, prototype, park, or reject;
- write a human-reviewed experiment brief.

## What to do with weak evidence

If an idea looks valuable but the evidence is thin, keep it in research. Do not turn it into an implementation task until a reviewer adds enough source context and rationale.

## Current limitations

- Source intake creates only a local browser draft. It does not fetch or crawl live sources.
- Data is still fixture-backed JSON.
- Scores are static and not editable in the UI.
- No server persistence, auth, multi-user sync, or automatic implementation tickets exist.
- Browser QA remains manual.

See [Known issues](known-issues.md), [Scoring rubric](scoring-rubric.md), and [Release checklist](release-checklist.md) for details.
