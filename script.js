const state = {
  questions: [...questions],
  editingId: null, // id of the question being edited, or null
};

const list = document.querySelector("#question-list");
const countText = document.querySelector("#question-count");
const form = document.querySelector("#add-form");
const formTitle = document.querySelector("#form-title");
const submitBtn = document.querySelector("#submit-btn");
const cancelBtn = document.querySelector("#cancel-edit");
const subjectSelect = document.querySelector("#subject");
const topicSelect = document.querySelector("#topic");

function topicName(topicId) {
  const topic = topics.find((t) => t.id === topicId);
  return topic ? topic.name : "Unknown topic";
}

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

function render() {
  list.innerHTML = "";

  state.questions.forEach((q) => {
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

  countText.textContent = `${state.questions.length} questions`;
}

// Back to normal "add" mode
function exitEditMode() {
  state.editingId = null;
  form.reset();
  fillTopics();
  showErrors({});
  formTitle.textContent = "Add a question";
  submitBtn.textContent = "Add question";
  cancelBtn.hidden = true;
}

// Fill the form with a question and switch to "edit" mode
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

// One listener on the list handles every Edit and Delete button
list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  if (button.dataset.action === "edit") startEdit(id);
  if (button.dataset.action === "delete") deleteQuestion(id);
});

cancelBtn.addEventListener("click", exitEditMode);
subjectSelect.addEventListener("change", fillTopics);

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

fillSubjects();
fillTopics();
render();