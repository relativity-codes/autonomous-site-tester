let electron = require("electron");
//#region preload/index.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	send: (channel, data) => {
		if ([
			"toMain",
			"run-test",
			"save-settings"
		].includes(channel)) electron.ipcRenderer.send(channel, data);
	},
	invoke: (channel, data) => {
		if (["get-settings", "run-test"].includes(channel)) return electron.ipcRenderer.invoke(channel, data);
	},
	receive: (channel, func) => {
		if ([
			"fromMain",
			"test-log",
			"test-status"
		].includes(channel)) electron.ipcRenderer.on(channel, (_event, ...args) => func(...args));
	}
});
//#endregion
