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

// Topics ranked by marks, with a running (cumulative) percentage
function priorityList(topics, questions) {
  const marks = marksByTopic(questions);
  const total = questions.reduce((sum, q) => sum + q.marks, 0);
  let running = 0;

  return topics
    .map((t) => ({ id: t.id, name: t.name, marks: marks[t.id] || 0 }))
    .sort((a, b) => b.marks - a.marks || a.id - b.id)
    .map((t) => {
      running += t.marks;
      const percent = total === 0 ? 0 : (running / total) * 100;
      return { ...t, cumulativePercent: Number(percent.toFixed(1)) };
    });
}

// Marks which topics make up the first `threshold` percent of all marks.
// A topic counts if the marks BEFORE it have not reached the threshold yet,
// so the topic that crosses the line is included.
function markCore(list, threshold = 60) {
  const total = list.reduce((sum, t) => sum + t.marks, 0);
  let before = 0;

  return list.map((t) => {
    const core = total > 0 && before * 100 < threshold * total;
    before += t.marks;
    return { ...t, core };
  });
}

// Keep only the questions that match every filter that was given
function filterQuestions(questions, filters = {}) {
  const { subjectId, topicId, year, text } = filters;
  const search = (text || "").trim().toLowerCase();

  return questions.filter(
    (q) =>
      (!subjectId || q.subjectId === subjectId) &&
      (!topicId || q.topicId === topicId) &&
      (!year || q.year === year) &&
      (!search || q.title.toLowerCase().includes(search))
  );
}

// Export only when running in Node (tests use this)
if (typeof module !== "undefined") {
    module.exports = { countByTopic, marksByTopic, priorityList, markCore, filterQuestions };
}

// Runs only when you type: node logic.js
if (typeof require !== "undefined" && require.main === module) {
  const { topics, questions } = require("./data");

  console.log("Priority list:");
  priorityList(topics, questions).forEach((t, i) => {
    console.log(i + 1 + ".", t.name, "|", t.marks, "marks |", t.cumulativePercent + "%");
  });

  console.log("\nFilter tests:");
  console.log("year 2025:", filterQuestions(questions, { year: 2025 }).length);
  console.log("topic 10 + year 2025:", filterQuestions(questions, { topicId: 10, year: 2025 }).length);
  console.log('text "disk":', filterQuestions(questions, { text: "disk" }).length);
  console.log("no match:", filterQuestions(questions, { text: "zzz" }).length);
  console.log("no filters:", filterQuestions(questions).length);
}