import { createRoot } from "react-dom/client";
import { initStore } from "./lib/store";
import App from "./App.tsx";
import "./index.css";

initStore();

createRoot(document.getElementById("root")!).render(<App />);
