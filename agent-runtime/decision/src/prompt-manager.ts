import { Message } from './index';

export class PromptManager {
  private basePrompt: string = `You are an autonomous website QA testing agent.
You test websites visually and functionally.`;
  
  private frameworkInstructions: string = `CRITICAL GUIDELINES:
1. Always verify page loads and network stability.
2. Report visual regressions (layout shifts, broken images).
3. test form inputs with edge cases (valid/invalid).
4. Do NOT attempt to access the local filesystem or network credentials.
5. If a selector fails, try to find the element visually before reporting a bug.`;

  buildPrompt(userInstructions: string = '', context: Record<string, any> = {}): Message[] {
    const contextLines = Object.entries(context)
      .map(([key, value]) => `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join('\n');

    const systemContent = `
=== BASE SYSTEM PROMPT ===
${this.basePrompt}

=== TESTING FRAMEWORK CONSTRAINTS ===
${this.frameworkInstructions}

=== USER-SPECIFIC INSTRUCTIONS ===
${userInstructions || 'Focus on general stability and usability.'}

=== RUNTIME CONTEXT ===
${contextLines || 'No specific context provided.'}
`.trim();

    return [
      { role: 'system', content: systemContent }
    ];
  }
}
