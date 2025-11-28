import React, { useRef, useEffect, useState } from 'react';

interface EditorProps {
  code: string;
  onChange: (code: string) => void;
}

const Editor: React.FC<EditorProps> = ({ code, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);
  const [lineNumbers, setLineNumbers] = useState<number[]>([]);

  // 更新行号
  useEffect(() => {
    const lines = code.split('\n').length;
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1));
  }, [code]);

  // 同步滚动
  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current && lineNumberRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumberRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // 简单的 Mermaid 语法高亮
  const highlightCode = (code: string): JSX.Element[] => {
    if (!code) return [];
    
    const lines = code.split('\n');
    return lines.map((line, index) => {
      let parts: JSX.Element[] = [];
      let remaining = line;
      let key = 0;

      // 注释
      const commentMatch = remaining.match(/%%.*$/);
      if (commentMatch) {
        const beforeComment = remaining.substring(0, commentMatch.index);
        if (beforeComment) {
          parts.push(<span key={`${index}-${key++}`}>{beforeComment}</span>);
        }
        parts.push(
          <span key={`${index}-${key++}`} className="text-gray-400 dark:text-gray-500 italic">
            {commentMatch[0]}
          </span>
        );
        return <div key={index}>{parts}</div>;
      }

      // 图表类型关键字
      remaining = remaining.replace(
        /\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|xyChart)\b/gi,
        (match) => `<KEYWORD_CHART>${match}</KEYWORD_CHART>`
      );

      // 方向关键字
      remaining = remaining.replace(
        /\b(TD|TB|BT|RL|LR)\b/g,
        (match) => `<KEYWORD_DIR>${match}</KEYWORD_DIR>`
      );

      // 箭头
      remaining = remaining.replace(
        /(-->|---|-\.->|\.-|===>|==>|->|<--|<->)/g,
        (match) => `<ARROW>${match}</ARROW>`
      );

      // 字符串（方括号、圆括号、花括号、引号内的内容）
      remaining = remaining.replace(
        /(\[.*?\]|\(.*?\)|\{.*?\}|".*?"|'.*?')/g,
        (match) => `<STRING>${match}</STRING>`
      );

      // style 和 class 关键字
      remaining = remaining.replace(
        /\b(style|class|classDef|click|subgraph|end|participant|activate|deactivate|Note|loop|alt|opt|par)\b/gi,
        (match) => `<KEYWORD_STYLE>${match}</KEYWORD_STYLE>`
      );

      // 解析标记并生成 JSX
      const tokens = remaining.split(/(<[^>]+>.*?<\/[^>]+>)/g);
      tokens.forEach((token, i) => {
        if (token.startsWith('<KEYWORD_CHART>')) {
          const text = token.replace(/<\/?KEYWORD_CHART>/g, '');
          parts.push(
            <span key={`${index}-${key++}`} className="text-purple-600 dark:text-purple-400 font-semibold">
              {text}
            </span>
          );
        } else if (token.startsWith('<KEYWORD_DIR>')) {
          const text = token.replace(/<\/?KEYWORD_DIR>/g, '');
          parts.push(
            <span key={`${index}-${key++}`} className="text-blue-600 dark:text-blue-400 font-semibold">
              {text}
            </span>
          );
        } else if (token.startsWith('<ARROW>')) {
          const text = token.replace(/<\/?ARROW>/g, '');
          parts.push(
            <span key={`${index}-${key++}`} className="text-green-600 dark:text-green-400 font-bold">
              {text}
            </span>
          );
        } else if (token.startsWith('<STRING>')) {
          const text = token.replace(/<\/?STRING>/g, '');
          parts.push(
            <span key={`${index}-${key++}`} className="text-orange-600 dark:text-orange-400">
              {text}
            </span>
          );
        } else if (token.startsWith('<KEYWORD_STYLE>')) {
          const text = token.replace(/<\/?KEYWORD_STYLE>/g, '');
          parts.push(
            <span key={`${index}-${key++}`} className="text-pink-600 dark:text-pink-400 font-semibold">
              {text}
            </span>
          );
        } else if (token) {
          parts.push(<span key={`${index}-${key++}`}>{token}</span>);
        }
      });

      return <div key={index}>{parts.length > 0 ? parts : '\u00A0'}</div>;
    });
  };

  return (
    <div className="flex-1 relative flex overflow-hidden">
      {/* 行号区域 */}
      <div className="flex-shrink-0 w-12 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-hidden relative">
        <div 
          ref={lineNumberRef}
          className="absolute inset-0 py-6 px-2 text-right text-xs leading-relaxed font-mono overflow-hidden"
        >
          {lineNumbers.map((lineNum) => (
            <div 
              key={lineNum} 
              className="text-gray-400 dark:text-gray-600 select-none"
              style={{ height: '1.5rem' }}
            >
              {lineNum}
            </div>
          ))}
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-gray-800">
        {/* 语法高亮层 - 在底层 */}
        <div
          ref={highlightRef}
          className="absolute inset-0 p-6 font-mono text-sm leading-relaxed overflow-auto pointer-events-none select-none text-gray-800 dark:text-gray-200"
          style={{ 
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            tabSize: 2,
            whiteSpace: 'pre-wrap'
          }}
        >
          {code ? highlightCode(code) : <div className="text-gray-400 dark:text-gray-500">Enter Mermaid code here...</div>}
        </div>

        {/* Textarea 输入层 - 在上层，透明 */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full p-6 m-0 resize-none focus:outline-none font-mono text-sm leading-relaxed bg-transparent transition-colors duration-200 overflow-auto"
          style={{
            color: 'transparent',
            caretColor: '#6366f1', // indigo-500
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            tabSize: 2,
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            outline: 'none'
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
};

export default Editor;
