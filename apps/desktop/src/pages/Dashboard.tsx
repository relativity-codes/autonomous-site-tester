/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Camera,
  Activity,
  AlertTriangle,
  CheckCircle,
  Square,
  Pause,
  PlayCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Layout,
  Zap,
  Trash2,
} from "lucide-react";

interface ElectronAPI {
  invoke: (channel: string, data?: any) => Promise<any>;
  send: (channel: string, data?: any) => void;
  receive: (channel: string, func: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export const Dashboard = () => {
  const [url, setUrl] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [issueCount, setIssueCount] = useState(0);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [reportPath, setReportPath] = useState<string | null>(null);
  const [isSinglePage, setIsSinglePage] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [expandedWaterfall, setExpandedWaterfall] = useState<number | null>(
    null,
  );
  const [isApiMode, setIsApiMode] = useState(false);

  useEffect(() => {
    // Listen for logs
    const handleLog = (msg: string) => setLogs((prev) => [...prev, msg]);
    // Listen for results
    const handleResult = (res: any) => {
      if (res.issues && res.issues.length > 0) {
        setIssueCount((prev) => prev + res.issues.length);
      }
      if (res.metrics) {
        setPerformanceData((prev) => [
          ...prev,
          { url: res.url, ...res.metrics },
        ]);
      }
    };
    // Listen for screenshots
    const handleScreenshot = (path: string) =>
      setScreenshots((prev) => [...prev, path]);

    // Listen for report
    const handleReport = (path: string) => setReportPath(path);

    (window as any).electronAPI.receive("test-log", handleLog);
    (window as any).electronAPI.receive("test-result", handleResult);
    (window as any).electronAPI.receive(
      "screenshot-captured",
      handleScreenshot,
    );
    (window as any).electronAPI.receive("report-generated", handleReport);
  }, []);

  const handleRunTest = async () => {
    if (!url) return;
    setIsRunning(true);
    setLogs([`Initiating test for ${url}...`]);
    setScreenshots([]);
    setIssueCount(0);
    setPerformanceData([]);
    setReportPath(null);
    setIsPaused(false);

    const isApi =
      url.endsWith(".json") ||
      url.endsWith(".yaml") ||
      url.includes("/swagger") ||
      url.includes("/openapi");
    setIsApiMode(isApi);

    try {
      await window.electronAPI.invoke("run-test", { url, isSinglePage });
    } catch (err) {
      setLogs((prev) => [...prev, `Error: ${err}`]);
    } finally {
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const handlePause = async () => {
    await window.electronAPI.invoke("pause-test");
    setIsPaused(true);
  };

  const handleResume = async () => {
    await window.electronAPI.invoke("resume-test");
    setIsPaused(false);
  };

  const handleStop = async () => {
    await window.electronAPI.invoke("stop-test");
    setIsRunning(false);
    setIsPaused(false);
  };

  const handleClearData = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear all historical data? This will remove runs, logs, macros, and screenshots, but preserve your credentials and settings.",
      )
    ) {
      return;
    }

    try {
      await window.electronAPI.invoke("clear-all-data");
      setLogs(["Historical data cleared successfully."]);
      setPerformanceData([]);
      setIssueCount(0);
      setScreenshots([]);
      setReportPath(null);
    } catch (err) {
      alert(`Failed to clear data: ${err}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Test Dashboard
          </h1>
          {isApiMode && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase rounded tracking-wider border border-blue-200 dark:border-blue-800">
              API Audit Mode
            </span>
          )}
        </div>
        {!isRunning && (
          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all"
            title="Clear all results and history"
          >
            <Trash2 size={16} />
            Reset Data
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Layout className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Pages Audited
            </h3>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {performanceData.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Issues Found
            </h3>
          </div>
          <p
            className={`text-3xl font-bold ${issueCount > 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"}`}
          >
            {issueCount}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Status
            </h3>
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            {isRunning ? "Testing..." : "Idle"}
          </p>
        </div>
      </div>

      {reportPath && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-lg mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-emerald-900 dark:text-emerald-300 font-medium">
                Audit report is ready!
              </p>
              <p className="text-emerald-700 dark:text-emerald-400/80 text-sm truncate max-w-md">
                {reportPath}
              </p>
            </div>
          </div>
          <button
            className="bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-2 rounded shadow hover:bg-emerald-700 dark:hover:bg-emerald-600 text-sm font-medium transition-colors"
            onClick={() =>
              window.electronAPI.invoke("show-item-in-folder", reportPath)
            }
          >
            Show in Folder
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Performance Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            Performance Insights
          </h2>
          {performanceData.length > 0 ? (
            <div className="space-y-6">
              {performanceData.map((data, i) => (
                <div
                  key={i}
                  className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="truncate max-w-[250px] text-sm font-medium text-slate-700 dark:text-slate-300">
                      {data.url}
                    </span>
                    <button
                      onClick={() =>
                        setExpandedWaterfall(expandedWaterfall === i ? null : i)
                      }
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      {expandedWaterfall === i ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      Waterfall
                    </button>
                  </div>

                  {/* Metric Cards */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <Zap
                          size={14}
                          className="text-amber-500 dark:text-amber-400"
                        />
                        <span className="text-[10px] font-bold uppercase">
                          LCP
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold ${data.lcp > 2500 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {data.lcp}ms
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <Layout
                          size={14}
                          className="text-blue-500 dark:text-blue-400"
                        />
                        <span className="text-[10px] font-bold uppercase">
                          CLS
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold ${data.cls > 0.1 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {data.cls}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                        <Clock
                          size={14}
                          className="text-purple-500 dark:text-purple-400"
                        />
                        <span className="text-[10px] font-bold uppercase">
                          Load
                        </span>
                      </div>
                      <div
                        className={`text-sm font-bold ${data.loadTime > 3000 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        {data.loadTime}ms
                      </div>
                    </div>
                  </div>

                  {/* Waterfall Detail */}
                  {expandedWaterfall === i && data.waterfall && (
                    <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded p-3 text-[10px] font-mono overflow-x-auto border dark:border-slate-700">
                      <div className="flex border-b border-slate-200 dark:border-slate-700 pb-1 mb-1 font-bold text-slate-500 dark:text-slate-400">
                        <div className="w-1/2">Resource</div>
                        <div className="w-1/4">Type</div>
                        <div className="w-1/4 text-right">Time</div>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {data.waterfall
                          .slice(0, 15)
                          .map((w: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex text-slate-600 dark:text-slate-400"
                            >
                              <div
                                className="w-1/2 truncate pr-2 text-slate-700 dark:text-slate-300"
                                title={w.url}
                              >
                                {w.url.split("/").pop() || w.url}
                              </div>
                              <div className="w-1/4 uppercase">{w.type}</div>
                              <div className="w-1/4 text-right">
                                {Math.round(w.duration)}ms
                              </div>
                            </div>
                          ))}
                        {data.waterfall.length > 15 && (
                          <div className="text-center text-slate-400 dark:text-slate-500 pt-1 italic">
                            + {data.waterfall.length - 15} more resources
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm italic">
              No performance data yet.
            </div>
          )}
        </div>

        {/* Screenshot Gallery */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <Camera className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            Visual Evidence
          </h2>
          {screenshots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {screenshots.map((s, i) => (
                <div
                  key={i}
                  className="aspect-square bg-slate-100 rounded border border-slate-200 overflow-hidden relative group"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 p-1 text-center">
                    {s.split("/").pop()}
                  </div>
                  {/* Note: Showing the actual image might require a custom protocol or static file server in Electron */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm italic">
              Screenshots will appear here.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">
          Start New Test
        </h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to test..."
              className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 w-full text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-700 focus:border-transparent outline-none transition-all"
              disabled={isRunning}
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isSinglePage}
                onChange={(e) => setIsSinglePage(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-700 bg-white dark:bg-slate-900 focus:ring-slate-500 dark:focus:ring-slate-400"
              />
              Single Page Only
            </label>
            <button
              onClick={handleRunTest}
              disabled={isRunning || !url}
              className={`bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center gap-2 ${isRunning || !url ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isRunning ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Running Audit...
                </>
              ) : (
                "Run Strategic Audit"
              )}
            </button>

            {isRunning && (
              <div className="flex gap-2">
                <button
                  onClick={isPaused ? handleResume : handlePause}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? (
                    <PlayCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Pause className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="text-sm font-medium">
                    {isPaused ? "Resume" : "Pause"}
                  </span>
                </button>
                <button
                  onClick={handleStop}
                  className="p-3 rounded-lg border border-red-100 dark:border-red-900/30 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm flex items-center gap-2 text-red-600 dark:text-red-400"
                  title="Stop Audit"
                >
                  <Square className="w-5 h-5" />
                  <span className="text-sm font-medium">Stop</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="bg-slate-900 dark:bg-black rounded-lg shadow-xl p-6 font-mono text-sm text-emerald-400 dark:text-emerald-300 overflow-hidden border dark:border-slate-800">
          <h3 className="text-slate-400 dark:text-slate-500 mb-2 uppercase text-xs font-bold">
            Execution Logs
          </h3>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
