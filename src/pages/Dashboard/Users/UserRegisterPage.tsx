import PageMeta from "../../../components/common/PageMeta";
import UserRegister from "../../../components/user/UserRegister";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Create User | Afternoon News Admin"
        description="Add a new staff or administrator account – set username, email, and role."
      />
      <div className="w-full">
        <UserRegister />
      </div>
    </>
  );
}
