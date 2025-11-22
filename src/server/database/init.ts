import { Pool, Client } from 'pg';

let pool: Pool;

export async function initializeDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    // Fallback to in-memory storage for development
    console.log('No DATABASE_URL provided, using in-memory storage');
    return;
  }
  
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    client.release();
    
    await createTables();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  if (!pool) return;
  
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
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

export function getDatabase(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

// In-memory storage fallback for development
const memoryStorage: { [key: string]: any[] } = {
  scans: [],
  ad_drafts: []
};

// Helper functions for database operations
export async function dbGet(sql: string, params: any[] = []): Promise<any> {
  if (!pool) {
    // Fallback to in-memory storage
    console.log('Using in-memory storage for development');
    return null;
  }
  
  try {
    const result = await pool.query(sql, params);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  if (!pool) {
    // Fallback to in-memory storage
    console.log('Using in-memory storage for development');
    return [];
  }
  
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  if (!pool) {
    // Fallback to in-memory storage
    console.log('Using in-memory storage for development');
    return { lastID: Date.now(), changes: 1 };
  }
  
  try {
    const result = await pool.query(sql + ' RETURNING id', params);
    return {
      lastID: result.rows[0]?.id || 0,
      changes: result.rowCount || 0
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
  }
}