import { execSync } from 'child_process';

export class KeyboardController {
  async type(text: string): Promise<void> {
    const platform = process.platform;
    console.log(`[KeyboardController] Typing: ${text} on ${platform}`);
    
    try {
      if (platform === 'darwin') {
        const escapedText = text.replace(/'/g, "'\"'\"'");
        execSync(`osascript -e 'tell application "System Events" to keystroke "${escapedText}"'`);
      } else if (platform === 'win32') {
        // PowerShell SendKeys
        const escapedText = text.replace(/'/g, "''"); // Basic escaping
        execSync(`powershell -Command "[System.Windows.Forms.SendKeys]::SendWait('${escapedText}')"`);
      } else if (platform === 'linux') {
        execSync(`xdotool type "${text}"`);
      }
    } catch (error) {
      console.error('[KeyboardController] Typing failed:', error);
    }
  }

  async press(key: string): Promise<void> {
    const platform = process.platform;
    console.log(`[KeyboardController] Pressing key: ${key} on ${platform}`);
    
    try {
      if (platform === 'darwin') {
        execSync(`osascript -e 'tell application "System Events" to keystroke "${key}"'`);
      } else if (platform === 'win32') {
        // Use PowerShell SendKeys for special keys like {ENTER}
        execSync(`powershell -Command "[System.Windows.Forms.SendKeys]::SendWait('${key}')"`);
      } else if (platform === 'linux') {
        execSync(`xdotool key "${key}"`);
      }
    } catch (error) {
      console.error('[KeyboardController] Key press failed:', error);
    }
  }
}
