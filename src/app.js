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
  const filtered = candidates.filter((candidate) => {
    const sourceMatches = filters.sourceType === "all" || candidate.source_type === filters.sourceType;
    const queryMatches = !query || searchableText(candidate).includes(query);
    return sourceMatches && queryMatches;
  });
  return sortCandidates(filtered, filters.sortMode);
}

function currentFilters() {
  return {
    query: document.querySelector("#candidate-search").value,
    sourceType: document.querySelector("#source-filter").value,
    sortMode: document.querySelector("#sort-mode").value,
  };
}

function effortScore(candidate) {
  const effort = { one_day: 3, three_days: 2, needs_review: 1 };
  return effort[candidate.estimated_effort] || 1;
}

function confidenceScore(candidate) {
  const confidence = { high: 3, medium: 2, low: 1 };
  return confidence[candidate.evidence_summary?.confidence] || 1;
}

function priorityScore(candidate) {
  return candidate.total_score + confidenceScore(candidate) + effortScore(candidate);
}

function sortCandidates(candidates, sortMode = "priority") {
  const sorted = [...candidates];
  if (sortMode === "title") {
    return sorted.sort((left, right) => left.title.localeCompare(right.title));
  }
  if (sortMode === "source") {
    return sorted.sort((left, right) => left.source_type.localeCompare(right.source_type) || right.total_score - left.total_score);
  }
  return sorted.sort((left, right) => priorityScore(right) - priorityScore(left) || right.total_score - left.total_score);
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
            <span class="score">P${escapeHtml(priorityScore(candidate))}</span>
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
            <span title="Computed backlog priority">Priority: <strong>${escapeHtml(priorityScore(candidate))}</strong></span>
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
  const visibleCandidates = filterCandidates(allCandidates, filters);
  renderCandidates(visibleCandidates, filters);
  renderBacklog(visibleCandidates);
}

function renderBacklog(candidates) {
  const backlog = document.querySelector("#backlog");
  backlog.innerHTML = sortCandidates(candidates, "priority")
    .map(
      (candidate) => `
        <li>
          <strong>${escapeHtml(candidate.title)}</strong>
          <span>Priority ${escapeHtml(priorityScore(candidate))} — ${escapeHtml(candidate.estimated_effort)} — ${escapeHtml(candidate.evidence_summary?.confidence || "unknown")} confidence</span>
        </li>
      `,
    )
    .join("");
}

function candidatesToMarkdown(candidates) {
  return candidates.map((candidate, index) => [
    `## ${index + 1}. ${candidate.title}`,
    `- Source: ${candidate.source_type} — ${candidate.source_url}`,
    `- Priority: ${priorityScore(candidate)} / Rubric: ${candidate.total_score}`,
    `- Status: ${candidate.status}`,
    `- Experiment: ${candidate.implied_experiment}`,
    `- Risks: ${(candidate.risks || []).join("; ")}`,
  ].join("\n")).join("\n\n");
}

function exportPayload(candidates) {
  return candidates.map((candidate) => ({
    id: candidate.id,
    title: candidate.title,
    source_type: candidate.source_type,
    source_url: candidate.source_url,
    status: candidate.status,
    total_score: candidate.total_score,
    priority_score: priorityScore(candidate),
    tags: tagsFor(candidate),
    implied_experiment: candidate.implied_experiment,
    risks: candidate.risks || [],
  }));
}

async function copyMarkdown(candidates) {
  const markdown = candidatesToMarkdown(candidates);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(markdown);
    return "Copied Markdown export to clipboard.";
  }
  return markdown;
}

function downloadJson(candidates) {
  const blob = new Blob([JSON.stringify(exportPayload(candidates), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "research-to-project-candidates.json";
  link.click();
  URL.revokeObjectURL(link.href);
}

function setupExports() {
  const status = document.querySelector("#export-status");
  document.querySelector("#export-markdown").addEventListener("click", async () => {
    const candidates = filterCandidates(allCandidates, currentFilters());
    if (!candidates.length) {
      status.textContent = "Nothing to export: current filters match zero candidates.";
      return;
    }
    const result = await copyMarkdown(candidates);
    status.textContent = result.startsWith("## ") ? "Clipboard unavailable; Markdown export is prepared in memory." : result;
  });
  document.querySelector("#export-json").addEventListener("click", () => {
    const candidates = filterCandidates(allCandidates, currentFilters());
    if (!candidates.length) {
      status.textContent = "Nothing to export: current filters match zero candidates.";
      return;
    }
    downloadJson(candidates);
    status.textContent = `Downloaded JSON export for ${candidates.length} candidates.`;
  });
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
  setupExports();
  const [candidateResponse, sourceResponse] = await Promise.all([
    fetch("data/candidates.json"),
    fetch("data/sources.json"),
  ]);
  allCandidates = await candidateResponse.json();
  const sources = await sourceResponse.json();
  sourceById = new Map(sources.map((source) => [source.id, source]));
  const initialCandidates = sortCandidates(allCandidates, "priority");
  renderCandidates(initialCandidates);
  renderBacklog(initialCandidates);
  renderShortlist(allCandidates);
}

main().catch((error) => {
  document.querySelector("#candidate-list").innerHTML = `
    <p class="error">Unable to load candidate data: ${escapeHtml(error.message)}</p>
  `;
});
