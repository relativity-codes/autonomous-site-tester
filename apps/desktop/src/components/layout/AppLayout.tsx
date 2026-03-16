import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  User,
  MessageSquare,
  Key,
  Play,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex h-screen ${theme === "dark" ? "dark" : ""}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="h-16 flex items-center px-6 text-white font-bold text-lg border-b border-slate-700">
          AI Site Tester
        </div>
        <nav className="flex-1 py-4 space-y-1">
          <Link
            to="/"
            className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/chat"
            className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <MessageSquare className="mr-3 h-5 w-5" />
            Agent Chat
          </Link>
          <Link
            to="/prompts"
            className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <User className="mr-3 h-5 w-5" />
            Prompts
          </Link>
          <Link
            to="/credentials"
            className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Key className="mr-3 h-5 w-5" />
            Credentials
          </Link>
          <Link
            to="/macros"
            className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Play className="mr-3 h-5 w-5" />
            Flow Macros
          </Link>
          <Link
            to="/settings"
            className="flex items-center px-6 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors rounded-md border border-slate-700"
          >
            {theme === "light" ? (
              <>
                <Moon className="mr-3 h-4 w-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="mr-3 h-4 w-4" />
                <span>Light Mode</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-slate-900 transition-colors">
        <div className="flex-1 overflow-y-auto p-8 text-slate-900 dark:text-slate-100">
          {children}
        </div>
      </main>
    </div>
  );
};
