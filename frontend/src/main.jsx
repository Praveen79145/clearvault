import React from "react";
import ReactDOM from "react-dom/client";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./theme.css";
import { AnimatedPage } from "./animations.jsx";
import Landing from "./pages/Landing.jsx";
import { LoginForm } from "./pages/Login.jsx";
import { RegisterForm } from "./pages/Register.jsx";
import { ForgotPasswordForm } from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Student from "./pages/Student.jsx";
import RequestView from "./pages/RequestView.jsx";
import Staff from "./pages/Staff.jsx";
import Admin from "./pages/Admin.jsx";
import Certificate from "./pages/Certificate.jsx";
import Verify from "./pages/Verify.jsx";
import AuthLayout from "./components/AuthLayout.jsx";

function AuthPageRouter() {
  const location = useLocation();

  let content;
  if (location.pathname === "/register") content = <RegisterForm />;
  else if (location.pathname === "/forgot-password") content = <ForgotPasswordForm />;
  else content = <LoginForm />;

  return <AuthLayout>{content}</AuthLayout>;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
        <Route path="/login" element={<AuthPageRouter />} />
        <Route path="/register" element={<AuthPageRouter />} />
        <Route path="/forgot-password" element={<AuthPageRouter />} />
        <Route path="/reset-password" element={<AnimatedPage><ResetPassword /></AnimatedPage>} />
        <Route path="/student" element={<AnimatedPage><Student /></AnimatedPage>} />
        <Route path="/student/request/:type" element={<AnimatedPage><RequestView /></AnimatedPage>} />
        <Route path="/staff" element={<AnimatedPage><Staff /></AnimatedPage>} />
        <Route path="/admin" element={<AnimatedPage><Admin /></AnimatedPage>} />
        <Route path="/certificate/:id" element={<AnimatedPage><Certificate /></AnimatedPage>} />
        <Route path="/verify/:code" element={<AnimatedPage><Verify /></AnimatedPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
);
