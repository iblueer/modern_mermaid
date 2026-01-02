import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { MermaidFile } from '../types/electron';

interface FileContextType {
    // File list
    files: MermaidFile[];
    isLoading: boolean;
    error: string | null;

    // Current file
    currentFile: MermaidFile | null;
    currentContent: string;
    hasUnsavedChanges: boolean;

    // Folder
    folderPath: string;

    // Actions
    refreshFiles: () => Promise<void>;
    selectFile: (file: MermaidFile) => Promise<void>;
    createFile: (name: string, content: string) => Promise<boolean>;
    saveCurrentFile: () => Promise<boolean>;
    deleteFile: (file: MermaidFile) => Promise<boolean>;
    renameFile: (file: MermaidFile, newName: string) => Promise<boolean>;
    updateContent: (content: string) => void;
    newUnsavedFile: () => void;

    // Electron availability
    isElectron: boolean;
}

const FileContext = createContext<FileContextType | null>(null);

export const useFiles = () => {
    const context = useContext(FileContext);
    if (!context) {
        throw new Error('useFiles must be used within a FileProvider');
    }
    return context;
};

// Check if running in Electron
const isElectron = (): boolean => {
    return typeof window !== 'undefined' && !!window.electronAPI;
};

export const FileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [files, setFiles] = useState<MermaidFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<MermaidFile | null>(null);
    const [currentContent, setCurrentContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [folderPath, setFolderPath] = useState('');

    const hasUnsavedChanges = currentContent !== originalContent;
    const runningInElectron = isElectron();

    // Track if we've initialized to prevent double loading
    const initialized = useRef(false);

    // Load folder path
    useEffect(() => {
        if (runningInElectron && !initialized.current) {
            window.electronAPI!.files.getFolder().then(setFolderPath);
        }
    }, [runningInElectron]);

    // Refresh file list
    const refreshFiles = useCallback(async () => {
        if (!runningInElectron) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await window.electronAPI!.files.list();
            if (result.success && result.files) {
                setFiles(result.files);
            } else {
                setError(result.error || 'Failed to load files');
            }
        } catch (err) {
            setError(String(err));
        } finally {
            setIsLoading(false);
        }
    }, [runningInElectron]);

    // Initial load
    useEffect(() => {
        if (runningInElectron && !initialized.current) {
            initialized.current = true;
            refreshFiles();
        }
    }, [runningInElectron, refreshFiles]);

    // Listen for file system changes
    useEffect(() => {
        if (!runningInElectron) return;

        const cleanupAdded = window.electronAPI!.on('file:added', () => {
            refreshFiles();
        });

        const cleanupDeleted = window.electronAPI!.on('file:deleted', (deletedPath: string) => {
            refreshFiles();
            // If the deleted file was the current file, clear selection
            if (currentFile?.path === deletedPath) {
                setCurrentFile(null);
                setCurrentContent('');
                setOriginalContent('');
            }
        });

        const cleanupChanged = window.electronAPI!.on('file:changed', async (changedPath: string) => {
            // If the changed file is the current file and we don't have unsaved changes, reload it
            if (currentFile?.path === changedPath && !hasUnsavedChanges) {
                const result = await window.electronAPI!.files.read(changedPath);
                if (result.success && result.content !== undefined) {
                    setCurrentContent(result.content);
                    setOriginalContent(result.content);
                }
            }
            refreshFiles();
        });

        // Listen for menu commands
        const cleanupNewFile = window.electronAPI!.on('menu:new-file', () => {
            newUnsavedFile();
        });

        const cleanupSave = window.electronAPI!.on('menu:save', () => {
            if (hasUnsavedChanges) {
                saveCurrentFile();
            }
        });

        // Listen for folder changes from settings
        const cleanupFolderChanged = window.electronAPI!.on('settings:folder-changed', (newFolder: string) => {
            setFolderPath(newFolder);
            setCurrentFile(null);
            setCurrentContent('');
            setOriginalContent('');
            refreshFiles();
        });

        return () => {
            cleanupAdded();
            cleanupDeleted();
            cleanupChanged();
            cleanupNewFile();
            cleanupSave();
            cleanupFolderChanged();
        };
    }, [runningInElectron, currentFile, hasUnsavedChanges, refreshFiles]);

    // Select a file
    const selectFile = useCallback(async (file: MermaidFile) => {
        if (!runningInElectron) return;

        // Warn about unsaved changes
        if (hasUnsavedChanges) {
            const confirmed = window.confirm('You have unsaved changes. Discard them?');
            if (!confirmed) return;
        }

        try {
            const result = await window.electronAPI!.files.read(file.path);
            if (result.success && result.content !== undefined) {
                setCurrentFile(file);
                setCurrentContent(result.content);
                setOriginalContent(result.content);
            } else {
                setError(result.error || 'Failed to read file');
            }
        } catch (err) {
            setError(String(err));
        }
    }, [runningInElectron, hasUnsavedChanges]);

    // Create a new file (saves provided content to the new file)
    const createFile = useCallback(async (name: string, content: string): Promise<boolean> => {
        if (!runningInElectron) return false;

        try {
            const result = await window.electronAPI!.files.create(name);
            if (result.success && result.path) {
                // Write provided content to the new file
                const contentToSave = content || '';
                await window.electronAPI!.files.write(result.path, contentToSave);

                await refreshFiles();
                // Select the new file
                const newFile: MermaidFile = {
                    name,
                    path: result.path,
                    modifiedAt: new Date().toISOString(),
                    size: contentToSave.length,
                };
                setCurrentFile(newFile);
                setCurrentContent(contentToSave);
                setOriginalContent(contentToSave);
                return true;
            } else {
                setError(result.error || 'Failed to create file');
                return false;
            }
        } catch (err) {
            setError(String(err));
            return false;
        }
    }, [runningInElectron, refreshFiles]);

    // Save current file
    const saveCurrentFile = useCallback(async (): Promise<boolean> => {
        if (!runningInElectron || !currentFile) return false;

        try {
            const result = await window.electronAPI!.files.write(currentFile.path, currentContent);
            if (result.success) {
                setOriginalContent(currentContent);
                await refreshFiles();
                return true;
            } else {
                setError(result.error || 'Failed to save file');
                return false;
            }
        } catch (err) {
            setError(String(err));
            return false;
        }
    }, [runningInElectron, currentFile, currentContent, refreshFiles]);

    // Delete a file
    const deleteFile = useCallback(async (file: MermaidFile): Promise<boolean> => {
        if (!runningInElectron) return false;

        try {
            const result = await window.electronAPI!.files.delete(file.path);
            if (result.success) {
                await refreshFiles();
                if (currentFile?.path === file.path) {
                    setCurrentFile(null);
                    setCurrentContent('');
                    setOriginalContent('');
                }
                return true;
            }
            return false;
        } catch (err) {
            setError(String(err));
            return false;
        }
    }, [runningInElectron, currentFile, refreshFiles]);

    // Rename a file
    const renameFile = useCallback(async (file: MermaidFile, newName: string): Promise<boolean> => {
        if (!runningInElectron) return false;

        try {
            const result = await window.electronAPI!.files.rename(file.path, newName);
            if (result.success && result.newPath) {
                await refreshFiles();
                // Update current file if it was renamed
                if (currentFile?.path === file.path) {
                    setCurrentFile({
                        ...currentFile,
                        name: newName,
                        path: result.newPath,
                    });
                }
                return true;
            } else {
                setError(result.error || 'Failed to rename file');
                return false;
            }
        } catch (err) {
            setError(String(err));
            return false;
        }
    }, [runningInElectron, currentFile, refreshFiles]);

    // Update content (for editor changes)
    const updateContent = useCallback((content: string) => {
        setCurrentContent(content);
    }, []);

    // Create a new unsaved file (for "New" menu command)
    const newUnsavedFile = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm('You have unsaved changes. Discard them?');
            if (!confirmed) return;
        }

        const defaultCode = `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> A`;

        setCurrentFile(null);
        setCurrentContent(defaultCode);
        setOriginalContent('');
    }, [hasUnsavedChanges]);

    const value: FileContextType = {
        files,
        isLoading,
        error,
        currentFile,
        currentContent,
        hasUnsavedChanges,
        folderPath,
        refreshFiles,
        selectFile,
        createFile,
        saveCurrentFile,
        deleteFile,
        renameFile,
        updateContent,
        newUnsavedFile,
        isElectron: runningInElectron,
    };

    return (
        <FileContext.Provider value={value}>
            {children}
        </FileContext.Provider>
    );
};
