import { execSync } from 'child_process';

export class MouseController {
  async moveTo(x: number, y: number): Promise<void> {
    const platform = process.platform;
    console.log(`[MouseController] Moving mouse to (${x}, ${y}) on ${platform}`);
    
    try {
      if (platform === 'darwin') {
        // Darwin move-only is tricky with osascript, often combined with click.
      } else if (platform === 'win32') {
        execSync(`powershell -Command "[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})"`);
      } else if (platform === 'linux') {
        execSync(`xdotool mousemove ${x} ${y}`);
      }
    } catch (error) {
      console.error('[MouseController] Move failed:', error);
    }
  }

  async click(x?: number, y?: number): Promise<void> {
    const platform = process.platform;
    console.log(`[MouseController] Clicking mouse on ${platform}${x !== undefined ? ` at (${x}, ${y})` : ''}`);
    
    try {
      if (platform === 'darwin') {
        const script = x !== undefined && y !== undefined 
          ? `tell application "System Events" to click at {${x}, ${y}}`
          : `tell application "System Events" to click`;
        execSync(`osascript -e '${script}'`);
      } else if (platform === 'win32') {
        if (x !== undefined && y !== undefined) {
          await this.moveTo(x, y);
        }
        // PowerShell script to perform a mouse click via User32.dll
        const psCommand = `
          $signature = '[DllImport("user32.dll")] public static extern void mouse_event(int flags, int dx, int dy, int cButtons, int dwExtraInfo);';
          $type = Add-Type -MemberDefinition $signature -Name "Win32MouseEvent" -Namespace "Win32Functions" -PassThru;
          $type::mouse_event(0x0002, 0, 0, 0, 0); # Left down
          $type::mouse_event(0x0004, 0, 0, 0, 0); # Left up
        `.replace(/\n/g, ' ');
        execSync(`powershell -Command "${psCommand}"`);
      } else if (platform === 'linux') {
        if (x !== undefined && y !== undefined) {
          execSync(`xdotool mousemove ${x} ${y} click 1`);
        } else {
          execSync(`xdotool click 1`);
        }
      }
    } catch (error) {
      console.error('[MouseController] Click failed:', error);
    }
  }
  
  async scroll(amount: number): Promise<void> {
    const platform = process.platform;
    console.log(`[MouseController] Scrolling ${amount} units on ${platform}`);
    
    try {
      if (platform === 'darwin') {
        const keyCode = amount > 0 ? 121 : 116;
        const repeats = Math.max(1, Math.abs(Math.floor(amount / 100)));
        for(let i = 0; i < repeats; i++) {
          execSync(`osascript -e 'tell application "System Events" to key code ${keyCode}'`);
        }
      } else if (platform === 'win32') {
        // Simple scroll via SendKeys in PowerShell (PageUp/PageDown)
        const key = amount > 0 ? '{PGDN}' : '{PGUP}';
        execSync(`powershell -Command "[System.Windows.Forms.SendKeys]::SendWait('${key}')"`);
      } else if (platform === 'linux') {
        const button = amount > 0 ? 5 : 4; // 4 is scroll up, 5 is scroll down
        execSync(`xdotool click ${button}`);
      }
    } catch (error) {
      console.error('[MouseController] Scroll failed:', error);
    }
  }
}
