import { PlaceContact, ContactFilters } from '../types';

export function hasActiveContactFilters(filters: ContactFilters): boolean {
  return Boolean(
    filters.keyword.trim() ||
      (filters.country && filters.country !== 'all') ||
      (filters.state && filters.state !== 'all') ||
      filters.city.trim() ||
      filters.status !== 'all'
  );
}

export function applyContactFilters(
  contacts: PlaceContact[],
  filters: ContactFilters
): PlaceContact[] {
  return contacts.filter((contact) => {
    // 1. Palavra Chave (checks keyword, business name, or types)
    if (filters.keyword.trim()) {
      const term = filters.keyword.toLowerCase().trim();
      const kw = (contact.keyword || '').toLowerCase();
      const name = (contact.name || '').toLowerCase();
      const types = (contact.types || []).join(' ').toLowerCase();
      if (!kw.includes(term) && !name.includes(term) && !types.includes(term)) {
        return false;
      }
    }

    // 2. País
    if (filters.country && filters.country !== 'all' && filters.country.trim()) {
      const term = filters.country.toLowerCase().trim();
      const country = (contact.country || '').toLowerCase().trim();
      if (!country.includes(term)) {
        return false;
      }
    }

    // 3. Estado
    if (filters.state && filters.state !== 'all' && filters.state.trim()) {
      const term = filters.state.toLowerCase().trim();
      const state = (contact.state || '').toLowerCase().trim();
      if (state !== term && !state.includes(term)) {
        return false;
      }
    }

    // 4. Cidade
    if (filters.city && filters.city !== 'all' && filters.city.trim()) {
      const term = filters.city.toLowerCase().trim();
      const city = (contact.city || '').toLowerCase().trim();
      if (!city.includes(term)) {
        return false;
      }
    }

    // 5. Status (Pendente | Enviado)
    if (filters.status !== 'all') {
      const currentStatus = contact.outreachStatus || 'Pendente';
      if (currentStatus !== filters.status) {
        return false;
      }
    }

    return true;
  });
}

export function getFilterMetadata(contacts: PlaceContact[]) {
  const countries = new Set<string>();
  const states = new Set<string>();
  const cities = new Set<string>();
  const keywords = new Set<string>();

  contacts.forEach((c) => {
    if (c.country) countries.add(c.country.trim());
    if (c.state) states.add(c.state.trim());
    if (c.city) cities.add(c.city.trim());
    if (c.keyword) keywords.add(c.keyword.trim());
  });

  return {
    countries: Array.from(countries).sort(),
    states: Array.from(states).sort(),
    cities: Array.from(cities).sort(),
    keywords: Array.from(keywords).sort(),
  };
}
