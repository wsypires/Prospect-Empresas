import React, { useState, useMemo } from 'react';
import {
  MessageCircle,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Search,
  Building,
  Star,
  Globe,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Tag,
  StickyNote,
} from 'lucide-react';
import { PlaceContact, ContactFilters, DEFAULT_CONTACT_FILTERS } from '../types';
import { formatCnpj } from '../utils/exportUtils';
import { formatWhatsAppUrl } from '../utils/whatsappUtils';
import {
  applyContactFilters,
  hasActiveContactFilters,
  getFilterMetadata,
} from '../utils/filterUtils';

interface ContactsTableProps {
  contacts: PlaceContact[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onOpenCnpjModal: (contact: PlaceContact) => void;
  onUpdateStatus: (id: string, status: 'Enviado' | 'Pendente') => void;
  onBulkUpdateStatus?: (status: 'Enviado' | 'Pendente') => void;
  onToggleFavorite?: (id: string) => void;
  onOpenNoteModal?: (contact: PlaceContact) => void;
  whatsappTemplate?: string;
  filters?: ContactFilters;
  onFiltersChange?: (filters: ContactFilters) => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onOpenCnpjModal,
  onUpdateStatus,
  onBulkUpdateStatus,
  onToggleFavorite,
  onOpenNoteModal,
  whatsappTemplate,
  filters,
  onFiltersChange,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Column Filter States (Only: Palavra Chave, País, Estado, Cidade, Status)
  const [showColumnFilters, setShowColumnFilters] = useState(true);
  const [localFilters, setLocalFilters] = useState<ContactFilters>(DEFAULT_CONTACT_FILTERS);
  const currentFilters = filters || localFilters;

  const updateFilter = (partial: Partial<ContactFilters>) => {
    const next = { ...currentFilters, ...partial };
    if (onFiltersChange) {
      onFiltersChange(next);
    } else {
      setLocalFilters(next);
    }
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    if (onFiltersChange) {
      onFiltersChange(DEFAULT_CONTACT_FILTERS);
    } else {
      setLocalFilters(DEFAULT_CONTACT_FILTERS);
    }
    setCurrentPage(1);
  };

  const hasActiveFilters = hasActiveContactFilters(currentFilters);
  const metadata = useMemo(() => getFilterMetadata(contacts), [contacts]);

  // Pagination State (maximum 100 per page)
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Filter contacts by the 5 exact fields: Palavra Chave, País, Estado, Cidade, Status
  const filteredContacts = useMemo(() => {
    return applyContactFilters(contacts, currentFilters);
  }, [contacts, currentFilters]);

  // Reset page if page is out of bounds
  const totalItems = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Paginated contacts slice
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedContacts = useMemo(() => {
    return filteredContacts.slice(startIndex, endIndex);
  }, [filteredContacts, startIndex, endIndex]);

  // Selected contacts in the current view or across all
  const selectedContacts = useMemo(() => {
    return contacts.filter((c) => selectedIds.has(c.id));
  }, [contacts, selectedIds]);

  const allOnPageSelected =
    paginatedContacts.length > 0 &&
    paginatedContacts.every((c) => selectedIds.has(c.id));

  const handleToggleSelectAllOnPage = () => {
    if (allOnPageSelected) {
      paginatedContacts.forEach((c) => {
        if (selectedIds.has(c.id)) {
          onToggleSelect(c.id);
        }
      });
    } else {
      paginatedContacts.forEach((c) => {
        if (!selectedIds.has(c.id)) {
          onToggleSelect(c.id);
        }
      });
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Search className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Nenhum contato encontrado</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Tente alterar os termos de busca, pesquisar em cidades vizinhas ou ajustar os filtros.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border-glow-card overflow-hidden flex flex-col transition-all">
      {/* Top Table Toolbar: Filter toggle & Multi-share CTA */}
      <div className="p-3.5 sm:p-4 bg-[#f8fafd] border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowColumnFilters(!showColumnFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-colors cursor-pointer ${
              showColumnFilters
                ? 'bg-[#ecebfa] border-[#5c59e8]/30 text-[#5c59e8]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-[#5c59e8]" />
            <span>{showColumnFilters ? 'Ocultar filtros' : 'Filtros'}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#5c59e8] inline-block" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 bg-white border border-slate-200 rounded-xl cursor-pointer"
              title="Limpar filtros"
            >
              <X className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}

          <span className="text-[#6e7191] text-xs">
            <strong className="text-[#1e1e2f]">{filteredContacts.length}</strong> de {contacts.length} empresas
          </span>
        </div>

        {/* Selected Counter & Bulk Status Quick Action */}
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#5c59e8] bg-[#ecebfa] px-2.5 py-1 rounded-xl border border-[#5c59e8]/20">
              {selectedIds.size} selecionado(s)
            </span>
            {onBulkUpdateStatus && (
              <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => onBulkUpdateStatus('Enviado')}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 rounded-lg cursor-pointer transition-colors"
                  title="Marcar como Enviado"
                >
                  ✓ Enviado
                </button>
                <button
                  type="button"
                  onClick={() => onBulkUpdateStatus('Pendente')}
                  className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 rounded-lg cursor-pointer transition-colors ml-1"
                  title="Marcar como Pendente"
                >
                  ⏳ Pendente
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mobile quick "Selecionar todos desta página" */}
        <div className="md:hidden w-full pt-2 border-t border-slate-200/70 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-[#1e1e2f] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allOnPageSelected}
              onChange={handleToggleSelectAllOnPage}
              className="rounded text-[#5c59e8] focus:ring-[#5c59e8] w-4 h-4 border-slate-300 cursor-pointer"
            />
            <span>Selecionar página ({paginatedContacts.length})</span>
          </label>
          <span className="text-[11px] text-[#6e7191]">
            {selectedIds.size} selecionado(s)
          </span>
        </div>
      </div>

      {/* PAINEL DE FILTROS UNIFICADO: Palavra-Chave, País, Estado, Cidade, Status */}
      {showColumnFilters && (
        <div className="p-3.5 sm:p-4 bg-[#f8fafd] border-b border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-[#1e1e2f] uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#5c59e8]" />
                Filtros
              </span>
              <span className="text-[11px] font-semibold text-[#6e7191] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {filteredContacts.length} de {contacts.length} empresas
              </span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Limpar filtros</span>
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
                  value={currentFilters.keyword}
                  onChange={(e) => updateFilter({ keyword: e.target.value })}
                  placeholder="Ex: Farmácia, Dentista..."
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
                value={currentFilters.country}
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
                value={currentFilters.state}
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
                  value={currentFilters.city}
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
                    list="contacts-table-cities-list"
                    value={currentFilters.city}
                    onChange={(e) => updateFilter({ city: e.target.value })}
                    placeholder="Cidade..."
                    className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-white border-field rounded-xl text-[#1e1e2f] placeholder-[#a0a3bd] transition-all"
                  />
                  <MapPin className="w-3.5 h-3.5 text-[#a0a3bd] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <datalist id="contacts-table-cities-list">
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
                value={currentFilters.status}
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

      {/* VERSÃO MOBILE: LISTA ADAPTADA COM 100% DAS INFORMAÇÕES VISÍVEIS SEM SCROLL LATERAL */}
      <div className="md:hidden p-3 space-y-3 bg-[#f8fafd]">
        {paginatedContacts.map((contact) => {
          const isSelected = selectedIds.has(contact.id);
          const hasPhone = Boolean(contact.whatsappPhone || contact.nationalPhone);
          const hasWhatsapp = Boolean(contact.whatsappUrl);
          const displayPhone = contact.nationalPhone || contact.internationalPhone || 'Sem telefone';

          return (
            <div
              key={contact.id}
              className={`bg-white rounded-2xl border p-4 shadow-2xs transition-all space-y-3 ${
                isSelected
                  ? 'border-[#5c59e8] ring-2 ring-[#5c59e8]/20 bg-[#ecebfa]/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Topo do Card: Checkbox, Palavra-Chave, Nome e Link do Website */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(contact.id)}
                  className="mt-1 rounded text-[#5c59e8] focus:ring-[#5c59e8] w-4 h-4 border-slate-300 cursor-pointer shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {contact.keyword && (
                    <div className="mb-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ecebfa] text-[#5c59e8] border border-[#5c59e8]/20">
                        <Tag className="w-2.5 h-2.5 text-[#5c59e8]" />
                        {contact.keyword}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-extrabold text-sm text-[#1e1e2f] leading-snug break-words">
                        {contact.name}
                      </h4>
                      {onToggleFavorite && (
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(contact.id)}
                          className="text-slate-300 hover:text-amber-500 cursor-pointer transition-colors shrink-0"
                          title={contact.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              contact.isFavorite
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-300 hover:text-amber-400'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    {contact.website && (
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-[#5c59e8] p-1 rounded-lg hover:bg-slate-100 shrink-0 transition-colors"
                        title="Acessar Website"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Anotação CRM no mobile */}
                  {contact.notes ? (
                    <div
                      onClick={() => onOpenNoteModal?.(contact)}
                      className="mt-1.5 bg-amber-50/90 border border-amber-200/80 rounded-xl p-1.5 text-[11px] text-amber-900 cursor-pointer hover:bg-amber-100 flex items-start gap-1"
                      title="Editar anotação"
                    >
                      <StickyNote className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                      <p className="line-clamp-1 font-medium">{contact.notes}</p>
                    </div>
                  ) : onOpenNoteModal ? (
                    <button
                      type="button"
                      onClick={() => onOpenNoteModal(contact)}
                      className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#6e7191] hover:text-[#5c59e8] font-medium cursor-pointer"
                    >
                      <StickyNote className="w-2.5 h-2.5 text-[#a0a3bd]" />
                      <span>+ Nota</span>
                    </button>
                  ) : null}

                  {/* Badges: Tipo da Empresa e Horário de Funcionamento */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px]">
                    {contact.types && contact.types.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#6e7191] font-medium capitalize">
                        {contact.types[0].replace(/_/g, ' ')}
                      </span>
                    )}
                    {contact.isOpenNow !== null && contact.isOpenNow !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-md font-medium text-[10px] ${
                          contact.isOpenNow
                            ? 'bg-[#e8fbf2] text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {contact.isOpenNow ? 'Aberto' : 'Fechado'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção CNPJ */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <span className="text-[11px] font-bold text-[#6e7191] uppercase tracking-wider">CNPJ:</span>
                {contact.cnpj ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1e1e2f] bg-slate-100 px-2 py-0.5 rounded-md">
                      {formatCnpj(contact.cnpj)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenCnpjModal(contact)}
                      className="text-[11px] font-bold text-[#5c59e8] hover:underline cursor-pointer"
                    >
                      Detalhes
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 italic">Não cadastrado</span>
                    <button
                      type="button"
                      onClick={() => onOpenCnpjModal(contact)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-[#ecebfa] text-[#5c59e8] rounded-xl hover:bg-[#dedcf9] cursor-pointer transition-colors"
                    >
                      <Search className="w-3 h-3" />
                      Consultar
                    </button>
                  </div>
                )}
              </div>

              {/* Seção WhatsApp e Telefone com Botão de Ação Direta */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-[#6e7191] uppercase tracking-wider">Contato:</span>
                  {hasPhone && (
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#1e1e2f] font-semibold">
                      <span>{displayPhone}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(contact.id, displayPhone)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
                        title="Copiar número"
                      >
                        {copiedId === contact.id ? (
                          <Check className="w-3.5 h-3.5 text-[#10b981]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {hasPhone ? (
                  <div className="flex items-center gap-2 pt-0.5">
                    {hasWhatsapp ? (
                      <a
                        href={formatWhatsAppUrl(contact, whatsappTemplate) || contact.whatsappUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <a
                        href={`tel:${contact.nationalPhone || contact.internationalPhone}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Ligar</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs italic block">Sem telefone</span>
                )}
              </div>

              {/* Seção Endereço Completo & Link Google Maps */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[11px] font-bold text-[#6e7191] uppercase tracking-wider block">Endereço:</span>
                <p className="text-xs text-[#1e1e2f] leading-relaxed break-words">
                  {contact.address}
                </p>
                {contact.googleMapsUrl && (
                  <a
                    href={contact.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5c59e8] hover:text-[#3a34a5] pt-0.5 transition-colors"
                  >
                    <MapPin className="w-3 h-3 text-[#5c59e8]" />
                    <span>Google Maps</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Seção Avaliação Google & Ações de Compartilhamento */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <div>
                  {contact.rating !== null ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 font-bold text-[#1e1e2f]">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{contact.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-[11px] text-[#6e7191]">
                        ({contact.userRatingCount})
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">Sem avaliação</span>
                  )}
                </div>

                {/* Tag de Seleção de Status (Enviado / Pendente) */}
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(contact.id, 'Pendente')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                        (contact.outreachStatus || 'Pendente') === 'Pendente'
                          ? 'bg-amber-500 text-white shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Marcar como Pendente"
                    >
                      Pendente
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(contact.id, 'Enviado')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                        contact.outreachStatus === 'Enviado'
                          ? 'bg-emerald-600 text-white shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Marcar como Enviado"
                    >
                      Enviado
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VERSÃO DESKTOP: TABELA COMPLETA COM SCROLL HORIZONTAL E FILTROS EM CADA COLUNA */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            {/* Main Header */}
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th scope="col" className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={handleToggleSelectAllOnPage}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
                  title="Selecionar página"
                />
              </th>
              {/* NOVA COLUNA DA PALAVRA CHAVE */}
              <th scope="col" className="p-3 min-w-[130px]">
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span>Palavra-chave</span>
                </div>
              </th>
              <th scope="col" className="p-3 min-w-[200px]">
                Empresa
              </th>
              <th scope="col" className="p-3 min-w-[150px]">
                CNPJ
              </th>
              <th scope="col" className="p-3 min-w-[180px]">
                WhatsApp / Telefone
              </th>
              <th scope="col" className="p-3 min-w-[200px]">
                Endereço
              </th>
              <th scope="col" className="p-3 min-w-[100px]">
                Avaliação
              </th>
              <th scope="col" className="p-3 min-w-[150px] text-center">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginatedContacts.map((contact) => {
              const isSelected = selectedIds.has(contact.id);
              const hasPhone = Boolean(contact.whatsappPhone || contact.nationalPhone);
              const hasWhatsapp = Boolean(contact.whatsappUrl);
              const displayPhone = contact.nationalPhone || contact.internationalPhone || 'Sem telefone';

              return (
                <tr
                  key={contact.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(contact.id)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 cursor-pointer"
                    />
                  </td>

                  {/* COLUNA PALAVRA-CHAVE */}
                  <td className="p-3">
                    {contact.keyword ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[130px] truncate" title={contact.keyword}>
                        {contact.keyword}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">-</span>
                    )}
                  </td>

                  {/* Nome da Empresa & Nicho */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 text-sm leading-tight flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span>{contact.name}</span>
                          {onToggleFavorite && (
                            <button
                              type="button"
                              onClick={() => onToggleFavorite(contact.id)}
                              className="text-slate-300 hover:text-amber-500 cursor-pointer transition-colors"
                              title={contact.isFavorite ? 'Remover dos favoritos' : 'Marcar como favorito'}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  contact.isFavorite
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300 hover:text-amber-400'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                        {contact.website && (
                          <a
                            href={contact.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-indigo-600 p-0.5"
                            title="Acessar Website"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Anotação CRM no desktop */}
                      {contact.notes ? (
                        <div
                          onClick={() => onOpenNoteModal?.(contact)}
                          className="bg-amber-50/90 border border-amber-200/80 rounded-lg px-2 py-1 text-[11px] text-amber-900 cursor-pointer hover:bg-amber-100 flex items-center gap-1.5 w-fit max-w-xs"
                          title="Editar anotação"
                        >
                          <StickyNote className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate font-medium">{contact.notes}</span>
                        </div>
                      ) : onOpenNoteModal ? (
                        <button
                          type="button"
                          onClick={() => onOpenNoteModal(contact)}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          <StickyNote className="w-2.5 h-2.5" />
                          <span>+ Nota</span>
                        </button>
                      ) : null}

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {contact.types && contact.types.length > 0 && (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium capitalize">
                            {contact.types[0].replace(/_/g, ' ')}
                          </span>
                        )}
                        {contact.isOpenNow !== null && contact.isOpenNow !== undefined && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-medium ${
                              contact.isOpenNow
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {contact.isOpenNow ? 'Aberto' : 'Fechado'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* CNPJ */}
                  <td className="p-3">
                    {contact.cnpj ? (
                      <div className="space-y-1">
                        <div className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded-md inline-flex items-center gap-1.5">
                          <Building className="w-3 h-3 text-slate-500" />
                          <span>{formatCnpj(contact.cnpj)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onOpenCnpjModal(contact)}
                          className="block text-[11px] text-indigo-600 hover:underline cursor-pointer"
                        >
                          Detalhes
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 italic">Não cadastrado</span>
                        <button
                          type="button"
                          onClick={() => onOpenCnpjModal(contact)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Consultar CNPJ"
                        >
                          <Search className="w-3 h-3 text-slate-500" />
                          Consultar
                        </button>
                      </div>
                    )}
                  </td>

                  {/* WhatsApp & Telefone */}
                  <td className="p-3">
                    {hasPhone ? (
                      <div className="space-y-1.5">
                        {hasWhatsapp ? (
                          <a
                            href={formatWhatsAppUrl(contact, whatsappTemplate) || contact.whatsappUrl!}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-98 cursor-pointer"
                            title="Iniciar conversa no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <a
                            href={`tel:${contact.nationalPhone || contact.internationalPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Ligar</span>
                          </a>
                        )}

                        <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
                          <span>{displayPhone}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(contact.id, displayPhone)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
                            title="Copiar número"
                          >
                            {copiedId === contact.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Sem telefone</span>
                    )}
                  </td>

                  {/* Endereço Completo & Google Maps Link */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <p className="text-slate-700 text-xs leading-relaxed max-w-sm">
                        {contact.address}
                      </p>
                      {contact.googleMapsUrl && (
                        <a
                          href={contact.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <MapPin className="w-3 h-3 text-indigo-500" />
                          Google Maps <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Avaliação */}
                  <td className="p-3">
                    {contact.rating !== null ? (
                      <div>
                        <div className="flex items-center gap-1 text-slate-900 font-bold text-xs">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{contact.rating.toFixed(1)}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          ({contact.userRatingCount})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>

                  {/* Status Tag de Seleção (Enviado / Pendente) */}
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(contact.id, 'Pendente')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                          (contact.outreachStatus || 'Pendente') === 'Pendente'
                            ? 'bg-amber-500 text-white shadow-xs font-black'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Marcar como Pendente"
                      >
                        Pendente
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(contact.id, 'Enviado')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all cursor-pointer ${
                          contact.outreachStatus === 'Enviado'
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Marcar como Enviado"
                      >
                        Enviado
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO COM MÁXIMO DE 100 EMPRESAS POR PÁGINA (Página 1, 2, 3, 4...) */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        {/* Left: Summary & Page Size Selector (max 100) */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto">
          <span className="text-[11px] sm:text-xs">
            Mostrando <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> a <strong>{endIndex}</strong> de <strong>{totalItems}</strong>
          </span>

          <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-200">
            <label htmlFor="select-page-size" className="text-slate-500 whitespace-nowrap text-[11px] sm:text-xs">
              Por página:
            </label>
            <select
              id="select-page-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 cursor-pointer text-xs"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Right: Page Navigation (Página 1, 2, 3, 4...) */}
        <div className="flex items-center justify-center gap-1 w-full sm:w-auto overflow-x-auto py-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 shrink-0"
            title="Primeira página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 shrink-0"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Direct Page Number Buttons (Página 1, 2, 3, 4...) */}
          <div className="flex items-center gap-1 px-1 shrink-0">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and window around current page
                if (p === 1 || p === totalPages) return true;
                return Math.abs(p - currentPage) <= (window.innerWidth < 640 ? 1 : 2);
              })
              .map((pageNum, idx, arr) => {
                const prevNum = arr[idx - 1];
                const showEllipsis = prevNum && pageNum - prevNum > 1;

                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="px-0.5 text-slate-400">..</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-7 h-7 px-2 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
                        currentPage === pageNum
                          ? 'bg-[#5c59e8] text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 shrink-0"
            title="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 shrink-0"
            title="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
