import React, { useState, useRef, useEffect } from 'react';
import { useFiles } from '../contexts/FileContext';
import {
    FileText,
    Plus,
    Trash2,
    Edit2,
    RefreshCw,
    FolderOpen,
    Check,
    X,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Settings
} from 'lucide-react';
import type { MermaidFile } from '../types/electron';
import SettingsModal from './SettingsModal';

interface FileSidebarProps {
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const FileSidebar: React.FC<FileSidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
    const {
        files,
        isLoading,
        error,
        currentFile,
        hasUnsavedChanges,
        selectFile,
        createFile,
        deleteFile,
        renameFile,
        refreshFiles,
        isElectron
    } = useFiles();

    const [isCreating, setIsCreating] = useState(false);
    const [newFileName, setNewFileName] = useState('');
    const [editingFile, setEditingFile] = useState<MermaidFile | null>(null);
    const [editingName, setEditingName] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const newFileInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input when creating new file
    useEffect(() => {
        if (isCreating && newFileInputRef.current) {
            newFileInputRef.current.focus();
        }
    }, [isCreating]);

    // Auto-focus input when editing
    useEffect(() => {
        if (editingFile && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingFile]);

    // Clear local error after 3 seconds
    useEffect(() => {
        if (localError) {
            const timer = setTimeout(() => setLocalError(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [localError]);

    const handleCreateFile = async () => {
        if (!newFileName.trim()) {
            setLocalError('Please enter a file name');
            return;
        }

        // Default content for new files created from sidebar
        const defaultContent = `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> A`;

        const success = await createFile(newFileName.trim(), defaultContent);
        if (success) {
            setNewFileName('');
            setIsCreating(false);
        } else {
            setLocalError('Failed to create file');
        }
    };

    const handleRenameFile = async () => {
        if (!editingFile || !editingName.trim()) {
            setLocalError('Please enter a file name');
            return;
        }

        if (editingName.trim() === editingFile.name) {
            setEditingFile(null);
            return;
        }

        const success = await renameFile(editingFile, editingName.trim());
        if (success) {
            setEditingFile(null);
            setEditingName('');
        } else {
            setLocalError('Failed to rename file');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: 'create' | 'rename') => {
        if (e.key === 'Enter') {
            if (action === 'create') {
                handleCreateFile();
            } else {
                handleRenameFile();
            }
        } else if (e.key === 'Escape') {
            if (action === 'create') {
                setIsCreating(false);
                setNewFileName('');
            } else {
                setEditingFile(null);
                setEditingName('');
            }
        }
    };

    const startRename = (file: MermaidFile, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingFile(file);
        setEditingName(file.name);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Don't render if not in Electron
    if (!isElectron) {
        return null;
    }

    // Collapsed state
    if (isCollapsed) {
        return (
            <div className="w-12 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col items-center pt-4">
                <button
                    onClick={onToggleCollapse}
                    className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                    title="Expand sidebar"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
                <div className="mt-4 flex flex-col gap-2">
                    <button
                        onClick={() => {
                            onToggleCollapse();
                            setTimeout(() => setIsCreating(true), 100);
                        }}
                        className="p-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="New file"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1" />

                {/* Footer - Collapsed */}
                <div className="py-2 border-t border-gray-200 dark:border-gray-700 w-full flex justify-center">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    {/* Settings Modal (Collapsed view needs its own or shared) */}
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Files</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => refreshFiles()}
                        disabled={isLoading}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="New file"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onToggleCollapse}
                        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        title="Collapse sidebar"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Error display */}
            {(error || localError) && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>{error || localError}</span>
                    </div>
                </div>
            )}

            {/* New file input */}
            {isCreating && (
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <input
                            ref={newFileInputRef}
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, 'create')}
                            placeholder="File name..."
                            className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                        />
                        <button
                            onClick={handleCreateFile}
                            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setNewFileName('');
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* File list */}
            <div className="flex-1 overflow-y-auto">
                {files.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No files yet</p>
                        <p className="text-xs mt-1">Create your first diagram!</p>
                    </div>
                ) : (
                    <div className="py-2">
                        {files.map((file) => (
                            <div
                                key={file.path}
                                onClick={() => selectFile(file)}
                                className={`group px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors ${currentFile?.path === file.path
                                    ? 'bg-indigo-100 dark:bg-indigo-900/40'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                {editingFile?.path === file.path ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={editInputRef}
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, 'rename')}
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRenameFile();
                                            }}
                                            className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingFile(null);
                                                setEditingName('');
                                            }}
                                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2">
                                        <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${currentFile?.path === file.path
                                            ? 'text-indigo-600 dark:text-indigo-400'
                                            : 'text-gray-400 dark:text-gray-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className={`text-sm font-medium truncate ${currentFile?.path === file.path
                                                    ? 'text-indigo-700 dark:text-indigo-300'
                                                    : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                    {file.name}
                                                </span>
                                                {currentFile?.path === file.path && hasUnsavedChanges && (
                                                    <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" title="Unsaved changes" />
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatDate(file.modifiedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => startRename(file, e)}
                                                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                                                title="Rename"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteFile(file);
                                                }}
                                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with settings only */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 w-full flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </div>
    );
};

export default FileSidebar;
