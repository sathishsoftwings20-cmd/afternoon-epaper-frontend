// src/pages/Dashboard/Users/UserListPage.tsx
import PageMeta from "../../../components/common/PageMeta";
import UserList from "../../../components/user/UserList";

export default function UserListPage() {
  return (
    <>
      <PageMeta
        title="User Management | Afternoon News Admin"
        description="View, edit, and manage administrator and staff accounts."
      />
      <div className="space-y-6">
        <UserList />
      </div>
    </>
  );
}
