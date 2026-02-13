/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/epaper/EpaperList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

// API & types
import { getAllEpapers, Epaper } from "../../api/epaper.api";
import api from "../../api/api";

// Context
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

// UI components
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import SearchInput from "../ui/search/SearchInput";
import PaginationWithText from "../ui/pagination/PaginationWithText";
import { usePagination } from "../ui/pagination/usePagination";
import { useSearch } from "../ui/search/useSearch";

// Icons
import { PencilIcon, TrashBinIcon, EyeIcon, TaskIcon } from "../../icons";

export default function EpaperList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  // ---------- Permission: only admins/staff can edit/delete ----------
  const role = currentUser?.role ? String(currentUser.role).toLowerCase() : "";
  const canEdit = ["superadmin", "admin", "staff"].includes(role);

  // ---------- State ----------
  const [epapers, setEpapers] = useState<Epaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Load all ePapers (client‑side search & pagination) ----------
  const loadEpapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllEpapers(); // Fetch all – no pagination params
      setEpapers(data.epapers || []);
    } catch (err: unknown) {
      console.error("Error fetching ePapers:", err);
      let userMessage = "Failed to load ePapers";
      const status = (err as any)?.response?.status;
      const serverMsg = (err as any)?.response?.data?.message || userMessage;

      if (status === 401) {
        userMessage = "Session expired. Please log in again.";
        navigate("/signin");
      } else if (status === 403) {
        userMessage = "You don't have permission to view ePapers.";
      } else {
        userMessage = serverMsg;
      }

      setError(userMessage);
      showToast({ variant: "error", title: "Error", message: userMessage });
    } finally {
      setLoading(false);
    }
  }, [showToast, navigate]);

  useEffect(() => {
    loadEpapers();
  }, [loadEpapers]);

  // ---------- Enrich ePapers with searchable strings ----------
  const enrichedEpapers = useMemo(() => {
    return epapers.map((ep) => ({
      ...ep,
      _searchableName: ep.name.toLowerCase(),
      _searchableStatus: ep.status?.toLowerCase() || "",
      _searchableCreatedBy: (ep.createdBy?.fullName || "system").toLowerCase(),
      _searchableDate: format(new Date(ep.date), "dd MMM yyyy").toLowerCase(),
    }));
  }, [epapers]);

  // ---------- Status badge color ----------
  function statusColor(status?: string) {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "warning";
      case "archived":
        return "error";
      default:
        return "primary";
    }
  }

  // ---------- Search & Pagination Hooks ----------
  const {
    searchQuery,
    setSearchQuery,
    filteredData: searchedEpapers,
  } = useSearch({
    data: enrichedEpapers,
    searchFields: [
      "_searchableName",
      "_searchableStatus",
      "_searchableCreatedBy",
      "_searchableDate",
    ],
    debounceDelay: 300,
  });

  const {
    currentPage,
    totalPages,
    currentItems: paginatedEpapers,
    setCurrentPage,
  } = usePagination({
    data: searchedEpapers,
    itemsPerPage: 10,
  });

  // ---------- Actions ----------
  const handleView = (id: string) => {
    navigate(`/admin-dashboard/epapers/view/${id}`);
  };

  const handleEdit = (id: string) => {
    if (canEdit) navigate(`/admin-dashboard/epapers/edit/${id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await api.delete(`/epapers/${id}`);
      showToast({
        variant: "success",
        title: "Deleted",
        message: "ePaper deleted successfully",
      });
      loadEpapers(); // refresh list
    } catch (err: unknown) {
      let msg = "Failed to delete ePaper";
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as any;
        msg = axiosError.response?.data?.message || msg;
      }
      showToast({ variant: "error", title: "Error", message: msg });
    }
  };

  // ---------- Render ----------
  return (
    <div className="max-w-7xl mx-auto">
      {/* ---------- Gradient Header ---------- */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-purple-100">
            <TaskIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            E‑Paper Management
          </h2>
        </div>
        <p className="text-gray-600">
          View and manage all e‑paper publications. You can preview, edit, or
          delete.
        </p>
      </div>

      {/* ---------- Main Card ---------- */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 w-full">
        {/* ---------- Search Bar ---------- */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="w-full sm:w-80">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, status, creator, date..."
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total ePapers:{" "}
              <span className="font-semibold">{searchedEpapers.length}</span>
            </div>
          </div>
        </div>

        {/* ---------- Loading State ---------- */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading ePapers...
            </span>
          </div>
        )}

        {/* ---------- Error State ---------- */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 dark:bg-red-500/10 dark:border-red-800">
            <div className="text-red-600 font-medium dark:text-red-400">
              Error
            </div>
            <div className="text-red-500 mt-1 dark:text-red-400/80">
              {error}
            </div>
          </div>
        )}

        {/* ---------- No Data ---------- */}
        {!loading && !error && epapers.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20">
            <div className="text-gray-500 text-lg mb-2 dark:text-gray-400">
              No ePapers found
            </div>
            <div className="text-gray-400 text-sm dark:text-gray-500">
              Create your first ePaper to get started
            </div>
            {canEdit && (
              <button
                onClick={() => navigate("/admin-dashboard/epapers/new")}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                + New ePaper
              </button>
            )}
          </div>
        )}

        {/* ---------- No Search Results ---------- */}
        {!loading &&
          !error &&
          epapers.length > 0 &&
          searchedEpapers.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20">
              <div className="text-gray-500 text-lg mb-2 dark:text-gray-400">
                No ePapers match your search
              </div>
              <div className="text-gray-400 text-sm dark:text-gray-500">
                Try different search terms
              </div>
            </div>
          )}

        {/* ---------- Table ---------- */}
        {!loading && !error && paginatedEpapers.length > 0 && (
          <>
            <div className="w-full overflow-x-auto px-2 sm:px-0 table-scroll">
              <Table className="min-w-[700px] sm:min-w-full">
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Pages
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Created By
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedEpapers.map((epaper) => (
                    <TableRow key={epaper._id}>
                      {/* Name */}
                      <TableCell className="py-3 px-3 text-gray-800 text-theme-sm dark:text-gray-300 whitespace-nowrap font-medium">
                        {epaper.name}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        {format(new Date(epaper.date), "dd MMM yyyy")}
                      </TableCell>

                      {/* Pages */}
                      <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        {epaper.totalPages} pages
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        <Badge size="sm" color={statusColor(epaper.status)}>
                          {epaper.status}
                        </Badge>
                      </TableCell>

                      {/* Created By */}
                      <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                        {epaper.createdBy?.fullName || "System"}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 px-3 text-theme-sm whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {/* View – always visible */}
                          <button
                            onClick={() => handleView(epaper._id!)}
                            className="icon-btn hover:text-blue-600"
                            aria-label="View"
                            title="View ePaper"
                          >
                            <EyeIcon className="w-4 h-4 fill-gray-500 hover:fill-blue-600" />
                          </button>

                          {/* Edit – only if canEdit */}
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(epaper._id!)}
                              className="icon-btn hover:text-green-600"
                              aria-label="Edit"
                              title="Edit ePaper"
                            >
                              <PencilIcon className="w-4 h-4 fill-gray-500 hover:fill-green-600" />
                            </button>
                          )}

                          {/* Delete – only if canEdit */}
                          {canEdit && (
                            <button
                              onClick={() =>
                                handleDelete(epaper._id!, epaper.name)
                              }
                              className="icon-btn hover:text-red-600"
                              aria-label="Delete"
                              title="Delete ePaper"
                            >
                              <TrashBinIcon className="w-4 h-4 fill-gray-500 hover:fill-red-600" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ---------- Pagination ---------- */}
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
              <PaginationWithText
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={searchedEpapers.length}
                itemsPerPage={10}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
