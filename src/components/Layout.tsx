import { useRef, useState, useEffect, useCallback } from 'react';
import Editor from './Editor';
import Preview from './Preview';
import type { PreviewHandle } from './Preview';
import Header from './Header';
import Toolbar from './Toolbar';
import ExampleSelector from './ExampleSelector';
import ResizableDivider from './ResizableDivider';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import FileSidebar from './FileSidebar';
import { themes } from '../utils/themes';
import type { ThemeType } from '../utils/themes';
import { backgrounds, type BackgroundStyle } from '../utils/backgrounds';
import { fonts, type FontOption } from '../utils/fonts';
import type { AnnotationType } from '../types/annotation';
import { useLanguage } from '../contexts/LanguageContext';
import { useFiles } from '../contexts/FileContext';
import { Save, Code2 } from 'lucide-react';
import { trackEvent } from './GoogleAnalytics';
import { AnalyticsEvents } from '../hooks/useAnalytics';
import { findExampleById } from '../utils/examples';
import { generateShareURL, parseShareURL } from '../utils/compression';

const Layout: React.FC = () => {
  const defaultCode = `graph TD
  A[Start] --> B{Is it working?}
  B -- Yes --> C[Great!]
  B -- No --> D[Debug]`;

  const [code, setCode] = useState<string>(defaultCode);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('linearLight');
  const [selectedBackground, setSelectedBackground] = useState<BackgroundStyle>(backgrounds[0]);
  const [selectedFont, setSelectedFont] = useState<FontOption>(fonts[0]);
  const [selectedTool, setSelectedTool] = useState<AnnotationType | 'select' | null>('select');
  const [annotationCount, setAnnotationCount] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(30); // 默认 30%
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showClearAnnotationsDialog, setShowClearAnnotationsDialog] = useState(false);
  const [loadedFromUrl, setLoadedFromUrl] = useState<boolean>(false); // 追踪是否从 URL 加载
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true); // 追踪是否是初始加载
  const [customStylesLoaded, setCustomStylesLoaded] = useState<boolean>(false); // 追踪是否加载了自定义背景/字体
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsFileName, setSaveAsFileName] = useState('');
  const previewRef = useRef<PreviewHandle>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  // File management (Electron mode)
  const {
    isElectron,
    currentFile,
    currentContent,
    hasUnsavedChanges,
    updateContent,
    saveCurrentFile,
    createFile
  } = useFiles();

  // Sync code with file context in Electron mode
  // Sync code with file context in Electron mode
  useEffect(() => {
    if (isElectron) {
      // If we have a file selected, always use its content even if empty
      if (currentFile) {
        setCode(currentContent);
      }
      // If no file selected (Untitled)
      else if (currentContent) {
        setCode(currentContent);
      }
      // If no file and no content (initial state), show default code
      else {
        setCode(defaultCode);
      }
    }
  }, [isElectron, currentContent, currentFile, defaultCode]);

  const handleDownload = (transparent: boolean) => {
    // 追踪导出操作
    trackEvent(AnalyticsEvents.EXPORT_IMAGE, {
      format: transparent ? 'png' : 'jpg',
      transparent: transparent,
      theme: currentTheme,
      has_annotations: annotationCount > 0,
      annotation_count: annotationCount
    });

    if (previewRef.current) {
      previewRef.current.exportImage(transparent);
    }
  };

  const handleCopy = (transparent: boolean) => {
    // 追踪复制操作
    trackEvent('copy_image', {
      transparent: transparent,
      theme: currentTheme,
      has_annotations: annotationCount > 0,
      annotation_count: annotationCount
    });

    if (previewRef.current) {
      previewRef.current.copyImage(transparent);
    }
  };

  const handleShare = () => {
    // 生成分享链接
    const shareURL = generateShareURL({
      code: code,
      theme: currentTheme,
      background: selectedBackground.id,
      font: selectedFont.id
    });

    // 追踪分享操作
    trackEvent('share_link', {
      theme: currentTheme,
      background: selectedBackground.id,
      font: selectedFont.id,
      code_length: code.length,
      compressed_url_length: shareURL.length
    });

    // 复制到剪贴板
    navigator.clipboard.writeText(shareURL).then(() => {
      setToastMessage(t.shareCopied);
      setShowToast(true);
    }).catch((err) => {
      console.error('Failed to copy share link:', err);
      // 降级方案：显示链接让用户手动复制
      prompt(t.share, shareURL);
    });
  };

  const handleBackgroundChange = (bg: BackgroundStyle) => {
    // 追踪背景更改
    trackEvent(AnalyticsEvents.BACKGROUND_CHANGE, {
      background_id: bg.id,
      background_name: bg.name,
      theme: currentTheme
    });

    setSelectedBackground(bg);
    // 用户手动更改了背景，允许后续主题切换时重置
    setCustomStylesLoaded(false);
  };

  const handleFontChange = (font: FontOption) => {
    // 追踪字体更改
    trackEvent(AnalyticsEvents.FONT_CHANGE, {
      font_id: font.id,
      font_name: font.name,
      theme: currentTheme
    });

    setSelectedFont(font);
    // 用户手动更改了字体，允许后续主题切换时重置
    setCustomStylesLoaded(false);
  };



  // 标注工具处理
  const handleSelectTool = (tool: AnnotationType | 'select') => {
    // 追踪标注工具选择
    trackEvent('annotation_tool_select', {
      tool: tool,
      previous_tool: selectedTool,
      theme: currentTheme
    });

    setSelectedTool(tool);
  };

  const handleClearAnnotations = () => {
    if (annotationCount > 0) {
      setShowClearAnnotationsDialog(true);
    }
  };

  const confirmClearAnnotations = () => {
    // 追踪清空标注操作
    trackEvent(AnalyticsEvents.ANNOTATION_CLEAR_ALL, {
      annotation_count: annotationCount,
      theme: currentTheme
    });

    // 这个会通过 Preview 的 ref 来处理
    if (previewRef.current && 'clearAnnotations' in previewRef.current) {
      (previewRef.current as any).clearAnnotations();
    }
    setShowClearAnnotationsDialog(false);
  };

  const handleAnnotationCountChange = (count: number) => {
    setAnnotationCount(count);
  };

  const handleResize = (width: number) => {
    setLeftPanelWidth(width);
  };

  const handleToggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;

    // 追踪全屏切换
    trackEvent(AnalyticsEvents.FULLSCREEN_TOGGLE, {
      fullscreen: newFullscreenState,
      theme: currentTheme
    });

    setIsFullscreen(newFullscreenState);
  };

  // 主题更改处理
  const handleThemeChange = (theme: ThemeType) => {
    // 追踪主题更改
    trackEvent(AnalyticsEvents.THEME_CHANGE, {
      theme: theme,
      previous_theme: currentTheme
    });

    setCurrentTheme(theme);

    // 更新 URL 参数
    const url = new URL(window.location.href);
    url.searchParams.set('theme', theme);
    window.history.pushState({}, '', url.toString());
  };

  // 示例选择处理
  const handleExampleSelect = (exampleCode: string, exampleId?: string) => {
    // 追踪示例选择
    trackEvent(AnalyticsEvents.EXAMPLE_SELECT, {
      code_length: exampleCode.length,
      theme: currentTheme,
      example_id: exampleId
    });

    setCode(exampleCode);
    setLoadedFromUrl(true);

    // 更新 URL 参数（保留主题参数）
    if (exampleId) {
      const url = new URL(window.location.href);
      url.searchParams.set('example', exampleId);
      // 确保主题参数也存在
      url.searchParams.set('theme', currentTheme);
      window.history.pushState({}, '', url.toString());
    }
  };

  // 自定义的 setCode 函数，用于清除示例 URL 参数（保留主题参数）
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);

    // Update file context in Electron mode
    if (isElectron) {
      updateContent(newCode);
    }

    // 如果代码被修改，且之前是从 URL 加载的，清除示例参数（但保留主题参数）
    if (loadedFromUrl) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('example')) {
        url.searchParams.delete('example');
        // 保留主题参数
        window.history.replaceState({}, '', url.toString());
        setLoadedFromUrl(false);
      }
    }
  };

  // Save file handler for Electron
  const handleSaveFile = useCallback(async () => {
    if (!isElectron) return;

    // If no current file, prompt for filename (Save As)
    if (!currentFile) {
      setShowSaveAsDialog(true);
      return;
    }

    // Save existing file
    const success = await saveCurrentFile();
    if (success) {
      setToastMessage(language.startsWith('zh') ? '文件已保存！' : 'File saved!');
      setShowToast(true);
    }
  }, [isElectron, currentFile, saveCurrentFile, language]);

  // Handle save as (create new file)
  const handleSaveAs = async () => {
    if (!saveAsFileName.trim()) return;

    // Create the file with current code content
    const success = await createFile(saveAsFileName.trim(), code);
    if (success) {
      setShowSaveAsDialog(false);
      setSaveAsFileName('');
      setToastMessage(language.startsWith('zh') ? '文件已创建！' : 'File created!');
      setShowToast(true);
    }
  };

  // 初始化：从 URL 参数加载示例、主题和分享内容
  useEffect(() => {
    // 尝试解析分享参数（包含压缩的代码）
    const shareParams = parseShareURL();

    if (shareParams) {
      // 检查是否有自定义背景/字体
      const hasCustomStyles = !!(shareParams.background || shareParams.font);
      if (hasCustomStyles) {
        setCustomStylesLoaded(true);
      }

      // 加载背景（在主题之前）
      if (shareParams.background) {
        const bg = backgrounds.find(b => b.id === shareParams.background);
        if (bg) {
          setSelectedBackground(bg);
        }
      }

      // 加载字体（在主题之前）
      if (shareParams.font) {
        const font = fonts.find(f => f.id === shareParams.font);
        if (font) {
          setSelectedFont(font);
        }
      }

      // 加载主题（在背景和字体之后）
      if (shareParams.theme) {
        const validThemes: ThemeType[] = ['linearLight', 'linearDark', 'notion', 'ghibli', 'spotless', 'brutalist', 'glassmorphism', 'memphis', 'softPop', 'cyberpunk', 'monochrome', 'darkMinimal', 'wireframe', 'handDrawn', 'grafana', 'noir', 'material', 'aurora'];
        if (validThemes.includes(shareParams.theme as ThemeType)) {
          setCurrentTheme(shareParams.theme as ThemeType);

          // 追踪从 URL 加载主题
          trackEvent('theme_loaded_from_url', {
            theme: shareParams.theme,
            from_share: !!shareParams.code
          });
        }
      }

      // 标记初始加载完成
      setIsInitialLoad(false);

      // 加载代码（从分享链接）
      if (shareParams.code) {
        setCode(shareParams.code);
        setLoadedFromUrl(true);

        // 追踪从分享链接加载
        trackEvent('shared_link_opened', {
          theme: shareParams.theme || currentTheme,
          background: shareParams.background,
          font: shareParams.font,
          code_length: shareParams.code.length
        });
      } else if (shareParams.example) {
        // 加载示例（如果没有代码但有示例 ID）
        const found = findExampleById(shareParams.example);
        if (found) {
          const exampleCode = found.example.code[language];
          setCode(exampleCode);
          setLoadedFromUrl(true);

          // 追踪从 URL 加载示例
          trackEvent('example_loaded_from_url', {
            example_id: shareParams.example,
            category: found.category,
            theme: shareParams.theme || currentTheme
          });
        }
      }
    } else {
      // 没有 URL 参数时也要标记初始加载完成
      setIsInitialLoad(false);
    }
  }, []); // 只在组件挂载时执行一次

  // ESC 键退出全屏 + Cmd+S 保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleSaveFile]);

  // Reset background and font when theme changes (but not on initial load or if custom styles were loaded from URL)
  useEffect(() => {
    if (!isInitialLoad && !customStylesLoaded) {
      setSelectedBackground(backgrounds[0]); // Reset to default
      setSelectedFont(fonts[0]); // Reset to default
    }
  }, [currentTheme, isInitialLoad, customStylesLoaded]);

  return (
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header only shown in web mode, not in Electron */}
      {!isFullscreen && !isElectron && <Header />}
      <main
        className={`flex-1 flex flex-col md:flex-row overflow-hidden ${isFullscreen ? '' : ''}`}
      >
        {/* File Sidebar (Electron only) */}
        {!isFullscreen && (
          <FileSidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        {/* Editor and Preview Container - ref used for resize divider calculation */}
        <div ref={editorContainerRef} className="flex-1 flex flex-row overflow-hidden">
          {/* Left Pane: Editor */}
          {!isFullscreen && (
            <div
              className="border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-800 shadow-sm z-10"
              style={{ width: `${leftPanelWidth}%` }}
            >
              <div className="flex-shrink-0 px-4 py-3 min-h-[53px] border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.editor}</span>
                  </div>
                  {(isElectron && (currentFile || !currentFile)) && (
                    <span className="text-gray-300 dark:text-gray-600 text-sm">/</span>
                  )}
                  {/* Show current file name in Electron mode */}
                  {isElectron && currentFile && (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium normal-case">
                      {currentFile.name}
                      {hasUnsavedChanges && <span className="text-orange-500 ml-1">•</span>}
                    </span>
                  )}
                  {isElectron && !currentFile && (
                    <span className="text-gray-500 dark:text-gray-400 font-medium normal-case italic">
                      {t.untitled}
                      <span className="text-orange-500 ml-1">•</span>
                    </span>
                  )}
                  {!isElectron && <ExampleSelector onSelectExample={handleExampleSelect} />}

                  {/* 清空、刷新和保存按钮 */}
                  <div className="flex items-center gap-2">
                    {/* Save button (Electron only - show when unsaved OR when no file selected) */}
                    {isElectron && (hasUnsavedChanges || (!currentFile && code)) && (
                      <button
                        onClick={handleSaveFile}
                        className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors cursor-pointer"
                        title={currentFile ? `${t.save} (⌘S)` : `${t.saveAs} (⌘S)`}
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <Editor code={code} onChange={handleCodeChange} />
              </div>
            </div>
          )}

          {/* 可拖动分割线 */}
          {!isFullscreen && <ResizableDivider onResize={handleResize} containerRef={editorContainerRef} />}

          {/* Right Pane: Preview */}
          <div
            className="bg-gray-50 dark:bg-gray-900 flex flex-col relative flex-1"
            style={{ width: isFullscreen ? '100%' : `${100 - leftPanelWidth}%` }}
          >
            <div className="absolute top-4 right-4 z-10 flex items-start gap-2">
              <Toolbar
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
                onDownload={handleDownload}
                onCopy={handleCopy}
                onShare={handleShare}
                selectedBackground={selectedBackground.id}
                onBackgroundChange={handleBackgroundChange}
                selectedFont={selectedFont.id}
                onFontChange={handleFontChange}
                selectedTool={selectedTool}
                onSelectTool={handleSelectTool}
                onClearAnnotations={handleClearAnnotations}
                annotationCount={annotationCount}
              />
            </div>
            <Preview
              ref={previewRef}
              code={code}
              themeConfig={themes[currentTheme]}
              customBackground={selectedBackground}
              customFont={selectedFont}
              onCodeChange={setCode}
              selectedTool={selectedTool}
              onSelectTool={handleSelectTool}
              onAnnotationCountChange={handleAnnotationCountChange}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
            />
          </div>
        </div>
      </main>



      {/* 清空标注确认对话框 */}
      <ConfirmDialog
        isOpen={showClearAnnotationsDialog}
        title={t.clearAnnotations}
        message={t.confirmClearAnnotations}
        onConfirm={confirmClearAnnotations}
        onCancel={() => setShowClearAnnotationsDialog(false)}
        variant="danger"
      />

      {/* Toast 通知 */}
      {showToast && (
        <Toast
          message={toastMessage}
          onClose={() => setShowToast(false)}
          duration={3000}
          type="success"
        />
      )}

      {/* Save As 对话框 */}
      {showSaveAsDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowSaveAsDialog(false)} />
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {language.startsWith('zh') ? '保存文件' : 'Save File'}
              </h2>
            </div>
            <div className="p-5">
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                {language.startsWith('zh') ? '文件名' : 'File Name'}
              </label>
              <input
                type="text"
                value={saveAsFileName}
                onChange={(e) => setSaveAsFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveAs();
                  if (e.key === 'Escape') setShowSaveAsDialog(false);
                }}
                placeholder="diagram.mmd"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {language.startsWith('zh') ? '将自动添加 .mmd 扩展名' : '.mmd extension will be added automatically'}
              </p>
            </div>
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveAsDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!saveAsFileName.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {language.startsWith('zh') ? '保存' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
