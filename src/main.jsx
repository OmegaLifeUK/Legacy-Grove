import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LegacyGrove from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LegacyGrove />
  </StrictMode>
);
