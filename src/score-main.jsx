import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ScorePage from "./ScorePage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ScorePage />
  </StrictMode>
);
