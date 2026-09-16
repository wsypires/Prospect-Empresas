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
    <header className="bg-white/95 border-b border-[#e2e2e4] px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 sticky top-0 z-30 shadow-[0_4px_20px_-4px_rgba(26,26,26,0.05)] backdrop-blur-md">
      {/* Top row: Brand & Title */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-2.5">
          {/* Brand Icon in Warm Gold & Charcoal */}
          <div className="w-10 h-10 rounded-2xl bg-[#ffb800] text-[#1a1a1a] flex items-center justify-center shadow-md shadow-[#ffb800]/20 border border-[#ffb800]/40 shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1a1a1a]" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 7v10l8 5 8-5V7l-8-5zm0 3.2L18 8.7v6.6L12 18.8 6 15.3V8.7L12 5.2z" />
              <path d="M12 7l4 2.5v5L12 17l-4-2.5v-5L12 7z" fillOpacity="0.75" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#1a1c1d]">Encontre Empresas</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#fff7db] text-[#7c5800] tracking-wider border border-[#ffb800]/40 shadow-2xs">
                PROSPECT
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#6e6e77] leading-none mt-0.5">
              Prospecção Comercial B2B
            </p>
          </div>
        </div>
      </div>

      {/* Central Instant Filter Search Input */}
      <div className="w-full md:max-w-md flex-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6e6e77]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchFilterText}
            onChange={(e) => onSearchFilterChange?.(e.target.value)}
            placeholder="Filtrar por nome, nicho ou endereço..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white hover:bg-[#f3f3f5] focus:bg-white border border-[#e2e2e4] focus:border-[#ffb800] focus:ring-3 focus:ring-[#ffb800]/25 rounded-full text-[#1a1c1d] placeholder-[#9e9ea7] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="flex md:hidden items-center gap-2 w-full pt-0.5">
        <button
          type="button"
          id="mobile-btn-export"
          onClick={onOpenExportModal}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1a1a1a] hover:bg-[#2f3132] active:scale-98 text-white font-bold text-xs rounded-full border border-white/20 transition-all cursor-pointer min-h-[44px] shadow-sm"
          title="Exportar"
        >
          <Download className="w-4 h-4 text-[#ffb800]" />
          <span>Exportar</span>
        </button>

        <button
          type="button"
          id="mobile-btn-whatsapp-template"
          onClick={onOpenWhatsAppTemplateModal}
          className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-[#f3f3f5] hover:bg-[#e8e8ea] active:scale-98 text-[#1a1c1d] font-bold text-xs rounded-full border border-[#e2e2e4] shadow-2xs transition-all cursor-pointer min-h-[44px]"
          title="Configurar Mensagem"
        >
          <MessageCircle className="w-4 h-4 text-[#7c5800]" />
          <span className="truncate">Mensagem</span>
        </button>
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden md:flex items-center gap-2.5 justify-end">
        {/* Menu: Configurar Mensagem */}
        <button
          type="button"
          id="btn-whatsapp-template-header"
          onClick={onOpenWhatsAppTemplateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1a1c1d] bg-[#f3f3f5] hover:bg-[#e8e8ea] rounded-full transition-all cursor-pointer border border-[#e2e2e4] shadow-2xs hover:shadow-xs active:scale-98"
          title="Configurar Mensagem"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#7c5800]" />
          <span>Configurar Mensagem</span>
        </button>

        {/* Export Button */}
        {totalContacts > 0 && (
          <button
            type="button"
            id="btn-export-header"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2f3132] text-white font-bold text-xs rounded-full border border-[#1a1a1a] transition-all cursor-pointer shadow-sm active:scale-98"
            title="Exportar"
          >
            <Download className="w-3.5 h-3.5 text-[#ffb800]" />
            <span>Exportar</span>
          </button>
        )}

        {/* API Key Modal Toggle */}
        <button
          type="button"
          id="btn-api-key-header"
          onClick={onOpenApiKeyModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#7c5800] bg-[#fff7db] hover:bg-[#ffdea8]/80 rounded-full transition-colors cursor-pointer border border-[#ffb800]/40 shadow-2xs"
          title="Configurar Chave Google Places"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#7c5800]" />
          <span className="font-medium">Places API:</span>
          <span className="font-mono text-[11px] font-bold">
            {maskedKey || (hasApiKey ? 'Ativa' : 'Configurar')}
          </span>
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
        </button>
      </div>
    </header>
  );
};
