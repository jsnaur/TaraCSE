import { fetchAdminUsers } from "./actions";
import VerificationsClient from "./VerificationsClient";

export default async function AdminVerificationPage() {
  const users = await fetchAdminUsers();
  
  return <VerificationsClient initialUsers={users} />;
}