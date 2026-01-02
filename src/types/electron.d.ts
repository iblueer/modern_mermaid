// Type definitions for Electron API exposed via preload script

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

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}

export { };
