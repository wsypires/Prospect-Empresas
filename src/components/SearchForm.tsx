import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Globe,
  Building2,
  Filter,
  Loader2,
  RefreshCw,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import {
  BRAZILIAN_STATES,
  COUNTRIES_LIST,
  STATE_CAPITALS,
  POPULAR_KEYWORDS,
  BrazilianState,
  SearchFormData,
} from '../types';
import {
  loadLastSearch,
  loadAccumulateMode,
  saveAccumulateMode,
} from '../utils/persistence';

interface SearchFormProps {
  isLoading: boolean;
  onSearch: (params: SearchFormData) => void;
  onReset: () => void;
  hasResults: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  isLoading,
  onSearch,
  onReset,
  hasResults,
}) => {
  const savedSearch = useMemo(() => loadLastSearch(), []);

  // Keyword, Country, State, City initialized with saved state if available
  const [keyword, setKeyword] = useState(savedSearch?.keyword || '');
  const [country, setCountry] = useState(savedSearch?.country || 'Brasil');
  const [state, setState] = useState(savedSearch?.state || 'SP');
  const [city, setCity] = useState(savedSearch?.city || 'São Paulo');

  // Dynamic state & city lists
  const [statesList, setStatesList] = useState<BrazilianState[]>(BRAZILIAN_STATES);
  const [citiesList, setCitiesList] = useState<string[]>(['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'São Bernardo do Campo']);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citySearchFilter, setCitySearchFilter] = useState('');

  // Advanced filters
  const [maxResults, setMaxResults] = useState(savedSearch?.maxResults || 20);
  const [onlyWithWhatsapp, setOnlyWithWhatsapp] = useState(savedSearch?.onlyWithWhatsapp || false);
  const [onlyWithPhone, setOnlyWithPhone] = useState(savedSearch?.onlyWithPhone || false);
  const [minRating, setMinRating] = useState<number>(savedSearch?.minRating || 0);
  const [accumulate, setAccumulate] = useState<boolean>(() => loadAccumulateMode());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleToggleAccumulate = (val: boolean) => {
    setAccumulate(val);
    saveAccumulateMode(val);
  };

  // Fetch official Brazilian states from IBGE on mount
  useEffect(() => {
    fetch('/api/locations/states')
      .then((res) => res.json())
      .then((data) => {
        if (data.states && Array.isArray(data.states) && data.states.length > 0) {
          setStatesList(data.states);
        }
      })
      .catch((err) => console.warn('Falha ao obter estados IBGE:', err));
  }, []);

  // Fetch official Brazilian cities from IBGE whenever state changes
  useEffect(() => {
    if (!state || country !== 'Brasil') return;

    let isMounted = true;
    setIsLoadingCities(true);

    fetch(`/api/locations/cities?state=${encodeURIComponent(state)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.cities && Array.isArray(data.cities) && data.cities.length > 0) {
          const cities: string[] = data.cities;
          setCitiesList(cities);

          // Auto-preenche a cidade selecionada:
          // Se a capital da UF estiver na lista, auto-seleciona a capital; senão, auto-seleciona a 1ª cidade
          const capital = STATE_CAPITALS[state];
          const defaultCity = capital && cities.includes(capital) ? capital : cities[0];

          setCity((prev) => {
            if (cities.includes(prev)) return prev;
            return defaultCity || '';
          });
        }
      })
      .catch((err) => console.warn('Erro ao carregar municípios:', err))
      .finally(() => {
        if (isMounted) setIsLoadingCities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [state, country]);

  // Geolocation auto-detect handler
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/locations/reverse-geocode?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.state) {
              setState(data.state);
            }
            if (data.city) {
              setCity(data.city);
            }
          }
        } catch (e) {
          console.warn('Erro ao detectar cidade:', e);
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
      },
      { timeout: 5000 }
    );
  };

  // Filtered cities list for easy selection in dropdown
  const filteredCities = useMemo(() => {
    if (!citySearchFilter.trim()) return citiesList;
    const term = citySearchFilter.toLowerCase();
    return citiesList.filter((c) => c.toLowerCase().includes(term));
  }, [citiesList, citySearchFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !city.trim()) return;

    onSearch({
      keyword: keyword.trim(),
      country: country.trim(),
      state: state.trim(),
      city: city.trim(),
      maxResults,
      onlyWithWhatsapp,
      onlyWithPhone,
      minRating: minRating > 0 ? minRating : undefined,
      accumulate,
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover-elevate transition-all">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#ecebfa] text-[#5c59e8] flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1e1e2f] leading-tight">
              Buscar Empresas no Google Places
            </h3>
            <p className="text-[11px] text-[#6e7191]">
              Menus auto-preenchidos e dados em tempo real
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecebfa] text-[#5c59e8]">
          Filtro Inteligente
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main 4 inputs: Palavra-chave, País, Estado, Cidade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* Palavra chave (Keyword) */}
          <div className="lg:col-span-4">
            <label
              htmlFor="input-keyword"
              className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider mb-1.5"
            >
              Palavra-chave / Nicho <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a3bd]">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="input-keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ex: Farmácia, Dentista, Academia..."
                required
                autoFocus
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#f3f5fa] border border-slate-200/80 rounded-2xl text-[#1e1e2f] placeholder-[#a0a3bd] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5c59e8]/20 focus:border-[#5c59e8] transition-colors"
              />
            </div>
          </div>

          {/* Menu de seleção: País (Country) - Auto Preenchido */}
          <div className="lg:col-span-2">
            <label
              htmlFor="select-country"
              className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider mb-1.5"
            >
              País <span className="text-[#5c59e8] text-[10px] font-semibold lowercase">(auto)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a3bd]">
                <Globe className="w-4 h-4" />
              </div>
              <select
                id="select-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 text-xs bg-[#f3f5fa] border border-slate-200/80 rounded-2xl text-[#1e1e2f] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5c59e8]/20 focus:border-[#5c59e8] transition-colors cursor-pointer appearance-none"
              >
                {COUNTRIES_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#a0a3bd] text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Menu de seleção: Estado (UF) - Auto Preenchido */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="select-state"
                className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider"
              >
                Estado (UF) <span className="text-[#5c59e8] text-[10px] font-semibold lowercase">(auto)</span>
              </label>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLocation}
                title="Detectar minha localização"
                className="text-[10px] text-[#5c59e8] hover:text-[#4f4cd9] font-semibold flex items-center gap-0.5 cursor-pointer disabled:opacity-50"
              >
                <Crosshair className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                <span>Meu local</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a3bd]">
                <Building2 className="w-4 h-4" />
              </div>
              <select
                id="select-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 text-xs bg-[#f3f5fa] border border-slate-200/80 rounded-2xl text-[#1e1e2f] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5c59e8]/20 focus:border-[#5c59e8] transition-colors cursor-pointer appearance-none"
              >
                {statesList.map((s) => (
                  <option key={s.uf} value={s.uf}>
                    {s.uf} - {s.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#a0a3bd] text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Menu de seleção: Cidade - Auto Preenchido via IBGE */}
          <div className="lg:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="select-city"
                className="block text-xs font-bold text-[#1e1e2f] uppercase tracking-wider"
              >
                Cidade <span className="text-rose-500">*</span>{' '}
                <span className="text-[#5c59e8] text-[10px] font-semibold lowercase">
                  ({citiesList.length > 0 ? `${citiesList.length} IBGE` : 'auto'})
                </span>
              </label>
              {citiesList.length > 20 && (
                <input
                  type="text"
                  placeholder="Filtrar cidade..."
                  value={citySearchFilter}
                  onChange={(e) => setCitySearchFilter(e.target.value)}
                  className="text-[10px] px-2 py-0.5 border border-slate-200 rounded-lg bg-[#f3f5fa] text-[#1e1e2f] placeholder-[#a0a3bd] focus:bg-white focus:outline-hidden"
                />
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#a0a3bd]">
                {isLoadingCities ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#5c59e8]" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </div>
              <select
                id="select-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full pl-10 pr-8 py-2.5 text-xs bg-[#f3f5fa] border border-slate-200/80 rounded-2xl text-[#1e1e2f] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5c59e8]/20 focus:border-[#5c59e8] transition-colors cursor-pointer appearance-none"
              >
                {/* Se houver capital para este estado, destaca ela no topo */}
                {STATE_CAPITALS[state] && citiesList.includes(STATE_CAPITALS[state]) && !citySearchFilter && (
                  <optgroup label="Capital do Estado">
                    <option value={STATE_CAPITALS[state]}>
                      ★ {STATE_CAPITALS[state]} (Capital)
                    </option>
                  </optgroup>
                )}

                <optgroup label={`Municípios (${filteredCities.length})`}>
                  {filteredCities.map((cityName) => (
                    <option key={cityName} value={cityName}>
                      {cityName}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#a0a3bd] text-xs">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Quick Keyword Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
          <span className="text-[#a0a3bd] font-medium whitespace-nowrap text-[11px] uppercase tracking-wide">
            Sugestões:
          </span>
          {POPULAR_KEYWORDS.slice(0, 7).map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => setKeyword(kw)}
              className={`px-3 py-1 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                keyword.toLowerCase() === kw.toLowerCase()
                  ? 'bg-[#ecebfa] text-[#5c59e8] border-[#5c59e8]/30 shadow-2xs'
                  : 'bg-[#f3f5fa] text-[#6e7191] border-slate-200/60 hover:bg-[#ecebfa] hover:text-[#5c59e8]'
              }`}
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Advanced Filters Toggle & Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6e7191] hover:text-[#5c59e8] cursor-pointer transition-colors"
            >
              <Filter className="w-3.5 h-3.5 text-[#5c59e8]" />
              {showAdvanced ? 'Ocultar Filtros' : 'Filtros Avançados'}
            </button>

            {hasResults && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1 text-xs text-[#6e7191] hover:text-rose-600 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Limpar busca
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={isLoading || !keyword.trim() || !city.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-[#5c59e8] hover:bg-[#4f4cd9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando no Google Places...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Buscar Empresas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="pt-3 pb-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyWithWhatsapp}
                onChange={(e) => setOnlyWithWhatsapp(e.target.checked)}
                className="rounded text-[#5c59e8] focus:ring-[#5c59e8] w-4 h-4 border-slate-300 cursor-pointer"
              />
              <span className="font-semibold text-[#1e1e2f]">Somente com WhatsApp / Celular</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyWithPhone}
                onChange={(e) => setOnlyWithPhone(e.target.checked)}
                className="rounded text-[#5c59e8] focus:ring-[#5c59e8] w-4 h-4 border-slate-300 cursor-pointer"
              />
              <span className="font-semibold text-[#1e1e2f]">Somente com qualquer telefone</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none bg-[#ecebfa]/50 p-2 rounded-xl border border-[#5c59e8]/20">
              <input
                type="checkbox"
                checked={accumulate}
                onChange={(e) => handleToggleAccumulate(e.target.checked)}
                className="rounded text-[#5c59e8] focus:ring-[#5c59e8] w-4 h-4 border-slate-300 cursor-pointer"
              />
              <span className="font-bold text-[#5c59e8]">
                Acumular contatos na lista (não apagar anteriores)
              </span>
            </label>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1e1e2f] whitespace-nowrap">Avaliação Mínima:</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="px-2 py-1 bg-[#f3f5fa] border border-slate-200 rounded-xl text-xs text-[#1e1e2f]"
              >
                <option value={0}>Todas</option>
                <option value={3.5}>3.5+ estrelas</option>
                <option value={4.0}>4.0+ estrelas</option>
                <option value={4.5}>4.5+ estrelas</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1e1e2f] whitespace-nowrap">Qtd. a Carregar:</span>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="px-2.5 py-1 bg-[#f3f5fa] border border-slate-200 rounded-xl text-xs font-bold text-[#5c59e8]"
              >
                <option value={20}>20 empresas</option>
                <option value={40}>40 empresas</option>
                <option value={60}>60 empresas</option>
                <option value={100}>100 empresas (máx)</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
