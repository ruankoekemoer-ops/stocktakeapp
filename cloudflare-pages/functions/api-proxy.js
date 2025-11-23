/**
 * API Proxy for Cloudflare Pages
 * Proxies API requests to the Worker to avoid CORS issues
 */

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Get the API path
  const apiPath = url.pathname.replace('/api/', '');
  const workerUrl = 'https://stock-take-api.rkoekemoer.workers.dev';
  
  // Forward request to Worker
  const workerRequest = new Request(`${workerUrl}/api/${apiPath}${url.search}`, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
  
  try {
    const response = await fetch(workerRequest);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

