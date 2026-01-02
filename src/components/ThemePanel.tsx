import React, { useState } from 'react';
import { Palette, Wallpaper, Type, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { themes, type ThemeType } from '../utils/themes';
import { backgrounds, type BackgroundStyle } from '../utils/backgrounds';
import { fonts, type FontOption } from '../utils/fonts';

interface ThemePanelProps {
    currentTheme: ThemeType;
    onThemeChange: (theme: ThemeType) => void;
    selectedBackground: string;
    onBackgroundChange: (bg: BackgroundStyle) => void;
    selectedFont: string;
    onFontChange: (font: FontOption) => void;
}

const ThemePanel: React.FC<ThemePanelProps> = ({
    currentTheme,
    onThemeChange,
    selectedBackground,
    onBackgroundChange,
    selectedFont,
    onFontChange,
}) => {
    const { language, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'theme' | 'background' | 'font'>('theme');

    const selectedBg = backgrounds.find(bg => bg.id === selectedBackground) || backgrounds[0];
    const selectedFontOption = fonts.find(f => f.id === selectedFont) || fonts[0];

    const tabs = [
        { id: 'theme' as const, icon: Palette, label: t.theme },
        { id: 'background' as const, icon: Wallpaper, label: t.background },
        { id: 'font' as const, icon: Type, label: t.font },
    ];

    return (
        <div className="relative">
            {/* Theme Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm transition-all cursor-pointer"
                title={t.theme}
            >
                <Palette className="w-4 h-4" />
                <span>{t.theme}</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-[60] bg-black/20 dark:bg-black/40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-[70] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {t.themeSettings}
                            </h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                            >
                                <X className="w-4 h-4" />
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
                                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium transition-colors ${activeTab === tab.id
                                            ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div className="max-h-72 overflow-y-auto">
                            {/* Theme Tab */}
                            {activeTab === 'theme' && (
                                <div className="p-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(themes) as ThemeType[]).map((themeKey) => (
                                            <button
                                                key={themeKey}
                                                onClick={() => {
                                                    onThemeChange(themeKey);
                                                }}
                                                className={`text-left px-3 py-2 text-sm rounded-md transition-all cursor-pointer ${currentTheme === themeKey
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {themes[themeKey].name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Background Tab */}
                            {activeTab === 'background' && (
                                <div className="p-2 space-y-1">
                                    {backgrounds.map((bg) => (
                                        <button
                                            key={bg.id}
                                            onClick={() => {
                                                onBackgroundChange(bg);
                                            }}
                                            className={`block w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all ${selectedBackground === bg.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {/* Preview */}
                                                <div
                                                    className={`w-8 h-8 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0 ${bg.bgClass}`}
                                                    style={bg.bgStyle}
                                                />
                                                {/* Name */}
                                                <span className={`font-medium ${selectedBackground === bg.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {bg.name[language]}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Font Tab */}
                            {activeTab === 'font' && (
                                <div className="p-2 space-y-1">
                                    {fonts.map((font) => (
                                        <button
                                            key={font.id}
                                            onClick={() => {
                                                onFontChange(font);
                                            }}
                                            className={`block w-full text-left px-3 py-2.5 text-sm rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all ${selectedFont === font.id ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500' : ''
                                                }`}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                {/* Font name */}
                                                <span className={`text-xs ${selectedFont === font.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {font.name[language]}
                                                </span>
                                                {/* Preview text */}
                                                <span
                                                    className={`text-sm ${selectedFont === font.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}
                                                    style={{ fontFamily: font.fontFamily || 'inherit' }}
                                                >
                                                    {font.previewText[language]}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer - Current Selection */}
                        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">{themes[currentTheme].name}</span>
                                <span>•</span>
                                <span>{selectedBg.name[language]}</span>
                                <span>•</span>
                                <span>{selectedFontOption.name[language]}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ThemePanel;
