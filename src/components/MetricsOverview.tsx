import React from 'react';
import { Users, MessageCircle, Globe, Star, Download, CheckSquare, Map, Table, LayoutGrid } from 'lucide-react';
import { PlaceContact } from '../types';

interface MetricsOverviewProps {
  contacts: PlaceContact[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenExportModal: () => void;
  activeView: 'table' | 'cards' | 'map';
  onViewChange: (view: 'table' | 'cards' | 'map') => void;
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
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover-elevate transition-all space-y-4">
      {/* Top Metrics Row with Refined Blue-to-White Gradient & Transparency Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Contatos */}
        <div className="group relative p-4 bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white/70 backdrop-blur-sm border border-blue-100/80 hover:border-blue-200/90 rounded-2xl shadow-xs hover:shadow-[0_8px_24px_-4px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 hover:from-blue-100/70 hover:to-white/90 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-blue-900 transition-colors">
              Contatos
            </span>
            <div className="w-7 h-7 rounded-xl bg-white/90 backdrop-blur-xs border border-blue-100/90 shadow-2xs flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {total}
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
            Empresas Carregadas
          </span>
        </div>

        {/* Metric 2: Com WhatsApp */}
        <div className="group relative p-4 bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white/70 backdrop-blur-sm border border-blue-100/80 hover:border-blue-200/90 rounded-2xl shadow-xs hover:shadow-[0_8px_24px_-4px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 hover:from-blue-100/70 hover:to-white/90 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-blue-900 transition-colors">
              WhatsApp
            </span>
            <div className="w-7 h-7 rounded-xl bg-white/90 backdrop-blur-xs border border-blue-100/90 shadow-2xs flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {withWhatsapp}
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block truncate">
            {total > 0 ? `${Math.round((withWhatsapp / total) * 100)}% com link direto` : 'Prontos para contato'}
          </span>
        </div>

        {/* Metric 3: Com Website */}
        <div className="group relative p-4 bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white/70 backdrop-blur-sm border border-blue-100/80 hover:border-blue-200/90 rounded-2xl shadow-xs hover:shadow-[0_8px_24px_-4px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 hover:from-blue-100/70 hover:to-white/90 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-blue-900 transition-colors">
              Websites
            </span>
            <div className="w-7 h-7 rounded-xl bg-white/90 backdrop-blur-xs border border-blue-100/90 shadow-2xs flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
              <Globe className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {withWebsite}
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
            Páginas oficiais
          </span>
        </div>

        {/* Metric 4: Avaliação Média */}
        <div className="group relative p-4 bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white/70 backdrop-blur-sm border border-blue-100/80 hover:border-blue-200/90 rounded-2xl shadow-xs hover:shadow-[0_8px_24px_-4px_rgba(59,130,246,0.12)] hover:-translate-y-0.5 hover:from-blue-100/70 hover:to-white/90 transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-blue-900 transition-colors">
              Nota Média
            </span>
            <div className="w-7 h-7 rounded-xl bg-white/90 backdrop-blur-xs border border-blue-100/90 shadow-2xs flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {avgRating}
          </div>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
            Avaliação no Google
          </span>
        </div>
      </div>

      {/* Control Strip: Selection, Views & Export CTA */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Multi-selection status */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs text-[#5c59e8] bg-[#ecebfa] hover:bg-[#dedcf9] rounded-xl cursor-pointer transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          <span className="text-[#6e7191] font-medium text-xs">
            {selectedIds.size > 0 ? (
              <span className="text-[#5c59e8] font-bold">{selectedIds.size} selecionado(s)</span>
            ) : (
              'Nenhum selecionado (exporta todos)'
            )}
          </span>
        </div>

        {/* Right: View Toggles & Export Button */}
        <div className="flex items-center gap-2 justify-end">
          {/* View Mode Toggle: Table, Cards, Map */}
          <div className="flex items-center bg-[#f3f5fa] p-1 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => onViewChange('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'table'
                  ? 'bg-white text-[#5c59e8] shadow-xs'
                  : 'text-[#6e7191] hover:text-[#1e1e2f]'
              }`}
              title="Visualização em Tabela"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Tabela</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'cards'
                  ? 'bg-white text-[#5c59e8] shadow-xs'
                  : 'text-[#6e7191] hover:text-[#1e1e2f]'
              }`}
              title="Visualização em Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cards</span>
            </button>
            <button
              type="button"
              onClick={() => onViewChange('map')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'map'
                  ? 'bg-white text-[#5c59e8] shadow-xs'
                  : 'text-[#6e7191] hover:text-[#1e1e2f]'
              }`}
              title="Visualização em Mapa Interativo"
            >
              <Map className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Mapa</span>
            </button>
          </div>

          {/* Export Action Button */}
          <button
            type="button"
            id="btn-open-export"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5c59e8] hover:bg-[#4f4cd9] text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
