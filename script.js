const state = {
  questions: [...questions],
  editingId: null, // id of the question being edited, or null
  filters: { subjectId: 0, topicId: 0, year: 0, text: "" }, // 0 or "" means "no filter"
};

const list = document.querySelector("#question-list");
const countText = document.querySelector("#question-count");
const form = document.querySelector("#add-form");
const formTitle = document.querySelector("#form-title");
const submitBtn = document.querySelector("#submit-btn");
const cancelBtn = document.querySelector("#cancel-edit");
const subjectSelect = document.querySelector("#subject");
const topicSelect = document.querySelector("#topic");

const filterSubject = document.querySelector("#filter-subject");
const filterTopic = document.querySelector("#filter-topic");
const filterYear = document.querySelector("#filter-year");
const filterText = document.querySelector("#filter-text");
const chart = document.querySelector("#chart");

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

// Topics shown depend on the chosen subject filter
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

// Years come from the questions, so a new year appears automatically
function fillFilterYears() {
  const years = [...new Set(state.questions.map((q) => q.year))].sort((a, b) => b - a);

  filterYear.innerHTML = '<option value="">All years</option>';
  years.forEach((y) => {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    filterYear.appendChild(option);
  });

  // If the chosen year no longer exists (all its questions were deleted), clear it
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

  if (!q.subjectId) errors.subject = "Choose a subject.";
  if (!q.topicId) errors.topic = "Choose a topic.";

  if (q.title.length < 3) errors.title = "Write at least 3 characters.";
  else if (q.title.length > 150) errors.title = "Keep it under 150 characters.";

  if (!Number.isInteger(q.year) || q.year < 2000 || q.year > thisYear) {
    errors.year = `Enter a year between 2000 and ${thisYear}.`;
  }

  if (!Number.isInteger(q.marks) || q.marks < 1 || q.marks > 100) {
    errors.marks = "Enter whole marks from 1 to 100.";
  }

  return errors;
}

function showErrors(errors) {
  ["subject", "topic", "title", "year", "marks"].forEach((field) => {
    document.querySelector(`#error-${field}`).textContent = errors[field] || "";
  });
}
// One bar per topic. Width = this topic's count as a share of the biggest count.
function renderChart() {
  const counts = countByTopic(state.questions);
  const max = Math.max(1, ...Object.values(counts));

  chart.innerHTML = "";

  topics.forEach((t) => {
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
// ----- Drawing the page -----

function render() {
  fillFilterYears();

  // The same function from logic.js that the tests check
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
  render();
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

filterSubject.addEventListener("change", () => {
  state.filters.subjectId = Number(filterSubject.value);
  state.filters.topicId = 0; // the old topic may not belong to the new subject
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

  exitEditMode();
  render();
});

// ----- Start -----

fillSubjects();
fillTopics();
fillFilterSubjects();
fillFilterTopics();
render();