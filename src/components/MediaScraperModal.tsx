import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Download,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  Film,
  Sparkles,
  Loader2,
  Filter,
  CheckSquare,
  Square,
  Maximize2,
  RefreshCw,
  Globe,
  AlertCircle,
  FolderArchive,
  Layers,
  ShieldCheck,
  Camera,
} from 'lucide-react';
import { PlaceContact, ScrapedMediaItem, ScraperResult } from '../types';
import JSZip from 'jszip';

interface MediaScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: PlaceContact | null;
  defaultUrl?: string;
}

export const MediaScraperModal: React.FC<MediaScraperModalProps> = ({
  isOpen,
  onClose,
  contact,
  defaultUrl = '',
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scraperResult, setScraperResult] = useState<ScraperResult | null>(null);

  // Filters and selection
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isZipping, setIsZipping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Anti-map tile filter (strictly excludes 256x256 tiles and maps system graphics)
  const [excludeMapTiles, setExcludeMapTiles] = useState<boolean>(true);
  const [companyPhotosOnly, setCompanyPhotosOnly] = useState<boolean>(false);
  const [avoidDuplicates, setAvoidDuplicates] = useState<boolean>(true);

  // Expanded media viewer
  const [zoomMedia, setZoomMedia] = useState<ScrapedMediaItem | null>(null);

  const handleStartScrape = async (overrideUrl?: string) => {
    const target = (overrideUrl || url || '').trim();
    if (!target) {
      setError('Por favor, informe uma URL válida para extrair.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusStep('Iniciando navegador Chromium Headless via Playwright...');

    const timer1 = setTimeout(() => {
      setStatusStep('Navegando e renderizando elementos da página...');
    }, 1200);

    const timer2 = setTimeout(() => {
      setStatusStep('Identificando imagens, vídeos e mídias lazy-load (filtrando duplicadas)...');
    }, 2800);

    try {
      const response = await fetch('/api/scraper/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: target,
          companyName: contact?.name,
          deduplicate: avoidDuplicates,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao raspar a página com Playwright.');
      }

      setScraperResult(data);
      // Select all by default
      const allIds = new Set<string>((data.media || []).map((m: ScrapedMediaItem) => m.id));
      setSelectedMediaIds(allIds);
    } catch (err: any) {
      console.error('Erro no scraper:', err);
      setError(err.message || 'Erro inesperado ao executar o Playwright.');
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsLoading(false);
      setStatusStep('');
    }
  };

  // Initialize URL when opened with a contact
  useEffect(() => {
    if (isOpen) {
      const initial =
        contact?.website ||
        (contact?.googleMapsUrl ? contact.googleMapsUrl : '') ||
        defaultUrl ||
        '';
      setUrl(initial);
      setError(null);
      setSelectedMediaIds(new Set());

      // Auto scrape if valid website is provided
      if (initial && initial.startsWith('http')) {
        handleStartScrape(initial);
      }
    }
  }, [isOpen, contact, defaultUrl]);

  const handleCopyUrl = (id: string, mediaUrl: string) => {
    navigator.clipboard.writeText(mediaUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSingle = (item: ScrapedMediaItem) => {
    const filename = `${(contact?.name || 'midia').replace(/[^a-zA-Z0-9_-]/g, '_')}_${item.id}.${item.format}`;
    const downloadUrl = `/api/scraper/download?url=${encodeURIComponent(item.url)}&filename=${encodeURIComponent(filename)}`;
    
    // Create temporary link to trigger native attachment download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!scraperResult) return;
    setSelectedMediaIds(new Set(scraperResult.media.map((m) => m.id)));
  };

  const handleDeselectAll = () => {
    setSelectedMediaIds(new Set());
  };

  // Filtered media list - Hook called unconditionally on every render
  const filteredMedia = useMemo(() => {
    if (!scraperResult || !scraperResult.media) return [];
    const seenFingerprints = new Set<string>();

    return scraperResult.media.filter((item) => {
      // 0. Anti-duplicate media filter
      if (avoidDuplicates) {
        const gMatch = item.url.match(/(?:googleusercontent\.com|ggpht\.com)\/p\/([a-zA-Z0-9_-]+)/i);
        const fp = gMatch
          ? `gphoto:${gMatch[1]}`
          : item.url.split('?')[0].split('#')[0].toLowerCase().replace(/^https?:\/\/(www\.)?/, '');
        if (seenFingerprints.has(fp)) {
          return false;
        }
        seenFingerprints.add(fp);
      }

      // 1. Strict anti-map tile exclusion (256x256 tiles & Google Maps system graphics)
      if (excludeMapTiles) {
        if (item.dimensions?.width === 256 && item.dimensions?.height === 256) {
          return false;
        }
        const lower = item.url.toLowerCase();
        if (
          lower.includes('/maps/vt') ||
          lower.includes('/vt/pb=') ||
          lower.includes('/vt/data=') ||
          lower.includes('/vt/lyrs=') ||
          lower.includes('maps.gstatic.com/tactile') ||
          lower.includes('streetviewpixels-pa.googleapis.com') ||
          lower.includes('tile.openstreetmap.org') ||
          lower.includes('maps.googleapis.com/maps/api/staticmap')
        ) {
          return false;
        }
      }

      // 2. Filter strictly for photos uploaded by the company/users
      if (companyPhotosOnly && !item.isCompanyUpload) {
        return false;
      }

      // 3. Type filter (all / image / video)
      if (mediaTypeFilter !== 'all' && item.type !== mediaTypeFilter) return false;

      // 4. Search text filter
      if (searchFilter.trim()) {
        const query = searchFilter.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query) ||
          item.format.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [scraperResult, mediaTypeFilter, searchFilter, excludeMapTiles, companyPhotosOnly, avoidDuplicates]);

  // Download ZIP
  const handleDownloadZip = async (onlySelected = true) => {
    if (!scraperResult) return;

    const itemsToDownload = scraperResult.media.filter((m) =>
      onlySelected ? selectedMediaIds.has(m.id) : true
    );

    if (itemsToDownload.length === 0) {
      setError('Nenhuma mídia selecionada para download.');
      return;
    }

    setIsZipping(true);
    try {
      const prefix = (contact?.name || 'empresa').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const zipName = `midias_${prefix}_${Date.now()}`;

      // Call backend zip generator
      const res = await fetch('/api/scraper/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zipName,
          items: itemsToDownload.map((m, idx) => ({
            url: m.url,
            filename: `${prefix}_${String(idx + 1).padStart(2, '0')}.${m.format}`,
          })),
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${zipName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        // Client-side fallback JSZip
        const zip = new JSZip();
        const folder = zip.folder(zipName) || zip;

        for (let i = 0; i < itemsToDownload.length; i++) {
          const item = itemsToDownload[i];
          try {
            const resp = await fetch(
              `/api/scraper/download?url=${encodeURIComponent(item.url)}&filename=f`
            );
            if (resp.ok) {
              const b = await resp.blob();
              folder.file(
                `${prefix}_${String(i + 1).padStart(2, '0')}.${item.format}`,
                b
              );
            }
          } catch (e) {
            console.warn(`Erro ao baixar ${item.url}`);
          }
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const downloadUrl = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${zipName}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      console.error('Falha ao baixar ZIP:', err);
      setError('Erro ao empacotar arquivos ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-[#e2e2e4] bg-[#f9f9fb] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff7db] border border-[#ffb800]/50 text-[#7c5800] flex items-center justify-center shadow-xs shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#1a1c1d]">
                  Extrator de Mídias (Playwright)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                  Playwright Headless
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Anti-Tiles 256x256
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200 items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Anti-Duplicadas
                </span>
              </div>
              <p className="text-xs text-[#6e6e77]">
                {contact
                  ? `Extração para ${contact.name} • Filtra tiles 256x256, elimina duplicadas e captura fotos da empresa`
                  : 'Identificação de mídias reais da empresa com bloqueio de tiles 256x256 e desduplicação'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search URL Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#e2e2e4] bg-white space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9e9ea7]">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Informe a URL do site ou perfil da empresa (ex: https://empresa.com.br)..."
                className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-white border border-[#e2e2e4] rounded-2xl text-[#1a1c1d] placeholder-[#9e9ea7] focus:border-[#ffb800] focus:ring-2 focus:ring-[#ffb800]/20 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleStartScrape();
                }}
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {contact?.website && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl(contact.website!);
                    handleStartScrape(contact.website!);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Usar website oficial da empresa"
                >
                  Website Oficial
                </button>
              )}

              {contact?.googleMapsUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setUrl(contact.googleMapsUrl!);
                    handleStartScrape(contact.googleMapsUrl!);
                  }}
                  className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                  title="Usar perfil do Google Maps"
                >
                  Google Maps
                </button>
              )}

              <button
                type="button"
                onClick={() => handleStartScrape()}
                disabled={isLoading || !url.trim()}
                className="px-5 py-2.5 bg-[#ffb800] hover:bg-[#f5a623] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-[#1a1a1a] text-xs sm:text-sm font-bold rounded-2xl border border-[#ffb800] shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Extraindo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extrair com Playwright</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Extraction Conditions Configuration */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-[#6e6e77]">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Condições de Extração:
            </span>

            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium hover:text-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={avoidDuplicates}
                onChange={(e) => setAvoidDuplicates(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 accent-blue-600"
              />
              <span className={avoidDuplicates ? 'text-blue-800 font-bold' : 'text-slate-600'}>
                Não extrair mídias duplicadas
              </span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium hover:text-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={excludeMapTiles}
                onChange={(e) => setExcludeMapTiles(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 accent-emerald-600"
              />
              <span className={excludeMapTiles ? 'text-emerald-800 font-bold' : 'text-slate-600'}>
                Bloquear tiles 256x256 (Mapas)
              </span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium hover:text-slate-900 transition-colors">
              <input
                type="checkbox"
                checked={companyPhotosOnly}
                onChange={(e) => setCompanyPhotosOnly(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 accent-amber-600"
              />
              <span className={companyPhotosOnly ? 'text-amber-800 font-bold' : 'text-slate-600'}>
                Apenas fotos enviadas pela empresa
              </span>
            </label>
          </div>

          {/* Loading status details */}
          {isLoading && (
            <div className="bg-[#fff7db]/70 border border-[#ffb800]/30 rounded-2xl p-3 flex items-center gap-3 text-xs text-[#7c5800] animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-[#ffb800] shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold">{statusStep || 'Processando extração...'}</span>
                <p className="text-[11px] text-[#7c5800]/80">
                  O Playwright está renderizando o DOM, executando scrolls e extraindo todos os recursos multimídia.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !isLoading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Não foi possível raspar as mídias da página</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {scraperResult && (
            <div className="space-y-4">
              
              {/* Stats & Filter Bar */}
              <div className="bg-[#f9f9fb] border border-[#e2e2e4] rounded-2xl p-3.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                {/* Left: Type filter chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      mediaTypeFilter === 'all'
                        ? 'bg-[#1a1c1d] text-white shadow-xs'
                        : 'bg-white border border-[#e2e2e4] text-[#6e6e77] hover:bg-slate-50'
                    }`}
                  >
                    Todas ({scraperResult.total})
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('image')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      mediaTypeFilter === 'image'
                        ? 'bg-[#1a1c1d] text-white shadow-xs'
                        : 'bg-white border border-[#e2e2e4] text-[#6e6e77] hover:bg-slate-50'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Imagens ({scraperResult.imagesCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaTypeFilter('video')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      mediaTypeFilter === 'video'
                        ? 'bg-[#1a1c1d] text-white shadow-xs'
                        : 'bg-white border border-[#e2e2e4] text-[#6e6e77] hover:bg-slate-50'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Vídeos ({scraperResult.videosCount})</span>
                  </button>

                  {scraperResult.media.some((m) => m.isCompanyUpload) && (
                    <button
                      type="button"
                      onClick={() => setCompanyPhotosOnly(!companyPhotosOnly)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                        companyPhotosOnly
                          ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                          : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-50'
                      }`}
                      title="Exibir somente fotos enviadas pela empresa"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>
                        Fotos da Empresa (
                        {scraperResult.media.filter((m) => m.isCompanyUpload).length}
                        )
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setExcludeMapTiles(!excludeMapTiles)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      excludeMapTiles
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                    title="Excluir automaticamente tiles de mapas 256x256 e assets de navegação"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Anti-Tiles 256x256 {excludeMapTiles ? 'Ativo' : 'Desativado'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvoidDuplicates(!avoidDuplicates)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                      avoidDuplicates
                        ? 'bg-blue-50 text-blue-800 border border-blue-300 shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                    title="Condição para impedir mídias repetidas ou redimensionamentos duplicados"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Sem Duplicadas {avoidDuplicates ? 'Ativo' : 'Desativado'}
                      {typeof scraperResult.duplicatesRemoved === 'number' && scraperResult.duplicatesRemoved > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900">
                          -{scraperResult.duplicatesRemoved}
                        </span>
                      )}
                    </span>
                  </button>

                  <div className="h-4 w-px bg-slate-200 hidden sm:block mx-1" />

                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por nome ou formato..."
                    className="px-3 py-1 text-xs bg-white border border-[#e2e2e4] rounded-xl text-[#1a1c1d] placeholder-[#9e9ea7]"
                  />
                </div>

                {/* Right: Batch Selection & Download actions */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-[#6e6e77]">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Selecionar Todas
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                    >
                      Desmarcar
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadZip(true)}
                    disabled={isZipping || selectedMediaIds.size === 0}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isZipping ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FolderArchive className="w-3.5 h-3.5" />
                    )}
                    <span>Baixar Selecionadas ({selectedMediaIds.size}) (.ZIP)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadZip(false)}
                    disabled={isZipping || scraperResult.total === 0}
                    className="px-3.5 py-1.5 bg-[#ffb800] hover:bg-[#f5a623] disabled:opacity-50 text-[#1a1a1a] font-bold text-xs rounded-xl border border-[#ffb800] shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Tudo ({scraperResult.total}) (.ZIP)</span>
                  </button>
                </div>
              </div>

              {/* Media Cards Grid */}
              {filteredMedia.length === 0 ? (
                <div className="text-center py-12 bg-[#f9f9fb] rounded-3xl border border-dashed border-[#e2e2e4]">
                  <Film className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#1a1c1d]">Nenhuma mídia corresponde ao filtro</p>
                  <p className="text-xs text-[#6e6e77] mt-0.5">Tente alterar os termos de busca ou selecione "Todas"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {filteredMedia.map((item) => {
                    const isSelected = selectedMediaIds.has(item.id);
                    const isVideo = item.type === 'video';

                    return (
                      <div
                        key={item.id}
                        className={`group relative bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${
                          isSelected
                            ? 'border-[#ffb800] ring-2 ring-[#ffb800]/30 shadow-md'
                            : 'border-[#e2e2e4] hover:border-slate-300 shadow-2xs hover:shadow-sm'
                        }`}
                      >
                        {/* Media Visual Preview Container */}
                        <div className="relative aspect-square w-full bg-slate-900/5 overflow-hidden flex items-center justify-center">
                          {isVideo ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
                              <video
                                src={item.url}
                                poster={item.thumbnail}
                                className="w-full h-full object-cover"
                                preload="metadata"
                                muted
                                playsInline
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white/90 text-[#1a1c1d] flex items-center justify-center shadow-lg">
                                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.url}
                              alt={item.title}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                // Fallback if image has strict CORS or hotlinking block on img tag
                                (e.target as HTMLImageElement).src = `/api/scraper/download?url=${encodeURIComponent(item.url)}&filename=preview.jpg`;
                              }}
                            />
                          )}

                          {/* Top floating badges */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => handleToggleSelect(item.id)}
                              className="w-6 h-6 rounded-lg bg-white/95 shadow-md flex items-center justify-center text-[#ffb800] cursor-pointer hover:scale-105 transition-transform"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 fill-[#ffb800] text-white" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            <div className="flex items-center gap-1">
                              {item.isCompanyUpload && (
                                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                                  <Camera className="w-2.5 h-2.5" />
                                  <span>Empresa</span>
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider backdrop-blur-sm shadow-xs ${
                                  isVideo
                                    ? 'bg-rose-500/90 text-white'
                                    : 'bg-black/75 text-white'
                                }`}
                              >
                                {item.format.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2 pointer-events-auto">
                            <button
                              type="button"
                              onClick={() => setZoomMedia(item)}
                              className="p-2 rounded-xl bg-white/95 text-slate-800 hover:bg-white hover:text-indigo-600 shadow-md transition-all cursor-pointer"
                              title="Visualizar mídia ampliada"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDownloadSingle(item)}
                              className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-md transition-all cursor-pointer"
                              title="Baixar arquivo agora"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyUrl(item.id, item.url)}
                              className="p-2 rounded-xl bg-white/95 text-slate-800 hover:bg-white hover:text-emerald-600 shadow-md transition-all cursor-pointer"
                              title="Copiar URL"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Media Info Footer */}
                        <div className="p-2.5 space-y-1.5 bg-white flex-1 flex flex-col justify-between">
                          <div>
                            <p
                              className="text-[11px] font-semibold text-[#1a1c1d] truncate"
                              title={item.title}
                            >
                              {item.title || 'Arquivo de mídia'}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-[#6e6e77] mt-0.5">
                              <span className="font-semibold text-slate-700">
                                {item.dimensions
                                  ? `${item.dimensions.width}×${item.dimensions.height}`
                                  : isVideo
                                  ? 'Vídeo'
                                  : item.isCompanyUpload
                                  ? 'Foto Original'
                                  : 'Imagem Web'}
                              </span>
                              <span
                                className={`font-mono uppercase text-[9px] px-1.5 py-0.5 rounded ${
                                  item.isCompanyUpload
                                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.isCompanyUpload ? 'Google' : item.source}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDownloadSingle(item)}
                            className="w-full py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-[#fff7db] text-[#1a1c1d] hover:text-[#7c5800] border border-slate-200/80 hover:border-[#ffb800]/40 text-[11px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-[#ffb800]" />
                            <span>Baixar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Empty state prior to search */}
          {!scraperResult && !isLoading && (
            <div className="py-16 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#fff7db] border border-[#ffb800]/40 text-[#7c5800] flex items-center justify-center mx-auto shadow-sm">
                <Film className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[#1a1c1d]">
                  Pronto para extrair mídias com Playwright
                </h3>
                <p className="text-xs text-[#6e6e77] leading-relaxed">
                  Insira a URL do website, perfil ou página de uma empresa. O Playwright irá navegar e identificar todas as fotos, vídeos, banners e mídias de alta resolução prontas para download individual ou em arquivo .ZIP.
                </p>
              </div>

              {url && (
                <button
                  type="button"
                  onClick={() => handleStartScrape()}
                  className="px-6 py-2.5 bg-[#ffb800] hover:bg-[#f5a623] text-[#1a1a1a] font-bold text-xs sm:text-sm rounded-2xl shadow-sm inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Iniciar Extração Agora</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e2e2e4] bg-[#f9f9fb] flex items-center justify-between text-xs text-[#6e6e77] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Playwright Chromium Engine Ativo</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Expanded Zoom Preview Modal */}
      {zoomMedia && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-5xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
            <div className="p-3 bg-black/50 flex items-center justify-between text-white border-b border-white/10">
              <span className="text-xs font-bold truncate max-w-md">{zoomMedia.title}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadSingle(zoomMedia)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMedia(null)}
                  className="p-1.5 text-white/70 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2 flex items-center justify-center bg-black/90">
              {zoomMedia.type === 'video' ? (
                <video
                  src={zoomMedia.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-xl"
                />
              ) : (
                <img
                  src={zoomMedia.url}
                  alt={zoomMedia.title}
                  className="max-h-[75vh] max-w-full object-contain rounded-xl"
                />
              )}
            </div>

            <div className="p-3 bg-black/70 text-xs text-slate-300 flex items-center justify-between border-t border-white/10">
              <span className="font-mono text-[11px] truncate max-w-lg">{zoomMedia.url}</span>
              <span className="uppercase font-bold text-white px-2 py-0.5 bg-white/10 rounded">
                {zoomMedia.format}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
