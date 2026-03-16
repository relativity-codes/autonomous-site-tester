import { useState, useEffect } from "react";

export const PromptEditor = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPrompt = async () => {
      try {
        const prompt = await (window as any).electronAPI.invoke(
          "get-active-prompt",
        );
        if (prompt && prompt.content) {
          setContent(prompt.content);
        }
      } catch (error) {
        console.error("Failed to load prompt:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadPrompt();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await (window as any).electronAPI.invoke("save-prompt", { content });
      alert("Prompt saved successfully!");
    } catch (error) {
      console.error("Failed to save prompt:", error);
      alert("Error saving prompt.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-slate-500">Loading prompt settings...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          System Prompt Editor
        </h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSaving ? "Saving..." : "Save Prompt"}
        </button>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 flex flex-col p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Base System Prompt (Locked)
          </h3>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 rounded text-sm italic border border-slate-200 dark:border-slate-700 font-mono whitespace-pre-wrap">
            You are an autonomous website QA testing agent.
            {"\n"}
            You test websites visually and functionally.
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            User Instructions Layer
          </h3>
          <textarea
            className="flex-1 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-4 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
            placeholder="Enter custom agent instructions here... (e.g. Focus heavily on accessibility and usability.)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
