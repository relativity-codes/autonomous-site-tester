import { chromium, Browser, BrowserContext, Page } from 'playwright';

export class PlaywrightManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Page[] = [];

  async launch(options: { headless?: boolean, slowMo?: number } = {}): Promise<void> {
    const { headless = true, slowMo = 0 } = options;
    console.log(`[PlaywrightManager] Launching browser (headless: ${headless}, slowMo: ${slowMo})...`);
    this.browser = await chromium.launch({ headless, slowMo });
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      recordVideo: { dir: 'videos/' } // Simulated artifact storage
    });
  }

  async createPage(): Promise<Page> {
    if (!this.context) throw new Error("Browser not launched");
    const page = await this.context.newPage();
    this.pages.push(page);
    return page;
  }

  async close(): Promise<void> {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    this.pages = [];
  }
}
