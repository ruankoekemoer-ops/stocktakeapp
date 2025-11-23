/**
 * Cloudflare Worker for Stock Take App
 * Serves both frontend (HTML/CSS/JS) and API endpoints
 * Hosted at: https://stock-take-api.rkoekemoer.workers.dev
 */

// Import static files
import { indexHtml, configJs, appJs, styleCss } from './static-files.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Serve static frontend files
    if (path === '/' || path === '/index.html') {
      return new Response(indexHtml, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }

    if (path === '/js/config.js') {
      return new Response(configJs, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript; charset=utf-8',
        },
      });
    }

    if (path === '/js/app.js') {
      return new Response(appJs, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript; charset=utf-8',
        },
      });
    }

    if (path === '/css/style.css') {
      return new Response(styleCss, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/css; charset=utf-8',
        },
      });
    }

    // API Routes
    try {
      // Route: GET /api/items
      if (path === '/api/items' && request.method === 'GET') {
        const search = url.searchParams.get('search') || '';
        const location = url.searchParams.get('location') || '';
        
        let query = 'SELECT * FROM stock_items WHERE 1=1';
        const params = [];
        
        if (search) {
          query += ' AND (item_name LIKE ? OR notes LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        
        if (location) {
          query += ' AND location = ?';
          params.push(location);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await env.DB.prepare(query).bind(...params).all();
        
        return new Response(JSON.stringify(result.results || []), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // Route: GET /api/items/:id
      if (path.startsWith('/api/items/') && request.method === 'GET') {
        const id = path.split('/').pop();
        const result = await env.DB.prepare(
          'SELECT * FROM stock_items WHERE id = ?'
        ).bind(id).first();
        
        if (!result) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }
        
        return new Response(JSON.stringify(result), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // Route: POST /api/items
      if (path === '/api/items' && request.method === 'POST') {
        const data = await request.json();
        
        const result = await env.DB.prepare(
          `INSERT INTO stock_items (item_name, quantity, location, date, notes)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(
          data.item_name || null,
          data.quantity || 0,
          data.location || null,
          data.date || null,
          data.notes || null
        ).run();
        
        // Get the created item
        const item = await env.DB.prepare(
          'SELECT * FROM stock_items WHERE id = ?'
        ).bind(result.meta.last_row_id).first();
        
        return new Response(JSON.stringify({
          message: 'Item created successfully',
          item: item,
        }), {
          status: 201,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // Route: PUT /api/items/:id
      if (path.startsWith('/api/items/') && request.method === 'PUT') {
        const id = path.split('/').pop();
        const data = await request.json();
        
        // Check if item exists
        const existing = await env.DB.prepare(
          'SELECT * FROM stock_items WHERE id = ?'
        ).bind(id).first();
        
        if (!existing) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }
        
        await env.DB.prepare(
          `UPDATE stock_items 
           SET item_name = ?, quantity = ?, location = ?, date = ?, notes = ?, updated_at = ?
           WHERE id = ?`
        ).bind(
          data.item_name !== undefined ? data.item_name : existing.item_name,
          data.quantity !== undefined ? data.quantity : existing.quantity,
          data.location !== undefined ? data.location : existing.location,
          data.date !== undefined ? data.date : existing.date,
          data.notes !== undefined ? data.notes : existing.notes,
          new Date().toISOString(),
          id
        ).run();
        
        // Get the updated item
        const item = await env.DB.prepare(
          'SELECT * FROM stock_items WHERE id = ?'
        ).bind(id).first();
        
        return new Response(JSON.stringify({
          message: 'Item updated successfully',
          item: item,
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // Route: DELETE /api/items/:id
      if (path.startsWith('/api/items/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        
        const result = await env.DB.prepare(
          'DELETE FROM stock_items WHERE id = ?'
        ).bind(id).run();
        
        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({ error: 'Item not found' }), {
            status: 404,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          });
        }
        
        return new Response(JSON.stringify({
          message: 'Item deleted successfully',
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // Health check / API info
      if (path === '/api' || path === '/api/') {
        return new Response(JSON.stringify({
          name: 'Stock Take API',
          version: '1.0.0',
          database: 'Cloudflare D1',
          frontend: 'https://stock-take-api.rkoekemoer.workers.dev',
          endpoints: {
            'GET /api/items': 'Get all items',
            'GET /api/items/:id': 'Get item by ID',
            'POST /api/items': 'Create item',
            'PUT /api/items/:id': 'Update item',
            'DELETE /api/items/:id': 'Delete item',
          },
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        error: error.message || 'Internal server error',
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  },
};
