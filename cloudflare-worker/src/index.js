/**
 * Cloudflare Worker for Stock Take App
 * Serves both frontend (HTML/CSS/JS) and API endpoints
 * Hosted at: https://stock-take-api.rkoekemoer.workers.dev
 */

// Static files will be imported - if not built, will fall back gracefully
let staticFiles = null;
try {
  staticFiles = await import('./static-files.js');
} catch (e) {
  // Static files not built yet - will serve API info at root
}

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

    // Serve static frontend files FIRST (before API routes)
    // Try to load static files
    let staticFilesModule = null;
    try {
      staticFilesModule = await import('./static-files.js');
    } catch (e) {
      // Static files not built - will handle below
    }

    // Root path - serve HTML
    if (path === '/' || path === '/index.html') {
      if (staticFilesModule?.indexHtml) {
        return new Response(staticFilesModule.indexHtml, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
          },
        });
      }
      // If static files not built, fall through to show API info
    }

    // JavaScript files
    if (path === '/js/config.js') {
      if (staticFilesModule?.configJs) {
        return new Response(staticFilesModule.configJs, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/javascript; charset=utf-8',
          },
        });
      }
      // Return basic config if not built
      return new Response(`const CONFIG = { apiUrl: window.location.origin + '/api' }; window.CONFIG = CONFIG;`, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript; charset=utf-8',
        },
      });
    }

    if (path === '/js/app.js') {
      if (staticFilesModule?.appJs) {
        return new Response(staticFilesModule.appJs, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/javascript; charset=utf-8',
          },
        });
      }
      return new Response('// App not built yet - run: node build-static-files.js', {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/javascript; charset=utf-8',
        },
      });
    }

    // CSS file
    if (path === '/css/style.css') {
      if (staticFilesModule?.styleCss) {
        return new Response(staticFilesModule.styleCss, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/css; charset=utf-8',
          },
        });
      }
      return new Response('/* CSS not built yet */', {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/css; charset=utf-8',
        },
      });
    }

    // API Routes
    try {
      // ========== COMPANIES ==========
      if (path === '/api/companies' && request.method === 'GET') {
        const result = await env.DB.prepare('SELECT * FROM companies ORDER BY company_name').all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/companies' && request.method === 'POST') {
        const data = await request.json();
        const result = await env.DB.prepare(
          'INSERT INTO companies (company_code, company_name) VALUES (?, ?)'
        ).bind(data.company_code, data.company_name).run();
        const item = await env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(result.meta.last_row_id).first();
        return new Response(JSON.stringify({ message: 'Company created', item }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/companies/') && request.method === 'PUT') {
        const id = path.split('/').pop();
        const data = await request.json();
        await env.DB.prepare(
          'UPDATE companies SET company_code = ?, company_name = ?, updated_at = ? WHERE id = ?'
        ).bind(data.company_code, data.company_name, new Date().toISOString(), id).run();
        const item = await env.DB.prepare('SELECT * FROM companies WHERE id = ?').bind(id).first();
        return new Response(JSON.stringify({ message: 'Company updated', item }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/companies/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM companies WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ message: 'Company deleted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== WAREHOUSES ==========
      if (path === '/api/warehouses' && request.method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        let query = 'SELECT w.*, c.company_name FROM warehouses w LEFT JOIN companies c ON w.company_id = c.id';
        if (companyId) {
          query += ' WHERE w.company_id = ?';
          const result = await env.DB.prepare(query).bind(companyId).all();
          return new Response(JSON.stringify(result.results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const result = await env.DB.prepare(query + ' ORDER BY w.warehouse_name').all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/warehouses' && request.method === 'POST') {
        const data = await request.json();
        const result = await env.DB.prepare(
          'INSERT INTO warehouses (warehouse_code, warehouse_name, company_id, address) VALUES (?, ?, ?, ?)'
        ).bind(data.warehouse_code, data.warehouse_name, data.company_id, data.address || null).run();
        const item = await env.DB.prepare(
          'SELECT w.*, c.company_name FROM warehouses w LEFT JOIN companies c ON w.company_id = c.id WHERE w.id = ?'
        ).bind(result.meta.last_row_id).first();
        return new Response(JSON.stringify({ message: 'Warehouse created', item }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/warehouses/') && request.method === 'PUT') {
        const id = path.split('/').pop();
        const data = await request.json();
        await env.DB.prepare(
          'UPDATE warehouses SET warehouse_code = ?, warehouse_name = ?, company_id = ?, address = ?, updated_at = ? WHERE id = ?'
        ).bind(data.warehouse_code, data.warehouse_name, data.company_id, data.address || null, new Date().toISOString(), id).run();
        const item = await env.DB.prepare(
          'SELECT w.*, c.company_name FROM warehouses w LEFT JOIN companies c ON w.company_id = c.id WHERE w.id = ?'
        ).bind(id).first();
        return new Response(JSON.stringify({ message: 'Warehouse updated', item }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/warehouses/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM warehouses WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ message: 'Warehouse deleted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== BIN LOCATIONS ==========
      if (path === '/api/bin-locations' && request.method === 'GET') {
        const warehouseId = url.searchParams.get('warehouse_id');
        let query = 'SELECT b.*, w.warehouse_name FROM bin_locations b LEFT JOIN warehouses w ON b.warehouse_id = w.id';
        if (warehouseId) {
          query += ' WHERE b.warehouse_id = ?';
          const result = await env.DB.prepare(query).bind(warehouseId).all();
          return new Response(JSON.stringify(result.results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const result = await env.DB.prepare(query + ' ORDER BY b.bin_code').all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/bin-locations' && request.method === 'POST') {
        const data = await request.json();
        const result = await env.DB.prepare(
          'INSERT INTO bin_locations (bin_code, bin_name, warehouse_id, aisle, shelf, level) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(data.bin_code, data.bin_name || null, data.warehouse_id, data.aisle || null, data.shelf || null, data.level || null).run();
        const item = await env.DB.prepare(
          'SELECT b.*, w.warehouse_name FROM bin_locations b LEFT JOIN warehouses w ON b.warehouse_id = w.id WHERE b.id = ?'
        ).bind(result.meta.last_row_id).first();
        return new Response(JSON.stringify({ message: 'Bin location created', item }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/bin-locations/') && request.method === 'PUT') {
        const id = path.split('/').pop();
        const data = await request.json();
        await env.DB.prepare(
          'UPDATE bin_locations SET bin_code = ?, bin_name = ?, warehouse_id = ?, aisle = ?, shelf = ?, level = ?, updated_at = ? WHERE id = ?'
        ).bind(data.bin_code, data.bin_name || null, data.warehouse_id, data.aisle || null, data.shelf || null, data.level || null, new Date().toISOString(), id).run();
        const item = await env.DB.prepare(
          'SELECT b.*, w.warehouse_name FROM bin_locations b LEFT JOIN warehouses w ON b.warehouse_id = w.id WHERE b.id = ?'
        ).bind(id).first();
        return new Response(JSON.stringify({ message: 'Bin location updated', item }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/bin-locations/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM bin_locations WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ message: 'Bin location deleted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== WAREHOUSE MANAGERS ==========
      if (path === '/api/managers' && request.method === 'GET') {
        const warehouseId = url.searchParams.get('warehouse_id');
        let query = 'SELECT m.*, w.warehouse_name FROM warehouse_managers m LEFT JOIN warehouses w ON m.warehouse_id = w.id WHERE m.is_active = 1';
        if (warehouseId) {
          query += ' AND m.warehouse_id = ?';
          const result = await env.DB.prepare(query).bind(warehouseId).all();
          return new Response(JSON.stringify(result.results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const result = await env.DB.prepare(query + ' ORDER BY m.manager_name').all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/managers' && request.method === 'POST') {
        const data = await request.json();
        const result = await env.DB.prepare(
          'INSERT INTO warehouse_managers (manager_name, email, phone, warehouse_id) VALUES (?, ?, ?, ?)'
        ).bind(data.manager_name, data.email || null, data.phone || null, data.warehouse_id).run();
        const item = await env.DB.prepare(
          'SELECT m.*, w.warehouse_name FROM warehouse_managers m LEFT JOIN warehouses w ON m.warehouse_id = w.id WHERE m.id = ?'
        ).bind(result.meta.last_row_id).first();
        return new Response(JSON.stringify({ message: 'Manager created', item }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/managers/') && request.method === 'PUT') {
        const id = path.split('/').pop();
        const data = await request.json();
        await env.DB.prepare(
          'UPDATE warehouse_managers SET manager_name = ?, email = ?, phone = ?, warehouse_id = ?, updated_at = ? WHERE id = ?'
        ).bind(data.manager_name, data.email || null, data.phone || null, data.warehouse_id, new Date().toISOString(), id).run();
        const item = await env.DB.prepare(
          'SELECT m.*, w.warehouse_name FROM warehouse_managers m LEFT JOIN warehouses w ON m.warehouse_id = w.id WHERE m.id = ?'
        ).bind(id).first();
        return new Response(JSON.stringify({ message: 'Manager updated', item }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/managers/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare('UPDATE warehouse_managers SET is_active = 0 WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ message: 'Manager deactivated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== STOCK ITEMS (Updated) ==========
      if (path === '/api/items' && request.method === 'GET') {
        const warehouseId = url.searchParams.get('warehouse_id');
        const managerId = url.searchParams.get('manager_id');
        const search = url.searchParams.get('search') || '';
        
        let query = `SELECT s.*, 
          c.company_name, 
          w.warehouse_name, 
          b.bin_code as bin_location_code,
          m.manager_name as counted_by
        FROM stock_items s
        LEFT JOIN companies c ON s.company_id = c.id
        LEFT JOIN warehouses w ON s.warehouse_id = w.id
        LEFT JOIN bin_locations b ON s.bin_location_id = b.id
        LEFT JOIN warehouse_managers m ON s.counted_by_manager_id = m.id
        WHERE 1=1`;
        const params = [];
        
        if (warehouseId) {
          query += ' AND s.warehouse_id = ?';
          params.push(warehouseId);
        }
        
        if (managerId) {
          query += ' AND s.counted_by_manager_id = ?';
          params.push(managerId);
        }
        
        if (search) {
          query += ' AND (s.item_name LIKE ? OR s.item_code LIKE ?)';
          params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY s.created_at DESC';
        
        const result = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/items' && request.method === 'POST') {
        const data = await request.json();
        
        // Verify manager can count for this warehouse
        if (data.counted_by_manager_id) {
          const manager = await env.DB.prepare(
            'SELECT warehouse_id FROM warehouse_managers WHERE id = ? AND is_active = 1'
          ).bind(data.counted_by_manager_id).first();
          
          if (!manager || manager.warehouse_id !== data.warehouse_id) {
            return new Response(JSON.stringify({ 
              error: 'Manager is not authorized to count items for this warehouse' 
            }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        const result = await env.DB.prepare(
          `INSERT INTO stock_items (item_name, item_code, quantity, bin_location_id, warehouse_id, company_id, counted_by_manager_id, date, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          data.item_name,
          data.item_code || null,
          data.quantity || 0,
          data.bin_location_id || null,
          data.warehouse_id,
          data.company_id,
          data.counted_by_manager_id || null,
          data.date || null,
          data.notes || null
        ).run();
        
        const item = await env.DB.prepare(
          `SELECT s.*, 
            c.company_name, 
            w.warehouse_name, 
            b.bin_code as bin_location_code,
            m.manager_name as counted_by
          FROM stock_items s
          LEFT JOIN companies c ON s.company_id = c.id
          LEFT JOIN warehouses w ON s.warehouse_id = w.id
          LEFT JOIN bin_locations b ON s.bin_location_id = b.id
          LEFT JOIN warehouse_managers m ON s.counted_by_manager_id = m.id
          WHERE s.id = ?`
        ).bind(result.meta.last_row_id).first();
        
        return new Response(JSON.stringify({ message: 'Item created', item }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/items/') && request.method === 'PUT') {
        const id = path.split('/').pop();
        const data = await request.json();
        
        // Verify manager authorization if manager is being set/changed
        if (data.counted_by_manager_id) {
          const existing = await env.DB.prepare('SELECT warehouse_id FROM stock_items WHERE id = ?').bind(id).first();
          const manager = await env.DB.prepare(
            'SELECT warehouse_id FROM warehouse_managers WHERE id = ? AND is_active = 1'
          ).bind(data.counted_by_manager_id).first();
          
          const warehouseId = data.warehouse_id || existing?.warehouse_id;
          if (!manager || manager.warehouse_id !== warehouseId) {
            return new Response(JSON.stringify({ 
              error: 'Manager is not authorized to count items for this warehouse' 
            }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        await env.DB.prepare(
          `UPDATE stock_items 
           SET item_name = ?, item_code = ?, quantity = ?, bin_location_id = ?, warehouse_id = ?, company_id = ?, counted_by_manager_id = ?, date = ?, notes = ?, updated_at = ?
           WHERE id = ?`
        ).bind(
          data.item_name,
          data.item_code || null,
          data.quantity || 0,
          data.bin_location_id || null,
          data.warehouse_id,
          data.company_id,
          data.counted_by_manager_id || null,
          data.date || null,
          data.notes || null,
          new Date().toISOString(),
          id
        ).run();
        
        const item = await env.DB.prepare(
          `SELECT s.*, 
            c.company_name, 
            w.warehouse_name, 
            b.bin_code as bin_location_code,
            m.manager_name as counted_by
          FROM stock_items s
          LEFT JOIN companies c ON s.company_id = c.id
          LEFT JOIN warehouses w ON s.warehouse_id = w.id
          LEFT JOIN bin_locations b ON s.bin_location_id = b.id
          LEFT JOIN warehouse_managers m ON s.counted_by_manager_id = m.id
          WHERE s.id = ?`
        ).bind(id).first();
        
        return new Response(JSON.stringify({ message: 'Item updated', item }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/items/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        await env.DB.prepare('DELETE FROM stock_items WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ message: 'Item deleted' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Health check / API info
      if (path === '/api' || path === '/api/') {
        return new Response(JSON.stringify({
          name: 'Stock Take API',
          version: '2.0.0',
          database: 'Cloudflare D1',
          endpoints: {
            'Companies': 'GET/POST /api/companies, PUT/DELETE /api/companies/:id',
            'Warehouses': 'GET/POST /api/warehouses, PUT/DELETE /api/warehouses/:id',
            'Bin Locations': 'GET/POST /api/bin-locations, PUT/DELETE /api/bin-locations/:id',
            'Managers': 'GET/POST /api/managers, PUT/DELETE /api/managers/:id',
            'Stock Items': 'GET/POST /api/items, PUT/DELETE /api/items/:id',
          },
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // If root path and no static files, show API info
      if (path === '/' || path === '/index.html') {
        return new Response(JSON.stringify({
          name: 'Stock Take API',
          version: '2.0.0',
          database: 'Cloudflare D1',
          message: 'Frontend not built yet. Run: cd cloudflare-worker && node build-static-files.js && npm run deploy',
          frontend: 'Build static files to serve frontend at /',
          api: 'API is working - visit /api',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 404 for unknown routes
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({
        error: error.message || 'Internal server error',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
