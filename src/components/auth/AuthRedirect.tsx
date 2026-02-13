// src/components/auth/AuthRedirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AuthRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "Staff":
          navigate("/admin-dashboard");
          break;
        case "Admin":
          navigate("/admin-dashboard");
          break;
        case "SuperAdmin":
          navigate("/admin-dashboard");
          break;
        default:
          navigate("/");
      }
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
}
