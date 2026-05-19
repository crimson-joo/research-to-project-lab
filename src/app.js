const rubricLabels = {
  novelty: "Novelty",
  feasibility: "Feasibility",
  leverage: "Leverage",
  evidence: "Evidence strength",
  user_fit: "User fit",
};

const rubricDescriptions = {
  novelty: "Does this reveal a new angle or capability?",
  feasibility: "Can a small builder test it in 1–3 days?",
  leverage: "Will the experiment create reusable assets?",
  evidence: "Is there enough source signal to justify attention?",
  user_fit: "Does it match the user's current experiment goals?",
};

function scoreEntries(scores) {
  return Object.entries(rubricLabels).map(([key, label]) => ({
    key,
    label,
    value: scores[key],
  }));
}

function renderRubric() {
  const rubric = document.querySelector("#rubric");
  rubric.innerHTML = Object.entries(rubricLabels)
    .map(
      ([key, label]) => `
        <li>
          <strong>${label}</strong>
          <span>${rubricDescriptions[key]}</span>
        </li>
      `,
    )
    .join("");
}

function renderCandidates(candidates) {
  const list = document.querySelector("#candidate-list");
  const count = document.querySelector("#candidate-count");
  count.textContent = `${candidates.length} candidates`;
  list.innerHTML = candidates
    .map(
      (candidate) => `
        <article class="candidate-card">
          <div class="candidate-card__header">
            <div>
              <p class="source-type">${candidate.source_type}</p>
              <h3>${candidate.title}</h3>
            </div>
            <span class="score">${candidate.total_score}</span>
          </div>
          <p>${candidate.summary}</p>
          <dl>
            <div>
              <dt>Why interesting</dt>
              <dd>${candidate.why_interesting}</dd>
            </div>
            <div>
              <dt>Experiment</dt>
              <dd>${candidate.implied_experiment}</dd>
            </div>
          </dl>
          <div class="score-grid">
            ${scoreEntries(candidate.scores)
              .map(
                (score) => `
                  <span title="${score.label}">
                    ${score.label}: <strong>${score.value}</strong>
                  </span>
                `,
              )
              .join("")}
          </div>
          <footer>
            <a href="${candidate.source_url}" target="_blank" rel="noreferrer">Open source</a>
            <span>${candidate.status}</span>
          </footer>
        </article>
      `,
    )
    .join("");
}

function renderShortlist(candidates) {
  const shortlist = document.querySelector("#shortlist");
  const ranked = [...candidates]
    .filter((candidate) => candidate.status === "shortlisted")
    .sort((left, right) => right.total_score - left.total_score)
    .slice(0, 3);

  shortlist.innerHTML = ranked
    .map(
      (candidate) => `
        <li>
          <strong>${candidate.title}</strong>
          <span>${candidate.total_score} points — ${candidate.implied_experiment}</span>
        </li>
      `,
    )
    .join("");
}

async function main() {
  renderRubric();
  const response = await fetch("data/candidates.json");
  const candidates = await response.json();
  renderCandidates(candidates);
  renderShortlist(candidates);
}

main().catch((error) => {
  document.querySelector("#candidate-list").innerHTML = `
    <p class="error">Unable to load candidate data: ${error.message}</p>
  `;
});
