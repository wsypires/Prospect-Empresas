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
import { InteractiveMap } from './components/InteractiveMap';
import { ExportModal } from './components/ExportModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { CnpjModal } from './components/CnpjModal';
import { NoteModal } from './components/NoteModal';
import { WhatsAppTemplateModal } from './components/WhatsAppTemplateModal';
import { PlaceContact, SearchFormData } from './types';
import { getSavedWhatsAppTemplate, saveWhatsAppTemplate } from './utils/whatsappUtils';
import {
  loadSavedContacts,
  saveContacts,
  saveContactStatus,
  saveBulkStatuses,
  saveContactCnpj,
  saveContactNote,
  saveContactFavorite,
  mergeWithPersistedData,
  accumulateContacts,
  loadCustomApiKey,
  saveCustomApiKey,
  saveLastSearch,
  clearSavedData,
} from './utils/persistence';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Contacts state initialized from robust localStorage persistence
  const [contacts, setContacts] = useState<PlaceContact[]>(() => loadSavedContacts());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQueryLabel, setLastQueryLabel] = useState<string>('');
  
  // View mode: table, cards or map
  const [activeView, setActiveView] = useState<'table' | 'cards' | 'map'>('table');
  const [headerSearchText, setHeaderSearchText] = useState<string>('');

  // Modals
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCnpjModalOpen, setIsCnpjModalOpen] = useState<boolean>(false);
  const [contactForCnpj, setContactForCnpj] = useState<PlaceContact | null>(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [contactForNote, setContactForNote] = useState<PlaceContact | null>(null);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);

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
    } catch (err: any) {
      console.error('Erro na busca:', err);
      setError(err.message || 'Erro ao conectar com a API do Google Places.');
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-[#e2e8f5] text-[#1e1e2f] flex flex-col font-sans antialiased">
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
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
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
              />
            )}

            {/* View Mode 2: Cards Grid */}
            {activeView === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedContacts.map((contact) => (
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
                  />
                ))}
              </div>
            )}

            {/* View Mode 3: Interactive Google Map */}
            {activeView === 'map' && (
              <InteractiveMap
                contacts={displayedContacts}
                apiKey={customApiKey}
                onOpenCnpjModal={handleOpenCnpjModal}
                whatsappTemplate={whatsappTemplate}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-xs text-[#6e7191] border-t border-slate-200/50 bg-white/60">
        <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>Encontre Empresas &bull; Extração em Tempo Real Google Places &bull; WhatsApp B2B</p>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Persistência local ativa: dados e alterações preservados</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
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
        contacts={contacts}
        selectedIds={selectedIds}
        searchQueryLabel={lastQueryLabel}
        onBackupRestored={handleBackupRestored}
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
