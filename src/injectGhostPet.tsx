// src/content/injectGhostPet.tsx
import ReactDOM from "react-dom/client";
import GhostPet from "./GhostPet";

const ghostId = "ghost-pet-root";
if (!document.getElementById(ghostId)) {
  const container = document.createElement("div");
  container.id = ghostId;
  document.body.appendChild(container);
  const root = ReactDOM.createRoot(container);
  root.render(<GhostPet />);
}
