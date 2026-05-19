// Shared, plain (non-"use server") constants for the Question Bank admin panel.
// Kept out of actions.ts because a "use server" file may only export async
// functions — this lets both the server actions and the client component
// import the same values.

import type { QuestionFilters } from "./actions";

/** Rows fetched/rendered per page of the admin question list. */
export const QUESTIONS_PAGE_SIZE = 25;

/** No-op filter set — matches every question. */
export const DEFAULT_QUESTION_FILTERS: QuestionFilters = {
  search: "",
  level: "All",
  category: "All",
  difficulty: "All",
  status: "All",
  quality: "All",
};
