import { fetchQuestions } from "./actions";
import QuestionsClient from "./QuestionsClient";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const questions = await fetchQuestions();
  
  return <QuestionsClient initialQuestions={questions} />;
}