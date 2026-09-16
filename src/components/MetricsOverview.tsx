import React from 'react';
import { Users, MessageCircle, Globe, Star, Download, CheckSquare, Table, LayoutGrid } from 'lucide-react';
import { PlaceContact } from '../types';

interface MetricsOverviewProps {
  contacts: PlaceContact[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenExportModal: () => void;
  activeView: 'table' | 'cards';
  onViewChange: (view: 'table' | 'cards') => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  contacts,
  selectedIds,
  onSelectAll,
  onClearSelection,
  onOpenExportModal,
  activeView,
  onViewChange,
}) => {
  const total = contacts.length;
  const withWhatsapp = contacts.filter((c) => Boolean(c.whatsappPhone)).length;
  const withWebsite = contacts.filter((c) => Boolean(c.website)).length;

  const ratedContacts = contacts.filter((c) => c.rating !== null);
  const avgRating =
    ratedContacts.length > 0
      ? (ratedContacts.reduce((acc, c) => acc + (c.rating || 0), 0) / ratedContacts.length).toFixed(1)
      : 'N/A';

  const allSelected = total > 0 && selectedIds.size === total;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border-glow-card transition-all space-y-4">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Total Contatos */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-br from-[#fff7db]/90 to-white border border-[#ffb800]/30 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c5800]">
              Total
            </span>
            <div className="w-7 h-7 rounded-xl bg-white border border-[#ffb800]/40 shadow-2xs flex items-center justify-center text-[#7c5800]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1a1c1d] tracking-tight">
            {total}
          </div>
          <span className="text-[11px] text-[#6e6e77] mt-0.5 block truncate">
            Empresas
          </span>
        </div>

        {/* Metric 2: Com WhatsApp */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-br from-emerald-50/70 to-white border border-emerald-200/70 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              WhatsApp
            </span>
            <div className="w-7 h-7 rounded-xl bg-white border border-emerald-200 shadow-2xs flex items-center justify-center text-emerald-600">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1a1c1d] tracking-tight">
            {withWhatsapp}
          </div>
          <span className="text-[11px] text-[#6e6e77] mt-0.5 block truncate">
            {total > 0 ? `${Math.round((withWhatsapp / total) * 100)}% com link` : 'Disponíveis'}
          </span>
        </div>

        {/* Metric 3: Com Website */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-br from-[#f3f3f5] to-white border border-[#e2e2e4] rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a1c1d]">
              Websites
            </span>
            <div className="w-7 h-7 rounded-xl bg-white border border-[#e2e2e4] shadow-2xs flex items-center justify-center text-[#1a1c1d]">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1a1c1d] tracking-tight">
            {withWebsite}
          </div>
          <span className="text-[11px] text-[#6e6e77] mt-0.5 block truncate">
            Páginas oficiais
          </span>
        </div>

        {/* Metric 4: Avaliação Média */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-br from-[#fff7db]/70 to-white border border-[#ffb800]/30 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7c5800]">
              Avaliação
            </span>
            <div className="w-7 h-7 rounded-xl bg-white border border-[#ffb800]/40 shadow-2xs flex items-center justify-center text-[#ffb800]">
              <Star className="w-3.5 h-3.5 fill-[#ffb800]" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1a1c1d] tracking-tight">
            {avgRating}
          </div>
          <span className="text-[11px] text-[#6e6e77] mt-0.5 block truncate">
            Média Google
          </span>
        </div>
      </div>

      {/* Control Strip: Selection, Views & Export CTA */}
      <div className="pt-2 border-t border-[#edeef0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Multi-selection status */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs text-[#7c5800] bg-[#fff7db] hover:bg-[#ffdea8] rounded-full border border-[#ffb800]/40 cursor-pointer transition-colors shadow-2xs"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#ffb800]" />
            {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
          </button>
          <span className="text-[#6e6e77] font-medium text-xs">
            {selectedIds.size > 0 ? (
              <span className="text-[#7c5800] font-bold">{selectedIds.size} selecionado(s)</span>
            ) : (
              'Todos selecionados para exportação'
            )}
          </span>
        </div>

        {/* Right: View Toggles & Export Button */}
        <div className="flex items-center gap-2 justify-end">
          {/* View Mode Toggle: Table or Cards */}
          <div className="flex items-center bg-[#f3f3f5] p-1 rounded-full border border-[#e2e2e4] shadow-2xs">
            <button
              type="button"
              onClick={() => onViewChange('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'table'
                  ? 'bg-white text-[#1a1c1d] shadow-xs'
                  : 'text-[#6e6e77] hover:text-[#1a1c1d]'
              }`}
              title="Visualização em Tabela"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'cards'
                  ? 'bg-white text-[#1a1c1d] shadow-xs'
                  : 'text-[#6e6e77] hover:text-[#1a1c1d]'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
          </div>

          {/* Export Action Button (Hidden on mobile to keep single mobile menu) */}
          <button
            type="button"
            id="btn-open-export"
            onClick={onOpenExportModal}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2f3132] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer transition-colors border border-[#1a1a1a]"
          >
            <Download className="w-3.5 h-3.5 text-[#ffb800]" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
