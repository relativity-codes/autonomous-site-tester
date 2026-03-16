import { ModelRouter, ProviderConfig } from '../../../agent-runtime/decision/src/index';

export interface UXIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export class UXAgent {
  async analyzeUsability(dom: string, router: ModelRouter, config: ProviderConfig): Promise<UXIssue[]> {
    console.log(`[UXAgent] Analyzing usability for DOM snippet...`);
    
    const prompt = `
      You are a specialized UX Audit Agent. Analyze the following HTML snippet for usability issues.
      Focus on:
      1. Action Clarity (Are buttons/links descriptive?)
      2. Content Hierarchy (Is the page flow logical?)
      3. Mobile Friendliness (Are tap targets too small?)
      4. General UX Best Practices.

      HTML:
      ${dom}

      Return a JSON array of issues with the following structure:
      {
        "issues": [
          {
            "type": "Clarity",
            "severity": "medium",
            "description": "Button labeled 'Click Here' is non-descriptive.",
            "recommendation": "Use action-oriented labels like 'Submit Order' or 'Learn More'."
          }
        ]
      }
    `;

    try {
      const response = await router.chat([{ role: 'user', content: prompt }], config, config.provider || 'openai');
      const data = JSON.parse(response.content);
      return data.issues || [];
    } catch (err) {
      console.error(`[UXAgent] Error during analysis:`, err);
      return [];
    }
  }
}
