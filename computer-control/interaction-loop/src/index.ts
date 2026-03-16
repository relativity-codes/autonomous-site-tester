import { ScreenCapture } from '../../screen-capture/src/index';
import { VisionDetection } from '../../vision-detection/src/index';
import { MouseController } from '../../mouse-controller/src/index';
import { KeyboardController } from '../../keyboard-controller/src/index';
import { ModelRouter, ProviderConfig } from '../../../agent-runtime/decision/src/index';

export class InteractionLoop {
  constructor(
    private screen: ScreenCapture,
    private vision: VisionDetection,
    private mouse: MouseController,
    private keyboard: KeyboardController
  ) {}

  async interactWithElement(
    description: string, 
    action: 'click' | 'type', 
    router: ModelRouter,
    config: ProviderConfig,
    text?: string
  ): Promise<boolean> {
    console.log(`[InteractionLoop] Starting interaction for: ${description}`);
    
    const screenshot = await this.screen.capture();
    const coords = await this.vision.findElementCoordinates(screenshot, description, router, config);
    
    if (!coords) {
      console.error(`[InteractionLoop] Could not find element: ${description}`);
      return false;
    }
    
    if (action === 'click') {
      await this.mouse.click(coords.x, coords.y);
    } else if (action === 'type' && text) {
      await this.mouse.click(coords.x, coords.y);
      await this.keyboard.type(text);
    }
    
    return true;
  }
}
