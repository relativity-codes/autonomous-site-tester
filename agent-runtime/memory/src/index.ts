import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';

export interface MemoryEntry {
  id: string;
  type: 'instruction' | 'page_visited' | 'issue_detected' | 'test_progress';
  data: string;
  timestamp: number;
}

export class ContextMemory {
  private db: Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new sqlite3.Database(dbPath);
    this.initialize();
  }

  private initialize() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS memory (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);
  }

  async addEntry(type: MemoryEntry['type'], data: any): Promise<void> {
    const id = Date.now().toString() + Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO memory (id, type, data, timestamp) VALUES (?, ?, ?, ?)',
        [id, type, dataString, timestamp],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getRecentEntries(type?: MemoryEntry['type'], limit: number = 50): Promise<MemoryEntry[]> {
    return new Promise((resolve, reject) => {
      const query = type 
        ? 'SELECT * FROM memory WHERE type = ? ORDER BY timestamp DESC LIMIT ?'
        : 'SELECT * FROM memory ORDER BY timestamp DESC LIMIT ?';
      const params = type ? [type, limit] : [limit];

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as MemoryEntry[]);
      });
    });
  }

  async clearInstructions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM memory WHERE type = 'instruction'", (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  async getSummarizedContext(): Promise<string> {
    const entries = await this.getRecentEntries(undefined, 20);
    const instructions = entries.filter(e => e.type === 'instruction');
    const issues = entries.filter(e => e.type === 'issue_detected');
    const pages = entries.filter(e => e.type === 'page_visited');

    let summary = "### Agent Context & History\n";
    
    if (instructions.length > 0) {
      summary += "\n**Active User Instructions:**\n";
      instructions.forEach(i => summary += `- ${i.data}\n`);
    }

    if (pages.length > 0) {
      summary += `\n**Pages Visited Recently:** ${pages.length} pages.\n`;
      pages.slice(0, 3).forEach(p => summary += `- ${p.data}\n`);
    }

    if (issues.length > 0) {
      summary += `\n**Recent Issues Detected:** ${issues.length} issues.\n`;
      issues.slice(0, 3).forEach(iss => {
        try {
          const d = JSON.parse(iss.data);
          summary += `- [${d.type}] ${d.description} at ${d.url}\n`;
        } catch {
          summary += `- ${iss.data}\n`;
        }
      });
    }

    return summary;
  }
}
