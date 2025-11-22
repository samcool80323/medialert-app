import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

let db: sqlite3.Database;

export async function initializeDatabase(): Promise<void> {
  const dbPath = process.env.DATABASE_URL || './mediguard.db';
  
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      console.log('Connected to SQLite database');
      createTables()
        .then(() => resolve())
        .catch(reject);
    });
  });
}

async function createTables(): Promise<void> {
  const run = promisify(db.run.bind(db));
  
  try {
    // Create scans table
    await run(`
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
    await run(`
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
    await run(`CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_scans_expires_at ON scans(expires_at)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_ad_drafts_session_id ON ad_drafts(session_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_ad_drafts_expires_at ON ad_drafts(expires_at)`);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
    throw error;
  }
}

export function getDatabase(): sqlite3.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Helper functions for database operations
export function dbGet(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export async function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
}