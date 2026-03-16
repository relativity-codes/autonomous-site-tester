import { PageController } from '../../../browser-engine/page-controller/src/index';
import { AccessibilityAgent } from '../../../agents/accessibility-agent/src/index';
import { VisionAgent } from '../../../agents/vision-agent/src/index';
import { FormAgent } from '../../../agents/form-agent/src/index';
import { IssueDetector } from '../../../report-engine/issue-detector/src/index';
import { ProviderConfig } from '../../../agent-runtime/decision/src/index';
import { ModelRouter } from '../../../agent-runtime/decision/src/index';
import { UXAgent } from '../../../agents/ux-agent/src/index';
import { PerformanceAgent } from '../../../agents/performance-agent/src/index';
import { InteractionLoop } from '../../../computer-control/interaction-loop/src/index';
import { ScreenCapture } from '../../../computer-control/screen-capture/src/index';
import { VisionDetection } from '../../../computer-control/vision-detection/src/index';
import { MouseController } from '../../../computer-control/mouse-controller/src/index';
import { KeyboardController } from '../../../computer-control/keyboard-controller/src/index';

export interface WorkerResult {
  url: string;
  issues: any[];
  success: boolean;
  metrics?: any;
  error?: string;
}

export class TestWorker {
  private a11y: AccessibilityAgent;
  private vision: VisionAgent;
  private form: FormAgent;
  private issueDetector: IssueDetector;
  private ux: UXAgent;
  private perf: PerformanceAgent;
  private loop: InteractionLoop;

  constructor() {
    this.a11y = new AccessibilityAgent();
    this.vision = new VisionAgent();
    this.form = new FormAgent();
    this.issueDetector = new IssueDetector();
    this.ux = new UXAgent();
    this.perf = new PerformanceAgent();
    
    this.loop = new InteractionLoop(
      new ScreenCapture(),
      new VisionDetection(),
      new MouseController(),
      new (require('../../../computer-control/keyboard-controller/src/index').KeyboardController)()
    );
  }

  async auditPage(
    url: string, 
    controller: PageController, 
    router: ModelRouter, 
    config: ProviderConfig,
    onScreenshot?: (path: string) => void,
    credentials?: any[]
  ): Promise<WorkerResult> {
    console.log(`[Worker] Auditing ${url}`);
    const issues: any[] = [];

    // Filter credentials for this domain if available
    const domainCreds = credentials?.filter(c => url.includes(c.domain));
    const credsHint = domainCreds && domainCreds.length > 0 
      ? `Real credentials available for this domain: ${JSON.stringify(domainCreds.map(c => ({ username: c.username, password: '***' })))}`
      : undefined;

    try {
      await controller.navigate(url);
      
      // 1. Accessibility
      const dom = await controller.evaluate(() => document.body.innerHTML.substring(0, 10000));
      const a11yRes = await this.a11y.runAudit(dom, router, config);
      issues.push(...a11yRes.violations.map(v => ({ ...v, url, category: 'accessibility' })));

      // 2. Vision
      const screenshot = `screenshots/worker_${Date.now()}.png`;
      await controller.getScreenshot(screenshot);
      if (onScreenshot) onScreenshot(screenshot);
      const visionRes = await this.vision.analyzeScreenshot(screenshot, 'General audit', router, config);
      if (visionRes.hasAnomalies) {
        issues.push(...visionRes.issues.map(i => ({ description: i, url, category: 'visual', type: 'Visual Anomaly' })));
      }

      // 3. Functional/Logs
      const logs = await controller.getConsoleLogs();
      const functionalIssues = this.issueDetector.detectFunctionalIssues(logs, url);
      issues.push(...functionalIssues);

      // 4. UX Analysis
      const uxIssues = await this.ux.analyzeUsability(dom, router, config);
      issues.push(...uxIssues.map(i => ({ ...i, url, category: 'ux' })));

      // 5. Performance
      const perfMetrics = await this.perf.collectMetrics(controller);
      // We could store metrics separately, but for now let's add a performance summary issue if any metric is bad
      if (perfMetrics.loadTime > 3000) {
        issues.push({
          type: 'Performance Issue',
          severity: 'medium',
          description: `Page load time is slow: ${Math.round(perfMetrics.loadTime)}ms`,
          url,
          category: 'performance'
        });
      }

      return { url, issues, success: true, metrics: perfMetrics };
    } catch (err: any) {
      console.error(`[Worker] Error auditing ${url}: ${err.message}`);
      // Self-healing attempt!
      if (err.message.includes('selector') || err.message.includes('not found')) {
         console.log(`[Worker] Attempting self-healing for ${url}...`);
         // In a real scenario, we'd know what we were trying to click. 
         // For now, let's try to find a 'Submit' or primary button visually.
         const healed = await this.loop.interactWithElement('Primary action button', 'click', router, config);
         if (healed) {
           console.log(`[Worker] Self-healing successful!`);
           return { url, issues, success: true };
         }
      }
      return { url, issues, success: false, error: err.message };
    }
  }
}

export class WorkerPool {
  private workers: TestWorker[] = [];
  private taskQueue: string[] = [];
  private activeCount: number = 0;
  private results: WorkerResult[] = [];
  private isStopped: boolean = false;
  private isPaused: boolean = false;

  constructor(private concurrency: number = 3) {
    for (let i = 0; i < concurrency; i++) {
      this.workers.push(new TestWorker());
    }
  }

  stop() {
    this.isStopped = true;
    this.taskQueue = [];
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  async run(
    urls: string[], 
    playwright: any, 
    router: ModelRouter, 
    config: ProviderConfig,
    credentials?: any[],
    onResult?: (res: WorkerResult) => void,
    onScreenshot?: (path: string) => void
  ): Promise<WorkerResult[]> {
    this.taskQueue = [...urls];
    this.results = [];
    this.activeCount = 0;

    return new Promise((resolve) => {
      const processNext = async () => {
        if ((this.taskQueue.length === 0 && this.activeCount === 0) || this.isStopped) {
          resolve(this.results);
          return;
        }

        if (this.isPaused) {
          setTimeout(processNext, 500);
          return;
        }

        while (this.activeCount < this.concurrency && this.taskQueue.length > 0) {
          const url = this.taskQueue.shift()!;
          this.activeCount++;

          (async () => {
            try {
              const page = await playwright.createPage();
              const controller = new (require('../../../browser-engine/page-controller/src/index').PageController)(page);
              
              const worker = new TestWorker(); 
              const result = await worker.auditPage(url, controller, router, config, onScreenshot, credentials);
              
              await page.close();
              this.results.push(result);
              if (onResult) onResult(result);
            } catch (err: any) {
              const res = { url, issues: [], success: false, error: err.message };
              this.results.push(res);
              if (onResult) onResult(res);
            } finally {
              this.activeCount--;
              processNext();
            }
          })();
        }
      };

      processNext();
    });
  }
}
