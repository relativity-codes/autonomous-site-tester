export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }
}

export interface ProviderConfig {
  provider: string; // Add this
  apiKey: string;
  modelName: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMProvider {
  chat(messages: Message[], config: ProviderConfig): Promise<LLMResponse>;
}

import { OpenAIProvider } from './providers/openai';
import { PromptManager } from './prompt-manager';

export class ModelRouter {
  private providers: Record<string, LLMProvider> = {};

  constructor() {
    this.providers['openai'] = new OpenAIProvider();
    this.providers['custom'] = new OpenAIProvider(); 
  }
  
  async chat(messages: Message[], config: ProviderConfig, providerType: string = 'openai'): Promise<LLMResponse> {
    console.log(`[ModelRouter] Routing to ${providerType} with model: ${config.modelName}`);
    const provider = this.providers[providerType.toLowerCase()];
    if (!provider) throw new Error(`Unsupported provider: ${providerType}`);
    return provider.chat(messages, config);
  }
}

export class DecisionEngine {
  private promptManager: PromptManager;
  public router: ModelRouter;

  constructor() {
    this.promptManager = new PromptManager();
    this.router = new ModelRouter();
  }

  async suggestAction(
    reasoningContext: string, 
    context: Record<string, any>, 
    config: ProviderConfig,
    customPrompt: string = '',
    provider: string = 'openai'
  ): Promise<string> {
    const messages = this.promptManager.buildPrompt(customPrompt, { ...context, reasoningGoal: reasoningContext });
    const response = await this.router.chat(messages, config, provider);
    return response.content;
  }
}


