from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]


def load_json(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


class CandidateTraceabilityTests(unittest.TestCase):
    def setUp(self):
        self.candidates = load_json("data/candidates.json")
        self.sources = {source["id"]: source for source in load_json("data/sources.json")}

    def test_each_candidate_references_existing_candidate_ready_sources(self):
        self.assertGreaterEqual(len(self.candidates), 3)
        for candidate in self.candidates:
            with self.subTest(candidate=candidate["id"]):
                self.assertIn("source_ids", candidate)
                self.assertTrue(candidate["source_ids"])
                for source_id in candidate["source_ids"]:
                    self.assertIn(source_id, self.sources)
                    self.assertEqual(self.sources[source_id]["intake_status"], "candidate_ready")

    def test_primary_source_url_resolves_from_source_record(self):
        for candidate in self.candidates:
            with self.subTest(candidate=candidate["id"]):
                self.assertIn("primary_source_url", candidate)
                source_urls = {self.sources[source_id]["source_url"] for source_id in candidate["source_ids"]}
                self.assertIn(candidate["primary_source_url"], source_urls)
                self.assertEqual(candidate["primary_source_url"], candidate["source_url"])

    def test_trace_keeps_extraction_method_evidence_refs_and_rationale(self):
        for candidate in self.candidates:
            with self.subTest(candidate=candidate["id"]):
                trace = candidate.get("trace")
                self.assertIsInstance(trace, dict)
                self.assertIn(trace["extraction_method"], {"manual", "fixture", "llm_assisted", "adapter"})
                self.assertTrue(trace["rationale"])
                self.assertTrue(trace["reviewer_notes"])
                self.assertTrue(trace["source_evidence_refs"])
                for evidence_ref in trace["source_evidence_refs"]:
                    source_id, separator, evidence_index = evidence_ref.partition("#evidence-")
                    self.assertEqual(separator, "#evidence-")
                    self.assertIn(source_id, self.sources)
                    self.assertLess(int(evidence_index), len(self.sources[source_id]["evidence_notes"]))

    def test_blocked_status_sources_are_not_used_for_candidate_extraction(self):
        blocked_statuses = {"needs_review", "ignored", "rejected"}
        blocked_ids = {
            source["id"] for source in self.sources.values()
            if source["intake_status"] in blocked_statuses
        }
        self.assertTrue(blocked_ids)
        used_ids = {source_id for candidate in self.candidates for source_id in candidate["source_ids"]}
        self.assertEqual(used_ids & blocked_ids, set())


if __name__ == "__main__":
    unittest.main()
