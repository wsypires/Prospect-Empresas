import React, { useState, useMemo } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  FileText,
  FileJson,
  FileImage,
  Folder,
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Download,
  File
} from 'lucide-react';
import { ProjectFile, FileTreeNode } from '../types/project';
import { formatBytes } from '../utils/zipUtils';

interface FileTreeProps {
  tree: FileTreeNode[];
  activeFilePath?: string;
  onSelectFile: (file: ProjectFile) => void;
  onDeleteFile: (path: string) => void;
  onAddFile: (path: string, content: string) => void;
  onDownloadFile: (file: ProjectFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  tree,
  activeFilePath,
  onSelectFile,
  onDeleteFile,
  onAddFile,
  onDownloadFile,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'src']));
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'code' | 'config' | 'docs' | 'images'>('all');
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (ext: string) => {
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
      case 'html':
      case 'css':
      case 'py':
      case 'rs':
      case 'go':
      case 'php':
        return <FileCode className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'json':
      case 'yaml':
      case 'yml':
      case 'toml':
        return <FileJson className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'md':
      case 'txt':
        return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return <FileImage className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
      default:
        return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onAddFile(newFileName.trim(), '');
    setNewFileName('');
    setIsAddingFile(false);
  };

  const renderNode = (node: FileTreeNode, depth = 0) => {
    const isExpanded = expandedFolders.has(node.path);

    if (node.isDirectory) {
      return (
        <div key={node.path || node.name} className="select-none">
          <button
            onClick={() => toggleFolder(node.path)}
            style={{ paddingLeft: `${depth * 12 + 10}px` }}
            className="w-full flex items-center gap-1.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors group text-left"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <span className="font-medium truncate">{node.name}</span>
          </button>

          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    if (!node.file) return null;
    const file = node.file;
    const isActive = activeFilePath === file.path;

    // Filter matching
    if (searchTerm && !file.path.toLowerCase().includes(searchTerm.toLowerCase())) {
      return null;
    }

    if (filterType === 'code' && !['ts', 'tsx', 'js', 'jsx', 'html', 'css', 'py', 'rs', 'go', 'php'].includes(file.type)) {
      return null;
    }
    if (filterType === 'config' && !['json', 'yaml', 'yml', 'toml', 'env', 'config'].includes(file.type)) {
      return null;
    }
    if (filterType === 'docs' && !['md', 'txt', 'pdf'].includes(file.type)) {
      return null;
    }
    if (filterType === 'images' && !['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(file.type)) {
      return null;
    }

    return (
      <div
        key={file.path}
        style={{ paddingLeft: `${depth * 12 + 18}px` }}
        className={`group flex items-center justify-between pr-2 py-1 text-xs cursor-pointer rounded transition-colors ${
          isActive
            ? 'bg-indigo-600/20 text-indigo-200 border-l-2 border-indigo-500'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
        onClick={() => onSelectFile(file)}
      >
        <div className="flex items-center gap-1.5 min-w-0 pr-1">
          {getFileIcon(file.type)}
          <span className="truncate font-mono text-[11px]">{file.name}</span>
          {file.isEdited && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Modificado" />
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-slate-500 font-mono tabular-nums mr-1">
            {formatBytes(file.size)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadFile(file);
            }}
            title="Baixar arquivo"
            className="p-1 hover:text-slate-200 hover:bg-slate-700 rounded"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remover "${file.path}"?`)) {
                onDeleteFile(file.path);
              }
            }}
            title="Excluir arquivo"
            className="p-1 hover:text-rose-400 hover:bg-slate-700 rounded"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const totalFilteredCount = useMemo(() => {
    let count = 0;
    const walk = (nodes: FileTreeNode[]) => {
      for (const n of nodes) {
        if (!n.isDirectory && n.file) {
          const matchSearch = !searchTerm || n.file.path.toLowerCase().includes(searchTerm.toLowerCase());
          let matchType = true;
          if (filterType === 'code') matchType = ['ts', 'tsx', 'js', 'jsx', 'html', 'css', 'py', 'rs'].includes(n.file.type);
          if (filterType === 'config') matchType = ['json', 'yaml', 'yml', 'toml'].includes(n.file.type);
          if (filterType === 'docs') matchType = ['md', 'txt'].includes(n.file.type);
          if (filterType === 'images') matchType = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(n.file.type);

          if (matchSearch && matchType) count++;
        }
        if (n.children) walk(n.children);
      }
    };
    walk(tree);
    return count;
  }, [tree, searchTerm, filterType]);

  return (
    <div className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-full shrink-0 select-none">
      {/* Top Header of Sidebar */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Arquivos ({totalFilteredCount})
          </span>
          <button
            onClick={() => setIsAddingFile(!isAddingFile)}
            title="Novo Arquivo"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar arquivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto pb-1 text-[11px]">
          {(['all', 'code', 'config', 'docs', 'images'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterType(tab)}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                filterType === tab
                  ? 'bg-slate-800 text-indigo-300 font-medium'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'all' ? 'Tudo' : tab === 'code' ? 'Código' : tab === 'config' ? 'Config' : tab === 'docs' ? 'Docs' : 'Mídia'}
            </button>
          ))}
        </div>

        {/* New file input form */}
        {isAddingFile && (
          <form onSubmit={handleCreateFile} className="mt-2 flex gap-1">
            <input
              type="text"
              autoFocus
              placeholder="ex: src/utils.ts"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500"
            >
              Ok
            </button>
          </form>
        )}
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {tree.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-500">
            Nenhum arquivo no projeto.
          </div>
        ) : (
          tree.map(node => renderNode(node, 0))
        )}
      </div>
    </div>
  );
};
