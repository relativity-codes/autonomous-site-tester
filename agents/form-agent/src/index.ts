import { ModelRouter, ProviderConfig } from '../../../agent-runtime/decision/src/index';

export class FormAgent {
  async analyzeForm(
    domSnippet: string, 
    router: ModelRouter, 
    config: ProviderConfig,
    credentialsHint?: string
  ): Promise<any> {
    console.log(`[FormAgent] Analyzing form DOM snippet...`);
    
    const prompt = `
      Analyze the following HTML form snippet and determine how to fill it.
      Return a JSON object with two properties:
      1. 'inputsToFill': An array of objects with { selector, value, action: 'type' }.
      2. 'submitAction': An object with { selector, action: 'click' }.
      
      ${credentialsHint ? `IMPORTANT: ${credentialsHint}. Use these exact values for the relevant fields.` : "Suggest realistic test data for the values (e.g., test@example.com for email)."}
      
      HTML Snippet:
      ${domSnippet}
    `;

    try {
      const response = await router.chat([
        { role: 'system', content: 'You are a form analysis assistant. Respond ONLY with valid JSON.' },
        { role: 'user', content: prompt }
      ], config);

      const cleanedResponse = response.content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('[FormAgent] Analysis failed:', error);
      return { inputsToFill: [], submitAction: null };
    }
  }
}
