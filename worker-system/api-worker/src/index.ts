export interface APIWorkerResult {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  success: boolean;
  issues: any[];
  response?: any;
}

export class APIWorker {
  async auditEndpoint(
    baseUrl: string,
    endpoint: any,
    credentials?: any[],
    context: Record<string, any> = {}
  ): Promise<APIWorkerResult> {
    const { path, method } = endpoint;
    const startTime = Date.now();
    const issues: any[] = [];

    // 1. Inject Variables into Path
    let finalPath = path;
    for (const [key, value] of Object.entries(context)) {
      finalPath = finalPath.replace(`{${key}}`, String(value));
    }
    const url = `${baseUrl}${finalPath}`;

    console.log(`[APIWorker] Auditing ${method} ${url} (Context keys: ${Object.keys(context).join(', ')})`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // Apply Credentials
    if (credentials && credentials.length > 0) {
      try {
        const urlObj = new URL(url);
        const cred = credentials.find(c => urlObj.hostname.includes(c.domain));
        if (cred) {
          if (cred.password.length > 30) {
            headers['Authorization'] = `Bearer ${cred.password}`;
          } else {
            const auth = Buffer.from(`${cred.username}:${cred.password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
          }
        }
      } catch (e) {
        // Fallback for invalid URLs or baseUrls
      }
    }

    try {
      // 2. Prepare Body with Injections
      let body: any = undefined;
      if (method === 'POST' || method === 'PUT') {
        const templateBody = endpoint.requestBody || {};
        const bodyStr = JSON.stringify(templateBody);
        let injectedBodyStr = bodyStr;
        for (const [key, value] of Object.entries(context)) {
          injectedBodyStr = injectedBodyStr.replace(`{${key}}`, String(value));
        }
        body = injectedBodyStr;
      }

      const response = await fetch(url, {
        method,
        headers,
        body
      });

      const duration = Date.now() - startTime;
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        issues.push({
          type: 'API Error',
          severity: 'high',
          description: `Endpoint returned ${response.status}: ${response.statusText}`,
          url
        });
      }

      // 3. Extract Variables from successful response
      if (response.ok && data) {
        this.extractVariables(data, context);
      }
      
      return {
        path: finalPath,
        method,
        statusCode: response.status,
        duration,
        success: response.ok,
        issues,
        response: data
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      issues.push({
        type: 'Network Error',
        severity: 'critical',
        description: `Failed to reach endpoint: ${error.message}`,
        url
      });
      
      return {
        path: finalPath,
        method,
        statusCode: 0,
        duration,
        success: false,
        issues
      };
    }
  }

  private extractVariables(data: any, context: Record<string, any>) {
    const commonIdKeys = ['id', 'uid', 'uuid', 'userId', 'productId', 'orderId', 'username', 'token'];
    
    const scan = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const [key, value] of Object.entries(obj)) {
        if (commonIdKeys.includes(key) && (typeof value === 'string' || typeof value === 'number')) {
          context[key] = value;
          console.log(`[APIWorker] Extracted context variable: ${key} = ${value}`);
        }
        if (typeof value === 'object') scan(value);
      }
    };

    if (Array.isArray(data)) {
      data.slice(0, 3).forEach(item => scan(item));
    } else {
      scan(data);
    }
  }
}
