import { Orchestrator } from '../agent-runtime/orchestrator/src/index';
import { ProviderConfig } from '../agent-runtime/decision/src/index';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

async function runIntegrationTest() {
  console.log('🚀 Starting System Integration Test...');

  const orchestrator = new Orchestrator();

  // Mock LLM Provider to avoid 401 errors and verify logic locally
  const mockProvider = {
    chat: async (messages: any[]) => {
      const userMsg = messages[messages.length - 1].content;
      console.log(`[MOCK LLM] Received prompt length: ${userMsg.length}`);
      
      let content = 'I suggest we explore example.com further.';
      
      if (userMsg.includes('Perform a high-level accessibility audit')) {
        content = JSON.stringify({
          score: 85,
          violations: [{ impact: 'moderate', description: 'Alt text missing on images' }]
        });
      } else if (userMsg.includes('Analyze the following HTML form snippet')) {
        content = JSON.stringify({
          inputsToFill: [{ selector: '#name', value: 'Test User', action: 'type' }],
          submitAction: { selector: 'button', action: 'click' }
        });
      } else if (userMsg.includes('Analyze this screenshot for visual bugs')) {
        content = JSON.stringify({
          hasAnomalies: false,
          issues: [],
          layoutMatchesExpected: true
        });
      }

      return { content };
    }
  };

  // Inject mock into private providers map
  (orchestrator as any).decisionEngine.router.providers['openai'] = mockProvider;

  const aiConfig: ProviderConfig = {
    provider: 'openai',
    modelName: 'gpt-4o',
    apiKey: 'mock-key',
    temperature: 0.2,
    maxTokens: 4096
  };

  const goal = 'Crawl https://example.com and check for accessibility issues and forms.';
  
  try {
    await orchestrator.startTask(goal, {
      aiConfig,
      browserOptions: {
        headed: false,
        slowMo: 0
      },
      onLog: (msg) => console.log(`[LOG] ${msg}`)
    });

    console.log('✅ Task completed successfully!');
    
    // Check if report was generated (we might need to mock the downloads path or check orchestrator logs)
    // Orchestrator logs the path to the report.
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runIntegrationTest();
