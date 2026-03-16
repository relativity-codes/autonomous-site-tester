import { useState, useEffect } from "react";

export const Settings = () => {
  const [provider, setProvider] = useState("OpenAI");
  const [modelName, setModelName] = useState("gpt-4o");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [headless, setHeadless] = useState(true);
  const [slowMo, setSlowMo] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const config = await window.electronAPI.invoke("get-settings");
        if (config) {
          setProvider(config.provider || "OpenAI");
          setModelName(config.modelName || "gpt-4o");
          setApiKey(config.apiKey || "");
          setBaseUrl(config.baseUrl || "");
          setTemperature(config.temperature ?? 0.2);
          setMaxTokens(config.maxTokens ?? 4096);
          setHeadless(config.headless ?? true);
          setSlowMo(config.slowMo ?? 0);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      await window.electronAPI.invoke("save-settings", {
        provider,
        modelName,
        apiKey,
        baseUrl,
        temperature,
        maxTokens,
        headless,
        slowMo,
      });
      setMessage("Settings saved successfully!");
    } catch (err) {
      setMessage(`Error: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">
        Settings & Configuration
      </h1>

      <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-lg shadow border border-slate-200 dark:border-slate-700">
        <section>
          <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
            AI Model
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="OpenAI">OpenAI</option>
                <option value="Custom">Custom / Local</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            {provider === "Custom" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Temperature
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">
            Visual Debugging
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="headless"
                checked={!headless}
                onChange={(e) => setHeadless(!e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-400 focus:ring-slate-900 dark:bg-slate-900"
              />
              <label
                htmlFor="headless"
                className="ml-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Run in Headed Mode (Show Browser)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Slow Motion (ms)
              </label>
              <input
                type="number"
                value={slowMo}
                onChange={(e) => setSlowMo(parseInt(e.target.value))}
                min="0"
                step="100"
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white"
                placeholder="e.g. 500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Adds a delay before each browser action to make it easier to
                follow.
              </p>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`text-sm ${message.includes("Error") ? "text-red-600" : "text-emerald-600"}`}
          >
            {message}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-slate-900 dark:bg-slate-700 text-white px-6 py-2 rounded-md hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};
