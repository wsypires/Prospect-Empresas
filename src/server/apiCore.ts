// Web-Standard API Core compatible with Cloudflare Workers, Cloudflare Pages, and Node.js
import { PlaceContact, CompanySocials } from '../types';
import { detectSocialFromUrl, extractSocialsFromText } from '../utils/socialUtils';

export interface ApiEnv {
  GOOGLE_MAPS_API_KEY?: string;
  [key: string]: any;
}

// Fallback real Brazilian states
export const FALLBACK_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

// Helper to create JSON responses with standard CORS & JSON headers
export function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      ...extraHeaders,
    },
  });
}

// Normalize and clean Brazilian phone numbers to detect mobile/WhatsApp
export function parsePhoneInfo(phone: string | null | undefined, internationalPhone: string | null | undefined) {
  if (!phone && !internationalPhone) {
    return {
      nationalPhone: null,
      internationalPhone: null,
      whatsappPhone: null,
      whatsappUrl: null,
      isMobile: false,
    };
  }

  const raw = (internationalPhone || phone || '').trim();
  const digits = raw.replace(/\D/g, '');

  let cleanDigits = digits;
  if (digits.length === 10 || digits.length === 11) {
    cleanDigits = `55${digits}`;
  } else if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
    cleanDigits = `55${digits.substring(1)}`;
  }

  const isMobile = cleanDigits.length === 13 && cleanDigits[4] === '9';
  const defaultGreeting = encodeURIComponent('Olá! Encontrei sua empresa no Google e gostaria de solicitar mais informações.');
  const whatsappUrl = cleanDigits.length >= 10 ? `https://wa.me/${cleanDigits}?text=${defaultGreeting}` : null;

  return {
    nationalPhone: phone || null,
    internationalPhone: internationalPhone || null,
    whatsappPhone: cleanDigits.length >= 10 ? cleanDigits : null,
    whatsappUrl,
    isMobile,
  };
}

// Extract Brazilian address components
export function parseAddressComponents(formattedAddress: string) {
  let neighborhood = '';
  let postalCode = '';

  const cepMatch = formattedAddress.match(/(\d{5}-\d{3})/);
  if (cepMatch) {
    postalCode = cepMatch[1];
  }

  const parts = formattedAddress.split(',').map((s) => s.trim());
  if (parts.length >= 2) {
    const dashParts = parts[0].split('-');
    if (dashParts.length > 1) {
      neighborhood = dashParts[dashParts.length - 1].trim();
    } else if (parts[1]) {
      const subParts = parts[1].split('-');
      if (subParts.length > 1) {
        neighborhood = subParts[0].trim();
      }
    }
  }

  return { neighborhood, postalCode };
}

// Global cache for Edge & Node isolates
let cachedStates: { uf: string; name: string }[] | null = null;
const cachedCitiesByState: Record<string, string[]> = {};

/**
 * Handle all /api/* requests uniformly across Cloudflare Workers and Node.js
 */
export async function handleApiRequest(request: Request, env: ApiEnv): Promise<Response | null> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      },
    });
  }

  // 1. GET /api/health
  if (pathname === '/api/health' && request.method === 'GET') {
    return jsonResponse({
      status: 'ok',
      platform: typeof (globalThis as any).WebSocketPair !== 'undefined' ? 'cloudflare-workers' : 'node-express',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. GET /api/config
  if (pathname === '/api/config' && request.method === 'GET') {
    const apiKey = env.GOOGLE_MAPS_API_KEY || (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_API_KEY : '') || '';
    const isConfigured = Boolean(apiKey && apiKey.length > 10);
    const maskedKey = isConfigured
      ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}`
      : '';

    return jsonResponse({
      hasApiKey: isConfigured,
      maskedKey,
      edgeCompatible: true,
    });
  }

  // 3. GET /api/locations/states
  if (pathname === '/api/locations/states' && request.method === 'GET') {
    if (cachedStates && cachedStates.length > 0) {
      return jsonResponse({ states: cachedStates });
    }

    try {
      const ibgeRes = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
      if (ibgeRes.ok) {
        const data: any = await ibgeRes.json();
        if (Array.isArray(data)) {
          cachedStates = data.map((item: any) => ({
            uf: item.sigla,
            name: item.nome,
          }));
          return jsonResponse({ states: cachedStates });
        }
      }
    } catch (err) {
      console.warn('IBGE states fetch failed, using fallback:', err);
    }

    cachedStates = FALLBACK_STATES;
    return jsonResponse({ states: cachedStates });
  }

  // 4. GET /api/locations/cities?state=UF
  if (pathname === '/api/locations/cities' && request.method === 'GET') {
    const uf = (url.searchParams.get('state') || '').toUpperCase().trim();
    if (!uf) {
      return jsonResponse({ error: 'UF do estado é obrigatória' }, 400);
    }

    if (cachedCitiesByState[uf] && cachedCitiesByState[uf].length > 0) {
      return jsonResponse({ uf, cities: cachedCitiesByState[uf] });
    }

    try {
      const ibgeRes = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
      if (ibgeRes.ok) {
        const data: any = await ibgeRes.json();
        if (Array.isArray(data)) {
          const cities = data
            .map((item: any) => item.nome)
            .sort((a: string, b: string) => a.localeCompare(b, 'pt-BR'));
          cachedCitiesByState[uf] = cities;
          return jsonResponse({ uf, cities });
        }
      }
    } catch (err) {
      console.warn(`IBGE cities fetch failed for ${uf}:`, err);
    }

    return jsonResponse({ uf, cities: cachedCitiesByState[uf] || [] });
  }

  // 5. GET /api/locations/reverse-geocode?lat=...&lng=...
  if (pathname === '/api/locations/reverse-geocode' && request.method === 'GET') {
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');

    if (!lat || !lng) {
      return jsonResponse({ error: 'Latitude e Longitude são necessárias' }, 400);
    }

    try {
      const activeApiKey = env.GOOGLE_MAPS_API_KEY || (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_API_KEY : '');
      if (activeApiKey) {
        const geoRes = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=pt-BR&key=${activeApiKey}`
        );
        if (geoRes.ok) {
          const geoData: any = await geoRes.json();
          if (geoData.results && geoData.results[0]) {
            let city = '';
            let state = '';
            for (const component of geoData.results[0].address_components) {
              if (component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.short_name;
              }
            }
            return jsonResponse({ city, state });
          }
        }
      }

      // Public OpenStreetMap Nominatim reverse fallback
      const nominatimRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        { headers: { 'User-Agent': 'EncontreEmpresas/1.0' } }
      );
      if (nominatimRes.ok) {
        const nomData: any = await nominatimRes.json();
        const city = nomData.address?.city || nomData.address?.town || nomData.address?.municipality || '';
        const state = nomData.address?.state_code || nomData.address?.state || '';
        return jsonResponse({ city, state });
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    }

    return jsonResponse({ city: '', state: '' });
  }

  // 6. POST /api/places/search
  if (pathname === '/api/places/search' && request.method === 'POST') {
    try {
      const body = await request.json() as any;
      const { keyword, country = 'Brasil', state, city, apiKey: customKey, maxResults = 20, pageToken } = body || {};

      if (!keyword || !city) {
        return jsonResponse({ error: 'Palavra-chave e Cidade são campos obrigatórios.' }, 400);
      }

      const activeApiKey = customKey || env.GOOGLE_MAPS_API_KEY || (typeof process !== 'undefined' ? process.env?.GOOGLE_MAPS_API_KEY : '');

      if (!activeApiKey) {
        return jsonResponse({
          error: 'Chave da API do Google Maps não configurada. Por favor, forneça uma API Key válida.',
        }, 400);
      }

      const locationQuery = [keyword, city, state, country].filter(Boolean).join(' ');

      const fieldMask = [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.websiteUri',
        'places.rating',
        'places.userRatingCount',
        'places.googleMapsUri',
        'places.location',
        'places.types',
        'places.businessStatus',
        'places.regularOpeningHours',
        'nextPageToken',
      ].join(',');

      // Limit can go up to 200/300 with Google Places page token pagination
      const targetMax = Math.min(Math.max(Number(maxResults) || 20, 20), 300);
      const allPlaces: any[] = [];
      let currentToken: string | undefined = pageToken || undefined;
      let finalNextPageToken: string | null = null;
      let iterations = 0;
      const maxIterations = Math.ceil(targetMax / 20);

      while (iterations < maxIterations) {
        iterations++;
        const requestBody: any = {
          textQuery: locationQuery,
          languageCode: 'pt-BR',
          pageSize: 20,
        };
        if (currentToken) {
          requestBody.pageToken = currentToken;
        }

        const googleResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': activeApiKey,
            'X-Goog-FieldMask': fieldMask,
          },
          body: JSON.stringify(requestBody),
        });

        const data: any = await googleResponse.json();

        if (!googleResponse.ok) {
          if (allPlaces.length > 0) {
            break;
          }
          console.error('Google Places API Error:', data);
          return jsonResponse({
            error: data.error?.message || 'Erro ao consultar a API do Google Places.',
            details: data.error,
          }, googleResponse.status);
        }

        const batch = data.places || [];
        allPlaces.push(...batch);

        finalNextPageToken = data.nextPageToken || null;
        if (!data.nextPageToken || allPlaces.length >= targetMax) {
          break;
        }
        currentToken = data.nextPageToken;

        // Brief delay for Google Places API to activate the nextPageToken
        if (iterations < maxIterations && currentToken) {
          await new Promise((res) => setTimeout(res, 800));
        }
      }

      const results: PlaceContact[] = allPlaces.map((place: any, index: number) => {
        const name = place.displayName?.text || 'Nome não informado';
        const address = place.formattedAddress || 'Endereço não informado';
        const phoneInfo = parsePhoneInfo(place.nationalPhoneNumber, place.internationalPhoneNumber);
        const addressInfo = parseAddressComponents(address);

        return {
          id: place.id || `place_${index}_${Date.now()}`,
          name,
          keyword: keyword.trim(),
          cnpj: null,
          cnpjStatus: 'search_needed',
          address,
          neighborhood: addressInfo.neighborhood,
          postalCode: addressInfo.postalCode,
          city: city.trim(),
          state: state ? state.trim() : '',
          country: country.trim(),
          nationalPhone: phoneInfo.nationalPhone,
          internationalPhone: phoneInfo.internationalPhone,
          whatsappPhone: phoneInfo.whatsappPhone,
          whatsappUrl: phoneInfo.whatsappUrl,
          isMobile: phoneInfo.isMobile,
          website: place.websiteUri || null,
          socials: place.websiteUri
            ? (() => {
                const detected = detectSocialFromUrl(place.websiteUri);
                return detected ? { [detected.network]: detected.url } : null;
              })()
            : null,
          googleMapsUrl:
            place.googleMapsUri ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}`,
          rating: place.rating || null,
          userRatingCount: place.userRatingCount || 0,
          businessStatus: place.businessStatus || 'OPERATIONAL',
          location: place.location
            ? {
                lat: place.location.latitude,
                lng: place.location.longitude,
              }
            : null,
          types: place.types || [],
          isOpenNow: place.regularOpeningHours?.openNow ?? null,
        };
      });

      return jsonResponse({
        success: true,
        query: locationQuery,
        total: results.length,
        places: results,
        nextPageToken: finalNextPageToken,
      });
    } catch (error: any) {
      console.error('API Places error:', error);
      return jsonResponse({
        error: 'Erro interno ao processar a busca de empresas.',
        message: error.message,
      }, 500);
    }
  }

  // 7. POST /api/cnpj/lookup
  if (pathname === '/api/cnpj/lookup' && request.method === 'POST') {
    try {
      const body = await request.json() as any;
      const { name, city } = body || {};
      if (!name) {
        return jsonResponse({ error: 'Nome é obrigatório para consulta de CNPJ' }, 400);
      }

      const cleanSearchTerm = name
        .replace(/^(Dra\.|Dr\.|Clínica|Drogaria|Farmácia|Consultório|Escritório|Restaurante|Oficina)\s+/i, '')
        .replace(/\s+(LTDA|ME|EPP|S\/A|SA|EIRELI)$/i, '')
        .trim();

      const searchUrl = `https://cnpj.biz/procura/${encodeURIComponent(cleanSearchTerm + (city ? ' ' + city : ''))}`;
      const casaDosDadosUrl = `https://casadosdados.com.br/solucao/cnpj/pesquisa-avancada?q=${encodeURIComponent(cleanSearchTerm)}`;

      return jsonResponse({
        searchTerm: cleanSearchTerm,
        queryLinks: {
          cnpjBiz: searchUrl,
          casaDosDados: casaDosDadosUrl,
          receitaFederal: `https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp`,
        },
      });
    } catch (error: any) {
      return jsonResponse({ error: 'Falha ao buscar CNPJ' }, 500);
    }
  }

  // 8. POST /api/places/detect-socials
  if (pathname === '/api/places/detect-socials' && request.method === 'POST') {
    try {
      const body = await request.json() as any;
      const { url: targetUrl } = body || {};
      if (!targetUrl || typeof targetUrl !== 'string') {
        return jsonResponse({ error: 'URL do website é obrigatória' }, 400);
      }

      const cleanUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      try {
        const htmlRes = await fetch(cleanUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        clearTimeout(timeoutId);

        if (!htmlRes.ok) {
          return jsonResponse({ success: false, error: `Website retornou status HTTP ${htmlRes.status}` }, 200);
        }

        const html = await htmlRes.text();
        const detected = extractSocialsFromText(html);

        return jsonResponse({
          success: true,
          url: cleanUrl,
          socials: detected,
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        return jsonResponse({
          success: false,
          error: fetchErr.name === 'AbortError' ? 'Tempo limite ao acessar website da empresa' : (fetchErr.message || 'Falha ao acessar website'),
        }, 200);
      }
    } catch (err: any) {
      return jsonResponse({ error: 'Erro ao detectar redes sociais' }, 500);
    }
  }

  // 9. GET /api/scraper/download (Cloudflare Pages Edge proxy)
  if (pathname === '/api/scraper/download' && request.method === 'GET') {
    try {
      const targetUrl = url.searchParams.get('url');
      const requestedFilename = url.searchParams.get('filename') || 'arquivo_midia';
      if (!targetUrl) {
        return jsonResponse({ error: 'URL é obrigatória' }, 400);
      }

      let origin = 'https://google.com';
      try {
        origin = new URL(targetUrl).origin;
      } catch {}

      const fetchRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: origin,
        },
      });

      if (!fetchRes.ok) {
        return jsonResponse({ error: 'Falha ao baixar imagem' }, fetchRes.status);
      }

      const contentType = fetchRes.headers.get('content-type') || 'application/octet-stream';
      return new Response(fetchRes.body, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(requestedFilename)}"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 10. POST /api/scraper/download-zip (Cloudflare Edge ZIP builder)
  if (pathname === '/api/scraper/download-zip' && request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      const { items, zipName = 'midias-empresa' } = body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return jsonResponse({ error: 'Nenhum item fornecido para download.' }, 400);
      }

      const JSZipModule = await import('jszip');
      const JSZip = (JSZipModule as any).default || JSZipModule;
      const zip = new JSZip();
      const folder = zip.folder(zipName) || zip;

      const fetchPromises = items.map(
        async (item: { url: string; filename?: string }, index: number) => {
          try {
            let origin = 'https://google.com';
            try {
              origin = new URL(item.url).origin;
            } catch {}

            const itemRes = await fetch(item.url, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Referer: origin,
              },
            });

            if (itemRes.ok) {
              const buf = await itemRes.arrayBuffer();
              const cleanName =
                item.filename ||
                `midia_${String(index + 1).padStart(2, '0')}.${item.url.split('?')[0].split('.').pop() || 'jpg'}`;
              folder.file(cleanName, buf);
            }
          } catch {}
        }
      );

      await Promise.allSettled(fetchPromises);
      const zipData = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

      return new Response(zipData, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(zipName)}.zip"`,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err: any) {
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // 11. POST /api/scraper/extract (Cloudflare Edge HTML extraction fallback)
  if (pathname === '/api/scraper/extract' && request.method === 'POST') {
    try {
      const body = (await request.json()) as any;
      const { url: targetUrl, companyName } = body || {};
      if (!targetUrl) {
        return jsonResponse({ error: 'URL é obrigatória' }, 400);
      }

      const cleanUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
      const pageRes = await fetch(cleanUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!pageRes.ok) {
        return jsonResponse({ error: `Página retornou status ${pageRes.status}` }, 400);
      }

      const html = await pageRes.text();
      const mediaList: any[] = [];
      const seen = new Set<string>();

      const ogMatches = html.matchAll(
        /<meta\s+[^>]*property=["'](og:image|og:video)["'][^>]*content=["']([^"']+)["']/gi
      );
      for (const m of ogMatches) {
        const u = m[2];
        if (u && !seen.has(u)) {
          seen.add(u);
          mediaList.push({
            id: `og_${mediaList.length}`,
            url: u,
            type: m[1].includes('video') ? 'video' : 'image',
            format: 'jpg',
            title: `${companyName || 'Mídia'} (OpenGraph)`,
            source: 'meta',
          });
        }
      }

      const imgMatches = html.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/gi);
      for (const m of imgMatches) {
        const u = m[1];
        if (
          u &&
          !u.startsWith('data:') &&
          !seen.has(u) &&
          (u.includes('.jpg') ||
            u.includes('.png') ||
            u.includes('.webp') ||
            u.includes('googleusercontent.com/p/'))
        ) {
          seen.add(u);
          let fullUrl = u;
          if (u.startsWith('//')) fullUrl = `https:${u}`;
          else if (u.startsWith('/')) {
            try {
              fullUrl = new URL(u, cleanUrl).href;
            } catch {}
          }
          mediaList.push({
            id: `img_${mediaList.length}`,
            url: fullUrl,
            type: 'image',
            format: 'jpg',
            title: `${companyName || 'Imagem'}`,
            source: 'img',
            isCompanyUpload: u.includes('googleusercontent.com/p/'),
          });
        }
      }

      return jsonResponse({
        success: true,
        targetUrl: cleanUrl,
        pageTitle: companyName || 'Website',
        total: mediaList.length,
        imagesCount: mediaList.filter((m) => m.type === 'image').length,
        videosCount: mediaList.filter((m) => m.type === 'video').length,
        media: mediaList,
        engine: 'Cloudflare Edge Fetcher',
      });
    } catch (err: any) {
      return jsonResponse(
        { error: 'Erro ao extrair mídias no Cloudflare Edge', details: err.message },
        500
      );
    }
  }

  // Not an API route or route not handled
  return null;
}
