import { PlaceContact, SearchFormData } from '../types';

export const STORAGE_KEYS = {
  CONTACTS: 'encontre_empresas_contacts',
  OUTREACH_STATUS: 'encontre_empresas_outreach_status',
  CUSTOM_CNPJS: 'encontre_empresas_saved_cnpjs',
  CONTACT_NOTES: 'encontre_empresas_notes',
  FAVORITES: 'encontre_empresas_favorites',
  CUSTOM_API_KEY: 'encontre_empresas_custom_api_key',
  LAST_SEARCH: 'encontre_empresas_last_search',
  ACTIVE_VIEW: 'encontre_empresas_active_view',
  ACCUMULATE_RESULTS: 'encontre_empresas_accumulate_results',
  PAGE_SIZE: 'encontre_empresas_page_size',
};

/**
 * Load contacts from local storage
 */
export function loadSavedContacts(): PlaceContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return mergeWithPersistedData(parsed);
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar contatos do localStorage:', err);
  }
  return [];
}

/**
 * Save contacts to local storage
 */
export function saveContacts(contacts: PlaceContact[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (err) {
    console.warn('Erro ao salvar contatos no localStorage:', err);
  }
}

/**
 * Load all persisted statuses
 */
export function loadSavedStatuses(): Record<string, 'Enviado' | 'Pendente'> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OUTREACH_STATUS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler status salvos:', e);
  }
  return {};
}

/**
 * Save status for a single contact
 */
export function saveContactStatus(id: string, status: 'Enviado' | 'Pendente'): void {
  try {
    const statuses = loadSavedStatuses();
    statuses[id] = status;
    localStorage.setItem(STORAGE_KEYS.OUTREACH_STATUS, JSON.stringify(statuses));
  } catch (e) {
    console.warn('Erro ao salvar status:', e);
  }
}

/**
 * Save status in bulk for multiple contacts
 */
export function saveBulkStatuses(ids: string[], status: 'Enviado' | 'Pendente'): void {
  try {
    const statuses = loadSavedStatuses();
    ids.forEach((id) => {
      statuses[id] = status;
    });
    localStorage.setItem(STORAGE_KEYS.OUTREACH_STATUS, JSON.stringify(statuses));
  } catch (e) {
    console.warn('Erro ao salvar status em lote:', e);
  }
}

/**
 * Load custom manual CNPJs map
 */
export function loadSavedCnpjs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_CNPJS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler CNPJs manuais salvos:', e);
  }
  return {};
}

/**
 * Save CNPJ for a contact
 */
export function saveContactCnpj(id: string, cnpj: string): void {
  try {
    const cnpjs = loadSavedCnpjs();
    cnpjs[id] = cnpj;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CNPJS, JSON.stringify(cnpjs));
  } catch (e) {
    console.warn('Erro ao salvar CNPJ manual:', e);
  }
}

/**
 * Load contact notes map
 */
export function loadSavedNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACT_NOTES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler anotações de contatos:', e);
  }
  return {};
}

/**
 * Save notes for a contact
 */
export function saveContactNote(id: string, note: string): void {
  try {
    const notes = loadSavedNotes();
    if (note.trim()) {
      notes[id] = note.trim();
    } else {
      delete notes[id];
    }
    localStorage.setItem(STORAGE_KEYS.CONTACT_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.warn('Erro ao salvar anotação do contato:', e);
  }
}

/**
 * Load favorites set
 */
export function loadSavedFavorites(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao ler favoritos salvos:', e);
  }
  return {};
}

/**
 * Toggle favorite
 */
export function saveContactFavorite(id: string, isFav: boolean): void {
  try {
    const favs = loadSavedFavorites();
    if (isFav) {
      favs[id] = true;
    } else {
      delete favs[id];
    }
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
  } catch (e) {
    console.warn('Erro ao salvar favorito:', e);
  }
}

/**
 * Load custom Google Maps API key
 */
export function loadCustomApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY) || '';
  } catch (e) {
    return '';
  }
}

/**
 * Save custom Google Maps API key
 */
export function saveCustomApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_API_KEY);
    }
  } catch (e) {
    console.warn('Erro ao persistir chave de API:', e);
  }
}

/**
 * Load last search parameters
 */
export function loadLastSearch(): Partial<SearchFormData> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_SEARCH);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Erro ao carregar última busca:', e);
  }
  return null;
}

/**
 * Save last search parameters
 */
export function saveLastSearch(data: SearchFormData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SEARCH, JSON.stringify(data));
  } catch (e) {
    console.warn('Erro ao salvar parâmetros da busca:', e);
  }
}

/**
 * Load accumulate mode
 */
export function loadAccumulateMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCUMULATE_RESULTS) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Save accumulate mode
 */
export function saveAccumulateMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACCUMULATE_RESULTS, String(enabled));
  } catch (e) {
    console.warn('Erro ao salvar preferência de acumulação:', e);
  }
}

/**
 * Load active view mode
 */
export function loadActiveView(): 'table' | 'cards' | 'map' {
  try {
    const view = localStorage.getItem(STORAGE_KEYS.ACTIVE_VIEW);
    if (view === 'table' || view === 'cards' || view === 'map') return view;
  } catch (e) {
    // ignore
  }
  return 'table';
}

/**
 * Save active view mode
 */
export function saveActiveView(view: 'table' | 'cards' | 'map'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_VIEW, view);
  } catch (e) {
    // ignore
  }
}

/**
 * Merge raw API contacts with all locally persisted customizations
 * (Status, CNPJ, Notes, Favorites) so no user edits are lost!
 */
export function mergeWithPersistedData(places: PlaceContact[]): PlaceContact[] {
  const statuses = loadSavedStatuses();
  const cnpjs = loadSavedCnpjs();
  const notes = loadSavedNotes();
  const favorites = loadSavedFavorites();

  return places.map((p) => {
    const savedStatus = statuses[p.id];
    const savedCnpj = cnpjs[p.id];
    const savedNote = notes[p.id];
    const isFav = Boolean(favorites[p.id]);

    return {
      ...p,
      outreachStatus: savedStatus || p.outreachStatus || 'Pendente',
      cnpj: savedCnpj || p.cnpj || null,
      cnpjStatus: savedCnpj ? 'manual' : p.cnpjStatus,
      notes: savedNote !== undefined ? savedNote : p.notes,
      isFavorite: isFav,
    };
  });
}

/**
 * Deduplicate and accumulate new search results with existing contacts
 */
export function accumulateContacts(
  existing: PlaceContact[],
  incoming: PlaceContact[]
): PlaceContact[] {
  const existingMap = new Map<string, PlaceContact>();

  // Index existing by ID and phone
  existing.forEach((item) => {
    existingMap.set(item.id, item);
  });

  const merged = [...existing];

  incoming.forEach((item) => {
    if (existingMap.has(item.id)) {
      // Update place details but preserve user-authored modifications
      const current = existingMap.get(item.id)!;
      const index = merged.findIndex((m) => m.id === item.id);
      if (index !== -1) {
        merged[index] = {
          ...item,
          outreachStatus: current.outreachStatus || item.outreachStatus,
          cnpj: current.cnpj || item.cnpj,
          cnpjStatus: current.cnpj ? current.cnpjStatus : item.cnpjStatus,
          notes: current.notes || item.notes,
          isFavorite: current.isFavorite || item.isFavorite,
        };
      }
    } else {
      merged.push(item);
      existingMap.set(item.id, item);
    }
  });

  return merged;
}

/**
 * Create a full JSON backup of all user data
 */
export function createDataBackup() {
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    contacts: loadSavedContacts(),
    statuses: loadSavedStatuses(),
    cnpjs: loadSavedCnpjs(),
    notes: loadSavedNotes(),
    favorites: loadSavedFavorites(),
  };
}

/**
 * Clear all saved data from local storage
 */
export function clearSavedData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
    localStorage.removeItem(STORAGE_KEYS.OUTREACH_STATUS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_CNPJS);
    localStorage.removeItem(STORAGE_KEYS.CONTACT_NOTES);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.LAST_SEARCH);
  } catch (e) {
    console.warn('Erro ao limpar dados salvos:', e);
  }
}

/**
 * Export full JSON backup and trigger file download
 */
export function exportFullBackup(): void {
  const backup = createDataBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_encontre_empresas_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a full JSON backup object
 */
export function importDataBackup(backupData: any): { success: boolean; count: number; error?: string } {
  try {
    if (!backupData || typeof backupData !== 'object') {
      return { success: false, count: 0, error: 'Arquivo de backup inválido.' };
    }

    if (backupData.statuses) {
      localStorage.setItem(STORAGE_KEYS.OUTREACH_STATUS, JSON.stringify(backupData.statuses));
    }
    if (backupData.cnpjs) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_CNPJS, JSON.stringify(backupData.cnpjs));
    }
    if (backupData.notes) {
      localStorage.setItem(STORAGE_KEYS.CONTACT_NOTES, JSON.stringify(backupData.notes));
    }
    if (backupData.favorites) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(backupData.favorites));
    }
    if (Array.isArray(backupData.contacts)) {
      const merged = mergeWithPersistedData(backupData.contacts);
      saveContacts(merged);
      return { success: true, count: merged.length };
    }

    return { success: true, count: 0 };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Parse and import full JSON backup from string
 */
export function importFullBackup(rawJson: string): boolean {
  try {
    const data = JSON.parse(rawJson);
    const result = importDataBackup(data);
    return result.success;
  } catch (e) {
    return false;
  }
}

