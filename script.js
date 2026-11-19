const state = {
  questions: [...questions],
};

const list = document.querySelector("#question-list");
const countText = document.querySelector("#question-count");
const form = document.querySelector("#add-form");
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

// Returns an object with one message per bad field. Empty object = valid.
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

// Writes each message next to its field, and clears the rest
function showErrors(errors) {
  ["subject", "topic", "title", "year", "marks"].forEach((field) => {
    document.querySelector(`#error-${field}`).textContent = errors[field] || "";
  });
}

function render() {
  list.innerHTML = "";

  state.questions.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = `${q.title} (${topicName(q.topicId)}, ${q.year}, ${q.marks} marks)`;
    list.appendChild(li);
  });

  countText.textContent = `${state.questions.length} questions`;
}

subjectSelect.addEventListener("change", fillTopics);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const newQuestion = {
    id: nextId(),
    subjectId: Number(subjectSelect.value),
    topicId: Number(topicSelect.value),
    title: document.querySelector("#title").value.trim(),
    year: Number(document.querySelector("#year").value),
    marks: Number(document.querySelector("#marks").value),
  };

  const errors = validateQuestion(newQuestion);
  showErrors(errors);
  if (Object.keys(errors).length > 0) return;

  state.questions.push(newQuestion);
  form.reset();
  fillTopics();
  render();
});

fillSubjects();
fillTopics();
render();