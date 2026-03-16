import { ModelRouter, ProviderConfig, Message } from '../../../agent-runtime/decision/src/index';

export class VisionDetection {
  async findElementCoordinates(
    screenshotBase64: string, 
    elementDescription: string,
    router: ModelRouter,
    config: ProviderConfig
  ): Promise<{x: number, y: number} | null> {
    console.log(`[VisionDetection] Analyzing screen for: ${elementDescription}`);
    
    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a computer vision assistant. Given a screenshot and a description of an element, you must return the center X and Y coordinates of that element. 
        Your output must be ONLY a JSON object like {"x": 100, "y": 200}. 
        Coordinates are in pixels, starting from top-left (0,0).`
      },
      {
        role: 'user',
        content: JSON.stringify([
          { type: 'text', text: `Find the coordinates for: ${elementDescription}` },
          { 
            type: 'image_url', 
            image_url: { url: `data:image/png;base64,${screenshotBase64}` } 
          }
        ])
      }
    ];

    try {
      const response = await router.chat(messages, config);
      const match = response.content.match(/\{.*?\}/);
      if (match) {
        const coords = JSON.parse(match[0]);
        if (typeof coords.x === 'number' && typeof coords.y === 'number') {
          return { x: coords.x, y: coords.y };
        }
      }
      console.error('[VisionDetection] AI response did not contain valid coordinates:', response.content);
      return null;
    } catch (error) {
      console.error('[VisionDetection] AI detection failed:', error);
      return null;
    }
  }
}
