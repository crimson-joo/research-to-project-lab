# Graph Report - experiment-brief-workflow  (2026-05-21)

## Corpus Check
- 17 files · ~10,445 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 278 nodes · 387 edges · 23 communities (16 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3cae38c6`
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]

## God Nodes (most connected - your core abstractions)
1. `StaticAppScaffoldTests` - 17 edges
2. `read_text()` - 16 edges
3. `Research-to-Project Lab 한국어 README` - 13 edges
4. `한국어 사용자 가이드: 연구 소스에서 실험 후보까지` - 13 edges
5. `Known Issues and Limitations` - 12 edges
6. `Handoff: research-to-project-lab` - 11 edges
7. `Scoring Rubric Reference` - 11 edges
8. `User Guide: From Research Source to Experiment Candidate` - 10 edges
9. `Research-to-Project Lab` - 10 edges
10. `renderFilteredCandidates()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `fillBriefForm()` --calls--> `escapeHtml()`  [EXTRACTED]
  src/app.js → src/app.js  _Bridges community 17 → community 8_
- `renderDraft()` --calls--> `escapeHtml()`  [EXTRACTED]
  src/app.js → src/app.js  _Bridges community 17 → community 20_
- `renderFilteredCandidates()` --calls--> `renderCandidates()`  [EXTRACTED]
  src/app.js → src/app.js  _Bridges community 17 → community 19_
- `briefToMarkdown()` --calls--> `readinessForBrief()`  [EXTRACTED]
  src/app.js → src/app.js  _Bridges community 5 → community 8_
- `createOrUpdateBrief()` --calls--> `renderFilteredCandidates()`  [EXTRACTED]
  src/app.js → src/app.js  _Bridges community 8 → community 19_

## Communities (23 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (28): Branches, commits, and remote evidence, C-02 static scaffold, C-03 planning package, Experiment Brief workflow update, Known limitations, Known limitations, Known limitations, Known limitations (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (26): code:sh (python3 -m http.server 5173), code:sh (npm run serve), code:sh (python3 -m unittest discover -s tests), code:sh (npm test), Current shipped behavior, Documentation, Project notes, Release/documentation gate (+18 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (19): allCandidates, allowedSourceTypes, buildCandidateDraft(), candidateEmptyStates, candidateErrorCopy, chipList(), isHttpUrl(), loadedCandidates (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (15): 지금 동작하는 것, 아직 안 되는 것, 아직 안 되는 것, 로컬 실행, 로컬 실행, 테스트, 테스트, 릴리즈 문서 게이트 (+7 more)

### Community 5 - "Community 5"
Cohesion: 0.17
Nodes (15): briefToMarkdown(), candidateDecisions, candidatesToMarkdown(), clearPersistedDraft(), confidenceScore(), copyMarkdown(), downloadJson(), effortScore() (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (13): 한국어 사용자 가이드: 연구 소스에서 실험 후보까지, 실행, 실행, 승격 전 체크, 기본 흐름, 승격 전 체크, 현재 한계, 현재 한계 (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (11): Browser QA is manual, Experiment Brief workflow is browser-local only, Known Issues and Limitations, Not implemented yet, Related docs, Research backlog vs implementation backlog is visible but not workflow-backed, Scoring is static fixture data, Source intake is local draft capture, not live ingestion (+3 more)

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (12): createOrUpdateBrief(), defaultBriefFor(), fillBriefForm(), hydrateBriefState(), loadJson(), parseLines(), persistBriefState(), readinessForBrief() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (10): Approval boundaries, Current repo state, Handoff: research-to-project-lab, Key concepts, Next implementation sequence, Product decision, QA gates to preserve, Release blocker policy (+2 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (10): code:sh (python3 -m http.server 5173), Core loop, Current limitations, Current MVP walkthrough, How to read a candidate card, How to use search, filters, and exports, How to use the backlog and shortlist, User Guide: From Research Source to Experiment Candidate (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (10): Current fixture examples, Dimensions, Manual override rule, Principles, Related docs, Score scale, Scoring Rubric Reference, Tie-breakers for future implementation (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.22
Nodes (7): Automation in this repo, code:sh (python3 -m unittest discover -s tests), Documentation freshness gate, QA-release verification, Release Checklist, Release is blocked until all gates pass, Standard release evidence packet

### Community 17 - "Community 17"
Cohesion: 0.33
Nodes (6): actionButtons(), escapeHtml(), formatStatus(), renderCandidates(), renderEmptyState(), sourceBadge()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (6): main(), renderRubric(), renderShortlist(), setupExports(), setupFilters(), shortlistNotices()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (5): currentFilters(), filterCandidates(), renderBacklog(), renderFilteredCandidates(), sortCandidates()

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (4): hydrateFormFromDraft(), loadPersistedDraft(), renderDraft(), setupSourceIntake()

## Knowledge Gaps
- **100 isolated node(s):** `experimentBriefs`, `candidateDecisions`, `laneConfig`, `Current shipped behavior`, `Still not implemented` (+95 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `experimentBriefs`, `candidateDecisions`, `laneConfig` to the rest of the system?**
  _100 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._