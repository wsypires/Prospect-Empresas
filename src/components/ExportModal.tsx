import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  FileCode,
  Check,
  Download,
  Table,
  PhoneCall,
  Filter,
  Search,
  MapPin,
  Database,
  Upload,
} from 'lucide-react';
import { PlaceContact, ContactFilters, DEFAULT_CONTACT_FILTERS } from '../types';
import {
  exportToCsv,
  exportToJson,
  copyPhoneListToClipboard,
  copyFormattedTableToClipboard,
} from '../utils/exportUtils';
import {
  exportFullBackup,
  importFullBackup,
} from '../utils/persistence';
import {
  applyContactFilters,
  hasActiveContactFilters,
  getFilterMetadata,
} from '../utils/filterUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: PlaceContact[];
  selectedIds: Set<string>;
  searchQueryLabel: string;
  onBackupRestored?: () => void;
  initialFilters?: ContactFilters;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  contacts,
  selectedIds,
  searchQueryLabel,
  onBackupRestored,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<ContactFilters>(initialFilters || DEFAULT_CONTACT_FILTERS);
  const [exportScope, setExportScope] = useState<'filtered' | 'all' | 'selected'>('filtered');
  const [csvDelimiter, setCsvDelimiter] = useState<';' | ','>(';');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [showFiltersSection, setShowFiltersSection] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial filters when modal opens
  useEffect(() => {
    if (isOpen && initialFilters) {
      setFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  const hasActiveFilters = useMemo(() => hasActiveContactFilters(filters), [filters]);
  const metadata = useMemo(() => getFilterMetadata(contacts), [contacts]);

  // Compute contacts filtered by the 5 criteria
  const filteredContacts = useMemo(() => {
    return applyContactFilters(contacts, filters);
  }, [contacts, filters]);

  // Target contacts to be exported based on scope
  const targetContacts = useMemo(() => {
    if (exportScope === 'selected' && selectedIds.size > 0) {
      return contacts.filter((c) => selectedIds.has(c.id));
    }
    if (exportScope === 'all') {
      return contacts;
    }
    return filteredContacts;
  }, [exportScope, selectedIds, contacts, filteredContacts]);

  // Count of valid phone numbers for WhatsApp quick export
  const validPhonesCount = useMemo(() => {
    return targetContacts.filter((c) => Boolean(c.whatsappPhone || c.nationalPhone)).length;
  }, [targetContacts]);

  if (!isOpen) return null;

  const updateFilter = (partial: Partial<ContactFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    if (exportScope !== 'filtered') {
      setExportScope('filtered');
    }
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_CONTACT_FILTERS);
  };

  const cleanFilename = `leads_${searchQueryLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'contatos'}`;

  const handleExportCsv = () => {
    exportToCsv(targetContacts, `${cleanFilename}.csv`, csvDelimiter);
    onClose();
  };

  const handleExportJson = () => {
    exportToJson(targetContacts, `${cleanFilename}.json`);
    onClose();
  };

  const handleCopyPhones = () => {
    copyPhoneListToClipboard(targetContacts);
    setCopiedType('phones');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyTable = () => {
    copyFormattedTableToClipboard(targetContacts);
    setCopiedType('table');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadFullBackup = () => {
    exportFullBackup();
    setBackupMessage('Backup baixado com sucesso!');
    setTimeout(() => setBackupMessage(null), 3500);
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col border-modal shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-[#f8fafd]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#1e1e2f]">Exportar Contatos</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold text-[#6e7191]">
                  <strong className="text-[#1e1e2f]">{targetContacts.length}</strong> contatos prontos para exportação
                </span>
                {hasActiveFilters && exportScope === 'filtered' && (
                  <span className="text-[10px] font-bold text-[#5c59e8] bg-[#ecebfa] px-2 py-0.5 rounded-full border border-[#5c59e8]/20">
                    Filtros ativos
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 divide-y divide-slate-100">
          
          {/* MENU 1: ESCOPO E SISTEMA DE FILTROS */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider">
                1. O que deseja exportar?
              </label>
              <button
                type="button"
                onClick={() => setShowFiltersSection(!showFiltersSection)}
                className="text-xs font-semibold text-[#5c59e8] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>{showFiltersSection ? 'Ocultar filtros' : 'Ajustar filtros'}</span>
              </button>
            </div>

            {/* Scope Selection Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setExportScope('filtered')}
                className={`p-3 text-xs font-bold rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'filtered'
                    ? 'bg-[#ecebfa] border-[#5c59e8] text-[#5c59e8] shadow-xs'
                    : 'bg-white border-slate-200 text-[#1e1e2f] hover:bg-slate-50'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider text-[#6e7191]">Com filtros aplicados</span>
                <span className="text-sm font-extrabold mt-1">
                  Filtrados ({filteredContacts.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setExportScope('all')}
                className={`p-3 text-xs font-bold rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'all'
                    ? 'bg-[#ecebfa] border-[#5c59e8] text-[#5c59e8] shadow-xs'
                    : 'bg-white border-slate-200 text-[#1e1e2f] hover:bg-slate-50'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider text-[#6e7191]">Base completa</span>
                <span className="text-sm font-extrabold mt-1">
                  Todos ({contacts.length})
                </span>
              </button>

              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => setExportScope('selected')}
                className={`p-3 text-xs font-bold rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  exportScope === 'selected'
                    ? 'bg-[#ecebfa] border-[#5c59e8] text-[#5c59e8] shadow-xs'
                    : selectedIds.size === 0
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                    : 'bg-white border-slate-200 text-[#1e1e2f] hover:bg-slate-50'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider text-[#6e7191]">Seleção manual</span>
                <span className="text-sm font-extrabold mt-1">
                  Selecionados ({selectedIds.size})
                </span>
              </button>
            </div>

            {/* PAINEL DE FILTROS: Palavra Chave, País, Estado, Cidade, Status */}
            {showFiltersSection && (
              <div className="bg-[#f8fafd] border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e1e2f] uppercase tracking-wider">
                    <Filter className="w-3.5 h-3.5 text-[#5c59e8]" />
                    <span>Filtros de Exportação</span>
                    {hasActiveFilters && (
                      <span className="text-[10px] font-bold text-[#5c59e8] bg-[#ecebfa] px-2 py-0.5 rounded-full border border-[#5c59e8]/20">
                        {filteredContacts.length} de {contacts.length}
                      </span>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {/* 1. Palavra Chave */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#6e7191] uppercase tracking-wider mb-1">
                      Palavra-Chave:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={filters.keyword}
                        onChange={(e) => updateFilter({ keyword: e.target.value })}
                        placeholder="Ex: Farmácia..."
                        className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border-field rounded-xl text-[#1e1e2f] placeholder-[#a0a3bd] transition-all"
                      />
                      <Search className="w-3.5 h-3.5 text-[#a0a3bd] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. País */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#6e7191] uppercase tracking-wider mb-1">
                      País:
                    </label>
                    <select
                      value={filters.country}
                      onChange={(e) => updateFilter({ country: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border-field rounded-xl text-[#1e1e2f] transition-all cursor-pointer"
                    >
                      <option value="all">Todos os países</option>
                      {metadata.countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Estado */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#6e7191] uppercase tracking-wider mb-1">
                      Estado:
                    </label>
                    <select
                      value={filters.state}
                      onChange={(e) => updateFilter({ state: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border-field rounded-xl text-[#1e1e2f] transition-all cursor-pointer"
                    >
                      <option value="all">Todos os estados</option>
                      {metadata.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Cidade */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#6e7191] uppercase tracking-wider mb-1">
                      Cidade:
                    </label>
                    {metadata.cities.length <= 15 ? (
                      <select
                        value={filters.city}
                        onChange={(e) => updateFilter({ city: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border-field rounded-xl text-[#1e1e2f] transition-all cursor-pointer"
                      >
                        <option value="">Todas as cidades</option>
                        {metadata.cities.map((ct) => (
                          <option key={ct} value={ct}>{ct}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          list="export-modal-cities-list"
                          value={filters.city}
                          onChange={(e) => updateFilter({ city: e.target.value })}
                          placeholder="Cidade..."
                          className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border-field rounded-xl text-[#1e1e2f] placeholder-[#a0a3bd] transition-all"
                        />
                        <MapPin className="w-3.5 h-3.5 text-[#a0a3bd] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <datalist id="export-modal-cities-list">
                          {metadata.cities.map((ct) => (
                            <option key={ct} value={ct} />
                          ))}
                        </datalist>
                      </div>
                    )}
                  </div>

                  {/* 5. Status */}
                  <div>
                    <label className="block text-[10px] font-bold text-[#6e7191] uppercase tracking-wider mb-1">
                      Status:
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e: any) => updateFilter({ status: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border-field rounded-xl text-[#1e1e2f] transition-all cursor-pointer"
                    >
                      <option value="all">Todos os status</option>
                      <option value="Pendente">Pendentes</option>
                      <option value="Enviado">Enviados</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MENU 2: FORMATOS DE ARQUIVO (DOWNLOAD) */}
          <div className="pt-5 space-y-3">
            <label className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider">
              2. Formatos de Arquivo para Download
            </label>

            <div className="space-y-3">
              {/* Option 1: CSV / Excel */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1e1e2f]">
                      Planilha Excel / CSV (.csv)
                    </h4>
                    <p className="text-[11px] text-[#6e7191] mt-0.5">
                      Codificado em UTF-8 com BOM (acentos perfeitos no Excel, LibreOffice e Sheets).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto">
                  <div className="flex items-center gap-1.5 text-xs text-[#6e7191] shrink-0">
                    <span className="text-[11px] font-semibold">Separador:</span>
                    <select
                      value={csvDelimiter}
                      onChange={(e) => setCsvDelimiter(e.target.value as any)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 font-medium cursor-pointer"
                      title="Separador CSV"
                    >
                      <option value=";">Ponto e vírgula (;)</option>
                      <option value=",">Vírgula (,)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Planilha</span>
                  </button>
                </div>
              </div>

              {/* Option 2: JSON */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5c59e8] flex items-center justify-center shrink-0 border border-indigo-100">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1e1e2f]">
                      Arquivo JSON (.json)
                    </h4>
                    <p className="text-[11px] text-[#6e7191] mt-0.5">
                      Estrutura completa em formato JSON para desenvolvedores, APIs e integrações CRM.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full sm:w-auto px-4 py-2 bg-[#5c59e8] hover:bg-[#4d4ac7] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* MENU 3: ÁREA DE TRANSFERÊNCIA (AÇÕES RÁPIDAS) */}
          <div className="pt-5 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider">
                3. Área de Transferência (Copiar sem Baixar)
              </label>
              <p className="text-[11px] text-[#6e7191] mt-0.5">
                Copie rapidamente os dados de {targetContacts.length} contatos para uso imediato
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopyPhones}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#5c59e8]/50 hover:bg-slate-50/80 transition-all cursor-pointer text-left shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#1e1e2f]">Copiar WhatsApp</span>
                    <span className="block text-[10px] text-[#6e7191]">{validPhonesCount} números válidos</span>
                  </div>
                </div>
                {copiedType === 'phones' ? (
                  <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <Check className="w-3.5 h-3.5" /> Copiado!
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#5c59e8]">Copiar</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyTable}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#5c59e8]/50 hover:bg-slate-50/80 transition-all cursor-pointer text-left shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#1e1e2f]">Copiar Tabela</span>
                    <span className="block text-[10px] text-[#6e7191]">Colar direto no Excel/Sheets</span>
                  </div>
                </div>
                {copiedType === 'table' ? (
                  <span className="text-xs font-bold text-emerald-600 inline-flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                    <Check className="w-3.5 h-3.5" /> Copiado!
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#5c59e8]">Copiar</span>
                )}
              </button>
            </div>
          </div>

          {/* MENU 4: BACKUP COMPLETO E RESTAURAÇÃO */}
          <div className="pt-5 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider">
                4. Backup Completo e Restauração
              </label>
              <p className="text-[11px] text-[#6e7191] mt-0.5">
                Salve ou restaure todo o histórico de contatos, anotações, favoritos e status de disparo
              </p>
            </div>

            {backupMessage && (
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-[#5c59e8]" />
                <span>{backupMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleDownloadFullBackup}
                className="inline-flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Database className="w-4 h-4 text-slate-300" />
                <span>Baixar Backup Completo (.json)</span>
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
                  className="w-full inline-flex items-center justify-center gap-2 p-3 bg-white hover:bg-slate-50 text-[#1e1e2f] rounded-2xl text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-xs"
                >
                  <Upload className="w-4 h-4 text-[#6e7191]" />
                  <span>Restaurar Backup (.json)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-[#6e7191]">
            Exportando <strong className="text-[#1e1e2f]">{targetContacts.length}</strong> de {contacts.length} empresas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
