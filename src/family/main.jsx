import React from "react";
import { createRoot } from "react-dom/client";
import FamilyHub from "./FamilyHub.jsx";
import { setupPWA } from "../pwa.js";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FamilyHub />
  </React.StrictMode>
);

setupPWA();
