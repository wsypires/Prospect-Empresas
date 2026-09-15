import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileCode,
  Copy,
  Check,
  Download,
  Share2,
  Table,
  PhoneCall
} from 'lucide-react';
import { PlaceContact } from '../types';
import {
  exportToCsv,
  exportToJson,
  copyPhoneListToClipboard,
  copyFormattedTableToClipboard
} from '../utils/exportUtils';
import {
  exportFullBackup,
  importFullBackup,
} from '../utils/persistence';
import { Database, Upload } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: PlaceContact[];
  selectedIds: Set<string>;
  searchQueryLabel: string;
  onBackupRestored?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  contacts,
  selectedIds,
  searchQueryLabel,
  onBackupRestored,
}) => {
  const [exportScope, setExportScope] = useState<'all' | 'selected'>('all');
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(';');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadFullBackup = () => {
    exportFullBackup();
    setBackupMessage('Backup baixado com sucesso!');
    setTimeout(() => setBackupMessage(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importFullBackup(content);
        if (success) {
          setBackupMessage('Backup restaurado com sucesso!');
          onBackupRestored?.();
          setTimeout(() => {
            setBackupMessage(null);
            onClose();
          }, 1500);
        } else {
          setBackupMessage('Arquivo de backup inválido.');
        }
      }
    };
    reader.readAsText(file);
  };

  const targetContacts =
    exportScope === 'selected' && selectedIds.size > 0
      ? contacts.filter((c) => selectedIds.has(c.id))
      : contacts;

  const cleanFilename = `leads_${searchQueryLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')}`;

  const handleExportCsv = () => {
    exportToCsv(targetContacts, `${cleanFilename}.csv`, csvDelimiter);
    onClose();
  };

  const handleExportJson = () => {
    exportToJson(targetContacts, `${cleanFilename}.json`);
    onClose();
  };

  const handleCopyPhones = () => {
    const count = copyPhoneListToClipboard(targetContacts);
    setCopiedType('phones');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyTable = () => {
    const count = copyFormattedTableToClipboard(targetContacts);
    setCopiedType('table');
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Exportar Contatos</h2>
              <p className="text-xs text-slate-500">
                {targetContacts.length} contatos prontos para exportação
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Selection */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Quais contatos exportar?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-colors cursor-pointer ${
                  exportScope === 'all'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos os contatos ({contacts.length})
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setExportScope('selected')}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border text-center transition-colors cursor-pointer ${
                  exportScope === 'selected'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : selectedIds.size === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Apenas Selecionados ({selectedIds.size})
              </button>
            </div>
          </div>

          {/* Export Options Grid */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Formatos de Arquivo
            </label>

            {/* CSV Excel Option */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Planilha Excel / CSV (.csv)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Com acentos formatados (UTF-8 com BOM) e todas as colunas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={csvDelimiter}
                  onChange={(e) => setCsvDelimiter(e.target.value as any)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1"
                  title="Separador CSV"
                >
                  <option value=";">Ponto e vírgula (;)</option>
                  <option value=",">Vírgula (,)</option>
                </select>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar
                </button>
              </div>
            </div>

            {/* JSON Option */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Arquivo JSON (.json)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Estrutura completa para desenvolvedores e integrações
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs cursor-pointer inline-flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Baixar
              </button>
            </div>
          </div>

          {/* Quick Copy Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Ações Rápidas de Área de Transferência
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyPhones}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedType === 'phones' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar Lista de WhatsApp</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyTable}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedType === 'table' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Table className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copiar para Planilha</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Backup Completo do Sistema e Restauração */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Backup e Restauração de Dados
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                Persistência Ativa
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Inclui contatos, status de envio, anotações CRM, favoritos e CNPJs vinculados.
            </p>

            {backupMessage && (
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-semibold">
                {backupMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadFullBackup}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Baixar Backup Completo</span>
              </button>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-600" />
                  <span>Restaurar Backup</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
