import { Page } from 'playwright';

export class DOMExtractor {
  constructor(private page: Page) {}

  async getAccessibleDOM(): Promise<string> {
    console.log(`[DOMExtractor] Extracting accessible semantic DOM...`);
    // Minimal semantic tree representation
    const semanticHTML = await this.page.evaluate(() => {
        // Very basic stub
        return document.body.innerHTML.substring(0, 1000) + '...';
    });
    return semanticHTML;
  }

  async extractForms(): Promise<any[]> {
    return await this.page.evaluate(() => {
      return Array.from(document.forms).map(f => ({
        id: f.id,
        action: f.action,
        inputs: Array.from(f.elements).map((e: any) => ({ name: e.name, type: e.type }))
      }));
    });
  }
}
