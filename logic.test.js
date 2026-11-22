const test = require("node:test");
const assert = require("node:assert");
const { countByTopic, marksByTopic, priorityList, markCore, filterQuestions } = require("./logic");

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