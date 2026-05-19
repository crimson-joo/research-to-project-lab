from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[1]
RUBRIC_KEYS = {"novelty", "feasibility", "leverage", "evidence", "user_fit"}


def load_json(relative_path: str):
    return json.loads((ROOT / relative_path).read_text(encoding="utf-8"))


class ScoringConsistencyTests(unittest.TestCase):
    def setUp(self):
        self.candidates = load_json("data/candidates.json")
        self.sources = {source["id"]: source for source in load_json("data/sources.json")}

    def test_total_score_is_derived_from_visible_rubric_dimensions(self):
        for candidate in self.candidates:
            with self.subTest(candidate=candidate["id"]):
                self.assertEqual(set(candidate["scores"]), RUBRIC_KEYS)
                self.assertTrue(all(1 <= value <= 5 for value in candidate["scores"].values()))
                self.assertEqual(candidate["total_score"], sum(candidate["scores"].values()))

    def test_candidate_evidence_score_does_not_exceed_source_strength_ceiling(self):
        strength_ceiling = {"weak": 2, "medium": 4, "strong": 5}
        for candidate in self.candidates:
            max_strength = max(
                strength_ceiling[note["strength"]]
                for source_id in candidate["source_ids"]
                for note in self.sources[source_id]["evidence_notes"]
            )
            with self.subTest(candidate=candidate["id"]):
                self.assertLessEqual(candidate["scores"]["evidence"], max_strength)

    def test_shortlisted_candidates_have_medium_or_better_visible_evidence(self):
        for candidate in self.candidates:
            if candidate["status"] == "shortlisted":
                strengths = [
                    note["strength"]
                    for source_id in candidate["source_ids"]
                    for note in self.sources[source_id]["evidence_notes"]
                ]
                with self.subTest(candidate=candidate["id"]):
                    self.assertTrue(set(strengths) & {"medium", "strong"})


if __name__ == "__main__":
    unittest.main()
