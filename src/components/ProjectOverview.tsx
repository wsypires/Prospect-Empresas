import React from 'react';
import {
  Layers,
  FileCode,
  HardDrive,
  Package,
  Download,
  UploadCloud,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { ProjectFile, ProjectStats } from '../types/project';
import { formatBytes } from '../utils/zipUtils';

interface ProjectOverviewProps {
  stats: ProjectStats;
  files: ProjectFile[];
  onUploadClick: () => void;
  onExportClick: () => void;
  onOpenFile: (file: ProjectFile) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  stats,
  files,
  onUploadClick,
  onExportClick,
  onOpenFile,
}) => {
  // Parse package.json dependencies if present
  const packageJsonFile = files.find(f => f.path === 'package.json');
  let dependencies: { [key: string]: string } = {};
  let devDependencies: { [key: string]: string } = {};

  if (packageJsonFile && !packageJsonFile.isBinary) {
    try {
      const parsed = JSON.parse(packageJsonFile.content);
      dependencies = parsed.dependencies || {};
      devDependencies = parsed.devDependencies || {};
    } catch {
      // ignore
    }
  }

  // Calculate file type breakdown
  const languageEntries = Object.entries(stats.languages).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex-1 bg-slate-950 overflow-y-auto p-6 space-y-6">
      {/* Top Banner / Project ID */}
      <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-indigo-400 font-mono uppercase tracking-wider">
              {stats.detectedType}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">v{stats.version || '1.0.0'}</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 tracking-tight">
            {stats.projectName || 'Projeto Compactado'}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {stats.description || 'Workspace pronto para inspeção, edição e exportação de código descompactado.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>Substituir ZIP</span>
          </button>
          <button
            onClick={onExportClick}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Projeto (.zip)</span>
          </button>
        </div>
      </div>

      {/* Metric Cards - 4 Column clean grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-800/80 bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total de Arquivos</span>
            <FileCode className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {stats.totalFiles}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            distribuídos em {stats.totalFolders} pasta(s)
          </div>
        </div>

        <div className="border border-slate-800/80 bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tamanho Total</span>
            <HardDrive className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {formatBytes(stats.totalSize)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            descompactado na memória
          </div>
        </div>

        <div className="border border-slate-800/80 bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Stack Identificada</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-white truncate mt-1">
            {stats.detectedType}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            análise automatizada
          </div>
        </div>

        <div className="border border-slate-800/80 bg-slate-900/40 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Status do Workspace</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
            <span>Pronto para Edição</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            leitura client-side ativa
          </div>
        </div>
      </div>

      {/* Grid: File Types Breakdown & Dependencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File types */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Distribuição de Extensões</span>
          </h3>

          <div className="space-y-3">
            {languageEntries.map(([ext, count]) => {
              const pct = Math.round((count / stats.totalFiles) * 100);
              return (
                <div key={ext} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 uppercase">.{ext}</span>
                    <span className="text-slate-400 tabular-nums">
                      {count} arquivo(s) · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dependencies */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span>Dependências (package.json)</span>
          </h3>

          {Object.keys(dependencies).length > 0 || Object.keys(devDependencies).length > 0 ? (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {Object.keys(dependencies).length > 0 && (
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-mono">
                    Produção ({Object.keys(dependencies).length})
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(dependencies).map(([name, ver]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between py-1 px-2.5 bg-slate-950/60 rounded border border-slate-800/60 text-xs font-mono"
                      >
                        <span className="text-slate-300">{name}</span>
                        <span className="text-indigo-400 tabular-nums">{ver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(devDependencies).length > 0 && (
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 font-mono">
                    Desenvolvimento ({Object.keys(devDependencies).length})
                  </h4>
                  <div className="space-y-1">
                    {Object.entries(devDependencies).map(([name, ver]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between py-1 px-2.5 bg-slate-950/60 rounded border border-slate-800/60 text-xs font-mono"
                      >
                        <span className="text-slate-400">{name}</span>
                        <span className="text-slate-500 tabular-nums">{ver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              Nenhuma dependência ou arquivo package.json identificado neste projeto.
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Files */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Arquivos Chave do Projeto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {files.slice(0, 9).map(file => (
            <button
              key={file.path}
              onClick={() => onOpenFile(file)}
              className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg hover:border-indigo-500/50 hover:bg-slate-900 transition-colors text-left group"
            >
              <div className="min-w-0 flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="text-xs font-mono text-slate-300 group-hover:text-white truncate">
                  {file.path}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono tabular-nums shrink-0 ml-2">
                {formatBytes(file.size)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
