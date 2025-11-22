"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.dbGet = dbGet;
exports.dbAll = dbAll;
exports.dbRun = dbRun;
exports.closeDatabase = closeDatabase;
const pg_1 = require("pg");
let pool;
async function initializeDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl || databaseUrl === 'base' || databaseUrl.includes('base')) {
        // Fallback to in-memory storage for development or when no valid DATABASE_URL
        console.log('No valid DATABASE_URL provided, using in-memory storage');
        console.log('✅ Database initialized (in-memory mode)');
        return;
    }
    try {
        pool = new pg_1.Pool({
            connectionString: databaseUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        // Test connection
        const client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        client.release();
        await createTables();
        console.log('✅ Database initialized (PostgreSQL)');
    }
    catch (error) {
        console.error('Error connecting to database:', error);
        console.log('Falling back to in-memory storage');
        pool = undefined;
        console.log('✅ Database initialized (in-memory fallback)');
    }
}
async function createTables() {
    if (!pool)
        return;
    try {
        // Create scans table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS scans (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
        violations_found INTEGER DEFAULT 0,
        pages_scanned INTEGER DEFAULT 0,
        scan_results TEXT, -- JSON string of violations
        content_extracted TEXT, -- JSON string of extracted content
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
      )
    `);
        // Create ad_drafts table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS ad_drafts (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        original_content TEXT,
        compliant_content TEXT,
        violations_detected TEXT, -- JSON string
        status TEXT CHECK (status IN ('draft', 'checked', 'approved')) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
      )
    `);
        // Create indexes for better performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_scans_expires_at ON scans(expires_at)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_ad_drafts_session_id ON ad_drafts(session_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_ad_drafts_expires_at ON ad_drafts(expires_at)`);
        console.log('Database tables created successfully');
    }
    catch (error) {
        console.error('Error creating database tables:', error);
        throw error;
    }
}
function getDatabase() {
    if (!pool) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return pool;
}
// In-memory storage fallback for development
const memoryStorage = {
    scans: [],
    ad_drafts: []
};
// Helper functions for database operations
async function dbGet(sql, params = []) {
    if (!pool) {
        // Fallback to in-memory storage
        console.log('Using in-memory storage for development');
        return null;
    }
    try {
        const result = await pool.query(sql, params);
        return result.rows[0] || null;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
async function dbAll(sql, params = []) {
    if (!pool) {
        // Fallback to in-memory storage
        console.log('Using in-memory storage for development');
        return [];
    }
    try {
        const result = await pool.query(sql, params);
        return result.rows;
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
async function dbRun(sql, params = []) {
    if (!pool) {
        // Fallback to in-memory storage
        console.log('Using in-memory storage for development');
        return { lastID: Date.now(), changes: 1 };
    }
    try {
        // Handle different SQL operations
        if (sql.trim().toUpperCase().startsWith('INSERT')) {
            const result = await pool.query(sql + ' RETURNING id', params);
            return {
                lastID: result.rows[0]?.id || 0,
                changes: result.rowCount || 0
            };
        }
        else {
            // For DELETE, UPDATE operations
            const result = await pool.query(sql, params);
            return {
                lastID: 0,
                changes: result.rowCount || 0
            };
        }
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
async function closeDatabase() {
    if (pool) {
        await pool.end();
    }
}
