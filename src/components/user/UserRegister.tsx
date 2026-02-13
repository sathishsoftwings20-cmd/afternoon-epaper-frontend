// src/components/user/UserForm.tsx
import React, { useEffect, useState } from "react";
import { getUserById } from "../../api/user.api";
import api from "../../api/api";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import Button from "../ui/button/Button";
import Select from "../ui/form/Select";
import { useToast } from "../../context/ToastContext";
import { EyeCloseIcon, EyeIcon, UserIcon, PencilIcon } from "../../icons";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Lock } from "lucide-react";

/* ---------------------- Types ---------------------- */
type FormUser = {
  fullName: string;
  email: string;
  userName: string;
  password?: string;
  passwordConfirm?: string;
  role: "SuperAdmin" | "Admin" | "Staff"; // SuperAdmin is selectable only for existing? We'll restrict options to Staff/Admin only.
};

type Errors = {
  fullName?: string;
  email?: string;
  userName?: string;
  password?: string;
  passwordConfirm?: string;
};

// Separate types for create and update payloads
type CreateUserPayload = {
  fullName: string;
  email: string;
  userName: string;
  role: "Admin" | "Staff"; // Only these two can be created via this form
  password: string;
};

type UpdateUserPayload = {
  fullName: string;
  email: string;
  role: "Admin" | "Staff";
  password?: string;
};

/* ---------------------- Defaults ---------------------- */
const defaultForm: FormUser = {
  fullName: "",
  email: "",
  userName: "",
  password: "",
  passwordConfirm: "",
  role: "Staff",
};

/* ===================== Component ===================== */
export default function UserRegister() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [user, setUser] = useState<FormUser>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Prevent username changes in edit mode
    if (isEditing && name === "userName") {
      return;
    }

    setUser((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name as keyof Errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Handle role change for Select component
  const handleRoleSelectChange = (value: string) => {
    setUser((prev) => ({
      ...prev,
      role: value as FormUser["role"],
    }));
  };

  // Load user for edit
  useEffect(() => {
    if (!id) return;

    setIsEditing(true);

    let cancelled = false;
    (async () => {
      try {
        const data = await getUserById(id);
        if (cancelled) return;

        setUser({
          fullName: data.fullName || "",
          email: data.email || "",
          userName: data.userName || "",
          role: (data.role as FormUser["role"]) || "Staff",
          password: "",
          passwordConfirm: "",
        });
      } catch (err) {
        console.error("Failed to load user", err);
        showToast({
          variant: "error",
          title: "Error",
          message: "Failed to load user",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  // Validation – returns object of errors
  const validate = (): Errors => {
    const newErrors: Errors = {};

    // Full name
    if (!user.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    }

    // Email
    if (!user.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email.trim())) {
      newErrors.email = "Email is invalid";
    }

    // Username – only required on create
    if (!isEditing && !user.userName?.trim()) {
      newErrors.userName = "Username is required";
    }

    // Password rules
    if (!isEditing) {
      // CREATE
      if (!user.password) {
        newErrors.password = "Password is required";
      } else if (user.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (!user.passwordConfirm) {
        newErrors.passwordConfirm = "Confirm password is required";
      } else if (user.password !== user.passwordConfirm) {
        newErrors.passwordConfirm = "Passwords do not match";
      }
    } else {
      // UPDATE – optional
      if (user.password && user.password.length > 0) {
        if (user.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        }
        if (!user.passwordConfirm) {
          newErrors.passwordConfirm = "Please confirm your password";
        } else if (user.password !== user.passwordConfirm) {
          newErrors.passwordConfirm = "Passwords do not match";
        }
      }
    }

    return newErrors;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showToast({
        variant: "error",
        title: "Validation Error",
        message: Object.values(validationErrors).join("\n"),
      });
      return;
    }

    setLoading(true);

    try {
      if (id) {
        // UPDATE
        const payload: UpdateUserPayload = {
          fullName: user.fullName.trim(),
          email: user.email.trim(),
          role: user.role as "Admin" | "Staff",
        };

        if (user.password?.trim()) {
          payload.password = user.password;
        }

        await api.put(`/users/${id}`, payload);

        showToast({
          variant: "success",
          title: "Updated",
          message: "User updated successfully.",
        });
      } else {
        // CREATE
        const payload: CreateUserPayload = {
          fullName: user.fullName.trim(),
          email: user.email.trim(),
          userName: user.userName.trim(),
          role: user.role as "Admin" | "Staff",
          password: user.password!,
        };

        await api.post(`/users`, payload);

        showToast({
          variant: "success",
          title: "Created",
          message: "User created successfully.",
        });
      }

      // Navigate after success
      navigate("/admin-dashboard/users");
    } catch (err: unknown) {
      let msg = "Something went wrong";

      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.response?.data?.error || msg;

        // Specific error messages
        if (
          msg.toLowerCase().includes("username") &&
          msg.toLowerCase().includes("already")
        ) {
          msg = "This username is already taken. Please choose another.";
        } else if (
          msg.toLowerCase().includes("email") &&
          msg.toLowerCase().includes("already")
        ) {
          msg = "This email is already registered.";
        }
      } else if (err instanceof Error) {
        msg = err.message;
      }

      showToast({
        variant: "error",
        title: "Error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  // Role options – only Staff and Admin (SuperAdmin cannot be created via this form)
  const roleOptions = [
    { value: "Staff", label: "Staff" },
    { value: "Admin", label: "Admin" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ---------- Gradient Header (matching first UserForm) ---------- */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100">
            {isEditing ? (
              <PencilIcon className="w-6 h-6 text-blue-600" />
            ) : (
              <UserIcon className="w-6 h-6 text-blue-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit User" : "Create New User"}
          </h2>
        </div>
        <p className="text-gray-600">
          {isEditing
            ? "Update user information and permissions. Username cannot be changed."
            : "Create a new staff or admin account with appropriate role."}
        </p>
      </div>

      {/* ---------- Form Card ---------- */}
      <div className="w-full rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={user.fullName}
                onChange={handleChange}
                error={!!errors.fullName}
                placeholder="Enter full name"
                disabled={loading}
              />
              {errors.fullName && (
                <div className="text-sm text-red-600 mt-1">
                  {errors.fullName}
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                options={roleOptions}
                value={user.role}
                onChange={handleRoleSelectChange}
                className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={user.email}
                onChange={handleChange}
                error={!!errors.email}
                placeholder="Enter email address"
                disabled={loading}
              />
              {errors.email && (
                <div className="text-sm text-red-600 mt-1">{errors.email}</div>
              )}
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="userName">
                Username {!isEditing && <span className="text-red-500">*</span>}
                {isEditing && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (Cannot be changed)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="userName"
                  name="userName"
                  value={user.userName}
                  onChange={handleChange}
                  error={!!errors.userName}
                  placeholder="Choose a username"
                  disabled={isEditing || loading}
                  className={`pr-10 ${
                    isEditing
                      ? "bg-gray-50 text-gray-600 border-gray-300 cursor-not-allowed"
                      : ""
                  }`}
                />
                {isEditing && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              {errors.userName && (
                <div className="text-sm text-red-600 mt-1">
                  {errors.userName}
                </div>
              )}
              {!isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Username cannot be changed once created
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">
                Password{" "}
                {isEditing ? (
                  "(Optional)"
                ) : (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  placeholder={
                    isEditing
                      ? "Leave blank to keep current password"
                      : "Enter password"
                  }
                  type={showPassword ? "text" : "password"}
                  value={user.password || ""}
                  onChange={handleChange}
                  error={!!errors.password}
                  disabled={loading}
                />
                <span
                  onClick={() => !loading && setShowPassword(!showPassword)}
                  className={`absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 ${
                    loading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </span>
              </div>
              {errors.password && (
                <div className="text-sm text-red-600 mt-1">
                  {errors.password}
                </div>
              )}
              {!isEditing && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="passwordConfirm">
                Confirm Password{" "}
                {isEditing ? (
                  "(Optional)"
                ) : (
                  <span className="text-red-500">*</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  placeholder={
                    isEditing
                      ? "Leave blank to keep current password"
                      : "Confirm password"
                  }
                  type={showConfirmPassword ? "text" : "password"}
                  value={user.passwordConfirm || ""}
                  onChange={handleChange}
                  error={!!errors.passwordConfirm}
                  disabled={loading}
                />
                <span
                  onClick={() =>
                    !loading && setShowConfirmPassword(!showConfirmPassword)
                  }
                  className={`absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2 ${
                    loading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {showConfirmPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                  )}
                </span>
              </div>
              {errors.passwordConfirm && (
                <div className="text-sm text-red-600 mt-1">
                  {errors.passwordConfirm}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="md:col-span-2 pt-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {isEditing ? "Updating..." : "Creating..."}
                    </span>
                  ) : isEditing ? (
                    "Update User"
                  ) : (
                    "Create User"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
