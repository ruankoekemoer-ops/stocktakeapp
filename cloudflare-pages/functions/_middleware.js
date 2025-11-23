/**
 * Cloudflare Pages Middleware
 * Handles routing and CORS for the app
 */

export function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Add CORS headers for API requests
  const response = next();
  
  // Clone response to modify headers
  const newResponse = new Response(response.body, response);
  
  // Add CORS headers
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: newResponse.headers,
    });
  }

  return newResponse;
}

