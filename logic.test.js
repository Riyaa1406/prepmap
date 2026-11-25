const test = require("node:test");
const assert = require("node:assert");
const {
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
} = require("./logic");

// Small data, so every answer can be worked out by hand.
const topics = [
  { id: 1, name: "A" },
  { id: 2, name: "B" },
  { id: 3, name: "C" }, // no questions on purpose
];

const questions = [
  { id: 1, subjectId: 1, topicId: 1, title: "Alpha Disk", year: 2024, marks: 10 },
  { id: 2, subjectId: 1, topicId: 1, title: "Beta", year: 2025, marks: 5 },
  { id: 3, subjectId: 1, topicId: 2, title: "Gamma", year: 2025, marks: 5 },
  { id: 4, subjectId: 2, topicId: 2, title: "Delta", year: 2024, marks: 5 },
];
// Topic 1 = 2 questions, 15 marks. Topic 2 = 2 questions, 10 marks. Total = 25.

test("countByTopic counts questions per topic", () => {
  assert.deepStrictEqual(countByTopic(questions), { 1: 2, 2: 2 });
});

test("marksByTopic adds marks per topic", () => {
  assert.deepStrictEqual(marksByTopic(questions), { 1: 15, 2: 10 });
});

test("countByTopic on empty input gives an empty object", () => {
  assert.deepStrictEqual(countByTopic([]), {});
});

test("priorityList ranks by marks with correct cumulative percent", () => {
  const result = priorityList(topics, questions);
  assert.deepStrictEqual(result.map((t) => t.name), ["A", "B", "C"]);
  assert.deepStrictEqual(result.map((t) => t.marks), [15, 10, 0]);
  assert.deepStrictEqual(result.map((t) => t.cumulativePercent), [60, 100, 100]);
});

test("priorityList with no questions gives 0 percent, not NaN", () => {
  const result = priorityList(topics, []);
  assert.deepStrictEqual(result.map((t) => t.cumulativePercent), [0, 0, 0]);
});

test("priorityList breaks ties by lower topic id", () => {
  const tied = [
    { id: 2, name: "Second" },
    { id: 1, name: "First" },
  ];
  const tiedQuestions = [
    { id: 1, subjectId: 1, topicId: 1, title: "x", year: 2024, marks: 5 },
    { id: 2, subjectId: 1, topicId: 2, title: "y", year: 2024, marks: 5 },
  ];
  const result = priorityList(tied, tiedQuestions);
  assert.deepStrictEqual(result.map((t) => t.name), ["First", "Second"]);
  assert.deepStrictEqual(result.map((t) => t.cumulativePercent), [50, 100]);
});

test("filterQuestions combines filters, and no filters returns all", () => {
  const both = filterQuestions(questions, { subjectId: 1, year: 2025 });
  assert.deepStrictEqual(both.map((q) => q.id), [2, 3]);
  assert.strictEqual(filterQuestions(questions).length, 4);
});

test("filterQuestions text search ignores case, and no match gives empty list", () => {
  assert.deepStrictEqual(filterQuestions(questions, { text: "DISK" }).map((q) => q.id), [1]);
  assert.deepStrictEqual(filterQuestions(questions, { text: "zzz" }), []);
});

test("markCore stops once the running total reaches the threshold exactly", () => {
  const list = [{ marks: 30 }, { marks: 30 }, { marks: 40 }];
  assert.deepStrictEqual(markCore(list).map((t) => t.core), [true, true, false]);
});

test("markCore includes the topic that crosses the threshold", () => {
  const list = [{ marks: 50 }, { marks: 30 }, { marks: 20 }];
  assert.deepStrictEqual(markCore(list).map((t) => t.core), [true, true, false]);
});

test("markCore with no marks marks nothing", () => {
  const list = [{ marks: 0 }, { marks: 0 }];
  assert.deepStrictEqual(markCore(list).map((t) => t.core), [false, false]);
});

test("marksByTopic adds half marks exactly", () => {
  const q = [
    { topicId: 1, marks: 6.5 },
    { topicId: 1, marks: 6 },
    { topicId: 1, marks: 6.5 },
  ];
  assert.deepStrictEqual(marksByTopic(q), { 1: 19 });
});

const goodQuestion = { id: 1, subjectId: 1, topicId: 1, title: "x", year: 2024, marks: 6.5 };

test("parseSavedQuestions returns the array for valid saved text", () => {
  const result = parseSavedQuestions(JSON.stringify([goodQuestion]));
  assert.deepStrictEqual(result, [goodQuestion]);
});

test("parseSavedQuestions returns null for broken text", () => {
  assert.strictEqual(parseSavedQuestions("{broken"), null);
});

test("parseSavedQuestions returns null when nothing was saved", () => {
  assert.strictEqual(parseSavedQuestions(null), null);
});

test("parseSavedQuestions rejects a missing field or odd marks", () => {
  const noTitle = { ...goodQuestion, title: undefined };
  const oddMarks = { ...goodQuestion, marks: 6.3 };
  assert.strictEqual(parseSavedQuestions(JSON.stringify([noTitle])), null);
  assert.strictEqual(parseSavedQuestions(JSON.stringify([oddMarks])), null);
});

test("parseSavedQuestions keeps an empty saved list as empty, not as missing", () => {
  assert.deepStrictEqual(parseSavedQuestions("[]"), []);
});

// ----- Day 17: importing a file -----

const importTopics = [
  { id: 1, subjectId: 1 },
  { id: 2, subjectId: 2 },
];
const importQ = { id: 1, subjectId: 1, topicId: 1, title: "Valid title", year: 2024, marks: 6 };
const wrap = (qs) => JSON.stringify({ app: "prepmap", version: 1, questions: qs });

test("parseImport accepts a valid backup and returns its questions", () => {
  const result = parseImport(wrap([importQ]), importTopics);
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(result.questions, [importQ]);
});

test("parseImport rejects broken text and files without the PrepMap marker", () => {
  assert.strictEqual(parseImport("{broken", importTopics).ok, false);
  assert.strictEqual(parseImport(JSON.stringify([importQ]), importTopics).ok, false);
});

test("parseImport rejects duplicate ids", () => {
  const result = parseImport(wrap([importQ, { ...importQ }]), importTopics);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /share the id 1/);
});

test("parseImport rejects a topic that does not exist", () => {
  const result = parseImport(wrap([{ ...importQ, topicId: 999 }]), importTopics);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /topic that doesn’t exist/);
});

test("parseImport rejects a topic that belongs to a different subject", () => {
  const result = parseImport(wrap([{ ...importQ, subjectId: 2 }]), importTopics);
  assert.strictEqual(result.ok, false);
  assert.match(result.error, /doesn’t belong to its subject/);
});

test("parseImport rejects an empty list of questions", () => {
  assert.strictEqual(parseImport(wrap([]), importTopics).ok, false);
});

// ----- Day 18: revision progress -----

// Topic 1 = 15 marks, topic 2 = 10 marks, topic 3 = 0 marks. Total = 25.
const ranked = [
  { id: 1, marks: 15 },
  { id: 2, marks: 10 },
  { id: 3, marks: 0 },
];

test("revisionProgress counts topics and marks covered", () => {
  assert.deepStrictEqual(revisionProgress(ranked, [1]), {
    done: 1,
    total: 3,
    percent: 33,
    marksDone: 15,
    marksTotal: 25,
    marksPercent: 60,
  });
});

test("revisionProgress with nothing revised is all zeros, and everything revised is 100", () => {
  assert.strictEqual(revisionProgress(ranked, []).percent, 0);
  assert.strictEqual(revisionProgress(ranked, []).marksPercent, 0);
  assert.strictEqual(revisionProgress(ranked, [1, 2, 3]).percent, 100);
  assert.strictEqual(revisionProgress(ranked, [1, 2, 3]).marksPercent, 100);
});

test("revisionProgress with an empty list gives 0, not NaN", () => {
  const result = revisionProgress([], [1]);
  assert.strictEqual(result.percent, 0);
  assert.strictEqual(result.marksPercent, 0);
});

test("revisionProgress ignores ids that are not in the list", () => {
  assert.strictEqual(revisionProgress(ranked, [99]).done, 0);
});

test("parseSavedRevised keeps known ids and drops unknown ones and duplicates", () => {
  assert.deepStrictEqual(parseSavedRevised("[1, 1, 2, 99, \"x\"]", topics), [1, 2]);
});

test("parseSavedRevised returns an empty list for broken text or a wrong shape", () => {
  assert.deepStrictEqual(parseSavedRevised("{broken", topics), []);
  assert.deepStrictEqual(parseSavedRevised("{\"a\": 1}", topics), []);
});

test("parseSavedRevised returns an empty list when nothing was saved", () => {
  assert.deepStrictEqual(parseSavedRevised(null, topics), []);
});

// ----- Course, year of study and subject -----

const scopeSubjects = [
  { id: 1, courseId: 1, year: 3 },
  { id: 2, courseId: 1, year: 3 },
  { id: 3, courseId: 1, year: 2 },
  { id: 4, courseId: 2, year: 1 },
];

test("yearsForCourse lists each year once, in order", () => {
  assert.deepStrictEqual(yearsForCourse(scopeSubjects, 1), [2, 3]);
  assert.deepStrictEqual(yearsForCourse(scopeSubjects, 2), [1]);
});

test("yearsForCourse gives an empty list for a course with no subjects", () => {
  assert.deepStrictEqual(yearsForCourse(scopeSubjects, 99), []);
});

test("subjectsFor returns only the subjects of that course and year", () => {
  assert.deepStrictEqual(subjectsFor(scopeSubjects, 1, 3).map((s) => s.id), [1, 2]);
  assert.deepStrictEqual(subjectsFor(scopeSubjects, 1, 4), []);
});

test("groupByUnit groups topics by unit, in unit order", () => {
  const result = groupByUnit([
    { id: 1, unit: 2 },
    { id: 2, unit: 1 },
    { id: 3, unit: 2 },
  ]);
  assert.deepStrictEqual(result.map((g) => g.unit), [1, 2]);
  assert.deepStrictEqual(result[1].topics.map((t) => t.id), [1, 3]);
});

test("groupByUnit on an empty list gives an empty list", () => {
  assert.deepStrictEqual(groupByUnit([]), []);
});