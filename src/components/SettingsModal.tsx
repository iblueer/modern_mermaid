import React, { useState } from 'react';
import { X, Moon, Sun, Globe, FolderOpen, Github, Info } from 'lucide-react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFiles } from '../contexts/FileContext';
import DiscordIcon from './DiscordIcon';
import type { Language } from '../utils/i18n';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    const { language, setLanguage, t } = useLanguage();
    const { folderPath, refreshFiles, isElectron } = useFiles();
    const [activeTab, setActiveTab] = useState<'general' | 'about'>('general');

    if (!isOpen) return null;

    const handleChangeFolder = async () => {
        if (window.electronAPI) {
            const result = await window.electronAPI.settings.setFolder();
            if (result.success) {
                refreshFiles();
            }
        }
    };

    // Language options
    const languageOptions: { value: Language; label: string }[] = [
        { value: 'en', label: 'English' },
        { value: 'zh-CN', label: '简体中文' },
        { value: 'zh-TW', label: '繁體中文' },
        { value: 'ja', label: '日本語' },
        { value: 'es', label: 'Español' },
        { value: 'pt', label: 'Português' },
    ];

    const currentLanguageLabel = languageOptions.find(l => l.value === language)?.label || 'English';

    const tabs = [
        { id: 'general' as const, label: t.settings, icon: FolderOpen },
        { id: 'about' as const, label: t.about, icon: Info },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[100] bg-black/40 dark:bg-black/60"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {t.settingsModalTitle}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                                        ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        {activeTab === 'general' && (
                            <div className="space-y-5">
                                {/* Dark Mode */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {isDarkMode ? (
                                            <Moon className="w-5 h-5 text-indigo-500" />
                                        ) : (
                                            <Sun className="w-5 h-5 text-amber-500" />
                                        )}
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {language.startsWith('zh') ? '深色模式' : 'Dark Mode'}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {isDarkMode
                                                    ? (language.startsWith('zh') ? '已开启' : 'Currently on')
                                                    : (language.startsWith('zh') ? '已关闭' : 'Currently off')}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>

                                {/* Language */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {t.language}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {currentLanguageLabel}
                                            </div>
                                        </div>
                                    </div>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value as Language)}
                                        className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {languageOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* File Folder (Electron only) */}
                                {isElectron && (
                                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FolderOpen className="w-5 h-5 text-emerald-500" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {language.startsWith('zh') ? '文件位置' : 'File Location'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={folderPath}>
                                                        {folderPath || 'Not set'}
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleChangeFolder}
                                                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                            >
                                                {language.startsWith('zh') ? '更改' : 'Change'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-5">
                                {/* App Info */}
                                <div className="text-center py-4">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                        Modern <span className="text-indigo-600 dark:text-indigo-400">Mermaid</span>
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {language.startsWith('zh') ? '一个美观的 Mermaid 图表编辑器' : 'A beautiful Mermaid.js diagram editor'}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                        Version 1.0.0
                                    </p>
                                </div>

                                {/* Links */}
                                <div className="space-y-2">
                                    <a
                                        href="https://github.com/gotoailab/modern_mermaid"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                    >
                                        <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                GitHub
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {language.startsWith('zh') ? '查看源代码' : 'View source code'}
                                            </div>
                                        </div>
                                    </a>

                                    <a
                                        href="https://discord.gg/tGxevHhz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                                    >
                                        <DiscordIcon size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                Discord
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {language.startsWith('zh') ? '加入社区' : 'Join our community'}
                                            </div>
                                        </div>
                                    </a>
                                </div>

                                {/* Credits */}
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        Made with ❤️ using React & Mermaid.js
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsModal;
