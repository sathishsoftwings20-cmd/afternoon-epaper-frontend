// src/pages/Admin/EpaperListPage.tsx
import PageMeta from "../../../components/common/PageMeta";
import EpaperList from "../../../components/epaper/EpaperList";

export default function EpaperListPage() {
  return (
    <>
      <PageMeta
        title="Manage ePapers | Afternoon News Admin"
        description="View, search, edit, and delete all ePaper publications. Monitor status and publication dates."
      />
      <div className="space-y-6">
        <EpaperList />
      </div>
    </>
  );
}
