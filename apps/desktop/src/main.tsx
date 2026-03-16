import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { PromptEditor } from "./pages/PromptEditor";
import { AgentChat } from "./pages/AgentChat";
import { Credentials } from "./pages/Credentials";
import { Macros } from "./pages/Macros";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<AgentChat />} />
            <Route path="/prompts" element={<PromptEditor />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/macros" element={<Macros />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
