import { fetchQuestions } from "./actions";
import QuestionsClient from "./QuestionsClient";

export default async function AdminQuestionsPage() {
  const questions = await fetchQuestions();
  
  return <QuestionsClient initialQuestions={questions} />;
}