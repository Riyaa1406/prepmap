const STORAGE_KEY = "prepmap-questions-v1";
const REVISED_KEY = "prepmap-revised-v1";
const SUBJECT_KEY = "prepmap-subject-v1";

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

// Saved list of revised topic ids, or an empty list
function loadRevised() {
  try {
    return parseSavedRevised(localStorage.getItem(REVISED_KEY), topics);
  } catch (error) {
    return [];
  }
}

function saveRevised() {
  try {
    localStorage.setItem(REVISED_KEY, JSON.stringify(state.revised));
  } catch (error) {
    // Storage full or blocked. The app keeps working, it just won't remember.
  }
}

// The subject that was open last time, if it still exists
function loadSubjectId() {
  try {
    const id = Number(localStorage.getItem(SUBJECT_KEY));
    if (subjects.some((s) => s.id === id)) return id;
  } catch (error) {
    // Storage blocked. Use the first subject.
  }
  return subjects[0].id;
}

function saveSubjectId() {
  try {
    localStorage.setItem(SUBJECT_KEY, String(state.subjectId));
  } catch (error) {
    // Storage full or blocked. The app keeps working.
  }
}

const state = {
  questions: loadQuestions(),
  revised: loadRevised(), // ids of topics marked as revised
  subjectId: loadSubjectId(), // course and year of study are worked out from the subject
  editingId: null, // id of the question being edited, or null
  filters: { topicId: 0, year: 0, text: "" }, // 0 or "" means "no filter". year = EXAM year
};

const courseSelect = document.querySelector("#course-select");
const yearSelect = document.querySelector("#year-select");
const subjectSelect = document.querySelector("#subject-select");
const subjectInfo = document.querySelector("#subject-info");

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
const topicSelect = document.querySelector("#topic");

const filterTopic = document.querySelector("#filter-topic");
const filterYear = document.querySelector("#filter-year");
const filterText = document.querySelector("#filter-text");

const chart = document.querySelector("#chart");
const stats = document.querySelector("#stats");
const syllabus = document.querySelector("#syllabus");

// ----- Small helpers -----

function addOption(select, value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  select.appendChild(option);
}

function currentSubject() {
  return subjects.find((s) => s.id === state.subjectId);
}

function currentTopics() {
  return topics.filter((t) => t.subjectId === state.subjectId);
}

function currentQuestions() {
  return state.questions.filter((q) => q.subjectId === state.subjectId);
}

function topicName(topicId) {
  const topic = topics.find((t) => t.id === topicId);
  return topic ? topic.name : "Unknown topic";
}

// ----- Course, year of study, subject -----

function fillScope() {
  const subject = currentSubject();

  courseSelect.innerHTML = "";
  courses.forEach((c) => addOption(courseSelect, c.id, c.name));
  courseSelect.value = subject.courseId;

  yearSelect.innerHTML = "";
  yearsForCourse(subjects, subject.courseId).forEach((y) => addOption(yearSelect, y, `Year ${y}`));
  yearSelect.value = subject.year;

  subjectSelect.innerHTML = "";
  subjectsFor(subjects, subject.courseId, subject.year).forEach((s) =>
    addOption(subjectSelect, s.id, `${s.name} (${s.code})`)
  );
  subjectSelect.value = subject.id;

  subjectInfo.textContent = `${subject.code} · Semester ${subject.semester} · Year ${subject.year}`;
}

// Open another subject. Everything on the page follows it.
function switchSubject(subjectId) {
  state.subjectId = subjectId;
  state.filters = { topicId: 0, year: 0, text: "" };
  filterText.value = "";
  saveSubjectId();

  exitEditMode();
  fillScope();
  fillFilterTopics();
  render();
}

// ----- Add / edit form and filter dropdowns -----

function fillTopics() {
  topicSelect.innerHTML = '<option value="">Choose a topic</option>';
  currentTopics().forEach((t) => addOption(topicSelect, t.id, t.name));
}

function fillFilterTopics() {
  filterTopic.innerHTML = '<option value="">All topics</option>';
  currentTopics().forEach((t) => addOption(filterTopic, t.id, t.name));
  filterTopic.value = state.filters.topicId || "";
}

// Exam years come from this subject's questions, so a new year appears automatically
function fillFilterYears() {
  const years = [...new Set(currentQuestions().map((q) => q.year))].sort((a, b) => b - a);

  filterYear.innerHTML = '<option value="">All years</option>';
  years.forEach((y) => addOption(filterYear, y, y));

  if (!years.includes(state.filters.year)) state.filters.year = 0;
  filterYear.value = state.filters.year || "";
}

// ----- Data helpers -----

function nextId() {
  return Math.max(0, ...state.questions.map((q) => q.id)) + 1;
}

function validateQuestion(q) {
  const errors = {};
  const thisYear = new Date().getFullYear();

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
  ["topic", "title", "year", "marks"].forEach((field) => {
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
  const counts = countByTopic(currentQuestions());
  const max = Math.max(1, ...Object.values(counts));

  chart.innerHTML = "";

  currentTopics().forEach((t) => {
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

// Progress bar, then the ranked table with a Revised checkbox per topic.
// Topics in the first 60% of marks are highlighted.
function renderPriority() {
  const subjectTopics = currentTopics();
  const subjectQuestions = currentQuestions();
  const ranked = markCore(priorityList(subjectTopics, subjectQuestions), 60);
  const totalMarks = subjectQuestions.reduce((sum, q) => sum + q.marks, 0);
  const coreCount = ranked.filter((t) => t.core).length;

  const unitOf = {};
  subjectTopics.forEach((t) => {
    unitOf[t.id] = t.unit;
  });

  stats.innerHTML = "";

  // Revision progress for this subject
  const progress = revisionProgress(ranked, state.revised);

  const box = document.createElement("div");
  box.className = "progress-box";

  const bar = document.createElement("progress");
  bar.max = 100;
  bar.value = progress.percent;
  bar.setAttribute("aria-label", "Share of topics revised");

  const line = document.createElement("p");
  line.textContent =
    `Revised ${progress.done} of ${progress.total} topics (${progress.percent}%).` +
    (totalMarks > 0
      ? ` Those topics cover ${progress.marksDone} of ${progress.marksTotal} marks (${progress.marksPercent}%).`
      : "");

  box.append(bar, line);
  stats.appendChild(box);

  const note = document.createElement("p");
  note.textContent =
    totalMarks === 0
      ? "No questions yet for this subject, so every topic shows 0 marks. Add questions from past papers to see which topics matter most."
      : `${coreCount} of ${ranked.length} topics cover the first 60% of the ${totalMarks} marks. Study these first.`;
  stats.appendChild(note);

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  const table = document.createElement("table");

  const head = document.createElement("tr");
  ["#", "Topic", "Unit", "Marks", "Cumulative %", "Revised", ""].forEach((text, i) => {
    const th = document.createElement("th");
    th.textContent = text;
    if (i === 3 || i === 4) th.className = "num";
    head.appendChild(th);
  });
  table.appendChild(head);

  ranked.forEach((t, i) => {
    const revised = state.revised.includes(t.id);

    const tr = document.createElement("tr");
    tr.className = [t.core ? "core" : "", revised ? "done-topic" : ""].join(" ").trim();

    const cells = [i + 1, t.name, unitOf[t.id], t.marks, `${t.cumulativePercent}%`];
    cells.forEach((value, col) => {
      const td = document.createElement("td");
      td.textContent = value;
      if (col === 3 || col === 4) td.className = "num";
      tr.appendChild(td);
    });

    const checkCell = document.createElement("td");
    checkCell.className = "check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = revised;
    checkbox.dataset.topicId = t.id;
    checkbox.setAttribute("aria-label", `Mark ${t.name} as revised`);
    checkCell.appendChild(checkbox);
    tr.appendChild(checkCell);

    const flag = document.createElement("td");
    flag.textContent = t.core && !revised ? "Study first" : "";
    tr.appendChild(flag);

    table.appendChild(tr);
  });

  wrap.appendChild(table);
  stats.appendChild(wrap);
}

// The subject's syllabus: its units, each with its topics
function renderSyllabus() {
  syllabus.innerHTML = "";

  groupByUnit(currentTopics()).forEach((group) => {
    const p = document.createElement("p");
    const label = document.createElement("strong");
    label.textContent = `Unit ${group.unit}: `;
    p.append(label, group.topics.map((t) => t.name).join(" · "));
    syllabus.appendChild(p);
  });
}

function render() {
  fillFilterYears();

  const subjectQuestions = currentQuestions();
  const visible = filterQuestions(subjectQuestions, state.filters);

  list.innerHTML = "";

  if (visible.length === 0) {
    const li = document.createElement("li");
    li.textContent =
      subjectQuestions.length === 0
        ? "No questions yet for this subject. Add one with the form."
        : "No questions match these filters.";
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

  countText.textContent = `Showing ${visible.length} of ${subjectQuestions.length} questions`;
  renderChart();
  renderPriority();
  renderSyllabus();
}

// ----- Revised topics -----

function toggleRevised(topicId, isRevised) {
  const without = state.revised.filter((id) => id !== topicId);
  state.revised = isRevised ? [...without, topicId] : without;

  saveRevised();
  render();

  // render() rebuilt the table, so put the keyboard focus back on the same checkbox
  const again = stats.querySelector(`input[data-topic-id="${topicId}"]`);
  if (again) again.focus();
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

// Download all questions (every subject) as a .json file
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

courseSelect.addEventListener("change", () => {
  const courseId = Number(courseSelect.value);
  const firstYear = yearsForCourse(subjects, courseId)[0];
  const first = subjectsFor(subjects, courseId, firstYear)[0];
  if (first) switchSubject(first.id);
});

yearSelect.addEventListener("change", () => {
  const first = subjectsFor(subjects, currentSubject().courseId, Number(yearSelect.value))[0];
  if (first) switchSubject(first.id);
});

subjectSelect.addEventListener("change", () => {
  switchSubject(Number(subjectSelect.value));
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") startEdit(id);
  if (button.dataset.action === "delete") deleteQuestion(id);
});

// One listener on the stats area handles every Revised checkbox
stats.addEventListener("change", (event) => {
  const checkbox = event.target.closest("input[data-topic-id]");
  if (!checkbox) return;
  toggleRevised(Number(checkbox.dataset.topicId), checkbox.checked);
});

cancelBtn.addEventListener("click", exitEditMode);

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

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const isEditing = state.editingId !== null;

  const newQuestion = {
    id: isEditing ? state.editingId : nextId(),
    subjectId: state.subjectId,
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

fillScope();
fillTopics();
fillFilterTopics();
render();