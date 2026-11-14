const { topics, questions } = require("./data");

// How many questions does each topic have?
function countByTopic(questions) {
  return questions.reduce((counts, q) => {
    counts[q.topicId] = (counts[q.topicId] || 0) + 1;
    return counts;
  }, {});
}

// How many marks does each topic carry in total?
function marksByTopic(questions) {
  return questions.reduce((totals, q) => {
    totals[q.topicId] = (totals[q.topicId] || 0) + q.marks;
    return totals;
  }, {});
}

module.exports = { countByTopic, marksByTopic };

// This block runs only when you type: node logic.js
if (require.main === module) {
  const counts = countByTopic(questions);
  const marks = marksByTopic(questions);
  topics.forEach((t) => {
    console.log(t.name, "| questions:", counts[t.id] || 0, "| marks:", marks[t.id] || 0);
  });
}