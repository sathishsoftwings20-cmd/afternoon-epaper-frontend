// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import AfternoonLandingPage from "./pages/Public/LandingPage";
import SignIn from "./pages/AuthPages/SignIn";
import Home from "./pages/Dashboard/Home";
import NotFound from "./pages/NotFound";
import UserListPage from "./pages/Dashboard/Users/UserListPage"; // Create this file
import UserRegisterPage from "./pages/Dashboard/Users/UserRegisterPage"; // Create this file

import EpaperListPage from "./pages/Dashboard/Epaper/EpaperListPage";
import EpaperCreatePage from "./pages/Dashboard/Epaper/EpaperCreatePage";
import EpaperViewPage from "./pages/Dashboard/Epaper/EpaperViewPage";

import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 🌐 Public Routes */}
        <Route path="/" element={<AfternoonLandingPage />} />
        <Route path="/signin" element={<SignIn />} />

        {/* 🔐 Protected Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute roles={["SuperAdmin", "Admin", "Staff"]}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          {/* User Management Routes */}
          <Route path="users" element={<UserListPage />} />
          <Route path="users/create" element={<UserRegisterPage />} />
          <Route path="users/edit/:id" element={<UserRegisterPage />} />

          {/* ePaper Management */}
          <Route path="epapers" element={<EpaperListPage />} />
          <Route path="epapers/create" element={<EpaperCreatePage />} />
          <Route path="epapers/edit/:id" element={<EpaperCreatePage />} />
          <Route path="epapers/view/:id" element={<EpaperViewPage />} />
        </Route>

        {/* ❌ Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
