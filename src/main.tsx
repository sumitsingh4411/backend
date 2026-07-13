import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { PreferencesProvider } from "./providers/PreferencesProvider";
import { ProgressProvider } from "./providers/ProgressProvider";
import { RoadmapProvider } from "./providers/RoadmapProvider";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PreferencesProvider>
        <ProgressProvider>
          <RoadmapProvider>
            <App />
          </RoadmapProvider>
        </ProgressProvider>
      </PreferencesProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
