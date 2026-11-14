const subjects = [
  { id: 1, name: "Operating Systems", code: "CIC-305" },
];

// Topics follow the syllabus units
const topics = [
  { id: 1, subjectId: 1, name: "Introduction to Operating Systems", revised: false },
  { id: 2, subjectId: 1, name: "Processes and Interrupts", revised: false },
  { id: 3, subjectId: 1, name: "Threads", revised: false },
  { id: 4, subjectId: 1, name: "CPU Scheduling", revised: false },
  { id: 5, subjectId: 1, name: "Process Synchronization", revised: false },
  { id: 6, subjectId: 1, name: "Memory Management", revised: false },
  { id: 7, subjectId: 1, name: "Virtual Memory and Page Replacement", revised: false },
  { id: 8, subjectId: 1, name: "Deadlocks", revised: false },
  { id: 9, subjectId: 1, name: "Device Management and Disk Scheduling", revised: false },
  { id: 10, subjectId: 1, name: "File System", revised: false },
];

// Titles are short and in my own words. Year 2023 = mid term Nov 2023,
// year 2025 = end term Dec 2025 to Jan 2026.
const questions = [
  // Mid term, Nov 2023
  { id: 1, subjectId: 1, topicId: 1, title: "What is an operating system", year: 2023, marks: 1 },
  { id: 2, subjectId: 1, topicId: 1, title: "Software layers in a modern computer system", year: 2023, marks: 2 },
  { id: 3, subjectId: 1, topicId: 6, title: "Examples of primary and secondary storage", year: 2023, marks: 2 },
  { id: 4, subjectId: 1, topicId: 4, title: "Function of the task scheduler", year: 2023, marks: 1 },
  { id: 5, subjectId: 1, topicId: 3, title: "Meaning of a thread", year: 2023, marks: 2 },
  { id: 6, subjectId: 1, topicId: 9, title: "Meaning of a device driver", year: 2023, marks: 1 },
  { id: 7, subjectId: 1, topicId: 2, title: "Function of the program counter in process control", year: 2023, marks: 1 },
  { id: 8, subjectId: 1, topicId: 9, title: "DMA structure and why it is needed", year: 2023, marks: 5 },
  { id: 9, subjectId: 1, topicId: 4, title: "Meaning and functions of the CPU scheduler", year: 2023, marks: 5 },
  { id: 10, subjectId: 1, topicId: 2, title: "Context switching", year: 2023, marks: 5 },
  { id: 11, subjectId: 1, topicId: 2, title: "Process states and their transitions", year: 2023, marks: 5 },
  { id: 12, subjectId: 1, topicId: 9, title: "Caching and why it matters", year: 2023, marks: 5 },
  { id: 13, subjectId: 1, topicId: 1, title: "Five functions of an operating system", year: 2023, marks: 5 },
  // End term, Dec 2025 to Jan 2026
  { id: 14, subjectId: 1, topicId: 4, title: "Criteria for choosing a CPU scheduling algorithm", year: 2025, marks: 4 },
  { id: 15, subjectId: 1, topicId: 1, title: "Time sharing versus real-time systems", year: 2025, marks: 4 },
  { id: 16, subjectId: 1, topicId: 6, title: "Logical versus physical address with a diagram", year: 2025, marks: 4 },
  { id: 17, subjectId: 1, topicId: 8, title: "Necessary and sufficient conditions for deadlock", year: 2025, marks: 4 },
  { id: 18, subjectId: 1, topicId: 10, title: "Access control lists for files and directories", year: 2025, marks: 4 },
  { id: 19, subjectId: 1, topicId: 1, title: "OS functions and process versus program", year: 2025, marks: 3 },
  { id: 20, subjectId: 1, topicId: 4, title: "SRTF, round robin, SJF and priority numerical", year: 2025, marks: 7 },
  { id: 21, subjectId: 1, topicId: 3, title: "User-level versus kernel-level threads", year: 2025, marks: 5 },
  { id: 22, subjectId: 1, topicId: 4, title: "Preemptive versus non-preemptive scheduling", year: 2025, marks: 5 },
  { id: 23, subjectId: 1, topicId: 7, title: "Demand paging, and paging versus segmentation", year: 2025, marks: 4 },
  { id: 24, subjectId: 1, topicId: 7, title: "LRU, FIFO and optimal on a reference string", year: 2025, marks: 6 },
  { id: 25, subjectId: 1, topicId: 7, title: "Virtual memory, and first, best and worst fit", year: 2025, marks: 5 },
  { id: 26, subjectId: 1, topicId: 5, title: "Critical section problem and dining philosophers", year: 2025, marks: 5 },
  { id: 27, subjectId: 1, topicId: 8, title: "Deadlock with examples and recovery", year: 2025, marks: 3 },
  { id: 28, subjectId: 1, topicId: 8, title: "Banker's algorithm and safe sequence on a table", year: 2025, marks: 7 },
  { id: 29, subjectId: 1, topicId: 9, title: "Disk architecture and disk scheduling algorithms", year: 2025, marks: 5 },
  { id: 30, subjectId: 1, topicId: 9, title: "FCFS, SSTF and SCAN head movement numerical", year: 2025, marks: 5 },
  { id: 31, subjectId: 1, topicId: 10, title: "File concept, structure, attributes, operations, types", year: 2025, marks: 5 },
  { id: 32, subjectId: 1, topicId: 10, title: "File allocation methods, sequential versus random access", year: 2025, marks: 5 },
  { id: 33, subjectId: 1, topicId: 10, title: "Short note: free space management", year: 2025, marks: 5 },
  { id: 34, subjectId: 1, topicId: 10, title: "Short note: data integrity protection", year: 2025, marks: 5 },
  { id: 35, subjectId: 1, topicId: 10, title: "Short note: file system in UNIX", year: 2025, marks: 5 },
];

module.exports = { subjects, topics, questions };