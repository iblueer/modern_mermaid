
import React, { useState } from 'react';
import { Sparkles, X, Loader2, AlertCircle, Check } from 'lucide-react';
import { useLLM } from '../contexts/LLMContext';
import { useLanguage } from '../contexts/LanguageContext';

interface AIPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onReplace: (code: string) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, onClose, onReplace }) => {
    const { t } = useLanguage();
    const { generateDiagram, isGenerating } = useLLM();
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pendingCode, setPendingCode] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setError(null);
        setPendingCode(null);

        const result = await generateDiagram(prompt);

        if (result.success && result.code) {
            setPendingCode(result.code);
        } else {
            setError(result.error || 'Unknown error occurred');
        }
    };

    const handleConfirmReplace = () => {
        if (pendingCode) {
            onReplace(pendingCode);
            setPendingCode(null);
            setPrompt('');
            onClose(); // Optional: close panel after success?
        }
    };

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-4 h-4" />
                        <span>{t.aiGeneration || 'AI Generation'}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {!pendingCode ? (
                    <>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t.aiPromptPlaceholder || 'Describe the diagram you want to generate...'}
                            className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-shadow"
                            disabled={isGenerating}
                        />

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleGenerate}
                                disabled={!prompt.trim() || isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t.aiProcessing || 'Processing...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        <span>{t.aiGenerate || 'Generate'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">Generation Successful</span>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                                {t.aiReplaceConfirm || 'Replace current content?'}
                            </div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-950 p-2 rounded border border-gray-100 dark:border-gray-800 max-h-32 overflow-auto text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap break-words">
                                {pendingCode}
                            </pre>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setPendingCode(null)}
                                className="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                {t.cancel || 'Cancel'}
                            </button>
                            <button
                                onClick={handleConfirmReplace}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                <span>{t.confirm || 'Confirm'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
};

export default AIPanel;
