import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { watch, type FSWatcher } from 'chokidar';
import { fileURLToPath } from 'url';
import Store from 'electron-store';

// ES module __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings store
interface StoreSchema {
  mermaidFolder: string;
}

const store = new Store<StoreSchema>({
  defaults: {
    mermaidFolder: path.join(app.getPath('documents'), 'MermaidDiagrams'),
  },
});

let mainWindow: BrowserWindow | null = null;
let fileWatcher: FSWatcher | null = null;

// Get the current mermaid folder
function getMermaidFolder(): string {
  return store.get('mermaidFolder');
}

// Set the mermaid folder
function setMermaidFolder(folderPath: string): void {
  store.set('mermaidFolder', folderPath);
  // Restart file watcher with new folder
  setupFileWatcher();
  // Notify renderer of folder change
  mainWindow?.webContents.send('settings:folder-changed', folderPath);
}

// Ensure the folder exists
function ensureFolder(folderPath: string): void {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

// Create the main application window
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Modern Mermaid',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show until ready
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create application menu
function createMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    // App menu (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        {
          label: 'Settings...',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu:settings');
          },
        },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:new-file');
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu:save');
          },
        },
        { type: 'separator' },
        {
          label: 'Open Folder in Finder',
          click: () => {
            shell.openPath(getMermaidFolder());
          },
        },
        {
          label: 'Change Folder...',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openDirectory', 'createDirectory'],
              title: 'Choose Mermaid Files Folder',
              defaultPath: getMermaidFolder(),
            });

            if (!result.canceled && result.filePaths.length > 0) {
              setMermaidFolder(result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const },
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'Mermaid Documentation',
          click: async () => {
            await shell.openExternal('https://mermaid.js.org/');
          },
        },
        {
          label: 'Modern Mermaid Website',
          click: async () => {
            await shell.openExternal('https://modern-mermaid.live/');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Set up file watcher
function setupFileWatcher(): void {
  if (fileWatcher) {
    fileWatcher.close();
  }

  const folder = getMermaidFolder();
  ensureFolder(folder);

  fileWatcher = watch(folder, {
    ignored: /(^|[\/\\])\.\./, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
  });

  fileWatcher
    .on('add', (filePath) => {
      if (filePath.endsWith('.mermaid')) {
        mainWindow?.webContents.send('file:added', filePath);
      }
    })
    .on('unlink', (filePath) => {
      if (filePath.endsWith('.mermaid')) {
        mainWindow?.webContents.send('file:deleted', filePath);
      }
    })
    .on('change', (filePath) => {
      if (filePath.endsWith('.mermaid')) {
        mainWindow?.webContents.send('file:changed', filePath);
      }
    });
}

// IPC Handlers

// Get the mermaid folder path
ipcMain.handle('files:getFolder', () => {
  return getMermaidFolder();
});

// Get settings
ipcMain.handle('settings:get', () => {
  return {
    mermaidFolder: getMermaidFolder(),
  };
});

// Update settings
ipcMain.handle('settings:setFolder', async (_event, folderPath?: string) => {
  // If no folder path provided, show folder picker
  if (!folderPath) {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Choose Mermaid Files Folder',
      defaultPath: getMermaidFolder(),
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'Cancelled' };
    }

    folderPath = result.filePaths[0];
  }

  // Validate folder exists or can be created
  try {
    ensureFolder(folderPath);
    setMermaidFolder(folderPath);
    return { success: true, folder: folderPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// List all .mermaid files
ipcMain.handle('files:list', async () => {
  const folder = getMermaidFolder();
  ensureFolder(folder);

  try {
    const files = fs.readdirSync(folder);
    const mermaidFiles = files
      .filter((file) => file.endsWith('.mermaid'))
      .map((file) => {
        const filePath = path.join(folder, file);
        const stats = fs.statSync(filePath);
        return {
          name: file.replace('.mermaid', ''),
          path: filePath,
          modifiedAt: stats.mtime.toISOString(),
          size: stats.size,
        };
      })
      .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

    return { success: true, files: mermaidFiles };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Read a file
ipcMain.handle('files:read', async (_event, filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Write to a file
ipcMain.handle('files:write', async (_event, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Create a new file
ipcMain.handle('files:create', async (_event, fileName: string) => {
  const folder = getMermaidFolder();
  ensureFolder(folder);

  const safeName = fileName.replace(/[^a-zA-Z0-9_\-\s\u4e00-\u9fa5]/g, '').trim();
  if (!safeName) {
    return { success: false, error: 'Invalid file name' };
  }

  const filePath = path.join(folder, `${safeName}.mermaid`);

  if (fs.existsSync(filePath)) {
    return { success: false, error: 'File already exists' };
  }

  const defaultContent = `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> A`;

  try {
    fs.writeFileSync(filePath, defaultContent, 'utf-8');
    return { success: true, path: filePath, content: defaultContent };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Delete a file
ipcMain.handle('files:delete', async (_event, filePath: string) => {
  try {
    // Show confirmation dialog
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      cancelId: 0,
      title: 'Delete File',
      message: `Are you sure you want to delete this file?`,
      detail: path.basename(filePath),
    });

    if (result.response === 1) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'Cancelled' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// Rename a file
ipcMain.handle('files:rename', async (_event, oldPath: string, newName: string) => {
  const dir = path.dirname(oldPath);
  const safeName = newName.replace(/[^a-zA-Z0-9_\-\s\u4e00-\u9fa5]/g, '').trim();

  if (!safeName) {
    return { success: false, error: 'Invalid file name' };
  }

  const newPath = path.join(dir, `${safeName}.mermaid`);

  if (fs.existsSync(newPath) && oldPath !== newPath) {
    return { success: false, error: 'A file with this name already exists' };
  }

  try {
    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (error) {
    return { success: false, error: String(error) };
  }
});

// LLM Request Proxy to avoid CORS
ipcMain.handle('llm:request', async (_event, config: { url: string, method: string, headers: any, body: any }) => {
  try {
    const { url, method, headers, body } = config;
    // @ts-ignore - fetch is available in Node 18+ (Electron)
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(body)
    });

    // Read text first to handle both JSON and non-JSON error bodies
    const text = await response.text();

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${text.substring(0, 500)}` };
    }

    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (e) {
      return { success: false, error: 'Invalid JSON response from API' };
    }

  } catch (error) {
    console.error('LLM Request Error:', error);
    return { success: false, error: String(error) };
  }
});

// App lifecycle
app.whenReady().then(() => {
  const folder = getMermaidFolder();
  ensureFolder(folder);
  createMenu();
  createWindow();
  setupFileWatcher();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (fileWatcher) {
    fileWatcher.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
