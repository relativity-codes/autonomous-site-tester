import OpenAI from 'openai';
import { LLMProvider, Message, LLMResponse, ProviderConfig } from '../index';

export class OpenAIProvider implements LLMProvider {
  async chat(messages: Message[], config: ProviderConfig): Promise<LLMResponse> {
    const openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl, // Defaults to OpenAI if undefined
    });

    const response = await openai.chat.completions.create({
      model: config.modelName,
      messages: messages as any, // Cast for simplicity, roles match
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens,
    });

    return {
      content: response.choices[0].message.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      }
    };
  }
}
