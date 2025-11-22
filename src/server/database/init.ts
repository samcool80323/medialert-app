import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database;

export async function initializeDatabase(): Promise<void> {
  const dbPath = process.env.DATABASE_URL || './mediguard.db';
  
  try {
    db = new Database(dbPath);
    console.log('Connected to SQLite database');
    
    await createTables();
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  try {
    // Create scans table
    db.exec(`
      CREATE TABLE IF NOT EXISTS scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
        violations_found INTEGER DEFAULT 0,
        pages_scanned INTEGER DEFAULT 0,
        scan_results TEXT, -- JSON string of violations
        content_extracted TEXT, -- JSON string of extracted content
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT (datetime('now', '+24 hours'))
      )
    `);

    // Create ad_drafts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS ad_drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        original_content TEXT,
        compliant_content TEXT,
        violations_detected TEXT, -- JSON string
        status TEXT CHECK (status IN ('draft', 'checked', 'approved')) DEFAULT 'draft',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT (datetime('now', '+24 hours'))
      )
    `);

    // Create indexes for better performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_scans_expires_at ON scans(expires_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ad_drafts_session_id ON ad_drafts(session_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ad_drafts_expires_at ON ad_drafts(expires_at)`);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Helper functions for database operations
export function dbGet(sql: string, params: any[] = []): Promise<any> {
  return Promise.resolve(db.prepare(sql).get(params));
}

export function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return Promise.resolve(db.prepare(sql).all(params));
}

export function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  const result = db.prepare(sql).run(params);
  return Promise.resolve({
    lastID: result.lastInsertRowid as number,
    changes: result.changes
  });
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    db.close();
  }
}