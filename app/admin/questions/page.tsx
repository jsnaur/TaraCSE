import { fetchQuestions, fetchQuestionStats } from "./actions";
import { DEFAULT_QUESTION_FILTERS } from "./constants";
import QuestionsClient from "./QuestionsClient";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  // Only the first page and the aggregate counts are loaded up front — every
  // subsequent page / filter change is fetched on demand from the client.
  const [initialData, initialStats] = await Promise.all([
    fetchQuestions({ page: 1, filters: DEFAULT_QUESTION_FILTERS }),
    fetchQuestionStats(),
  ]);

  return <QuestionsClient initialData={initialData} initialStats={initialStats} />;
}
