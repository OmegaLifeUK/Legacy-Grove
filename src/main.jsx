import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LegacyGrove from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/Legacy-Grove">
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<LegacyGrove />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
