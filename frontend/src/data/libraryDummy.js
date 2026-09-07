// Dummy per-student library book records for the demo UI.
// Keyed by rollNo (uppercase). Each entry contains `books` array and `libraryFine` number.
export const LIBRARY_DUMMY = {
  // Student A: 2 pending books + fine
  ME21B0755: {
    books: [
      { name: "Database Management Systems", id: "LIB-2025-00124", issueDate: "2026-08-12", dueDate: "2026-08-26", amount: 500 },
      { name: "Operating System Concepts", id: "LIB-2025-00187", issueDate: "2026-08-15", dueDate: "2026-08-29", amount: 700 },
    ],
    libraryFine: 300,
  },
  // Student B: 1 pending book, no fine
  CS22B1047: {
    books: [
      { name: "Computer Networks", id: "LIB-2025-00201", issueDate: "2026-08-10", dueDate: "2026-08-24", amount: 400 },
    ],
    libraryFine: 0,
  },
  // Student C: no dues
  BT23B0621: {
    books: [],
    libraryFine: 0,
  },
};

export default LIBRARY_DUMMY;
