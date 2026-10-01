import express, { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleApiRequest } from './src/server/apiCore';
import { scrapePageMedia } from './src/server/playwrightScraper';
import JSZip from 'jszip';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// 1. Playwright Scraper: Extração completa de imagens e vídeos
app.post('/api/scraper/extract', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { url, companyName, deduplicate = true } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória para realizar a extração.' });
    }
    const result = await scrapePageMedia(url, companyName, { deduplicate });
    return res.json(result);
  } catch (err: any) {
    console.error('Playwright scraper error:', err);
    return res.status(500).json({ error: 'Erro ao extrair mídias da página', details: err.message });
  }
});

// 2. Proxy de download individual de mídia (contorna CORS e força download em anexo)
app.get('/api/scraper/download', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const targetUrl = req.query.url as string;
    const requestedFilename = (req.query.filename as string) || 'arquivo_midia';
    if (!targetUrl) {
      return res.status(400).send('URL é obrigatória');
    }

    let origin = 'https://google.com';
    try {
      origin = new URL(targetUrl).origin;
    } catch {}

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: origin,
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Erro ao baixar arquivo: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(requestedFilename)}"`
    );

    const arrayBuffer = await response.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Download error:', err);
    return res.status(500).send(`Erro ao baixar mídia: ${err.message}`);
  }
});

// 3. Download em lote empacotado em .ZIP
app.post('/api/scraper/download-zip', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const { items, zipName = 'midias-empresa' } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nenhum item fornecido para download.' });
    }

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
            signal: AbortSignal.timeout(12000),
          });

          if (itemRes.ok) {
            const buffer = await itemRes.arrayBuffer();
            const cleanName =
              item.filename ||
              `midia_${String(index + 1).padStart(2, '0')}.${item.url.split('?')[0].split('.').pop() || 'jpg'}`;
            folder.file(cleanName, buffer);
          }
        } catch (e) {
          console.warn(`Failed to fetch media for zip: ${item.url}`);
        }
      }
    );

    await Promise.allSettled(fetchPromises);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(zipName)}.zip"`
    );
    return res.send(zipBuffer);
  } catch (err: any) {
    console.error('ZIP generation error:', err);
    return res.status(500).json({ error: 'Erro ao gerar arquivo ZIP', details: err.message });
  }
});

// Universal API Middleware: delegates all /api/* requests to the Cloudflare-compatible Web-Standard apiCore
app.all('/api/*', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const init: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = JSON.stringify(req.body);
    }

    const webRequest = new Request(fullUrl, init);
    const webResponse = await handleApiRequest(webRequest, {
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    });

    if (!webResponse) {
      return res.status(404).json({ error: 'Endpoint da API não encontrado' });
    }

    res.status(webResponse.status);
    webResponse.headers.forEach((val, name) => {
      res.setHeader(name, val);
    });

    const responseText = await webResponse.text();
    return res.send(responseText);
  } catch (err: any) {
    console.error('Server error forwarding to apiCore:', err);
    return res.status(500).json({ error: 'Erro no servidor', message: err.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
