from pathlib import Path
import json
import re
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
        self.assertIn("renderCandidates", js)
        self.assertIn("renderShortlist", js)
        self.assertRegex(js, r"novelty|feasibility|leverage|evidence|user_fit")
        self.assertIn(".candidate-card", css)

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


if __name__ == "__main__":
    unittest.main()
