from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]


def read_text(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


class StaticAppScaffoldTests(unittest.TestCase):
    def test_scaffold_files_exist(self):
        required = [
            "README.md",
            ".gitignore",
            "package.json",
            "index.html",
            "src/styles.css",
            "src/app.js",
            "data/candidates.json",
            "data/sources.json",
            "data/intake-schema.json",
        ]
        missing = [path for path in required if not (ROOT / path).exists()]
        self.assertEqual(missing, [])

    def test_package_scripts_are_dependency_free_static_workflow(self):
        package = json.loads(read_text("package.json"))
        self.assertEqual(package["name"], "research-to-project-lab")
        self.assertIs(package["private"], True)
        self.assertEqual(package["scripts"]["test"], "python3 -m unittest discover -s tests")
        self.assertEqual(package["scripts"]["serve"], "python3 -m http.server 5173")
        self.assertEqual(package.get("dependencies", {}), {})
        self.assertEqual(package.get("devDependencies", {}), {})

    def test_candidate_data_has_rubric_and_shortlist_statuses(self):
        candidates = json.loads(read_text("data/candidates.json"))
        self.assertGreaterEqual(len(candidates), 3)
        self.assertTrue(any(candidate["status"] == "shortlisted" for candidate in candidates))
        for candidate in candidates:
            self.assertTrue(candidate["title"])
            self.assertIn(candidate["source_type"], {"github", "arxiv", "manual"})
            self.assertTrue(candidate["source_url"].startswith("http"))
            rubric = candidate["scores"]
            self.assertEqual(set(rubric), {"novelty", "feasibility", "leverage", "evidence", "user_fit"})
            self.assertTrue(all(1 <= value <= 5 for value in rubric.values()))
            self.assertEqual(candidate["total_score"], sum(rubric.values()))
            self.assertTrue(candidate["implied_experiment"])
            self.assertTrue(candidate["risks"])

    def test_app_renders_candidate_cards_rubric_and_shortlist_placeholder(self):
        html = read_text("index.html")
        js = read_text("src/app.js")
        css = read_text("src/styles.css")

        self.assertIn("Research-to-Project Lab", html)
        self.assertIn("candidate-list", html)
        self.assertIn("shortlist", html)
        self.assertIn('fetch("data/candidates.json")', js)
        self.assertIn('fetch("data/sources.json")', js)
        self.assertIn("renderCandidates", js)
        self.assertIn("renderShortlist", js)
        self.assertRegex(js, r"novelty|feasibility|leverage|evidence|user_fit")
        self.assertIn(".candidate-card", css)

    def test_mock_data_covers_candidate_state_matrix(self):
        candidates = json.loads(read_text("data/candidates.json"))
        statuses = {candidate["status"] for candidate in candidates}
        expected_statuses = {
            "new",
            "needs_review",
            "needs_scoring",
            "scored",
            "shortlisted",
            "parked",
            "rejected",
            "duplicate_risk",
            "conflicting_evidence",
            "fetch_error",
        }
        self.assertTrue(expected_statuses.issubset(statuses), statuses)
        self.assertTrue(any(candidate.get("evidence_strength") == "weak" for candidate in candidates))
        self.assertTrue(any(candidate.get("tie_group") for candidate in candidates))
        for candidate in candidates:
            self.assertIn("confidence", candidate)
            self.assertIn("source_count", candidate)
            self.assertIn("next_lane", candidate)
            self.assertIn("primary_action", candidate)

    def test_candidate_ui_includes_empty_error_and_accessible_action_copy(self):
        js = read_text("src/app.js")
        css = read_text("src/styles.css")
        expected_copy = [
            "No candidate cards yet.",
            "Add sources first, then extract candidate experiments from them.",
            "No candidates match those filters",
            "This card needs review before it can be ranked.",
            "We couldn’t fetch this source. The URL is saved. Retry, or enter details manually.",
            "Define the smallest test before this can move forward.",
            "Sources disagree. Review the evidence before promoting.",
            "aria-label=\"${escapeHtml(action.label)} ${title}\"",
            "role=\"list\"",
            "aria-live=\"polite\"",
        ]
        for copy in expected_copy:
            self.assertIn(copy, js)
        for selector in [".candidate-card--parked", ".candidate-card--rejected", ".chip--risk", ".chip--warning", ":focus-visible"]:
            self.assertIn(selector, css)

    def test_shortlist_ui_handles_empty_edges_and_keyboard_ranking(self):
        js = read_text("src/app.js")
        css = read_text("src/styles.css")
        expected_copy = [
            "No shortlist yet.",
            "Score candidates first, then choose the experiments worth running this cycle.",
            "Only ${ranked.length} candidates are ready. You can continue with a smaller shortlist or score more candidates.",
            "These candidates are tied. Compare feasibility, user fit, and evidence confidence before ranking.",
            "This candidate is promising but weakly supported. Add rationale or move it to Research next.",
            "The shortlist is saved, but export failed. Retry or copy the brief manually.",
            "Research next",
            "Prototype next",
            "Move ${escapeHtml(candidate.title)} up",
            "Move ${escapeHtml(candidate.title)} down",
        ]
        for copy in expected_copy:
            self.assertIn(copy, js)
        self.assertIn(".shortlist-item__rank-actions", css)

    def test_source_intake_form_and_validation_contract_are_present(self):
        html = read_text("index.html")
        js = read_text("src/app.js")
        schema = json.loads(read_text("data/intake-schema.json"))

        self.assertIn('id="source-intake-form"', html)
        self.assertIn('id="draft-card"', html)
        self.assertIn('role="alert"', html)
        self.assertIn('validateSourceDraft', js)
        self.assertIn('buildCandidateDraft', js)
        self.assertIn('localStorage.setItem', js)
        self.assertIn('research-to-project-lab.sourceDraft.v1', js)
        self.assertEqual(set(schema["source_types"]), {"arxiv", "github", "article", "manual"})
        self.assertIn("source_statuses", schema)
        self.assertIn("localStorage", schema["validation_rules"]["persistence"])

    def test_intake_schema_is_compatible_with_candidate_and_source_records(self):
        schema = json.loads(read_text("data/intake-schema.json"))
        candidates = json.loads(read_text("data/candidates.json"))
        sources = json.loads(read_text("data/sources.json"))

        source_types = set(schema["source_types"])
        candidate_fields = set(schema["candidate_draft_fields"])
        self.assertTrue({"title", "source_type", "source_url", "source_ids", "trace"}.issubset(candidate_fields))
        for source in sources:
            self.assertIn(source["source_type"], source_types)
        for candidate in candidates:
            self.assertIn(candidate["source_type"], source_types)
            self.assertIn("source_ids", candidate)
            self.assertIn("trace", candidate)

    def test_search_filter_ui_and_empty_state_are_present(self):
        html = read_text("index.html")
        js = read_text("src/app.js")
        css = read_text("src/styles.css")

        self.assertIn('id="candidate-filters"', html)
        self.assertIn('id="candidate-search"', html)
        self.assertIn('id="source-filter"', html)
        self.assertIn('id="filter-summary"', html)
        self.assertIn("filterCandidates", js)
        self.assertIn("searchableText", js)
        self.assertIn("tagsFor", js)
        self.assertIn("No candidates match those filters", js)
        self.assertIn("title, tag, source", html.lower())
        self.assertIn(".filter-bar", css)
        self.assertIn(".empty-state", css)

    def test_search_filter_uses_candidate_and_source_tags(self):
        candidates = json.loads(read_text("data/candidates.json"))
        sources = json.loads(read_text("data/sources.json"))
        source_by_id = {source["id"]: source for source in sources}

        for candidate in candidates:
            self.assertTrue(candidate["source_ids"])
            tags = []
            for source_id in candidate["source_ids"]:
                tags.extend(source_by_id[source_id]["topic_tags"])
            searchable = " ".join([
                candidate["title"],
                candidate["source_type"],
                candidate["summary"],
                candidate["implied_experiment"],
                *tags,
            ]).lower()
            self.assertIn(candidate["source_type"], searchable)
            self.assertTrue(any(tag in searchable for tag in tags))

        harness = next(candidate for candidate in candidates if "Harness" in candidate["title"])
        harness_tags = source_by_id[harness["source_ids"][0]]["topic_tags"]
        self.assertIn("harness", harness["title"].lower() + " " + " ".join(harness_tags))

    def test_priority_backlog_and_export_controls_are_present(self):
        html = read_text("index.html")
        js = read_text("src/app.js")
        css = read_text("src/styles.css")

        self.assertIn('id="sort-mode"', html)
        self.assertIn('id="backlog"', html)
        self.assertIn('id="export-markdown"', html)
        self.assertIn('id="export-json"', html)
        self.assertIn("priorityScore", js)
        self.assertIn("sortCandidates", js)
        self.assertIn("renderBacklog", js)
        self.assertIn("candidatesToMarkdown", js)
        self.assertIn("downloadJson", js)
        self.assertIn("Nothing to export", js)
        self.assertIn(".export-actions", css)

    def test_priority_score_is_derived_from_visible_rubric_confidence_and_effort(self):
        candidates = json.loads(read_text("data/candidates.json"))
        confidence = {"high": 3, "medium": 2, "low": 1}
        effort = {"one_day": 3, "1 day": 3, "½ day": 3, "three_days": 2, "3 days": 2, "1 week": 1, "needs_review": 1, "unknown": 1}

        scored = []
        for candidate in candidates:
            self.assertIn("evidence_summary", candidate)
            score = (
                candidate["total_score"]
                + confidence[candidate["evidence_summary"]["confidence"]]
                + effort[candidate["estimated_effort"]]
            )
            scored.append((score, candidate["title"]))
        self.assertEqual(max(scored)[1], "Code as Agent Harness")

    def test_onboarding_explains_experiment_brief_workflow(self):
        html = read_text("index.html")
        css = read_text("src/styles.css")

        for copy in [
            "Research intake → experiment brief",
            "Choose the next project with evidence, not vibes.",
            "solo builders, research-heavy founders, and small product/engineering teams",
            "Capture source",
            "Review candidate",
            "Pick lane",
            "Export brief",
            "Saved in this browser only. Export Markdown/JSON before sharing or switching devices.",
            "Weekly experiment shortlist",
            "Paper/repo-to-prototype handoff",
            "Research parking lot hygiene",
        ]:
            self.assertIn(copy, html)
        for selector in [".workflow-grid", ".use-case-grid", ".hero-actions", ".local-note"]:
            self.assertIn(selector, css)

    def test_experiment_brief_lane_actions_persist_and_export(self):
        html = read_text("index.html")
        js = read_text("src/app.js")
        css = read_text("src/styles.css")

        for markup in [
            'id="experiment-briefs"',
            'id="brief-list"',
            'id="brief-form"',
            'id="brief-status"',
            'name="smallest_test"',
            'name="success_criteria"',
            'name="decision_reason"',
        ]:
            self.assertIn(markup, html)
        for behavior in [
            "research-to-project-lab.experimentBriefs.v1",
            "research-to-project-lab.candidateDecisions.v1",
            "laneConfig",
            "createOrUpdateBrief",
            "renderBriefPanel",
            "saveSelectedBriefFromForm",
            "readinessForBrief",
            "experiment_briefs",
            "# Experiment Briefs",
            "Prototype next needs a smallest test and at least one observable success criterion before handoff.",
            "Add a reason so this decision remains auditable.",
            "data-lane=\"research_next\"",
            "data-lane=\"prototype_next\"",
            "data-lane=\"parked\"",
            "data-lane=\"rejected\"",
        ]:
            self.assertIn(behavior, js)
        for selector in [".brief-workspace", ".brief-list", ".brief-editor", ".lane-pill--prototype_next", ".readiness-warning"]:
            self.assertIn(selector, css)


if __name__ == "__main__":
    unittest.main()
