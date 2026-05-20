# Research-to-Project Lab 한국어 README

[English README](../../README.md) · [한국어 사용자 가이드](user-guide.md) · [Live demo](https://crimson-joo.github.io/research-to-project-lab/)

Research-to-Project Lab은 논문, GitHub 저장소, 글, 수동 메모를 **실험 후보**로 정리하고 점수화해서 “다음에 무엇을 만들지” 고르는 정적 MVP입니다.

## 지금 동작하는 것

- 의존성 없는 정적 HTML/CSS/JS 앱
- GitHub, arXiv, article/blog, manual note용 source intake draft 폼
- 브라우저 `localStorage` 기반 로컬 draft 저장
- `data/sources.json` SourceRecord fixture와 `data/candidates.json` candidate fixture
- source → candidate traceability: `source_ids`, evidence refs, review rationale
- candidate 검색, source type 필터, priority/title/source 정렬
- novelty, feasibility, leverage, evidence strength, user fit 5개 점수 기준
- rubric total + confidence + effort 기반 priority backlog
- shortlisted fixture 후보를 보여주는 shortlist placeholder
- 현재 필터 결과 Markdown 복사와 JSON 다운로드
- Python unittest와 GitHub Actions CI
- GitHub Pages 배포: `https://crimson-joo.github.io/research-to-project-lab/`

## 아직 안 되는 것

- live arXiv/GitHub/article 크롤링 또는 fetch
- LLM scoring, 점수 편집, 리뷰어 히스토리
- 서버 저장소, DB, auth, multi-user sync
- 자동 issue/PR/implementation ticket 생성
- 자동 브라우저 QA

## 로컬 실행

```sh
python3 -m http.server 5173
```

이후 `http://localhost:5173`을 엽니다.

npm alias도 사용할 수 있습니다.

```sh
npm run serve
```

## 테스트

```sh
python3 -m unittest discover -s tests
npm test
```

## 릴리즈 문서 게이트

이 repo에서는 release 완료 조건을 다음처럼 봅니다.

> merge + CI + deploy + canary + cleanup + document-release + docs freshness QA + i18n docs link check

자세한 체크리스트는 [Release checklist](../release-checklist.md)를 보세요.

## 주요 문서

- [User guide](../user-guide.md)
- [한국어 사용자 가이드](user-guide.md)
- [Scoring rubric](../scoring-rubric.md)
- [Known issues](../known-issues.md)
- [Release checklist](../release-checklist.md)
- [Release notes](../release-notes.md)
- [Handoff](../handoff.md)
