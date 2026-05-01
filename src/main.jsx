import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LegacyGrove from "./App.jsx";
import AdminApp from "./admin/AdminApp.jsx";
import Privacy from "./Privacy.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/*" element={<LegacyGrove />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
