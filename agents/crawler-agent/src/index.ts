import { PageController } from '../../../browser-engine/page-controller/src/index';

export interface ProcessedUrl {
  url: string;
  status: 'PENDING' | 'VISITING' | 'VISITED' | 'FAILED';
  discoveredAt: number;
}

export class CrawlerAgent {
  private queue: ProcessedUrl[] = [];
  public readonly startUrl: string;

  constructor(startUrl: string, public readonly page: PageController) {
    this.startUrl = startUrl;
    this.queue.push({ url: startUrl, status: 'PENDING', discoveredAt: Date.now() });
  }

  getVisitedCount(): number {
    return this.queue.filter(q => q.status === 'VISITED').length;
  }

  async crawlPage(url: string): Promise<string[]> {
    console.log(`[CrawlerAgent] Navigating to ${url}`);
    const item = this.queue.find(q => q.url === url);
    if (item) item.status = 'VISITING';

    try {
      await this.page.navigate(url);
      
      const discoveredLinks = await this.page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
          .map(a => a.href)
          .filter(href => href.startsWith('http'))
          .slice(0, 15);
      });

      // Domain restriction
      const startHost = new URL(this.startUrl).hostname;
      const internalLinks = discoveredLinks.filter(link => {
        try {
          return new URL(link).hostname === startHost;
        } catch {
          return false;
        }
      });
      
      this.addDiscoveredUrls(internalLinks);
      
      if (item) item.status = 'VISITED';
      return internalLinks;
    } catch (err) {
      if (item) item.status = 'FAILED';
      throw err;
    }
  }

  async getNextUrl(): Promise<string | null> {
    const next = this.queue.find(q => q.status === 'PENDING');
    return next ? next.url : null;
  }

  addDiscoveredUrls(urls: string[]) {
    urls.forEach(url => {
      if (!this.queue.find(q => q.url === url)) {
        this.queue.push({ url, status: 'PENDING', discoveredAt: Date.now() });
      }
    });
  }
}
