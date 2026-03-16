export interface Config {
  modelProvider: string;
  modelName: string;
  apiKey?: string;
  maxWorkers: number;
}

export class ConfigManager {
  private config: Config = {
    modelProvider: 'openai',
    modelName: 'gpt-4o',
    maxWorkers: 3
  };

  get(): Config {
    return this.config;
  }

  update(newConfig: Partial<Config>) {
    this.config = { ...this.config, ...newConfig };
  }
}
