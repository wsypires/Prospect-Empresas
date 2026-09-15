/**
 * Cloudflare Workers Entrypoint
 * Compatible with Cloudflare Workers + Static Assets (Wrangler v3+)
 */
import { handleApiRequest, ApiEnv } from './src/server/apiCore';

export interface Env extends ApiEnv {
  // Cloudflare Assets binding
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
}

export interface WorkerExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      const response = await handleApiRequest(request, env);
      if (response) {
        return response;
      }
      return new Response(JSON.stringify({ error: 'Endpoint da API não encontrado' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Serve static Vite SPA assets if ASSETS binding is present
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Cloudflare Worker ativo. Compile os arquivos com "npm run build" para servir o frontend.', {
      status: 200,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  },
};
