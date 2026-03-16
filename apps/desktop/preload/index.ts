import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data: unknown) => {
    const validChannels = ['toMain', 'run-test', 'save-settings'];
    if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
    }
  },
  invoke: (channel: string, data: unknown) => {
    const validChannels = ['get-settings', 'run-test'];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
  },
  receive: (channel: string, func: (...args: unknown[]) => void) => {
    const validChannels = ['fromMain', 'test-log', 'test-status'];
    if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  }
});
