// src/pages/Admin/EpaperViewPage.tsx
import PageMeta from "../../../components/common/PageMeta";
import EpaperView from "../../../components/epaper/EpaperView";

export default function EpaperViewPage() {
  return (
    <>
      <PageMeta
        title="View ePaper | Afternoon News Admin"
        description="Preview newspaper pages, check metadata, and review publication details."
      />
      <div className="space-y-6">
        <EpaperView />
      </div>
    </>
  );
}
