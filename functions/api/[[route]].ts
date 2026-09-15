/**
 * Cloudflare Pages Functions catch-all handler for /api/*
 */
import { handleApiRequest, ApiEnv } from '../../src/server/apiCore';

interface EventContext {
  request: Request;
  env: ApiEnv;
  params: Record<string, string | string[]>;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  data: Record<string, unknown>;
}

export async function onRequest(context: EventContext): Promise<Response> {
  const response = await handleApiRequest(context.request, context.env);
  if (response) {
    return response;
  }

  return new Response(
    JSON.stringify({ error: 'Endpoint da API não encontrado' }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
