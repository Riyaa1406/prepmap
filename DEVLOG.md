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
## Day 6: HTML skeleton
- Did: created index.html with header, add-question form, filter section, question list area and stats area. No CSS or JavaScript yet.
- What broke: nothing. The page opened in the browser and was readable without styling. Clicking a label focused its input, and empty required fields were blocked. [If something went wrong, write that instead.]
- What I learned: labels linked with for and id make fields clickable and readable by screen readers, semantic tags like header, main and section describe the page structure, and the select dropdowns are left empty on purpose so JavaScript can fill them from data.js later.
## Day 7: CSS layout
- Did: created styles.css with a card layout, stacked form fields using flexbox, and a two-column grid on wide screens that stacks on phones.
- What broke: nothing. [Edit if the layout looked wrong at any width.]
- What I learned: flexbox lays out one line at a time, grid does rows and columns together, and mobile-first means the default styles are the phone layout, with a media query adding the wide-screen extras.
## Day 8: Render a list from data
- Did: linked data.js and script.js, and rendered all 35 questions as list items with createElement. Made data.js safe to load in the browser.
- What broke: module.exports doesn't exist in the browser, so data.js needed a typeof module check. [Edit if you saw a different error or none.]
- What I learned: the DOM is the browser's live tree of the page, JavaScript changes that tree and not the HTML file, and textContent is safer than innerHTML because it never runs user text as code.
## Day 9: The render pattern
- Did: moved the data into a state object and wrote one render() function that redraws the question list and count from state.
- What broke: nothing. The page only changed after I called render().
- What I learned: change state first, then call render(), so the screen always matches the data.
## Day10: Events
- Did: filled the subject and topic dropdowns from data.js, handled the form submit event, converted year and marks to numbers, added the question to state and re-rendered.
- What broke: nothing. [Edit if the form reloaded the page or the dropdown stayed empty.]
- What I learned: preventDefault stops the form from reloading the page and wiping state, and input values are always strings, so year and marks need Number() before they go into state.
## Day 11: Validation
- Did: added validateQuestion with a message per field, showed errors next to the inputs, and turned off the browser's built-in checks with novalidate.
- What broke: nothing. [Edit if one of the five bad inputs got through.]
- What I learned: HTML attributes like required can be skipped or removed in DevTools, so JavaScript has to check the data itself, and validation should return one message per field and stop bad data before it reaches state.