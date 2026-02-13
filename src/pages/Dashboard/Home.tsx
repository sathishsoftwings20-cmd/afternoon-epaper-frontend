import EpaperMetrics from "../../components/dashboard/EpaperMetrics";
import PageMeta from "../../components/common/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | Afternoon News Admin"
        description="Quick overview of ePaper publications, total editions, and recent activity."
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <EpaperMetrics />
        </div>
      </div>
    </>
  );
}
