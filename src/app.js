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
const briefStorageKey = "research-to-project-lab.experimentBriefs.v1";
const decisionStorageKey = "research-to-project-lab.candidateDecisions.v1";
let loadedCandidates = [];
let allCandidates = [];
let sourceById = new Map();
let experimentBriefs = [];
let candidateDecisions = {};
let selectedBriefId = null;

const laneConfig = {
  research_next: { label: "Research next", decision: "Research next", attr: 'data-lane="research_next"', owner: "product-planner", microcopy: "Define what evidence would make this worth prototyping." },
  prototype_next: { label: "Prototype next", decision: "Prototype next", attr: 'data-lane="prototype_next"', owner: "cto-engineering", microcopy: "Write the smallest test and pass/fail signal before handoff." },
  parked: { label: "Park", decision: "Parked", attr: 'data-lane="parked"', owner: "product-planner", microcopy: "Save the idea with a reason so the backlog stays clean." },
  rejected: { label: "Reject", decision: "Rejected", attr: 'data-lane="rejected"', owner: "product-planner", microcopy: "Keep the rationale so the team does not re-litigate this lead later." },
};

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

function normalizedStatus(status, fallback = "needs_review") {
  const raw = String(status || "");
  return laneConfig[raw] || statusConfig[raw] ? raw : fallback;
}

function formatStatus(status) {
  const safeStatus = normalizedStatus(status);
  if (laneConfig[safeStatus]) return { label: laneConfig[safeStatus].decision, primary: laneConfig[safeStatus].label, guardrail: laneConfig[safeStatus].microcopy };
  return statusConfig[safeStatus] ?? { label: safeStatus.replaceAll("_", " "), primary: "Review card", guardrail: "Review before promotion." };
}

function sourceBadge(candidate) {
  const sourceType = escapeHtml(candidate.source_type);
  const sourceCount = Number(candidate.source_count ?? 1);
  return `${sourceType} · ${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`;
}

function actionButtons(candidate) {
  const title = escapeHtml(candidate.title);
  const actions = Object.entries(laneConfig).map(([lane, config]) => ({ lane, ...config, kind: lane === "prototype_next" ? "primary" : "secondary" }));
  return actions.map((action) => `
    <button class="button button--${action.kind}" type="button" data-candidate-id="${escapeHtml(candidate.id)}" ${action.attr} aria-label="${escapeHtml(action.label)} ${title}">
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
    const decision = sanitizeCandidateDecision(candidateDecisions[candidate.id]);
    const displayedStatus = normalizedStatus(decision?.status || candidate.status, candidate.status);
    const status = formatStatus(displayedStatus);
    const stateClass = `candidate-card--${displayedStatus.replaceAll("_", "-")}`;
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
          <span>${escapeHtml(decision?.decision || candidate.next_lane || candidate.estimated_effort || "needs review")}</span>
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
  if (!shortlist) return;
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

function listItems(items) {
  return (items || []).filter(Boolean).map((item) => `  - ${item}`).join("\n") || "  - Not specified";
}

function visibleBriefsFor(candidates) {
  const ids = new Set(candidates.map((candidate) => candidate.id));
  return experimentBriefs.filter((brief) => ids.has(brief.candidate_id));
}

function briefToMarkdown(brief) {
  const readiness = readinessForBrief(brief);
  return [
    `## ${brief.title}`,
    `- Status: ${laneConfig[brief.status]?.decision || brief.status}`,
    `- Readiness: ${readiness.label}`,
    `- Candidate: ${brief.candidate_id}`,
    `- Problem: ${brief.problem || "Not specified"}`,
    `- Hypothesis: ${brief.hypothesis || "Not specified"}`,
    `- Smallest test: ${brief.smallest_test || "Not specified"}`,
    `- Success criteria:\n${listItems(brief.success_criteria)}`,
    `- Required inputs:\n${listItems(brief.required_inputs)}`,
    `- Evidence: ${brief.evidence?.strongest_signals?.join("; ") || "Not specified"}`,
    `- Risks:\n${listItems(brief.risks)}`,
    `- Decision reason: ${brief.decision_reason || "Not specified"}`,
    `- Next owner: ${brief.next_owner || "Not specified"}`,
    `- Source refs: ${(brief.evidence?.source_refs || []).join("; ") || "Not specified"}`,
    `- Updated: ${brief.updated_at}`,
  ].join("\n");
}

function candidateExportStatus(candidate) {
  return normalizedStatus(sanitizeCandidateDecision(candidateDecisions[candidate.id])?.status || candidate.status, candidate.status);
}

function candidatesToMarkdown(candidates) {
  const candidateMarkdown = candidates.map((candidate, index) => [
    `## ${index + 1}. ${candidate.title}`,
    `- Source: ${candidate.source_type} — ${candidate.source_url}`,
    `- Priority: ${priorityScore(candidate)} / Rubric: ${candidate.total_score}`,
    `- Status: ${candidateExportStatus(candidate)}`,
    `- Experiment: ${candidate.implied_experiment}`,
    `- Risks: ${(candidate.risks || []).join("; ")}`,
  ].join("\n")).join("\n\n");
  const briefs = visibleBriefsFor(candidates);
  const briefMarkdown = briefs.length ? `\n\n# Experiment Briefs\n\n${briefs.map(briefToMarkdown).join("\n\n")}` : "\n\n# Experiment Briefs\n\nNo browser-local Experiment Briefs saved for this filtered view.";
  return `${candidateMarkdown}${briefMarkdown}`;
}

function exportPayload(candidates) {
  return {
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      source_type: candidate.source_type,
      source_url: candidate.source_url,
      status: candidateExportStatus(candidate),
      total_score: candidate.total_score,
      priority_score: priorityScore(candidate),
      tags: tagsFor(candidate),
      implied_experiment: candidate.implied_experiment,
      risks: candidate.risks || [],
    })),
    experiment_briefs: visibleBriefsFor(candidates),
  };
}

async function copyMarkdown(candidates) {
  const markdown = candidatesToMarkdown(candidates);
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(markdown);
      return "Copied Markdown export to clipboard.";
    } catch (_error) {
      return `Clipboard copy failed. Select and copy this Markdown manually:\n\n${markdown}`;
    }
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


function parseLines(value) {
  return String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function loadJson(key, fallback) {
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_error) { return fallback; }
}

function persistBriefState() {
  try {
    window.localStorage.setItem(briefStorageKey, JSON.stringify(experimentBriefs));
    window.localStorage.setItem(decisionStorageKey, JSON.stringify(candidateDecisions));
    return true;
  } catch (_error) {
    const status = document.querySelector("#brief-status");
    if (status) status.textContent = "Could not save locally. Copy or export your brief before leaving this page.";
    return false;
  }
}

function sanitizeBrief(brief) {
  if (!brief || typeof brief !== "object" || !brief.brief_id || !brief.candidate_id) return null;
  const status = normalizedStatus(brief.status, "research_next");
  return {
    ...brief,
    status,
    decision: laneConfig[status]?.decision || brief.decision || "Research next",
    success_criteria: Array.isArray(brief.success_criteria) ? brief.success_criteria : [],
    required_inputs: Array.isArray(brief.required_inputs) ? brief.required_inputs : [],
    risks: Array.isArray(brief.risks) ? brief.risks : [],
    non_goals: Array.isArray(brief.non_goals) ? brief.non_goals : [],
    evidence: brief.evidence && typeof brief.evidence === "object" ? {
      strongest_signals: Array.isArray(brief.evidence.strongest_signals) ? brief.evidence.strongest_signals : [],
      weakest_signals: Array.isArray(brief.evidence.weakest_signals) ? brief.evidence.weakest_signals : [],
      confidence: brief.evidence.confidence || "medium",
      source_refs: Array.isArray(brief.evidence.source_refs) ? brief.evidence.source_refs : [],
    } : { strongest_signals: [], weakest_signals: [], confidence: "medium", source_refs: [] },
  };
}

function sanitizeCandidateDecision(decision) {
  if (!decision || typeof decision !== "object") return null;
  const status = normalizedStatus(decision.status, "");
  if (!status) return null;
  return {
    status,
    decision: laneConfig[status]?.decision || statusConfig[status]?.label || "Review card",
    updated_at: typeof decision.updated_at === "string" ? decision.updated_at : new Date().toISOString(),
  };
}

function hydrateBriefState() {
  const storedBriefs = loadJson(briefStorageKey, []);
  experimentBriefs = Array.isArray(storedBriefs) ? storedBriefs.map(sanitizeBrief).filter(Boolean) : [];
  const storedDecisions = loadJson(decisionStorageKey, {});
  candidateDecisions = Object.fromEntries(
    Object.entries(storedDecisions && typeof storedDecisions === "object" && !Array.isArray(storedDecisions) ? storedDecisions : {})
      .map(([candidateId, decision]) => [candidateId, sanitizeCandidateDecision(decision)])
      .filter(([, decision]) => Boolean(decision))
  );
  selectedBriefId = experimentBriefs[0]?.brief_id || null;
}

function candidateById(candidateId) {
  return allCandidates.find((candidate) => candidate.id === candidateId);
}

function defaultBriefFor(candidate, status) {
  const now = new Date().toISOString();
  const sourceRefs = [...(candidate.trace?.evidence_refs || []), ...(candidate.source_ids || [])];
  return {
    brief_id: `brief-${candidate.id}`,
    candidate_id: candidate.id,
    title: candidate.title,
    status,
    decision: laneConfig[status].decision,
    problem: candidate.summary || "",
    hypothesis: candidate.why_interesting || "",
    smallest_test: status === "prototype_next" ? candidate.implied_experiment || "" : "",
    success_criteria: candidate.acceptance_check ? [candidate.acceptance_check] : [],
    required_inputs: candidate.required_inputs || [],
    evidence: {
      strongest_signals: [candidate.evidence_summary?.summary || candidate.trace?.review_rationale || ""].filter(Boolean),
      weakest_signals: candidate.warnings || [],
      confidence: candidate.evidence_summary?.confidence || candidate.confidence || "medium",
      source_refs: sourceRefs,
    },
    risks: candidate.risks || [],
    decision_reason: "",
    next_owner: laneConfig[status].owner,
    non_goals: [],
    notes: laneConfig[status].microcopy,
    created_at: now,
    updated_at: now,
    export_version: "experiment-brief.v1",
  };
}

function createOrUpdateBrief(candidate, status) {
  const existing = experimentBriefs.find((brief) => brief.candidate_id === candidate.id);
  const now = new Date().toISOString();
  const brief = existing ? { ...existing, status, decision: laneConfig[status].decision, next_owner: existing.next_owner || laneConfig[status].owner, updated_at: now } : defaultBriefFor(candidate, status);
  if (existing) experimentBriefs = experimentBriefs.map((item) => item.brief_id === brief.brief_id ? brief : item);
  else experimentBriefs = [brief, ...experimentBriefs];
  candidateDecisions[candidate.id] = { status, decision: laneConfig[status].decision, updated_at: now };
  selectedBriefId = brief.brief_id;
  persistBriefState();
  renderFilteredCandidates();
  renderBriefPanel();
  document.querySelector("#briefs-title")?.focus();
}

function readinessForBrief(brief) {
  const criteriaCount = (brief.success_criteria || []).length;
  if (brief.status === "prototype_next" && (!brief.smallest_test || criteriaCount === 0)) {
    return { label: "Needs details", message: "Prototype next needs a smallest test and at least one observable success criterion before handoff.", complete: false };
  }
  if (["parked", "rejected"].includes(brief.status) && !brief.decision_reason) {
    return { label: "Needs reason", message: "Add a reason so this decision remains auditable.", complete: false };
  }
  if (["parked", "rejected"].includes(brief.status)) return { label: "Auditable decision", message: "Decision rationale is exportable with source traceability.", complete: true };
  return { label: "Ready to export", message: "Brief has enough detail for a Markdown or JSON handoff.", complete: true };
}

function renderBriefList() {
  const list = document.querySelector("#brief-list");
  const count = document.querySelector("#brief-count");
  if (count) count.textContent = `${experimentBriefs.length} ${experimentBriefs.length === 1 ? "brief" : "briefs"}`;
  if (!list) return;
  if (!experimentBriefs.length) {
    list.innerHTML = `<li class="empty-state" role="status">No briefs yet. Choose Research next or Prototype next on a candidate card to create one.</li>`;
    return;
  }
  list.innerHTML = experimentBriefs.map((brief) => {
    const readiness = readinessForBrief(brief);
    return `<li class="brief-list-item ${selectedBriefId === brief.brief_id ? "is-selected" : ""}">
      <button type="button" class="button" data-brief-id="${escapeHtml(brief.brief_id)}" aria-label="Select brief ${escapeHtml(brief.title)}">
        <strong>${escapeHtml(brief.title)}</strong>
        <span class="lane-pill lane-pill--${escapeHtml(brief.status)}">${escapeHtml(laneConfig[brief.status]?.decision || brief.status)}</span>
        <span>${escapeHtml(readiness.label)} — From candidate ${escapeHtml(brief.candidate_id)}</span>
      </button>
    </li>`;
  }).join("");
}

function fillBriefForm(brief) {
  const form = document.querySelector("#brief-form");
  const title = document.querySelector("#brief-detail-title");
  const status = document.querySelector("#brief-status");
  if (!form || !title || !status) return;
  if (!brief) {
    form.reset();
    title.textContent = "No briefs yet. Choose Research next or Prototype next on a candidate card to create one.";
    status.textContent = "Select a brief to review fields and export readiness.";
    return;
  }
  const readiness = readinessForBrief(brief);
  title.textContent = brief.title;
  status.innerHTML = `<span class="lane-pill lane-pill--${escapeHtml(brief.status)}">${escapeHtml(laneConfig[brief.status]?.decision || brief.status)}</span> <span class="${readiness.complete ? "" : "readiness-warning"}">${escapeHtml(readiness.message)}</span>`;
  form.elements.brief_id.value = brief.brief_id;
  form.elements.status.value = brief.status;
  form.elements.problem.value = brief.problem || "";
  form.elements.hypothesis.value = brief.hypothesis || "";
  form.elements.smallest_test.value = brief.smallest_test || "";
  form.elements.success_criteria.value = (brief.success_criteria || []).join("\n");
  form.elements.required_inputs.value = (brief.required_inputs || []).join("\n");
  form.elements.evidence.value = (brief.evidence?.strongest_signals || []).join("\n");
  form.elements.risks.value = (brief.risks || []).join("\n");
  form.elements.decision_reason.value = brief.decision_reason || "";
  form.elements.next_owner.value = brief.next_owner || "";
}

function renderBriefPanel() {
  renderBriefList();
  fillBriefForm(experimentBriefs.find((brief) => brief.brief_id === selectedBriefId));
}

function saveSelectedBriefFromForm(form) {
  const formData = new FormData(form);
  const briefId = String(formData.get("brief_id") || "");
  const current = experimentBriefs.find((brief) => brief.brief_id === briefId);
  if (!current) return;
  const status = String(formData.get("status") || current.status);
  const updated = {
    ...current,
    status,
    decision: laneConfig[status]?.decision || status,
    problem: String(formData.get("problem") || "").trim(),
    hypothesis: String(formData.get("hypothesis") || "").trim(),
    smallest_test: String(formData.get("smallest_test") || "").trim(),
    success_criteria: parseLines(formData.get("success_criteria")),
    required_inputs: parseLines(formData.get("required_inputs")),
    evidence: { ...current.evidence, strongest_signals: parseLines(formData.get("evidence")) },
    risks: parseLines(formData.get("risks")),
    decision_reason: String(formData.get("decision_reason") || "").trim(),
    next_owner: String(formData.get("next_owner") || laneConfig[status]?.owner || "").trim(),
    updated_at: new Date().toISOString(),
  };
  experimentBriefs = experimentBriefs.map((brief) => brief.brief_id === briefId ? updated : brief);
  candidateDecisions[updated.candidate_id] = { status, decision: updated.decision, updated_at: updated.updated_at };
  persistBriefState();
  renderFilteredCandidates();
  renderBriefPanel();
  const readiness = readinessForBrief(updated);
  const statusNode = document.querySelector("#brief-status");
  if (statusNode) statusNode.textContent = `Saved locally at ${new Date(updated.updated_at).toLocaleTimeString()}. ${readiness.message}`;
}

function setupBriefWorkflow() {
  hydrateBriefState();
  document.querySelector("#candidate-list")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-lane][data-candidate-id]");
    if (!button) return;
    const candidate = candidateById(button.dataset.candidateId);
    const lane = button.dataset.lane;
    if (candidate && laneConfig[lane]) createOrUpdateBrief(candidate, lane);
  });
  document.querySelector("#brief-list")?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-brief-id]");
    if (!button) return;
    selectedBriefId = button.dataset.briefId;
    renderBriefPanel();
  });
  document.querySelector("#brief-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSelectedBriefFromForm(event.currentTarget);
  });
  renderBriefPanel();
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
  setupBriefWorkflow();
  renderFilteredCandidates();
  renderShortlist(loadedCandidates);
}

main().catch((error) => {
  document.querySelector("#candidate-list").innerHTML = `<p class="error" role="alert">Unable to load candidate data: ${escapeHtml(error.message)}</p>`;
});
