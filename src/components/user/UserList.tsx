/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/user/UserList.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// API & types
import { getAllUsers, User } from "../../api/user.api";

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
import { PencilIcon, UserIcon } from "../../icons"; // Use a suitable icon

export default function UserList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  // ---------- Permission logic ----------
  const canEditUser = (targetUser: User): boolean => {
    if (currentUser?.role === "SuperAdmin") return true;
    if (currentUser?.role === "Admin") {
      return targetUser.role !== "SuperAdmin";
    }
    // Staff can only edit themselves
    return currentUser?._id === targetUser._id;
  };

  // ---------- State ----------
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------- Load all users (client‑side search & pagination) ----------
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUsers();
      setUserList(data ?? []);
    } catch (err: unknown) {
      console.error("Error fetching users:", err);
      let userMessage = "Failed to load users";
      const status = (err as any)?.response?.status;
      const serverMsg = (err as any)?.response?.data?.message || userMessage;

      if (status === 401) {
        userMessage = "Session expired. Please log in again.";
        navigate("/signin");
      } else if (status === 403) {
        userMessage = "You don't have permission to view users.";
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
    loadUsers();
  }, [loadUsers]);

  // ---------- Enrich users with searchable strings ----------
  const enrichedUsers = useMemo(() => {
    return userList.map((user) => ({
      ...user,
      _searchableName: (user.fullName || "").toLowerCase(),
      _searchableUsername: (user.userName || "").toLowerCase(),
      _searchableEmail: (user.email || "").toLowerCase(),
      _searchableRole: (user.role || "").toLowerCase(),
    }));
  }, [userList]);

  // ---------- Status badge color ----------
  function roleColor(role?: string) {
    switch (role) {
      case "SuperAdmin":
        return "success";
      case "Admin":
        return "warning";
      case "Staff":
        return "primary";
      default:
        return "primary";
    }
  }

  // ---------- Search & Pagination Hooks ----------
  const {
    searchQuery,
    setSearchQuery,
    filteredData: searchedUsers,
  } = useSearch({
    data: enrichedUsers,
    searchFields: [
      "_searchableName",
      "_searchableUsername",
      "_searchableEmail",
      "_searchableRole",
    ],
    debounceDelay: 300,
  });

  const {
    currentPage,
    totalPages,
    currentItems: paginatedUsers,
    setCurrentPage,
  } = usePagination({
    data: searchedUsers,
    itemsPerPage: 10,
  });

  // ---------- Actions ----------
  const handleEdit = (id: string) => {
    navigate(`/admin-dashboard/users/edit/${id}`);
  };

  // ---------- Render ----------
  return (
    <div className="max-w-7xl mx-auto">
      {/* ---------- Gradient Header ---------- */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100">
            <UserIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>
        <p className="text-gray-600">
          View and manage all users. You can edit profiles and assign roles.
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
                placeholder="Search by name, username, email, role..."
                className="w-full"
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total users:{" "}
              <span className="font-semibold">{searchedUsers.length}</span>
            </div>
          </div>
        </div>

        {/* ---------- Loading State ---------- */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading users...
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
        {!loading && !error && userList.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20">
            <div className="text-gray-500 text-lg mb-2 dark:text-gray-400">
              No users found
            </div>
            <div className="text-gray-400 text-sm dark:text-gray-500">
              Users will appear here once they register or are created.
            </div>
          </div>
        )}

        {/* ---------- No Search Results ---------- */}
        {!loading &&
          !error &&
          userList.length > 0 &&
          searchedUsers.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 dark:border-gray-700 dark:bg-gray-800/20">
              <div className="text-gray-500 text-lg mb-2 dark:text-gray-400">
                No users match your search
              </div>
              <div className="text-gray-400 text-sm dark:text-gray-500">
                Try different search terms
              </div>
            </div>
          )}

        {/* ---------- Table ---------- */}
        {!loading && !error && paginatedUsers.length > 0 && (
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
                      Username
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Email
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 px-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Role
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
                  {paginatedUsers.map((user) => {
                    const canEdit = canEditUser(user);
                    return (
                      <TableRow key={user._id}>
                        {/* Name */}
                        <TableCell className="py-3 px-3 text-gray-800 text-theme-sm dark:text-gray-300 whitespace-nowrap font-medium">
                          {user.fullName || "-"}
                        </TableCell>

                        {/* Username */}
                        <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                          {user.userName || "-"}
                        </TableCell>

                        {/* Email */}
                        <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                          {user.email || "-"}
                        </TableCell>

                        {/* Role */}
                        <TableCell className="py-3 px-3 text-gray-600 text-theme-sm dark:text-gray-400 whitespace-nowrap">
                          <Badge size="sm" color={roleColor(user.role)}>
                            {user.role || "Staff"}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="py-3 px-3 text-theme-sm whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => canEdit && handleEdit(user._id)}
                              className={`icon-btn ${
                                !canEdit
                                  ? "cursor-not-allowed opacity-50"
                                  : "hover:text-blue-600"
                              }`}
                              aria-label="Edit"
                              disabled={!canEdit}
                              title={
                                !canEdit
                                  ? "You don't have permission to edit this user"
                                  : "Edit user"
                              }
                            >
                              <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-500 dark:fill-gray-400 hover:fill-blue-600" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ---------- Pagination ---------- */}
            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-800">
              <PaginationWithText
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={searchedUsers.length}
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
