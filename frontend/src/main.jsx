import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./theme.css";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Student from "./pages/Student.jsx";
import RequestView from "./pages/RequestView.jsx";
import Staff from "./pages/Staff.jsx";
import Admin from "./pages/Admin.jsx";
import Certificate from "./pages/Certificate.jsx";
import Verify from "./pages/Verify.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student" element={<Student />} />
        <Route path="/student/request/:type" element={<RequestView />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/certificate/:id" element={<Certificate />} />
        <Route path="/verify/:code" element={<Verify />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
