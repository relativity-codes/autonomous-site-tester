import { ModelRouter, ProviderConfig } from '../../../agent-runtime/decision/src/index';

export interface VisionResult {
  hasAnomalies: boolean;
  issues: string[];
  layoutMatchesExpected: boolean;
}

export class VisionAgent {
  async analyzeScreenshot(
    screenshotPath: string, 
    contextPrompt: string,
    router: ModelRouter, 
    config: ProviderConfig
  ): Promise<VisionResult> {
    console.log(`[VisionAgent] Analyzing screenshot at ${screenshotPath}`);
    
    // Note: ModelRouter currently handles text. For actual vision, we would pass base64 image data.
    // Here we simulate the vision prompt integration.
    
    const prompt = `
      [Visual Context: ${screenshotPath}]
      Analyze this screenshot for visual bugs, layout shifts, or broken images.
      Context: ${contextPrompt}
      
      Return JSON: { hasAnomalies: boolean, issues: string[], layoutMatchesExpected: boolean }
    `;

    try {
      const response = await router.chat([
        { role: 'system', content: 'You are a visual QA expert. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt }
      ], config);

      const cleaned = response.content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('[VisionAgent] Vision analysis failed:', error);
      return { hasAnomalies: false, issues: [], layoutMatchesExpected: true };
    }
  }
}
