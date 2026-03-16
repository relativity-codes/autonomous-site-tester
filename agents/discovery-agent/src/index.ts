import { PageController } from '../../../browser-engine/page-controller/src/index';

export interface SiteMetadata {
  title: string;
  description: string;
  keyAreas: { name: string; url: string }[];
  menuItems: string[];
  footerLinks: string[];
  hasSitemap: boolean;
}

export class SiteDiscoveryAgent {
  constructor(public readonly page: PageController) {}

  async discover(url: string): Promise<SiteMetadata> {
    console.log(`[SiteDiscoveryAgent] Mapping site structure for: ${url}`);
    
    await this.page.navigate(url);
    
    const metadata = await this.page.evaluate(() => {
      const getLinks = (selector: string) => {
        return Array.from(document.querySelectorAll(selector + ' a'))
          .map(a => ({ name: (a as HTMLElement).innerText.trim(), url: (a as HTMLAnchorElement).href }))
          .filter(l => l.name && l.url.startsWith('http'))
          .slice(0, 10);
      };

      const title = document.title;
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      // Look for common structural patterns
      const navLinks = getLinks('nav');
      const headerLinks = getLinks('header');
      const footerLinks = getLinks('footer');
      
      const combinedKeyAreas = [...navLinks, ...headerLinks].slice(0, 15);
      
      return {
        title,
        description,
        keyAreas: combinedKeyAreas,
        menuItems: combinedKeyAreas.map(k => k.name),
        footerLinks: footerLinks.map(k => k.name),
        hasSitemap: false 
      };
    });

    // Attempt to check for sitemap.xml
    try {
      const baseUrl = new URL(url).origin;
      const sitemapUrl = `${baseUrl}/sitemap.xml`;
      const response = await fetch(sitemapUrl, { method: 'HEAD' });
      if (response.ok) {
        metadata.hasSitemap = true;
        console.log(`[SiteDiscoveryAgent] Sitemap found at: ${sitemapUrl}`);
      }
    } catch (e) {
      // Ignore sitemap fetch errors
    }

    return metadata;
  }
}
