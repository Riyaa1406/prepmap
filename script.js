// Find the <ul> in the page
const list = document.querySelector("#question-list");

// Look up a topic's name from its id
function topicName(topicId) {
  const topic = topics.find((t) => t.id === topicId);
  return topic ? topic.name : "Unknown topic";
}

// Remove the placeholder text, then add one <li> per question
list.innerHTML = "";

questions.forEach((q) => {
  const li = document.createElement("li");
  li.textContent = `${q.title} (${topicName(q.topicId)}, ${q.year}, ${q.marks} marks)`;
  list.appendChild(li);
});