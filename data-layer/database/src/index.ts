import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = crypto.scryptSync('autonomous-site-tester-v1', 'salt', 32);

export class DBManager {
  private db: Database;

  constructor(dbPath: string) {
    this.db = new sqlite3.Database(dbPath);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  private decrypt(hash: string): string {
    const parts = hash.split(':');
    if (parts.length !== 3) return hash; // Not encrypted or old format
    const [ivHex, authTagHex, encryptedText] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async initialize(): Promise<void> {
    const schemas = [
      `CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS pages (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        url TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY(run_id) REFERENCES runs(id)
      )`,
      `CREATE TABLE IF NOT EXISTS issues (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        page_id TEXT,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        screenshot_path TEXT,
        FOREIGN KEY(run_id) REFERENCES runs(id)
      )`,
      `CREATE TABLE IF NOT EXISTS metrics (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        page_id TEXT,
        key TEXT NOT NULL,
        value REAL NOT NULL,
        FOREIGN KEY(run_id) REFERENCES runs(id)
      )`,
      `CREATE TABLE IF NOT EXISTS ai_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        provider TEXT NOT NULL,
        model_name TEXT NOT NULL,
        api_key TEXT,
        base_url TEXT,
        temperature REAL,
        max_tokens INTEGER,
        headless BOOLEAN DEFAULT 1,
        slow_mo INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS user_prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 0,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS credentials (
        id TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS macros (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        steps TEXT NOT NULL, -- JSON string
        is_active BOOLEAN DEFAULT 1,
        updated_at INTEGER NOT NULL
      )`
    ];

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        let completed = 0;
        schemas.forEach(sql => {
          this.db.run(sql, (err) => {
            if (err) reject(err);
            completed++;
            if (completed === schemas.length) resolve();
          });
        });
      });
    });
  }

  async getAIConfig(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM ai_config WHERE id = 1`, (err, row: any) => {
        if (err) reject(err);
        if (row && row.api_key) {
          try {
            row.api_key = this.decrypt(row.api_key);
          } catch (e) {
            console.warn('[DBManager] Failed to decrypt API key');
          }
        }
        resolve(row);
      });
    });
  }

  async saveAIConfig(config: any): Promise<void> {
    const { provider, modelName, apiKey, baseUrl, temperature, maxTokens, headless, slowMo } = config;
    const now = Date.now();
    const encryptedKey = apiKey ? this.encrypt(apiKey) : null;
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO ai_config (id, provider, model_name, api_key, base_url, temperature, max_tokens, headless, slow_mo, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           provider=excluded.provider,
           model_name=excluded.model_name,
           api_key=excluded.api_key,
           base_url=excluded.base_url,
           temperature=excluded.temperature,
           max_tokens=excluded.max_tokens,
           headless=excluded.headless,
           slow_mo=excluded.slow_mo,
           updated_at=excluded.updated_at`,
        [provider, modelName, encryptedKey, baseUrl, temperature, maxTokens, headless ? 1 : 0, slowMo || 0, now],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async getActiveUserPrompt(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM user_prompts WHERE is_active = 1 LIMIT 1`, (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  async saveUserPrompt(name: string, content: string): Promise<void> {
    const now = Date.now();
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Deactivate all others
        this.db.run(`UPDATE user_prompts SET is_active = 0`);
        // Insert new active one
        this.db.run(
          `INSERT INTO user_prompts (id, name, content, is_active, updated_at)
           VALUES (?, ?, ?, 1, ?)`,
          [crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), name, content, now],
          (err) => {
            if (err) reject(err);
            resolve();
          }
        );
      });
    });
  }

  async getCredentials(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM credentials ORDER BY domain ASC`, (err, rows: any[]) => {
        if (err) reject(err);
        if (!rows) return resolve([]);
        const decryptedRows = rows.map(row => {
          try {
            return { ...row, password: this.decrypt(row.password) };
          } catch (e) {
            return row;
          }
        });
        resolve(decryptedRows);
      });
    });
  }

  async saveCredential(domain: string, username: string, password: string): Promise<void> {
    const now = Date.now();
    const encryptedPassword = this.encrypt(password);
    const id = crypto.randomUUID ? crypto.randomUUID() : `cred_${Date.now()}`;
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO credentials (id, domain, username, password, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, domain, username, encryptedPassword, now],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async deleteCredential(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM credentials WHERE id = ?`, [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async getMacrosByDomain(domain: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM macros WHERE domain = ? OR ? LIKE '%' || domain || '%' ORDER BY updated_at DESC`;
      let params = [domain, domain];
      
      if (!domain) {
        query = `SELECT * FROM macros ORDER BY updated_at DESC`;
        params = [];
      }

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        if (!rows) return resolve([]);
        const parsedRows = rows.map(row => {
          try {
            return {
              ...row,
              steps: JSON.parse(row.steps || '[]')
            };
          } catch (e) {
            return { ...row, steps: [] };
          }
        });
        resolve(parsedRows);
      });
    });
  }

  async saveMacro(name: string, domain: string, steps: any[]): Promise<void> {
    const now = Date.now();
    const id = crypto.randomUUID ? crypto.randomUUID() : `macro_${Date.now()}`;
    const stepsJson = JSON.stringify(steps);
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO macros (id, name, domain, steps, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, name, domain, stepsJson, now],
        (err) => {
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  async deleteMacro(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM macros WHERE id = ?`, [id], (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }

  async clearHistoricalData(): Promise<void> {
    const tables = ['runs', 'pages', 'issues', 'metrics', 'macros'];
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        let completed = 0;
        tables.forEach(table => {
          this.db.run(`DELETE FROM ${table}`, (err) => {
            if (err) reject(err);
            completed++;
            if (completed === tables.length) resolve();
          });
        });
      });
    });
  }

  getDB(): Database {
    return this.db;
  }
}
