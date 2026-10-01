import { chromium, type Browser } from 'playwright';
import { ScrapedMediaItem, ScraperResult } from '../types';

// Filter out known tracking pixels and analytics beacons
export function isTrackingBeacon(url: string): boolean {
  const lower = (url || '').toLowerCase();
  return (
    lower.includes('google-analytics.com') ||
    lower.includes('googletagmanager.com') ||
    lower.includes('facebook.com/tr') ||
    lower.includes('bat.bing.com') ||
    lower.includes('doubleclick.net') ||
    lower.includes('analytics') ||
    (lower.includes('pixel') && (lower.endsWith('.gif') || lower.includes('1x1'))) ||
    lower.includes('/beacon') ||
    lower.includes('statcounter.com')
  );
}

// True if image was uploaded by company/user to Google Places/Maps (photos)
export function isCompanyUploadedGooglePhoto(url: string): boolean {
  const lower = (url || '').toLowerCase();
  return (
    lower.includes('googleusercontent.com/p/') ||
    lower.includes('ggpht.com/p/') ||
    lower.includes('.googleusercontent.com/p/')
  );
}

// Transform Google Photo thumbnail to high resolution (1600px+)
export function upgradeGooglePhotoToHighRes(url: string): string {
  if (isCompanyUploadedGooglePhoto(url)) {
    // Replaces dimensions like =w408-h256-k-no or =w256-h256 with high-resolution =s1600
    return url.replace(/=w\d+.*?$|=s\d+.*?$/i, '=s1600');
  }
  return url;
}

// Check if URL or dimensions correspond to Google Maps / OpenStreetMap tile or map UI
export function isGoogleMapsTileOrSystemAsset(url: string, width?: number, height?: number): boolean {
  // 1. Strict filter: 256x256 square tile (Google Maps, OpenStreetMap, Leaflet standard tile size)
  if (width === 256 && height === 256) {
    return true;
  }

  // 2. Filter tiny UI markers/bullets
  if (width && height && width <= 48 && height <= 48) {
    return true;
  }

  const lower = (url || '').toLowerCase();

  // If it's an uploaded business photo (/p/ prefix), do NOT treat it as a map tile
  if (isCompanyUploadedGooglePhoto(lower)) {
    return false;
  }

  // 3. Exclude map tiles (vector, raster, satellite, street view tiles)
  if (
    lower.includes('/maps/vt') ||
    lower.includes('/vt/pb=') ||
    lower.includes('/vt/data=') ||
    lower.includes('/vt/lyrs=') ||
    lower.includes('/vt/icon') ||
    lower.includes('/maps/vt?') ||
    lower.includes('google.com/maps/vt') ||
    lower.includes('maps.gstatic.com/tactile') ||
    lower.includes('maps.gstatic.com/mapfiles') ||
    lower.includes('maps.gstatic.com/map-tiles') ||
    lower.includes('khms0.google') ||
    lower.includes('khms1.google') ||
    lower.includes('khms2.google') ||
    lower.includes('khms3.google') ||
    lower.includes('kh.google.com') ||
    lower.includes('streetviewpixels-pa.googleapis.com') ||
    lower.includes('cbk?output=tile') ||
    lower.includes('tile.openstreetmap.org') ||
    lower.includes('api.mapbox.com') ||
    lower.includes('maps.googleapis.com/maps/api/staticmap')
  ) {
    return true;
  }

  // 4. Exclude map UI widgets & sprites
  if (
    lower.includes('maps/icons/') ||
    lower.includes('images/branding/googlelogo') ||
    lower.includes('images/branding/product') ||
    lower.includes('maps_watermark') ||
    lower.includes('compass_') ||
    lower.includes('pegman_') ||
    lower.includes('transparent.png') ||
    lower.includes('cleardot.gif') ||
    lower.includes('autotile') ||
    lower.includes('place_api/icons')
  ) {
    return true;
  }

  return false;
}

// Determine file format from URL extension or MIME
export function detectFormat(url: string, fallbackType: 'image' | 'video'): string {
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const extMatch = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    if (extMatch) {
      return extMatch[1].toLowerCase();
    }
  } catch (e) {
    // Ignore URL parse errors
  }
  return fallbackType === 'video' ? 'mp4' : 'jpg';
}

/**
 * Generates a canonical fingerprint to detect and eliminate duplicate media items:
 * - Google Photos: extracts unique photo key /p/<id> so variants with different subdomains (lh3..lh6)
 *   or different resize parameters (=w..., =s...) resolve to the same identifier.
 * - Street View: extracts panoid=<id>.
 * - CMS / CDN responsive images: normalizes WordPress (-300x200.jpg) and Shopify (_300x300.jpg) thumbnails to master base path.
 * - Strips cache-busting, tracking, and sizing query parameters.
 */
export function getMediaCanonicalFingerprint(url: string): string {
  if (!url) return '';
  const raw = url.trim();

  // 1. Google Maps / Google Photos uploaded photo
  const googlePhotoMatch = raw.match(/(?:googleusercontent\.com|ggpht\.com)\/p\/([a-zA-Z0-9_-]+)/i);
  if (googlePhotoMatch && googlePhotoMatch[1]) {
    return `gphoto:${googlePhotoMatch[1]}`;
  }

  // 2. Google Street View Panoramas
  const panoMatch = raw.match(/panoid=([a-zA-Z0-9_-]+)/i);
  if (panoMatch && panoMatch[1]) {
    return `gstreetview:${panoMatch[1]}`;
  }

  try {
    const parsed = new URL(raw);
    let pathname = parsed.pathname;

    // Normalize responsive thumbnail patterns:
    // e.g. /uploads/photo-300x200.jpg -> /uploads/photo.jpg
    pathname = pathname.replace(/(-\d+x\d+)(\.[a-zA-Z0-9]+)$/i, '$2');
    // Shopify thumbnail pattern: _300x300.jpg or _large.jpg
    pathname = pathname.replace(/(_\d+x\d+|_thumb|_small|_medium|_large|_grande)(\.[a-zA-Z0-9]+)$/i, '$2');

    // Canonical hostname without www.
    const hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    // Remove common cache-busting, sizing, tracking query parameters
    const sp = new URLSearchParams(parsed.search);
    const paramsToRemove = [
      'v', 'ver', 'version', 't', '_t', '_', 'ts', 'cache', 'timestamp',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source',
      'w', 'width', 'h', 'height', 'resize', 'fit', 'crop', 'size', 's', 'quality', 'q',
      'format', 'fm', 'auto'
    ];
    paramsToRemove.forEach((p) => sp.delete(p));

    const cleanSearch = sp.toString();
    const queryPart = cleanSearch ? `?${cleanSearch}` : '';

    return `${hostname}${pathname.toLowerCase()}${queryPart}`;
  } catch {
    // If URL parsing fails, strip query and hash
    return raw.split('?')[0].split('#')[0].toLowerCase();
  }
}

// Browser context evaluation script as pure JS string to bypass tsx/esbuild helper injection
const EXTRACT_MEDIA_SCRIPT = `
(() => {
  const results = [];
  const seenFingerprints = new Set();
  const baseHref = document.baseURI || window.location.href;

  function toAbsolute(rel) {
    try {
      return new URL(rel, baseHref).href;
    } catch (e) {
      return rel;
    }
  }

  function isCompanyPhoto(u) {
    const l = (u || '').toLowerCase();
    return l.includes('googleusercontent.com/p/') || l.includes('ggpht.com/p/');
  }

  function upgradePhoto(u) {
    if (isCompanyPhoto(u)) {
      return u.replace(/=w\\d+.*?$|=s\\d+.*?$/i, '=s1600');
    }
    return u;
  }

  function getFp(u) {
    if (!u) return '';
    const gMatch = u.match(/(?:googleusercontent\\.com|ggpht\\.com)\\/p\\/([a-zA-Z0-9_-]+)/i);
    if (gMatch && gMatch[1]) return 'gphoto:' + gMatch[1];
    const panoMatch = u.match(/panoid=([a-zA-Z0-9_-]+)/i);
    if (panoMatch && panoMatch[1]) return 'gstreetview:' + panoMatch[1];
    try {
      const parsed = new URL(u, baseHref);
      let p = parsed.pathname.toLowerCase().replace(/(-\\d+x\\d+)(\\.[a-z0-9]+)$/i, '$2');
      return parsed.hostname.replace(/^www\\./i, '') + p;
    } catch(e) {
      return u.split('?')[0].split('#')[0].toLowerCase();
    }
  }

  function addMedia(item) {
    if (!item || !item.url) return;
    const fp = getFp(item.url);
    if (seenFingerprints.has(fp)) {
      // If already recorded, upgrade if current item has better dimensions or company flag
      const existing = results.find(r => getFp(r.url) === fp);
      if (existing) {
        if ((item.width || 0) > (existing.width || 0)) {
          existing.width = item.width;
          existing.height = item.height;
          existing.url = item.url;
        }
        if (item.isCompanyUpload && !existing.isCompanyUpload) {
          existing.isCompanyUpload = true;
          existing.url = upgradePhoto(existing.url);
        }
      }
      return;
    }
    seenFingerprints.add(fp);
    results.push(item);
  }

  function isMapTileOrUi(u, w, h) {
    // 1. Exact 256x256 tiles are always maps
    if (w === 256 && h === 256) return true;
    // 2. Small UI markers
    if (w && h && w <= 48 && h <= 48) return true;

    const l = (u || '').toLowerCase();

    // Never filter out real business uploaded photos
    if (isCompanyPhoto(l)) return false;

    if (
      l.includes('/maps/vt') ||
      l.includes('/vt/pb=') ||
      l.includes('/vt/data=') ||
      l.includes('/vt/lyrs=') ||
      l.includes('/vt/icon') ||
      l.includes('/maps/vt?') ||
      l.includes('google.com/maps/vt') ||
      l.includes('maps.gstatic.com/tactile') ||
      l.includes('maps.gstatic.com/mapfiles') ||
      l.includes('maps.gstatic.com/map-tiles') ||
      l.includes('khms0.google') ||
      l.includes('khms1.google') ||
      l.includes('khms2.google') ||
      l.includes('khms3.google') ||
      l.includes('kh.google.com') ||
      l.includes('streetviewpixels-pa.googleapis.com') ||
      l.includes('cbk?output=tile') ||
      l.includes('tile.openstreetmap.org') ||
      l.includes('api.mapbox.com') ||
      l.includes('maps.googleapis.com/maps/api/staticmap') ||
      l.includes('maps/icons/') ||
      l.includes('images/branding/googlelogo') ||
      l.includes('images/branding/product') ||
      l.includes('maps_watermark') ||
      l.includes('compass_') ||
      l.includes('pegman_') ||
      l.includes('transparent.png') ||
      l.includes('cleardot.gif') ||
      l.includes('autotile') ||
      l.includes('place_api/icons')
    ) {
      return true;
    }
    return false;
  }

  // 1. Google Maps specific Photo Gallery elements (buttons, feeds, hero headers)
  const googlePhotoItems = document.querySelectorAll(
    'button[style*="googleusercontent.com/p/"], div[style*="googleusercontent.com/p/"], a[style*="googleusercontent.com/p/"], img[src*="googleusercontent.com/p/"], [data-photo-url]'
  );
  googlePhotoItems.forEach((el) => {
    let photoUrl = '';
    if (el.tagName === 'IMG') {
      photoUrl = el.src || el.currentSrc;
    } else if (el.getAttribute('data-photo-url')) {
      photoUrl = el.getAttribute('data-photo-url');
    } else {
      const style = el.getAttribute('style') || '';
      const match = style.match(/url\\(['"]?(.*?)['"]?\\)/i);
      if (match && match[1]) photoUrl = match[1];
    }

    if (photoUrl && isCompanyPhoto(photoUrl)) {
      const highRes = upgradePhoto(toAbsolute(photoUrl));
      addMedia({
        url: highRes,
        type: 'image',
        title: el.getAttribute('aria-label') || el.getAttribute('title') || 'Foto da Empresa (Google Maps)',
        width: 1600,
        height: 1200,
        source: 'img',
        isCompanyUpload: true,
      });
    }
  });

  // 2. All <img> tags
  const images = document.querySelectorAll('img');
  images.forEach((img) => {
    const w = img.naturalWidth || img.width || 0;
    const h = img.naturalHeight || img.height || 0;

    const candidates = [
      img.currentSrc,
      img.src,
      img.getAttribute('data-src'),
      img.getAttribute('data-lazy-src'),
      img.getAttribute('data-original'),
      img.getAttribute('data-high-res-src'),
    ].filter(Boolean);

    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const parts = srcset.split(',').map((p) => p.trim().split(' ')[0]);
      if (parts.length > 0) candidates.push(parts[parts.length - 1]);
    }

    candidates.forEach((c) => {
      if (!c || c.startsWith('data:image/svg+xml;base64,PHN2Zy')) return;
      const abs = toAbsolute(c);
      const isComp = isCompanyPhoto(abs);

      // If it's an authentic company photo from Google Photos
      if (isComp) {
        addMedia({
          url: upgradePhoto(abs),
          type: 'image',
          title: img.alt || img.title || 'Foto da Empresa (Google)',
          width: w && w !== 256 ? w : 1600,
          height: h && h !== 256 ? h : 1200,
          source: 'img',
          isCompanyUpload: true,
        });
        return;
      }

      // If it is a 256x256 map tile or map UI asset, discard!
      if (isMapTileOrUi(abs, w, h)) return;

      addMedia({
        url: abs,
        type: 'image',
        title: img.alt || img.title || 'Imagem da empresa',
        width: w || undefined,
        height: h || undefined,
        source: 'img',
        isCompanyUpload: false,
      });
    });
  });

  // 3. All <picture> <source> tags
  const pictureSources = document.querySelectorAll('picture source');
  pictureSources.forEach((srcElem) => {
    const srcset = srcElem.getAttribute('srcset');
    if (srcset) {
      const parts = srcset.split(',').map((p) => p.trim().split(' ')[0]);
      parts.forEach((p) => {
        if (p) {
          const abs = toAbsolute(p);
          if (!isMapTileOrUi(abs, 0, 0)) {
            const isComp = isCompanyPhoto(abs);
            addMedia({
              url: isComp ? upgradePhoto(abs) : abs,
              type: 'image',
              title: 'Imagem em alta resolução',
              source: 'img',
              isCompanyUpload: isComp,
            });
          }
        }
      });
    }
  });

  // 4. Background images from elements with inline styles
  const elementsWithStyle = document.querySelectorAll('[style*="background"], [style*="Background"]');
  elementsWithStyle.forEach((elem) => {
    const style = elem.getAttribute('style') || '';
    const match = style.match(/url\\(['"]?(.*?)['"]?\\)/i);
    if (match && match[1] && !match[1].startsWith('data:')) {
      const abs = toAbsolute(match[1]);
      const isComp = isCompanyPhoto(abs);

      if (isComp) {
        addMedia({
          url: upgradePhoto(abs),
          type: 'image',
          title: elem.getAttribute('aria-label') || elem.getAttribute('title') || 'Foto da Empresa (Galeria)',
          width: 1600,
          height: 1200,
          source: 'background',
          isCompanyUpload: true,
        });
        return;
      }

      if (isMapTileOrUi(abs, 0, 0)) return;

      addMedia({
        url: abs,
        type: 'image',
        title: 'Imagem de Fundo (Background)',
        source: 'background',
        isCompanyUpload: false,
      });
    }
  });

  // 5. All <video> elements and child <source> tags
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    const videoSources = [video.currentSrc, video.src].filter(Boolean);
    const sourceTags = video.querySelectorAll('source');
    sourceTags.forEach((s) => {
      if (s.src) videoSources.push(s.src);
    });

    const poster = video.poster ? toAbsolute(video.poster) : undefined;
    if (poster && !isMapTileOrUi(poster, 0, 0)) {
      addMedia({
        url: poster,
        type: 'image',
        title: 'Capa / Poster do Vídeo',
        source: 'meta',
      });
    }

    videoSources.forEach((src) => {
      if (src) {
        addMedia({
          url: toAbsolute(src),
          type: 'video',
          title: video.title || 'Vídeo incorporado',
          width: video.videoWidth || undefined,
          height: video.videoHeight || undefined,
          thumbnail: poster,
          source: 'video',
        });
      }
    });
  });

  // 6. OpenGraph and Twitter meta media
  const ogImages = document.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"], meta[name="twitter:image"]');
  ogImages.forEach((meta) => {
    const content = meta.getAttribute('content');
    if (content) {
      const abs = toAbsolute(content);
      if (!isMapTileOrUi(abs, 0, 0)) {
        const isComp = isCompanyPhoto(abs);
        addMedia({
          url: isComp ? upgradePhoto(abs) : abs,
          type: 'image',
          title: 'Imagem de Compartilhamento (OpenGraph)',
          source: 'meta',
          isCompanyUpload: isComp,
        });
      }
    }
  });

  const ogVideos = document.querySelectorAll('meta[property="og:video"], meta[property="og:video:secure_url"], meta[name="twitter:player:stream"]');
  ogVideos.forEach((meta) => {
    const content = meta.getAttribute('content');
    if (content) {
      addMedia({
        url: toAbsolute(content),
        type: 'video',
        title: 'Vídeo (OpenGraph / Meta)',
        source: 'meta',
      });
    }
  });

  // 7. Direct media links in <a> tags
  const mediaLinks = document.querySelectorAll('a[href]');
  mediaLinks.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const clean = href.split('?')[0].toLowerCase();
    if (clean.endsWith('.mp4') || clean.endsWith('.webm') || clean.endsWith('.mov') || clean.endsWith('.m4v')) {
      addMedia({
        url: toAbsolute(href),
        type: 'video',
        title: a.textContent ? a.textContent.trim() : 'Link para Vídeo',
        source: 'link',
      });
    } else if (clean.endsWith('.jpg') || clean.endsWith('.jpeg') || clean.endsWith('.png') || clean.endsWith('.webp') || clean.endsWith('.gif')) {
      const abs = toAbsolute(href);
      if (!isMapTileOrUi(abs, 0, 0)) {
        const isComp = isCompanyPhoto(abs);
        addMedia({
          url: isComp ? upgradePhoto(abs) : abs,
          type: 'image',
          title: a.textContent ? a.textContent.trim() : 'Link para Imagem',
          source: 'link',
          isCompanyUpload: isComp,
        });
      }
    }
  });

  return results;
})()
`;

/**
 * Scrapes all media (images & videos) from a given webpage using Playwright Headless Chromium.
 * Strictly excludes 256x256 map tiles, extracts authentic company-uploaded media, and eliminates duplicate items.
 */
export async function scrapePageMedia(
  rawUrl: string,
  companyName?: string,
  options?: { deduplicate?: boolean }
): Promise<ScraperResult> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://${targetUrl}`;
  }

  let browser: Browser | null = null;
  const shouldDeduplicate = options?.deduplicate !== false;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
      ],
    });

    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      bypassCSP: true,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Navigate with a generous 20s timeout
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    const isGoogleMaps =
      targetUrl.includes('google.com/maps') ||
      targetUrl.includes('maps.google.com') ||
      targetUrl.includes('goo.gl/maps');

    if (isGoogleMaps) {
      try {
        await page.waitForTimeout(1500);

        // Dismiss cookie consent if shown
        const consent = await page.$(
          'button[aria-label*="Concordo"], button[aria-label*="Aceitar"], form[action*="consent"] button, button:has-text("Aceitar tudo"), button:has-text("Accept all")'
        );
        if (consent) {
          await consent.click().catch(() => {});
          await page.waitForTimeout(1000);
        }

        // Try to click the photos tab/gallery if available on Google Maps
        const photoTab = await page.$(
          'button[aria-label*="Foto" i], button[aria-label*="Photo" i], button.aoLF0d, div[role="tab"]:has-text("Fotos"), div[role="tab"]:has-text("Photos"), button[jsaction*="pane.heroHeaderImage"]'
        );
        if (photoTab) {
          await photoTab.click().catch(() => {});
          await page.waitForTimeout(1500);
        }

        // Scroll the photo container or feed
        await page.evaluate(`
          (() => {
            const containers = document.querySelectorAll('div[role="feed"], div[role="main"], div.m6QErb, div[tabindex="-1"]');
            containers.forEach((c) => {
              c.scrollBy(0, 1500);
            });
          })()
        `);
        await page.waitForTimeout(1000);
      } catch (e) {
        // Non-critical interaction
      }
    } else {
      // General website scroll to trigger lazy loading
      try {
        await page.evaluate(`
          (() => {
            window.scrollBy(0, 800);
            setTimeout(() => {
              window.scrollBy(0, 1600);
              setTimeout(() => {
                window.scrollTo(0, 0);
              }, 300);
            }, 300);
          })()
        `);
        await page.waitForTimeout(800);
      } catch (e) {
        // Non-critical scroll error
      }
    }

    const pageTitle = await page.title().catch(() => '');

    // Extract all media within the browser execution context
    const rawMedia = (await page.evaluate(EXTRACT_MEDIA_SCRIPT)) as Array<{
      url: string;
      type: 'image' | 'video';
      title: string;
      width?: number;
      height?: number;
      thumbnail?: string;
      source: 'img' | 'video' | 'background' | 'meta' | 'link' | 'iframe';
      isCompanyUpload?: boolean;
    }>;

    await browser.close();
    browser = null;

    // Filter, deduplicate, and enrich items
    const fingerprintMap = new Map<string, ScrapedMediaItem>();
    const nonDeduplicatedList: ScrapedMediaItem[] = [];
    let duplicatesRemovedCount = 0;

    for (let i = 0; i < rawMedia.length; i++) {
      const item = rawMedia[i];
      if (!item.url || item.url.startsWith('javascript:')) continue;
      if (item.url.startsWith('data:') && item.url.length < 200) continue;

      // Filter tracking beacons
      if (isTrackingBeacon(item.url)) continue;

      // Filter 1x1 spacer images
      if (item.width === 1 && item.height === 1) continue;

      const normUrl = item.url.split('#')[0];
      const isComp = isCompanyUploadedGooglePhoto(normUrl) || Boolean(item.isCompanyUpload);

      // Strict filter: Do NOT scrape 256x256 map tiles
      if (!isComp) {
        if (item.width === 256 && item.height === 256) {
          continue;
        }
        if (isGoogleMapsTileOrSystemAsset(normUrl, item.width, item.height)) {
          continue;
        }
      }

      const enhancedUrl = isComp ? upgradeGooglePhotoToHighRes(normUrl) : item.url;
      const format = detectFormat(enhancedUrl, item.type);
      const dimensions =
        item.width && item.height && item.width !== 256
          ? { width: item.width, height: item.height }
          : isComp
          ? { width: 1600, height: 1200 }
          : undefined;

      const mediaItem: ScrapedMediaItem = {
        id: `media_${i}_${Date.now()}`,
        url: enhancedUrl,
        type: item.type,
        format,
        title: isComp && companyName ? `${companyName} - Foto da Empresa` : item.title,
        dimensions,
        thumbnail: item.thumbnail,
        source: item.source,
        isCompanyUpload: isComp,
      };

      if (shouldDeduplicate) {
        const fp = getMediaCanonicalFingerprint(enhancedUrl);
        if (fingerprintMap.has(fp)) {
          duplicatesRemovedCount++;
          const existing = fingerprintMap.get(fp)!;
          // Compare and keep the highest resolution / enhanced company photo
          const curW = dimensions?.width || 0;
          const exW = existing.dimensions?.width || 0;
          if (curW > exW || (isComp && !existing.isCompanyUpload)) {
            fingerprintMap.set(fp, { ...mediaItem, id: existing.id });
          }
          continue;
        }
        fingerprintMap.set(fp, mediaItem);
      } else {
        nonDeduplicatedList.push(mediaItem);
      }
    }

    const finalMedia = shouldDeduplicate
      ? Array.from(fingerprintMap.values())
      : nonDeduplicatedList;

    const imagesCount = finalMedia.filter((m) => m.type === 'image').length;
    const videosCount = finalMedia.filter((m) => m.type === 'video').length;

    return {
      success: true,
      targetUrl,
      pageTitle,
      total: finalMedia.length,
      imagesCount,
      videosCount,
      media: finalMedia,
      duplicatesRemoved: duplicatesRemovedCount,
      engine: 'playwright',
    };
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.warn(`Playwright encounter: ${error.message}. Running fallback parser...`);

    // Fallback parser using standard fetch & regex in case of site protection/anti-bot
    return await scrapePageMediaFallback(targetUrl, error.message, companyName, options);
  }
}

/**
 * Resilient HTTP Fallback parser if Playwright encounters bot protection or SSL block
 */
async function scrapePageMediaFallback(
  targetUrl: string,
  originalError: string,
  companyName?: string,
  options?: { deduplicate?: boolean }
): Promise<ScraperResult> {
  const shouldDeduplicate = options?.deduplicate !== false;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const fingerprintMap = new Map<string, ScrapedMediaItem>();
    const mediaList: ScrapedMediaItem[] = [];
    let duplicatesCount = 0;

    const toAbsolute = (rel: string) => {
      try {
        return new URL(rel, targetUrl).href;
      } catch {
        return rel;
      }
    };

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '';

    const registerItem = (item: ScrapedMediaItem) => {
      if (shouldDeduplicate) {
        const fp = getMediaCanonicalFingerprint(item.url);
        if (fingerprintMap.has(fp)) {
          duplicatesCount++;
          const existing = fingerprintMap.get(fp)!;
          if (item.isCompanyUpload && !existing.isCompanyUpload) {
            fingerprintMap.set(fp, { ...item, id: existing.id });
          }
          return;
        }
        fingerprintMap.set(fp, item);
      } else {
        mediaList.push(item);
      }
    };

    // Regex extract <img>
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    let idx = 0;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = toAbsolute(match[1]);
      const isComp = isCompanyUploadedGooglePhoto(src);

      if (!isTrackingBeacon(src)) {
        if (!isComp && isGoogleMapsTileOrSystemAsset(src)) {
          continue;
        }

        const finalUrl = isComp ? upgradeGooglePhotoToHighRes(src) : src;
        registerItem({
          id: `fallback_img_${idx++}`,
          url: finalUrl,
          type: 'image',
          format: detectFormat(finalUrl, 'image'),
          title: isComp && companyName ? `${companyName} - Foto da Empresa` : 'Imagem da página',
          source: 'img',
          isCompanyUpload: isComp,
          dimensions: isComp ? { width: 1600, height: 1200 } : undefined,
        });
      }
    }

    // Regex extract <video> and <source>
    const videoRegex = /<(?:video|source)[^>]+src=["']([^"']+)["'][^>]*>/gi;
    while ((match = videoRegex.exec(html)) !== null) {
      const src = toAbsolute(match[1]);
      registerItem({
        id: `fallback_vid_${idx++}`,
        url: src,
        type: 'video',
        format: detectFormat(src, 'video'),
        title: 'Vídeo da página',
        source: 'video',
      });
    }

    // Regex extract og:image / og:video
    const metaRegex =
      /<meta[^>]+(?:property|name)=["'](og:image|twitter:image|og:video)["'][^>]+content=["']([^"']+)["'][^>]*>/gi;
    while ((match = metaRegex.exec(html)) !== null) {
      const prop = match[1].toLowerCase();
      const content = toAbsolute(match[2]);
      const isComp = isCompanyUploadedGooglePhoto(content);

      if (!isTrackingBeacon(content)) {
        if (!isComp && isGoogleMapsTileOrSystemAsset(content)) {
          continue;
        }

        const isVideo = prop.includes('video');
        const finalUrl = isComp ? upgradeGooglePhotoToHighRes(content) : content;
        registerItem({
          id: `fallback_meta_${idx++}`,
          url: finalUrl,
          type: isVideo ? 'video' : 'image',
          format: detectFormat(finalUrl, isVideo ? 'video' : 'image'),
          title: isVideo
            ? 'Vídeo (Meta)'
            : isComp && companyName
            ? `${companyName} - Foto da Empresa`
            : 'Imagem (OpenGraph)',
          source: 'meta',
          isCompanyUpload: isComp,
        });
      }
    }

    const finalMedia = shouldDeduplicate
      ? Array.from(fingerprintMap.values())
      : mediaList;

    return {
      success: true,
      targetUrl,
      pageTitle,
      total: finalMedia.length,
      imagesCount: finalMedia.filter((m) => m.type === 'image').length,
      videosCount: finalMedia.filter((m) => m.type === 'video').length,
      media: finalMedia,
      duplicatesRemoved: duplicatesCount,
      engine: 'html-fallback',
    };
  } catch (fallbackError: any) {
    return {
      success: false,
      targetUrl,
      pageTitle: '',
      total: 0,
      imagesCount: 0,
      videosCount: 0,
      media: [],
      error: `Falha ao raspar a URL: ${originalError || fallbackError.message}`,
      engine: 'playwright',
    };
  }
}
