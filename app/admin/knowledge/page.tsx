import { fetchKnowledgeDocs } from "./actions";
import KnowledgeClient from "./KnowledgeClient";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  const docs = await fetchKnowledgeDocs();
  return <KnowledgeClient initialDocs={docs} />;
}
