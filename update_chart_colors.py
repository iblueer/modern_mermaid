#!/usr/bin/env python3
import re

# Read the themes file
with open('src/utils/themes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Define sophisticated color palettes for each theme
themes = {
    # Cyberpunk - mysterious neon but refined
    'Cyberpunk': {
        'comment': 'Refined neon mystique',
        'line_colors': ['#6CC6CB', '#C77DFF', '#7CE38B'],  # Soft cyan, lavender, mint
        'bar_fills': ['rgba(108, 198, 203, 0.2)', 'rgba(199, 125, 255, 0.2)', 'rgba(124, 227, 139, 0.2)'],
        'bar_strokes': ['#6CC6CB', '#C77DFF', '#7CE38B'],
    },
    # Monochrome
    'Monochrome': {
        'comment': 'Elegant grayscale hierarchy',
        'line_colors': ['#2C2C2C', '#606060', '#8C8C8C'],
        'bar_fills': ['#2C2C2C', '#606060', '#8C8C8C'],
        'bar_strokes': ['#1A1A1A', '#404040', '#707070'],
    },
    # Ghibli
    'Ghibli': {
        'comment': 'Warm earth tones',
        'line_colors': ['#B8926A', '#7FA882', '#D4A373'],
        'bar_fills': ['#E6D5C3', '#C8DFC8', '#F0DCC4'],
        'bar_strokes': ['#B8926A', '#7FA882', '#D4A373'],
    },
    # Soft Pop
    'SoftPop': {
        'comment': 'Playful pastels',
        'line_colors': ['#8FA5C1', '#D39BAF', '#C9A96E'],
        'bar_fills': ['#D9E4F2', '#F5DEE8', '#F0E7D5'],
        'bar_strokes': ['#8FA5C1', '#D39BAF', '#C9A96E'],
    },
    # Dark Minimal
    'DarkMinimal': {
        'comment': 'Understated elegance',
        'line_colors': ['#9BA5B0', '#A69D93', '#B39D9D'],
        'bar_fills': ['rgba(155, 165, 176, 0.25)', 'rgba(166, 157, 147, 0.25)', 'rgba(179, 157, 157, 0.25)'],
        'bar_strokes': ['#9BA5B0', '#A69D93', '#B39D9D'],
    },
    # Wireframe
    'Wireframe': {
        'comment': 'Technical blueprint',
        'line_colors': ['#4A5568', '#718096', '#A0AEC0'],
        'bar_fills': ['#EDF2F7', '#E2E8F0', '#CBD5E0'],
        'bar_strokes': ['#4A5568', '#718096', '#A0AEC0'],
    },
    # Hand Drawn
    'HandDrawn': {
        'comment': 'Natural ink palette',
        'line_colors': ['#5D6D7E', '#7E6B5D', '#6B7E5D'],
        'bar_fills': ['#E8EBF0', '#F0EBE8', '#EBF0E8'],
        'bar_strokes': ['#5D6D7E', '#7E6B5D', '#6B7E5D'],
    },
}

# Cyberpunk theme
cyberpunk_old = r'\/\* XYChart styles - Neon cyberpunk aesthetic \*\/[\s\S]*?(?=\.chart-title text)'
cyberpunk_new = '''/* XYChart styles - Refined neon mystique */
        .line-plot-0 path { 
            stroke: #6CC6CB !important; 
            stroke-width: 3px !important; 
            filter: drop-shadow(0 0 6px rgba(108, 198, 203, 0.5));
        }
        .line-plot-1 path { 
            stroke: #C77DFF !important; 
            stroke-width: 3px !important; 
            filter: drop-shadow(0 0 6px rgba(199, 125, 255, 0.5));
        }
        .line-plot-2 path { 
            stroke: #7CE38B !important; 
            stroke-width: 3px !important; 
            filter: drop-shadow(0 0 6px rgba(124, 227, 139, 0.5));
        }
        .bar-plot-0 rect { 
            fill: rgba(108, 198, 203, 0.2) !important; 
            stroke: #6CC6CB !important;
            stroke-width: 2px !important;
            filter: drop-shadow(0 0 8px rgba(108, 198, 203, 0.4));
        }
        .bar-plot-1 rect { 
            fill: rgba(199, 125, 255, 0.2) !important; 
            stroke: #C77DFF !important;
            stroke-width: 2px !important;
            filter: drop-shadow(0 0 8px rgba(199, 125, 255, 0.4));
        }
        .bar-plot-2 rect { 
            fill: rgba(124, 227, 139, 0.2) !important; 
            stroke: #7CE38B !important;
            stroke-width: 2px !important;
            filter: drop-shadow(0 0 8px rgba(124, 227, 139, 0.4));
        }
        .ticks path { stroke: #00f2ff !important; opacity: 0.3; }
        '''

content = re.sub(cyberpunk_old, cyberpunk_new, content)

# Monochrome theme
mono_old = r'\/\* XYChart styles - Monochrome with different shades \*\/[\s\S]*?(?=\.chart-title text)'
mono_new = '''/* XYChart styles - Elegant grayscale hierarchy */
        .line-plot-0 path { stroke: #2C2C2C !important; stroke-width: 3px !important; }
        .line-plot-1 path { stroke: #606060 !important; stroke-width: 3px !important; stroke-dasharray: 8 4 !important; }
        .line-plot-2 path { stroke: #8C8C8C !important; stroke-width: 3px !important; stroke-dasharray: 4 4 !important; }
        .bar-plot-0 rect { fill: #2C2C2C !important; stroke: #1A1A1A !important; stroke-width: 2px !important; }
        .bar-plot-1 rect { fill: #606060 !important; stroke: #404040 !important; stroke-width: 2px !important; }
        .bar-plot-2 rect { fill: #8C8C8C !important; stroke: #707070 !important; stroke-width: 2px !important; }
        .ticks path { stroke: #d4d4d4 !important; }
        '''

content = re.sub(mono_old, mono_new, content)

# Ghibli theme
ghibli_old = r'\/\* XYChart styles - Warm Ghibli aesthetic \*\/[\s\S]*?(?=\.chart-title text)'
ghibli_new = '''/* XYChart styles - Warm earth tones */
        .line-plot-0 path { 
            stroke: #B8926A !important; 
            stroke-width: 3px !important;
        }
        .line-plot-1 path { 
            stroke: #7FA882 !important; 
            stroke-width: 3px !important;
        }
        .line-plot-2 path { 
            stroke: #D4A373 !important; 
            stroke-width: 3px !important;
        }
        .bar-plot-0 rect { 
            fill: #E6D5C3 !important; 
            stroke: #B8926A !important;
            stroke-width: 1.5px !important;
            rx: 6px !important;
            filter: drop-shadow(0 2px 6px rgba(58, 46, 44, 0.12));
        }
        .bar-plot-1 rect { 
            fill: #C8DFC8 !important; 
            stroke: #7FA882 !important;
            stroke-width: 1.5px !important;
            rx: 6px !important;
            filter: drop-shadow(0 2px 6px rgba(58, 46, 44, 0.12));
        }
        .bar-plot-2 rect { 
            fill: #F0DCC4 !important; 
            stroke: #D4A373 !important;
            stroke-width: 1.5px !important;
            rx: 6px !important;
            filter: drop-shadow(0 2px 6px rgba(58, 46, 44, 0.12));
        }
        .ticks path { stroke: #E8D5C4 !important; }
        '''

content = re.sub(ghibli_old, ghibli_new, content)

# Soft Pop theme
softpop_old = r'\/\* XYChart styles - Soft Pop colorful aesthetic \*\/[\s\S]*?(?=\.chart-title text)'
softpop_new = '''/* XYChart styles - Playful pastels */
        .line-plot-0 path { 
            stroke: #8FA5C1 !important; 
            stroke-width: 3px !important;
        }
        .line-plot-1 path { 
            stroke: #D39BAF !important; 
            stroke-width: 3px !important;
        }
        .line-plot-2 path { 
            stroke: #C9A96E !important; 
            stroke-width: 3px !important;
        }
        .bar-plot-0 rect { 
            fill: #D9E4F2 !important; 
            stroke: #8FA5C1 !important;
            stroke-width: 2px !important;
            rx: 8px !important;
            filter: drop-shadow(0 8px 12px rgba(143, 165, 193, 0.25));
        }
        .bar-plot-1 rect { 
            fill: #F5DEE8 !important; 
            stroke: #D39BAF !important;
            stroke-width: 2px !important;
            rx: 8px !important;
            filter: drop-shadow(0 8px 12px rgba(211, 155, 175, 0.25));
        }
        .bar-plot-2 rect { 
            fill: #F0E7D5 !important; 
            stroke: #C9A96E !important;
            stroke-width: 2px !important;
            rx: 8px !important;
            filter: drop-shadow(0 8px 12px rgba(201, 169, 110, 0.25));
        }
        .ticks path { stroke: #CBD5E1 !important; }
        '''

content = re.sub(softpop_old, softpop_new, content)

# Dark Minimal theme
darkmin_old = r'\/\* XYChart styles - Dark minimal aesthetic \*\/[\s\S]*?(?=\.chart-title text)'
darkmin_new = '''/* XYChart styles - Understated elegance */
        .line-plot-0 path { 
            stroke: #9BA5B0 !important; 
            stroke-width: 3px !important;
        }
        .line-plot-1 path { 
            stroke: #A69D93 !important; 
            stroke-width: 3px !important;
            stroke-dasharray: 8 4 !important;
        }
        .line-plot-2 path { 
            stroke: #B39D9D !important; 
            stroke-width: 3px !important;
            stroke-dasharray: 4 4 !important;
        }
        .bar-plot-0 rect { 
            fill: rgba(155, 165, 176, 0.25) !important;
            stroke: #9BA5B0 !important;
            stroke-width: 2px !important;
        }
        .bar-plot-1 rect { 
            fill: rgba(166, 157, 147, 0.25) !important;
            stroke: #A69D93 !important;
            stroke-width: 2px !important;
        }
        .bar-plot-2 rect { 
            fill: rgba(179, 157, 157, 0.25) !important;
            stroke: #B39D9D !important;
            stroke-width: 2px !important;
        }
        .ticks path { stroke: #404040 !important; }
        '''

content = re.sub(darkmin_old, darkmin_new, content)

# Wireframe theme
wireframe_old = r'\/\* XYChart styles - Wireframe\/Blueprint aesthetic with multiple series \*\/[\s\S]*?(?=\.chart-title text)'
wireframe_new = '''/* XYChart styles - Technical blueprint */
        .line-plot-0 path { 
            stroke: #4A5568 !important; 
            stroke-width: 3px !important;
        }
        .line-plot-1 path { 
            stroke: #718096 !important; 
            stroke-width: 3px !important;
            stroke-dasharray: 8 4 !important;
        }
        .line-plot-2 path { 
            stroke: #A0AEC0 !important; 
            stroke-width: 3px !important;
            stroke-dasharray: 4 4 !important;
        }
        .bar-plot-0 rect { 
            fill: #EDF2F7 !important;
            stroke: #4A5568 !important;
            stroke-width: 2px !important;
            rx: 2px !important;
        }
        .bar-plot-1 rect { 
            fill: #E2E8F0 !important;
            stroke: #718096 !important;
            stroke-width: 2px !important;
            rx: 2px !important;
        }
        .bar-plot-2 rect { 
            fill: #CBD5E0 !important;
            stroke: #A0AEC0 !important;
            stroke-width: 2px !important;
            rx: 2px !important;
        }
        .ticks path { stroke: #999999 !important; stroke-dasharray: 4 2 !important; }
        '''

content = re.sub(wireframe_old, wireframe_new, content)

# Hand Drawn theme
handdrawn_old = r'\/\* XYChart styles - Hand-drawn sketch aesthetic \*\/[\s\S]*?(?=\.chart-title text)'
handdrawn_new = '''/* XYChart styles - Natural ink palette */
        .line-plot-0 path { 
            stroke: #5D6D7E !important; 
            stroke-width: 3px !important;
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: url(#roughen-line) drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
        }
        .line-plot-1 path { 
            stroke: #7E6B5D !important; 
            stroke-width: 3px !important;
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: url(#roughen-line) drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
        }
        .line-plot-2 path { 
            stroke: #6B7E5D !important; 
            stroke-width: 3px !important;
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: url(#roughen-line) drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.1));
        }
        .bar-plot-0 rect { 
            fill: #E8EBF0 !important;
            stroke: #5D6D7E !important;
            stroke-width: 2.8px !important;
            rx: 4px !important;
            filter: url(#roughen) drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.15));
        }
        .bar-plot-1 rect { 
            fill: #F0EBE8 !important;
            stroke: #7E6B5D !important;
            stroke-width: 2.8px !important;
            rx: 4px !important;
            filter: url(#roughen) drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.15));
        }
        .bar-plot-2 rect { 
            fill: #EBF0E8 !important;
            stroke: #6B7E5D !important;
            stroke-width: 2.8px !important;
            rx: 4px !important;
            filter: url(#roughen) drop-shadow(2px 2px 3px rgba(0, 0, 0, 0.15));
        }
        .ticks path { 
            stroke: #1a1a1a !important; 
            stroke-width: 1.5px !important;
            opacity: 0.4;
        }
        '''

content = re.sub(handdrawn_old, handdrawn_new, content)

# Write back
with open('src/utils/themes.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated all chart colors with sophisticated palettes!")

