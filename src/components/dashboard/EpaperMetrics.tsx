import { useEffect, useState } from "react";
import {
  Users,
  Newspaper,
  Download,
  TrendingUp,
  BookOpen,
  BarChart3,
  FileText,
  UserCheck,
} from "lucide-react";
import Badge from "../ui/badge/Badge";
import { getAllEpapers, Epaper } from "../../api/epaper.api";
import { getAllUsers, User } from "../../api/user.api";
import { format } from "date-fns";

interface Metrics {
  totalEpapers: number;
  publishedEpapers: number;
  draftEpapers: number;
  archivedEpapers: number;
  totalUsers: number;
  admins: number;
  staff: number;
  totalPages: number;
  totalPDFSize: number;
  recentEpapers: Epaper[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "info" | "secondary" | "neutral";
  subtitle?: string;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  loading,
}) => {
  const colorClasses = {
    primary: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    success: "bg-gradient-to-br from-green-50 to-green-100 border-green-200",
    warning: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
    info: "bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200",
    secondary:
      "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
    neutral: "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200",
  };

  const iconColorClasses = {
    primary: "bg-blue-500 text-white",
    success: "bg-green-500 text-white",
    warning: "bg-amber-500 text-white",
    info: "bg-cyan-500 text-white",
    secondary: "bg-purple-500 text-white",
    neutral: "bg-gray-500 text-white",
  };

  const textColors = {
    primary: "text-blue-700",
    success: "text-green-700",
    warning: "text-amber-700",
    info: "text-cyan-700",
    secondary: "text-purple-700",
    neutral: "text-gray-700",
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border ${colorClasses[color]} p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className={`text-sm font-medium ${textColors[color]}`}>
            {title}
          </span>
          <h4 className="mt-2 text-2xl font-bold text-gray-800">{value}</h4>
          {subtitle && <p className="mt-1 text-xs text-gray-600">{subtitle}</p>}
        </div>
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconColorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function EpaperMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalEpapers: 0,
    publishedEpapers: 0,
    draftEpapers: 0,
    archivedEpapers: 0,
    totalUsers: 0,
    admins: 0,
    staff: 0,
    totalPages: 0,
    totalPDFSize: 0,
    recentEpapers: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true);
      try {
        const epaperResp = await getAllEpapers(1, 1000);
        const epapers = epaperResp.epapers ?? [];
        const users: User[] = await getAllUsers();

        const totalEpapers = epapers.length;
        const publishedEpapers = epapers.filter(
          (e) => e.status === "published"
        ).length;
        const draftEpapers = epapers.filter((e) => e.status === "draft").length;
        const archivedEpapers = epapers.filter(
          (e) => e.status === "archived"
        ).length;

        const totalPages = epapers.reduce(
          (sum, epaper) => sum + (epaper.images?.length || 0),
          0
        );
        const totalPDFSize =
          epapers.reduce((sum, epaper) => sum + (epaper.pdf?.size || 0), 0) /
          (1024 * 1024);

        const totalUsers = users.length;
        const admins = users.filter(
          (u) => u.role === "Admin" || u.role === "SuperAdmin"
        ).length;
        const staff = users.filter((u) => u.role === "Staff").length;

        const recentEpapers = [...epapers]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 3);

        setMetrics({
          totalEpapers,
          publishedEpapers,
          draftEpapers,
          archivedEpapers,
          totalUsers,
          admins,
          staff,
          totalPages,
          totalPDFSize: parseFloat(totalPDFSize.toFixed(2)),
          recentEpapers,
        });
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Dashboard Overview
          </h2>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total ePapers"
          value={metrics.totalEpapers}
          icon={<Newspaper className="w-5 h-5" />}
          color="primary"
          subtitle={`${metrics.publishedEpapers} published, ${metrics.draftEpapers} drafts`}
          loading={loading}
        />

        <StatCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={<UserCheck className="w-5 h-5" />}
          color="secondary"
          subtitle={`${metrics.admins} admins, ${metrics.staff} staff`}
          loading={loading}
        />

        <StatCard
          title="Published"
          value={metrics.publishedEpapers}
          icon={<TrendingUp className="w-5 h-5" />}
          color="success"
          subtitle="Active ePapers"
          loading={loading}
        />

        <StatCard
          title="Draft"
          value={metrics.draftEpapers}
          icon={<FileText className="w-5 h-5" />}
          color="warning"
          subtitle="In preparation"
          loading={loading}
        />
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">Recent ePapers</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Latest uploaded editions
                </p>
              </div>
              <Badge color="success">New</Badge>
            </div>

            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg animate-pulse bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))
              ) : metrics.recentEpapers.length > 0 ? (
                metrics.recentEpapers.map((epaper) => (
                  <div
                    key={epaper._id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-50 text-blue-600 rounded-lg">
                        <Newspaper className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {epaper.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(epaper.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {epaper.images?.length || 0} pages
                        </p>
                        <Badge
                          color={
                            epaper.status === "published"
                              ? "success"
                              : epaper.status === "draft"
                              ? "warning"
                              : "info"
                          }
                        >
                          {epaper.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No ePapers uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">Quick Stats</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Performance metrics
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span className="text-gray-600">Avg. Pages</span>
                </div>
                <span className="font-bold text-gray-800">
                  {metrics.totalEpapers > 0
                    ? Math.round(metrics.totalPages / metrics.totalEpapers)
                    : 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-gray-600">Publish Rate</span>
                </div>
                <span className="font-bold text-green-600">
                  {metrics.totalEpapers > 0
                    ? `${Math.round(
                        (metrics.publishedEpapers / metrics.totalEpapers) * 100
                      )}%`
                    : "0%"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-gray-600">Avg. PDF Size</span>
                </div>
                <span className="font-bold text-gray-800">
                  {metrics.totalEpapers > 0
                    ? `${(metrics.totalPDFSize / metrics.totalEpapers).toFixed(
                        1
                      )} MB`
                    : "0 MB"}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-gray-600">User Ratio</span>
                </div>
                <span className="font-bold text-gray-800">
                  {metrics.totalUsers > 0
                    ? `${Math.round(
                        (metrics.staff / metrics.totalUsers) * 100
                      )}% staff`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!loading && metrics.totalEpapers === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No ePapers Yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start by uploading your first ePaper to see analytics
          </p>
        </div>
      )}
    </div>
  );
}
