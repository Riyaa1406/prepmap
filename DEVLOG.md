# DEVLOG

## Day 1: Requirements and repo
- Did: wrote the problem, users and feature list in README.md; created the repo and pushed it to GitHub.
- What broke: I ran `cd Desktop` after I was already inside the prepmap folder, so it said the path was not found. It didn't affect anything.
- What I learned: how git init, add, commit and push work, and that requirements go before code because words are cheap to change and code is not.

## Day 2: Data model and sample data
- Did: wrote the data model on paper and created data.js with subjects, topics and questions. Replaced the sample data with real Operating Systems data from two past papers: 1 subject, 10 topics, 35 questions.
- What broke: nothing. The first sample data didn't match my subjects, so I rebuilt it from my own papers and syllabus.
- What I learned: questions store a topicId, not the topic name, so renaming a topic changes one line and every question follows. Years and marks came from the real papers.

## Day 3: Counting logic in Node
- Did: wrote countByTopic and marksByTopic in logic.js using reduce, and printed totals per topic.
- What broke: nothing. The output matched my hand count for File System (6 questions, 29 marks).
- What I learned: reduce starts with a value I pass in, updates it for each item and returns it, so the result feeds the next step. `|| 0` is needed the first time a topic appears. The totals show marks offered, not marks a student must answer, because the papers have choices.

## Day 4: Priority list and filters
- Did: added priorityList (topics ranked by marks with a cumulative percentage) and filterQuestions (subject, topic, year, text) to logic.js.
- What broke: nothing. The output matched the expected priority list and filter counts.
- What I learned: sort with `b.marks - a.marks` orders from highest to lowest, a running total gives the cumulative percentage, and filters combine because every check must pass. Tied topics need a rule, or the order is accidental.

## Day 5: Tests
- Did: added logic.test.js with 8 tests using hand-computed values, including empty input and ties. Made tie-breaking explicit (lower topic id first).
- What broke: nothing in the first run, all 8 tests passed.
- What I learned: a test calls a function with small data where I know the answer by hand and fails if the result differs. Edge cases like empty input and ties are where bugs hide, so they get their own tests. Tests tell me straight away if a later change breaks something.

## Day 6: HTML skeleton
- Did: created index.html with header, add-question form, filter section, question list area and stats area. No CSS or JavaScript yet.
- What broke: nothing. The page was readable without styling, clicking a label focused its input, and empty required fields were blocked.
- What I learned: labels linked with for and id make fields clickable and readable by screen readers, semantic tags describe the page structure, and the dropdowns are left empty so JavaScript can fill them from data.js.

## Day 7: CSS layout
- Did: created styles.css with a card layout, stacked form fields using flexbox, and a two-column grid on wide screens that stacks on phones.
- What broke: nothing.
- What I learned: flexbox lays out one line at a time, grid does rows and columns together, and mobile-first means the default styles are the phone layout, with a media query adding the wide-screen extras.

## Day 8: Render a list from data
- Did: linked data.js and script.js, and rendered all 35 questions as list items with createElement. Made data.js safe to load in the browser.
- What broke: data.js used module.exports, which browsers don't have, so I wrapped it in a typeof module check.
- What I learned: the DOM is the browser's live tree of the page, JavaScript changes that tree and not the HTML file, and textContent is safer than innerHTML because it never runs user text as code.

## Day 9: The render pattern
- Did: moved the data into a state object and wrote one render() function that redraws the question list and count from state.
- What broke: nothing. The page only changed after I called render().
- What I learned: change state first, then call render(), so the screen always matches the data. I copy the array with [...questions] so data.js stays untouched.

## Day 10: Add a question (events)
- Did: filled the subject and topic dropdowns from data.js, handled the form submit event, converted year and marks to numbers, added the question to state and re-rendered.
- What broke: nothing.
- What I learned: preventDefault stops the form from reloading the page and wiping state, and input values are always strings, so year and marks need Number() before they go into state.

## Day 11: Validation
- Did: added validateQuestion with a message per field, showed errors next to the inputs, and turned off the browser's built-in checks with novalidate.
- What broke: nothing.
- What I learned: HTML attributes like required can be skipped or removed in DevTools, so JavaScript has to check the data itself. Validation returns one message per field and stops bad data before it reaches state.

## Day 12: Delete and edit
- Did: gave every question a Delete and an Edit button that find the question by its id; edit mode refills the form and saves changes in place; Cancel and delete-while-editing return to add mode.
- What broke: nothing.
- What I learned: I use the id, not the array position, because positions shift after a delete. One click listener on the list handles all buttons, and filter and map return new arrays that I assign back to state before calling render().

## Day 14: Topic frequency chart
- Did: drew a CSS-only horizontal bar chart of questions per topic, using countByTopic from logic.js, redrawn on every render.
- What broke: nothing. The bars matched my Day 3 counts, and they shrank and grew when I deleted and added questions.
- What I learned: each bar's width is the topic's count as a percentage of the largest count, and the number is printed beside the bar so the chart doesn't rely on length alone.

## Day 15: Priority view
- Did: added markCore to logic.js (with 3 tests), and a ranked table that highlights the topics covering the first 60% of marks, redrawn on every render.
- What broke: nothing. On the real data, the first four topics (29 + 22 + 21 + 15 = 87 of 145) are highlighted, which matched my hand calculation.
- What I learned: a topic counts as core if the marks before it haven't reached 60% yet, so the topic that crosses the line is included. The rule lives in logic.js and is tested, and the page only displays it.