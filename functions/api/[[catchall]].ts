import { handleApiRequest } from '../../src/server/apiCore';

export const onRequest = async (context: {
  request: Request;
  env: Record<string, string>;
}): Promise<Response> => {
  const response = await handleApiRequest(context.request, context.env);
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
};
