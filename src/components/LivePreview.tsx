import React, { useState, useMemo } from 'react';
import { RefreshCw, Monitor, Tablet, Smartphone, ExternalLink, Code } from 'lucide-react';
import { ProjectFile } from '../types/project';

interface LivePreviewProps {
  files: ProjectFile[];
  onOpenCodeEditor: () => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  files,
  onOpenCodeEditor,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [reloadKey, setReloadKey] = useState(0);

  // Find index.html or any html file
  const htmlFile = useMemo(() => {
    return files.find(f => f.path === 'index.html' || f.name === 'index.html') ||
      files.find(f => f.type === 'html');
  }, [files]);

  // Construct iframe srcDoc with inline styles and scripts if referenced
  const srcDoc = useMemo(() => {
    if (!htmlFile) return '';

    let html = htmlFile.content;

    // Replace linked stylesheets with inline styles from the project
    files.forEach(f => {
      if (f.type === 'css') {
        const linkTagRegex = new RegExp(`<link[^>]+href=["'](?:\.\/)?(?:src\/)?${f.name}["'][^>]*>`, 'gi');
        html = html.replace(linkTagRegex, `<style>/* ${f.name} */\n${f.content}</style>`);
      }
    });

    // Replace linked scripts with inline script from the project
    files.forEach(f => {
      if (f.type === 'js' || f.type === 'ts') {
        const scriptTagRegex = new RegExp(`<script[^>]+src=["'](?:\.\/)?(?:src\/)?${f.name}["'][^>]*>\\s*<\\/script>`, 'gi');
        html = html.replace(scriptTagRegex, `<script>/* ${f.name} */\n${f.content}</script>`);
      }
    });

    return html;
  }, [htmlFile, files, reloadKey]);

  const handleRefresh = () => {
    setReloadKey(prev => prev + 1);
  };

  const handleOpenNewWindow = () => {
    if (!srcDoc) return;
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!htmlFile) {
    // Check if there is a README.md to preview instead
    const readmeFile = files.find(f => f.name.toLowerCase() === 'readme.md');

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950 text-center">
        <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <Code className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-100">Nenhum arquivo HTML encontrado</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            A pré-visualização interativa requer um arquivo <code className="font-mono text-indigo-300">index.html</code> no projeto.
          </p>

          {readmeFile ? (
            <div className="mt-4 p-4 text-left bg-slate-950 border border-slate-800 rounded-lg max-h-60 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap">
              {readmeFile.content}
            </div>
          ) : (
            <button
              onClick={onOpenCodeEditor}
              className="mt-5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              Criar index.html no Editor
            </button>
          )}
        </div>
      </div>
    );
  }

  const containerWidthClass =
    deviceMode === 'mobile'
      ? 'w-[375px]'
      : deviceMode === 'tablet'
      ? 'w-[768px]'
      : 'w-full';

  return (
    <div className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden">
      {/* Control Bar */}
      <div className="h-10 px-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-300">
            Executando: <span className="font-mono text-indigo-300">{htmlFile.path}</span>
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setDeviceMode('desktop')}
            title="Desktop (100%)"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'desktop' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            title="Tablet (768px)"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'tablet' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            title="Mobile (375px)"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'mobile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            title="Recarregar Preview"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleOpenNewWindow}
            title="Abrir em nova aba"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-auto">
        <div
          className={`h-full transition-all duration-300 bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-800 flex flex-col ${containerWidthClass}`}
        >
          <iframe
            key={reloadKey}
            srcDoc={srcDoc}
            title="Preview Sandbox"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
