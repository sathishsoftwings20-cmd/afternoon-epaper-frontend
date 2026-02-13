// src/components/auth/SignInForm.tsx
import { useState } from "react";
import { useNavigate } from "react-router";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../ui/form/Label";
import Input from "../ui/form/InputField";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Only destructure what you need - remove 'user' since it's not used
  const { login } = useAuth(); // Remove 'user' from here
  const { showToast } = useToast();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginValue.trim() || !password) {
      showToast({
        variant: "error",
        title: "Validation",
        message: "Username or email and password are required.",
      });
      return;
    }

    setBusy(true);
    try {
      await login(loginValue.trim(), password);

      showToast({
        variant: "success",
        title: "Signed in",
        message: "Welcome back!",
      });

      // Redirect to admin dashboard (role-based redirects can be handled elsewhere)
      navigate("/admin-dashboard");
    } catch (err: unknown) {
      console.error("Login error:", err);

      let msg = "Login failed. Please check credentials.";

      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === "string") {
        msg = err;
      }

      showToast({
        variant: "error",
        title: "Login failed",
        message: msg,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email or username and password to sign in!
            </p>
          </div>

          <form onSubmit={submit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Email or Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="email@example.com or username"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="sm"
                type="submit"
                disabled={busy}
              >
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
