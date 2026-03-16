export interface APIEndpoint {
  path: string;
  method: string;
  summary?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

export interface APISpec {
  title: string;
  version: string;
  baseUrl: string;
  endpoints: APIEndpoint[];
}

export class APIDiscoveryAgent {
  async discover(url: string): Promise<APISpec> {
    console.log(`[APIDiscoveryAgent] Fetching API spec from ${url}...`);
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch spec: ${response.statusText}`);
      
      const spec = await response.json();
      return this.parseOpenAPI(spec, url);
    } catch (error) {
      console.error(`[APIDiscoveryAgent] Discovery failed:`, error);
      throw error;
    }
  }

  private parseOpenAPI(spec: any, originalUrl: string): APISpec {
    const endpoints: APIEndpoint[] = [];
    const paths = spec.paths || {};
    
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods as any)) {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: (details as any).summary,
          parameters: (details as any).parameters,
          requestBody: (details as any).requestBody,
          responses: (details as any).responses,
        });
      }
    }

    // Determine Base URL
    let baseUrl = '';
    if (spec.servers && spec.servers.length > 0) {
      baseUrl = spec.servers[0].url;
    } else if (spec.host) {
      const scheme = spec.schemes ? spec.schemes[0] : 'https';
      baseUrl = `${scheme}://${spec.host}${spec.basePath || ''}`;
    } else {
      // Fallback to the domain of the spec file itself
      try {
        const urlObj = new URL(originalUrl);
        baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      } catch {
        baseUrl = originalUrl;
      }
    }

    return {
      title: spec.info?.title || 'API Audit',
      version: spec.info?.version || '1.0.0',
      baseUrl,
      endpoints
    };
  }
}
