import React from 'react';
import { Search, KeyRound, Download, MessageCircle } from 'lucide-react';

interface HeaderProps {
  hasApiKey: boolean;
  maskedKey: string;
  onOpenApiKeyModal: () => void;
  searchFilterText?: string;
  onSearchFilterChange?: (text: string) => void;
  totalContacts: number;
  selectedCount: number;
  onOpenExportModal: () => void;
  onOpenWhatsAppTemplateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasApiKey,
  maskedKey,
  onOpenApiKeyModal,
  searchFilterText = '',
  onSearchFilterChange,
  totalContacts,
  selectedCount,
  onOpenExportModal,
  onOpenWhatsAppTemplateModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-100/90 px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs backdrop-blur-md">
      {/* Brand & Title */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          {/* SUCCESS Geometric Colibri / Wings Visual Icon */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#5c59e8] to-[#3a34a5] text-white flex items-center justify-center shadow-md shadow-[#5c59e8]/25 shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 3.2L18 8.7v6.6L12 18.8 6 15.3V8.7L12 5.2z" />
              <path d="M12 7l4 2.5v5L12 17l-4-2.5v-5L12 7z" fillOpacity="0.75" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wider text-[#1e1e2f]">Encontre Empresas</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#ecebfa] text-[#5c59e8] tracking-widest border border-[#5c59e8]/20">
                PROSPECT
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#6e7191] leading-none mt-0.5">
              Extração de Empresas Google Places & WhatsApp
            </p>
          </div>
        </div>

        {/* Mobile Quick Action Buttons */}
        <div className="md:hidden flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenWhatsAppTemplateModal}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200/70"
            title="Configurar Mensagem WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Msg</span>
          </button>
          <button
            type="button"
            onClick={onOpenApiKeyModal}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5c59e8] bg-[#ecebfa] px-2.5 py-1 rounded-xl"
          >
            <KeyRound className="w-3 h-3" />
            API
          </button>
        </div>
      </div>

      {/* Central Instant Filter Search Input */}
      <div className="w-full md:max-w-md flex-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a3bd]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchFilterText}
            onChange={(e) => onSearchFilterChange?.(e.target.value)}
            placeholder="Filtrar instantaneamente resultados por nome, nicho, endereço..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-[#f3f5fa] hover:bg-[#edf0f7] focus:bg-white border border-slate-200/60 focus:border-[#5c59e8] rounded-2xl text-[#1e1e2f] placeholder-[#a0a3bd] focus:outline-hidden focus:ring-2 focus:ring-[#5c59e8]/15 transition-all"
          />
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
        {/* Menu: Configurar Mensagem WhatsApp */}
        <button
          type="button"
          id="btn-whatsapp-template-header"
          onClick={onOpenWhatsAppTemplateModal}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/90 rounded-2xl transition-all cursor-pointer border border-emerald-200/80 shadow-2xs hover:shadow-xs active:scale-98"
          title="Configurar modelo de mensagem do WhatsApp ao clicar em Chamar"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
          <span className="hidden sm:inline">Mensagem</span>
          <span>WhatsApp</span>
        </button>

        {/* Export Excel / CSV Button */}
        {totalContacts > 0 && (
          <button
            type="button"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#5c59e8] hover:bg-[#4f4cd9] text-white font-bold text-xs rounded-2xl shadow-xs cursor-pointer transition-colors"
            title="Exportar contatos para Excel ou CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        )}

        {/* API Key Modal Toggle */}
        <button
          type="button"
          id="btn-api-key-header"
          onClick={onOpenApiKeyModal}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#5c59e8] bg-[#ecebfa] hover:bg-[#dedcf9] rounded-2xl transition-colors cursor-pointer border border-[#5c59e8]/20"
          title="Configurar Chave Google Places"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#5c59e8]" />
          <span className="font-medium">Google Places:</span>
          <span className="font-mono text-[11px] font-bold">
            {maskedKey || (hasApiKey ? 'Conectada' : 'Configurar')}
          </span>
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
        </button>
      </div>
    </header>
  );
};
