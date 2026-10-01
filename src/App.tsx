/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { MetricsOverview } from './components/MetricsOverview';
import { ContactsTable } from './components/ContactsTable';
import { ContactCard } from './components/ContactCard';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CnpjModal } from './components/CnpjModal';
import { NoteModal } from './components/NoteModal';
import { WhatsAppTemplateModal } from './components/WhatsAppTemplateModal';
import { MediaScraperModal } from './components/MediaScraperModal';
import { PlaceContact, SearchFormData, ContactFilters, DEFAULT_CONTACT_FILTERS } from './types';
import { getSavedWhatsAppTemplate, saveWhatsAppTemplate } from './utils/whatsappUtils';
import { applyContactFilters } from './utils/filterUtils';
import {
  loadSavedContacts,
  saveContacts,
  saveContactStatus,
  saveBulkStatuses,
  saveContactCnpj,
  saveContactNote,
  saveContactFavorite,
  saveContactSocials,
  mergeWithPersistedData,
  accumulateContacts,
  loadCustomApiKey,
  saveCustomApiKey,
  saveLastSearch,
  clearSavedData,
} from './utils/persistence';
import { AlertCircle, CheckCircle2, Loader2, Plus, Sparkles } from 'lucide-react';

export default function App() {
  // Contacts state initialized from robust localStorage persistence
  const [contacts, setContacts] = useState<PlaceContact[]>(() => loadSavedContacts());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQueryLabel, setLastQueryLabel] = useState<string>('');
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [lastSearchParams, setLastSearchParams] = useState<SearchFormData | null>(null);
  
  // View mode: table or cards
  const [activeView, setActiveView] = useState<'table' | 'cards'>('table');
  const [headerSearchText, setHeaderSearchText] = useState<string>('');
  const [contactFilters, setContactFilters] = useState<ContactFilters>(DEFAULT_CONTACT_FILTERS);

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCnpjModalOpen, setIsCnpjModalOpen] = useState<boolean>(false);
  const [contactForCnpj, setContactForCnpj] = useState<PlaceContact | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [contactForNote, setContactForNote] = useState<PlaceContact | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [isScraperModalOpen, setIsScraperModalOpen] = useState<boolean>(false);
  const [scraperContact, setScraperContact] = useState<PlaceContact | null>(null);

  const handleOpenScraper = (contact?: PlaceContact) => {
    setScraperContact(contact || null);
    setIsScraperModalOpen(true);
  };

  // WhatsApp Message Template state
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>(() => getSavedWhatsAppTemplate());

  const handleSaveWhatsAppTemplate = (newTemplate: string) => {
    setWhatsappTemplate(newTemplate);
    saveWhatsAppTemplate(newTemplate);
  };

  // API Key state: loads persisted custom key from localStorage or uses server config
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [maskedKey, setMaskedKey] = useState<string>('');
  const [customApiKey, setCustomApiKey] = useState<string>(() => loadCustomApiKey());

  // Check server API config on initial load
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApiKey) {
          setHasApiKey(true);
          if (data.maskedKey && !customApiKey) {
            setMaskedKey(data.maskedKey);
          }
        }
      })
      .catch((err) => console.error('Erro ao verificar API Google Places:', err));

    if (customApiKey) {
      setMaskedKey(`${customApiKey.slice(0, 6)}...${customApiKey.slice(-4)}`);
    }
  }, [customApiKey]);

  const performSearch = async (params: SearchFormData) => {
    setIsLoading(true);
    setError(null);
    const queryLabel = `${params.keyword} em ${params.city} - ${params.state}`;
    setLastQueryLabel(queryLabel);
    saveLastSearch(params);

    try {
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao buscar contatos no Google Places.');
      }

      let results: PlaceContact[] = data.places || [];

      // Apply client-side criteria if requested
      if (params.onlyWithWhatsapp) {
        results = results.filter((c) => Boolean(c.whatsappPhone));
      }
      if (params.onlyWithPhone) {
        results = results.filter((c) => Boolean(c.nationalPhone || c.internationalPhone));
      }
      if (params.minRating && params.minRating > 0) {
        results = results.filter((c) => (c.rating || 0) >= params.minRating!);
      }

      // Merge results with all user alterations (status, CNPJ, notes, favorites)
      const mergedResults = mergeWithPersistedData(results);

      // If user enabled accumulation, append to current contacts without losing previous ones
      const finalContacts = params.accumulate
        ? accumulateContacts(contacts, mergedResults)
        : mergedResults;

      setContacts(finalContacts);
      saveContacts(finalContacts);
      setSelectedIds(new Set());
      setNextPageToken(data.nextPageToken || null);
      setLastSearchParams(params);
    } catch (err: any) {
      console.error('Erro na busca:', err);
      setError(err.message || 'Erro ao conectar com a API do Google Places.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || !lastSearchParams || isLoadingMore) return;
    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await fetch('/api/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lastSearchParams,
          pageToken: nextPageToken,
          apiKey: customApiKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar mais empresas.');
      }

      let newBatch: PlaceContact[] = data.places || [];

      if (lastSearchParams.onlyWithWhatsapp) {
        newBatch = newBatch.filter((c) => Boolean(c.whatsappPhone));
      }
      if (lastSearchParams.onlyWithPhone) {
        newBatch = newBatch.filter((c) => Boolean(c.nationalPhone || c.internationalPhone));
      }
      if (lastSearchParams.minRating && lastSearchParams.minRating > 0) {
        newBatch = newBatch.filter((c) => (c.rating || 0) >= lastSearchParams.minRating!);
      }

      const mergedBatch = mergeWithPersistedData(newBatch);
      const accumulated = accumulateContacts(contacts, mergedBatch);

      setContacts(accumulated);
      saveContacts(accumulated);
      setNextPageToken(data.nextPageToken || null);
    } catch (err: any) {
      console.error('Erro ao carregar mais:', err);
      setError(err.message || 'Erro ao buscar próxima página da API.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all = new Set(contacts.map((c) => c.id));
    setSelectedIds(all);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleOpenCnpjModal = (contact: PlaceContact) => {
    setContactForCnpj(contact);
    setIsCnpjModalOpen(true);
  };

  const handleOpenNoteModal = (contact: PlaceContact) => {
    setContactForNote(contact);
    setIsNoteModalOpen(true);
  };

  const handleSaveCnpj = (contactId: string, cnpj: string) => {
    saveContactCnpj(contactId, cnpj);
    setContacts((prev) => {
      const updated = prev.map((c) =>
        c.id === contactId ? { ...c, cnpj, cnpjStatus: 'manual' as const } : c
      );
      saveContacts(updated);
      return updated;
    });
  };

  const handleSaveNote = (contactId: string, note: string) => {
    saveContactNote(contactId, note);
    setContacts((prev) => {
      const updated = prev.map((c) =>
        c.id === contactId ? { ...c, notes: note } : c
      );
      saveContacts(updated);
      return updated;
    });
  };

  const handleToggleFavorite = (contactId: string) => {
    setContacts((prev) => {
      const target = prev.find((c) => c.id === contactId);
      const newFav = !target?.isFavorite;
      saveContactFavorite(contactId, newFav);
      const updated = prev.map((c) =>
        c.id === contactId ? { ...c, isFavorite: newFav } : c
      );
      saveContacts(updated);
      return updated;
    });
  };

  // Update outreach status and persist to localStorage
  const handleUpdateStatus = (id: string, status: 'Enviado' | 'Pendente') => {
    saveContactStatus(id, status);
    setContacts((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, outreachStatus: status } : c
      );
      saveContacts(updated);
      return updated;
    });
  };

  // Bulk update outreach status for all selected contacts
  const handleBulkUpdateStatus = (status: 'Enviado' | 'Pendente') => {
    if (selectedIds.size === 0) return;
    saveBulkStatuses(Array.from(selectedIds), status);
    setContacts((prev) => {
      const updated = prev.map((c) =>
        selectedIds.has(c.id) ? { ...c, outreachStatus: status } : c
      );
      saveContacts(updated);
      return updated;
    });
  };

  const handleReset = () => {
    setContacts([]);
    setSelectedIds(new Set());
    setError(null);
    setNextPageToken(null);
    setLastSearchParams(null);
    clearSavedData();
  };

  const handleBackupRestored = () => {
    const loaded = loadSavedContacts();
    setContacts(loaded);
  };

  // Instant filter by top header search input
  const displayedContacts = React.useMemo(() => {
    if (!headerSearchText.trim()) return contacts;
    const term = headerSearchText.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.address && c.address.toLowerCase().includes(term)) ||
        (c.keyword && c.keyword.toLowerCase().includes(term)) ||
        (c.cnpj && c.cnpj.includes(term)) ||
        (c.notes && c.notes.toLowerCase().includes(term))
    );
  }, [contacts, headerSearchText]);

  return (
    <div className="min-h-screen bg-[#f9f9fb] text-[#1a1c1d] flex flex-col font-sans antialiased">
      {/* Top SUCCESS Navigation Bar */}
      <Header
        hasApiKey={hasApiKey}
        maskedKey={maskedKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        searchFilterText={headerSearchText}
        onSearchFilterChange={setHeaderSearchText}
        totalContacts={contacts.length}
        selectedCount={selectedIds.size}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenWhatsAppTemplateModal={() => setIsWhatsAppModalOpen(true)}
        onOpenMediaScraper={() => handleOpenScraper()}
      />

      {/* Main Container - Expands to consume full lateral screen width */}
      <main className="flex-1 w-full px-3 sm:px-5 lg:px-6 xl:px-8 py-5 space-y-5">
        
        {/* Search & Location Selection Form */}
        <SearchForm
          isLoading={isLoading}
          onSearch={performSearch}
          onReset={handleReset}
          hasResults={contacts.length > 0}
        />

        {/* API Error Warning */}
        {error && (
          <div className="bg-rose-50 border border-rose-200/80 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-rose-800 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Falha na consulta ao Google Places</p>
              <p>{error}</p>
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="font-bold text-[#5c59e8] underline pt-1 block cursor-pointer"
              >
                Verificar Chave de API Google Maps
              </button>
            </div>
          </div>
        )}

        {/* Results Area */}
        {contacts.length > 0 && (
          <div className="space-y-5">
            {/* Top Metrics Cards (SUCCESS color tokens) */}
            <MetricsOverview
              contacts={displayedContacts}
              selectedIds={selectedIds}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              activeView={activeView}
              onViewChange={setActiveView}
            />

            {/* View Mode 1: Table with Column Filters & 100/page pagination */}
            {activeView === 'table' && (
              <ContactsTable
                contacts={displayedContacts}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onClearSelection={handleClearSelection}
                onOpenCnpjModal={handleOpenCnpjModal}
                onUpdateStatus={handleUpdateStatus}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onToggleFavorite={handleToggleFavorite}
                onOpenNoteModal={handleOpenNoteModal}
                whatsappTemplate={whatsappTemplate}
                filters={contactFilters}
                onFiltersChange={setContactFilters}
                onOpenMediaScraper={handleOpenScraper}
              />
            )}

            {/* View Mode 2: Cards Grid */}
            {activeView === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {applyContactFilters(displayedContacts, contactFilters).map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedIds.has(contact.id)}
                    onToggleSelect={handleToggleSelect}
                    onOpenCnpjModal={handleOpenCnpjModal}
                    onUpdateStatus={handleUpdateStatus}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenNoteModal={handleOpenNoteModal}
                    whatsappTemplate={whatsappTemplate}
                    onOpenMediaScraper={handleOpenScraper}
                  />
                ))}
              </div>
            )}

            {/* Load More from API button if Google Places has more pages */}
            {nextPageToken && (
              <div className="bg-[#fff7db]/80 border border-[#ffb800]/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5 text-[#7c5800]">
                  <div className="w-8 h-8 rounded-xl bg-[#ffb800]/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-[#ffb800]" />
                  </div>
                  <div>
                    <p className="font-bold text-[#1a1c1d]">
                      Mais resultados disponíveis no Google Places
                    </p>
                    <p className="text-[11px] text-[#7c5800]">
                      Você carregou {contacts.length} empresas. Clique ao lado para extrair a próxima página (+20 empresas) via API.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#ffb800] hover:bg-[#f5a623] active:scale-98 disabled:opacity-50 text-[#1a1a1a] font-bold rounded-full shadow-xs cursor-pointer transition-all border border-[#ffb800]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extraindo próxima página (+20)...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Carregar Mais Empresas (+20 da API)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer (Hidden on mobile so no bottom bar is needed) */}
      <footer className="hidden sm:block w-full py-3.5 text-center text-xs text-[#6e7191] border-t border-slate-200/50 bg-white/60">
        <div className="w-full px-3 sm:px-5 lg:px-6 xl:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Encontre Empresas &bull; Prospecção Comercial B2B</p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dados salvos localmente</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MediaScraperModal
        isOpen={isScraperModalOpen}
        onClose={() => {
          setIsScraperModalOpen(false);
          setScraperContact(null);
        }}
        contact={scraperContact}
      />
      <WhatsAppTemplateModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        currentTemplate={whatsappTemplate}
        onSaveTemplate={handleSaveWhatsAppTemplate}
        sampleContact={contacts[0] || null}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKey={customApiKey}
        onSaveApiKey={(key) => {
          setCustomApiKey(key);
          saveCustomApiKey(key);
          setMaskedKey(key ? `${key.slice(0, 6)}...${key.slice(-4)}` : '');
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        contacts={displayedContacts}
        selectedIds={selectedIds}
        searchQueryLabel={lastQueryLabel}
        onBackupRestored={handleBackupRestored}
        initialFilters={contactFilters}
      />

      <CnpjModal
        isOpen={isCnpjModalOpen}
        onClose={() => {
          setIsCnpjModalOpen(false);
          setContactForCnpj(null);
        }}
        contact={contactForCnpj}
        onSaveCnpj={handleSaveCnpj}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setContactForNote(null);
        }}
        contact={contactForNote}
        onSaveNote={handleSaveNote}
      />
    </div>
  );
}
