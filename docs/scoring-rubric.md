# Scoring Rubric Reference

Research-to-Project Lab ranks experiment candidates with five visible scores. The goal is not to let the app decide for you. The goal is to make the tradeoffs explicit enough for a human builder to choose the next experiment.

## Principles

- Component scores stay visible. A high total is not enough by itself.
- Weak evidence stays visible. A promising idea with thin evidence should be researched before it becomes implementation work.
- Human review is required before any candidate becomes an experiment brief, ticket, PR, or release plan.
- The current MVP uses static fixture scores from `data/candidates.json`. There is no live scoring model or score editor yet.

## Score scale

Use the same 1-5 scale for every dimension:

| Score | Meaning |
|---|---|
| 1 | Weak signal or poor fit. |
| 2 | Some signal, but major concerns. |
| 3 | Plausible and mixed. Needs review. |
| 4 | Strong candidate with manageable risks. |
| 5 | Excellent fit for a near-term experiment. |

## Dimensions

| Key | Label | What it asks |
|---|---|---|
| `novelty` | Novelty | Does this reveal a new approach, capability, or angle? |
| `feasibility` | Feasibility | Can a small builder test it in roughly 1-3 days? |
| `leverage` | Leverage | Will the experiment create reusable code, data, evals, content, or product insight? |
| `evidence` | Evidence strength | Is there enough paper, repo, activity, or detail to justify attention? |
| `user_fit` | User fit | Does it match the current AI/product experiment goals? |

## Total score rule

`total_score = novelty + feasibility + leverage + evidence + user_fit`

Current range: 5-25.

The Python test suite checks that every candidate total equals the sum of the five component scores.

## Tie-breakers for future implementation

When candidates have similar totals, prefer this order:

1. Feasibility: can the team run a useful experiment quickly?
2. Evidence strength: is the source strong enough to trust the direction?
3. User fit: does it match the current product wedge?
4. Discovered date or title: use deterministic ordering when the above still ties.

## Weak-evidence rule

A candidate can have a high total and still need research if the evidence score is weak. Future UI should show a warning and require a rationale before promoting weak-evidence candidates into a top-three shortlist.

## Manual override rule

Future score edits should require a reason. Overrides should preserve the original fixture or system rationale so reviewers can see what changed and why.

## Current fixture examples

| Candidate | Status | Total | Notes |
|---|---:|---:|---|
| Code as Agent Harness | shortlisted | 22 | Strong fit for harness-driven experiment briefs. |
| Structured signals outperform generative matching in reviewer selection | new | 20 | Good reminder to test structured baselines before adding LLM recommendations. |
| Research assistant with task management adjacency | shortlisted | 19 | Useful adjacent demand signal, but needs the sharper experiment-selection wedge. |

## Related docs

- [User guide](user-guide.md)
- [Known issues](known-issues.md)
- [Handoff](handoff.md)
