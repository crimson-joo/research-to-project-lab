# User Guide: From Research Source to Experiment Candidate

Research-to-Project Lab helps a builder compare research inputs as possible experiments. The current app is a static MVP with fixture data, so treat it as a working scaffold and example flow, not a live research crawler.

## Who this is for

Use this when you are a solo or small-team AI/product builder choosing the next experiment from papers, repositories, or manual notes.

## Core loop

1. Intake: collect a research source.
2. Candidate cards: turn the source into a clear experiment candidate.
3. Scoring: rate the candidate on five dimensions.
4. Shortlist: compare the strongest candidates.
5. Experiment brief: write the next build/test plan after human review.

Only steps 2-4 are represented in the current static scaffold, using local fixture data.

## Current MVP walkthrough

1. Serve the static app:

   ```sh
   python3 -m http.server 5173
   ```

2. Open `http://localhost:5173`.
3. Review the scoring rubric at the top of the page.
4. Read the candidate cards loaded from `data/candidates.json`.
5. Compare component scores, total score, risks, and implied experiments.
6. Use the shortlist area as a recommendation aid, not an automatic decision.

## How to read a candidate card

Each fixture candidate includes:

- title: the candidate name;
- source type and source URL: where the signal came from;
- summary: short source interpretation;
- why interesting: why the source might matter;
- implied experiment: what the team could test next;
- required inputs: what a real experiment would need;
- score breakdown: novelty, feasibility, leverage, evidence strength, and user fit;
- risks: reasons to slow down or research more;
- status: current fixture status such as `shortlisted` or `new`.

## How to use the shortlist

The shortlist ranks candidates marked `shortlisted` by `total_score` and shows the top three. Use it to focus discussion, not to bypass review.

Before promoting a candidate into implementation work:

- verify the source evidence;
- check the component scores, not only the total;
- read the risks;
- decide whether the right next action is research, prototype, park, or reject.

## What to do with weak evidence

If an idea looks valuable but the evidence is thin, keep it in research. Do not turn it into an implementation task until a reviewer adds enough source context and rationale.

## Current limitations

- Source intake is not live yet.
- Data is fixture-only.
- Scores are static.
- Human review is required before any build handoff.

See [Known issues](known-issues.md) and the [Scoring rubric](scoring-rubric.md) for details.
