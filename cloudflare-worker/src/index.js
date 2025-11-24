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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    };

    const textEncoder = new TextEncoder();
    const DEFAULT_ADMIN_PASSWORD = 'admin';

    const base64UrlEncode = (str) => {
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    };

    const base64UrlEncodeBytes = (bytes) => {
      let binary = '';
      bytes.forEach(b => {
        binary += String.fromCharCode(b);
      });
      return base64UrlEncode(binary);
    };

    const base64UrlDecode = (str) => {
      let normalized = str.replace(/-/g, '+').replace(/_/g, '/');
      while (normalized.length % 4) {
        normalized += '=';
      }
      return atob(normalized);
    };

    const getAdminSecret = (env) => {
      return env.ADMIN_JWT_SECRET || env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
    };

    const signAdminToken = async (data, secret) => {
      const key = await crypto.subtle.importKey(
        'raw',
        textEncoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(data));
      return base64UrlEncodeBytes(new Uint8Array(signature));
    };

    const generateAdminToken = async (env) => {
      const secret = getAdminSecret(env);
      if (!secret) {
        throw new Error('Admin secret not configured');
      }
      
      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const expiresInSeconds = 60 * 60; // 1 hour
      const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
      const payload = base64UrlEncode(JSON.stringify({ exp }));
      const signature = await signAdminToken(`${header}.${payload}`, secret);
      
      return {
        token: `${header}.${payload}.${signature}`,
        expiresIn: expiresInSeconds,
        expiresAt: exp * 1000,
      };
    };

    const verifyAdminToken = async (token, env) => {
      try {
        const secret = getAdminSecret(env);
        if (!secret) return null;
        
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const [header, payload, signature] = parts;
        const expectedSignature = await signAdminToken(`${header}.${payload}`, secret);
        if (signature !== expectedSignature) {
          return null;
        }
        
        const payloadData = JSON.parse(base64UrlDecode(payload));
        if (payloadData.exp && Math.floor(Date.now() / 1000) > payloadData.exp) {
          return null;
        }
        
        return payloadData;
      } catch (error) {
        return null;
      }
    };

    const extractAdminToken = (request) => {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7).trim();
      }
      const altHeader = request.headers.get('X-Admin-Token');
      if (altHeader) {
        return altHeader.trim();
      }
      return null;
    };

    const adminUnauthorizedResponse = () => new Response(JSON.stringify({ error: 'Admin authorization required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

    const ensureAdminAuthorized = async (request, env) => {
      const token = extractAdminToken(request);
      if (!token) {
        return { authorized: false, response: adminUnauthorizedResponse() };
      }
      
      const payload = await verifyAdminToken(token, env);
      if (!payload) {
        return { authorized: false, response: adminUnauthorizedResponse() };
      }
      
      return { authorized: true, payload };
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

    if (path === '/js/auth.js') {
      if (staticFilesModule?.authJs) {
        return new Response(staticFilesModule.authJs, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/javascript; charset=utf-8',
          },
        });
      }
      return new Response('// Auth.js not built yet - run: node build-static-files.js', {
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
      if (path === '/api/admin/login' && request.method === 'POST') {
        const data = await request.json().catch(() => ({}));
        const password = (data.password || '').toString().trim();
        
        if (!password) {
          return new Response(JSON.stringify({ error: 'Password is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const expectedPassword = env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
        if (password !== expectedPassword) {
          return new Response(JSON.stringify({ error: 'Invalid password' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const tokenInfo = await generateAdminToken(env);
        return new Response(JSON.stringify({
          token: tokenInfo.token,
          expires_in: tokenInfo.expiresIn,
          expires_at: tokenInfo.expiresAt,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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

      // ========== STOCK TAKES (NEW) ==========
      if (path === '/api/stock-takes' && request.method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        const warehouseId = url.searchParams.get('warehouse_id');
        const status = url.searchParams.get('status'); // 'open' or 'closed'
        
        let query = `SELECT st.*, 
          c.company_name, 
          w.warehouse_name,
          m.manager_name as opened_by_name
        FROM stock_takes st
        LEFT JOIN companies c ON st.company_id = c.id
        LEFT JOIN warehouses w ON st.warehouse_id = w.id
        LEFT JOIN warehouse_managers m ON st.opened_by_manager_id = m.id
        WHERE 1=1`;
        const params = [];
        
        if (companyId) {
          query += ' AND st.company_id = ?';
          params.push(companyId);
        }
        
        if (warehouseId) {
          query += ' AND st.warehouse_id = ?';
          params.push(warehouseId);
        }
        
        if (status) {
          query += ' AND st.status = ?';
          params.push(status);
        }
        
        query += ' ORDER BY st.opened_at DESC';
        
        const result = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get active (open) stock take for warehouse/company
      // Stock takes are opened at Company + Warehouse level, not bin location level
      // MUST come before the /api/stock-takes/:id route to avoid matching "active" as an ID
      if (path === '/api/stock-takes/active' && request.method === 'GET') {
        const companyId = url.searchParams.get('company_id');
        const warehouseId = url.searchParams.get('warehouse_id');
        
        if (!companyId || !warehouseId) {
          return new Response(JSON.stringify({ error: 'company_id and warehouse_id are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Convert to integers to ensure proper comparison
        const companyIdInt = parseInt(companyId);
        const warehouseIdInt = parseInt(warehouseId);
        
        // Debug: Check all open stock takes first
        const allOpenStockTakes = await env.DB.prepare(
          `SELECT st.*, 
            c.company_name, 
            w.warehouse_name,
            m.manager_name as opened_by_name
          FROM stock_takes st
          LEFT JOIN companies c ON st.company_id = c.id
          LEFT JOIN warehouses w ON st.warehouse_id = w.id
          LEFT JOIN warehouse_managers m ON st.opened_by_manager_id = m.id
          WHERE st.status = 'open'
          ORDER BY st.opened_at DESC`
        ).all();
        
        // Query for open stock take matching company and warehouse
        // Any bin location in this warehouse/company can be counted against this stock take
        let result;
        try {
          result = await env.DB.prepare(
            `SELECT st.*, 
              c.company_name, 
              w.warehouse_name,
              m.manager_name as opened_by_name
            FROM stock_takes st
            LEFT JOIN companies c ON st.company_id = c.id
            LEFT JOIN warehouses w ON st.warehouse_id = w.id
            LEFT JOIN warehouse_managers m ON st.opened_by_manager_id = m.id
            WHERE st.company_id = ? AND st.warehouse_id = ? AND st.status = 'open'
            ORDER BY st.opened_at DESC
            LIMIT 1`
          ).bind(companyIdInt, warehouseIdInt).first();
        } catch (error) {
          console.error('Database error in stock-takes/active:', error);
          return new Response(JSON.stringify({ 
            error: 'Database error',
            message: error.message,
            debug: {
              requested_company_id: companyIdInt,
              requested_warehouse_id: warehouseIdInt,
              all_open_stock_takes: allOpenStockTakes.results || []
            }
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // If no result, return debug info (but still 200 OK, not 404)
        if (!result) {
          return new Response(JSON.stringify({
            result: null,
            debug: {
              requested_company_id: companyIdInt,
              requested_warehouse_id: warehouseIdInt,
              all_open_stock_takes: allOpenStockTakes.results || []
            }
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/stock-takes' && request.method === 'POST') {
        const data = await request.json();
        
        // Check if there's already an open stock take for this warehouse/company
        const existing = await env.DB.prepare(
          'SELECT id FROM stock_takes WHERE company_id = ? AND warehouse_id = ? AND status = ?'
        ).bind(data.company_id, data.warehouse_id, 'open').first();
        
        if (existing) {
          return new Response(JSON.stringify({ 
            error: 'There is already an open stock take for this warehouse and company' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Manager is optional - if provided, validate it; otherwise set to null
        let managerId = data.opened_by_manager_id || null;
        
        if (managerId) {
          // Validate the provided manager belongs to this warehouse and is active
          const manager = await env.DB.prepare(
            'SELECT id FROM warehouse_managers WHERE id = ? AND warehouse_id = ? AND is_active = 1'
          ).bind(managerId, data.warehouse_id).first();
          
          if (!manager) {
            return new Response(JSON.stringify({ 
              error: 'The specified manager does not belong to this warehouse or is not active.' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        const result = await env.DB.prepare(
          'INSERT INTO stock_takes (company_id, warehouse_id, opened_by_manager_id, notes, status) VALUES (?, ?, ?, ?, ?)'
        ).bind(
          data.company_id,
          data.warehouse_id,
          managerId,
          data.notes || null,
          'open'
        ).run();
        
        const stockTake = await env.DB.prepare(
          `SELECT st.*, 
            c.company_name, 
            w.warehouse_name,
            m.manager_name as opened_by_name
          FROM stock_takes st
          LEFT JOIN companies c ON st.company_id = c.id
          LEFT JOIN warehouses w ON st.warehouse_id = w.id
          LEFT JOIN warehouse_managers m ON st.opened_by_manager_id = m.id
          WHERE st.id = ?`
        ).bind(result.meta.last_row_id).first();
        
        return new Response(JSON.stringify({ message: 'Stock take opened', stockTake }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/stock-takes/') && path.endsWith('/close') && request.method === 'PUT') {
        const id = path.split('/')[3];
        
        await env.DB.prepare(
          'UPDATE stock_takes SET status = ?, closed_at = ? WHERE id = ?'
        ).bind('closed', new Date().toISOString(), id).run();
        
        const stockTake = await env.DB.prepare(
          `SELECT st.*, 
            c.company_name, 
            w.warehouse_name,
            m.manager_name as opened_by_name
          FROM stock_takes st
          LEFT JOIN companies c ON st.company_id = c.id
          LEFT JOIN warehouses w ON st.warehouse_id = w.id
          LEFT JOIN warehouse_managers m ON st.opened_by_manager_id = m.id
          WHERE st.id = ?`
        ).bind(id).first();
        
        return new Response(JSON.stringify({ message: 'Stock take closed', stockTake }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== BIN LOCATION LOOKUP ==========
      if (path === '/api/bin-locations/lookup' && request.method === 'GET') {
        const binCode = url.searchParams.get('bin_code');
        const stockTakeId = url.searchParams.get('stock_take_id');
        
        if (!binCode) {
          return new Response(JSON.stringify({ error: 'bin_code is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Find bin location by code
        // Returns: bin location details with warehouse_id and company_id for stock take lookup
        const binLocation = await env.DB.prepare(
          `SELECT 
            b.id,
            b.bin_code,
            b.bin_name,
            b.warehouse_id,
            w.id as warehouse_id,
            w.warehouse_name,
            w.company_id,
            c.company_name
          FROM bin_locations b
          LEFT JOIN warehouses w ON b.warehouse_id = w.id
          LEFT JOIN companies c ON w.company_id = c.id
          WHERE b.bin_code = ?`
        ).bind(binCode).first();
        
        if (!binLocation) {
          return new Response(JSON.stringify({ error: 'Bin location not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // If stock_take_id provided, verify it matches the bin's warehouse/company
        if (stockTakeId) {
          const stockTake = await env.DB.prepare(
            'SELECT company_id, warehouse_id FROM stock_takes WHERE id = ? AND status = ?'
          ).bind(stockTakeId, 'open').first();
          
          if (!stockTake) {
            return new Response(JSON.stringify({ error: 'Stock take not found or not open' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          if (stockTake.company_id !== binLocation.company_id || stockTake.warehouse_id !== binLocation.warehouse_id) {
            return new Response(JSON.stringify({ 
              error: 'Bin location does not match the open stock take\'s warehouse and company' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        return new Response(JSON.stringify(binLocation), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // ========== BIN LOCATION COUNTS (NEW) ==========
      if (path === '/api/bin-location-counts' && request.method === 'GET') {
        const stockTakeId = url.searchParams.get('stock_take_id');
        const binLocationId = url.searchParams.get('bin_location_id');
        const submitted = url.searchParams.get('submitted'); // '0' or '1'
        
        let query = `SELECT blc.*, 
          b.bin_code,
          m.manager_name as counted_by_name
        FROM bin_location_counts blc
        LEFT JOIN bin_locations b ON blc.bin_location_id = b.id
        LEFT JOIN warehouse_managers m ON blc.counted_by_manager_id = m.id
        WHERE 1=1`;
        const params = [];
        
        if (stockTakeId) {
          query += ' AND blc.stock_take_id = ?';
          params.push(stockTakeId);
        }
        
        if (binLocationId) {
          query += ' AND blc.bin_location_id = ?';
          params.push(binLocationId);
        }
        
        if (submitted !== null) {
          query += ' AND blc.submitted = ?';
          params.push(parseInt(submitted));
        }
        
        query += ' ORDER BY blc.created_at ASC';
        
        const result = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify(result.results || []), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path === '/api/bin-location-counts' && request.method === 'POST') {
        const data = await request.json();
        
        // Verify stock take is open
        const stockTake = await env.DB.prepare(
          'SELECT company_id, warehouse_id, status FROM stock_takes WHERE id = ?'
        ).bind(data.stock_take_id).first();
        
        if (!stockTake || stockTake.status !== 'open') {
          return new Response(JSON.stringify({ error: 'Stock take not found or not open' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Verify bin location matches stock take warehouse
        const binLocation = await env.DB.prepare(
          'SELECT warehouse_id FROM bin_locations WHERE id = ?'
        ).bind(data.bin_location_id).first();
        
        if (!binLocation || binLocation.warehouse_id !== stockTake.warehouse_id) {
          return new Response(JSON.stringify({ 
            error: 'Bin location does not match stock take warehouse' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Verify manager authorization if provided
        if (data.counted_by_manager_id) {
          const manager = await env.DB.prepare(
            'SELECT warehouse_id FROM warehouse_managers WHERE id = ? AND is_active = 1'
          ).bind(data.counted_by_manager_id).first();
          
          if (!manager || manager.warehouse_id !== stockTake.warehouse_id) {
            return new Response(JSON.stringify({ 
              error: 'Manager not authorized for this warehouse' 
            }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        const result = await env.DB.prepare(
          'INSERT INTO bin_location_counts (stock_take_id, bin_location_id, item_code, item_name, quantity, counted_by_manager_id) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          data.stock_take_id,
          data.bin_location_id,
          data.item_code,
          data.item_name || null,
          data.quantity || 0,
          data.counted_by_manager_id || null
        ).run();
        
        const count = await env.DB.prepare(
          `SELECT blc.*, 
            b.bin_code,
            m.manager_name as counted_by_name
          FROM bin_location_counts blc
          LEFT JOIN bin_locations b ON blc.bin_location_id = b.id
          LEFT JOIN warehouse_managers m ON blc.counted_by_manager_id = m.id
          WHERE blc.id = ?`
        ).bind(result.meta.last_row_id).first();
        
        return new Response(JSON.stringify({ message: 'Item added to bin count', count }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/bin-location-counts/') && path.endsWith('/submit') && request.method === 'POST') {
        const binLocationId = path.split('/')[3];
        const data = await request.json();
        const { stock_take_id, counted_by_manager_id } = data;
        
        // Get all unsubmitted counts for this bin location in this stock take
        const counts = await env.DB.prepare(
          'SELECT * FROM bin_location_counts WHERE bin_location_id = ? AND stock_take_id = ? AND submitted = 0'
        ).bind(binLocationId, stock_take_id).all();
        
        if (!counts.results || counts.results.length === 0) {
          return new Response(JSON.stringify({ error: 'No items to submit for this bin location' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Get stock take and bin location info
        const stockTake = await env.DB.prepare(
          'SELECT * FROM stock_takes WHERE id = ?'
        ).bind(stock_take_id).first();
        
        const binLocation = await env.DB.prepare(
          'SELECT * FROM bin_locations WHERE id = ?'
        ).bind(binLocationId).first();
        
        // Insert items into stock_items
        // Check if stock_take_id column exists, if not, use the old schema
        const submittedItems = [];
        for (const count of counts.results) {
          let result;
          try {
            // Try new schema with stock_take_id
            result = await env.DB.prepare(
              `INSERT INTO stock_items (stock_take_id, item_name, item_code, quantity, bin_location_id, warehouse_id, company_id, counted_by_manager_id, date)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              stock_take_id,
              count.item_name || count.item_code,
              count.item_code,
              count.quantity,
              binLocationId,
              stockTake.warehouse_id,
              stockTake.company_id,
              counted_by_manager_id || count.counted_by_manager_id,
              new Date().toISOString().split('T')[0]
            ).run();
          } catch (error) {
            // Fallback to old schema without stock_take_id
            if (error.message && error.message.includes('no column named stock_take_id')) {
              result = await env.DB.prepare(
                `INSERT INTO stock_items (item_name, item_code, quantity, bin_location_id, warehouse_id, company_id, counted_by_manager_id, date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(
                count.item_name || count.item_code,
                count.item_code,
                count.quantity,
                binLocationId,
                stockTake.warehouse_id,
                stockTake.company_id,
                counted_by_manager_id || count.counted_by_manager_id,
                new Date().toISOString().split('T')[0]
              ).run();
            } else {
              throw error;
            }
          }
          
          submittedItems.push(result.meta.last_row_id);
        }
        
        // Mark counts as submitted
        await env.DB.prepare(
          'UPDATE bin_location_counts SET submitted = 1, submitted_at = ? WHERE bin_location_id = ? AND stock_take_id = ? AND submitted = 0'
        ).bind(new Date().toISOString(), binLocationId, stock_take_id).run();
        
        return new Response(JSON.stringify({ 
          message: 'Bin location submitted successfully',
          items_submitted: submittedItems.length,
          items: submittedItems
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (path.startsWith('/api/bin-location-counts/') && request.method === 'DELETE') {
        const id = path.split('/').pop();
        
        // Only allow deletion of unsubmitted counts
        const count = await env.DB.prepare(
          'SELECT submitted FROM bin_location_counts WHERE id = ?'
        ).bind(id).first();
        
        if (!count) {
          return new Response(JSON.stringify({ error: 'Count not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (count.submitted === 1) {
          return new Response(JSON.stringify({ error: 'Cannot delete submitted count' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        await env.DB.prepare('DELETE FROM bin_location_counts WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ message: 'Count deleted' }), {
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

      // ========== MANAGER-COMPANY ACCESS ENDPOINTS ==========
      if (path === '/api/manager-company-access' && request.method === 'GET') {
        const adminAuth = await ensureAdminAuthorized(request, env);
        if (!adminAuth.authorized) {
          return adminAuth.response;
        }
        try {
          const url = new URL(request.url);
          const managerId = url.searchParams.get('manager_id');
          const companyId = url.searchParams.get('company_id');

          let query = `
            SELECT 
              mca.*,
              m.manager_name,
              c.company_name
            FROM manager_company_access mca
            LEFT JOIN warehouse_managers m ON mca.manager_id = m.id
            LEFT JOIN companies c ON mca.company_id = c.id
          `;
          const params = [];

          if (managerId) {
            query += ' WHERE mca.manager_id = ?';
            params.push(parseInt(managerId));
          }
          if (companyId) {
            query += managerId ? ' AND mca.company_id = ?' : ' WHERE mca.company_id = ?';
            params.push(parseInt(companyId));
          }

          query += ' ORDER BY mca.created_at DESC';

          const result = await env.DB.prepare(query).bind(...params).all();
          return new Response(JSON.stringify(result.results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (path === '/api/manager-company-access' && request.method === 'POST') {
        const adminAuth = await ensureAdminAuthorized(request, env);
        if (!adminAuth.authorized) {
          return adminAuth.response;
        }
        try {
          const body = await request.json();
          const { manager_id, company_id } = body;

          if (!manager_id || !company_id) {
            return new Response(JSON.stringify({ error: 'manager_id and company_id are required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Check if access already exists
          const existing = await env.DB.prepare(
            'SELECT id FROM manager_company_access WHERE manager_id = ? AND company_id = ?'
          )
            .bind(parseInt(manager_id), parseInt(company_id))
            .first();

          if (existing) {
            return new Response(JSON.stringify({ error: 'Access already exists' }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const result = await env.DB.prepare(
            `INSERT INTO manager_company_access (manager_id, company_id, created_at, updated_at)
             VALUES (?, ?, datetime('now'), datetime('now'))`
          )
            .bind(parseInt(manager_id), parseInt(company_id))
            .run();

          const newAccess = await env.DB.prepare(
            `SELECT 
              mca.*,
              m.manager_name,
              c.company_name
             FROM manager_company_access mca
             LEFT JOIN warehouse_managers m ON mca.manager_id = m.id
             LEFT JOIN companies c ON mca.company_id = c.id
             WHERE mca.id = ?`
          )
            .bind(result.meta.last_row_id)
            .first();

          return new Response(JSON.stringify({ item: newAccess }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (path.startsWith('/api/manager-company-access/') && request.method === 'DELETE') {
        const adminAuth = await ensureAdminAuthorized(request, env);
        if (!adminAuth.authorized) {
          return adminAuth.response;
        }
        try {
          const id = path.split('/').pop();
          const result = await env.DB.prepare('DELETE FROM manager_company_access WHERE id = ?')
            .bind(parseInt(id))
            .run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Access not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // ========== COUNTER-COMPANY ACCESS ENDPOINTS ==========
      if (path === '/api/counter-company-access' && request.method === 'GET') {
        const adminAuth = await ensureAdminAuthorized(request, env);
        if (!adminAuth.authorized) {
          return adminAuth.response;
        }
        try {
          const url = new URL(request.url);
          const counterEmail = url.searchParams.get('counter_email');
          const companyId = url.searchParams.get('company_id');

          let query = `
            SELECT 
              cca.*,
              c.company_name
            FROM counter_company_access cca
            LEFT JOIN companies c ON cca.company_id = c.id
          `;
          const params = [];

          if (counterEmail) {
            query += ' WHERE cca.counter_email = ?';
            params.push(counterEmail);
          }
          if (companyId) {
            query += counterEmail ? ' AND cca.company_id = ?' : ' WHERE cca.company_id = ?';
            params.push(parseInt(companyId));
          }

          query += ' ORDER BY cca.created_at DESC';

          const result = await env.DB.prepare(query).bind(...params).all();
          return new Response(JSON.stringify(result.results || []), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (path === '/api/counter-company-access' && request.method === 'POST') {
        const adminAuth = await ensureAdminAuthorized(request, env);
        if (!adminAuth.authorized) {
          return adminAuth.response;
        }
        try {
          const body = await request.json();
          const { counter_email, company_id } = body;

          if (!counter_email || !company_id) {
            return new Response(JSON.stringify({ error: 'counter_email and company_id are required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(counter_email)) {
            return new Response(JSON.stringify({ error: 'Invalid email format' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // Check if access already exists
          const existing = await env.DB.prepare(
            'SELECT id FROM counter_company_access WHERE counter_email = ? AND company_id = ?'
          )
            .bind(counter_email, parseInt(company_id))
            .first();

          if (existing) {
            return new Response(JSON.stringify({ error: 'Access already exists' }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const result = await env.DB.prepare(
            `INSERT INTO counter_company_access (counter_email, company_id, created_at, updated_at)
             VALUES (?, ?, datetime('now'), datetime('now'))`
          )
            .bind(counter_email, parseInt(company_id))
            .run();

          const newAccess = await env.DB.prepare(
            `SELECT 
              cca.*,
              c.company_name
             FROM counter_company_access cca
             LEFT JOIN companies c ON cca.company_id = c.id
             WHERE cca.id = ?`
          )
            .bind(result.meta.last_row_id)
            .first();

          return new Response(JSON.stringify({ item: newAccess }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (path.startsWith('/api/counter-company-access/') && request.method === 'DELETE') {
        const adminAuth = await ensureAdminAuthorized(request, env);
        if (!adminAuth.authorized) {
          return adminAuth.response;
        }
        try {
          const id = path.split('/').pop();
          const result = await env.DB.prepare('DELETE FROM counter_company_access WHERE id = ?')
            .bind(parseInt(id))
            .run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Access not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // ========== ITEMS CATALOG ==========
      if (path === '/api/items-catalog' && request.method === 'GET') {
        try {
          const stockCode = url.searchParams.get('stock_code');
          
          if (stockCode) {
            // Lookup by stock code
            const item = await env.DB.prepare(
              'SELECT * FROM items_catalog WHERE stock_code = ?'
            ).bind(stockCode).first();
            
            if (!item) {
              return new Response(JSON.stringify({ error: 'Item not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            
            return new Response(JSON.stringify(item), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            // Get all items
            const result = await env.DB.prepare(
              'SELECT * FROM items_catalog ORDER BY stock_code'
            ).all();
            return new Response(JSON.stringify(result.results || []), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (path === '/api/items-catalog' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { stock_code, item_name, requires_serial_number } = body;

          if (!stock_code || !item_name) {
            return new Response(JSON.stringify({ error: 'stock_code and item_name are required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const result = await env.DB.prepare(
            'INSERT INTO items_catalog (stock_code, item_name, requires_serial_number) VALUES (?, ?, ?)'
          ).bind(stock_code, item_name, requires_serial_number ? 1 : 0).run();

          const item = await env.DB.prepare(
            'SELECT * FROM items_catalog WHERE id = ?'
          ).bind(result.meta.last_row_id).first();

          return new Response(JSON.stringify({ message: 'Item created', item }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          if (error.message.includes('UNIQUE constraint')) {
            return new Response(JSON.stringify({ error: 'Item with this stock code already exists' }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (path.startsWith('/api/items-catalog/') && request.method === 'PUT') {
        try {
          const id = path.split('/').pop();
          const body = await request.json();
          const { stock_code, item_name, requires_serial_number } = body;

          if (!stock_code || !item_name) {
            return new Response(JSON.stringify({ error: 'stock_code and item_name are required' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          await env.DB.prepare(
            'UPDATE items_catalog SET stock_code = ?, item_name = ?, requires_serial_number = ?, updated_at = datetime("now") WHERE id = ?'
          ).bind(stock_code, item_name, requires_serial_number ? 1 : 0, parseInt(id)).run();

          const item = await env.DB.prepare(
            'SELECT * FROM items_catalog WHERE id = ?'
          ).bind(parseInt(id)).first();

          if (!item) {
            return new Response(JSON.stringify({ error: 'Item not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ message: 'Item updated', item }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          if (error.message.includes('UNIQUE constraint')) {
            return new Response(JSON.stringify({ error: 'Item with this stock code already exists' }), {
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      if (path.startsWith('/api/items-catalog/') && request.method === 'DELETE') {
        try {
          const id = path.split('/').pop();
          const result = await env.DB.prepare('DELETE FROM items_catalog WHERE id = ?')
            .bind(parseInt(id))
            .run();

          if (result.meta.changes === 0) {
            return new Response(JSON.stringify({ error: 'Item not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
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
            'Items Catalog': 'GET/POST /api/items-catalog, PUT/DELETE /api/items-catalog/:id, GET /api/items-catalog?stock_code=XXX',
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
      // Log the path for debugging
      console.log('404 - Route not found:', path, 'Method:', request.method);
      return new Response(JSON.stringify({ error: 'Not found', path: path, method: request.method }), {
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
