# 한국어 사용자 가이드: 연구 소스에서 실험 후보까지

Research-to-Project Lab은 연구 소스를 실험 후보로 바꾸고, 작은 팀이 다음 실험을 고를 수 있게 돕는 정적 MVP입니다. 현재는 live crawler가 아니라 fixture 데이터와 브라우저 로컬 draft를 사용하는 working scaffold입니다.

## 기본 흐름

1. Source intake: GitHub/arXiv/article/manual lead를 입력합니다.
2. Candidate cards: source evidence를 실험 후보 카드로 봅니다.
3. Scoring: 5개 기준으로 후보를 비교합니다.
4. Search/filter/sort: source type, keyword, priority로 좁힙니다.
5. Backlog/shortlist: 다음 실험 후보를 비교합니다.
6. Export: Markdown 또는 JSON으로 현재 후보 목록을 내보냅니다.

## 실행

```sh
python3 -m http.server 5173
```

브라우저에서 `http://localhost:5173`을 엽니다. 배포본은 `https://crimson-joo.github.io/research-to-project-lab/`입니다.

## Source intake 사용법

- GitHub, arXiv, article/blog source는 `http(s)` URL이 필요합니다.
- manual note는 URL 없이도 가능하지만, user note에 출처/맥락을 적어야 합니다.
- 생성된 draft는 브라우저 `localStorage`에만 저장됩니다.
- 이 draft는 서버 저장, 동기화, production persistence가 아닙니다.

## Candidate card 읽는 법

각 카드는 다음을 보여줍니다.

- title, source type, source URL, source count
- source trace: `source_ids`, evidence refs, extraction method, review rationale
- summary, why interesting, implied experiment
- novelty, feasibility, leverage, evidence strength, user fit 점수
- priority score: rubric total + confidence + effort
- risks/warnings/status/action

## Search/filter/export

- Search는 title, tag, source metadata, source type, experiment text를 봅니다.
- Source filter는 GitHub/arXiv/manual fixture 후보를 좁힙니다.
- Priority sort는 점수, evidence confidence, estimated effort를 반영합니다.
- Copy Markdown은 리뷰 노트나 planning thread에 붙여넣기 좋습니다.
- Download JSON은 downstream tooling용 정적 export입니다.

## 승격 전 체크

후보를 implementation work로 옮기기 전에:

- source evidence를 확인합니다.
- total score만 보지 말고 component score를 봅니다.
- risks/warnings를 읽습니다.
- research/prototype/park/reject 중 다음 lane을 정합니다.
- 사람이 검토한 experiment brief를 작성합니다.

## 현재 한계

- live crawling/fetching 없음
- fixture JSON 중심 데이터
- 점수 편집 UI 없음
- 서버 persistence/auth/multi-user sync 없음
- 자동 implementation ticket/PR 생성 없음
- 자동 browser QA 없음

관련 문서: [Known issues](../known-issues.md), [Scoring rubric](../scoring-rubric.md), [Release checklist](../release-checklist.md)
