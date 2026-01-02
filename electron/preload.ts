import { contextBridge, ipcRenderer } from 'electron';

// Types for file operations
export interface MermaidFile {
    name: string;
    path: string;
    modifiedAt: string;
    size: number;
}

export interface FileOperationResult {
    success: boolean;
    error?: string;
}

export interface FileListResult extends FileOperationResult {
    files?: MermaidFile[];
}

export interface FileReadResult extends FileOperationResult {
    content?: string;
}

export interface FileCreateResult extends FileOperationResult {
    path?: string;
    content?: string;
}

export interface FileRenameResult extends FileOperationResult {
    newPath?: string;
}

export interface Settings {
    mermaidFolder: string;
}

export interface SettingsResult extends FileOperationResult {
    folder?: string;
}

// Electron API exposed to renderer
export interface ElectronAPI {
    files: {
        getFolder: () => Promise<string>;
        list: () => Promise<FileListResult>;
        read: (filePath: string) => Promise<FileReadResult>;
        write: (filePath: string, content: string) => Promise<FileOperationResult>;
        create: (fileName: string) => Promise<FileCreateResult>;
        delete: (filePath: string) => Promise<FileOperationResult>;
        rename: (oldPath: string, newName: string) => Promise<FileRenameResult>;
    };
    settings: {
        get: () => Promise<Settings>;
        setFolder: (folderPath?: string) => Promise<SettingsResult>;
    };
    on: (channel: string, callback: (...args: any[]) => void) => () => void;
}

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    files: {
        getFolder: () => ipcRenderer.invoke('files:getFolder'),
        list: () => ipcRenderer.invoke('files:list'),
        read: (filePath: string) => ipcRenderer.invoke('files:read', filePath),
        write: (filePath: string, content: string) => ipcRenderer.invoke('files:write', filePath, content),
        create: (fileName: string) => ipcRenderer.invoke('files:create', fileName),
        delete: (filePath: string) => ipcRenderer.invoke('files:delete', filePath),
        rename: (oldPath: string, newName: string) => ipcRenderer.invoke('files:rename', oldPath, newName),
    },
    settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        setFolder: (folderPath?: string) => ipcRenderer.invoke('settings:setFolder', folderPath),
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
        const validChannels = [
            'file:added',
            'file:deleted',
            'file:changed',
            'menu:new-file',
            'menu:save',
            'menu:settings',
            'settings:folder-changed',
        ];

        if (validChannels.includes(channel)) {
            const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args);
            ipcRenderer.on(channel, subscription);

            // Return cleanup function
            return () => {
                ipcRenderer.removeListener(channel, subscription);
            };
        }

        return () => { };
    },
} as ElectronAPI);
