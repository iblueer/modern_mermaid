
import React, { createContext, useContext, useState } from 'react';

export interface LLMConfig {
    baseUrl: string;
    apiKey: string;
    model: string;
}

export interface GenerateResult {
    success: boolean;
    error?: string;
    code?: string;
}

interface LLMContextType {
    config: LLMConfig;
    updateConfig: (updates: Partial<LLMConfig>) => void;
    testConnection: () => Promise<boolean>;
    generateDiagram: (prompt: string) => Promise<GenerateResult>;
    isGenerating: boolean;
}

const LLMContext = createContext<LLMContextType | undefined>(undefined);

const DEFAULT_CONFIG: LLMConfig = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-3.5-turbo',
};

const SYSTEM_PROMPT_GENERATE = `You are a Mermaid.js diagram generator assistant.
Your task is to generate Mermaid code based on the user's description.
You MUST return the result strictly as a valid JSON object with the following structure:
{
  "success": boolean,
  "error": string | null, // Error message if any, otherwise null
  "code": string | null   // The mermaid diagram code properly escaped if success, otherwise null
}

IMPORTANT RULES:
1. Do NOT wrap the JSON in markdown code blocks like \`\`\`json ... \`\`\`.
2. Do NOT output any text before or after the JSON.
3. The "code" field must contain ONLY Valid Mermaid syntax code.
4. If you cannot generate a diagram from the prompt, set "success" to false and provide a helpful "error" message.
`;

const SYSTEM_PROMPT_TEST = `You are a test assistant. 
Please reply with a valid JSON object: {"status": "ok", "message": "Pong"}. 
Do not include markdown formatting.`;

export const LLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfigState] = useState<LLMConfig>(() => {
        const saved = localStorage.getItem('mermaid-llm-config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    const [isGenerating, setIsGenerating] = useState(false);

    const updateConfig = (updates: Partial<LLMConfig>) => {
        const newConfig = { ...config, ...updates };
        setConfigState(newConfig);
        localStorage.setItem('mermaid-llm-config', JSON.stringify(newConfig));
    };

    const callLLM = async (messages: { role: string; content: string }[]): Promise<any> => {
        if (!config.apiKey) {
            throw new Error('API Key is missing');
        }

        const url = config.baseUrl.endsWith('/') ? `${config.baseUrl}chat/completions` : `${config.baseUrl}/chat/completions`;

        const requestConfig = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`,
            },
            body: {
                model: config.model,
                messages,
                temperature: 0.7,
            },
        };

        try {
            let data: any;

            // Use Electron Proxy if available (bypasses CORS)
            if (window.electronAPI && window.electronAPI.llmRequest) {
                const result = await window.electronAPI.llmRequest({
                    url,
                    method: requestConfig.method,
                    headers: requestConfig.headers,
                    body: requestConfig.body
                });

                if (!result.success) {
                    throw new Error(result.error || 'Electron Request Failed');
                }
                data = result.data;
            } else {
                // Fallback for Web
                const response = await fetch(url, {
                    method: requestConfig.method,
                    headers: requestConfig.headers,
                    body: JSON.stringify(requestConfig.body),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                }
                data = await response.json();
            }

            const content = data.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('No content received from LLM');
            }

            // Try to parse JSON from content
            // Remove potential markdown wrappers if the model ignores the instruction
            const cleanedContent = content.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
            return JSON.parse(cleanedContent);
        } catch (error) {
            console.error('LLM Call failed:', error);
            throw error;
        }
    };

    const testConnection = async (): Promise<boolean> => {
        try {
            const result = await callLLM([
                { role: 'system', content: SYSTEM_PROMPT_TEST },
                { role: 'user', content: 'Ping' }
            ]);
            return result.status === 'ok';
        } catch (e) {
            return false;
        }
    };

    const generateDiagram = async (prompt: string): Promise<GenerateResult> => {
        setIsGenerating(true);
        try {
            const result = await callLLM([
                { role: 'system', content: SYSTEM_PROMPT_GENERATE },
                { role: 'user', content: prompt }
            ]);

            if (typeof result.success === 'boolean') {
                return result as GenerateResult;
            }
            return { success: false, error: 'Invalid response format from LLM' };
        } catch (error: any) {
            return { success: false, error: error.message || 'Unknown error occurred' };
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <LLMContext.Provider value={{ config, updateConfig, testConnection, generateDiagram, isGenerating }}>
            {children}
        </LLMContext.Provider>
    );
};

export const useLLM = () => {
    const context = useContext(LLMContext);
    if (context === undefined) {
        throw new Error('useLLM must be used within a LLMProvider');
    }
    return context;
};
