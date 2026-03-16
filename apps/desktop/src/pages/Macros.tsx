/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Play,
  Plus,
  Trash2,
  Layout,
  MousePointer2,
  Type,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const Macros = () => {
  const [macros, setMacros] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [steps, setSteps] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const loadMacros = async () => {
    try {
      // Passing empty domain to get all for the management list
      const allMacros = await window.electronAPI.invoke("get-macros", {
        domain: "",
      });
      setMacros(Array.isArray(allMacros) ? allMacros : []);
    } catch (err) {
      console.error("Failed to load macros:", err);
      setMacros([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMacros();
  }, []);

  const addStep = () => {
    setSteps([...steps, { action: "click", selector: "", value: "" }]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: string, val: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: val };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!name || !domain || steps.length === 0) return;

    // Clean domain
    let cleanDomain = domain;
    try {
      if (domain.includes("://")) {
        cleanDomain = new URL(domain).hostname;
      }
    } catch {
      console.warn("Invalid domain URL provided for macro");
    }

    await window.electronAPI.invoke("save-macro", {
      name,
      domain: cleanDomain,
      steps,
    });
    setName("");
    setDomain("");
    setSteps([]);
    setShowAdd(false);
    loadMacros();
  };

  const handleDelete = async (id: string) => {
    await window.electronAPI.invoke("delete-macro", { id });
    loadMacros();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
        <Play className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        Flow Macros
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6 mb-8 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Standard User Flows
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Define multi-step sequences to execute before the autonomous audit
              starts.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-md hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Macro
          </button>
        </div>

        {showAdd && (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-6 rounded-lg mb-8">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                  Macro Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Login & Search"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                  Domain
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="example.com"
                  className="w-full border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Steps
              </label>
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex gap-2 items-start bg-white dark:bg-slate-800 p-3 rounded border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
                >
                  <div className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-xs font-bold text-slate-500 dark:text-slate-400">
                    {idx + 1}
                  </div>
                  <select
                    value={step.action}
                    onChange={(e) => updateStep(idx, "action", e.target.value)}
                    className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="click">Click</option>
                    <option value="type">Type</option>
                    <option value="navigate">Navigate</option>
                  </select>
                  <input
                    type="text"
                    value={step.selector}
                    onChange={(e) =>
                      updateStep(idx, "selector", e.target.value)
                    }
                    placeholder={
                      step.action === "navigate" ? "URL" : "CSS Selector"
                    }
                    className="flex-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {step.action === "type" && (
                    <input
                      type="text"
                      value={step.value}
                      onChange={(e) => updateStep(idx, "value", e.target.value)}
                      placeholder="Value"
                      className="w-32 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                  <button
                    onClick={() => removeStep(idx)}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addStep}
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Step
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="bg-emerald-600 text-white px-6 py-2 rounded shadow hover:bg-emerald-700 text-sm font-medium"
              >
                Save Macro
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {macros.length > 0 ? (
            macros.map((macro) => (
              <div
                key={macro.id}
                className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden transform transition-all hover:shadow-md"
              >
                <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-1.5 rounded">
                      <Layout className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {macro.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {macro.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800">
                      <Sparkles className="w-3 h-3" /> AI Discovery Fallback
                      Enabled
                    </div>
                    <button
                      onClick={() => handleDelete(macro.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800/50 flex flex-wrap gap-2">
                  {macro.steps?.map((step: any, sIdx: number) => (
                    <div
                      key={sIdx}
                      className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700"
                    >
                      {step.action === "click" && (
                        <MousePointer2 className="w-3 h-3 text-blue-600" />
                      )}
                      {step.action === "type" && (
                        <Type className="w-3 h-3 text-orange-600" />
                      )}
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {step.action}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
                        {step.selector || step.value}
                      </span>
                      {sIdx < macro.steps.length - 1 && (
                        <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Play className="w-12 h-12 mx-auto mb-4 opacity-20 dark:opacity-10" />
              <p>
                No macros defined. The AI will attempt to discover flows
                automatically, or you can define them here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
