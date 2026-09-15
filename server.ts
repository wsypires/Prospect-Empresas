import express, { type Request as ExpressRequest, type Response as ExpressResponse } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { handleApiRequest } from './src/server/apiCore';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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
