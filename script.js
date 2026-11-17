// The one place where the app's data lives
const state = {
  questions: [...questions],
};

const list = document.querySelector("#question-list");
const countText = document.querySelector("#question-count");

function topicName(topicId) {
  const topic = topics.find((t) => t.id === topicId);
  return topic ? topic.name : "Unknown topic";
}

// Redraws the page from state. Call it after every change to state.
function render() {
  list.innerHTML = "";

  state.questions.forEach((q) => {
    const li = document.createElement("li");
    li.textContent = `${q.title} (${topicName(q.topicId)}, ${q.year}, ${q.marks} marks)`;
    list.appendChild(li);
  });

  countText.textContent = `${state.questions.length} questions`;
}

render();