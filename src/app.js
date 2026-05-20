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
              <p class="source-type">${escapeHtml(candidate.source_type)}</p>
              <h3>${escapeHtml(candidate.title)}</h3>
            </div>
            <span class="score">${escapeHtml(candidate.total_score)}</span>
          </div>
          <p>${escapeHtml(candidate.summary)}</p>
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
          <strong>${escapeHtml(candidate.title)}</strong>
          <span>${escapeHtml(candidate.total_score)} points — ${escapeHtml(candidate.implied_experiment)}</span>
        </li>
      `,
    )
    .join("");
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
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_error) {
    return false;
  }
}

function validateSourceDraft(draft) {
  const errors = [];
  if (!allowedSourceTypes.has(draft.source_type)) {
    errors.push("Choose a supported source type.");
  }
  if (!draft.title && !draft.user_note) {
    errors.push("Add a working title or user note so the draft is reviewable.");
  }
  if (draft.source_type === "manual") {
    if (!draft.user_note) {
      errors.push("Manual notes need a user note that explains where the idea came from.");
    }
  } else if (!draft.source_url || !isHttpUrl(draft.source_url)) {
    errors.push("GitHub, arXiv, and article sources need a valid http(s) URL.");
  }
  return errors;
}

function buildCandidateDraft(sourceDraft) {
  const title = sourceDraft.title || "Untitled research lead";
  const sourceId = `draft-${sourceDraft.source_type}-${Date.now()}`;
  return {
    id: `${sourceId}-candidate`,
    title,
    source_type: sourceDraft.source_type,
    source_url: sourceDraft.source_url || "manual://local-note",
    summary: sourceDraft.user_note || "Draft source captured for later human review.",
    why_interesting: "Needs human review before scoring or shortlist promotion.",
    implied_experiment: `Review ${title} and decide whether it deserves a scored experiment brief.`,
    required_inputs: ["source review", "rubric scoring", "risk notes"],
    estimated_effort: "needs_review",
    scores: {
      novelty: 1,
      feasibility: 1,
      leverage: 1,
      evidence: 1,
      user_fit: 1,
    },
    total_score: 5,
    risks: ["Draft has not been verified against the source."],
    status: "needs_review",
    source_ids: [sourceId],
    trace: {
      primary_source_id: sourceId,
      extraction_method: "manual_intake_form",
      evidence_refs: [sourceDraft.source_url || "manual note"],
      review_rationale: sourceDraft.user_note || "Captured from intake form.",
    },
  };
}

function persistDraft(draft) {
  window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
}

function loadPersistedDraft() {
  try {
    const raw = window.localStorage.getItem(draftStorageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

function clearPersistedDraft() {
  window.localStorage.removeItem(draftStorageKey);
}

function renderDraft(candidate) {
  const draftCard = document.querySelector("#draft-card");
  if (!candidate) {
    draftCard.hidden = true;
    draftCard.innerHTML = "";
    return;
  }
  draftCard.hidden = false;
  draftCard.innerHTML = `
    <div class="candidate-card__header">
      <div>
        <p class="source-type">${escapeHtml(candidate.source_type)} draft</p>
        <h3>${escapeHtml(candidate.title)}</h3>
      </div>
      <span class="score">Needs review</span>
    </div>
    <p>${escapeHtml(candidate.summary)}</p>
    <dl>
      <div>
        <dt>Next step</dt>
        <dd>${escapeHtml(candidate.implied_experiment)}</dd>
      </div>
      <div>
        <dt>Persistence</dt>
        <dd>Saved locally as a browser draft; not synced or production persistence.</dd>
      </div>
    </dl>
  `;
}

function showIntakeErrors(errors) {
  const error = document.querySelector("#intake-error");
  if (!errors.length) {
    error.hidden = true;
    error.textContent = "";
    return;
  }
  error.hidden = false;
  error.textContent = errors.join(" ");
}

function hydrateFormFromDraft(draft) {
  if (!draft) {
    return;
  }
  document.querySelector("#source-type").value = draft.source_type;
  document.querySelector("#source-url").value = draft.source_url === "manual://local-note" ? "" : draft.source_url;
  document.querySelector("#source-title").value = draft.title;
  document.querySelector("#user-note").value = draft.summary;
}

function setupSourceIntake() {
  const form = document.querySelector("#source-intake-form");
  const clearButton = document.querySelector("#clear-draft");
  const persisted = loadPersistedDraft();
  hydrateFormFromDraft(persisted);
  renderDraft(persisted);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const draft = normalizeDraft(new FormData(form));
    const errors = validateSourceDraft(draft);
    showIntakeErrors(errors);
    if (errors.length) {
      renderDraft(null);
      return;
    }
    const candidateDraft = buildCandidateDraft(draft);
    persistDraft(candidateDraft);
    renderDraft(candidateDraft);
  });

  clearButton.addEventListener("click", () => {
    clearPersistedDraft();
    form.reset();
    showIntakeErrors([]);
    renderDraft(null);
  });
}

async function main() {
  renderRubric();
  setupSourceIntake();
  const response = await fetch("data/candidates.json");
  loadedCandidates = await response.json();
  renderCandidates(loadedCandidates);
  renderShortlist(loadedCandidates);
}

main().catch((error) => {
  document.querySelector("#candidate-list").innerHTML = `
    <p class="error">Unable to load candidate data: ${escapeHtml(error.message)}</p>
  `;
});
