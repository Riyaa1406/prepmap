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

// How much of a subject is revised? `list` items need an id and marks.
// Gives progress by topic count AND by marks covered.
function revisionProgress(list, revisedIds) {
  const revised = new Set(revisedIds);
  const done = list.filter((t) => revised.has(t.id));
  const marksTotal = list.reduce((sum, t) => sum + t.marks, 0);
  const marksDone = done.reduce((sum, t) => sum + t.marks, 0);

  return {
    done: done.length,
    total: list.length,
    percent: list.length === 0 ? 0 : Math.round((done.length / list.length) * 100),
    marksDone,
    marksTotal,
    marksPercent: marksTotal === 0 ? 0 : Math.round((marksDone / marksTotal) * 100),
  };
}

// The years of study that a course has subjects for, each once, in order
function yearsForCourse(subjects, courseId) {
  const years = subjects.filter((s) => s.courseId === courseId).map((s) => s.year);
  return [...new Set(years)].sort((a, b) => a - b);
}

// The subjects of one course in one year of study
function subjectsFor(subjects, courseId, year) {
  return subjects.filter((s) => s.courseId === courseId && s.year === year);
}

// Groups topics by syllabus unit, in unit order: [{ unit: 1, topics: [...] }, ...]
function groupByUnit(topics) {
  const units = {};
  topics.forEach((t) => {
    (units[t.unit] = units[t.unit] || []).push(t);
  });

  return Object.keys(units)
    .map(Number)
    .sort((a, b) => a - b)
    .map((unit) => ({ unit, topics: units[unit] }));
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

// Does one question have every field, with the right types?
function hasValidShape(q) {
  return (
    Boolean(q) &&
    Number.isInteger(q.id) &&
    Number.isInteger(q.subjectId) &&
    Number.isInteger(q.topicId) &&
    typeof q.title === "string" &&
    Number.isInteger(q.year) &&
    typeof q.marks === "number" &&
    q.marks > 0 &&
    Number.isInteger(q.marks * 2)
  );
}

// Turns saved text back into a questions array.
// Returns null if nothing was saved, the text is broken, or the shape is wrong.
function parseSavedQuestions(text) {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return null;
    return data.every(hasValidShape) ? data : null;
  } catch (error) {
    return null;
  }
}

// Turns saved text back into a list of revised topic ids.
// Anything broken gives an empty list. Unknown ids and duplicates are dropped.
function parseSavedRevised(text, topics) {
  try {
    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];

    const known = new Set(topics.map((t) => t.id));
    return [...new Set(data)].filter((id) => Number.isInteger(id) && known.has(id));
  } catch (error) {
    return [];
  }
}

// Checks the text of an imported file against our own data.
// Returns { ok: true, questions } or { ok: false, error: "message" }.
function parseImport(text, topics) {
  const fail = (error) => ({ ok: false, error });

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return fail("this file isn’t valid JSON.");
  }

  if (!data || data.app !== "prepmap" || !Array.isArray(data.questions)) {
    return fail("this isn’t a PrepMap backup file.");
  }

  const questions = data.questions;
  if (questions.length === 0) return fail("the file has no questions.");
  if (!questions.every(hasValidShape)) {
    return fail("some questions are missing fields or have the wrong type of value.");
  }

  const seen = new Set();
  for (const q of questions) {
    if (seen.has(q.id)) return fail(`two questions share the id ${q.id}.`);
    seen.add(q.id);

    if (q.title.trim().length < 3) return fail(`question ${q.id} has no usable title.`);
    if (q.year < 2000 || q.year > 2100) return fail(`question ${q.id} has an unreasonable year.`);
    if (q.marks > 100) return fail(`question ${q.id} has more than 100 marks.`);

    const topic = topics.find((t) => t.id === q.topicId);
    if (!topic) return fail(`question ${q.id} points to a topic that doesn’t exist.`);
    if (topic.subjectId !== q.subjectId) {
      return fail(`question ${q.id}: its topic doesn’t belong to its subject.`);
    }
  }

  return { ok: true, questions };
}

// Export only when running in Node (tests use this)
if (typeof module !== "undefined") {
  module.exports = {
    countByTopic,
    marksByTopic,
    priorityList,
    markCore,
    revisionProgress,
    yearsForCourse,
    subjectsFor,
    groupByUnit,
    filterQuestions,
    parseSavedQuestions,
    parseSavedRevised,
    parseImport,
  };
}

// Runs only when you type: node logic.js
if (typeof require !== "undefined" && require.main === module) {
  const { topics, questions } = require("./data");

  console.log("Priority list (all subjects together, for a quick check only):");
  priorityList(topics, questions).slice(0, 5).forEach((t, i) => {
    console.log(i + 1 + ".", t.name, "|", t.marks, "marks |", t.cumulativePercent + "%");
  });

  console.log("\nFilter tests:");
  console.log("year 2025:", filterQuestions(questions, { year: 2025 }).length);
  console.log("topic 10 + year 2025:", filterQuestions(questions, { topicId: 10, year: 2025 }).length);
  console.log('text "disk":', filterQuestions(questions, { text: "disk" }).length);
  console.log("no match:", filterQuestions(questions, { text: "zzz" }).length);
  console.log("no filters:", filterQuestions(questions).length);
}