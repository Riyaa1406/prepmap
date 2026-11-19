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

// Fill the subject dropdown from data.js
function fillSubjects() {
  subjects.forEach((s) => {
    const option = document.createElement("option");
    option.value = s.id;
    option.textContent = `${s.name} (${s.code})`;
    subjectSelect.appendChild(option);
  });
}

// Fill the topic dropdown with only the chosen subject's topics
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

// The next unused id
function nextId() {
  return Math.max(0, ...state.questions.map((q) => q.id)) + 1;
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

  state.questions.push(newQuestion);
  form.reset();
  fillTopics();
  render();
});

fillSubjects();
fillTopics();
render();