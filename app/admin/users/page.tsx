import { fetchAllUsers } from "./actions";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const users = await fetchAllUsers();
  
  return <UsersClient initialUsers={users} />;
}