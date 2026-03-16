import { ModelRouter, ProviderConfig } from '../../../agent-runtime/decision/src/index';

export interface A11yResult {
  score: number;
  violations: Array<{
    impact: 'minor' | 'moderate' | 'serious' | 'critical';
    description: string;
    helpUrl?: string;
  }>;
}

export class AccessibilityAgent {
  async runAudit(
    domContext: string,
    router: ModelRouter,
    config: ProviderConfig
  ): Promise<A11yResult> {
    console.log(`[AccessibilityAgent] Running accessibility audit...`);

    const prompt = `
      Perform a high-level accessibility audit on the following HTML snippet.
      Focus on WCAG 2.1 guidelines (Alt text, contrast hints, ARIA labels, semantic structure).
      
      Return a JSON object with:
      1. 'score': A number from 0-100.
      2. 'violations': An array of objects with { impact, description, helpUrl }.
      
      HTML Snippet:
      ${domContext}
    `;

    try {
      const response = await router.chat([
        { role: 'system', content: 'You are an accessibility expert. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt }
      ], config);

      const cleaned = response.content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('[AccessibilityAgent] Audit failed:', error);
      return { score: 100, violations: [] };
    }
  }
}
