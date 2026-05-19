from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_SOURCE_FIELDS = {
    "id",
    "source_type",
    "title",
    "discovered_at",
    "collected_by",
    "intake_batch",
    "intake_status",
}
ALLOWED_SOURCE_TYPES = {"arxiv", "github", "article", "manual"}
ALLOWED_COLLECTORS = {"manual", "fixture", "github_adapter", "arxiv_adapter", "article_adapter"}
ALLOWED_STATUSES = {"new", "parsed", "candidate_ready", "needs_review", "ignored", "rejected"}
ALLOWED_EVIDENCE_TYPES = {
    "repo_activity",
    "paper_method",
    "benchmark",
    "recency",
    "user_signal",
    "market_signal",
    "negative_signal",
    "unknown",
}
ALLOWED_STRENGTHS = {"weak", "medium", "strong"}


def load_json(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


class SourceRecordModelTests(unittest.TestCase):
    def setUp(self):
        self.sources = load_json("data/sources.json")

    def test_source_records_fixture_exists_and_covers_mvp_types(self):
        self.assertGreaterEqual(len(self.sources), 5)
        source_types = {source["source_type"] for source in self.sources}
        self.assertIn("arxiv", source_types)
        self.assertIn("github", source_types)
        self.assertIn("manual", source_types)

    def test_source_records_have_protocol_required_fields(self):
        seen_ids = set()
        for source in self.sources:
            with self.subTest(source=source.get("id")):
                self.assertEqual(REQUIRED_SOURCE_FIELDS - set(source), set())
                self.assertTrue(source["id"].startswith("src_"))
                self.assertNotIn(source["id"], seen_ids)
                seen_ids.add(source["id"])
                self.assertIn(source["source_type"], ALLOWED_SOURCE_TYPES)
                self.assertTrue(source["title"])
                self.assertTrue(source["raw_summary"] or source["user_note"])
                self.assertIn(source["collected_by"], ALLOWED_COLLECTORS)
                self.assertIn(source["intake_status"], ALLOWED_STATUSES)
                self.assertIsInstance(source["topic_tags"], list)
                self.assertIsInstance(source["metadata"], dict)
                self.assertIsInstance(source["evidence_notes"], list)
                self.assertIsInstance(source["risks"], list)
                self.assertIn("review", source)
                self.assertIn("duplicate_of", source)

    def test_manual_source_without_url_requires_no_url_rationale(self):
        manual_without_url = [
            source for source in self.sources
            if source["source_type"] == "manual" and source.get("source_url") is None
        ]
        self.assertTrue(manual_without_url)
        for source in manual_without_url:
            notes = " ".join(source.get("review", {}).get("review_notes", []))
            self.assertIn("No URL", notes)
            self.assertTrue(source["user_note"])

    def test_candidate_ready_sources_include_evidence_risk_tags_and_review_rationale(self):
        ready_sources = [source for source in self.sources if source["intake_status"] == "candidate_ready"]
        self.assertGreaterEqual(len(ready_sources), 3)
        for source in ready_sources:
            with self.subTest(source=source["id"]):
                self.assertTrue(source.get("source_url") or source["source_type"] == "manual")
                self.assertTrue(source["topic_tags"])
                self.assertTrue(source["evidence_notes"])
                self.assertTrue(source["risks"])
                self.assertIn("duplicate_of", source)
                self.assertTrue(source["review"]["review_notes"])
                for note in source["evidence_notes"]:
                    self.assertTrue(note["claim"])
                    self.assertIn(note["evidence_type"], ALLOWED_EVIDENCE_TYPES)
                    self.assertTrue(note["source_quote_or_detail"])
                    self.assertIn(note["strength"], ALLOWED_STRENGTHS)

    def test_non_ready_source_records_preserve_audit_reason(self):
        for source in self.sources:
            if source["intake_status"] in {"needs_review", "ignored", "rejected"}:
                with self.subTest(source=source["id"]):
                    review = source["review"]
                    audit_text = " ".join(review.get("review_notes", []) + [review.get("rejection_reason") or ""])
                    self.assertTrue(audit_text.strip())


if __name__ == "__main__":
    unittest.main()
