from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
DOC_FILES = [ROOT / "README.md", *sorted((ROOT / "docs").rglob("*.md"))]
LINK_PATTERN = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


class DocumentationFreshnessTests(unittest.TestCase):
    def test_markdown_relative_links_resolve(self):
        missing = []
        for doc in DOC_FILES:
            text = doc.read_text(encoding="utf-8")
            for raw_target in LINK_PATTERN.findall(text):
                target = raw_target.split("#", 1)[0]
                if not target or re.match(r"^[a-z]+://", target) or target.startswith("mailto:"):
                    continue
                resolved = (doc.parent / target).resolve()
                if not resolved.exists():
                    missing.append(f"{doc.relative_to(ROOT)} -> {raw_target}")
        self.assertEqual(missing, [])

    def test_readme_exposes_korean_docs_and_release_gate(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("docs/ko/README.md", readme)
        self.assertIn("docs/ko/user-guide.md", readme)
        self.assertIn("docs/release-checklist.md", readme)
        self.assertIn("document-release", readme)
        self.assertIn("docs freshness QA", readme)
        self.assertIn("i18n docs link", readme)

    def test_docs_do_not_describe_shipped_features_as_absent(self):
        combined = "\n".join(doc.read_text(encoding="utf-8") for doc in DOC_FILES)
        stale_claims = [
            "Live arXiv, GitHub, article, or manual source intake.",
            "Source records, provenance, duplicate handling, and readiness checks.",
            "deployment pipeline.",
            "No push, merge, deploy, or production release.",
            "no separate `SourceRecord` model",
            "It does not crawl live sources, score with an LLM, persist data, authenticate users, deploy anywhere",
        ]
        present = [claim for claim in stale_claims if claim in combined]
        self.assertEqual(present, [])

    def test_release_checklist_contains_documentation_blockers(self):
        checklist = (ROOT / "docs/release-checklist.md").read_text(encoding="utf-8")
        for required in [
            "document-release",
            "Docs freshness QA",
            "i18n docs links",
            "Markdown relative links",
            "Stale shipped/planned claims",
        ]:
            self.assertIn(required, checklist)
    def test_docs_describe_shipped_experiment_brief_workflow(self):
        combined = "\n".join(doc.read_text(encoding="utf-8") for doc in DOC_FILES)
        required = [
            "Experiment Briefs",
            "Research next",
            "Prototype next",
            "Park",
            "Reject",
            "browser-local Experiment Brief",
            "research-to-project-lab.experimentBriefs.v1",
            "Markdown and JSON exports include Experiment Brief data",
        ]
        for copy in required:
            self.assertIn(copy, combined)


if __name__ == "__main__":
    unittest.main()
