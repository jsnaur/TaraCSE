import { fetchAuditLogs } from "./actions";
import AuditClient from "./AuditClient";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await fetchAuditLogs(200);
  return <AuditClient initialLogs={logs} />;
}
