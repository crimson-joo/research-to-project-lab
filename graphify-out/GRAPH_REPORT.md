# Graph Report - experiment-brief-workflow  (2026-05-21)

## Corpus Check
- 17 files · ~8,418 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 225 nodes · 305 edges · 17 communities (10 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9d92c57b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `StaticAppScaffoldTests` - 15 edges
2. `read_text()` - 14 edges
3. `Known Issues and Limitations` - 11 edges
4. `Handoff: research-to-project-lab` - 11 edges
5. `Scoring Rubric Reference` - 11 edges
6. `Research-to-Project Lab` - 10 edges
7. `User Guide: From Research Source to Experiment Candidate` - 10 edges
8. `한국어 사용자 가이드: 연구 소스에서 실험 후보까지` - 9 edges
9. `SourceRecordModelTests` - 8 edges
10. `main()` - 8 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (17 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (49): actionButtons(), allCandidates, allowedSourceTypes, buildCandidateDraft(), candidateEmptyStates, candidateErrorCopy, candidatesToMarkdown(), chipList() (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (20): Branches, commits, and remote evidence, C-02 static scaffold, C-03 planning package, Known limitations, Known limitations, Limitations, Option C release validation, Planning outputs (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (13): code:sh (python3 -m http.server 5173), code:sh (npm run serve), code:sh (python3 -m unittest discover -s tests), code:sh (npm test), Current shipped behavior, Documentation, Project notes, Release/documentation gate (+5 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (10): Browser QA is manual, Known Issues and Limitations, Not implemented yet, Related docs, Research backlog vs implementation backlog is visible but not workflow-backed, Scoring is static fixture data, Source intake is local draft capture, not live ingestion, SourceRecord contract is fixture-level only (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (10): 지금 동작하는 것, 아직 안 되는 것, 로컬 실행, 테스트, 릴리즈 문서 게이트, 주요 문서, code:sh (python3 -m http.server 5173), code:sh (npm run serve) (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (10): Approval boundaries, Current repo state, Handoff: research-to-project-lab, Key concepts, Next implementation sequence, Product decision, QA gates to preserve, Release blocker policy (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (10): Current fixture examples, Dimensions, Manual override rule, Principles, Related docs, Score scale, Scoring Rubric Reference, Tie-breakers for future implementation (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (10): code:sh (python3 -m http.server 5173), Core loop, Current limitations, Current MVP walkthrough, How to read a candidate card, How to use search, filters, and exports, How to use the backlog and shortlist, User Guide: From Research Source to Experiment Candidate (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (9): 한국어 사용자 가이드: 연구 소스에서 실험 후보까지, 실행, 승격 전 체크, 기본 흐름, 현재 한계, Candidate card 읽는 법, code:sh (python3 -m http.server 5173), Search/filter/export (+1 more)

### Community 12 - "Community 12"
Cohesion: 0.22
Nodes (7): Automation in this repo, code:sh (python3 -m unittest discover -s tests), Documentation freshness gate, QA-release verification, Release Checklist, Release is blocked until all gates pass, Standard release evidence packet

## Knowledge Gaps
- **79 isolated node(s):** `Current shipped behavior`, `Still not implemented`, `code:sh (python3 -m http.server 5173)`, `code:sh (npm run serve)`, `code:sh (python3 -m unittest discover -s tests)` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Current shipped behavior`, `Still not implemented`, `code:sh (python3 -m http.server 5173)` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._