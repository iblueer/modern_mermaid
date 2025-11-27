import { useEffect } from 'react';
import type { Language } from '../utils/i18n';

/**
 * Hook to update HTML lang attribute when language changes
 */
export const useHtmlLang = (language: Language) => {
  useEffect(() => {
    // 将语言代码映射到 HTML lang 属性格式
    const langMap: Record<Language, string> = {
      'en': 'en',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
      'ja': 'ja',
      'es': 'es',
      'pt': 'pt',
    };

    const htmlLang = langMap[language] || 'en';
    document.documentElement.lang = htmlLang;
  }, [language]);
};

