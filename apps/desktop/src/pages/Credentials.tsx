/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Key, Globe, User, Trash2, Plus, ShieldCheck } from "lucide-react";

export const Credentials = () => {
  const [credentials, setCredentials] = useState<any[]>([]);
  const [domain, setDomain] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const loadCredentials = async () => {
    try {
      const creds = await window.electronAPI.invoke("get-credentials");
      setCredentials(Array.isArray(creds) ? creds : []);
    } catch (err) {
      console.error("Failed to load credentials:", err);
      setCredentials([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCredentials();
  }, []);

  const handleSave = async () => {
    if (!domain || !username || !password) return;
    await window.electronAPI.invoke("save-credential", {
      domain,
      username,
      password,
    });
    setDomain("");
    setUsername("");
    setPassword("");
    setShowAdd(false);
    loadCredentials();
  };

  const handleDelete = async (id: string) => {
    await window.electronAPI.invoke("delete-credential", { id });
    loadCredentials();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
        <Key className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        Credential Management
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6 mb-8 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Encrypted Storage
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Store site-specific logins for automated authenticated testing.
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>

        {showAdd && (
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Domain (e.g. example.com)
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="domain.com"
                className="w-full border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                Username / Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="user@example.com"
                className="w-full border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="w-full border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded shadow hover:bg-emerald-700 text-sm font-medium"
              >
                Save
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
          {credentials.length > 0 ? (
            credentials.map((cred) => (
              <div
                key={cred.id}
                className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-full">
                    <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {cred.domain}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <User className="w-3 h-3" />
                      {cred.username}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                    <ShieldCheck className="w-3 h-3" />
                    AES-256 Encrypted
                  </div>
                  <button
                    onClick={() => handleDelete(cred.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-20 dark:opacity-10" />
              <p>
                No credentials stored. Add one to start testing authenticated
                flows.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
