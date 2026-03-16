import fs from 'fs';
import path from 'path';

export class ArtifactManager {
  constructor(private basePath: string) {
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
  }

  async storeScreenshot(runId: string, pageId: string, buffer: Buffer): Promise<string> {
    const dir = path.join(this.basePath, runId, 'screenshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const filePath = path.join(dir, `${pageId}.png`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  async storeLog(runId: string, log: string): Promise<void> {
    const dir = path.join(this.basePath, runId, 'logs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.appendFileSync(path.join(dir, 'run.log'), log + '\n');
  }

  async clearAllArtifacts(): Promise<void> {
    if (fs.existsSync(this.basePath)) {
      const items = fs.readdirSync(this.basePath);
      for (const item of items) {
        const itemPath = path.join(this.basePath, item);
        if (fs.lstatSync(itemPath).isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(itemPath);
        }
      }
    }
  }
}
