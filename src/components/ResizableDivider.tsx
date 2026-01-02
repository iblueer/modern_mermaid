import React, { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableDividerProps {
  onResize: (leftWidth: number) => void;
  containerRef?: React.RefObject<HTMLElement | null>;
}

const ResizableDivider: React.FC<ResizableDividerProps> = ({ onResize, containerRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Get the container element (main content area, excluding file sidebar)
      const container = containerRef?.current || dividerRef.current?.parentElement;

      if (container) {
        // Calculate position relative to the container
        const containerRect = container.getBoundingClientRect();
        const relativeX = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        // Calculate left panel width as percentage of container
        const leftWidth = (relativeX / containerWidth) * 100;

        // Clamp between 20% and 80%
        const clampedWidth = Math.max(20, Math.min(80, leftWidth));
        onResize(clampedWidth);
      } else {
        // Fallback to window-based calculation
        const windowWidth = window.innerWidth;
        const leftWidth = (e.clientX / windowWidth) * 100;
        const clampedWidth = Math.max(20, Math.min(80, leftWidth));
        onResize(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, onResize, containerRef]);

  return (
    <div
      ref={dividerRef}
      className="relative w-1 bg-gray-200 dark:bg-gray-700 hover:bg-indigo-400 dark:hover:bg-indigo-500 cursor-ew-resize transition-colors group z-20"
      onMouseDown={() => setIsDragging(true)}
    >
      {/* 拖动指示器 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-indigo-500 dark:bg-indigo-400 rounded-full p-1 shadow-lg">
          <GripVertical size={16} className="text-white" />
        </div>
      </div>

      {/* 扩展拖动区域 */}
      <div className="absolute inset-y-0 -left-2 -right-2" />
    </div>
  );
};

export default ResizableDivider;
