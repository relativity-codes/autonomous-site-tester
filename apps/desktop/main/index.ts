/* eslint-disable @typescript-eslint/no-explicit-any */
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { Orchestrator } from '../../../agent-runtime/orchestrator/src/index';
import { DBManager } from '../../../data-layer/database/src/index';
import { ArtifactManager } from '../../../artifact-storage/src/index';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
const orchestrator = new Orchestrator();
let dbManager: DBManager;
let artifactManager: ArtifactManager;

async function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'database.sqlite');
  dbManager = new DBManager(dbPath);
  await dbManager.initialize();

  const artifactsPath = path.join(app.getPath('userData'), 'artifacts');
  artifactManager = new ArtifactManager(artifactsPath);
}

ipcMain.handle('run-test', async (_event:any, { url, isSinglePage }:any) => {
  if (!orchestrator || !dbManager) return { error: 'System not fully initialized' };

  try {
    const stored = await dbManager.getAIConfig();
    const promptData = await dbManager.getActiveUserPrompt();
    const userPrompt = promptData ? promptData.content : '';

    const aiConfig = stored ? {
      provider: stored.provider,
      modelName: stored.model_name,
      apiKey: stored.api_key,
      baseUrl: stored.base_url,
      temperature: stored.temperature,
      maxTokens: stored.max_tokens
    } : undefined;

    const credentials = await dbManager.getCredentials();
    
    // Extract domain for macros
    let domain = '';
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = urlObj.hostname;
    } catch {
      domain = url;
    }
    const macros = await dbManager.getMacrosByDomain(domain);

    await orchestrator.startTask(url, {
      aiConfig: aiConfig,
      userPrompt,
      browserOptions: {
        headed: stored?.headless === 0, // Invert: stored as headless=0 means headed
        slowMo: stored?.slow_mo || 0
      },
      credentials,
      macros,
      isSinglePage,
      onLog: (msg: string) => {
        if (win) win.webContents.send('test-log', msg);
      },
      onResult: (result: any) => {
        if (win) win.webContents.send('test-result', result);
      },
      onScreenshot: (path: string) => {
        if (win) win.webContents.send('screenshot-captured', path);
      },
      onReport: (path: string) => {
        if (win) win.webContents.send('report-generated', path);
      }
    });
    return { success: true };
  } catch (err) {
    console.error('Test execution failed:', err);
    throw err;
  }
});

ipcMain.handle('get-settings', async () => {
  if (!dbManager) return {};
  const config = await dbManager.getAIConfig();
  return config ? {
    provider: config.provider,
    modelName: config.model_name,
    apiKey: config.api_key,
    baseUrl: config.base_url,
    temperature: config.temperature,
    maxTokens: config.max_tokens,
    headless: config.headless === 1,
    slowMo: config.slow_mo
  } : {
    provider: 'OpenAI',
    modelName: 'gpt-4o',
    apiKey: '',
    temperature: 0.2,
    maxTokens: 4096,
    headless: true,
    slowMo: 0
  };
});

ipcMain.handle('save-settings', async (_event:any, config:any) => {
  if (!dbManager) return { error: 'Database not initialized' };
  await dbManager.saveAIConfig(config);
  return { success: true };
});

ipcMain.handle('send-chat', async (_event:any, { message }:any) => {
  if (!orchestrator) return { error: 'Orchestrator not initialized' };
  console.log(`[Main] User chat: ${message}`);
  // Forward to orchestrator
  const response = await orchestrator.handleUserMessage(message);
  return { success: true, response };
});

ipcMain.handle('get-active-prompt', async () => {
  if (!dbManager) return { content: '' };
  const prompt = await dbManager.getActiveUserPrompt();
  return prompt || { content: '' };
});

ipcMain.handle('save-prompt', async (_event:any, { content }:any) => {
  if (!dbManager) return { error: 'Database not initialized' };
  await dbManager.saveUserPrompt('Primary Prompt', content);
  return { success: true };
});

ipcMain.handle('get-credentials', async () => {
  if (!dbManager) return [];
  return await dbManager.getCredentials();
});

ipcMain.handle('save-credential', async (_event:any, { domain, username, password }:any) => {
  if (!dbManager) return { error: 'Database not initialized' };
  await dbManager.saveCredential(domain, username, password);
  return { success: true };
});

ipcMain.handle('delete-credential', async (_event:any, { id }:any) => {
  if (!dbManager) return { error: 'Database not initialized' };
  await dbManager.deleteCredential(id);
  return { success: true };
});

ipcMain.handle('pause-test', async () => {
  await orchestrator.pauseTask();
  return { success: true };
});

ipcMain.handle('resume-test', async () => {
  await orchestrator.resumeTask();
  return { success: true };
});

ipcMain.handle('stop-test', async () => {
  await orchestrator.stopTask();
  return { success: true };
});

ipcMain.handle('get-macros', async (_event:any, { domain }:any) => {
  if (!dbManager) return [];
  return await dbManager.getMacrosByDomain(domain);
});

ipcMain.handle('save-macro', async (_event:any, { name, domain, steps }:any) => {
  if (!dbManager) return { error: 'Database not initialized' };
  await dbManager.saveMacro(name, domain, steps);
  return { success: true };
});

ipcMain.handle('delete-macro', async (_event:any, { id }:any) => {
  if (!dbManager) return { error: 'Database not initialized' };
  await dbManager.deleteMacro(id);
  return { success: true };
});

ipcMain.handle('clear-all-data', async () => {
  if (!dbManager || !artifactManager) return { error: 'Not initialized' };
  try {
    await dbManager.clearHistoricalData();
    await artifactManager.clearAllArtifacts();
    return { success: true };
  } catch (err) {
    console.error('Clear data failed:', err);
    throw err;
  }
});

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
    },
    width: 1200,
    height: 800,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST as string, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(async () => {
  await initDB();
  createWindow();

  ipcMain.handle('show-item-in-folder', (_event:any, path:string) => {
  shell.showItemInFolder(path);
  return { success: true };
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
