# DEVLOG

## Day 1: Requirements and repo
- Did: wrote the problem, users and feature list in README.md; created the repo.
- What broke: ran `cd Desktop` after I was already inside the prepmap folder, so it said path not found. It didn't affect anything.
- What I learned: how git init, add, commit and push work, and that requirements go before code.
## Day 2:
- Did: created data.js with real OS data: 1 subject, 10 topics, 35 questions from two past papers.

## Day 3: Counting logic in Node
- Did: wrote countByTopic and marksByTopic in logic.js using reduce, and printed totals per topic.
- What broke: nothing. The output matched my hand count for File System (6 questions, 29 marks). [If you hit an error or got a different number, write that instead.]
- What I learned: how reduce builds one result from an array, why `|| 0` is needed the first time a topic appears, and that the totals show marks offered, not marks a student must answer, because the papers have choices.

## Day 4: Priority list and filters
- Did: added priorityList (ranked topics with cumulative percentage) and filterQuestions (subject, topic, year, text) to logic.js.
- What broke: nothing major. My output matched the expected priority list. [If you got an error or a different number, write that instead.]
- What I learned: how sort with (a, b) => b.marks - a.marks orders from highest to lowest, how a running total gives the cumulative percentage, and how filters combine because every check must pass. Ties (Introduction and Virtual Memory, both 15 marks) keep their original order, so the "first 60%" line depends on that.
## Day 5: Tests
- Did: added logic.test.js with 8 tests using hand-computed values, including empty input and ties; made tie-breaking explicit (lower topic id first).
- What broke: nothing in the first run, all 8 tests passed. When I reversed the sort on purpose, [write which test(s) failed and what the message showed].
- What I learned: a test calls a function with small data where I know the answer by hand and fails if the result differs. Edge cases like empty input and ties are where bugs hide, so they need their own tests. Tests let me change code later and see straight away if I broke something.