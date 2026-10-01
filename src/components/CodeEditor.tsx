import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Copy,
  Check,
  Search,
  WrapText,
  RotateCcw,
  Eye,
  FileText
} from 'lucide-react';
import { ProjectFile, EditorTab } from '../types/project';
import { formatBytes } from '../utils/zipUtils';

interface CodeEditorProps {
  openTabs: EditorTab[];
  activeTabId: string;
  files: ProjectFile[];
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onSaveContent: (path: string, newContent: string) => void;
  onOpenPreview: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  openTabs,
  activeTabId,
  files,
  onSelectTab,
  onCloseTab,
  onSaveContent,
  onOpenPreview,
}) => {
  const activeFile = files.find(f => f.path === activeTabId);
  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [wordWrap, setWordWrap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeFile) {
      setContent(activeFile.content);
      setInitialContent(activeFile.content);
    }
  }, [activeFile?.path, activeFile?.content]);

  const isDirty = content !== initialContent;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    updateCursorPosition();
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value.substring(0, textareaRef.current.selectionStart);
    const lines = text.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  };

  const handleSave = () => {
    if (!activeFile) return;
    onSaveContent(activeFile.path, content);
    setInitialContent(content);
  };

  const handleRevert = () => {
    setContent(initialContent);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFormatJson = () => {
    if (activeFile?.type === 'json') {
      try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        setContent(formatted);
      } catch {
        // syntax error
      }
    }
  };

  const lines = content.split('\n');

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <FileText className="w-12 h-12 text-slate-700 mb-3" />
        <h3 className="text-sm font-semibold text-slate-300">Nenhum arquivo aberto</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Selecione um arquivo na barra lateral à esquerda para visualizar ou editar seu código.
        </p>
      </div>
    );
  }

  // Binary file view (image preview or unsupported message)
  if (activeFile.isBinary) {
    const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(activeFile.type);
    return (
      <div className="flex-1 flex flex-col bg-slate-900">
        {/* Tabs Bar */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950 overflow-x-auto">
          {openTabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-slate-800 cursor-pointer select-none transition-colors ${
                tab.id === activeTabId
                  ? 'bg-slate-900 text-white border-t-2 border-t-indigo-500'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <span className="font-mono text-[11px]">{tab.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="hover:bg-slate-800 p-0.5 rounded text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Binary Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
          {isImage ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg shadow-xl max-w-lg max-h-[500px] overflow-hidden flex items-center justify-center">
                <img
                  src={activeFile.content}
                  alt={activeFile.name}
                  className="max-h-[400px] object-contain rounded"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {activeFile.name} · {formatBytes(activeFile.size)}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p className="text-sm font-medium">Arquivo binário ({activeFile.type.toUpperCase()})</p>
              <p className="text-xs text-slate-500 mt-1">Tamanho: {formatBytes(activeFile.size)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 h-full overflow-hidden">
      {/* Tabs Bar */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/90 overflow-x-auto shrink-0">
        {openTabs.map(tab => {
          const isActive = tab.id === activeTabId;
          const dirty = isActive ? isDirty : tab.isDirty;
          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs border-r border-slate-800 cursor-pointer select-none transition-colors group ${
                isActive
                  ? 'bg-slate-900 text-white border-t-2 border-t-indigo-500 font-medium'
                  : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
              }`}
            >
              <span className="font-mono text-[11px] truncate max-w-[150px]">{tab.title}</span>
              {dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Não salvo" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="hover:bg-slate-800 p-0.5 rounded text-slate-400 group-hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Toolbar */}
      <div className="h-9 px-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono truncate max-w-xs">
            {activeFile.path}
          </span>
          {isDirty && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">
              Modificado
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {activeFile.type === 'json' && (
            <button
              onClick={handleFormatJson}
              title="Formatar JSON"
              className="px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              Format
            </button>
          )}

          {activeFile.type === 'html' && (
            <button
              onClick={onOpenPreview}
              title="Ver pré-visualização ao vivo"
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-indigo-300 hover:text-indigo-200 hover:bg-indigo-950/40 rounded transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>
          )}

          <button
            onClick={() => setShowSearch(!showSearch)}
            title="Localizar no arquivo"
            className={`p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${
              showSearch ? 'bg-slate-800 text-indigo-300' : ''
            }`}
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setWordWrap(!wordWrap)}
            title={wordWrap ? 'Desativar quebra de linha' : 'Ativar quebra de linha'}
            className={`p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${
              wordWrap ? 'bg-slate-800 text-indigo-300' : ''
            }`}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            title="Copiar código"
            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {isDirty && (
            <>
              <button
                onClick={handleRevert}
                title="Descartar alterações"
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleSave}
                title="Salvar alterações (Ctrl+S)"
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
              >
                <Save className="w-3 h-3" />
                <span>Salvar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* In-editor search bar */}
      {showSearch && (
        <div className="px-3 py-1.5 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar no texto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-64 font-mono"
          />
          {searchQuery && (
            <span className="text-[11px] text-slate-400 font-mono">
              {content.toLowerCase().split(searchQuery.toLowerCase()).length - 1} ocorrência(s)
            </span>
          )}
        </div>
      )}

      {/* Editor Body with Line Numbers */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs">
        {/* Line Numbers gutter */}
        <div className="w-12 bg-slate-950 text-slate-600 py-3 select-none text-right pr-3 overflow-hidden border-r border-slate-800/80 font-mono tabular-nums leading-5">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Canvas */}
        <div className="flex-1 relative overflow-auto bg-slate-900/60">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
              }
            }}
            spellCheck={false}
            className={`w-full h-full p-3 bg-transparent text-slate-200 font-mono text-xs leading-5 resize-none focus:outline-none ${
              wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-x-auto'
            }`}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="h-6 px-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>Lin {cursorPos.line}, Col {cursorPos.col}</span>
          <span>·</span>
          <span>{lines.length} linhas</span>
          <span>·</span>
          <span>{formatBytes(activeFile.size)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>·</span>
          <span className="uppercase">{activeFile.type}</span>
        </div>
      </div>
    </div>
  );
};
