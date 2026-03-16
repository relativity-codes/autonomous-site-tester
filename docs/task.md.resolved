# Autonomous Site Tester Roadmap

## Phase 1: Foundation & AI Routing
- [x] Mono-repo setup (npm workspaces)
- [x] Electron App Bootstrap (Vite + React + TS)
- [x] IPC Bridge architecture
- [x] AI Model Router (OpenAI Adapter)
- [x] Prompt Manager (Layering: Base + User + Context)
- [x] Decision Engine Integration

## Phase 2: Security & Persistence
- [x] SQLite Schema for Runs/Pages
- [x] Basic AI Configuration Persistence
- [x] AES Encryption for API Keys
- [x] OS Keychain Integration

## Phase 11: Dashboard Data Flow Fixes
- [x] **Resolve URL parsing issue (defaulting to example.com)**
- [x] **Reset Orchestrator state between runs**
- [x] **Restrict CrawlerAgent to primary host**

## Phase 12: Memory & Context System
- [x] **Implement ContextMemory for crawl history**
- [x] **Store/retrieve issues and page visits**

## Phase 13: Parallel Worker System
- [x] **Implement TestWorker class**
- [x] **Implement WorkerPool for concurrent execution**

## Phase 14: Advanced Agents (UX & Performance)
- [x] **Implement UXAgent for usability heuristics**
- [x] **Implement PerformanceAgent for web vitals analysis**

## Phase 15: Computer-Control Integration
- [x] **Integrate InteractionLoop into Orchestrator/Workers**
- [x] **Enable "Self-Healing" via Vision element detection**

## Phase 16: UI Dashboard Enhancements
- [x] **Add Screenshots Gallery**
- [x] **Add Performance Charts**

## Phase 17: Credential Management
- [x] **Implement encrypted credentials table in SQLite**
- [x] **Create UI for managing site-specific credentials**
- [x] **Inject credentials into FormAgent and InteractionLoop**

## Phase 18: Flow Recording & Macros
- [x] **Implement `macros` table in SQLite**
- [x] **Create UI for recording/defining flows (Steps: Selector + Action)**
- [x] **Implement LLM-driven "suggested flow" generation if none provided**
- [x] **Execute Macro sequence in Orchestrator before autonomous crawl**

## Phase 20: Site Understanding & Strategic Planning
- [x] **Implement [SiteDiscoveryAgent](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/agents/discovery-agent/src/index.ts#12-64) for structural mapping**
- [x] **Generate "Audit Strategy" (JSON) via LLM after discovery**
- [x] **Update Orchestrator to prioritize URLs based on Strategy**
- [x] **Add "Single Page Mode" toggle to UI**

## Phase 21: Test Execution Controls
- [x] **Implement [pauseTask](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/agent-runtime/orchestrator/src/index.ts#347-352), [resumeTask](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/agent-runtime/orchestrator/src/index.ts#353-358), and [stopTask](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/agent-runtime/orchestrator/src/index.ts#359-365) in Orchestrator**
- [x] **Create main process IPC handlers for test controls**
- [x] **Update Dashboard UI with Pause/Continue and Stop buttons**
- [x] **Manage state to disable/enable controls based on test status**

## Phase 22: Core Web Vitals & Waterfall Insights
- [x] **Enhance [PerformanceAgent](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/agents/performance-agent/src/index.ts#20-68) to capture LCP, FID, CLS**
- [x] **Collect resource waterfall data (time, size, type)**
- [x] **Update [ExcelExporter](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/report-engine/export/src/index.ts#21-116) to include Web Vitals and Waterfall tabs**
- [x] **Visualize Waterfall insights in Dashboard UI**

## Phase 23: Autonomous API Auditing (Swagger/OpenAPI)
- [x] **Create [APIDiscoveryAgent](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/agents/api-discovery-agent/src/index.ts#17-75) to parse Swagger/OpenAPI docs**
- [x] **Integrate API Strategic Planning into Orchestrator**
- [x] **Implement [APIWorker](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/worker-system/api-worker/src/index.ts#11-141) for automated HTTP auditing**
- [x] **Handle API Auth (Bearer, API Keys) via Credentials store**
- [x] **Add API Test Results to Excel and Dashboard**

## Phase 24: Stateful API Context & Variable Injection
- [x] **Implement `APIContext` store for caching response variables**
- [x] **Add variable extraction logic to [APIWorker](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/worker-system/api-worker/src/index.ts#11-141)**
- [x] **Implement dynamic placeholder substitution in [APIWorker](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/worker-system/api-worker/src/index.ts#11-141) (e.g., /users/{id})**
- [x] **Use LLM to identify "dependent" endpoints and required variables**

## Phase 25: Selective Data Clearing
- [x] **Implement [clearHistoricalData](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/data-layer/database/src/index.ts#290-305) in [DBManager](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/data-layer/database/src/index.ts#8-310)**
- [x] **Implement [clearAllArtifacts](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/artifact-storage/src/index.ts#27-40) in [ArtifactManager](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/artifact-storage/src/index.ts#4-41)**
- [x] **Create `clear-data` IPC handler in main process**
- [x] **Add "Clear All Data" button to Dashboard UI**

## Phase 26: Dark Mode Suite
- [x] **Configure Tailwind for class-based dark mode**
- [x] **Implement [ThemeContext](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/apps/desktop/src/context/ThemeContext.tsx#5-9) & Toggle in [AppLayout](file:///Users/macbookpro2015/Documents/elwalkre/autonomous-site-tester-0/apps/desktop/src/components/layout/AppLayout.tsx#15-98)**
- [x] **Apply `dark:` variants to Dashboard & Sidebar**
- [x] **Apply `dark:` variants to Credentials & Macros pages**
- [x] **Apply `dark:` variants to Settings & Chat pages**
- [x] **Enhance Dashboard: Add icon to "Pages Audited" stat card**

## Phase 19: Enterprise Scaling (Future)
- [ ] **Visual Regression Testing (Pixel-Diffing)**
- [ ] **CI/CD CLI & Scheduling**
- [ ] **Multi-Viewport & Responsive Audits**
- [ ] **Third-Party Integrations (Slack/GitHub)**
- [ ] **Core Web Vitals Waterfall Insights**

## Phase 3: Specialized Testing Agents
- [x] Crawler Agent (Link Extraction)
- [x] **Vision Agent (Screenshot Analysis)**
- [x] **Accessibility Agent (Axe-core)**
- [x] **Form Agent (Auto-fill & Logic)**

## Phase 9: System Integration Testing
- [x] **CLI Test utility: Full flow verification**

## Current Status
- **Success**: All production-grade phases (11-16) completed.
- **Features**: Parallel Workers, Agent Memory, UX/Perf Agents, and Self-Healing integrated.
- **Goal**: Application now meets the full vision of the "Production-Grade" brief.
