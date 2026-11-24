const STORAGE_KEY = "prepmap-questions-v1";

// Saved questions if there are valid ones, otherwise the sample data from data.js
function loadQuestions() {
  try {
    const saved = parseSavedQuestions(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch (error) {
    // localStorage can be blocked by browser settings. Fall through to sample data.
  }
  return [...questions];
}

// Write the current questions to the browser's storage
function saveQuestions() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.questions));
  } catch (error) {
    // Storage full or blocked. The app keeps working, it just won't remember.
  }
}

const state = {
  questions: loadQuestions(),
  editingId: null, // id of the question being edited, or null
  filters: { subjectId: 0, topicId: 0, year: 0, text: "" }, // 0 or "" means "no filter"
  statsSubjectId: subjects[0].id, // which subject the chart and priority table show
};

const list = document.querySelector("#question-list");
const countText = document.querySelector("#question-count");
const form = document.querySelector("#add-form");
const formTitle = document.querySelector("#form-title");
const submitBtn = document.querySelector("#submit-btn");
const cancelBtn = document.querySelector("#cancel-edit");
const resetBtn = document.querySelector("#reset-data");
const exportBtn = document.querySelector("#export-btn");
const importBtn = document.querySelector("#import-btn");
const importFile = document.querySelector("#import-file");
const ioStatus = document.querySelector("#io-status");
const subjectSelect = document.querySelector("#subject");
const topicSelect = document.querySelector("#topic");

const filterSubject = document.querySelector("#filter-subject");
const filterTopic = document.querySelector("#filter-topic");
const filterYear = document.querySelector("#filter-year");
const filterText = document.querySelector("#filter-text");

const chart = document.querySelector("#chart");
const stats = document.querySelector("#stats");
const statsSubject = document.querySelector("#stats-subject");

function topicName(topicId) {
  const topic = topics.find((t) => t.id === topicId);
  return topic ? topic.name : "Unknown topic";
}

// ----- Add / edit form dropdowns -----

function fillSubjects() {
  subjects.forEach((s) => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = `${s.name} (${s.code})`;
    subjectSelect.appendChild(option);
  });
}

function fillTopics() {
  topicSelect.innerHTML = '<option value="">Choose a topic</option>';
  const subjectId = Number(subjectSelect.value);

  topics
    .filter((t) => t.subjectId === subjectId)
    .forEach((t) => {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.name;
      topicSelect.appendChild(option);
    });
}

// ----- Filter dropdowns -----

function fillFilterSubjects() {
  subjects.forEach((s) => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = s.name;
    filterSubject.appendChild(option);
  });
}

function fillFilterTopics() {
  filterTopic.innerHTML = '<option value="">All topics</option>';

  topics
    .filter((t) => !state.filters.subjectId || t.subjectId === state.filters.subjectId)
    .forEach((t) => {
      const option = document.createElement("option");
      option.value = t.id;
      option.textContent = t.name;
      filterTopic.appendChild(option);
    });

  filterTopic.value = state.filters.topicId || "";
}

function fillFilterYears() {
  const years = [...new Set(state.questions.map((q) => q.year))].sort((a, b) => b - a);

  filterYear.innerHTML = '<option value="">All years</option>';
  years.forEach((y) => {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    filterYear.appendChild(option);
  });

  if (!years.includes(state.filters.year)) state.filters.year = 0;
  filterYear.value = state.filters.year || "";
}

// ----- Stats subject dropdown -----

function fillStatsSubjects() {
  subjects.forEach((s) => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = s.name;
    statsSubject.appendChild(option);
  });
  statsSubject.value = state.statsSubjectId;
}

// The chart and priority table always cover ONE subject,
// so percentages never mix marks from different subjects.
function statsData() {
  return {
    topics: topics.filter((t) => t.subjectId === state.statsSubjectId),
    questions: state.questions.filter((q) => q.subjectId === state.statsSubjectId),
  };
}

// ----- Data helpers -----

function nextId() {
  return Math.max(0, ...state.questions.map((q) => q.id)) + 1;
}

function validateQuestion(q) {
  const errors = {};
  const thisYear = new Date().getFullYear();

  if (!q.subjectId) errors.subject = "Choose a subject.";
  if (!q.topicId) errors.topic = "Choose a topic.";

  if (q.title.length < 3) errors.title = "Write at least 3 characters.";
  else if (q.title.length > 150) errors.title = "Keep it under 150 characters.";

  if (!Number.isInteger(q.year) || q.year < 2000 || q.year > thisYear) {
    errors.year = `Enter a year between 2000 and ${thisYear}.`;
  }

  // Half marks are allowed (6.5), nothing finer
  if (!(q.marks >= 0.5 && q.marks <= 100) || !Number.isInteger(q.marks * 2)) {
    errors.marks = "Enter marks from 0.5 to 100, in steps of 0.5.";
  }

  return errors;
}

function showErrors(errors) {
  ["subject", "topic", "title", "year", "marks"].forEach((field) => {
    document.querySelector(`#error-${field}`).textContent = errors[field] || "";
  });
}

// Message under the Export / Import buttons
function showStatus(message, isError = false) {
  ioStatus.textContent = message;
  ioStatus.className = isError ? "bad" : "";
}

// ----- Drawing the page -----

// One bar per topic. Width = this topic's count as a share of the biggest count.
function renderChart() {
  const data = statsData();
  const counts = countByTopic(data.questions);
  const max = Math.max(1, ...Object.values(counts));

  chart.innerHTML = "";

  data.topics.forEach((t) => {
    const count = counts[t.id] || 0;

    const row = document.createElement("div");
    row.className = "bar-row";

    const label = document.createElement("span");
    label.textContent = t.name;

    const track = document.createElement("span");
    track.className = "bar-track";

    const fill = document.createElement("span");
    fill.className = "bar-fill";
    fill.style.width = `${(count / max) * 100}%`;
    track.appendChild(fill);

    const number = document.createElement("span");
    number.className = "bar-count";
    number.textContent = count;

    row.append(label, track, number);
    chart.appendChild(row);
  });
}

// Ranked table. Topics in the first 60% of marks are highlighted.
function renderPriority() {
  const data = statsData();
  const ranked = markCore(priorityList(data.topics, data.questions), 60);
  const totalMarks = data.questions.reduce((sum, q) => sum + q.marks, 0);
  const coreCount = ranked.filter((t) => t.core).length;

  stats.innerHTML = "";

  const note = document.createElement("p");
  if (totalMarks === 0) {
    note.textContent = "No questions yet for this subject.";
    stats.appendChild(note);
    return;
  }
  note.textContent = `${coreCount} of ${ranked.length} topics cover the first 60% of the ${totalMarks} marks. Study these first.`;
  stats.appendChild(note);

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  const table = document.createElement("table");

  const head = document.createElement("tr");
  ["#", "Topic", "Marks", "Cumulative %", ""].forEach((text, i) => {
    const th = document.createElement("th");
    th.textContent = text;
    if (i === 2 || i === 3) th.className = "num";
    head.appendChild(th);
  });
  table.appendChild(head);

  ranked.forEach((t, i) => {
    const tr = document.createElement("tr");
    if (t.core) tr.className = "core";

    const cells = [i + 1, t.name, t.marks, `${t.cumulativePercent}%`, t.core ? "Study first" : ""];
    cells.forEach((value, col) => {
      const td = document.createElement("td");
      td.textContent = value;
      if (col === 2 || col === 3) td.className = "num";
      tr.appendChild(td);
    });

    table.appendChild(tr);
  });

  wrap.appendChild(table);
  stats.appendChild(wrap);
}

function render() {
  fillFilterYears();

  const visible = filterQuestions(state.questions, state.filters);

  list.innerHTML = "";

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No questions match these filters.";
    list.appendChild(li);
  }

  visible.forEach((q) => {
    const li = document.createElement("li");

    const text = document.createElement("span");
    text.textContent = `${q.title} (${topicName(q.topicId)}, ${q.year}, ${q.marks} marks)`;

    const actions = document.createElement("span");
    actions.className = "actions";
    actions.innerHTML =
      `<button type="button" data-action="edit" data-id="${q.id}">Edit</button>` +
      `<button type="button" data-action="delete" data-id="${q.id}">Delete</button>`;

    li.append(text, actions);
    list.appendChild(li);
  });

  countText.textContent = `Showing ${visible.length} of ${state.questions.length} questions`;
  renderChart();
  renderPriority();
}

// ----- Edit and delete -----

function exitEditMode() {
  state.editingId = null;
  form.reset();
  fillTopics();
  showErrors({});
  formTitle.textContent = "Add a question";
  submitBtn.textContent = "Add question";
  cancelBtn.hidden = true;
}

function startEdit(id) {
  const q = state.questions.find((item) => item.id === id);
  if (!q) return;

  state.editingId = id;
  subjectSelect.value = q.subjectId;
  fillTopics();
  topicSelect.value = q.topicId;
  document.querySelector("#title").value = q.title;
  document.querySelector("#year").value = q.year;
  document.querySelector("#marks").value = q.marks;

  showErrors({});
  formTitle.textContent = "Edit question";
  submitBtn.textContent = "Save changes";
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth" });
}

function deleteQuestion(id) {
  if (!confirm("Delete this question?")) return;

  state.questions = state.questions.filter((q) => q.id !== id);
  if (state.editingId === id) exitEditMode();
  saveQuestions();
  render();
}

// ----- Export and import -----

// Download all questions as a .json file
function exportData() {
  const payload = {
    app: "prepmap",
    version: 1,
    exportedAt: new Date().toISOString(),
    questions: state.questions,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `prepmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showStatus(`Exported ${state.questions.length} questions.`);
}

// Read a chosen file, check it, then replace the questions with its contents
async function importData(file) {
  if (file.size > 1000000) {
    showStatus("Couldn’t import: this file is too large for a PrepMap backup.", true);
    return;
  }

  let text;
  try {
    text = await file.text();
  } catch (error) {
    showStatus("Couldn’t import: the file could not be read.", true);
    return;
  }

  const result = parseImport(text, topics);
  if (!result.ok) {
    showStatus(`Couldn’t import: ${result.error}`, true);
    return;
  }

  const message = `Replace your ${state.questions.length} questions with the ${result.questions.length} in this file?`;
  if (!confirm(message)) {
    showStatus("Import cancelled. Nothing changed.");
    return;
  }

  state.questions = result.questions;
  saveQuestions();
  exitEditMode();
  render();
  showStatus(`Imported ${result.questions.length} questions.`);
}

// ----- Events -----

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") startEdit(id);
  if (button.dataset.action === "delete") deleteQuestion(id);
});

cancelBtn.addEventListener("click", exitEditMode);
subjectSelect.addEventListener("change", fillTopics);

exportBtn.addEventListener("click", exportData);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (file) importData(file);
  importFile.value = ""; // so choosing the same file again still triggers this
});

resetBtn.addEventListener("click", () => {
  if (!confirm("Replace all your questions with the original sample data? Your changes will be lost.")) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Nothing to clear if storage is blocked
  }
  state.questions = [...questions];
  exitEditMode();
  render();
  showStatus("Reset to the sample data.");
});

filterSubject.addEventListener("change", () => {
  state.filters.subjectId = Number(filterSubject.value);
  state.filters.topicId = 0;
  fillFilterTopics();
  render();
});

filterTopic.addEventListener("change", () => {
  state.filters.topicId = Number(filterTopic.value);
  render();
});

filterYear.addEventListener("change", () => {
  state.filters.year = Number(filterYear.value);
  render();
});

filterText.addEventListener("input", () => {
  state.filters.text = filterText.value;
  render();
});

statsSubject.addEventListener("change", () => {
  state.statsSubjectId = Number(statsSubject.value);
  render();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = state.editingId !== null;

  const newQuestion = {
    id: isEditing ? state.editingId : nextId(),
    subjectId: Number(subjectSelect.value),
    topicId: Number(topicSelect.value),
    title: document.querySelector("#title").value.trim(),
    year: Number(document.querySelector("#year").value),
    marks: Number(document.querySelector("#marks").value),
  };

  const errors = validateQuestion(newQuestion);
  showErrors(errors);
  if (Object.keys(errors).length > 0) return;

  if (isEditing) {
    state.questions = state.questions.map((q) =>
      q.id === newQuestion.id ? newQuestion : q
    );
  } else {
    state.questions.push(newQuestion);
  }

  saveQuestions();
  exitEditMode();
  render();
});

// ----- Start -----

fillSubjects();
fillTopics();
fillFilterSubjects();
fillFilterTopics();
fillStatsSubjects();
render();