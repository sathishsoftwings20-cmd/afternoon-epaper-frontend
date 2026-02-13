// src/pages/Admin/EpaperCreatePage.tsx
import PageMeta from "../../../components/common/PageMeta";
import EpaperForm from "../../../components/epaper/EpaperForm";

export default function EpaperCreatePage() {
  return (
    <>
      <PageMeta
        title="Upload ePaper | Afternoon News Admin"
        description="Create a new digital newspaper edition – upload images, set publication date, and manage pages."
      />
      <div className="space-y-6">
        <EpaperForm />
      </div>
    </>
  );
}
