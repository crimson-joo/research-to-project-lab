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

let allCandidates = [];
let sourceById = new Map();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[char];
  });
}

function sourceRecordsFor(candidate) {
  return (candidate.source_ids || []).map((sourceId) => sourceById.get(sourceId)).filter(Boolean);
}

function tagsFor(candidate) {
  const sourceTags = sourceRecordsFor(candidate).flatMap((source) => source.topic_tags || []);
  const candidateTags = [candidate.source_type, candidate.status, candidate.estimated_effort];
  return [...new Set([...sourceTags, ...candidateTags].filter(Boolean))];
}

function searchableText(candidate) {
  return [
    candidate.title,
    candidate.source_type,
    candidate.status,
    candidate.summary,
    candidate.why_interesting,
    candidate.implied_experiment,
    ...(candidate.required_inputs || []),
    ...(candidate.risks || []),
    ...tagsFor(candidate),
    ...sourceRecordsFor(candidate).flatMap((source) => [source.title, source.raw_summary, source.user_note]),
  ]
    .join(" ")
    .toLowerCase();
}

function filterCandidates(candidates, filters) {
  const query = filters.query.trim().toLowerCase();
  return candidates.filter((candidate) => {
    const sourceMatches = filters.sourceType === "all" || candidate.source_type === filters.sourceType;
    const queryMatches = !query || searchableText(candidate).includes(query);
    return sourceMatches && queryMatches;
  });
}

function currentFilters() {
  return {
    query: document.querySelector("#candidate-search").value,
    sourceType: document.querySelector("#source-filter").value,
  };
}

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
          <strong>${escapeHtml(label)}</strong>
          <span>${escapeHtml(rubricDescriptions[key])}</span>
        </li>
      `,
    )
    .join("");
}

function renderCandidates(candidates, filters = { query: "", sourceType: "all" }) {
  const list = document.querySelector("#candidate-list");
  const count = document.querySelector("#candidate-count");
  const summary = document.querySelector("#filter-summary");
  count.textContent = `${candidates.length} candidates`;
  summary.textContent = filters.query || filters.sourceType !== "all"
    ? `${candidates.length} of ${allCandidates.length} candidates match current filters.`
    : "Search covers titles, tags, source metadata, source type, and experiment text.";

  if (!candidates.length) {
    list.innerHTML = `
      <article class="empty-state">
        <h3>No candidates match those filters</h3>
        <p>Try a broader keyword, clear the source type, or reset filters.</p>
      </article>
    `;
    return;
  }

  list.innerHTML = candidates
    .map((candidate) => {
      const tags = tagsFor(candidate);
      return `
        <article class="candidate-card">
          <div class="candidate-card__header">
            <div>
              <p class="source-type">${escapeHtml(candidate.source_type)}</p>
              <h3>${escapeHtml(candidate.title)}</h3>
            </div>
            <span class="score">${escapeHtml(candidate.total_score)}</span>
          </div>
          <p>${escapeHtml(candidate.summary)}</p>
          <div class="tag-list" aria-label="Candidate tags">
            ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
          </div>
          <dl>
            <div>
              <dt>Why interesting</dt>
              <dd>${escapeHtml(candidate.why_interesting)}</dd>
            </div>
            <div>
              <dt>Experiment</dt>
              <dd>${escapeHtml(candidate.implied_experiment)}</dd>
            </div>
          </dl>
          <div class="score-grid">
            ${scoreEntries(candidate.scores)
              .map(
                (score) => `
                  <span title="${escapeHtml(score.label)}">
                    ${escapeHtml(score.label)}: <strong>${escapeHtml(score.value)}</strong>
                  </span>
                `,
              )
              .join("")}
          </div>
          <footer>
            <a href="${escapeHtml(candidate.source_url)}" target="_blank" rel="noreferrer">Open source</a>
            <span>${escapeHtml(candidate.status)}</span>
          </footer>
        </article>
      `;
    })
    .join("");
}

function renderFilteredCandidates() {
  const filters = currentFilters();
  renderCandidates(filterCandidates(allCandidates, filters), filters);
}

function setupFilters() {
  const form = document.querySelector("#candidate-filters");
  form.addEventListener("input", renderFilteredCandidates);
  form.addEventListener("reset", () => {
    window.setTimeout(renderFilteredCandidates, 0);
  });
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
          <strong>${escapeHtml(candidate.title)}</strong>
          <span>${escapeHtml(candidate.total_score)} points — ${escapeHtml(candidate.implied_experiment)}</span>
        </li>
      `,
    )
    .join("");
}

async function main() {
  renderRubric();
  setupFilters();
  const [candidateResponse, sourceResponse] = await Promise.all([
    fetch("data/candidates.json"),
    fetch("data/sources.json"),
  ]);
  allCandidates = await candidateResponse.json();
  const sources = await sourceResponse.json();
  sourceById = new Map(sources.map((source) => [source.id, source]));
  renderCandidates(allCandidates);
  renderShortlist(allCandidates);
}

main().catch((error) => {
  document.querySelector("#candidate-list").innerHTML = `
    <p class="error">Unable to load candidate data: ${escapeHtml(error.message)}</p>
  `;
});
