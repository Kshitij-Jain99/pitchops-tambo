import React from "react";
import ReactDOM from "react-dom/client";
import { TamboProvider } from "@tambo-ai/react";
import App from "./App";
import { components } from "./lib/tambo";
import "./app/globals.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TamboProvider
      apiKey={import.meta.env.VITE_TAMBO_API_KEY}
      components={components}
    >
      <App />
    </TamboProvider>
  </React.StrictMode>,
);
