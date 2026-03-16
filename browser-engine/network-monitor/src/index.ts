import { Page, Request, Response } from 'playwright';

export interface NetworkLog {
  url: string;
  method: string;
  status?: number;
  duration?: number;
  timestamp: number;
}

export class NetworkMonitor {
  private logs: NetworkLog[] = [];

  attach(page: Page): void {
    page.on('request', (request: Request) => {
       this.logs.push({
         url: request.url(),
         method: request.method(),
         timestamp: Date.now()
       });
    });

    page.on('response', (response: Response) => {
       const request = response.request();
       const log = this.logs.find(l => l.url === request.url() && l.method === request.method() && !l.status);
       if (log) {
         log.status = response.status();
       }
    });
  }

  getLogs(): NetworkLog[] {
    return this.logs;
  }
}
