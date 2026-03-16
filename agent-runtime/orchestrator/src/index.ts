import { TaskPlanner, Plan } from '../../planner/src/index';
import { PlaywrightManager } from '../../../browser-engine/playwright-manager/src/index';
import { PageController } from '../../../browser-engine/page-controller/src/index';
import { CrawlerAgent } from '../../../agents/crawler-agent/src/index';
import { DecisionEngine, ProviderConfig } from '../../decision/src/index';
import { ReportBuilder, ReportData } from '../../../report-engine/report-builder/src/index';
import { IssueDetector } from '../../../report-engine/issue-detector/src/index';
import { FormAgent } from '../../../agents/form-agent/src/index';
import { AccessibilityAgent } from '../../../agents/accessibility-agent/src/index';
import { VisionAgent } from '../../../agents/vision-agent/src/index';
import { SiteDiscoveryAgent } from '../../../agents/discovery-agent/src/index';
import { APIDiscoveryAgent } from '../../../agents/api-discovery-agent/src/index';
import { ContextMemory } from '../../../agent-runtime/memory/src/index';
import { TestWorker, WorkerResult, WorkerPool } from '../../../worker-system/workers/src/index';
import { APIWorker } from '../../../worker-system/api-worker/src/index';

export class Orchestrator {
  private planner: TaskPlanner;
  private playwright: PlaywrightManager;
  private decisionEngine: DecisionEngine;
  private instructionQueue: string[] = [];
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private shouldSkip: boolean = false;
  private currentPlan: Plan | null = null;
  private reportBuilder: ReportBuilder;
  private issueDetector: IssueDetector;
  private formAgent: FormAgent;
  private a11yAgent: AccessibilityAgent;
  private visionAgent: VisionAgent;
  private issues: any[] = [];
  private memory: ContextMemory;
  private worker: TestWorker;
  private maxConcurrency: number = 2;
  private discoveryAgent: SiteDiscoveryAgent | null = null;
  private workerPool: WorkerPool | null = null;
  private pageMetrics: any[] = [];
  private isApiMode: boolean = false;
  
  constructor() {
    this.planner = new TaskPlanner();
    this.playwright = new PlaywrightManager();
    this.decisionEngine = new DecisionEngine();
    this.reportBuilder = new ReportBuilder();
    this.issueDetector = new IssueDetector();
    this.formAgent = new FormAgent();
    this.a11yAgent = new AccessibilityAgent();
    this.visionAgent = new VisionAgent();
    this.memory = new ContextMemory();
    this.worker = new TestWorker();
  }

  async startTask(goal: string, options: { 
    aiConfig?: ProviderConfig, 
    userPrompt?: string, 
    browserOptions?: { headed?: boolean, slowMo?: number },
    onLog?: (msg: string) => void,
    onResult?: (result: any) => void,
    onScreenshot?: (path: string) => void,
    onReport?: (path: string) => void,
    credentials?: any[],
    macros?: any[],
    isSinglePage?: boolean
  }): Promise<void> {
    const { aiConfig, userPrompt, browserOptions, onLog, onResult, onScreenshot, onReport, credentials, macros, isSinglePage } = options;
    const log = (msg: string) => {
      console.log(msg);
      if (onLog) onLog(msg);
    };

    this.resetState();

    log(`[Orchestrator] Starting new task: ${goal}`);
    this.currentPlan = this.planner.createPlan(goal);
    
    log(`[Orchestrator] Launching browser...`);
    await this.playwright.launch({ 
      headless: browserOptions?.headed === true ? false : true,
      slowMo: browserOptions?.slowMo || 0
    }); 
    const page = await this.playwright.createPage();
    const controller = new PageController(page);
    
    let startUrl = goal.trim();
    if (!startUrl.startsWith('http')) {
      const match = goal.match(/https?:\/\/[^\s]+/);
      if (match) {
        startUrl = match[0];
      } else if (startUrl.includes('.') && !startUrl.includes(' ')) {
        startUrl = `https://${startUrl}`;
      } else {
        startUrl = 'https://example.com';
      }
    }
    
    log(`[Orchestrator] Target URL: ${startUrl}`);
    
    // API Mode Detection
    if (startUrl.endsWith('.json') || startUrl.endsWith('.yaml') || startUrl.includes('/swagger') || startUrl.includes('/openapi')) {
      log(`[Orchestrator] API Specification detected. Switching to Autonomous API Audit mode.`);
      this.isApiMode = true;
      await this.executeAPIAudit(startUrl, log, aiConfig, credentials, onResult, onReport);
      return;
    }

    this.discoveryAgent = new SiteDiscoveryAgent(controller);
    const crawler = new CrawlerAgent(startUrl, controller);

    if (this.checkStop()) return;

    // Phase 20: Site Discovery & Strategy Planning
    if (!isSinglePage) {
      log(`[Orchestrator] Performing site discovery...`);
      const siteMap = await this.discoveryAgent.discover(startUrl);
      if (this.checkStop()) return;

      log(`[Orchestrator] Site mapped: ${siteMap.keyAreas.length} key areas found.`);
      
      const strategy = await this.planAuditStrategy(siteMap, log, aiConfig);
      if (this.checkStop()) return;

      if (strategy && strategy.priorityUrls.length > 0) {
        log(`[Orchestrator] Strategy generated. Prioritizing ${strategy.priorityUrls.length} key paths.`);
        crawler.addDiscoveredUrls(strategy.priorityUrls);
      }
    }

    await this.waitForPause();
    if (this.checkStop()) return;

    // Phase 18: Execute Macro / Suggested Flow
    const activeMacro = macros?.find(m => m.is_active);
    if (activeMacro) {
      log(`[Orchestrator] Executing macro: ${activeMacro.name}`);
      await this.executeMacro(activeMacro.steps, controller, log);
    } else {
      log(`[Orchestrator] No macro found. Attempting LLM flow discovery...`);
      await this.discoverAndExecuteFlow(controller, log, aiConfig);
    }
    
    if (this.checkStop()) return;
    await this.executePlan(crawler, log, aiConfig, userPrompt, onResult, onScreenshot, onReport, credentials);
  }

  private checkStop(): boolean {
    if (this.isStopped) {
      console.log(`[Orchestrator] Stop signal received. Aborting.`);
      return true;
    }
    return false;
  }

  private async waitForPause() {
    while (this.isPaused && !this.isStopped) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  async handleUserMessage(message: string): Promise<string> {
    console.log(`[Orchestrator] Handling user message: ${message}`);
    
    // Basic Command Detection
    const msg = message.toLowerCase();
    if (msg.includes('pause')) {
      this.isPaused = true;
      return "I have paused the execution.";
    }
    if (msg.includes('resume')) {
      this.isPaused = false;
      return "Resuming execution.";
    }
    if (msg.includes('skip')) {
      this.shouldSkip = true;
      return "Skipping current page.";
    }

    // Otherwise, add to instruction memory for the LLM to consider
    await this.memory.addEntry('instruction', message);
    this.instructionQueue.push(message);
    return `Understood. I'll focus on: ${message}`;
  }

  private async executeMacro(steps: any[], controller: PageController, log: (msg: string) => void) {
    for (const step of steps) {
      log(`[Orchestrator] Executing macro step: ${step.action} on ${step.selector}`);
      try {
        if (step.action === 'click') {
          await controller.click(step.selector);
        } else if (step.action === 'type') {
          await controller.type(step.selector, step.value);
        } else if (step.action === 'navigate') {
          await controller.navigate(step.value);
        }
      } catch (e) {
        log(`[Orchestrator] Macro step failed: ${step.action} -> ${step.selector}`);
      }
    }
  }

  private async discoverAndExecuteFlow(controller: PageController, log: (msg: string) => void, config?: ProviderConfig) {
    if (!config) return;
    const dom = await controller.evaluate(() => document.body.innerHTML.substring(0, 10000));
    const prompt = `
      You are an expert site tester. Based on the following HTML snippet of the home page, 
      suggest a "Standard User Flow" to verify the site's primary functionality.
      Return a JSON array of steps: { action: 'click'|'type'|'navigate', selector: '...', value: '...' }.
      Limit to 3 critical steps.
      
      HTML:
      ${dom}
    `;

    try {
      const resp = await this.decisionEngine.router.chat([
        { role: 'system', content: 'You suggest testing flows. Respond ONLY with valid JSON array.' },
        { role: 'user', content: prompt }
      ], config);
      const steps = JSON.parse(resp.content.replace(/```json|```/g, '').trim());
      log(`[Orchestrator] LLM suggested ${steps.length} steps. Executing...`);
      await this.executeMacro(steps, controller, log);
    } catch (e) {
      log(`[Orchestrator] Flow discovery failed or suggested no steps.`);
    }
  }

  private async planAuditStrategy(siteMap: any, log: (msg: string) => void, config?: ProviderConfig) {
    if (!config) return null;
    
    const prompt = `
      You are an expert lead test engineer. I have mapped a website's structure:
      Title: ${siteMap.title}
      Description: ${siteMap.description}
      Key Areas found: ${JSON.stringify(siteMap.keyAreas)}
      
      Based on this, suggest a prioritized audit strategy. 
      Identify up to 5 URLs that are most critical to test (e.g. login, shop, checkout, search, docs).
      Return ONLY a JSON object: { "priorityUrls": ["...", "..."], "justification": "..." }
    `;

    try {
      const resp = await this.decisionEngine.router.chat([
        { role: 'system', content: 'You are a strategic test planner. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt }
      ], config);
      
      return JSON.parse(resp.content.replace(/```json|```/g, '').trim());
    } catch (e) {
      log(`[Orchestrator] Strategy planning failed: ${e}`);
      return null;
    }
  }

  private async executePlan(
    crawler: CrawlerAgent, 
    log: (msg: string) => void, 
    config?: ProviderConfig,
    userPrompt: string = '',
    onResult?: (res: any) => void,
    onScreenshot?: (path: string) => void,
    onReport?: (path: string) => void,
    credentials?: any[]
  ) {
    if (!this.currentPlan) return;
    
    log(`[Orchestrator] Executing plan with parallel workers...`);
    this.currentPlan.status = 'EXECUTING';
    
    // Collect unique PENDING URLs from crawler to start with
    const initialUrls: string[] = [];
    let url = await crawler.getNextUrl();
    while(url) {
      initialUrls.push(url);
      // Mark as VISITING so getNextUrl doesn't return it again in this loop
      const item = (crawler as any).queue.find((q: any) => q.url === url);
      if (item) item.status = 'VISITING';
      url = await crawler.getNextUrl();
    }

    if (initialUrls.length === 0) {
      log(`[Orchestrator] No URLs discovered to audit.`);
      this.currentPlan.status = 'COMPLETED';
      return;
    }

    log(`[Orchestrator] Dispatching ${initialUrls.length} URLs to WorkerPool (concurrency: ${this.maxConcurrency})`);
    
    this.workerPool = new WorkerPool(this.maxConcurrency);
    await this.workerPool.run(
      initialUrls,
      this.playwright,
      this.decisionEngine.router,
      config!,
      credentials,
      async (res: WorkerResult) => {
        if (this.isStopped) return; // Ignore results if stopped
        
        await this.memory.addEntry('page_visited', res.url);
        
        // Notify UI of new result (issue count, etc.)
        if (onResult) onResult(res);

        if (res.metrics) {
          this.pageMetrics.push({ ...res.metrics, url: res.url });
        }

        if (res.issues.length > 0) {
          log(`[Orchestrator] Worker reported ${res.issues.length} issues for ${res.url}`);
          for (const iss of res.issues) {
            await this.memory.addEntry('issue_detected', iss);
            this.issues.push(iss);
          }
        }
        // Update crawler status in internal queue if possible
        const item = (crawler as any).queue.find((q: any) => q.url === res.url);
        if (item) item.status = res.success ? 'VISITED' : 'FAILED';
      },
      onScreenshot
    );
    
    this.currentPlan.status = this.isStopped ? 'FAILED' : 'COMPLETED';
    log(`[Orchestrator] Task ${this.isStopped ? 'stopped' : 'finished'}.`);
    
    // Generate Report
    try {
      log(`[Orchestrator] Generating final report...`);
      const reportData: ReportData = {
        runId: Math.random().toString(36).substring(7),
        baseUrl: crawler.startUrl,
        totalIssues: this.issues.length,
        issues: this.issues,
        startTime: Date.now() - 3600000, 
        endTime: Date.now(),
        metrics: {},
        pageMetrics: this.pageMetrics
      };
      
      const reportPath = await this.reportBuilder.generateExcel(reportData);
      log(`[Orchestrator] Excel report generated: ${reportPath}`);
      if (onReport) onReport(reportPath);
    } catch (reportError) {
      log(`[Orchestrator] Error generating report: ${reportError}`);
    }

    await this.playwright.close();
  }

  async pauseTask() {
    this.isPaused = true;
    if (this.workerPool) this.workerPool.pause();
    console.log(`[Orchestrator] Task paused.`);
  }

  async resumeTask() {
    this.isPaused = false;
    if (this.workerPool) this.workerPool.resume();
    console.log(`[Orchestrator] Task resumed.`);
  }

  async stopTask() {
    this.isStopped = true;
    this.isPaused = false;
    if (this.workerPool) this.workerPool.stop();
    console.log(`[Orchestrator] Task stopped.`);
  }

  private async executeAPIAudit(
    specUrl: string, 
    log: (msg: string) => void, 
    config?: ProviderConfig,
    credentials?: any[],
    onResult?: (res: any) => void,
    onReport?: (path: string) => void
  ) {
    const apiDiscovery = new APIDiscoveryAgent();
    const apiWorker = new APIWorker();
    const apiContext: Record<string, any> = {};
    
    try {
      const spec = await apiDiscovery.discover(specUrl);
      log(`[Orchestrator] API Discovered: ${spec.title} v${spec.version}`);
      
      const strategy = await this.planAPIStrategy(spec, log, config);
      const endpointsToTest = strategy ? strategy.priorityPaths : spec.endpoints.slice(0, 10);
      
      log(`[Orchestrator] Planned audit for ${endpointsToTest.length} endpoints.`);
      
      for (const endpoint of endpointsToTest) {
        if (this.isStopped) break;
        await this.waitForPause();
        
        const result = await apiWorker.auditEndpoint(spec.baseUrl, endpoint, credentials, apiContext);
        if (onResult) onResult({
          url: `${endpoint.method} ${endpoint.path}`,
          success: result.success,
          issues: result.issues,
          metrics: { loadTime: result.duration }
        });
        
        if (result.issues.length > 0) {
          log(`[Orchestrator] API Issue found on ${endpoint.method} ${endpoint.path}: ${result.issues[0].description}`);
          this.issues.push(...result.issues);
        }
      }
      
      this.currentPlan!.status = 'COMPLETED';
      log(`[Orchestrator] API Audit finished.`);
      
      // Generate Report
      const reportData: ReportData = {
        runId: Math.random().toString(36).substring(7),
        baseUrl: spec.baseUrl,
        totalIssues: this.issues.length,
        issues: this.issues,
        startTime: Date.now() - 3600000, 
        endTime: Date.now(),
        metrics: {},
        pageMetrics: [] // Could add API metrics here
      };
      
      const reportPath = await this.reportBuilder.generateExcel(reportData);
      if (onReport) onReport(reportPath);
      
    } catch (e) {
      log(`[Orchestrator] API Audit failed: ${e}`);
      this.currentPlan!.status = 'FAILED';
    } finally {
      await this.playwright.close();
    }
  }

  private async planAPIStrategy(spec: any, log: (msg: string) => void, config?: ProviderConfig) {
    if (!config) return null;
    const prompt = `
      You are an expert API quality engineer. I have these endpoints:
      ${JSON.stringify(spec.endpoints.map((e: any) => ({ path: e.path, method: e.method })))}
      
      Suggest a strategy to test this API. 
      CRITICAL: Identify "producer" endpoints (e.g. POST /users, POST /orders) that generate IDs (id, userId, etc.) 
      Place them at the BEGINNING of the list so they can provide data for subsequent GET/PUT/DELETE requests that use those IDs in placeholders like {id}.
      
      Return ONLY a JSON object: { "priorityPaths": [{ "path": "...", "method": "..." }], "justification": "..." }
    `;

    try {
      const resp = await this.decisionEngine.router.chat([
        { role: 'system', content: 'You are a strategic API tester. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt }
      ], config);
      return JSON.parse(resp.content.replace(/```json|```/g, '').trim());
    } catch (e) {
      log(`[Orchestrator] API Strategy planning failed: ${e}`);
      return null;
    }
  }

  private resetState() {
    this.issues = [];
    this.pageMetrics = [];
    this.instructionQueue = [];
    this.isPaused = false;
    this.isStopped = false;
    this.shouldSkip = false;
    this.workerPool = null;
    this.memory.clearInstructions();
    console.log(`[Orchestrator] Internal state reset.`);
  }
}
