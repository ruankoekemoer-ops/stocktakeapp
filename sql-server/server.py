#!/usr/bin/env python3
"""
Simple SQL Server using SQLite
Provides a REST API to interact with the database
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

# Database file
DB_FILE = 'stocktake.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn

def init_db():
    """Initialize database with schema"""
    if not os.path.exists(DB_FILE):
        print(f"Creating database: {DB_FILE}")
        conn = get_db_connection()
        with open('setup.sql', 'r') as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()
        print("Database initialized successfully!")

@app.route('/')
def index():
    """API information"""
    return jsonify({
        'name': 'Stock Take SQL Server',
        'version': '1.0.0',
        'endpoints': {
            'GET /api/items': 'Get all stock items',
            'GET /api/items/<id>': 'Get item by ID',
            'POST /api/items': 'Create new item',
            'PUT /api/items/<id>': 'Update item',
            'DELETE /api/items/<id>': 'Delete item',
            'GET /api/companies': 'Get all companies',
            'GET /api/warehouses': 'Get all warehouses'
        }
    })

@app.route('/api/items', methods=['GET'])
def get_items():
    """Get all stock items"""
    try:
        conn = get_db_connection()
        
        # Get query parameters
        search = request.args.get('search', '')
        location = request.args.get('location', '')
        limit = request.args.get('limit', type=int)
        
        query = "SELECT * FROM stock_items WHERE 1=1"
        params = []
        
        if search:
            query += " AND (item_name LIKE ? OR notes LIKE ?)"
            params.extend([f'%{search}%', f'%{search}%'])
        
        if location:
            query += " AND location = ?"
            params.append(location)
        
        query += " ORDER BY date DESC, created_at DESC"
        
        if limit:
            query += f" LIMIT {limit}"
        
        items = conn.execute(query, params).fetchall()
        conn.close()
        
        return jsonify([dict(item) for item in items])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """Get item by ID"""
    try:
        conn = get_db_connection()
        item = conn.execute(
            'SELECT * FROM stock_items WHERE id = ?', (item_id,)
        ).fetchone()
        conn.close()
        
        if item is None:
            return jsonify({'error': 'Item not found'}), 404
        
        return jsonify(dict(item))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items', methods=['POST'])
def create_item():
    """Create new item"""
    try:
        data = request.json
        conn = get_db_connection()
        
        conn.execute(
            '''INSERT INTO stock_items (item_name, quantity, location, date, notes)
               VALUES (?, ?, ?, ?, ?)''',
            (
                data.get('item_name'),
                data.get('quantity', 0),
                data.get('location'),
                data.get('date'),
                data.get('notes')
            )
        )
        conn.commit()
        item_id = conn.lastrowid
        
        # Get the created item
        item = conn.execute(
            'SELECT * FROM stock_items WHERE id = ?', (item_id,)
        ).fetchone()
        conn.close()
        
        return jsonify({
            'message': 'Item created successfully',
            'item': dict(item)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:item_id>', methods=['PUT'])
def update_item(item_id):
    """Update item"""
    try:
        data = request.json
        conn = get_db_connection()
        
        # Check if item exists
        existing = conn.execute(
            'SELECT * FROM stock_items WHERE id = ?', (item_id,)
        ).fetchone()
        
        if existing is None:
            conn.close()
            return jsonify({'error': 'Item not found'}), 404
        
        conn.execute(
            '''UPDATE stock_items 
               SET item_name = ?, quantity = ?, location = ?, date = ?, notes = ?, updated_at = ?
               WHERE id = ?''',
            (
                data.get('item_name', existing['item_name']),
                data.get('quantity', existing['quantity']),
                data.get('location', existing['location']),
                data.get('date', existing['date']),
                data.get('notes', existing['notes']),
                datetime.now().isoformat(),
                item_id
            )
        )
        conn.commit()
        
        # Get the updated item
        item = conn.execute(
            'SELECT * FROM stock_items WHERE id = ?', (item_id,)
        ).fetchone()
        conn.close()
        
        return jsonify({
            'message': 'Item updated successfully',
            'item': dict(item)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    """Delete item"""
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM stock_items WHERE id = ?', (item_id,))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Item deleted successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/companies', methods=['GET'])
def get_companies():
    """Get all companies"""
    try:
        conn = get_db_connection()
        companies = conn.execute('SELECT * FROM companies').fetchall()
        conn.close()
        return jsonify([dict(company) for company in companies])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/warehouses', methods=['GET'])
def get_warehouses():
    """Get all warehouses"""
    try:
        conn = get_db_connection()
        warehouses = conn.execute('SELECT * FROM warehouses').fetchall()
        conn.close()
        return jsonify([dict(warehouse) for warehouse in warehouses])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Run server
    print("Starting SQL Server on http://localhost:5000")
    print("API Documentation: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)

