import { Page } from 'playwright';

export class PageController {
  private logs: string[] = [];

  constructor(private page: Page) {
    this.page.on('console', msg => {
      this.logs.push(`[${msg.type()}] ${msg.text()}`);
    });
  }

  async getConsoleLogs(): Promise<string[]> {
    const currentLogs = [...this.logs];
    this.logs = []; // Clear after retrieval to avoid duplication
    return currentLogs;
  }

  async navigate(url: string): Promise<void> {
    console.log(`[PageController] Navigating to ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async click(selector: string): Promise<void> {
    console.log(`[PageController] Clicking element: ${selector}`);
    await this.page.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    console.log(`[PageController] Typing into ${selector}`);
    await this.page.fill(selector, text);
  }

  async getScreenshot(path: string): Promise<void> {
    console.log(`[PageController] Saving screenshot to ${path}`);
    await this.page.screenshot({ path, fullPage: true });
  }

  async evaluate<T>(fn: string | ((arg: any) => T | Promise<T>), arg?: any): Promise<T> {
    return await this.page.evaluate(fn, arg);
  }
}
