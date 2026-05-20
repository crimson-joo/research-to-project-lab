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

const allowedSourceTypes = new Set(["arxiv", "github", "article", "manual"]);
const draftStorageKey = "research-to-project-lab.sourceDraft.v1";
let loadedCandidates = [];
let allCandidates = [];
let sourceById = new Map();

const statusConfig = {
  new: { label: "New", primary: "Review card", guardrail: "Review extracted fields before ranking." },
  needs_review: { label: "Needs review", primary: "Resolve review items", guardrail: "This card needs review before it can be ranked." },
  needs_scoring: { label: "Needs scoring", primary: "Score candidate", guardrail: "Missing feasibility/evidence score." },
  scored: { label: "Scored", primary: "Consider for shortlist", guardrail: "Show why top / why not top when score is high or low." },
  shortlisted: { label: "Shortlisted", primary: "Draft experiment brief", guardrail: "Must show rationale and next lane." },
  parked: { label: "Parked", primary: "Revisit", guardrail: "Parked reason is required." },
  rejected: { label: "Rejected", primary: "Restore", guardrail: "Reject reason is required; do not delete by default." },
  duplicate_risk: { label: "Duplicate risk", primary: "Compare duplicate", guardrail: "Do not auto-merge or auto-delete." },
  conflicting_evidence: { label: "Conflicting evidence", primary: "Review evidence", guardrail: "Sources disagree. Review the evidence before promoting." },
  fetch_error: { label: "Fetch/error-backed", primary: "Enter details manually", guardrail: "We couldn’t fetch this source. The URL is saved. Retry, or enter details manually." },
};

const candidateEmptyStates = {
  noCandidates: {
    title: "No candidate cards yet.",
    body: "Add sources first, then extract candidate experiments from them.",
    actions: ["Go to Intake", "Create manual candidate"],
  },
  noMatches: {
    title: "No candidates match those filters",
    body: "Try a broader keyword, clear the source type, or reset filters.",
    actions: ["Clear filters", "Show all statuses", "Create manual candidate"],
  },
};

const candidateErrorCopy = {
  invalidUrl: "This source format is not recognized. Keep the text, choose a source type, or enter details manually.",
  fetchFailed: "We couldn’t fetch this source. The URL is saved. Retry, or enter details manually.",
  lowConfidence: "This card needs review before it can be ranked.",
  missingExperiment: "Define the smallest test before this can move forward.",
  overbroad: "This idea is too broad for a 1–3 day experiment. Split it into smaller tests.",
  conflictingEvidence: "Sources disagree. Review the evidence before promoting.",
};

const candidateListSemantics = 'role="list" aria-live="polite"';

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" };
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
  ].join(" ").toLowerCase();
}

function effortScore(candidate) {
  const effort = { one_day: 3, "1 day": 3, "½ day": 3, three_days: 2, "3 days": 2, "1 week": 1, needs_review: 1, unknown: 1 };
  return effort[candidate.estimated_effort] || 1;
}

function confidenceScore(candidate) {
  const confidence = { high: 3, medium: 2, low: 1 };
  const raw = candidate.evidence_summary?.confidence || String(candidate.confidence || "").toLowerCase().split(" ")[0];
  return confidence[raw] || 1;
}

function priorityScore(candidate) {
  return candidate.total_score + confidenceScore(candidate) + effortScore(candidate);
}

function sortCandidates(candidates, sortMode = "priority") {
  const sorted = [...candidates];
  if (sortMode === "title") return sorted.sort((left, right) => left.title.localeCompare(right.title));
  if (sortMode === "source") return sorted.sort((left, right) => left.source_type.localeCompare(right.source_type) || right.total_score - left.total_score);
  return sorted.sort((left, right) => priorityScore(right) - priorityScore(left) || right.total_score - left.total_score);
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
    query: document.querySelector("#candidate-search")?.value || "",
    sourceType: document.querySelector("#source-filter")?.value || "all",
    sortMode: document.querySelector("#sort-mode")?.value || "priority",
  };
}

function scoreEntries(scores) {
  return Object.entries(rubricLabels).map(([key, label]) => ({ key, label, value: scores[key] }));
}

function formatStatus(status) {
  return statusConfig[status] ?? { label: status.replaceAll("_", " "), primary: "Review card", guardrail: "Review before promotion." };
}

function sourceBadge(candidate) {
  const sourceType = escapeHtml(candidate.source_type);
  const sourceCount = Number(candidate.source_count ?? 1);
  return `${sourceType} · ${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`;
}

function actionButtons(candidate) {
  const title = escapeHtml(candidate.title);
  const configured = formatStatus(candidate.status);
  const actions = [
    { label: candidate.primary_action || configured.primary, kind: "primary" },
    { label: "Research next", kind: "secondary" },
    { label: "Prototype next", kind: "secondary" },
    { label: "Park", kind: "secondary" },
    { label: "Reject", kind: "secondary" },
  ];
  return actions.map((action) => `
    <button class="button button--${action.kind}" type="button" aria-label="${escapeHtml(action.label)} ${title}">
      ${escapeHtml(action.label)}
    </button>
  `).join("");
}

function chipList(items, type) {
  return (items || []).map((item) => `<span class="chip chip--${type}">${escapeHtml(item)}</span>`).join("");
}

function renderRubric() {
  const rubric = document.querySelector("#rubric");
  rubric.innerHTML = Object.entries(rubricLabels).map(([key, label]) => `
    <li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(rubricDescriptions[key])}</span></li>
  `).join("");
}

function renderEmptyState(target, state) {
  target.innerHTML = `
    <div class="empty-state" role="status" aria-live="polite">
      <h3>${escapeHtml(state.title)}</h3>
      <p>${escapeHtml(state.body)}</p>
      <div class="action-row">${state.actions.map((action) => `<button class="button" type="button">${escapeHtml(action)}</button>`).join("")}</div>
    </div>
  `;
}

function renderCandidates(candidates, filters = { query: "", sourceType: "all", sortMode: "priority" }) {
  const list = document.querySelector("#candidate-list");
  const count = document.querySelector("#candidate-count");
  const summary = document.querySelector("#filter-summary");
  count.textContent = `${candidates.length} candidates`;
  if (summary) {
    summary.textContent = filters.query || filters.sourceType !== "all"
      ? `${candidates.length} of ${allCandidates.length} candidates match current filters.`
      : "Search covers titles, tags, source metadata, source type, and experiment text.";
  }

  if (!candidates.length) {
    renderEmptyState(list, allCandidates.length ? candidateEmptyStates.noMatches : candidateEmptyStates.noCandidates);
    return;
  }

  list.setAttribute("role", "list");
  list.setAttribute("aria-live", "polite");
  list.innerHTML = candidates.map((candidate) => {
    const status = formatStatus(candidate.status);
    const stateClass = `candidate-card--${candidate.status.replaceAll("_", "-")}`;
    const evidenceWarnings = [...(candidate.warnings || [])];
    const tags = tagsFor(candidate);
    if (candidate.status === "fetch_error") evidenceWarnings.push(candidateErrorCopy.fetchFailed);
    if (candidate.status === "needs_review") evidenceWarnings.push(candidateErrorCopy.lowConfidence);
    if (candidate.status === "conflicting_evidence") evidenceWarnings.push(candidateErrorCopy.conflictingEvidence);

    return `
      <article class="candidate-card ${stateClass}" role="listitem" aria-labelledby="candidate-${candidate.id}-title">
        <div class="candidate-card__header">
          <div>
            <p class="source-type">${sourceBadge(candidate)}</p>
            <h3 id="candidate-${candidate.id}-title">${escapeHtml(candidate.title)}</h3>
          </div>
          <span class="score" aria-label="Priority score ${priorityScore(candidate)} and total rubric score ${candidate.total_score} out of 25">P${priorityScore(candidate)}</span>
        </div>
        <div class="status-row">
          <span class="status-label">${escapeHtml(status.label)}</span>
          <span>${escapeHtml(candidate.confidence || candidate.evidence_summary?.confidence || "unknown confidence")}</span>
          <span>${escapeHtml(candidate.next_lane || candidate.estimated_effort || "needs review")}</span>
        </div>
        <p>${escapeHtml(candidate.summary)}</p>
        <div class="tag-list" aria-label="Candidate tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <dl>
          <div><dt>Why interesting</dt><dd>${escapeHtml(candidate.why_interesting)}</dd></div>
          <div><dt>Experiment</dt><dd>${escapeHtml(candidate.implied_experiment || candidateErrorCopy.missingExperiment)}</dd></div>
          <div><dt>Guardrail</dt><dd>${escapeHtml(status.guardrail)}</dd></div>
        </dl>
        <div class="score-grid" aria-label="Score breakdown for ${escapeHtml(candidate.title)}">
          <span title="Computed backlog priority">Priority: <strong>${priorityScore(candidate)}</strong></span>
          ${scoreEntries(candidate.scores).map((score) => `
            <span title="${escapeHtml(score.label)}" aria-label="${escapeHtml(score.label)} ${score.value} out of 5. Reason: ${escapeHtml(candidate.score_reasons?.[score.key] || "No reason provided")}">
              ${escapeHtml(score.label)}: <strong>${escapeHtml(score.value)}</strong>
            </span>
          `).join("")}
        </div>
        <div class="chip-row" aria-label="Risks and warnings">${chipList(candidate.risks, "risk")}${chipList(evidenceWarnings, "warning")}</div>
        <footer>
          <a href="${escapeHtml(candidate.source_url)}" target="_blank" rel="noreferrer">Open source</a>
          <div class="action-row">${actionButtons(candidate)}</div>
        </footer>
      </article>
    `;
  }).join("");
}

function shortlistNotices(ranked) {
  const notices = [];
  if (ranked.length > 0 && ranked.length < 3) notices.push(`Only ${ranked.length} candidates are ready. You can continue with a smaller shortlist or score more candidates.`);
  if (ranked.some((candidate) => candidate.tie_group)) notices.push("These candidates are tied. Compare feasibility, user fit, and evidence confidence before ranking.");
  if (ranked.some((candidate) => candidate.evidence_strength === "weak" || candidate.confidence === "Low confidence")) notices.push("This candidate is promising but weakly supported. Add rationale or move it to Research next.");
  notices.push("The shortlist is saved, but export failed. Retry or copy the brief manually.");
  return notices;
}

function renderShortlist(candidates) {
  const shortlist = document.querySelector("#shortlist");
  const ranked = [...candidates].filter((candidate) => candidate.status === "shortlisted").sort((left, right) => right.total_score - left.total_score).slice(0, 3);
  if (ranked.length === 0) {
    shortlist.innerHTML = `<li class="empty-state" role="status" aria-live="polite"><strong>No shortlist yet.</strong><span>Score candidates first, then choose the experiments worth running this cycle.</span><button class="button" type="button">Open scoring</button></li>`;
    return;
  }
  const notices = shortlistNotices(ranked);
  shortlist.innerHTML = `
    ${notices.map((notice) => `<li class="shortlist-notice">${escapeHtml(notice)}</li>`).join("")}
    ${ranked.map((candidate, index) => `
      <li class="shortlist-item" aria-label="Rank ${index + 1} of ${ranked.length}: ${escapeHtml(candidate.title)}">
        <div class="shortlist-item__rank">#${index + 1}</div>
        <div><strong>${escapeHtml(candidate.title)}</strong><span>${candidate.total_score} points · ${escapeHtml(candidate.confidence || candidate.evidence_summary?.confidence || "unknown")} · ${escapeHtml(candidate.next_lane || candidate.estimated_effort || "needs review")}</span><p>${escapeHtml(candidate.implied_experiment)}</p><p><strong>Acceptance check:</strong> ${escapeHtml(candidate.acceptance_check || "Define a pass/fail check before running.")}</p></div>
        <div class="shortlist-item__rank-actions" aria-label="Keyboard ranking controls"><button class="button" type="button" aria-label="Move ${escapeHtml(candidate.title)} up">Move up</button><button class="button" type="button" aria-label="Move ${escapeHtml(candidate.title)} down">Move down</button></div>
      </li>
    `).join("")}
  `;
}

function renderBacklog(candidates) {
  const backlog = document.querySelector("#backlog");
  if (!backlog) return;
  backlog.innerHTML = sortCandidates(candidates, "priority").map((candidate) => `
    <li><strong>${escapeHtml(candidate.title)}</strong><span>Priority ${escapeHtml(priorityScore(candidate))} — ${escapeHtml(candidate.estimated_effort)} — ${escapeHtml(candidate.evidence_summary?.confidence || candidate.confidence || "unknown")} confidence</span></li>
  `).join("");
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

function renderFilteredCandidates() {
  const filters = currentFilters();
  const visibleCandidates = filterCandidates(allCandidates, filters);
  renderCandidates(visibleCandidates, filters);
  renderBacklog(visibleCandidates);
}

function setupExports() {
  const status = document.querySelector("#export-status");
  document.querySelector("#export-markdown")?.addEventListener("click", async () => {
    const candidates = filterCandidates(allCandidates, currentFilters());
    if (!candidates.length) { status.textContent = "Nothing to export: current filters match zero candidates."; return; }
    const result = await copyMarkdown(candidates);
    status.textContent = result.startsWith("## ") ? "Clipboard unavailable; Markdown export is prepared in memory." : result;
  });
  document.querySelector("#export-json")?.addEventListener("click", () => {
    const candidates = filterCandidates(allCandidates, currentFilters());
    if (!candidates.length) { status.textContent = "Nothing to export: current filters match zero candidates."; return; }
    downloadJson(candidates);
    status.textContent = `Downloaded JSON export for ${candidates.length} candidates.`;
  });
}

function setupFilters() {
  const form = document.querySelector("#candidate-filters");
  if (!form) return;
  form.addEventListener("input", renderFilteredCandidates);
  form.addEventListener("reset", () => window.setTimeout(renderFilteredCandidates, 0));
}

function normalizeDraft(formData) {
  return {
    source_type: String(formData.get("source_type") || "").trim(),
    source_url: String(formData.get("source_url") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    user_note: String(formData.get("user_note") || "").trim(),
  };
}

function isHttpUrl(value) {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch (_error) { return false; }
}

function validateSourceDraft(draft) {
  const errors = [];
  if (!allowedSourceTypes.has(draft.source_type)) errors.push("Choose a supported source type.");
  if (!draft.title && !draft.user_note) errors.push("Add a working title or user note so the draft is reviewable.");
  if (draft.source_type === "manual") {
    if (!draft.user_note) errors.push("Manual notes need a user note that explains where the idea came from.");
  } else if (!draft.source_url || !isHttpUrl(draft.source_url)) {
    errors.push("GitHub, arXiv, and article sources need a valid http(s) URL.");
  }
  return errors;
}

function buildCandidateDraft(sourceDraft) {
  const title = sourceDraft.title || "Untitled research lead";
  const sourceId = `draft-${sourceDraft.source_type}-${Date.now()}`;
  return {
    id: `${sourceId}-candidate`, title, source_type: sourceDraft.source_type, source_url: sourceDraft.source_url || "manual://local-note",
    summary: sourceDraft.user_note || "Draft source captured for later human review.",
    why_interesting: "Needs human review before scoring or shortlist promotion.",
    implied_experiment: `Review ${title} and decide whether it deserves a scored experiment brief.`,
    required_inputs: ["source review", "rubric scoring", "risk notes"], estimated_effort: "needs_review",
    scores: { novelty: 1, feasibility: 1, leverage: 1, evidence: 1, user_fit: 1 }, total_score: 5,
    risks: ["Draft has not been verified against the source."], status: "needs_review", source_ids: [sourceId], source_count: 1,
    trace: { primary_source_id: sourceId, extraction_method: "manual_intake_form", evidence_refs: [sourceDraft.source_url || "manual note"], review_rationale: sourceDraft.user_note || "Captured from intake form." },
  };
}

function persistDraft(draft) { window.localStorage.setItem(draftStorageKey, JSON.stringify(draft)); }
function loadPersistedDraft() { try { const raw = window.localStorage.getItem(draftStorageKey); return raw ? JSON.parse(raw) : null; } catch (_error) { return null; } }
function clearPersistedDraft() { window.localStorage.removeItem(draftStorageKey); }

function renderDraft(candidate) {
  const draftCard = document.querySelector("#draft-card");
  if (!draftCard) return;
  if (!candidate) { draftCard.hidden = true; draftCard.innerHTML = ""; return; }
  draftCard.hidden = false;
  draftCard.innerHTML = `
    <div class="candidate-card__header"><div><p class="source-type">${escapeHtml(candidate.source_type)} draft</p><h3>${escapeHtml(candidate.title)}</h3></div><span class="score">Needs review</span></div>
    <p>${escapeHtml(candidate.summary)}</p>
    <dl><div><dt>Next step</dt><dd>${escapeHtml(candidate.implied_experiment)}</dd></div><div><dt>Persistence</dt><dd>Saved locally as a browser draft; not synced or production persistence.</dd></div></dl>
  `;
}

function showIntakeErrors(errors) {
  const error = document.querySelector("#intake-error");
  if (!error) return;
  if (!errors.length) { error.hidden = true; error.textContent = ""; return; }
  error.hidden = false;
  error.textContent = errors.join(" ");
}

function hydrateFormFromDraft(draft) {
  if (!draft) return;
  document.querySelector("#source-type").value = draft.source_type;
  document.querySelector("#source-url").value = draft.source_url === "manual://local-note" ? "" : draft.source_url;
  document.querySelector("#source-title").value = draft.title;
  document.querySelector("#user-note").value = draft.summary;
}

function setupSourceIntake() {
  const form = document.querySelector("#source-intake-form");
  if (!form) return;
  const clearButton = document.querySelector("#clear-draft");
  const persisted = loadPersistedDraft();
  hydrateFormFromDraft(persisted);
  renderDraft(persisted);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = normalizeDraft(new FormData(form));
    const errors = validateSourceDraft(draft);
    showIntakeErrors(errors);
    if (errors.length) { renderDraft(null); return; }
    const candidateDraft = buildCandidateDraft(draft);
    persistDraft(candidateDraft);
    renderDraft(candidateDraft);
  });
  clearButton?.addEventListener("click", () => { clearPersistedDraft(); form.reset(); showIntakeErrors([]); renderDraft(null); });
}

async function main() {
  renderRubric();
  setupSourceIntake();
  setupFilters();
  setupExports();
  const [candidateResponse, sourceResponse] = await Promise.all([fetch("data/candidates.json"), fetch("data/sources.json")]);
  loadedCandidates = await candidateResponse.json();
  allCandidates = loadedCandidates;
  const sources = await sourceResponse.json();
  sourceById = new Map(sources.map((source) => [source.id, source]));
  renderFilteredCandidates();
  renderShortlist(loadedCandidates);
}

main().catch((error) => {
  document.querySelector("#candidate-list").innerHTML = `<p class="error" role="alert">Unable to load candidate data: ${escapeHtml(error.message)}</p>`;
});
